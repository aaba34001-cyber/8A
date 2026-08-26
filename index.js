require("dotenv").config();

const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

const OWNER_ID = Number(process.env.OWNER_ID || 8480297110);

// ============================
// YORDAMCHI FUNKSIYALAR
// ============================

function isGroup(ctx) {
  return (
    ctx.chat &&
    (ctx.chat.type === "group" || ctx.chat.type === "supergroup")
  );
}

async function isAdmin(ctx) {
  if (!ctx.from) return false;

  // Bot egasi
  if (Number(ctx.from.id) === OWNER_ID) {
    return true;
  }

  if (!isGroup(ctx)) {
    return false;
  }

  try {
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);

    return admins.some(
      admin => Number(admin.user.id) === Number(ctx.from.id)
    );
  } catch (error) {
    console.error("ADMIN CHECK ERROR:", error);
    return false;
  }
}

async function requireAdmin(ctx) {
  if (!(await isAdmin(ctx))) {
    await ctx.reply("⛔ Доступ запрещён. Только администраторы группы.");
    return false;
  }

  return true;
}

// ============================
// TOP 24 SOAT
// ============================

const messageStats = new Map();

bot.on("message", async (ctx, next) => {
  try {
    if (!ctx.from || ctx.from.is_bot) {
      return next();
    }

    if (!isGroup(ctx)) {
      return next();
    }

    const text =
      ctx.message?.text ||
      ctx.message?.caption ||
      "";

    // Buyruqlar TOP hisobiga kirmaydi
    const command = text.trim().toLowerCase();

    const commands = [
      "топ",
      "!топ",
      "инфо",
      "!инфо",
      "мойид",
      "!мойид",
      "помощь",
      "!помощь",
      "админы",
      "!админы",
      "панель",
      "!панель",
      "бан",
      "!бан",
      "мут",
      "!мут",
      "разбан",
      "!разбан",
      "кик",
      "!кик",
      "удалить",
      "!удалить",
      "старт",
      "!старт",
      "статистика",
      "!статистика"
    ];

    if (commands.includes(command)) {
      return next();
    }

    const now = Date.now();
    const limit = now - 24 * 60 * 60 * 1000;

    const chatId = ctx.chat.id;
    const userId = ctx.from.id;

    if (!messageStats.has(chatId)) {
      messageStats.set(chatId, new Map());
    }

    const chatStats = messageStats.get(chatId);

    if (!chatStats.has(userId)) {
      chatStats.set(userId, {
        times: [],
        username: ctx.from.username || null,
        name: ctx.from.first_name || "Пользователь"
      });
    }

    const user = chatStats.get(userId);

    user.times.push(now);

    user.times = user.times.filter(
      time => time >= limit
    );

    user.username =
      ctx.from.username || user.username;

    user.name =
      ctx.from.first_name || user.name;

  } catch (error) {
    console.error("STATS ERROR:", error);
  }

  return next();
});

// ============================
// СТАРТ
// Oddiy user ham ko'ra oladi
// ============================

bot.hears(/^!?старт$/i, async (ctx) => {
  await ctx.reply(
    "🔥 8-A ADMIN BOT 🔥\n\n" +
    "👤 Информационные команды:\n" +
    "топ — ТОП за 24 часа\n" +
    "инфо — информация о пользователе\n" +
    "мойид — ваш ID\n" +
    "статистика — статистика группы\n" +
    "помощь — список команд\n\n" +
    "👑 Команды администраторов:\n" +
    "бан — заблокировать\n" +
    "мут — ограничить сообщения\n" +
    "разбан — разблокировать\n" +
    "кик — удалить из группы\n" +
    "удалить — удалить сообщение\n" +
    "админы — список администраторов"
  );
});

// ============================
// ПОМОЩЬ
// Oddiy user
// ============================

bot.hears(/^!?помощь$/i, async (ctx) => {
  await ctx.reply(
    "📚 ДОСТУПНЫЕ КОМАНДЫ\n\n" +
    "👤 Для всех:\n" +
    "топ\n" +
    "инфо\n" +
    "мойид\n" +
    "статистика\n" +
    "помощь\n\n" +
    "👑 Для администраторов:\n" +
    "бан\n" +
    "мут\n" +
    "разбан\n" +
    "кик\n" +
    "удалить\n" +
    "админы\n" +
    "панель\n\n" +
    "ℹ️ Ответьте на сообщение пользователя для команд модерации."
  );
});

// ============================
// МОЙ ID
// Oddiy user
// ============================

bot.hears(/^!?мойид$/i, async (ctx) => {
  await ctx.reply(`🆔 Ваш ID: ${ctx.from.id}`);
});

// ============================
// TOP
// Oddiy user ham ishlata oladi
// ============================

