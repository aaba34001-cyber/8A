require("dotenv").config();
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);
const OWNER_ID = Number(process.env.OWNER_ID || 8480297110);
const EXTRA_ADMIN_USERNAME = "man_mass"; // Задано имя специального админа

function isGroup(ctx) {
  return ctx.chat && (ctx.chat.type === "group" || ctx.chat.type === "supergroup");
}

async function isAdmin(ctx) {
  if (!ctx.from) return false;
  if (Number(ctx.from.id) === OWNER_ID) return true;
  
  // @man_mass юзерини автоматик админ деб тан олиш
  if (ctx.from.username && ctx.from.username.toLowerCase() === EXTRA_ADMIN_USERNAME.toLowerCase()) {
    return true;
  }

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
      vip: false,
      bankLimitUnlocked: false,
      title: null,
      lastInterest: Date.now()
    });
  }
  const user = economyUsers.get(id);
  user.name = ctx.from.first_name || user.name;
  if (ctx.from.username) user.username = ctx.from.username;
  return user;
}

function ecoName(user) {
  const prefix = user.title ? `[${user.title}] ` : "";
  const nameStr = user.username ? `@${user.username}` : user.name;
  return `${prefix}${nameStr}${user.vip ? " 👑VIP" : ""}`;
}

function ecoTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h} ч. ${m} мин.`;
}

// Банк фоизи (соатига 2%)
setInterval(() => {
  const now = Date.now();
  economyUsers.forEach((user) => {
    if (user.bank > 0) {
      const hoursPassed = Math.floor((now - (user.lastInterest || now)) / (60 * 60 * 1000));
      if (hoursPassed >= 1) {
        const interest = Math.floor(user.bank * 0.02 * hoursPassed);
        if (interest > 0) {
          user.bank += interest;
        }
        user.lastInterest = now;
      }
    } else {
      user.lastInterest = now;
    }
  });
}, 5 * 60 * 1000);

// Middleware
bot.on("message", async (ctx, next) => {
  try {
    if (!ctx.from || ctx.from.is_bot || !isGroup(ctx)) return next();

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

// Банк
bot.hears(/^!?банк(?:\s+(положить|снять|депозит|пополнить))?(?:\s+(\d+|все))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const action = ctx.match[1]?.toLowerCase();
  const amountArg = ctx.match[2]?.toLowerCase();

  const maxBankLimit = u.bankLimitUnlocked ? Infinity : 50000;

  if (!action) {
    return ctx.reply(
      `🏦 **БАНКОВСКИЙ СЧЁТ**\n\n` +
      `🪙 Кошелёк: ${u.balance}\n` +
      `🏦 В банке: ${u.bank} / ${u.bankLimitUnlocked ? "∞" : "50,000"}\n` +
      `📈 Начисление: **2% в час** на остаток в банке!\n\n` +
      `📥 **Положить:** Банк положить [сумма/все]\n` +
      `📤 **Снять:** Банк снять [сумма/все]`
    );
  }

  if (action === "положить" || action === "депозит" || action === "пополнить") {
    let amount = amountArg === "все" ? u.balance : Number(amountArg);

    if (!amount || amount <= 0) return ctx.reply("📥 Укажите сумму: Банк положить 1000 или Банк положить все");
    if (u.balance < amount) return ctx.reply(`❌ У вас нет столько денег в кошельке. Баланс: 🪙 ${u.balance}`);

    if (u.bank + amount > maxBankLimit) {
      return ctx.reply(`❌ Превышен лимит банка (Макс: 🪙 ${maxBankLimit}). Купите снятие лимита в Магазине!`);
    }

    u.balance -= amount;
    u.bank += amount;
    u.lastInterest = Date.now();

    return ctx.reply(`✅ Вы положили 🪙 ${amount} в банк.\n🏦 Баланс банка: 🪙 ${u.bank}\n🪙 В кошельке: 🪙 ${u.balance}`);
  }

  if (action === "снять") {
    let amount = amountArg === "все" ? u.bank : Number(amountArg);

    if (!amount || amount <= 0) return ctx.reply("📤 Укажите сумму: Банк снять 1000 или Банк снять все");
    if (u.bank < amount) return ctx.reply(`❌ У вас нет столько денег в банке. В банке: 🪙 ${u.bank}`);

    u.bank -= amount;
    u.balance += amount;

    return ctx.reply(`✅ Вы сняли 🪙 ${amount} из банка.\n🪙 В кошельке: 🪙 ${u.balance}\n🏦 Баланс банка: 🪙 ${u.bank}`);
  }
});

// Магазин
bot.hears(/^!?(магазин|дўкон)[\.\s]*$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `🛒 **МАГАЗИН ТОВАРОВ И УСЛУГ**\n\n` +
    `1. 👑 **VIP Статус** — 🪙 5000 монет (Даёт 2x бонус)\n` +
    `2. 🏦 **Снять ограничения банка** — 🪙 3000 монет (Безлимитный банк)\n` +
    `3. 🎨 **Кастомный титул** — 🪙 2000 монет (Команда: Титул [текст])\n\n` +
    `💡 *Чтобы купить, используйте команду: Купить [номер]*\n` +
    `💰 Ваш баланс: 🪙 ${u.balance}`
  );
});

// Купить
bot.hears(/^!?купить(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const itemNum = Number(ctx.match[1]);

  if (!itemNum) {
    return ctx.reply("🛒 Укажите номер товара: Купить 1, Купить 2 или Купить 3");
  }

  if (itemNum === 1) {
    if (u.vip) return ctx.reply("👑 У вас уже есть VIP Статус!");
    if (u.balance < 5000) return ctx.reply(`❌ Недостаточно монет (Нужно: 🪙 5000). Ваш баланс: 🪙 ${u.balance}`);
    
    u.balance -= 5000;
    u.vip = true;
    return ctx.reply(`🎉 Поздравляем! Вы успешно приобрели 👑 VIP Статус!`);
  } 
  
  else if (itemNum === 2) {
    if (u.bankLimitUnlocked) return ctx.reply("🏦 У вас уже сняты ограничения банка!");
    if (u.balance < 3000) return ctx.reply(`❌ Недостаточно монет (Нужно: 🪙 3000). Ваш баланс: 🪙 ${u.balance}`);
    
    u.balance -= 3000;
    u.bankLimitUnlocked = true;
    return ctx.reply(`🎉 Вы успешно сняли все ограничения банка! Теперь ваш лимит депозита неограничен.`);
  } 
  
  else if (itemNum === 3) {
    if (u.balance < 2000) return ctx.reply(`❌ Недостаточно монет (Нужно: 🪙 2000). Ваш баланс: 🪙 ${u.balance}`);
    
    u.balance -= 2000;
    u.title = u.title || "Игрок";
    return ctx.reply(`🎉 Вы купили право на Кастомный титул!\n\n✍️ Теперь напишите: **Титул [ваше слово]** (например: Титул Король)`);
  } 
  
  else {
    return ctx.reply("❌ Товар с таким номером не найден. Посмотрите меню: Магазин");
  }
});

// Титул
bot.hears(/^!?титул(?:\s+(.+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const newTitle = ctx.match[1];

  if (!u.title) {
    return ctx.reply("❌ Сначала купите возможность установки титула в магазине (Купить 3).");
  }

  if (!newTitle) {
    return ctx.reply("✍️ Использование: Титул [ваш текст] (например: Титул Король)");
  }

  if (newTitle.length > 15) {
    return ctx.reply("❌ Титул должен быть не длиннее 15 символов.");
  }

  u.title = newTitle.trim();
  await ctx.reply(`✅ Ваш новый титул установлен: **[${u.title}]**`);
});

bot.hears(/^!?(игры|игра)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `🎮 **ИГРОВОЙ ЦЕНТР И ЭКОНОМИКА**\n\n` +
    `🎲 Кубик [ставка]\n` +
    `🎰 Слот [ставка]\n` +
    `🎯 Рулетка [число] [ставка]\n` +
    `💎 Казино [ставка]\n\n` +
    `🏦 **Банк:** Банк положить / Банк снять\n` +
    `💼 **Заработок:** Бонус, Работа, Задание, Богатые\n` +
    `🛒 **Покупки:** Магазин (команда: Магазин / Купить [номер])\n` +
    `💰 Ваш баланс: 🪙 ${u.balance}`
  );
});

bot.hears(/^!?(богатые|богачи)[\.\s]*$/i, async (ctx) => {
  ecoUser(ctx);

  const sorted = Array.from(economyUsers.values())
    .map(u => ({ ...u, total: u.balance + u.bank }))
    .sort((a, b) => b.total - a.total);

  if (sorted.length === 0) {
    return ctx.reply("💎 Список богатых участников пока пуст.");
  }

  let text = "💎 ТОП БОГАТЫХ УЧАСТНИКОВ\n\n";
  sorted.slice(0, 10).forEach((u, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    text += `${medal} ${ecoName(u)} — 🪙 ${u.total}\n`;
  });

  await ctx.reply(text);
});

bot.hears(/^!?(перевести|перевод)(?:\s+(\d+))?$/i, async (ctx) => {
  const sender = ecoUser(ctx);
  const amount = Number(ctx.match[2]);
  const replyMsg = ctx.message.reply_to_message;

  if (!replyMsg || !replyMsg.from) {
    return ctx.reply("💸 Ответьте на сообщение пользователя, которому хотите перевести монеты.");
  }

  if (replyMsg.from.is_bot || replyMsg.from.id === ctx.from.id) {
    return ctx.reply("❌ Нельзя переводить монеты ботам или самому себе.");
  }

  if (!amount || amount <= 0) {
    return ctx.reply("💸 Укажите правильную сумму для перевода.");
  }

  if (sender.balance < amount) {
    return ctx.reply(`❌ Недостаточно монет.\n💰 Ваш баланс: 🪙 ${sender.balance}`);
  }

  const receiver = ecoUser({ from: replyMsg.from });
  sender.balance -= amount;
  receiver.balance += amount;

  await ctx.reply(
    `✅ УСПЕШНЫЙ ПЕРЕВОД\n\n👤 От: ${ecoName(sender)}\n👤 Кому: ${ecoName(receiver)}\n🪙 Сумма: ${amount} монет`
  );
});

bot.hears(/^!?казино(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);

  if (!bet || bet <= 0) {
    return ctx.reply("🎰 Использование: Казино 100");
  }

  if (u.balance < bet) {
    return ctx.reply(`❌ Недостаточно монет в кошельке.\n💰 Ваш баланс: 🪙 ${u.balance}`);
  }

  const win = Math.random() < 0.45;

  if (win) {
    u.balance += bet;
    await ctx.reply(`🎰 КАЗИНО\n\n🎉 Вы выиграли! +🪙 ${bet}\n💰 Ваш баланс: 🪙 ${u.balance}`);
  } else {
    u.balance -= bet;
    await ctx.reply(`🎰 КАЗИНО\n\n😔 Увы, ставка сгорела: -🪙 ${bet}\n💰 Ваш баланс: 🪙 ${u.balance}`);
  }
});

bot.hears(/^!?кубик(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);

  if (!bet || bet <= 0) return ctx.reply("🎲 Использование: Кубик 100");
  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет.\n💰 Ваш баланс: 🪙 ${u.balance}`);

  const userDice = Math.floor(Math.random() * 6) + 1;
  const botDice = Math.floor(Math.random() * 6) + 1;

  if (userDice > botDice) {
    u.balance += bet;
    await ctx.reply(`🎲 Вы выиграли! +🪙 ${bet}\n💰 Баланс: 🪙 ${u.balance}`);
  } else if (userDice < botDice) {
    u.balance -= bet;
    await ctx.reply(`🎲 Вы проиграли! -🪙 ${bet}\n💰 Баланс: 🪙 ${u.balance}`);
  } else {
    await ctx.reply(`🎲 Ничья! Ставка возвращена.\n💰 Баланс: 🪙 ${u.balance}`);
  }
});

