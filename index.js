require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const fs = require("fs");

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("❌ CRITICAL ERROR: BOT_TOKEN is missing!");
  process.exit(1);
}

const bot = new Telegraf(token);
const DB_FILE = "./database.json";
const ADMINS = ["123456789"]; // Telegram ID администратора

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf8");
      return new Map(JSON.parse(data));
    }
  } catch (e) {
    console.error("Ошибка чтения БД:", e);
  }
  return new Map();
}

function saveDB() {
  try {
    const data = JSON.stringify(Array.from(economyUsers.entries()));
    fs.writeFileSync(DB_FILE, data, "utf8");
  } catch (e) {
    console.error("Ошибка сохранения БД:", e);
  }
}

const economyUsers = loadDB();

function ecoUser(ctx) {
  const id = String(ctx.from.id);
  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id: ctx.from.id,
      name: ctx.from.first_name || "Игрок",
      nickname: null,
      username: ctx.from.username || null,
      balance: 500000,
      bank: 2000000,
      credit: 0,
      experience: 0,
      level: 1,
      business: "Нет",
      bizIncome: 0,
      car: "Нет",
      house: "Нет",
      phone: "Нет",
      yacht: "Нет",
      helicopter: "Нет",
      plane: "Нет",
      mineGrid: null,
      wins: 0,
      losses: 0,
      lastBonus: 0,
      lastWork: 0,
      lastRob: 0,
      lastCrime: 0,
      invitedBy: null,
      referralsCount: 0
    });
    saveDB();
  } else {
    const u = economyUsers.get(id);
    u.name = ctx.from.first_name || u.name;
    u.username = ctx.from.username || u.username;
  }
  return economyUsers.get(id);
}

function ecoName(u) {
  if (u.nickname) return u.nickname;
  return u.username ? `@${u.username}` : u.name;
}

function addExp(u, amount) {
  u.experience += amount;
  if (u.experience >= u.level * 200) {
    u.level += 1;
    u.experience = 0;
    u.balance += u.level * 50000;
  }
  saveDB();
}

const CARS = [
  { name: "Matiz", price: 2000000 },
  { name: "Cobalt", price: 15000000 },
  { name: "Malibu Turbo", price: 60000000 },
  { name: "BMW M5 Competition", price: 180000000 },
  { name: "Lamborghini Huracan", price: 500000000 },
  { name: "Bugatti Chiron Super Sport", price: 2000000000 }
];

const HOUSES = [
  { name: "Студенческое общежитие", price: 10000000 },
  { name: "1-комнатная квартира", price: 40000000 },
  { name: "Дом за городом", price: 150000000 },
  { name: "Элитный коттедж", price: 500000000 },
  { name: "Пентхаус Skyline", price: 1500000000 },
  { name: "Личный остров и Замок", price: 5000000000 }
];

const BIZ = [
  { name: "Точка Фаст-Фуда", price: 100000000, income: 5000000 },
  { name: "Большой Супермаркет", price: 400000000, income: 22000000 },
  { name: "IT Стартап Компания", price: 1200000000, income: 75000000 },
  { name: "Нефтяные вышки и Завод", price: 5000000000, income: 350000000 }
];

const PHONES = [
  { name: "Nokia 3310", price: 500000 },
  { name: "Redmi Note 12", price: 4000000 },
  { name: "iPhone 15 Pro Max", price: 22000000 },
  { name: "Vertu Diamond Signature", price: 100000000 }
];

// ==================== ОСНОВНОЕ МЕНЮ & START ====================

