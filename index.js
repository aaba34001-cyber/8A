require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("❌ CRITICAL ERROR: BOT_TOKEN is missing!");
  process.exit(1);
}

const bot = new Telegraf(token);

const ADMIN_ID = 123456789; 

const economyUsers = new Map();

const fs = require("fs");
const DB_FILE = "./database.json";

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      const data = JSON.parse(raw);
      for (const [id, user] of Object.entries(data)) {
        economyUsers.set(id, user);
      }
      console.log(`✅ DB yuklandi: ${economyUsers.size} ta foydalanuvchi`);
    } else {
      console.log("ℹ️ database.json topilmadi, yangi baza yaratiladi");
    }
  } catch (e) {
    console.error("DB yuklashda xato:", e);
  }
}

function saveDB() {
  try {
    const obj = Object.fromEntries(economyUsers);
    fs.writeFileSync(DB_FILE, JSON.stringify(obj, null, 2));
  } catch (e) {
    console.error("DB saqlashda xato:", e);
  }
}

loadDB();

setInterval(saveDB, 15000);

process.on("exit", saveDB);
process.once("SIGINT", () => { saveDB(); process.exit(0); });
process.once("SIGTERM", () => { saveDB(); process.exit(0); });

const activeMinesGames = new Map();
const activePyramidGames = new Map();

function ecoUser(ctx) {
  const id = String(ctx.from.id);
  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id: ctx.from.id,
      name: ctx.from.first_name || "Игрок",
      nickname: null,
      username: ctx.from.username || null,
      balance: 50000,
      bank: 0,
      credit: 0,
      experience: 0,
      level: 1,
      business: "Отсутствует",
      bizIncome: 0,
      lastBizCollect: 0,
      car: "Отсутствует",
      house: "Отсутствует",
      phone: "Отсутствует",
      yacht: "Отсутствует",
      plane: "Отсутствует",
      lastBonus: 0,
      lastWork: 0,
      lastCrime: 0,
      wins: 0,
      losses: 0
    });
  } else {
    const u = economyUsers.get(id);
    u.name = ctx.from.first_name || u.name;
    u.username = ctx.from.username || u.username;
  }
  return economyUsers.get(id);
}

function ecoUserById(userId, name, username) {
  const id = String(userId);
  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id: userId,
      name: name || "Игрок",
      nickname: null,
      username: username || null,
      balance: 50000,
      bank: 0,
      credit: 0,
      experience: 0,
      level: 1,
      business: "Отсутствует",
      bizIncome: 0,
      lastBizCollect: 0,
      car: "Отсутствует",
      house: "Отсутствует",
      phone: "Отсутствует",
      yacht: "Отсутствует",
      plane: "Отсутствует",
      lastBonus: 0,
      lastWork: 0,
      lastCrime: 0,
      wins: 0,
      losses: 0
    });
  }
  return economyUsers.get(id);
}

function ecoName(u) {
  if (u.nickname) return u.nickname;
  return u.username ? `@${u.username}` : u.name;
}

function addExp(u, amount) {
  u.experience += amount;
  if (u.experience >= u.level * 100) {
    u.level += 1;
    u.experience = 0;
    u.balance += u.level * 25000;
  }
}

// ==================== CATALOG DATA ====================

const CARS = [
  { name: "🚲 Велосипед", price: 5000 },
  { name: "🛵 Электроскутер", price: 20000 },
  { name: "🏎 Chevrolet Spark", price: 60000 },
  { name: "🚘 Chevrolet Nexia 3", price: 100000 },
  { name: "🚘 Chevrolet Cobalt", price: 150000 },
  { name: "🚘 Chevrolet Gentra", price: 220000 },
  { name: "🏎 Chevrolet Malibu 2", price: 550000 },
  { name: "🏎 Chevrolet Tahoe", price: 1200000 },
  { name: "🏎 BMW M3 G80", price: 2000000 },
  { name: "🏎 BMW M5 CS", price: 3500000 },
  { name: "🏎 Mercedes-AMG GT63s", price: 5000000 },
  { name: "🏎 Porsche 911 Turbo S", price: 8000000 },
  { name: "🏎 Audi RS7 Sportback", price: 10000000 },
  { name: "🏎 Lamborghini Urus", price: 15000000 },
  { name: "🏎 Ferrari SF90 Stradale", price: 25000000 },
  { name: "🏎 Bugatti Chiron Sport", price: 50000000 },
  { name: "🏎 Rolls-Royce Phantom", price: 80000000 },
  { name: "🏎 Koenigsegg Jesko", price: 120000000 }
];

