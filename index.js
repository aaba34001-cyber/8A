require("dotenv").config();
const { Telegraf } = require("telegraf");
const fs = require("fs");

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("❌ CRITICAL ERROR: BOT_TOKEN is missing!");
  process.exit(1);
}

const bot = new Telegraf(token);
const DB_FILE = "./database.json";

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf8");
      return new Map(JSON.parse(data));
    }
  } catch (e) {
    console.error("DB o'qishda xatolik:", e);
  }
  return new Map();
}

function saveDB() {
  try {
    const data = JSON.stringify(Array.from(economyUsers.entries()));
    fs.writeFileSync(DB_FILE, data, "utf8");
  } catch (e) {
    console.error("DB saqlashda xatolik:", e);
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
      balance: 5000000,
      bank: 2000000,
      credit: 0,
      experience: 0,
      level: 1,
      business: "Отсутствует",
      bizIncome: 0,
      car: "Отсутствует",
      house: "Отсутствует",
      phone: "Отсутствует",
      yacht: "Отсутствует",
      plane: "Отсутствует",
      helicopter: "Отсутствует",
      island: "Отсутствует",
      company: "Отсутствует",
      wins: 0,
      losses: 0,
      lastBonus: 0,
      lastWork: 0,
      lastRob: 0,
      lastCrime: 0
    });
    saveDB();
  } else {
    const u = economyUsers.get(id);
    u.name = ctx.from.first_name || u.name;
    u.username = ctx.from.username || u.username;
    if (u.helicopter === undefined) u.helicopter = "Отсутствует";
    if (u.island === undefined) u.island = "Отсутствует";
    if (u.company === undefined) u.company = "Отсутствует";
  }
  return economyUsers.get(id);
}

function ecoName(u) {
  if (u.nickname) return u.nickname;
  return u.username ? `@${u.username}` : u.name;
}

function addExp(u, amount) {
  u.experience += amount;
  if (u.experience >= u.level * 150) {
    u.level += 1;
    u.experience = 0;
    u.balance += u.level * 100000;
  }
  saveDB();
}

const CARS = [
  { name: "🚲 Велосипед", price: 5000 },
  { name: "🛹 Скейтборд", price: 10000 },
  { name: "🛴 Самокат", price: 15000 },
  { name: "🛵 Электроскутер", price: 30000 },
  { name: "🏍 Мопед Alpha", price: 50000 },
  { name: "🏎 Chevrolet Spark", price: 90000 },
  { name: "🚘 Chevrolet Nexia 3", price: 150000 },
  { name: "🚘 Chevrolet Cobalt", price: 220000 },
  { name: "🚘 Chevrolet Gentra", price: 350000 },
  { name: "🚘 Lada Vesta", price: 450000 },
  { name: "🏎 Hyundai Elantra", price: 700000 },
  { name: "🏎 Kia K5", price: 950000 },
  { name: "🏎 Chevrolet Malibu 2", price: 1300000 },
  { name: "🏎 Toyota Camry 70", price: 1800000 },
  { name: "🏎 Hyundai Palisade", price: 2500000 },
  { name: "🏎 Chevrolet Tahoe", price: 3500000 },
  { name: "🏎 BMW M3 G80", price: 5000000 },
  { name: "🏎 BMW M5 CS", price: 7500000 },
  { name: "🏎 Mercedes-AMG GT63s", price: 11000000 },
  { name: "🏎 Porsche 911 Turbo S", price: 16000000 },
  { name: "🏎 Audi RS7 Sportback", price: 22000000 },
  { name: "🏎 Lamborghini Urus", price: 30000000 },
  { name: "🏎 Ferrari SF90 Stradale", price: 45000000 },
  { name: "🏎 Aston Martin DBS", price: 60000000 },
  { name: "🏎 McLaren 720S", price: 80000000 },
  { name: "🏎 Bugatti Chiron Sport", price: 120000000 },
  { name: "🏎 Rolls-Royce Phantom", price: 180000000 },
  { name: "🏎 Koenigsegg Jesko", price: 250000000 },
  { name: "🚀 Batmobile Ultimate", price: 400000000 },
  { name: "👑 Cyberpunk Concept Car", price: 600000000 }
];

