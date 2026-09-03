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

// Ma'lumotlarni fayldan o'qish
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

// Ma'lumotlarni faylga saqlash
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
      balance: 1000000,
      bank: 500000,
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
      wins: 0,
      losses: 0,
      lastBonus: 0,
      lastWork: 0
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
  if (u.experience >= u.level * 100) {
    u.level += 1;
    u.experience = 0;
    u.balance += u.level * 50000;
  }
  saveDB();
}

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

bot.hears(/^(меню|menu|start|старт)$/i, async (ctx) => {
  await ctx.reply(
    `🤖 **ГЛАВНОЕ МЕНЮ БОТА**\n\n` +
    `👤 \`профиль\` — Профиль и имущество\n` +
    `💰 \`баланс\` — Узнать баланс\n` +
    `🏦 \`банк [сумма]\` / \`снять [сумма]\`\n` +
    `🎁 \`бонус\` — Ежедневный бонус\n` +
    `💼 \`работа\` — Заработать монеты\n` +
    `🏢 \`бизнесы\` — Список бизнесов\n` +
    `🛒 \`магазин\` — Магазин (авто, дома, телефоны, яхты, самолеты)\n` +
    `🏆 \`богатые\` — Топ-10 богатейших игроков\n` +
    `🎮 \`игры\` — Каталог из 30+ игр`,
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^(баланс|balance|бал)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `💰 **Ваш баланс:**\n\n` +
    `💵 Наличные: **${u.balance.toLocaleString()} монет**\n` +
    `🏦 В банке: **${u.bank.toLocaleString()} монет**\n` +
    `💳 Кредит: **${u.credit.toLocaleString()} монет**`,
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^(профиль|проф|profile)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `👤 **ПРОФИЛЬ ИГРОКА:**\n\n` +
    `👨‍💼 Имя: **${ecoName(u)}**\n` +
    `🆔 ID: \`${u.id}\`\n` +
    `⭐ Уровень: **${u.level} LVL** (${u.experience}/${u.level * 100} EXP)\n\n` +
    `💵 Наличные: **${u.balance.toLocaleString()} монет**\n` +
    `🏦 Банк: **${u.bank.toLocaleString()} монет**\n\n` +
    `🚘 Авто: **${u.car}**\n` +
    `🏠 Дом: **${u.house}**\n` +
    `📱 Телефон: **${u.phone}**\n` +
    `🛥 Яхта: **${u.yacht}**\n` +
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

  let text = `🏆 **ТОП-10 САМЫХ БОГАТЫХ ИГРОКОВ**\n\n`;
  usersArr.slice(0, 10).forEach((user, i) => {
    text += `${i + 1}. **${ecoName(user)}** — **${(user.balance + user.bank).toLocaleString()} монет**\n`;
  });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^(бонус|bonus)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastBonus < 24 * 60 * 60 * 1000) {
    return ctx.reply("⏳ Вы уже получали бонус за последние 24 часа!");
  }
  const reward = 50000 * u.level;
  u.balance += reward;
  u.lastBonus = now;
  addExp(u, 30);
  saveDB();
  await ctx.reply(`🎁 Вы получили ежедневный бонус: **+${reward.toLocaleString()} монет**!`);
});

bot.hears(/^(работа|work)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastWork < 15 * 60 * 1000) {
    return ctx.reply("⏳ Вы устали! Отдохните немного перед следующей сменой.");
  }
  const earned = Math.floor(Math.random() * 30000) + 10000;
  u.balance += earned;
  u.lastWork = now;
  addExp(u, 15);
  saveDB();
  await ctx.reply(`💼 Вы сходили на работу и заработали **+${earned.toLocaleString()} монет**!`);
});

bot.hears(/^банк\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[1]);
  if (u.balance < amount) return ctx.reply("❌ У вас нет столько наличных!");
  u.balance -= amount;
  u.bank += amount;
  saveDB();
  await ctx.reply(`🏦 Вы положили в банк **${amount.toLocaleString()} монет**.`);
});

bot.hears(/^снять\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[1]);
  if (u.bank < amount) return ctx.reply("❌ В банке нет такой суммы!");
  u.bank -= amount;
  u.balance += amount;
  saveDB();
  await ctx.reply(`💵 Вы сняли со счета **${amount.toLocaleString()} монет**.`);
});