const HOUSES = [
  { name: "⛺️ Палатка в лесу", price: 10000 },
  { name: "🛋 Комната в общежитии", price: 50000 },
  { name: "🏠 Однокомнатная квартира", price: 300000 },
  { name: "🏡 Трехкомнатная новостройка", price: 1000000 },
  { name: "🏰 Двухэтажный дом", price: 3500000 },
  { name: "🏰 Роскошная вилла", price: 12000000 },
  { name: "🏰 Особняк на Рублевке", price: 40000000 },
  { name: "👑 VIP Пентхаус в Сити", price: 100000000 },
  { name: "🏝 Собственный тропический остров", price: 300000000 }
];

const PHONES = [
  { name: "📞 Nokia 3310", price: 3000 },
  { name: "📱 Xiaomi Redmi 13", price: 25000 },
  { name: "📱 Samsung S24 Ultra", price: 120000 },
  { name: "📱 iPhone 16 Pro Max 1TB", price: 300000 },
  { name: "💎 Gold Caviar iPhone", price: 3000000 }
];

const BIZ = [
  { name: "📦 Точка Paynet / Киоск", price: 150000, income: 8000 },
  { name: "🍔 Лавашная / Шаурмичная", price: 400000, income: 25000 },
  { name: "☕️ Уютная Кофейня", price: 1000000, income: 70000 },
  { name: "🛒 Сетевой Супермаркет", price: 3000000, income: 220000 },
  { name: "🏢 IT-Компания", price: 8000000, income: 650000 },
  { name: "🏨 Пятизвездочный Отель", price: 20000000, income: 1800000 },
  { name: "⛽️ Сеть Автозаправок (АЗС)", price: 60000000, income: 5500000 },
  { name: "💎 Завод по добыче золота", price: 150000000, income: 15000000 }
];

const YACHTS = [
  { name: "🚤 Катер Sea-Doo", price: 500000 },
  { name: "🛥 Моторная Яхта", price: 5000000 },
  { name: "🛳 Супер-Яхта Eclipse", price: 50000000 }
];

const PLANES = [
  { name: "🛩 Частный Самолет Cessna", price: 8000000 },
  { name: "✈️ Бизнес-джет Gulfstream", price: 45000000 },
  { name: "🚀 Личный Boeing 747", price: 200000000 }
];

// ==================== REPLY & ID TRANSFER ====================

bot.hears(/^(перевод|передать|perevod|per)(?:\s+(\d+))?(?:\s+(\d+))?$/i, async (ctx) => {
  const sender = ecoUser(ctx);
  const arg1 = ctx.match[2];
  const arg2 = ctx.match[3];

  let targetUser = null;
  let amount = 0;

  if (ctx.message.reply_to_message) {
    const replyMsg = ctx.message.reply_to_message;
    if (replyMsg.from.is_bot) return ctx.reply("❌ Нельзя переводить деньги ботам!");
    if (replyMsg.from.id === ctx.from.id) return ctx.reply("❌ Вы не можете переводить деньги самому себе!");

    amount = Number(arg1);
    if (!amount || amount <= 0) return ctx.reply("❌ Укажите сумму для перевода! Пример: `перевод 5000` (ответом на сообщение)");

    targetUser = ecoUserById(replyMsg.from.id, replyMsg.from.first_name, replyMsg.from.username);
  } else if (arg1 && arg2) {
    const targetId = String(arg1);
    amount = Number(arg2);

    if (targetId === String(ctx.from.id)) return ctx.reply("❌ Вы не можете переводить деньги самому себе!");
    if (!economyUsers.has(targetId)) return ctx.reply("❌ Пользователь не найден в базе бота!");

    targetUser = economyUsers.get(targetId);
  } else {
    return ctx.reply("💡 **Способы перевода:**\n1. Ответьте на сообщение игрока: `перевод [сумма]`\n2. По ID игрока: `перевод [ID] [сумма]`");
  }

  if (sender.balance < amount) return ctx.reply("❌ Недостаточно средств для перевода!");

  sender.balance -= amount;
  targetUser.balance += amount;

  await ctx.reply(`💸 Вы успешно перевели **${amount.toLocaleString()} монет** игроку **${ecoName(targetUser)}**!`);
});