bot.hears(/^!?слот(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);

  if (!bet || bet <= 0) return ctx.reply("🎰 Использование: Слот 100");
  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет.\n💰 Ваш баланс: 🪙 ${u.balance}`);

  const items = ["🍋", "🍒", "7️⃣", "💎"];
  const r1 = items[Math.floor(Math.random() * items.length)];
  const r2 = items[Math.floor(Math.random() * items.length)];
  const r3 = items[Math.floor(Math.random() * items.length)];

  if (r1 === r2 && r2 === r3) {
    const win = bet * 3;
    u.balance += win;
    await ctx.reply(`🎰 [ ${r1} | ${r2} | ${r3} ]\n\n🔥 ДЖЕКПОТ! +🪙 ${win}\n💰 Баланс: 🪙 ${u.balance}`);
  } else if (r1 === r2 || r2 === r3 || r1 === r3) {
    const win = Math.floor(bet * 1.5);
    u.balance += win;
    await ctx.reply(`🎰 [ ${r1} | ${r2} | ${r3} ]\n\n🎉 Выиграли +🪙 ${win}\n💰 Баланс: 🪙 ${u.balance}`);
  } else {
    u.balance -= bet;
    await ctx.reply(`🎰 [ ${r1} | ${r2} | ${r3} ]\n\n😔 Проиграли -🪙 ${bet}\n💰 Баланс: 🪙 ${u.balance}`);
  }
});

bot.hears(/^!?рулетка(?:\s+(\d+))?(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const num = Number(ctx.match[1]);
  const bet = Number(ctx.match[2]);

  if (!num || num < 1 || num > 5 || !bet || bet <= 0) {
    return ctx.reply("🎯 Использование: Рулетка [1-5] [ставка]");
  }

  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет.\n💰 Ваш баланс: 🪙 ${u.balance}`);

  const winNum = Math.floor(Math.random() * 5) + 1;

  if (num === winNum) {
    const win = bet * 4;
    u.balance += win;
    await ctx.reply(`🎯 Выпало: ${winNum}\n🎉 Вы выиграли +🪙 ${win}!\n💰 Баланс: 🪙 ${u.balance}`);
  } else {
    u.balance -= bet;
    await ctx.reply(`🎯 Выпало: ${winNum}\n😔 Потеряно: 🪙 ${bet}\n💰 Баланс: 🪙 ${u.balance}`);
  }
});

