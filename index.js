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

bot.launch();

console.log("🔥 8-A Admin Bot запущен!");
console.log("👑 OWNER ID:", OWNER_ID);

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