bot.hears(/^(меню|menu|start|старт)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  
  const textPayload = ctx.message.text.split(" ")[1];
  if (textPayload && textPayload.startsWith("ref_") && !u.invitedBy && textPayload !== `ref_${ctx.from.id}`) {
    const inviterId = textPayload.replace("ref_", "");
    if (economyUsers.has(inviterId)) {
      u.invitedBy = inviterId;
      const inviter = economyUsers.get(inviterId);
      inviter.referralsCount++;
      inviter.balance += 100000;
      saveDB();
    }
  }

  await ctx.reply(
    `🤖 **MEGA ECONOMY EMPIRE BOT (ULTIMATE ELITE EDITION)**\n\n` +
    `👤 \`профиль\` — Личный кабинет и имущество\n` +
    `💰 \`баланс\` — Наличные, банк и кредиты\n` +
    `🏦 \`банк [сумма]\` / \`снять [сумма]\`\n` +
    `💳 \`кредит [сумма]\` / \`кредит погасить\`\n` +
    `🎁 \`бонус\` — Ежедневный мега-бонус\n` +
    `💼 \`работа\` — Работа и прокачка опыта\n` +
    `🦹‍♂️ \`грабеж\` / \`криминал\` — Рискованные преступления\n` +
    `🏢 \`бизнесы\` — Покупка бизнесов\n` +
    `🛒 \`магазин\` — Машины, дома, телефоны\n` +
    `👥 \`реф\` — Реферальная система\n` +
    `🏆 \`топ\` / \`богатые\` — Самые богатые игроки мира\n` +
    `💸 \`передать [ID] [сумма]\` — Перевод денег\n` +
    `⚙️ \`ник [имя]\` — Изменить никнейм\n\n` +
    `🎮 **Мини-игры:**\n` +
    `🔺 \`пирамида [ставка]\`\n` +
    `💣 \`мина [ставка]\` (7x7 Interactive)\n` +
    `📈 \`трейдинг [ставка]\`\n` +
    `🎲 \`кости [ставка]\`\n` +
    `🎰 \`слоты [ставка]\`\n\n` +
    (ADMINS.includes(String(ctx.from.id)) ? `👑 \`admin\` — Панель администратора` : ""),
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^(баланс|balance|бал)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `💰 **Ваш капитал:**\n\n` +
    `💵 Наличные: **$${u.balance.toLocaleString()}**\n` +
    `🏦 В банке: **$${u.bank.toLocaleString()}**\n` +
    `💳 Кредитный долг: **$${u.credit.toLocaleString()}**`,
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^(профиль|проф|profile)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `👤 **ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ:**\n\n` +
    `👨‍💼 Имя: **${ecoName(u)}**\n` +
    `🆔 ID: \`${u.id}\`\n` +
    `⭐ Уровень: **${u.level} LVL** (${u.experience}/${u.level * 200} XP)\n\n` +
    `💵 Наличные: **$${u.balance.toLocaleString()}**\n` +
    `🏦 Банк: **$${u.bank.toLocaleString()}**\n\n` +
    `🚘 Машина: **${u.car}**\n` +
    `🏠 Дом: **${u.house}**\n` +
    `📱 Телефон: **${u.phone}**\n` +
    `🏢 Бизнес: **${u.business}** (+$${u.bizIncome.toLocaleString()}/час)\n` +
    `👥 Рефералы: **${u.referralsCount} чел.**\n\n` +
    `🏆 Победы: ${u.wins} | Поражения: ${u.losses}`,
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^ник\s+(.+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const newNick = ctx.match[1].trim();
  if (newNick.length > 25) return ctx.reply("❌ Ник не должен превышать 25 символов!");
  u.nickname = newNick;
  saveDB();
  await ctx.reply(`✅ Ваш никнейм успешно изменен на: **${newNick}**`);
});

bot.hears(/^(реф|referral|referans)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const botUsername = ctx.botInfo.username;
  const refLink = `https://t.me/${botUsername}?start=ref_${u.id}`;
  await ctx.reply(
    `👥 **РЕФЕРАЛЬНАЯ СИСТЕМА**\n\n` +
    `Приглашайте друзей и получайте **$100,000** за каждого приглашенного игрока!\n\n` +
    `🔗 Ваша личная ссылка:\n\`${refLink}\`\n\n` +
    `📊 Приглашено друзей: **${u.referralsCount} чел.**`,
    { parse_mode: "Markdown" }
  );
});

// ==================== БАНК & КРЕДИТ ====================

bot.hears(/^банк\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[1]);
  if (!amount || amount <= 0) return ctx.reply("❌ Введите правильную сумму!");
  if (u.balance < amount) return ctx.reply("❌ У вас недостаточно наличных!");

  u.balance -= amount;
  u.bank += amount;
  saveDB();
  await ctx.reply(`🏦 В банк успешно внесено **$${amount.toLocaleString()}**!`);
});

bot.hears(/^снять\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[1]);
  if (!amount || amount <= 0) return ctx.reply("❌ Введите правильную сумму!");
  if (u.bank < amount) return ctx.reply("❌ В банке нет столько денег!");

  u.bank -= amount;
  u.balance += amount;
  saveDB();
  await ctx.reply(`💵 С банка снято **$${amount.toLocaleString()}**!`);
});