bot.hears(/^!?старт$/i, async (ctx) => {
  await ctx.reply("🔥 8-A ADMIN BOT 🔥\n\nКоманды: топ, инфо, мойид, статистика, помощь, банк, магазин, купить, титул, профиль, игры, богатые, перевести, правила");
});

bot.hears(/^!?помощь$/i, async (ctx) => {
  await ctx.reply("📚 Команды: топ, инфо, мойид, статистика, помощь, банк, баланс, бонус, работа, магазин, купить, титул, профиль, игры, богатые, перевести, правила, кубик, слот, рулетка, казино");
});

bot.hears(/^!?правила$/i, async (ctx) => {
  await ctx.reply("📜 ПРАВИЛА ГРУППЫ\n\n1. Без оскорблений.\n2. Без спама.\n3. Уважайте участников.");
});

bot.hears(/^!?мойид$/i, async (ctx) => {
  await ctx.reply(`🆔 Ваш ID: ${ctx.from.id}`);
});

bot.hears(/^!?топ$/i, async (ctx) => {
  if (!isGroup(ctx)) return ctx.reply("❗ Только для групп.");
  const chatStats = messageStats.get(ctx.chat.id);
  if (!chatStats || chatStats.size === 0) return ctx.reply("📊 За 24 часа сообщений нет.");

  const limit = Date.now() - 24 * 60 * 60 * 1000;
  const top = [];

  for (const [userId, user] of chatStats) {
    user.times = user.times.filter((t) => t >= limit);
    if (user.times.length > 0) {
      top.push({ id: userId, count: user.times.length, username: user.username, name: user.name });
    }
  }

  top.sort((a, b) => b.count - a.count);
  if (top.length === 0) return ctx.reply("📊 За 24 часа сообщений нет.");

  let text = "🏆 ТОП ЗА 24 ЧАСА\n\n";
  top.slice(0, 10).forEach((u, i) => {
    text += `${i + 1}. ${u.username ? "@" + u.username : u.name} — ${u.count} сообщ.\n`;
  });

  await ctx.reply(text);
});

