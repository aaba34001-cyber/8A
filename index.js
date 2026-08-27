require("dotenv").config();
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);
const OWNER_ID = Number(process.env.OWNER_ID || 8480297110);

function isGroup(ctx) {
  return ctx.chat && (ctx.chat.type === "group" || ctx.chat.type === "supergroup");
}

async function isAdmin(ctx) {
  if (!ctx.from) return false;
  if (Number(ctx.from.id) === OWNER_ID) return true;
  if (!isGroup(ctx)) return false;

  try {
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);
    return admins.some((admin) => Number(admin.user.id) === Number(ctx.from.id));
  } catch (error) {
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

const messageStats = new Map();

bot.on("message", async (ctx, next) => {
  try {
    if (!ctx.from || ctx.from.is_bot || !isGroup(ctx)) return next();

    const text = ctx.message?.text || ctx.message?.caption || "";
    const command = text.trim().toLowerCase();

    const commands = [
      "топ", "!топ", "инфо", "!инфо", "мойид", "!мойид",
      "помощь", "!помощь", "админы", "!админы", "панель", "!панель",
      "бан", "!бан", "мут", "!мут", "разбан", "!разбан",
      "кик", "!кик", "удалить", "!удалить", "старт", "!старт",
      "статистика", "!статистика", "магазин", "!магазин", "профиль", "!профиль",
      "правила", "!правила", "кубик", "!кубик"
    ];

    if (commands.some(cmd => command.startsWith(cmd))) return next();

    const now = Date.now();
    const limit = now - 24 * 60 * 60 * 1000;
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;

    if (!messageStats.has(chatId)) messageStats.set(chatId, new Map());
    const chatStats = messageStats.get(chatId);

    if (!chatStats.has(userId)) {
      chatStats.set(userId, {
        times: [],
        username: ctx.from.username || null,
        name: ctx.from.first_name || "Пользователь",
      });
    }

    const user = chatStats.get(userId);
    user.times.push(now);
    user.times = user.times.filter((time) => time >= limit);
    user.username = ctx.from.username || user.username;
    user.name = ctx.from.first_name || user.name;
  } catch (error) {}

  return next();
});

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
      lastTask: 0,
      vip: null
    });
  }
  const user = economyUsers.get(id);
  user.name = ctx.from.first_name || user.name;
  if (ctx.from.username) user.username = ctx.from.username;
  return user;
}

function ecoName(user) {
  return user.username ? `@${user.username}` : user.name;
}

function ecoTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h} ч. ${m} мин.`;
}

bot.hears(/^!?старт$/i, async (ctx) => {
  await ctx.reply(
    "🔥 8-A ADMIN BOT 🔥\n\n" +
      "👤 Информационные команды:\n" +
      "топ — ТОП за 24 часа\n" +
      "инфо — информация о пользователе\n" +
      "мойид — ваш ID\n" +
      "статистика — статистика группы\n" +
      "помощь — список команд\n" +
      "магазин — VIP statuslar do'koni\n" +
      "профиль — ваш профиль\n" +
      "правила — правила группы\n" +
      "кубик [ставка] — игра в кости\n\n" +
      "👑 Команды администраторов:\n" +
      "бан, мут, разбан, кик, удалить, админы"
  );
});

bot.hears(/^!?помощь$/i, async (ctx) => {
  await ctx.reply(
    "📚 ДОСТУПНЫЕ КОМАНДЫ\n\n" +
      "👤 Для всех:\n" +
      "топ, инфо, мойид, статистика, помощь, баланс, бонус, работа, магазин, профиль, игра, правила, кубик [ставка]\n\n" +
      "👑 Для администраторов:\n" +
      "бан, мут, разбан, кик, удалить, админы, панель"
  );
});

bot.hears(/^!?правила$/i, async (ctx) => {
  await ctx.reply(
    "📜 ПРАВИЛА ГРУППЫ\n\n" +
      "1. Оскорбления и ненормативная лексика запрещены.\n" +
      "2. Спам и реклама без разрешения запрещены.\n" +
      "3. Уважайте участникoв и администрацию группы!"
  );
});

bot.hears(/^!?кубик(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);

  if (!bet || bet <= 0) {
    return ctx.reply("🎲 Использование: Кубик 100 (укажите сумму ставки)");
  }

  if (u.balance < bet) {
    return ctx.reply(`❌ Недостаточно монет для ставки.\n💰 Ваш баланс: 🪙 ${u.balance}`);
  }

  const userDice = Math.floor(Math.random() * 6) + 1;
  const botDice = Math.floor(Math.random() * 6) + 1;

  if (userDice > botDice) {
    u.balance += bet;
    await ctx.reply(
      `🎲 ИГРА В КОСТИ\n\n👤 Ваш бросок: ${userDice}\n🤖 Бросок бота: ${botDice}\n\n🎉 Вы выиграли! +🪙 ${bet}\n💰 Ваш баланс: 🪙 ${u.balance}`
    );
  } else if (userDice < botDice) {
    u.balance -= bet;
    await ctx.reply(
      `🎲 ИГРА В КОСТИ\n\n👤 Ваш бросок: ${userDice}\n🤖 Бросок бота: ${botDice}\n\n😔 Вы проиграли! -🪙 ${bet}\n💰 Ваш баланс: 🪙 ${u.balance}`
    );
  } else {
    await ctx.reply(
      `🎲 ИГРА В КОСТИ\n\n👤 Ваш бросок: ${userDice}\n🤖 Бросок бота: ${botDice}\n\n🤝 Ничья! Ставка возвращена.\n💰 Ваш баланс: 🪙 ${u.balance}`
    );
  }
});

bot.hears(/^!?мойид$/i, async (ctx) => {
  await ctx.reply(`🆔 Ваш ID: ${ctx.from.id}`);
});

bot.hears(/^!?топ$/i, async (ctx) => {
  if (!isGroup(ctx)) return ctx.reply("❗ Команда работает только в группе.");
  const chatStats = messageStats.get(ctx.chat.id);
  if (!chatStats || chatStats.size === 0) {
    return ctx.reply("📊 За последние 24 часа сообщений пока нет.");
  }

  const limit = Date.now() - 24 * 60 * 60 * 1000;
  const top = [];

  for (const [userId, user] of chatStats) {
    user.times = user.times.filter((t) => t >= limit);
    if (user.times.length > 0) {
      top.push({
        id: userId,
        count: user.times.length,
        username: user.username,
        name: user.name,
      });
    }
  }

  top.sort((a, b) => b.count - a.count);
  if (top.length === 0) return ctx.reply("📊 За последние 24 часа сообщений пока нет.");

  let text = "🏆 ТОП ЗА 24 ЧАСА\n\n";
  top.slice(0, 10).forEach((u, i) => {
    const name = u.username ? `@${u.username}` : u.name;
    text += `${i + 1}. ${name} — ${u.count} сообщений\n`;
  });

  await ctx.reply(text);
});

bot.hears(/^!?статистика$/i, async (ctx) => {
  if (!isGroup(ctx)) return ctx.reply("❗ Команда работает только в группе.");
  const chatStats = messageStats.get(ctx.chat.id);
  if (!chatStats) return ctx.reply("📊 Пока статистики нет.");

  let total = 0;
  const limit = Date.now() - 24 * 60 * 60 * 1000;
  for (const user of chatStats.values()) {
    user.times = user.times.filter((t) => t >= limit);
    total += user.times.length;
  }

  await ctx.reply(
    `📊 СТАТИСТИКА ЗА 24 ЧАСА\n\n💬 Сообщений: ${total}\n👥 Активных пользователей: ${chatStats.size}`
  );
});

bot.hears(/^!?инфо$/i, async (ctx) => {
  const target = ctx.message.reply_to_message?.from || ctx.from;
  await ctx.reply(
    `👤 ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ\n\n🆔 ID: ${target.id}\n👤 Имя: ${
      target.first_name || "Не указано"
    }\n🔗 Username: ${
      target.username ? "@" + target.username : "Нет"
    }\n🤖 Bot: ${target.is_bot ? "Да" : "Нет"}`
  );
});

bot.hears(/^!?админы$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  if (!isGroup(ctx)) return ctx.reply("❗ Эту команду нужно использовать в группе.");

  try {
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);
    let text = "👑 АДМИНИСТРАТОРЫ ГРУППЫ\n\n";
    let number = 1;
    for (const admin of admins) {
      text += `${number}. ${admin.user.first_name || "Пользователь"}`;
      if (admin.user.username) text += ` (@${admin.user.username})`;
      text += "\n";
      number++;
    }
    await ctx.reply(text);
  } catch (error) {
    await ctx.reply("❌ Не удалось получить список администраторов.");
  }
});

bot.hears(/^!?панель$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.reply("👑 ПАНЕЛЬ АДМИНИСТРАТОРА\n\n🟢 Бот: ОНЛАЙН\n🛡 Модерация: ВКЛ");
});

bot.hears(/^!?бан$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  if (!isGroup(ctx)) return ctx.reply("❗ Команда работает только в группе.");

  const target = ctx.message.reply_to_message;
  if (!target?.from) return ctx.reply("❗ Ответьте на сообщение пользователя.");

  const userId = Number(target.from.id);
  if (userId === OWNER_ID) return ctx.reply("❌ Владелец защищён от блокировки.");

  try {
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);
    if (admins.some((a) => Number(a.user.id) === userId)) {
      return ctx.reply("❌ Нельзя заблокировать администратора.");
    }
    await ctx.telegram.banChatMember(ctx.chat.id, userId);
    await ctx.reply(`🚫 ${target.from.first_name || "Пользователь"} заблокирован.`);
  } catch (error) {
    await ctx.reply("❌ Не удалось заблокировать пользователя.");
  }
});

bot.hears(/^!?мут$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  if (!isGroup(ctx)) return ctx.reply("❗ Команда работает только в группе.");

  const target = ctx.message.reply_to_message;
  if (!target?.from) return ctx.reply("❗ Ответьте на сообщение пользователя.");

  const userId = Number(target.from.id);
  if (userId === OWNER_ID) return ctx.reply("❌ Владелец защищён.");

  try {
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);
    if (admins.some((a) => Number(a.user.id) === userId)) {
      return ctx.reply("❌ Нельзя ограничить администратора.");
    }
    const until = Math.floor(Date.now() / 1000) + 60;
    await ctx.telegram.restrictChatMember(ctx.chat.id, userId, {
      permissions: { can_send_messages: false },
      until_date: until,
    });
    await ctx.reply(`🔇 ${target.from.first_name || "Пользователь"} получил мут на 1 минуту.`);
  } catch (error) {
    await ctx.reply("❌ Не удалось выдать мут.");
  }
});

bot.hears(/^!?разбан$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  if (!isGroup(ctx)) return ctx.reply("❗ Команда работает только в группе.");

  const target = ctx.message.reply_to_message;
  if (!target?.from) return ctx.reply("❗ Ответьте на сообщение пользователя.");

  try {
    await ctx.telegram.unbanChatMember(ctx.chat.id, target.from.id, { only_if_banned: true });
    await ctx.reply("✅ Пользователь разблокирован.");
  } catch (error) {
    await ctx.reply("❌ Не удалось разблокировать.");
  }
});

bot.hears(/^!?кик$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  if (!isGroup(ctx)) return ctx.reply("❗ Команда работает только в группе.");

  const target = ctx.message.reply_to_message;
  if (!target?.from) return ctx.reply("❗ Ответьте на сообщение пользователя.");

  const userId = Number(target.from.id);
  if (userId === OWNER_ID) return ctx.reply("❌ Владелец защищён.");

  try {
    await ctx.telegram.banChatMember(ctx.chat.id, userId);
    await ctx.telegram.unbanChatMember(ctx.chat.id, userId, { only_if_banned: true });
    await ctx.reply(`👋 ${target.from.first_name || "Пользователь"} удалён из группы.`);
  } catch (error) {
    await ctx.reply("❌ Не удалось удалить пользователя.");
  }
});

bot.hears(/^!?удалить$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  if (!isGroup(ctx)) return ctx.reply("❗ Команда работает только в группе.");

  const target = ctx.message.reply_to_message;
  if (!target) return ctx.reply("❗ Ответьте на сообщение.");

  try {
    await ctx.telegram.deleteMessage(ctx.chat.id, target.message_id);
    try { await ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id); } catch {}
  } catch (error) {
    await ctx.reply("❌ Не удалось удалить сообщение.");
  }
});

bot.hears(/^!?баланс$/iu, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `💰 ВАШ БАЛАНС\n\n👤 ${ecoName(u)}\n🪙 Кошелёк: ${u.balance}\n🏦 Банк: ${u.bank}\n💎 Всего: ${u.balance + u.bank}`
  );
});

bot.hears(/^!?бонус$/iu, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();

  if (now - u.lastBonus < ECO_BONUS_CD) {
    const left = ECO_BONUS_CD - (now - u.lastBonus);
    return ctx.reply(`⏳ Бонус уже получен.\nСледующий бонус через: ${ecoTime(left)}`);
  }

  u.balance += ECO_BONUS;
  u.lastBonus = now;
  await ctx.reply(`🎁 БОНУС ПОЛУЧЕН!\n\n🪙 +${ECO_BONUS} монет\n💰 Баланс: ${u.balance}`);
});

bot.hears(/^!?работа$/iu, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();

  if (now - u.lastWork < ECO_WORK_CD) {
    const left = ECO_WORK_CD - (now - u.lastWork);
    return ctx.reply(`⏳ Вы уже работали.\nСледующая работа через: ${ecoTime(left)}`);
  }

  const reward = Math.floor(Math.random() * 451) + 50;
  u.balance += reward;
  u.lastWork = now;
  await ctx.reply(`💼 ВЫ ПОРАБОТАЛИ!\n\n🪙 Заработано: +${reward}\n💰 Баланс: ${u.balance}`);
});

bot.hears(/^!?задание$/iu, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();

  if (now - u.lastTask < ECO_TASK_CD) {
    const left = ECO_TASK_CD - (now - u.lastTask);
    return ctx.reply(`⏳ Задание уже выполнено.\nНовое задание через: ${ecoTime(left)}`);
  }

  const reward = Math.floor(Math.random() * 301) + 200;
  u.balance += reward;
  u.lastTask = now;
  await ctx.reply(`🎯 ЗАДАНИЕ ВЫПОЛНЕНО!\n\n🪙 Награда: +${reward}\n💰 Баланс: ${u.balance}`);
});

bot.hears(/^!?профиль$/iu, async (ctx) => {
  const u = ecoUser(ctx);

  let status = "❌ Нет активного статуса";
  if (u.vip && u.vip.expires > Date.now()) {
    const left = u.vip.expires - Date.now();
    const days = Math.floor(left / (24 * 60 * 60 * 1000));
    const hours = Math.floor((left % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    status = `🏆 ${u.vip.name}\n⏳ Осталось: ${days} д. ${hours} ч.`;
  }

  await ctx.reply(
    `👤 ПРОФИЛЬ\n\n🆔 ID: ${u.id}\n👤 Имя: ${u.name}\n🔗 Username: ${
      u.username ? "@" + u.username : "нет"
    }\n\n🪙 Кошелёк: ${u.balance}\n🏦 Банк: ${u.bank}\n💎 Всего: ${
      u.balance + u.bank
    }\n\n⭐ VIP Статус:\n${status}`
  );
});

bot.hears(/^!?магазин$/i, async (ctx) => {
  const u = ecoUser(ctx);

  await ctx.reply(
    "🛒 **МАГАЗИН СТАТУСОВ**\n\n" +
      "1️⃣ **VIP** — 🪙 1000 (7 дней)\n" +
      "2️⃣ **Премиум** — 🪙 2500 (7 дней)\n" +
      "3️⃣ **Легенда** — 🪙 5000 (7 дней)\n\n" +
      `💰 Ваш баланс: 🪙 ${u.balance}\n\n` +
      "Sotib olish uchun buyruqni yozing:\n" +
      "👉 `Купить 1`\n" +
      "👉 `Купить 2`\n" +
      "👉 `Купить 3`",
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^!?купить\s*([123])$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const number = ctx.match[1];

  const items = {
    "1": { name: "VIP", price: 1000 },
    "2": { name: "Премиум", price: 2500 },
    "3": { name: "Легенда", price: 5000 },
  };

  const item = items[number];
  if (!item) return;

  if (u.balance < item.price) {
    return ctx.reply(
      `❌ Недостаточно монет.\n\n🪙 Нужно: ${item.price}\n💰 Ваш баланс: ${u.balance}`
    );
  }

  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  u.balance -= item.price;
  u.vip = {
    name: item.name,
    expires: now + sevenDays,
  };

  await ctx.reply(
    `✅ ПОКУПКА УСПЕШНА!\n\n🏆 Статус: ${item.name}\n⏳ Срок: 7 дней\n📅 Действует до: ${new Date(
      u.vip.expires
    ).toLocaleString("ru-RU")}\n\n💰 Остаток: 🪙 ${u.balance}`
  );
});

bot.catch((error) => {
  console.error("BOT ERROR:", error);
});

bot.launch();

console.log("🔥 8-A Admin Bot запущен!");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