const HOUSES = [
  { name: "⛺️ Палатка в лесу", price: 20000 },
  { name: "🛖 Землянка", price: 60000 },
  { name: "🛋 Комната в общежитии", price: 150000 },
  { name: "🏡 Старая дача", price: 400000 },
  { name: "🏠 Однокомнатная квартира", price: 900000 },
  { name: "🏡 Трехкомнатная новостройка", price: 2500000 },
  { name: "🏘 Коттедж за городом", price: 6000000 },
  { name: "🏰 Двухэтажный особняк", price: 15000000 },
  { name: "🏰 Роскошная вилла с бассейном", price: 35000000 },
  { name: "🏰 Элитный особняк на Рублевке", price: 80000000 },
  { name: "👑 VIP Пентхаус в небоскребе", price: 150000000 },
  { name: "🏯 Старинный замок в Европе", price: 300000000 },
  { name: "🏝 Частный тропический остров", price: 700000000 },
  { name: "🪐 Футуристическая космическая база", price: 1500000000 }
];

const PHONES = [
  { name: "📞 Nokia 3310", price: 10000 },
  { name: "📱 Samsung J2 Prime", price: 40000 },
  { name: "📱 Redmi Note 12", price: 120000 },
  { name: "📱 Xiaomi 14 Ultra", price: 350000 },
  { name: "📱 Samsung S24 Ultra", price: 700000 },
  { name: "📱 iPhone 16 Pro Max 1TB", price: 1500000 },
  { name: "💎 Gold Caviar Diamond iPhone", price: 8000000 },
  { name: "👑 Vertu Signature Cobra", price: 25000000 }
];

const YACHTS = [
  { name: "🛶 Надувная лодка", price: 50000 },
  { name: "🚤 Катер Sea-Doo", price: 1000000 },
  { name: "🛥 Спортивная моторная яхта", price: 8000000 },
  { name: "🛳 Супер-Яхта Eclipse", price: 50000000 },
  { name: "👑 Плавучий мега-дворец 'Titan'", price: 250000000 }
];

const HELICOPTERS = [
  { name: "🚁 Легкий вертолет Robinson R22", price: 5000000 },
  { name: "🚁 Военный вертолет Apache", price: 45000000 },
  { name: "🚁 Элитный бизнес-вертолет VIP", price: 120000000 }
];

const PLANES = [
  { name: "🛩 Кукурузник Ан-2", price: 3000000 },
  { name: "🛩 Частный Самолет Cessna", price: 20000000 },
  { name: "✈️ Реактивный бизнес-джет Gulfstream", price: 100000000 },
  { name: "🚀 Личный лайнер Boeing 747 VIP", price: 500000000 }
];

const BIZ = [
  { name: "📦 Точка Paynet / Киоск", price: 300000, income: 15000 },
  { name: "☕️ Уютная Кофейня", price: 900000, income: 50000 },
  { name: "🍔 Лавашная / Шаурмичная", price: 2000000, income: 120000 },
  { name: "🛒 Сетевой Супермаркет", price: 6000000, income: 380000 },
  { name: "💊 Круглосуточная Аптека", price: 12000000, income: 750000 },
  { name: "🏋️‍♂️ Фитнес-Клуб 'Gym'", price: 25000000, income: 1600000 },
  { name: "🏢 IT-Компания", price: 55000000, income: 3800000 },
  { name: "🏨 Пятизвездочный Отель", price: 120000000, income: 8500000 },
  { name: "⛽️ Сеть Автозаправок (АЗС)", price: 250000000, income: 18000000 },
  { name: "💎 Завод по добыче золота", price: 600000000, income: 45000000 },
  { name: "🚀 Космический космодром", price: 1500000000, income: 120000000 }
];