bot.hears(/^!?статистика$/i, async (ctx) => {
  if (!isGroup(ctx)) return ctx.reply("❗ Только для групп.");
  const chatStats = messageStats.get(ctx.chat.id);
  if (!chatStats) return ctx.reply("📊 Нет статистики.");

  let total = 0;
  const limit = Date.now() - 24 * 60 * 60 * 1000;
  for (const user of chatStats.values()) {
    user.times = user.times.filter((t) => t >= limit);
    total += user.times.length;
  }

  await ctx.reply(`📊 СТАТИСТИКА ЗА 24 ЧАСА\n\n💬 Сообщений: ${total}\n👥 Активных: ${chatStats.size}`);
});

bot.hears(/^!?инфо$/i, async (ctx) => {
  const target = ctx.message.reply_to_message?.from || ctx.from;
  await ctx.reply(`👤 ИНФО\n\n🆔 ID: ${target.id}\n👤 Имя: ${target.first_name || "Не указано"}\n🔗 Username: ${target.username ? "@" + target.username : "Нет"}`);
});

bot.hears(/^!?админы$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  if (!isGroup(ctx)) return ctx.reply("❗ Только для групп.");

  try {
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);
    let text = "👑 АДМИНИСТРАТОРЫ ГРУППЫ\n\n";
    admins.forEach((admin, i) => {
      text += `${i + 1}. ${admin.user.first_name}${admin.user.username ? " (@" + admin.user.username + ")" : ""}\n`;
    });
    await ctx.reply(text);
  } catch (error) {
    await ctx.reply("❌ Ошибка получения админов.");
  }
});