bot.hears(/^кредит\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[1]);
  if (u.credit > 0) return ctx.reply("❌ У вас уже есть непогашенный кредит!");
  if (amount <= 0 || amount > 1000000000) return ctx.reply("❌ Сумма кредита может быть от 1 до $1,000,000,000!");

  u.credit = Math.floor(amount * 1.3);
  u.balance += amount;
  saveDB();
  await ctx.reply(`💳 Вам выдан кредит на сумму **$${amount.toLocaleString()}**. Сумма к возврату (с учетом 30%): **$${u.credit.toLocaleString()}**`);
});

bot.hears(/^кредит\s+погасить$/i, async (ctx) => {
  const u = ecoUser(ctx);
  if (u.credit <= 0) return ctx.reply("❌ У вас нет кредитного долга!");
  if (u.balance < u.credit) return ctx.reply(`❌ У вас недостаточно наличных для погашения кредита! Нужно: $${u.credit.toLocaleString()}`);

  u.balance -= u.credit;
  u.credit = 0;
  saveDB();
  await ctx.reply("✅ Ваш кредит полностью погашен!");
});

// ==================== РАБОТА & БОНУСЫ ====================

bot.hears(/^(бонус|bonus)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastBonus < 86400000) {
    const hoursLeft = Math.ceil((86400000 - (now - u.lastBonus)) / 3600000);
    return ctx.reply(`⏳ Вы сможете получить ежедневный бонус через ${hoursLeft} ч.!`);
  }

  const reward = 100000 * u.level;
  u.balance += reward;
  u.lastBonus = now;
  addExp(u, 40);
  saveDB();
  await ctx.reply(`🎁 Получен ежедневный мега-бонус: **+$${reward.toLocaleString()}**!`);
});

bot.hears(/^(работа|work)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastWork < 180000) {
    return ctx.reply("⏳ Вы устали! Вы сможете снова выйти на работу через 3 минуты.");
  }

  const earned = Math.floor(Math.random() * 50000) + 20000 * u.level;
  u.balance += earned;
  u.lastWork = now;
  addExp(u, 25);
  saveDB();
  await ctx.reply(`💼 Рабочая смена завершена. Зарплата: **+$${earned.toLocaleString()}**!`);
});

bot.hears(/^(грабеж|rob|криминал)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastRob < 600000) {
    return ctx.reply("⏳ Вас разыскивает полиция! Подождите 10 минут.");
  }

  u.lastRob = now;
  const success = Math.random() < 0.45;
  if (success) {
    const loot = Math.floor(Math.random() * 200000) + 50000;
    u.balance += loot;
    addExp(u, 50);
    saveDB();
    await ctx.reply(`🦹‍♂️ Преступление прошло успешно! Добыча: **+$${loot.toLocaleString()}**`);
  } else {
    const fine = Math.floor(Math.random() * 100000) + 25000;
    u.balance = Math.max(0, u.balance - fine);
    saveDB();
    await ctx.reply(`🚨 Вас поймала полиция и выписала штраф: **-$${fine.toLocaleString()}**`);
  }
});

bot.hears(/^(топ|рейтинг|top|богатые)$/i, async (ctx) => {
  ecoUser(ctx);
  const usersArr = Array.from(economyUsers.values());
  usersArr.sort((a, b) => (b.balance + b.bank) - (a.balance + a.bank));

  let text = `🏆 **СПИСКИ ФОРБС: САМЫЕ БОГАТЫЕ ЛЮДИ МИРА**\n\n`;
  usersArr.slice(0, 10).forEach((user, i) => {
    text += `${i + 1}. **${ecoName(user)}** — $${(user.balance + user.bank).toLocaleString()}\n`;
  });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^передать\s+(\d+)\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const targetId = ctx.match[1];
  const amount = Number(ctx.match[2]);

  if (amount <= 0 || u.balance < amount) return ctx.reply("❌ Недостаточно средств или неверная сумма!");
  if (!economyUsers.has(targetId)) return ctx.reply("❌ Пользователь с таким ID не найден!");

  const targetUser = economyUsers.get(targetId);
  u.balance -= amount;
  targetUser.balance += amount;
  saveDB();

  await ctx.reply(`✅ Пользователю \`${targetId}\` успешно переведено **$${amount.toLocaleString()}**!`, { parse_mode: "Markdown" });
});

// ==================== МАГАЗИН & БИЗНЕС ====================