// ==================== BANK & CREDIT ====================

bot.hears(/^(банк|bank)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `🏦 **ЦЕНТРАЛЬНЫЙ БАНК**\n\n` +
    `💼 Баланс в банке: **${u.bank.toLocaleString()} монет**\n` +
    `💵 Наличные средства: **${u.balance.toLocaleString()} монет**\n` +
    `🔻 Долг по кредиту: **${u.credit.toLocaleString()} монет**\n\n` +
    `📋 **Команды банка:**\n` +
    `• \`банк депозит [сумма]\` — положить деньги на счет\n` +
    `• \`банк снять [сумма]\` — снять деньги со счета\n` +
    `• \`кредит [сумма]\` — взять кредит в банке\n` +
    `• \`погасить [сумма]\` — выплатить долг по кредиту`
  );
});

bot.hears(/^(банк|bank) (депозит|положить) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[3]);
  if (!amount || amount <= 0 || u.balance < amount) return ctx.reply("❌ Недостаточно наличных денег!");

  u.balance -= amount;
  u.bank += amount;
  await ctx.reply(`🏦 Вы успешно положили в банк **${amount.toLocaleString()} монет**.\n💳 Счет в банке: **${u.bank.toLocaleString()} монет**.`);
});

bot.hears(/^(банк|bank) (снять|вывести) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[3]);
  if (!amount || amount <= 0 || u.bank < amount) return ctx.reply("❌ На вашем банковском счету нет такой суммы!");

  u.bank -= amount;
  u.balance += amount;
  await ctx.reply(`🏦 Вы успешно сняли со счета **${amount.toLocaleString()} монет**.\n💰 На руках: **${u.balance.toLocaleString()} монет**.`);
});

bot.hears(/^(кредит) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[2]);
  const maxCredit = u.level * 100000;

  if (u.credit > 0) return ctx.reply(`❌ У вас уже есть непогашенный кредит: **${u.credit.toLocaleString()} монет**!`);
  if (amount > maxCredit) return ctx.reply(`❌ Максимальный кредит для вашего уровня: **${maxCredit.toLocaleString()} монет**!`);

  const toPay = Math.floor(amount * 1.15);
  u.credit = toPay;
  u.balance += amount;
  await ctx.reply(`💳 Вы получили кредит в размере **${amount.toLocaleString()} монет**.\n📈 К возврату (с 15% комиссией): **${toPay.toLocaleString()} монет**.`);
});

bot.hears(/^(погасить|pogashat) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[2]);

  if (u.credit <= 0) return ctx.reply("🎉 У вас нет задолженностей по кредиту!");
  if (amount <= 0 || u.balance < amount) return ctx.reply("❌ Недостаточно наличных монет!");

  const pay = Math.min(amount, u.credit);
  u.balance -= pay;
  u.credit -= pay;
  await ctx.reply(`✅ Вы выплатили **${pay.toLocaleString()} монет**.\n💳 Оставшийся долг: **${u.credit.toLocaleString()} монет**.`);
});

// ==================== NICKNAME ====================

bot.hears(/^(ник|nick) (.+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const newNick = ctx.match[2].trim();
  if (newNick.length > 20) return ctx.reply("❌ Ник слишком длинный! (макс. 20 символов)");

  u.nickname = newNick;
  await ctx.reply(`✅ Ваш новый никнейм успешно установлен: **${newNick}**`);
});

// ==================== SHOP & CARS ====================

bot.hears(/^(магазин|magazin|shop)$/i, async (ctx) => {
  await ctx.reply(
    `🛒 **ГЛАВНЫЙ СУПЕРМАРКЕТ И РЫНОК**\n\n` +
    `🚘 **Автосалон:** \`автосалон\` или \`магазин машины\`\n` +
    `🏠 **Недвижимость:** \`недвижимость\` или \`магазин дома\`\n` +
    `📱 **Электроника:** \`телефоны\` или \`магазин телефоны\`\n` +
    `🏢 **Бизнес-Центр:** \`бизнесы\` или \`магазин бизнес\`\n` +
    `🛥 **Яхт-Клуб:** \`яхты\` | ✈️ **Авиасалон:** \`авиасалон\`\n\n` +
    `💡 *Чтобы купить предмет, скопируйте команду рядом с ним!*`
  );
});