bot.hears(/^!?топ$/i, async (ctx) => {
  if (!isGroup(ctx)) {
    return ctx.reply("❗ Команда работает только в группе.");
  }

  const chatStats = messageStats.get(ctx.chat.id);

  if (!chatStats || chatStats.size === 0) {
    return ctx.reply(
      "📊 За последние 24 часа сообщений пока нет."
    );
  }

  const now = Date.now();
  const limit = now - 24 * 60 * 60 * 1000;

  const top = [];

  for (const [userId, user] of chatStats) {
    user.times = user.times.filter(
      time => time >= limit
    );

    if (user.times.length > 0) {
      top.push({
        id: userId,
        count: user.times.length,
        username: user.username,
        name: user.name
      });
    }
  }

  top.sort((a, b) => b.count - a.count);

  if (top.length === 0) {
    return ctx.reply(
      "📊 За последние 24 часа сообщений пока нет."
    );
  }

  let text = "🏆 ТОП ЗА 24 ЧАСА\n\n";

  top.slice(0, 10).forEach((user, index) => {
    const name = user.username
      ? `@${user.username}`
      : user.name;

    text += `${index + 1}. ${name} — ${user.count} сообщений\n`;
  });

  await ctx.reply(text);
});

// ============================
// СТАТИСТИКА
// Oddiy user
// ============================

bot.hears(/^!?статистика$/i, async (ctx) => {
  if (!isGroup(ctx)) {
    return ctx.reply(
      "❗ Команда работает только в группе."
    );
  }

  const chatStats = messageStats.get(ctx.chat.id);

  if (!chatStats) {
    return ctx.reply(
      "📊 Пока статистики нет."
    );
  }

  let total = 0;

  const limit =
    Date.now() - 24 * 60 * 60 * 1000;

  for (const user of chatStats.values()) {
    user.times = user.times.filter(
      time => time >= limit
    );

    total += user.times.length;
  }

  await ctx.reply(
    "📊 СТАТИСТИКА ЗА 24 ЧАСА\n\n" +
    `💬 Сообщений: ${total}\n` +
    `👥 Активных пользователей: ${chatStats.size}`
  );
});

// ============================
// ИНФОРМАЦИЯ О USER
// Oddiy user
// Reply orqali
// ============================

bot.hears(/^!?инфо$/i, async (ctx) => {
  const target = ctx.message.reply_to_message?.from || ctx.from;

  if (!target) {
    return ctx.reply(
      "❗ Ответьте на сообщение пользователя и напишите инфо."
    );
  }

  await ctx.reply(
    "👤 ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ\n\n" +
    `🆔 ID: ${target.id}\n` +
    `👤 Имя: ${target.first_name || "Не указано"}\n` +
    `🔗 Username: ${
      target.username ? "@" + target.username : "Нет"
    }\n` +
    `🤖 Bot: ${target.is_bot ? "Да" : "Нет"}`
  );
});

// ============================
// АДМИНЫ
// FAQ / INFO - faqat admin
// ============================

bot.hears(/^!?админы$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;

  if (!isGroup(ctx)) {
    return ctx.reply(
      "❗ Эту команду нужно использовать в группе."
    );
  }

  try {
    const admins =
      await ctx.telegram.getChatAdministrators(
        ctx.chat.id
      );

    let text =
      "👑 АДМИНИСТРАТОРЫ ГРУППЫ\n\n";

    let number = 1;

    for (const admin of admins) {
      const user = admin.user;

      text += `${number}. ${
        user.first_name || "Пользователь"
      }`;

      if (user.username) {
        text += ` (@${user.username})`;
      }

      text += "\n";
      number++;
    }

    await ctx.reply(text);
  } catch (error) {
    console.error("ADMINS ERROR:", error);

    await ctx.reply(
      "❌ Не удалось получить список администраторов."
    );
  }
});

// ============================
// ПАНЕЛЬ
// Admin
// ============================

bot.hears(/^!?панель$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;

  await ctx.reply(
    "👑 ПАНЕЛЬ АДМИНИСТРАТОРА\n\n" +
    "🟢 Бот: ОНЛАЙН\n" +
    "🛡 Модерация: ВКЛ\n\n" +
    "бан — блокировка\n" +
    "мут — ограничение\n" +
    "разбан — разблокировка\n" +
    "кик — удалить из группы\n" +
    "удалить — удалить сообщение"
  );
});

// ============================
// БАН
// Faqat admin
// ============================

bot.hears(/^!?бан$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;

  if (!isGroup(ctx)) {
    return ctx.reply(
      "❗ Команда работает только в группе."
    );
  }

  const target = ctx.message.reply_to_message;

  if (!target?.from) {
    return ctx.reply(
      "❗ Ответьте на сообщение пользователя и напишите бан."
    );
  }

  const userId = Number(target.from.id);

  if (userId === OWNER_ID) {
    return ctx.reply(
      "❌ Владелец защищён от блокировки."
    );
  }

  try {
    const admins =
      await ctx.telegram.getChatAdministrators(
        ctx.chat.id
      );

    const targetIsAdmin = admins.some(
      admin =>
        Number(admin.user.id) === userId
    );

    if (targetIsAdmin) {
      return ctx.reply(
        "❌ Нельзя заблокировать администратора группы."
      );
    }

    await ctx.telegram.banChatMember(
      ctx.chat.id,
      userId
    );

    await ctx.reply(
      `🚫 ${
        target.from.first_name || "Пользователь"
      } заблокирован.`
    );
  } catch (error) {
    console.error("BAN ERROR:", error);

    await ctx.reply(
      "❌ Не удалось заблокировать пользователя.\n\n" +
      "Проверьте права бота."
    );
  }
});