bot.hears(/^!?панель$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.reply("👑 ПАНЕЛЬ АДМИНИСТРАТОРА\n\n🟢 Бот: ОНЛАЙН");
});

bot.hears(/^!?бан$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  if (!isGroup(ctx)) return ctx.reply("❗ Только для групп.");

  const target = ctx.message.reply_to_message;
  if (!target?.from) return ctx.reply("❗ Ответьте на сообщение.");
  if (Number(target.from.id) === OWNER_ID) return ctx.reply("❌ Владелец защищён.");

  try {
    await ctx.telegram.banChatMember(ctx.chat.id, target.from.id);
    await ctx.reply(`🚫 ${target.from.first_name} заблокирован.`);
  } catch (error) {
    await ctx.reply("❌ Ошибка бана.");
  }
});

bot.hears(/^!?мут$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  if (!isGroup(ctx)) return ctx.reply("❗ Только для групп.");

  const target = ctx.message.reply_to_message;
  if (!target?.from) return ctx.reply("❗ Ответьте на сообщение.");
  if (Number(target.from.id) === OWNER_ID) return ctx.reply("❌ Владелец защищён.");

  try {
    const until = Math.floor(Date.now() / 1000) + 60;
    await ctx.telegram.restrictChatMember(ctx.chat.id, target.from.id, {
      permissions: { can_send_messages: false },
      until_date: until,
    });
    await ctx.reply(`🔇 ${target.from.first_name} получил мут на 1 минуту.`);
  } catch (error) {
    await ctx.reply("❌ Ошибка мута.");
  }
});