bot.hears(/^((магазин|magazin) (машины|авто|mashina)|автосалон)$/i, async (ctx) => {
  let text = `🚘 **АВТОСАЛОН — ДОСТУПНЫЕ МАШИНЫ**\n\n💡 *Нажмите на команду, чтобы скопировать и отправить:*\n\n`;
  CARS.forEach((c, i) => {
    text += `${i + 1}. **${c.name}**\n💰 Цена: **${c.price.toLocaleString()} монет**\n👉 Купить: \`купить машину ${i + 1}\`\n\n`;
  });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^((магазин|magazin) (дома|дом|dom)|недвижимость)$/i, async (ctx) => {
  let text = `🏠 **РЫНОК НЕДВИЖИМОСТИ**\n\n💡 *Нажмите на команду, чтобы скопировать:*\n\n`;
  HOUSES.forEach((h, i) => {
    text += `${i + 1}. **${h.name}**\n💰 Цена: **${h.price.toLocaleString()} монет**\n👉 Купить: \`купить дом ${i + 1}\`\n\n`;
  });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^((магазин|magazin) (телефоны|телефон)|телефоны)$/i, async (ctx) => {
  let text = `📱 **МАГАЗИН ЭЛЕКТРОНИКИ**\n\n`;
  PHONES.forEach((p, i) => {
    text += `${i + 1}. **${p.name}**\n💰 Цена: **${p.price.toLocaleString()} монет**\n👉 Купить: \`купить телефон ${i + 1}\`\n\n`;
  });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^((магазин|magazin) (бизнес|бизнесы)|бизнесы|бизнес)$/i, async (ctx) => {
  let text = `🏢 **БИРЖА ГОТОВОГО БИЗНЕСА**\n\n`;
  BIZ.forEach((b, i) => {
    text += `${i + 1}. **${b.name}**\n💰 Цена: **${b.price.toLocaleString()}** | 📈 Доход: **+${b.income.toLocaleString()}/час**\n👉 Купить: \`купить бизнес ${i + 1}\`\n\n`;
  });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^((магазин|magazin) (яхты|яхта)|яхты)$/i, async (ctx) => {
  let text = `🛥 **ЯХТ-КЛУБ**\n\n`;
  YACHTS.forEach((y, i) => {
    text += `${i + 1}. **${y.name}**\n💰 Цена: **${y.price.toLocaleString()} монет**\n👉 Купить: \`купить яхту ${i + 1}\`\n\n`;
  });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^((магазин|magazin) (самолеты|самолет)|авиасалон|самолеты)$/i, async (ctx) => {
  let text = `✈️ **АВИАСАЛОН**\n\n`;
  PLANES.forEach((p, i) => {
    text += `${i + 1}. **${p.name}**\n💰 Цена: **${p.price.toLocaleString()} монет**\n👉 Купить: \`купить самолет ${i + 1}\`\n\n`;
  });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

// PURCHASES
bot.hears(/^(купить|sotib) (машину|авто) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[3]) - 1;
  if (!CARS[idx]) return ctx.reply("❌ Такой машины нет в каталоге!");
  const item = CARS[idx];
  if (u.balance < item.price) return ctx.reply(`❌ Недостаточно монет! Вам не хватает **${(item.price - u.balance).toLocaleString()} монет**.`);

  u.balance -= item.price;
  u.car = item.name;
  addExp(u, 30);
  await ctx.reply(`🎉 Поздравляем! Вы успешно купили **${item.name}**!`);
});

bot.hears(/^(купить|sotib) (дом) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[3]) - 1;
  if (!HOUSES[idx]) return ctx.reply("❌ Такого дома нет в каталоге!");
  const item = HOUSES[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= item.price;
  u.house = item.name;
  addExp(u, 50);
  await ctx.reply(`🏡 Поздравляем! Ваше новое жилье: **${item.name}**!`);
});

bot.hears(/^(купить|sotib) (телефон) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[3]) - 1;
  if (!PHONES[idx]) return ctx.reply("❌ Такого телефона нет!");
  const item = PHONES[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= item.price;
  u.phone = item.name;
  addExp(u, 15);
  await ctx.reply(`📱 Вы купили новый телефон: **${item.name}**!`);
});

bot.hears(/^(купить|sotib) (бизнес) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[3]) - 1;
  if (!BIZ[idx]) return ctx.reply("❌ Такого бизнеса нет!");
  const item = BIZ[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= item.price;
  u.business = item.name;
  u.bizIncome = item.income;
  u.lastBizCollect = Date.now();
  addExp(u, 120);
  await ctx.reply(`🏢 Поздравляем! Вы стали владельцем бизнеса **${item.name}**!\n📈 Доход: **+${item.income.toLocaleString()} монет/час**.\n\nСобирать прибыль: \`прибыль\``);
});

bot.hears(/^(купить|sotib) (яхту) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[3]) - 1;
  if (!YACHTS[idx]) return ctx.reply("❌ Такой яхты нет!");
  const item = YACHTS[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= item.price;
  u.yacht = item.name;
  addExp(u, 80);
  await ctx.reply(`🛥 Вы купили роскошную яхту: **${item.name}**!`);
});

bot.hears(/^(купить|sotib) (самолет) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[3]) - 1;
  if (!PLANES[idx]) return ctx.reply("❌ Такого самолета нет!");
  const item = PLANES[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= item.price;
  u.plane = item.name;
  addExp(u, 150);
  await ctx.reply(`✈️ Вы купили личный самолет: **${item.name}**!`);
});