bot.hears(/^(магазин|shop)$/i, async (ctx) => {
  let text = `🛒 **ЭЛИТНЫЙ МАГАЗИН ТОВАРОВ**\n\n🚗 **Машины:**\n`;
  CARS.forEach((c, i) => { text += `${i+1}. ${c.name} — $${c.price.toLocaleString()} (\`купить маш ${i+1}\`)\n`; });
  text += `\n🏠 **Дома:**\n`;
  HOUSES.forEach((h, i) => { text += `${i+1}. ${h.name} — $${h.price.toLocaleString()} (\`купить дом ${i+1}\`)\n`; });
  text += `\n📱 **Телефоны:**\n`;
  PHONES.forEach((p, i) => { text += `${i+1}. ${p.name} — $${p.price.toLocaleString()} (\`купить тел ${i+1}\`)\n`; });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^(бизнесы|business)$/i, async (ctx) => {
  let text = `🏢 **ИМПЕРИЯ БИЗНЕСОВ**\n\n`;
  BIZ.forEach((b, i) => { text += `${i+1}. ${b.name} — Цена: $${b.price.toLocaleString()} | Доход: +$${b.income.toLocaleString()}/час (\`купить биз ${i+1}\`)\n`; });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^купить маш (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!CARS[idx]) return ctx.reply("❌ Такой машины не существует!");
  const car = CARS[idx];
  if (u.balance < car.price) return ctx.reply("❌ У вас недостаточно денег!");

  u.balance -= car.price;
  u.car = car.name;
  saveDB();
  await ctx.reply(`🚗 Поздравляем! Вы приобрели новую машину **${car.name}**!`);
});

bot.hears(/^купить дом (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!HOUSES[idx]) return ctx.reply("❌ Такого дома не существует!");
  const house = HOUSES[idx];
  if (u.balance < house.price) return ctx.reply("❌ У вас недостаточно денег!");

  u.balance -= house.price;
  u.house = house.name;
  saveDB();
  await ctx.reply(`🏠 Поздравляем! Вы приобрели **${house.name}**!`);
});

bot.hears(/^купить тел (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!PHONES[idx]) return ctx.reply("❌ такого телефона не существует!");
  const phone = PHONES[idx];
  if (u.balance < phone.price) return ctx.reply("❌ У вас недостаточно денег!");

  u.balance -= phone.price;
  u.phone = phone.name;
  saveDB();
  await ctx.reply(`📱 Поздравляем! Вы приобрели **${phone.name}**!`);
});

bot.hears(/^купить биз (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!BIZ[idx]) return ctx.reply("❌ Такого бизнеса не существует!");
  const biz = BIZ[idx];
  if (u.balance < biz.price) return ctx.reply("❌ У вас недостаточно денег!");

  u.balance -= biz.price;
  u.business = biz.name;
  u.bizIncome = biz.income;
  saveDB();
  await ctx.reply(`🏢 Поздравляем! Вы купили бизнес **${biz.name}**!`);
});

// ==================== МИНИ-ИГРЫ ====================

bot.hears(/^пирамида\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("❌ Введите правильную ставку!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств на балансе!");

  u.balance -= bet;
  saveDB();

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("💎 Ячейка 1", `pyr_${ctx.from.id}_${bet}_0`), Markup.button.callback("💎 Ячейка 2", `pyr_${ctx.from.id}_${bet}_1`)],
    [Markup.button.callback("💎 Ячейка 3", `pyr_${ctx.from.id}_${bet}_2`), Markup.button.callback("💎 Ячейка 4", `pyr_${ctx.from.id}_${bet}_3`)]
  ]);

  await ctx.reply(`🔺 **ИГРА ПИРАМИДА**\nСтавка: $${bet.toLocaleString()}\nВыберите удачную ячейку (х2 выигрыш):`, { parse_mode: "Markdown", ...keyboard });
});

bot.action(/^pyr_(\d+)_(\d+)_(\d+)$/, async (ctx) => {
  if (String(ctx.from.id) !== ctx.match[1]) return ctx.answerCbQuery("❌ Эта игра не ваша!", { show_alert: true });
  const bet = Number(ctx.match[2]);
  const chosen = Number(ctx.match[3]);
  const u = ecoUser(ctx);
  const winIdx = Math.floor(Math.random() * 4);

  let text = "";
  if (chosen === winIdx) {
    const prize = bet * 2;
    u.balance += prize;
    u.wins++;
    addExp(u, 15);
    saveDB();
    text = `🎉 **ВЫИГРЫШ!**\n\n💰 Награда: **+$${prize.toLocaleString()}**`;
  } else {
    u.losses++;
    saveDB();
    text = `💥 **ВЫ ПРОИГРАЛИ!**\n\n💸 Потеря: **-$${bet.toLocaleString()}**`;
  }
  await ctx.editMessageText(text, { parse_mode: "Markdown" }).catch(() => {});
  await ctx.answerCbQuery();
});