bot.hears(/^(маг|магазин|shop)$/i, async (ctx) => {
  let text = `🛒 **ПРЕМИУМ МАГАЗИН ИМУЩЕСТВА**\n\n`;
  text += `🚘 **Автомобили (\`купить авто [номер]\`):**\n`;
  CARS.forEach((c, i) => { text += `${i + 1}. ${c.name} — ${c.price.toLocaleString()} монет\n`; });

  text += `\n🏠 **Недвижимость (\`купить дом [номер]\`):**\n`;
  HOUSES.forEach((h, i) => { text += `${i + 1}. ${h.name} — ${h.price.toLocaleString()} монет\n`; });

  text += `\n📱 **Телефоны (\`купить телефон [номер]\`):**\n`;
  PHONES.forEach((p, i) => { text += `${i + 1}. ${p.name} — ${p.price.toLocaleString()} монет\n`; });

  text += `\n🛥 **Яхты (\`купить яхту [номер]\`):**\n`;
  YACHTS.forEach((y, i) => { text += `${i + 1}. ${y.name} — ${y.price.toLocaleString()} монет\n`; });

  text += `\n✈️ **Самолеты (\`купить самолет [номер]\`):**\n`;
  PLANES.forEach((pl, i) => { text += `${i + 1}. ${pl.name} — ${pl.price.toLocaleString()} монет\n`; });

  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^(бизнесы|бизнес|biz)$/i, async (ctx) => {
  let text = `🏢 **КАТАЛОГ БИЗНЕСОВ (\`купить бизнес [номер]\`):**\n\n`;
  BIZ.forEach((b, i) => {
    text += `${i + 1}. **${b.name}**\n   💰 Цена: ${b.price.toLocaleString()} монет | Доход: +${b.income.toLocaleString()}/час\n\n`;
  });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^купить авто (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!CARS[idx]) return ctx.reply("❌ Такой машины нет в каталоге!");
  const item = CARS[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно монет!");
  u.balance -= item.price;
  u.car = item.name;
  addExp(u, 30);
  saveDB();
  await ctx.reply(`🎉 Поздравляем! Вы успешно купили **${item.name}**!`);
});

bot.hears(/^купить дом (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!HOUSES[idx]) return ctx.reply("❌ Такого дома нет в каталоге!");
  const item = HOUSES[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно монет!");
  u.balance -= item.price;
  u.house = item.name;
  addExp(u, 50);
  saveDB();
  await ctx.reply(`🏡 Поздравляем! Ваша новая недвижимость: **${item.name}**!`);
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
  await ctx.reply(`📱 Вы купили новый телефон: **${item.name}**!`);
});

bot.hears(/^купить бизнес (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!BIZ[idx]) return ctx.reply("❌ Такого бизнеса нет!");
  const item = BIZ[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств!");
  u.balance -= item.price;
  u.business = item.name;
  u.bizIncome = item.income;
  addExp(u, 100);
  saveDB();
  await ctx.reply(`🏢 Вы стали владельцем бизнеса **${item.name}** (+${item.income.toLocaleString()}/час)!`);
});

bot.hears(/^купить яхту (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!YACHTS[idx]) return ctx.reply("❌ Такой яхты нет!");
  const item = YACHTS[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств!");
  u.balance -= item.price;
  u.yacht = item.name;
  addExp(u, 70);
  saveDB();
  await ctx.reply(`🛥 Вы приобрели роскошную яхту: **${item.name}**!`);
});

bot.hears(/^купить самолет (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!PLANES[idx]) return ctx.reply("❌ Такого самолета нет!");
  const item = PLANES[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств!");
  u.balance -= item.price;
  u.plane = item.name;
  addExp(u, 150);
  saveDB();
  await ctx.reply(`✈️ Вы купили личный самолет: **${item.name}**!`);
});

const ALL_GAMES = [
  "казино", "кубик", "рулетка", "слот", "21", "монета", "сейф", "карты",
  "пуш", "пушка", "краш", "трейдинг", "мина", "пирамида", "башня", "бочки",
  "дартс", "баскетбол", "футбол", "боулинг", "гонки", "кейс", "охота", "игры"
];

bot.hears(/^(игры|igri|игры 🎮|21)$/i, async (ctx) => {
  const gamesText = `
🎮 **МЕГА-КАТАЛОГ ИГР И КАЗИНО (30+ ИГР)**

🎲 **Казино и Удача:** \`казино\`, \`кубик\`, \`рулетка\`, \`слот\`, \`21\`, \`монета\`, \`сейф\`
🚀 **Crash и Мини-игры:** \`пуш\`, \`пушка\`, \`краш\`, \`мина\`, \`пирамида\`, \`башня\`
🎯 **Спорт и PvP:** \`дартс\`, \`баскетбол\`, \`футбол\`, \`боулинг\`, \`гонки\`

📌 *Пример игры со ставкой:* \`казино 5000\` ёки \`пуш 1000\`
`;
  await ctx.reply(gamesText, { parse_mode: "Markdown" });
});

bot.hears(new RegExp(`^(${ALL_GAMES.join("|")})$`, "i"), async (ctx) => {
  const game = ctx.match[1].toLowerCase();
  if (game === "игры") return;
  await ctx.reply(`❌ Вы не указали ставку!\n\n📌 Пример правильного использования:\n\`${game} 5000\``, { parse_mode: "Markdown" });
});

bot.hears(new RegExp(`^(${ALL_GAMES.join("|")})\\s+(\\d+)$`, "i"), async (ctx) => {
  const u = ecoUser(ctx);
  const gameName = ctx.match[1].toLowerCase();
  const bet = Number(ctx.match[2]);

  if (!bet || bet <= 0) return ctx.reply("❌ Укажите корректную ставку!");
  if (u.balance < bet) return ctx.reply("❌ У вас недостаточно монет на балансе!");

  u.balance -= bet;

  let winRate = 0.38;
  let mult = 2.0;

  if (["сейф", "мина", "кейс"].includes(gameName)) { winRate = 0.22; mult = 4.5; }
  else if (["слот", "краш", "пирамида"].includes(gameName)) { winRate = 0.30; mult = 3.0; }
  else if (["пуш", "пушка"].includes(gameName)) { winRate = 0.40; mult = 2.1; }

  if (Math.random() < winRate) {
    const prize = Math.floor(bet * mult);
    u.balance += prize;
    u.wins++;
    addExp(u, 15);
    saveDB();
    await ctx.reply(`🎮 **ИГРА: ${gameName.toUpperCase()}**\n\n🎉 **ПОБЕДА!**\n💰 Вы выиграли: **+${prize.toLocaleString()} монет**`);
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
    console.log("🚀 MEGA BOT ONLINE WITH PERSISTENT DB!");
  } catch (err) {
    console.error("Ошибка:", err);
  }
}

startBot();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