bot.hears(/^(прибыль|pribil|доход)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  if (u.bizIncome <= 0) return ctx.reply("❌ У вас пока нет ни одного бизнеса!");

  const now = Date.now();
  const diffHours = (now - u.lastBizCollect) / 3600000;
  if (diffHours < 0.05) return ctx.reply("⏳ Бизнес еще не принес достаточно прибыли. Подождите немного!");

  const earned = Math.floor(diffHours * u.bizIncome);
  u.lastBizCollect = now;
  u.balance += earned;
  addExp(u, 15);
  await ctx.reply(`💰 Ваш бизнес (**${u.business}**) принес вам **+${earned.toLocaleString()} монет** прибыли!`);
});

// ==================== WORK & CRIME ====================

bot.hears(/^(работа|work|работать)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastWork < 60000) {
    const rem = Math.ceil((60000 - (now - u.lastWork)) / 1000);
    return ctx.reply(`⏳ Вы устали! Отдохните **${rem} сек.** перед следующей работой.`);
  }
  u.lastWork = now;
  const jobs = [
    "разработчиком в IT компании", "таксистом на премиум авто", "курьером еды", 
    "финансовым аналитиком", "шеф-поваром в ресторане", "инженером на заводе"
  ];
  const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
  let reward = Math.floor(Math.random() * 12000) + 4000 + (u.level * 1000);
  u.balance += reward;
  addExp(u, 20);
  await ctx.reply(`👨‍💻 Вы поработали **${randomJob}** и заработали **+${reward.toLocaleString()} монет**!`);
});

bot.hears(/^(ограбление|crime|криминал)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastCrime < 120000) {
    const rem = Math.ceil((120000 - (now - u.lastCrime)) / 1000);
    return ctx.reply(`⏳ Полиция ищет вас! Затаитесь на **${rem} сек.**`);
  }
  u.lastCrime = now;

  if (Math.random() < 0.40) {
    let reward = Math.floor(Math.random() * 35000) + 10000;
    u.balance += reward;
    addExp(u, 30);
    await ctx.reply(`🥷 Успешное дело! Вы взломали банкомат и забрали **+${reward.toLocaleString()} монет**!`);
  } else {
    let penalty = Math.floor(u.balance * 0.20);
    u.balance -= penalty;
    await ctx.reply(`🚨 Вас поймала полиция! Вы заплатили штраф в размере **-${penalty.toLocaleString()} монет**.`);
  }
});

bot.hears(/^(бонус|bonus)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastBonus < 86400000) {
    const hours = Math.ceil((86400000 - (now - u.lastBonus)) / 3600000);
    return ctx.reply(`⏳ Ежедневный бонус доступен через **${hours} ч.**`);
  }
  u.lastBonus = now;
  let reward = 100000 + (u.level * 10000);
  u.balance += reward;
  addExp(u, 40);
  await ctx.reply(`🎁 Вы получили ваш ежедневный бонус: **+${reward.toLocaleString()} монет**!`);
});

// ==================== PIRAMIDA & GAMES ====================

bot.hears(/^(пирамида|pyramid) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);

  if (!bet || bet < 100) return ctx.reply("❌ Минимальная ставка: 100!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств на балансе!");

  u.balance -= bet;
  const userId = ctx.from.id;

  activePyramidGames.set(userId, {
    bet,
    level: 1,
    mults: [1.4, 2.0, 3.0, 5.0, 8.0],
    trap: Math.floor(Math.random() * 4)
  });

  await renderPyramid2x2(ctx, userId);
});