bot.hears(/^мина\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("❌ Введите правильную ставку!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств на балансе!");

  u.balance -= bet;
  u.mineGrid = { bet, opened: 0 };
  saveDB();

  const rows = [];
  for (let r = 0; r < 7; r++) {
    const rowBtns = [];
    for (let c = 0; c < 7; c++) {
      rowBtns.push(Markup.button.callback("⬜", `mine_${ctx.from.id}_${r}_${c}`));
    }
    rows.push(rowBtns);
  }
  const keyboard = Markup.inlineKeyboard(rows);

  await ctx.reply(`💣 **МИННОЕ ПОЛЕ 7x7**\nСтавка: $${bet.toLocaleString()}\nВыберите безопасную ячейку:`, { parse_mode: "Markdown", ...keyboard });
});

bot.action(/^mine_(\d+)_(\d+)_(\d+)$/, async (ctx) => {
  const targetId = ctx.match[1];
  if (String(ctx.from.id) !== targetId) return ctx.answerCbQuery("❌ Эта игра не ваша!", { show_alert: true });
  
  const u = ecoUser(ctx);
  if (!u.mineGrid) return ctx.answerCbQuery("❌ Игра не найдена!", { show_alert: true });

  const isBomb = Math.random() < 0.22;
  if (isBomb) {
    u.losses++;
    const lostBet = u.mineGrid.bet;
    u.mineGrid = null;
    saveDB();
    await ctx.editMessageText(`💥 **БУМ! Мина взорвалась!**\n\n💸 Проигрыш: **-$${lostBet.toLocaleString()}**`, { parse_mode: "Markdown" }).catch(() => {});
    return ctx.answerCbQuery("Мина взорвалась!");
  } else {
    u.mineGrid.opened++;
    const multiplier = 1 + (u.mineGrid.opened * 0.35);
    const currentPrize = Math.floor(u.mineGrid.bet * multiplier);
    saveDB();
    await ctx.answerCbQuery(`+$${currentPrize.toLocaleString()} (Отлично!)`);
  }
});

bot.hears(/^трейдинг\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("❌ Введите ставку!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств на балансе!");

  u.balance -= bet;
  saveDB();

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("📈 LONG (Рост)", `tr_${ctx.from.id}_${bet}_up`), Markup.button.callback("📉 SHORT (Падение)", `tr_${ctx.from.id}_${bet}_down`)]
  ]);

  await ctx.reply(`📈 **WALL STREET ТРЕЙДИНГ**\nСтавка: $${bet.toLocaleString()}\nВыберите направление рынка:`, { parse_mode: "Markdown", ...keyboard });
});

bot.action(/^tr_(\d+)_(\d+)_([a-z]+)$/, async (ctx) => {
  if (String(ctx.from.id) !== ctx.match[1]) return ctx.answerCbQuery("❌ Эта игра не ваша!", { show_alert: true });
  const bet = Number(ctx.match[2]);
  const choice = ctx.match[3];
  const u = ecoUser(ctx);
  const actual = Math.random() < 0.5 ? "up" : "down";

  let text = "";
  if (choice === actual) {
    const prize = Math.floor(bet * 2.1);
    u.balance += prize;
    u.wins++;
    addExp(u, 15);
    saveDB();
    text = `🚀 **Успешный трейд!**\n\n💰 Прибыль: **+$${prize.toLocaleString()}**`;
  } else {
    u.losses++;
    saveDB();
    text = `📉 **Ликвидация! Рынок пошел в другую сторону.**\n\n💸 Потеря: **-$${bet.toLocaleString()}**`;
  }
  await ctx.editMessageText(text, { parse_mode: "Markdown" }).catch(() => {});
  await ctx.answerCbQuery();
});