// ============================
// МУТ 1 МИНУТА
// Faqat admin
// ============================

bot.hears(/^!?мут$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;

  if (!isGroup(ctx)) {
    return ctx.reply(
      "❗ Команда работает только в группе."
    );
  }

  const target = ctx.message.reply_to_message;

  if (!target?.from) {
    return ctx.reply(
      "❗ Ответьте на сообщение пользователя и напишите мут."
    );
  }

  const userId = Number(target.from.id);

  if (userId === OWNER_ID) {
    return ctx.reply(
      "❌ Владелец защищён от ограничений."
    );
  }

  try {
    const admins =
      await ctx.telegram.getChatAdministrators(
        ctx.chat.id
      );

    const targetIsAdmin = admins.some(
      admin =>
        Number(admin.user.id) === userId
    );

    if (targetIsAdmin) {
      return ctx.reply(
        "❌ Нельзя ограничить администратора группы."
      );
    }

    const until =
      Math.floor(Date.now() / 1000) + 60;

    await ctx.telegram.restrictChatMember(
      ctx.chat.id,
      userId,
      {
        permissions: {
          can_send_messages: false,
          can_send_audios: false,
          can_send_documents: false,
          can_send_photos: false,
          can_send_videos: false,
          can_send_video_notes: false,
          can_send_voice_notes: false,
          can_send_polls: false,
          can_send_other_messages: false,
          can_add_web_page_previews: false
        },
        until_date: until
      }
    );

    await ctx.reply(
      `🔇 ${
        target.from.first_name || "Пользователь"
      } получил мут на 1 минуту.`
    );
  } catch (error) {
    console.error("MUTE ERROR:", error);

    await ctx.reply(
      "❌ Не удалось выдать мут. Проверьте права бота."
    );
  }
});

// ============================
// РАЗБАН
// Faqat admin
// ============================

bot.hears(/^!?разбан$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;

  if (!isGroup(ctx)) {
    return ctx.reply(
      "❗ Команда работает только в группе."
    );
  }

  const target = ctx.message.reply_to_message;

  if (!target?.from) {
    return ctx.reply(
      "❗ Ответьте на сообщение пользователя и напишите разбан."
    );
  }

  try {
    await ctx.telegram.unbanChatMember(
      ctx.chat.id,
      target.from.id,
      {
        only_if_banned: true
      }
    );

    await ctx.reply(
      "✅ Пользователь разблокирован."
    );
  } catch (error) {
    console.error("UNBAN ERROR:", error);

    await ctx.reply(
      "❌ Не удалось разблокировать пользователя."
    );
  }
});

// ============================
// КИК
// Faqat admin
// ============================

bot.hears(/^!?кик$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;

  if (!isGroup(ctx)) {
    return ctx.reply(
      "❗ Команда работает только в группе."
    );
  }

  const target = ctx.message.reply_to_message;

  if (!target?.from) {
    return ctx.reply(
      "❗ Ответьте на сообщение пользователя и напишите кик."
    );
  }

  const userId = Number(target.from.id);

  if (userId === OWNER_ID) {
    return ctx.reply(
      "❌ Владелец защищён."
    );
  }

  try {
    const admins =
      await ctx.telegram.getChatAdministrators(
        ctx.chat.id
      );

    const targetIsAdmin = admins.some(
      admin =>
        Number(admin.user.id) === userId
    );

    if (targetIsAdmin) {
      return ctx.reply(
        "❌ Нельзя удалить администратора."
      );
    }

    // Ban + darhol unban = user guruhdan chiqariladi,
    // lekin keyin qayta kirishi mumkin.
    await ctx.telegram.banChatMember(
      ctx.chat.id,
      userId
    );

    await ctx.telegram.unbanChatMember(
      ctx.chat.id,
      userId,
      {
        only_if_banned: true
      }
    );

    await ctx.reply(
      `👋 ${
        target.from.first_name || "Пользователь"
      } удалён из группы.`
    );
  } catch (error) {
    console.error("KICK ERROR:", error);

    await ctx.reply(
      "❌ Не удалось удалить пользователя."
    );
  }
});

// ============================
// УДАЛИТЬ
// Faqat admin
// ============================

bot.hears(/^!?удалить$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;

  if (!isGroup(ctx)) {
    return ctx.reply(
      "❗ Команда работает только в группе."
    );
  }

  const target =
    ctx.message.reply_to_message;

  if (!target) {
    return ctx.reply(
      "❗ Ответьте на сообщение и напишите удалить."
    );
  }

  try {
    await ctx.telegram.deleteMessage(
      ctx.chat.id,
      target.message_id
    );

    // Buyruq xabarini ham o'chirishga harakat
    try {
      await ctx.telegram.deleteMessage(
        ctx.chat.id,
        ctx.message.message_id
      );
    } catch {}
  } catch (error) {
    console.error("DELETE ERROR:", error);

    await ctx.reply(
      "❌ Не удалось удалить сообщение."
    );
  }
});

// ============================
// MAT FILTRI
// Hozircha oddiy ro'yxat
// ============================