async function renderPyramid2x2(ctx, userId) {
  const g = activePyramidGames.get(userId);
  if (!g) return;

  const buttons = [
    [
      Markup.button.callback("❓ [1]", "pyr2_0"),
      Markup.button.callback("❓ [2]", "pyr2_1")
    ],
    [
      Markup.button.callback("❓ [3]", "pyr2_2"),
      Markup.button.callback("❓ [4]", "pyr2_3")
    ]
  ];

  const curWin = Math.floor(g.bet * (g.level === 1 ? 1 : g.mults[g.level - 2]));
  if (g.level > 1) {
    buttons.push([Markup.button.callback(`💰 Забрать выигрыш (${curWin.toLocaleString()})`, "pyr2_take")]);
  }

  const text = `🔺 **ПИРАМИДА 2x2 (Уровень ${g.level}/5)**\n\n🎯 Множитель: **x${g.mults[g.level - 1]}**\n💵 Текущий выигрыш: **${curWin.toLocaleString()} монет**\n\nВыберите безопасную ячейку:`;

  if (ctx.callbackQuery) await ctx.editMessageText(text, Markup.inlineKeyboard(buttons));
  else await ctx.reply(text, Markup.inlineKeyboard(buttons));
}

bot.action(/^pyr2_(\d+)$/, async (ctx) => {
  const userId = ctx.from.id;
  const g = activePyramidGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ Игра уже завершена!", { show_alert: true });

  const choice = Number(ctx.match[1]);

  if (choice === g.trap) {
    const u = ecoUser(ctx);
    u.losses += 1;
    activePyramidGames.delete(userId);
    return ctx.editMessageText(`💥 **ВЗРЫВ!** Вы попали на ловушку и потеряли **-${g.bet.toLocaleString()} монет**.`);
  }

  if (g.level >= 5) {
    const win = Math.floor(g.bet * g.mults[4]);
    const u = ecoUser(ctx);
    u.balance += win;
    u.wins += 1;
    addExp(u, 50);
    activePyramidGames.delete(userId);
    return ctx.editMessageText(`🏆 **ГРАНДИОЗНАЯ ПОБЕДА!** Вы прошли все 5 уровней и выиграли **+${win.toLocaleString()} монет**!`);
  }

  g.level += 1;
  g.trap = Math.floor(Math.random() * 4);
  await renderPyramid2x2(ctx, userId);
});

bot.action("pyr2_take", async (ctx) => {
  const userId = ctx.from.id;
  const g = activePyramidGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ Игра уже завершена!", { show_alert: true });

  const win = Math.floor(g.bet * g.mults[g.level - 2]);
  const u = ecoUser(ctx);
  u.balance += win;
  u.wins += 1;
  activePyramidGames.delete(userId);
  await ctx.editMessageText(`🤑 **ВЫИГРЫШ ЗАБРАН!** Вы забрали **+${win.toLocaleString()} монет**!`);
});

// MINES 7x7
bot.hears(/^(мина|мины|mines) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);

  if (!bet || bet < 500) return ctx.reply("❌ Минимальная ставка: 500!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;
  const userId = ctx.from.id;

  const mines = new Set();
  while (mines.size < 10) mines.add(Math.floor(Math.random() * 49));

  activeMinesGames.set(userId, { bet, mines, revealed: new Set(), mult: 1.0 });
  await renderMinesGrid(ctx, userId, "💣 **МИННОЕ ПОЛЕ (7x7)**");
});

async function renderMinesGrid(ctx, userId, title) {
  const g = activeMinesGames.get(userId);
  if (!g) return;

  const buttons = [];
  for (let r = 0; r < 7; r++) {
    const row = [];
    for (let c = 0; c < 7; c++) {
      const idx = r * 7 + c;
      if (g.revealed.has(idx)) row.push(Markup.button.callback("💎", "mines_ignore"));
      else row.push(Markup.button.callback("🟦", `mine_step_${idx}`));
    }
    buttons.push(row);
  }

  const curWin = Math.floor(g.bet * g.mult);
  buttons.push([Markup.button.callback(`💰 Забрать выигрыш (${curWin.toLocaleString()})`, "mines_take")]);

  const text = `${title}\n\n📊 Множитель: **x${g.mult.toFixed(2)}**\n💵 Текущий выигрыш: **${curWin.toLocaleString()} монет**`;

  if (ctx.callbackQuery) await ctx.editMessageText(text, Markup.inlineKeyboard(buttons));
  else await ctx.reply(text, Markup.inlineKeyboard(buttons));
}