bot.hears(/^(меню|menu|start|старт)$/i, async (ctx) => {
  await ctx.reply(
    `🤖 **УЛЬТРА-МЕНЮ ИГРОВОГО БОТА (В 10 РАЗ БОЛЬШЕ)**\n\n` +
    `👤 \`профиль\` — Полный профиль и имущество\n` +
    `💰 \`баланс\` — Состояние счетов\n` +
    `🏦 \`банк [сумма]\` / \`снять [сумма]\`\n` +
    `🎁 \`бонус\` — Ежедневная щедрая награда\n` +
    `💼 \`работа\` — Заработок на смене\n` +
    `🏢 \`бизнесы\` — Список бизнес-империй\n` +
    `🛒 \`магазин\` — Огромный автопарк, дома, авиация\n` +
    `🏆 \`богатые\` — Топ магнатов мира\n` +
    `🎮 \`игры\` — Мега-каталог из 35+ игр`,
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^(баланс|balance|бал)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `💰 **Баланс игрока:**\n\n` +
    `💵 Наличные: **${u.balance.toLocaleString()} монет**\n` +
    `🏦 В банке: **${u.bank.toLocaleString()} монет**\n` +
    `💳 Кредит: **${u.credit.toLocaleString()} монет**`,
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^(профиль|проф|profile)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `👤 **РАСШИРЕННЫЙ ПРОФИЛЬ:**\n\n` +
    `👨‍💼 Имя: **${ecoName(u)}**\n` +
    `🆔 ID: \`${u.id}\`\n` +
    `⭐ Уровень: **${u.level} LVL** (${u.experience}/${u.level * 150} EXP)\n\n` +
    `💵 Наличные: **${u.balance.toLocaleString()}**\n` +
    `🏦 Банк: **${u.bank.toLocaleString()}**\n\n` +
    `🚘 Авто: **${u.car}**\n` +
    `🏠 Дом: **${u.house}**\n` +
    `📱 Телефон: **${u.phone}**\n` +
    `🛥 Яхта: **${u.yacht}**\n` +
    `🚁 Вертолет: **${u.helicopter}**\n` +
    `✈️ Самолет: **${u.plane}**\n` +
    `🏢 Бизнес: **${u.business}** (+${u.bizIncome.toLocaleString()}/час)\n\n` +
    `🏆 Победы / Поражения: ${u.wins} / ${u.losses}`,
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^(богатые|топ|рейтинг|top)$/i, async (ctx) => {
  ecoUser(ctx);
  const usersArr = Array.from(economyUsers.values());
  usersArr.sort((a, b) => (b.balance + b.bank) - (a.balance + a.bank));

  let text = `🏆 **ТОП-10 ГЛОБАЛЬНЫХ МАГНАТОВ**\n\n`;
  usersArr.slice(0, 10).forEach((user, i) => {
    text += `${i + 1}. **${ecoName(user)}** — **${(user.balance + user.bank).toLocaleString()} монет**\n`;
  });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^(бонус|bonus)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastBonus < 24 * 60 * 60 * 1000) {
    return ctx.reply("⏳ Вы уже забирали бонус сегодня! Приходите завтра.");
  }
  const reward = 250000 * u.level;
  u.balance += reward;
  u.lastBonus = now;
  addExp(u, 50);
  saveDB();
  await ctx.reply(`🎁 Мега-бонус успешно получен: **+${reward.toLocaleString()} монет**!`);
});

bot.hears(/^(работа|work)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastWork < 10 * 60 * 1000) {
    return ctx.reply("⏳ Вы слишком устали. Отдохните еще немного перед сменой.");
  }
  const earned = Math.floor(Math.random() * 150000) + 50000;
  u.balance += earned;
  u.lastWork = now;
  addExp(u, 25);
  saveDB();
  await ctx.reply(`💼 Вы успешно отработали смену и заработали **+${earned.toLocaleString()} монет**!`);
});

bot.hears(/^банк\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[1]);
  if (u.balance < amount) return ctx.reply("❌ Недостаточно наличных денег!");
  u.balance -= amount;
  u.bank += amount;
  saveDB();
  await ctx.reply(`🏦 Внесено в банк: **${amount.toLocaleString()} монет**.`);
});

bot.hears(/^снять\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[1]);
  if (u.bank < amount) return ctx.reply("❌ В банке нет такой суммы!");
  u.bank -= amount;
  u.balance += amount;
  saveDB();
  await ctx.reply(`💵 Снято со счета: **${amount.toLocaleString()} монет**.`);
});