bot.hears(/^!?разбан$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  if (!isGroup(ctx)) return ctx.reply("❗ Только для групп.");

  const target = ctx.message.reply_to_message;
  if (!target?.from) return ctx.reply("❗ Ответьте на сообщение.");

  try {
    await ctx.telegram.unbanChatMember(ctx.chat.id, target.from.id, { only_if_banned: true });
    await ctx.reply("✅ Разблокирован.");
  } catch (error) {
    await ctx.reply("❌ Ошибка.");
  }
});

bot.hears(/^!?кик$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  if (!isGroup(ctx)) return ctx.reply("❗ Только для групп.");

  const target = ctx.message.reply_to_message;
  if (!target?.from) return ctx.reply("❗ Ответьте на сообщение.");
  if (Number(target.from.id) === OWNER_ID) return ctx.reply("❌ Владелец защищён.");

  try {
    await ctx.telegram.banChatMember(ctx.chat.id, target.from.id);
    await ctx.telegram.unbanChatMember(ctx.chat.id, target.from.id, { only_if_banned: true });
    await ctx.reply(`👋 ${target.from.first_name} удалён из группы.`);
  } catch (error) {
    await ctx.reply("❌ Ошибка кика.");
  }
});

bot.hears(/^!?удалить$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  if (!isGroup(ctx)) return ctx.reply("❗ Только для групп.");

  const target = ctx.message.reply_to_message;
  if (!target) return ctx.reply("❗ Ответьте на сообщение.");

  try {
    await ctx.telegram.deleteMessage(ctx.chat.id, target.message_id);
    try { await ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id); } catch {}
  } catch (error) {
    await ctx.reply("❌ Ошибка удаления.");
  }
});

bot.hears(/^!?баланс$/iu, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(`💰 ВАШ БАЛАНС\n\n👤 ${ecoName(u)}\n🪙 Кошелёк: ${u.balance}\n🏦 Банк: ${u.bank}\n💎 Всего: ${u.balance + u.bank}`);
});

bot.hears(/^!?бонус$/iu, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();

  if (now - u.lastBonus < ECO_BONUS_CD) {
    const left = ECO_BONUS_CD - (now - u.lastBonus);
    return ctx.reply(`⏳ Бонус уже получен.\nСледующий через: ${ecoTime(left)}`);
  }

  const bonusAmount = u.vip ? ECO_BONUS * 2 : ECO_BONUS;
  u.balance += bonusAmount;
  u.lastBonus = now;
  await ctx.reply(`🎁 БОНУС ПОЛУЧЕН!${u.vip ? " (2x VIP)" : ""}\n\n🪙 +${bonusAmount} монет\n💰 Баланс: ${u.balance}`);
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
    return ctx.reply(`⏳ Новое задание через: ${ecoTime(left)}`);
  }

  const reward = Math.floor(Math.random() * 301) + 200;
  u.balance += reward;
  u.lastTask = now;
  await ctx.reply(`🎯 ЗАДАНИЕ ВЫПОЛНЕНО!\n\n🪙 Награда: +${reward}\n💰 Баланс: ${u.balance}`);
});

bot.hears(/^!?профиль$/iu, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(`👤 ПРОФИЛЬ\n\n🆔 ID: ${u.id}\n👤 Имя: ${ecoName(u)}\n🪙 Кошелёк: ${u.balance}\n🏦 Банк: ${u.bank}`);
});

bot.catch((error) => console.error("BOT ERROR:", error));

bot.launch();
console.log("🔥 Bot started!");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