const badWords = [
  "dalbaeb",
  "долбаеб",
  "долбоеб",
  "suka",
  "сука",
  "бля",
  "блять"
];

bot.on("message", async (ctx, next) => {
  try {
    if (!ctx.from || ctx.from.is_bot) {
      return next();
    }

    if (!isGroup(ctx)) {
      return next();
    }

    // Adminlarning xabariga mat filtri ishlamaydi
    if (await isAdmin(ctx)) {
      return next();
    }

    const text = (
      ctx.message?.text ||
      ctx.message?.caption ||
      ""
    ).toLowerCase();

    if (!text) {
      return next();
    }

    const found = badWords.some(
      word => text.includes(word)
    );

    if (!found) {
      return next();
    }

    try {
      await ctx.telegram.deleteMessage(
        ctx.chat.id,
        ctx.message.message_id
      );
    } catch (error) {
      console.error("MAT DELETE ERROR:", error);
    }

    try {
      const until =
        Math.floor(Date.now() / 1000) + 60;

      await ctx.telegram.restrictChatMember(
        ctx.chat.id,
        ctx.from.id,
        {
          permissions: {
            can_send_messages: false
          },
          until_date: until
        }
      );

      await ctx.telegram.sendMessage(
        ctx.chat.id,
        `⚠️ ${
          ctx.from.first_name || "Пользователь"
        } получил мут на 1 минуту за нарушение правил.`
      );
    } catch (error) {
      console.error("MAT MUTE ERROR:", error);
    }
  } catch (error) {
    console.error("MAT FILTER ERROR:", error);
  }

  return next();
});

// ============================
// XATOLAR
// ============================

bot.catch((error) => {
  console.error("BOT ERROR:", error);
});

// ============================
// ISHGA TUSHIRISH
// ============================



// ===== ECONOMY SYSTEM =====

const economyUsers = new Map();

const ECO_START = 100;
const ECO_BONUS = 500;

const ECO_BONUS_CD = 24 * 60 * 60 * 1000;
const ECO_WORK_CD = 60 * 60 * 1000;
const ECO_TASK_CD = 30 * 60 * 1000;

function ecoUser(ctx) {
  const id = String(ctx.from.id);

  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id: ctx.from.id,
      name: ctx.from.first_name || "Пользователь",
      username: ctx.from.username || null,
      balance: ECO_START,
      bank: 0,
      lastBonus: 0,
      lastWork: 0,
      lastTask: 0
    });
  }

  const user = economyUsers.get(id);

  user.name = ctx.from.first_name || user.name;

  if (ctx.from.username) {
    user.username = ctx.from.username;
  }

  return user;
}

function ecoName(user) {
  return user.username
    ? `@${user.username}`
    : user.name;
}

function ecoTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h} ч. ${m} мин.`;
}

// 💰 БАЛАНС
bot.hears(/^!?баланс$/iu, async (ctx) => {
  const u = ecoUser(ctx);

  await ctx.reply(
    `💰 ВАШ БАЛАНС\n\n` +
    `👤 ${ecoName(u)}\n` +
    `🪙 Кошелёк: ${u.balance}\n` +
    `🏦 Банк: ${u.bank}\n` +
    `💎 Всего: ${u.balance + u.bank}`
  );
});

// 🪙 МОНЕТЫ
bot.hears(/^!?монеты$/iu, async (ctx) => {
  const u = ecoUser(ctx);

  await ctx.reply(
    `🪙 У вас ${u.balance} монет.`
  );
});

// 🎁 БОНУС
bot.hears(/^!?бонус$/iu, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();

  if (now - u.lastBonus < ECO_BONUS_CD) {
    const left = ECO_BONUS_CD - (now - u.lastBonus);

    return ctx.reply(
      `⏳ Бонус уже получен.\n\n` +
      `Следующий бонус через: ${ecoTime(left)}`
    );
  }

  u.balance += ECO_BONUS;
  u.lastBonus = now;

  await ctx.reply(
    `🎁 БОНУС ПОЛУЧЕН!\n\n` +
    `🪙 +${ECO_BONUS} монет\n` +
    `💰 Баланс: ${u.balance}`
  );
});

// 💼 РАБОТА
bot.hears(/^!?работа$/iu, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();

  if (now - u.lastWork < ECO_WORK_CD) {
    const left = ECO_WORK_CD - (now - u.lastWork);

    return ctx.reply(
      `⏳ Вы уже работали.\n` +
      `Следующая работа через: ${ecoTime(left)}`
    );
  }

  const reward = Math.floor(Math.random() * 451) + 50;

  u.balance += reward;
  u.lastWork = now;

  await ctx.reply(
    `💼 ВЫ ПОРАБОТАЛИ!\n\n` +
    `🪙 Заработано: +${reward}\n` +
    `💰 Баланс: ${u.balance}`
  );
});

// 🎯 ЗАДАНИЕ
bot.hears(/^!?задание$/iu, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();

  if (now - u.lastTask < ECO_TASK_CD) {
    const left = ECO_TASK_CD - (now - u.lastTask);

    return ctx.reply(
      `⏳ Задание уже выполнено.\n` +
      `Новое задание через: ${ecoTime(left)}`
    );
  }

  const reward = Math.floor(Math.random() * 301) + 200;

  u.balance += reward;
  u.lastTask = now;

  await ctx.reply(
    `🎯 ЗАДАНИЕ ВЫПОЛНЕНО!\n\n` +
    `🪙 Награда: +${reward}\n` +
    `💰 Баланс: ${u.balance}`
  );
});

// 👤 ПРОФИЛЬ
bot.hears(/^!?профиль$/iu, async (ctx) => {
  const u = ecoUser(ctx);

  await ctx.reply(
    `👤 ПРОФИЛЬ\n\n` +
    `🆔 ID: ${u.id}\n` +
    `👤 Имя: ${u.name}\n` +
    `🔗 Username: ${u.username ? "@" + u.username : "нет"}\n\n` +
    `🪙 Кошелёк: ${u.balance}\n` +
    `🏦 Банк: ${u.bank}\n` +
    `💎 Всего: ${u.balance + u.bank}`
  );
});

// 🏆 БОГАТЫЕ
bot.hears(/^!?богатые$/iu, async (ctx) => {
  if (economyUsers.size === 0) {
    return ctx.reply("📊 Пока нет пользователей.");
  }

  const top = [...economyUsers.values()]
    .sort((a, b) =>
      (b.balance + b.bank) - (a.balance + a.bank)
    )
    .slice(0, 10);

  let text = "🏆 БОГАТЕЙШИЕ ПОЛЬЗОВАТЕЛИ\n\n";

  top.forEach((u, i) => {
    text += `${i + 1}. ${ecoName(u)} — 🪙 ${u.balance + u.bank}\n`;
  });

  await ctx.reply(text);
});

// 💸 ПЕРЕВОД
bot.hears(/^!?перевод(?:\s+(\d+))?$/iu, async (ctx) => {
  const amount = Number(ctx.match?.[1]);

  if (!amount || amount <= 0) {
    return ctx.reply(
      `💸 Использование:\n\n` +
      `Ответьте на сообщение пользователя и напишите:\n` +
      `Перевод 500`
    );
  }

  const target = ctx.message.reply_to_message;

  if (!target?.from) {
    return ctx.reply(
      `❗ Ответьте на сообщение пользователя.`
    );
  }

  if (target.from.id === ctx.from.id) {
    return ctx.reply(`❌ Нельзя переводить самому себе.`);
  }

  const from = ecoUser(ctx);
  const to = ecoUser({
    from: target.from
  });

  if (from.balance < amount) {
    return ctx.reply(
      `❌ Недостаточно монет.\n\n` +
      `💰 У вас: ${from.balance}\n` +
      `🪙 Нужно: ${amount}`
    );
  }

  from.balance -= amount;
  to.balance += amount;

  await ctx.reply(
    `💸 ПЕРЕВОД ВЫПОЛНЕН!\n\n` +
    `👤 Получатель: ${ecoName(to)}\n` +
    `🪙 Сумма: ${amount}\n` +
    `💰 Ваш баланс: ${from.balance}`
  );
});

// 🏦 БАНК
bot.hears(/^!?банк$/iu, async (ctx) => {
  const u = ecoUser(ctx);

  await ctx.reply(
    `🏦 ВАШ БАНК\n\n` +
    `🏦 На счёте: ${u.bank}\n` +
    `🪙 В кошельке: ${u.balance}`
  );
});

// 🏦 ПОЛОЖИТЬ В БАНК
bot.hears(/^!?положить(?:\s+(\d+))?$/iu, async (ctx) => {
  const amount = Number(ctx.match?.[1]);

  if (!amount || amount <= 0) {
    return ctx.reply(`❗ Напишите: Положить 500`);
  }

  const u = ecoUser(ctx);

  if (u.balance < amount) {
    return ctx.reply(`❌ Недостаточно монет.`);
  }

  u.balance -= amount;
  u.bank += amount;

  await ctx.reply(
    `🏦 Деньги положены в банк.\n\n` +
    `🪙 +${amount}\n` +
    `🏦 Банк: ${u.bank}\n` +
    `💰 Кошелёк: ${u.balance}`
  );
});

// 🏦 СНЯТЬ С БАНКА
bot.hears(/^!?снять(?:\s+(\d+))?$/iu, async (ctx) => {
  const amount = Number(ctx.match?.[1]);

  if (!amount || amount <= 0) {
    return ctx.reply(`❗ Напишите: Снять 500`);
  }

  const u = ecoUser(ctx);

  if (u.bank < amount) {
    return ctx.reply(`❌ В банке недостаточно монет.`);
  }

  u.bank -= amount;
  u.balance += amount;

  await ctx.reply(
    `🏦 Деньги сняты.\n\n` +
    `🪙 +${amount}\n` +
    `🏦 Банк: ${u.bank}\n` +
    `💰 Кошелёк: ${u.balance}`
  );
});

// 🎲 КУБИК
bot.hears(/^!?кубик(?:\s+(\d+))?$/iu, async (ctx) => {
  const bet = Number(ctx.match?.[1]);

  if (!bet || bet <= 0) {
    return ctx.reply(`🎲 Использование: Кубик 100`);
  }

  const u = ecoUser(ctx);

  if (u.balance < bet) {
    return ctx.reply(`❌ Недостаточно монет.`);
  }

  const roll = Math.floor(Math.random() * 6) + 1;

  if (roll >= 4) {
    u.balance += bet;

    await ctx.reply(
      `🎲 Выпало: ${roll}\n\n` +
      `🎉 Вы выиграли +${bet} монет!\n` +
      `💰 Баланс: ${u.balance}`
    );
  } else {
    u.balance -= bet;

    await ctx.reply(
      `🎲 Выпало: ${roll}\n\n` +
      `😔 Вы проиграли ${bet} монет.\n` +
      `💰 Баланс: ${u.balance}`
    );
  }
});

// 🪙 МОНЕТКА
bot.hears(/^!?монетка(?:\s+(\d+))?$/iu, async (ctx) => {
  const bet = Number(ctx.match?.[1]);

  if (!bet || bet <= 0) {
    return ctx.reply(`🪙 Использование: Монетка 100`);
  }

  const u = ecoUser(ctx);

  if (u.balance < bet) {
    return ctx.reply(`❌ Недостаточно монет.`);
  }

  const win = Math.random() < 0.5;
  const side = win ? "ОРЁЛ" : "РЕШКА";

  if (win) {
    u.balance += bet;
  } else {
    u.balance -= bet;
  }

  await ctx.reply(
    `🪙 Выпало: ${side}\n\n` +
    `${win ? "🎉 Вы выиграли" : "😔 Вы проиграли"}: ${bet}\n` +
    `💰 Баланс: ${u.balance}`
  );
});

// 🎰 СЛОТ
bot.hears(/^!?слот(?:\s+(\d+))?$/iu, async (ctx) => {
  const bet = Number(ctx.match?.[1]);

  if (!bet || bet <= 0) {
    return ctx.reply(`🎰 Использование: Слот 100`);
  }

  const u = ecoUser(ctx);

  if (u.balance < bet) {
    return ctx.reply(`❌ Недостаточно монет.`);
  }

  const a = Math.floor(Math.random() * 7);
  const b = Math.floor(Math.random() * 7);
  const c = Math.floor(Math.random() * 7);

  let win = 0;

  if (a === b && b === c) {
    win = bet * 5;
  } else if (a === b || b === c || a === c) {
    win = bet * 2;
  }

  u.balance -= bet;
  u.balance += win;

  await ctx.reply(
    `🎰 СЛОТ\n\n` +
    `🎲 ${a} | ${b} | ${c}\n\n` +
    `${win > 0 ? `🎉 Выигрыш: +${win}` : `😔 Проигрыш: ${bet}`}\n` +
    `💰 Баланс: ${u.balance}`
  );
});

// 🎁 НАГРАДА
bot.hears(/^!?награда$/iu, async (ctx) => {
  const u = ecoUser(ctx);
  const reward = 100;

  u.balance += reward;

  await ctx.reply(
    `🎁 НАГРАДА\n\n` +
    `🪙 +${reward} монет\n` +
    `💰 Баланс: ${u.balance}`
  );
});

// 💱 КУРС
bot.hears(/^!?курс$/iu, async (ctx) => {
  await ctx.reply(
    `💱 КУРС ВАЛЮТЫ\n\n` +
    `🪙 1 монета = 1 единица валюты бота`
  );
});

// 🛒 МАГАЗИН
bot.hears(/^!?магазин$/iu, async (ctx) => {
  await ctx.reply(
    `🛒 МАГАЗИН\n\n` +
    `1️⃣ VIP — 🪙 1000\n` +
    `2️⃣ ПРЕМИУМ — 🪙 2500\n` +
    `3️⃣ ЛЕГЕНДА — 🪙 5000\n\n` +
    `Купить 1\n` +
    `Купить 2\n` +
    `Купить 3`
  );
});

// 🛍 КУПИТЬ
bot.hears(/^!?купить\s+([123])$/iu, async (ctx) => {
  const item = ctx.match[1];

  const prices = {
    "1": 1000,
    "2": 2500,
    "3": 5000
  };

  const names = {
    "1": "VIP",
    "2": "ПРЕМИУМ",
    "3": "ЛЕГЕНДА"
  };

  const u = ecoUser(ctx);
  const price = prices[item];

  if (u.balance < price) {
    return ctx.reply(
      `❌ Недостаточно монет.\n\n` +
      `💰 У вас: ${u.balance}\n` +
      `🪙 Нужно: ${price}`
    );
  }

  u.balance -= price;

  await ctx.reply(
    `✅ ПОКУПКА УСПЕШНА!\n\n` +
    `🎁 Товар: ${names[item]}\n` +
    `🪙 Цена: ${price}\n` +
    `💰 Баланс: ${u.balance}`
  );
});

// 🆘 ПОМОЩЬ
bot.hears(/^!?помощь$/iu, async (ctx) => {
  await ctx.reply(
    `📚 ЭКОНОМИКА 8-A\n\n` +
    `💰 Баланс\n` +
    `🎁 Бонус\n` +
    `💼 Работа\n` +
    `🎯 Задание\n` +
    `👤 Профиль\n` +
    `🏆 Богатые\n` +
    `💸 Перевод 500 — reply\n` +
    `🏦 Банк\n` +
    `Положить 500\n` +
    `Снять 500\n` +
    `🎲 Кубик 100\n` +
    `🪙 Монетка 100\n` +
    `🎰 Слот 100\n` +
    `🛒 Магазин\n` +
    `Купить 1\n` +
    `🎁 Награда\n` +
    `💱 Курс`
  );
});

// 🖥 ОКНО ECONOMY
bot.hears(/^!?экономика$/iu, async (ctx) => {
  await ctx.reply(
    `💎 ЭКОНОМИКА 8-A\n\n` +
    `Выберите действие:`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💰 Баланс", callback_data: "eco_balance" },
            { text: "🎁 Бонус", callback_data: "eco_bonus" }
          ],
          [
            { text: "💼 Работа", callback_data: "eco_work" },
            { text: "🎯 Задание", callback_data: "eco_task" }
          ],
          [
            { text: "🏆 Богатые", callback_data: "eco_rich" },
            { text: "👤 Профиль", callback_data: "eco_profile" }
          ],
          [
            { text: "🎲 Кубик", callback_data: "eco_dice" },
            { text: "🪙 Монетка", callback_data: "eco_coin" }
          ],
          [
            { text: "🛒 Магазин", callback_data: "eco_shop" },
            { text: "🏦 Банк", callback_data: "eco_bank" }
          ]
        ]
      }
    }
  );
});

bot.action("eco_balance", async (ctx) => {
  const u = ecoUser(ctx);

  await ctx.answerCbQuery();

  await ctx.reply(
    `💰 Баланс: ${u.balance}\n🏦 Банк: ${u.bank}`
  );
});

bot.action("eco_bonus", async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();

  if (now - u.lastBonus < ECO_BONUS_CD) {
    const left = ECO_BONUS_CD - (now - u.lastBonus);

    return ctx.answerCbQuery(
      `⏳ Через ${ecoTime(left)}`,
      { show_alert: true }
    );
  }

  u.balance += ECO_BONUS;
  u.lastBonus = now;

  await ctx.answerCbQuery(
    `🎁 +${ECO_BONUS} монет!`
  );

  await ctx.reply(
    `🎁 Бонус получен!\n🪙 +${ECO_BONUS}\n💰 Баланс: ${u.balance}`
  );
});

bot.action("eco_work", async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();

  if (now - u.lastWork < ECO_WORK_CD) {
    return ctx.answerCbQuery(
      `⏳ Следующая работа через ${ecoTime(ECO_WORK_CD - (now - u.lastWork))}`,
      { show_alert: true }
    );
  }

  const reward = Math.floor(Math.random() * 451) + 50;

  u.balance += reward;
  u.lastWork = now;

  await ctx.answerCbQuery(`💼 +${reward} монет!`);

  await ctx.reply(
    `💼 Вы заработали +${reward} монет!\n💰 Баланс: ${u.balance}`
  );
});

bot.action("eco_task", async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();

  if (now - u.lastTask < ECO_TASK_CD) {
    return ctx.answerCbQuery(
      `⏳ Через ${ecoTime(ECO_TASK_CD - (now - u.lastTask))}`,
      { show_alert: true }
    );
  }

  const reward = Math.floor(Math.random() * 301) + 200;

  u.balance += reward;
  u.lastTask = now;

  await ctx.answerCbQuery(`🎯 +${reward} монет!`);

  await ctx.reply(
    `🎯 Задание выполнено!\n🪙 +${reward}\n💰 Баланс: ${u.balance}`
  );
});

bot.action("eco_rich", async (ctx) => {
  await ctx.answerCbQuery();

  const top = [...economyUsers.values()]
    .sort((a, b) =>
      (b.balance + b.bank) - (a.balance + a.bank)
    )
    .slice(0, 10);

  let text = "🏆 БОГАТЕЙШИЕ\n\n";

  top.forEach((u, i) => {
    text += `${i + 1}. ${ecoName(u)} — 🪙 ${u.balance + u.bank}\n`;
  });

  await ctx.reply(text);
});

bot.action("eco_profile", async (ctx) => {
  const u = ecoUser(ctx);

  await ctx.answerCbQuery();

  await ctx.reply(
    `👤 ПРОФИЛЬ\n\n` +
    `👤 ${ecoName(u)}\n` +
    `🪙 Кошелёк: ${u.balance}\n` +
    `🏦 Банк: ${u.bank}`
  );
});

bot.action("eco_dice", async (ctx) => {
  await ctx.answerCbQuery(
    "🎲 Используйте: Кубик 100"
  );
});

bot.action("eco_coin", async (ctx) => {
  await ctx.answerCbQuery(
    "🪙 Используйте: Монетка 100"
  );
});

bot.action("eco_shop", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    `🛒 МАГАЗИН\n\n` +
    `1️⃣ VIP — 1000\n` +
    `2️⃣ ПРЕМИУМ — 2500\n` +
    `3️⃣ ЛЕГЕНДА — 5000\n\n` +
    `Купить 1 / 2 / 3`
  );
});

bot.action("eco_bank", async (ctx) => {
  const u = ecoUser(ctx);

  await ctx.answerCbQuery();

  await ctx.reply(
    `🏦 БАНК\n\n` +
    `🏦 На счёте: ${u.bank}\n` +
    `🪙 Кошелёк: ${u.balance}`
  );
});



// ===== GAME MENU =====

const GAME_OWNER_USERNAME = "man_adminn";

// Foydalanuvchi o'yin statistikasi
const gameUsers = new Map();

// Foydalanuvchini economy tizimidan olish
function getGameUser(ctx) {
  const id = ctx.from.id;

  if (typeof getEconomyUser === "function") {
    return getEconomyUser(id, ctx);
  }

  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id,
      name: ctx.from.first_name || "Пользователь",
      username: ctx.from.username || null,
      balance: ECONOMY_START || 100,
      lastBonus: 0,
      lastWork: 0
    });
  }

  const user = economyUsers.get(id);

  user.name = ctx.from.first_name || user.name;
  user.username = ctx.from.username || user.username;

  return user;
}

// ИГРА
bot.hears(/^!?игра$/i, async (ctx) => {
  const user = getGameUser(ctx);

  await ctx.reply(
    "🎮 ИГРА\n\n" +
    "💰 Ваш баланс: 🪙 " + user.balance + "\n\n" +
    "Выберите действие:",
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📜 Правила", callback_data: "game_rules" },
            { text: "💰 Баланс", callback_data: "game_balance" }
          ],
          [
            { text: "🎁 Бонус", callback_data: "game_bonus" },
            { text: "💼 Работа", callback_data: "game_work" }
          ],
          [
            { text: "🎲 Кубик 100", callback_data: "game_dice" }
          ],
          [
            { text: "💸 Передать 100", callback_data: "game_transfer_help" }
          ]
        ]
      }
    }
  );
});

// Правила
bot.action("game_rules", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    "📜 ПРАВИЛА ИГРЫ\n\n" +
    "🪙 В игре используется внутренняя валюта бота.\n\n" +
    "🎁 Бонус — один раз в 24 часа.\n" +
    "💼 Работа — получение монет.\n" +
    "🎲 Кубик — случайный выигрыш.\n" +
    "💸 Передача — можно передать 100 монет другому пользователю.\n\n" +
    "👑 @man_adminn имеет неограниченное количество передач."
  );
});

// Баланс
bot.action("game_balance", async (ctx) => {
  await ctx.answerCbQuery();

  const user = getGameUser(ctx);

  await ctx.reply(
    "💰 ВАШ БАЛАНС\n\n" +
    "🪙 " + user.balance + " монет"
  );
});

// Помощь по передаче
bot.action("game_transfer_help", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    "💸 ПЕРЕДАЧА 100\n\n" +
    "Ответьте на сообщение пользователя и напишите:\n\n" +
    "Передать 100\n\n" +
    "🪙 У вас будет списано 100.\n" +
    "🪙 Получателю будет начислено 100."
  );
});

// Передать 100
bot.hears(/^!?передать\s+100$/i, async (ctx) => {
  const target = ctx.message.reply_to_message?.from;

  if (!target) {
    return ctx.reply(
      "❗ Ответьте на сообщение пользователя и напишите «Передать 100»."
    );
  }

  if (target.is_bot) {
    return ctx.reply("❌ Ботам нельзя передавать монеты.");
  }

  if (Number(target.id) === Number(ctx.from.id)) {
    return ctx.reply("❌ Нельзя передать монеты самому себе.");
  }

  const sender = getGameUser(ctx);
  const receiver = getGameUser({
    from: target
  });

  if (sender.balance < 100) {
    return ctx.reply(
      "❌ Недостаточно монет.\n\n" +
      "💰 Ваш баланс: 🪙 " + sender.balance
    );
  }

  sender.balance -= 100;
  receiver.balance += 100;

  await ctx.reply(
    "💸 ПЕРЕДАЧА ВЫПОЛНЕНА\n\n" +
    "👤 Получатель: " +
    (target.username ? "@" + target.username : target.first_name || "Пользователь") +
    "\n" +
    "🪙 Передано: 100\n\n" +
    "💰 Ваш баланс: " + sender.balance + "\n" +
    "💰 Баланс получателя: " + receiver.balance
  );
});

// Inline callbacklarda xatoni ushlash
bot.action(/^game_/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
  } catch {}
});



// ===== ПРАВИЛА ОТДЕЛЬНОЙ КОМАНДОЙ =====

bot.hears(/^!?правила$/i, async (ctx) => {
  await ctx.reply(
    "📜 ПРАВИЛА ИГРЫ\n\n" +
    "🪙 В игре используется внутренняя валюта бота.\n\n" +
    "🎁 Бонус — один раз в 24 часа.\n" +
    "💼 Работа — получение монет.\n" +
    "🎲 Кубик — случайный выигрыш.\n" +
    "💸 Передача — можно передать 100 монет другому пользователю.\n\n" +
    "👑 @man_adminn имеет неограниченное количество передач."
  );
});

bot.launch();

console.log("🔥 8-A Admin Bot запущен!");
console.log("👑 OWNER ID:", OWNER_ID);

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