bot.action(/^mine_step_(\d+)$/, async (ctx) => {
  const userId = ctx.from.id;
  const g = activeMinesGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ Игра завершена!", { show_alert: true });

  const idx = Number(ctx.match[1]);

  if (g.mines.has(idx)) {
    const u = ecoUser(ctx);
    u.losses += 1;
    activeMinesGames.delete(userId);
    return ctx.editMessageText(`💥 **БОМБА ВЗОРВАЛАСЬ!** Вы потеряли **-${g.bet.toLocaleString()} монет**.`);
  }

  g.revealed.add(idx);
  g.mult += 0.35;
  await renderMinesGrid(ctx, userId, "💣 **МИННОЕ ПОЛЕ (7x7)**");
});

bot.action("mines_take", async (ctx) => {
  const userId = ctx.from.id;
  const g = activeMinesGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ Игра завершена!", { show_alert: true });

  const win = Math.floor(g.bet * g.mult);
  const u = ecoUser(ctx);
  u.balance += win;
  u.wins += 1;
  addExp(u, 35);
  activeMinesGames.delete(userId);
  await ctx.editMessageText(`🤑 **ВЫИГРЫШ ЗАБРАН!** Вы выиграли **+${win.toLocaleString()} монет**!`);
});

bot.action("mines_ignore", (ctx) => ctx.answerCbQuery());

// STANDARD CASINO
function playStandardGame(ctx, bet, winRate, winMult, title) {
  const u = ecoUser(ctx);
  if (!bet || bet <= 0 || u.balance < bet) return ctx.reply("❌ Недостаточно средств на балансе!");

  u.balance -= bet;
  if (Math.random() < winRate) {
    const prize = Math.floor(bet * winMult);
    u.balance += prize;
    u.wins += 1;
    addExp(u, 12);
    return ctx.reply(`${title}\n🎉 **ПОБЕДА!** Ваш выигрыш: **+${prize.toLocaleString()} монет**!`);
  } else {
    u.losses += 1;
    return ctx.reply(`${title}\n📉 **ПРОИГРЫШ!** Вы потеряли **-${bet.toLocaleString()} монет**.`);
  }
}

bot.hears(/^(краш|crash) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.30, 2.5, "🚀 **CRASH GAME**"));
bot.hears(/^(трейдинг|trade) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.40, 1.8, "📊 **БИРЖЕВОЙ ТРЕЙДИНГ**"));
bot.hears(/^(казино|casino) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.35, 2.0, "🎰 **КАЗИНО**"));
bot.hears(/^(кубик|dice) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.35, 2.0, "🎲 **ИГРА В КОСТИ**"));
bot.hears(/^(слоты|slots) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.25, 3.5, "🎰 **СЛОТ-МАШИНА**"));
bot.hears(/^(монетка|flip) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.40, 1.9, "🪙 **ОРЕЛ ИЛИ РЕШКА**"));
bot.hears(/^(рулетка) (красное|черное) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[3]), 0.40, 1.95, "🎡 **РУЛЕТКА**"));
bot.hears(/^(дартс|darts) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.30, 2.2, "🎯 **ДАРТС**"));
bot.hears(/^(баскетбол|basket) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.30, 2.2, "🏀 **БАСКЕТБОЛ**"));
bot.hears(/^(футбол|football) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.35, 2.0, "⚽ **ФУТБОЛ**"));
bot.hears(/^(покер|poker) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.30, 2.5, "🃏 **ПОКЕР**"));
bot.hears(/^(блекджек|bj) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.35, 2.0, "🂡 **БЛЕКДЖЕК**"));
bot.hears(/^(сейф|safe) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.18, 5.5, "🔐 **ВЗЛОМ СЕЙФА**"));
bot.hears(/^(колесо|wheel) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.30, 2.5, "🎡 **КОЛЕСО УДАЧИ**"));
bot.hears(/^(дуэль|duel) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.40, 1.9, "⚔️ **ДУЭЛЬ**"));
bot.hears(/^(скачки|race) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.25, 3.0, "🐎 **КОННЫЕ СКАЧКИ**"));