bot.hears(/^(маг|магазин|shop)$/i, async (ctx) => {
  let text = `🛒 **УЛЬТРА МАГАЗИН ИМУЩЕСТВА (30+ ТОВАРОВ)**\n\n`;
  text += `🚘 **Автомобили (\`купить авто [номер]\`):**\n`;
  CARS.slice(0, 15).forEach((c, i) => { text += `${i + 1}. ${c.name} — ${c.price.toLocaleString()}\n`; });

  text += `\n🏠 **Недвижимость (\`купить дом [номер]\`):**\n`;
  HOUSES.slice(0, 8).forEach((h, i) => { text += `${i + 1}. ${h.name} — ${h.price.toLocaleString()}\n`; });

  text += `\n📱 **Телефоны (\`купить телефон [номер]\`):**\n`;
  PHONES.forEach((p, i) => { text += `${i + 1}. ${p.name} — ${p.price.toLocaleString()}\n`; });

  text += `\n🛥 \`купить яхту [номер]\` | 🚁 \`купить вертолет [номер]\` | ✈️ \`купить самолет [номер]\``;

  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^(бизнесы|бизнес|biz)$/i, async (ctx) => {
  let text = `🏢 **КАТАЛОГ ГЛОБАЛЬНЫХ БИЗНЕСОВ (\`купить бизнес [номер]\`):**\n\n`;
  BIZ.forEach((b, i) => {
    text += `${i + 1}. **${b.name}**\n   💰 Цена: ${b.price.toLocaleString()} | Доход: +${b.income.toLocaleString()}/час\n\n`;
  });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^купить авто (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!CARS[idx]) return ctx.reply("❌ Такой машины нет в каталоге!");
  const item = CARS[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств!");
  u.balance -= item.price;
  u.car = item.name;
  addExp(u, 40);
  saveDB();
  await ctx.reply(`🎉 Поздравляем! Вы приобрели мощный автомобиль: **${item.name}**!`);
});

bot.hears(/^купить дом (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!HOUSES[idx]) return ctx.reply("❌ Такого дома нет в каталоге!");
  const item = HOUSES[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств!");
  u.balance -= item.price;
  u.house = item.name;
  addExp(u, 60);
  saveDB();
  await ctx.reply(`🏡 Поздравляем! Новая недвижимость оформлена: **${item.name}**!`);
});

bot.hears(/^купить телефон (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!PHONES[idx]) return ctx.reply("❌ Такого телефона нет!");
  const item = PHONES[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств!");
  u.balance -= item.price;
  u.phone = item.name;
  addExp(u, 20);
  saveDB();
  await ctx.reply(`📱 Вы купили премиальный гаджет: **${item.name}**!`);
});

bot.hears(/^купить бизнес (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!BIZ[idx]) return ctx.reply("❌ Такого бизнеса не существует!");
  const item = BIZ[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно капитала!");
  u.balance -= item.price;
  u.business = item.name;
  u.bizIncome = item.income;
  addExp(u, 150);
  saveDB();
  await ctx.reply(`🏢 Империя пополнена! Вы купили бизнес **${item.name}** (+${item.income.toLocaleString()}/час)!`);
});

bot.hears(/^купить яхту (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!YACHTS[idx]) return ctx.reply("❌ Такой яхты нет!");
  const item = YACHTS[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств!");
  u.balance -= item.price;
  u.yacht = item.name;
  addExp(u, 80);
  saveDB();
  await ctx.reply(`🛥 Вы приобрели супер-яхту: **${item.name}**!`);
});

bot.hears(/^купить вертолет (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!HELICOPTERS[idx]) return ctx.reply("❌ Такого вертолета нет!");
  const item = HELICOPTERS[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств!");
  u.balance -= item.price;
  u.helicopter = item.name;
  addExp(u, 120);
  saveDB();
  await ctx.reply(`🚁 Вы стали пилотом вертолета: **${item.name}**!`);
});

bot.hears(/^купить самолет (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!PLANES[idx]) return ctx.reply("❌ Такого самолета нет!");
  const item = PLANES[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств!");
  u.balance -= item.price;
  u.plane = item.name;
  addExp(u, 200);
  saveDB();
  await ctx.reply(`✈️ Вы приобрели личный самолет: **${item.name}**!`);
});

const ALL_GAMES = [
  "казино", "кубик", "рулетка", "слот", "21", "монета", "сейф", "карты",
  "пуш", "пушка", "краш", "трейдинг", "мина", "пирамида", "башня", "бочки",
  "дартс", "баскетбол", "футбол", "боулинг", "гонки", "кейс", "охота", "игры",
  "дуэль", "тир", "кости", "лотерея", "биржа", "рыбалка", "покер", "блэкджек"
];

bot.hears(/^(игры|igri|игры 🎮|21)$/i, async (ctx) => {
  const gamesText = `
🎮 **УЛЬТРА КАТАЛОГ ИГР И КАЗИНО (35+ ИГР)**

🎲 **Казино и Удача:** \`казино\`, \`кубик\`, \`рулетка\`, \`слот\`, \`21\`, \`монета\`, \`сейф\`, \`карты\`, \`кости\`
🚀 **Crash и Мини-игры:** \`пуш\`, \`пушка\`, \`краш\`, \`мина\`, \`пирамида\`, \`башня\`, \`бочки\`, \`кейс\`
🎯 **Спорт и Экшен:** \`дартс\`, \`баскетбол\`, \`футбол\`, \`боулинг\`, \`гонки\`, \`охота\`, \`тир\`, \`рыбалка\`
📈 **Экономика и Риск:** \`трейдинг\`, \`биржа\`, \`лотерея\`, \`дуэль\`, \`покер\`, \`блэкджек\`

📌 *Пример ставки:* \`пирамида 50000\` ёки \`мина 10000\`
`;
  await ctx.reply(gamesText, { parse_mode: "Markdown" });
});

bot.hears(new RegExp(`^(${ALL_GAMES.join("|")})$`, "i"), async (ctx) => {
  const game = ctx.match[1].toLowerCase();
  if (game === "игры") return;
  await ctx.reply(`❌ Вы не указали размер ставки!\n\n📌 Пример правильной команды:\n\`${game} 50000\``, { parse_mode: "Markdown" });
});

bot.hears(new RegExp(`^(${ALL_GAMES.join("|")})\\s+(\\d+)$`, "i"), async (ctx) => {
  const u = ecoUser(ctx);
  const gameName = ctx.match[1].toLowerCase();
  const bet = Number(ctx.match[2]);

  if (!bet || bet <= 0) return ctx.reply("❌ Укажите корректную сумму ставки!");
  if (u.balance < bet) return ctx.reply("❌ У вас недостаточно наличных монет!");

  u.balance -= bet;

  let winRate = 0.38;
  let mult = 2.0;

  if (["сейф", "мина", "кейс"].includes(gameName)) { winRate = 0.22; mult = 4.5; }
  else if (["слот", "краш", "пирамида", "биржа"].includes(gameName)) { winRate = 0.30; mult = 3.0; }
  else if (["пуш", "пушка", "рулетка"].includes(gameName)) { winRate = 0.40; mult = 2.1; }

  if (Math.random() < winRate) {
    const prize = Math.floor(bet * mult);
    u.balance += prize;
    u.wins++;
    addExp(u, 20);
    saveDB();
    await ctx.reply(`🎮 **ИГРА: ${gameName.toUpperCase()}**\n\n🎉 **КРУПНАЯ ПОБЕДА!**\n💰 Вы выиграли: **+${prize.toLocaleString()} монет**`);
  } else {
    u.losses++;
    saveDB();
    await ctx.reply(`🎮 **ИГРА: ${gameName.toUpperCase()}**\n\n📉 **ПРОИГРЫШ...**\n💸 Вы потеряли: **-${bet.toLocaleString()} монет**`);
  }
});

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🚀 ULTRA 10X EXPANDED BOT ONLINE WITH HUGE DATABASES!");
  } catch (err) {
    console.error("Xatolik:", err);
  }
}

startBot();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
