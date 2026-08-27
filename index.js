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
      "правила", "!правила", "кубик", "!кубик", "игры", "!игры", "игра", "!игра",
      "слот", "!слот", "рулетка", "!рулетка", "богатые", "!богатые", "богачи", "!богачи",
      "перевести", "!перевести", "перевод", "!перевод", "казино", "!казино",
      "баланс", "!баланс", "бонус", "!бонус", "работа", "!работа", "задание", "!задание",
      "купить", "!купить"
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

bot.hears(/^!?(богатые|богачи)$/i, async (ctx) => {
  ecoUser(ctx); // Buyruq yuborgan foydalanuvchini avtomatik ro'yxatga qo'shish

  if (economyUsers.size === 0) {
    return ctx.reply("💎 Список богатых участников пока пуст.");
  }

  const sorted = Array.from(economyUsers.values())
    .map(u => ({ ...u, total: u.balance + u.bank }))
    .sort((a, b) => b.total - a.total);

  let text = "💎 **ТОП БОГАТЫХ УЧАСТНИКОВ**\n\n";
  sorted.slice(0, 10).forEach((u, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    text += `${medal} ${ecoName(u)} — 🪙 ${u.total}\n`;
  });

  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^!?(перевести|перевод)(?:\s+(\d+))?$/i, async (ctx) => {
  const sender = ecoUser(ctx);
  const amount = Number(ctx.match[2]);
  const replyMsg = ctx.message.reply_to_message;

  if (!replyMsg || !replyMsg.from) {
    return ctx.reply("💸 Ответьте на сообщение пользователя, которому хотите перевести монеты.\nПример: `Перевести 100` (в ответ на сообщение)", { parse_mode: "Markdown" });
  }

  if (replyMsg.from.is_bot) {
    return ctx.reply("❌ Нельзя переводить монеты ботам.");
  }

  if (replyMsg.from.id === ctx.from.id) {
    return ctx.reply("❌ Нельзя переводить монеты самому себе.");
  }

  if (!amount || amount <= 0) {
    return ctx.reply("💸 Укажите правильную сумму для перевода.\nПример: `Перевести 100`", { parse_mode: "Markdown" });
  }

  if (sender.balance < amount) {
    return ctx.reply(`❌ Недостаточно монет.\n💰 Ваш баланс: 🪙 ${sender.balance}`);
  }

  const receiverId = String(replyMsg.from.id);
  if (!economyUsers.has(receiverId)) {
    economyUsers.set(receiverId, {
      id: replyMsg.from.id,
      name: replyMsg.from.first_name || "Пользователь",
      username: replyMsg.from.username || null,
      balance: ECO_START,
      bank: 0,
      lastBonus: 0,
      lastWork: 0,
      lastTask: 0,
      vip: null
    });
  }
  const receiver = economyUsers.get(receiverId);

  sender.balance -= amount;
  receiver.balance += amount;

  await ctx.reply(
    `✅ **УСПЕШНЫЙ ПЕРЕВОД**\n\n` +
      `👤 От: ${ecoName(sender)}\n` +
      `👤 Кому: ${ecoName(receiver)}\n` +
      `🪙 Сумма: ${amount} монет\n\n` +
      `💰 Ваш остаток: 🪙 ${sender.balance}`,
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^!?казино(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);

  if (!bet || bet <= 0) {
    return ctx.reply("🎰 Использование: Казино 100 (укажите сумму ставки)");
  }

  if (u.balance < bet) {
    return ctx.reply(`❌ Недостаточно монет.\n💰 Ваш баланс: 🪙 ${u.balance}`);
  }

  const win = Math.random() < 0.45;

  if (win) {
    u.balance += bet;
    await ctx.reply(`🎰 **КАЗИНО**\n\n🎉 Вам повезло! Вы удвоили ставку: +🪙 ${bet}\n💰 Ваш баланс: 🪙 ${u.balance}`, { parse_mode: "Markdown" });
  } else {
    u.balance -= bet;
    await ctx.reply(`🎰 **КАЗИНО**\n\n😔 Увы, ставка сгорела: -🪙 ${bet}\n💰 Ваш баланс: 🪙 ${u.balance}`, { parse_mode: "Markdown" });
  }
});

bot.hears(/^!?(игры|игра)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    "🎮 **ИГРОВОЙ ЦЕНТР / OʻYINLAR BOʻLIMI**\n\n" +
      "🎲 **1. Кубик** — Игра в кости с ботом.\n" +
      "👉 Использование: `Кубик [ставка]`\n\n" +
      "🎰 **2. Слот** — Игровой автомат.\n" +
      "👉 Использование: `Слот [ставка]`\n\n" +
      "🎯 **3. Рулетка** — Угадай число от 1 до 5.\n" +
      "👉 Использование: `Рулетка [число] [ставка]`\n\n" +
      "💎 **4. Казино** — Игра на риск (x2).\n" +
      "👉 Использование: `Казино [ставка]`\n\n" +
      "💼 **Заработок монет:**\n" +
      "• `Бонус` — раз в 24 часа\n" +
      "• `Работа` — каждый час\n" +
      "• `Задание` — каждые 30 минут\n" +
      "• `Перевести` — перевод другу\n" +
      "• `Богатые` — топ богачей\n\n" +
      `💰 Ваш баланс: 🪙 ${u.balance}`,
    { parse_mode: "Markdown" }
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

bot.hears(/^!?слот(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);

  if (!bet || bet <= 0) {
    return ctx.reply("🎰 Использование: Слот 100 (укажите сумму ставки)");
  }

  if (u.balance < bet) {
    return ctx.reply(`❌ Недостаточно монет.\n💰 Ваш баланс: 🪙 ${u.balance}`);
  }

  const items = ["🍋", "🍒", "7️⃣", "💎"];
  const r1 = items[Math.floor(Math.random() * items.length)];
  const r2 = items[Math.floor(Math.random() * items.length)];
  const r3 = items[Math.floor(Math.random() * items.length)];

  if (r1 === r2 && r2 === r3) {
    const win = bet * 3;
    u.balance += win;
    await ctx.reply(`🎰 [ ${r1} | ${r2} | ${r3} ]\n\n🔥 ДЖЕКПОТ! Вы выиграли 🪙 ${win}!\n💰 Баланс: 🪙 ${u.balance}`);
  } else if (r1 === r2 || r2 === r3 || r1 === r3) {
    const win = Math.floor(bet * 1.5);
    u.balance += win;
    await ctx.reply(`🎰 [ ${r1} | ${r2} | ${r3} ]\n\n🎉 Совпадение! Вы выиграли 🪙 ${win}!\n💰 Баланс: 🪙 ${u.balance}`);
  } else {
    u.balance -= bet;
    await ctx.reply(`🎰 [ ${r1} | ${r2} | ${r3} ]\n\n😔 Не повезло. Вы потеряли 🪙 ${bet}.\n💰 Баланс: 🪙 ${u.balance}`);
  }
});

bot.hears(/^!?рулетка(?:\s+(\d+))?(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const num = Number(ctx.match[1]);
  const bet = Number(ctx.match[2]);

  if (!num || num < 1 || num > 5 || !bet || bet <= 0) {
    return ctx.reply("🎯 Использование: Рулетка [число от 1 до 5] [ставка]\nПример: `Рулетка 3 100`", { parse_mode: "Markdown" });
  }

  if (u.balance < bet) {
    return ctx.reply(`❌ Недостаточно монет.\n💰 Ваш баланс: 🪙 ${u.balance}`);
  }

  const winNum = Math.floor(Math.random() * 5) + 1;

  if (num === winNum) {
    const win = bet * 4;
    u.balance += win;
    await ctx.reply(`🎯 Выпало число: ${winNum}\n\n🎉 Угадали! Вы выиграли x4: 🪙 ${win}!\n💰 Баланс: 🪙 ${u.balance}`);
  } else {
    u.balance -= bet;
    await ctx.reply(`🎯 Выпало число: ${winNum}\n\n😔 Вы не угадали. Потеряно: 🪙 ${bet}.\n💰 Баланс: 🪙 ${u.balance}`);
  }
});

bot.hears(/^!?старт$/i, async (ctx) => {
  await ctx.reply(
    "🔥 8-A ADMIN BOT 🔥\n\n" +
      "👤 Информационные и игровые команды:\n" +
      "топ — ТОП за 24 часа\n" +
      "инфо — информация о пользователе\n" +
      "мойид — ваш ID\n" +
      "статистика — статистика группы\n" +
      "помощь — список команд\n" +
      "магазин — VIP statuslar do'koni\n" +
      "профиль — ваш профиль\n" +
      "игры — список всех игр\n" +
      "богатые — топ богатых участников\n" +
      "перевести — перевести монеты другому\n" +
      "правила — правила группы\n\n" +
      "👑 Команды администраторов:\n" +
      "бан, мут, разбан, кик, удалить, админы"
  );
});

bot.hears(/^!?помощь$/i, async (ctx) => {
  await ctx.reply(
    "📚 ДОСТУПНЫЕ КОМАНДЫ\n\n" +
      "👤 Для всех:\n" +
      "топ, инфо, мойид, статистика, помощь, баланс, бонус, работа, магазин, профиль, игры, богатые, перевести, правила, кубик, слот, рулетка, казино\n\n" +
      "👑 Для администраторов:\n" +
      "бан, мут, разбан, кик, удалить, админы, панель"
  );
});

bot.hears(/^!?правила$/i, async (ctx) => {
  await ctx.reply(
    "📜 ПРАВИЛА ГРУППЫ\n\n" +
      "1. Оскорбления и ненормативная лексика запрещены.\n" +
      "2. Спам и реклама без разрешения запрещены.\n" +
      "3. Уважайте участников и администрацию группы!"
  );
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