// ==================== ADMIN COMMANDS ====================

bot.hears(/^(выдать) (\d+) (\d+)$/i, async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const targetId = String(ctx.match[2]);
  const amount = Number(ctx.match[3]);

  if (economyUsers.has(targetId)) {
    const u = economyUsers.get(targetId);
    u.balance += amount;
    await ctx.reply(`👑 **ADMIN:** Выдали **+${amount.toLocaleString()} монет** игроку **${ecoName(u)}**.`);
  } else {
    await ctx.reply("❌ Пользователь не найден!");
  }
});

// ==================== PROFILE, TOP & MENU ====================

bot.hears(/^(богатые|топ|top)$/i, async (ctx) => {
  if (economyUsers.size === 0) return ctx.reply("📊 Список пока пуст!");
  const usersArr = Array.from(economyUsers.values());
  usersArr.sort((a, b) => (b.balance + b.bank) - (a.balance + a.bank));

  let text = `🏆 **ТОП-10 САМЫХ БОГАТЫХ ИГРОКОВ**\n\n`;
  usersArr.slice(0, 10).forEach((u, i) => {
    text += `${i + 1}. **${ecoName(u)}** — **${(u.balance + u.bank).toLocaleString()} монет** (Уровень: ${u.level})\n`;
  });
  await ctx.reply(text);
});

bot.hears(/^(баланс|balans)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(`💰 **ВАШИ ФИНАНСЫ:**\n\n💵 Наличными: **${u.balance.toLocaleString()} монет**\n🏦 В банке: **${u.bank.toLocaleString()} монет**\n💳 Кредит: **${u.credit.toLocaleString()} монет**`);
});

bot.hears(/^(профиль|проф|profile)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `👤 **ПРОФИЛЬ ИГРОКА:**\n\n` +
    `👨‍💼 Имя: **${ecoName(u)}**\n` +
    `🆔 ID: \`${u.id}\`\n` +
    `⭐ Уровень: **${u.level} LVL** (${u.experience}/${u.level * 100} EXP)\n\n` +
    `💰 Наличные: **${u.balance.toLocaleString()} монет**\n` +
    `🏦 Банк: **${u.bank.toLocaleString()} монет**\n` +
    `💳 Кредит: **${u.credit.toLocaleString()} монет**\n\n` +
    `🚘 Авто: **${u.car}**\n` +
    `🏠 Дом: **${u.house}**\n` +
    `📱 Телефон: **${u.phone}**\n` +
    `🛥 Яхта: **${u.yacht}**\n` +
    `✈️ Самолет: **${u.plane}**\n` +
    `🏢 Бизнес: **${u.business}** (+${u.bizIncome.toLocaleString()}/час)\n\n` +
    `📊 Статистика: 🟢 Побед: ${u.wins} | 🔴 Поражений: ${u.losses}`
  );
});

bot.hears(/^(игры|меню|menu|start|старт)$/i, async (ctx) => {
  await ctx.reply(
    `📜 **ПОЛНОЕ МЕНЮ И КОМАНДЫ БОТА**\n\n` +
    `🏦 **Банк и Кредиты:**\n` +
    `• \`банк\` — Главная страница банка\n` +
    `• \`банк депозит [сумма]\` / \`банк снять [сумма]\`\n` +
    `• \`кредит [сумма]\` — Взять денежный кредит\n` +
    `• \`погасить [сумма]\` — Выплатить кредит\n\n` +
    `🔄 **Переводы и Настройки:**\n` +
    `• \`перевод [сумма]\` — Перевод ответом на сообщение (Reply)\n` +
    `• \`перевод [ID] [сумма]\` — Перевести по ID\n` +
    `• \`ник [имя]\` — Изменить свое имя в профиле\n\n` +
    `🛒 **Супермаркет и Имущество:**\n` +
    `• \`автосалон\` — Выбрать и купить машину\n` +
    `• \`недвижимость\` | \`бизнесы\` | \`телефоны\`\n` +
    `• \`прибыль\` — Собрать доход с бизнеса\n\n` +
    `💼 **Заработок:** \`работа\` | \`ограбление\` | \`бонус\`\n\n` +
    `📊 **Инфо:** \`баланс\` | \`профиль\` | \`богатые\``
  );
});

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🚀 BOT UPDATED WITH EXPLICIT BUY COMMANDS!");
  } catch (err) {
    console.error("Start Error:", err);
  }
}

startBot();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