bot.hears(/^кости\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("❌ Введите ставку!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств на балансе!");

  u.balance -= bet;
  saveDB();

  const userDice = Math.floor(Math.random() * 6) + 1;
  const botDice = Math.floor(Math.random() * 6) + 1;

  let text = `🎲 **ИГРА В КОСТИ**\n\nВы выбросили: **${userDice}**\nБот выбросил: **${botDice}**\n\n`;
  if (userDice > botDice) {
    const prize = bet * 2;
    u.balance += prize;
    u.wins++;
    addExp(u, 12);
    text += `🎉 Победа! Награда: **+$${prize.toLocaleString()}**`;
  } else if (userDice === botDice) {
    u.balance += bet;
    text += `🤝 Ничья! Ставка возвращена.`;
  } else {
    u.losses++;
    text += `💥 Поражение! Потеря: **-$${bet.toLocaleString()}**`;
  }
  saveDB();
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^слоты\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("❌ Введите ставку!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств на балансе!");

  u.balance -= bet;
  saveDB();

  const symbols = ["🍒", "🍋", "🍊", "💎", "7️⃣"];
  const s1 = symbols[Math.floor(Math.random() * symbols.length)];
  const s2 = symbols[Math.floor(Math.random() * symbols.length)];
  const s3 = symbols[Math.floor(Math.random() * symbols.length)];

  let text = `🎰 **КАЗИНО СЛОТЫ**\n\n[ ${s1} | ${s2} | ${s3} ]\n\n`;
  if (s1 === s2 && s2 === s3) {
    const prize = s1 === "7️⃣" ? bet * 12 : bet * 6;
    u.balance += prize;
    u.wins++;
    addExp(u, 30);
    text += `ДЖЕКПОТ! Огромный выигрыш: **+$${prize.toLocaleString()}**`;
  } else if (s1 === s2 || s2 === s3 || s1 === s3) {
    const prize = Math.floor(bet * 1.6);
    u.balance += prize;
    u.wins++;
    addExp(u, 12);
    text += `🎉 Две одинаковые! Выигрыш: **+$${prize.toLocaleString()}**`;
  } else {
    u.losses++;
    text += `💥 Вы проиграли! Потеря: **-$${bet.toLocaleString()}**`;
  }
  saveDB();
  await ctx.reply(text, { parse_mode: "Markdown" });
});

// ==================== АДМИН ПАНЕЛЬ ====================

bot.hears(/^admin$/i, async (ctx) => {
  if (!ADMINS.includes(String(ctx.from.id))) return;
  await ctx.reply(
    `👑 **ПАНЕЛЬ АДМИНИСТРАТОРА**\n\n` +
    `➕ \`addbal [ID] [сумма]\` — Выдать деньги игроку\n` +
    `➖ \`delbal [ID] [сумма]\` — Забрать деньги у игрока\n` +
    `📢 \`sendall [текст]\` — Рассылка всем пользователям`,
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^addbal\s+(\d+)\s+(\d+)$/i, async (ctx) => {
  if (!ADMINS.includes(String(ctx.from.id))) return;
  const targetId = ctx.match[1];
  const amount = Number(ctx.match[2]);

  if (!economyUsers.has(targetId)) return ctx.reply("❌ Пользователь не найден!");
  const targetUser = economyUsers.get(targetId);
  targetUser.balance += amount;
  saveDB();
  await ctx.reply(`✅ Пользователю \`${targetId}\` добавлено $${amount.toLocaleString()}!`, { parse_mode: "Markdown" });
});

bot.hears(/^delbal\s+(\d+)\s+(\d+)$/i, async (ctx) => {
  if (!ADMINS.includes(String(ctx.from.id))) return;
  const targetId = ctx.match[1];
  const amount = Number(ctx.match[2]);

  if (!economyUsers.has(targetId)) return ctx.reply("❌ Пользователь не найден!");
  const targetUser = economyUsers.get(targetId);
  targetUser.balance = Math.max(0, targetUser.balance - amount);
  saveDB();
  await ctx.reply(`✅ У пользователя \`${targetId}\` списано $${amount.toLocaleString()}!`, { parse_mode: "Markdown" });
});

bot.hears(/^sendall\s+(.+)$/i, async (ctx) => {
  if (!ADMINS.includes(String(ctx.from.id))) return;
  const msg = ctx.match[1];
  let count = 0;
  for (const [id] of economyUsers.entries()) {
    try {
      await bot.telegram.sendMessage(id, `📢 **ОБЪЯВЛЕНИЕ:**\n\n${msg}`, { parse_mode: "Markdown" });
      count++;
    } catch (e) {}
  }
  await ctx.reply(`✅ Сообщение отправлено ${count} пользователям!`);
});

setInterval(() => {
  for (const [id, u] of economyUsers.entries()) {
    if (u.bizIncome > 0) {
      u.bank += u.bizIncome;
    }
  }
  saveDB();
}, 3600000);

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🚀 ULTIMATE ELITE ECONOMY BOT IS ONLINE!");
  } catch (err) {
    console.error("Ошибка:", err);
  }
}

startBot();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
