require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("❌ CRITICAL ERROR: BOT_TOKEN is missing!");
  process.exit(1);
}

const bot = new Telegraf(token);
const economyUsers = new Map();

function ecoUser(ctx) {
  const id = String(ctx.from.id);
  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id: ctx.from.id,
      name: ctx.from.first_name || "Игрок",
      nickname: null,
      username: ctx.from.username || null,
      balance: 100000,
      bank: 0,
      credit: 0,
      experience: 0,
      level: 1,
      business: "Отсутствует",
      bizIncome: 0,
      car: "Отсутствует",
      house: "Отсутствует",
      wins: 0,
      losses: 0,
      lastBonus: 0,
      lastWork: 0
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
    u.balance += u.level * 50000;
  }
}

// 📌 MENYU VA ASOSIY BUYRUQLAR
bot.hears(/^(меню|menu|start|старт)$/i, async (ctx) => {
  await ctx.reply(
    `🤖 **ГЛАВНОЕ МЕНЮ БОТА**\n\n` +
    `👤 \`профиль\` — Профиль и баланс\n` +
    `💰 \`баланс\` — Узнать баланс\n` +
    `🏦 \`банк [сумма]\` / \`снять [сумма]\`\n` +
    `🎁 \`бонус\` — Ежедневный бонус\n` +
    `💼 \`работа\` — Заработать монеты\n` +
    `🏆 \`богатые\` — Топ богачей\n` +
    `🛒 \`маг\` — Магазин машин и домов\n` +
    `🎮 \`игры\` — Каталог всех игр`,
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^(баланс|balance|бал)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `💰 **Ваш баланс:**\n` +
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
    `🆔 ID: \`$ {u.id}\`\n` +
    `⭐ Уровень: **${u.level} LVL** (${u.experience}/${u.level * 100} EXP)\n` +
    `💵 Наличные: **${u.balance.toLocaleString()} монет**\n` +
    `🏦 Банк: **${u.bank.toLocaleString()} монет**\n` +
    `🚘 Авто: **${u.car}**\n` +
    `🏠 Дом: **${u.house}**\n` +
    `🏢 Бизнес: **${u.business}**\n` +
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

// 🎁 BONUS
bot.hears(/^(бонус|bonus)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastBonus < 24 * 60 * 60 * 1000) {
    return ctx.reply("⏳ Вы уже получали бонус за последние 24 часа!");
  }
  const reward = 25000 * u.level;
  u.balance += reward;
  u.lastBonus = now;
  addExp(u, 20);
  await ctx.reply(`🎁 Вы получили ежедневный бонус: **+${reward.toLocaleString()} монет**!`);
});

// 💼 ISH
bot.hears(/^(работа|work)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastWork < 30 * 60 * 1000) {
    return ctx.reply("⏳ Вы устали! Отдохните еще немного перед следующей работой.");
  }
  const earned = Math.floor(Math.random() * 15000) + 5000;
  u.balance += earned;
  u.lastWork = now;
  addExp(u, 10);
  await ctx.reply(`💼 Вы сходили на работу и заработали **+${earned.toLocaleString()} монет**!`);
});

// 🏦 BANK
bot.hears(/^банк\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[1]);
  if (u.balance < amount) return ctx.reply("❌ У вас нет столько наличных!");
  u.balance -= amount;
  u.bank += amount;
  await ctx.reply(`🏦 Вы положили в банк **${amount.toLocaleString()} монет**.`);
});

bot.hears(/^снять\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[1]);
  if (u.bank < amount) return ctx.reply("❌ В банке нет такой суммы!");
  u.bank -= amount;
  u.balance += amount;
  await ctx.reply(`💵 Вы сняли со счета **${amount.toLocaleString()} монет**.`);
});

// 🛒 MAGAZIN
bot.hears(/^(маг|магазин|shop)$/i, async (ctx) => {
  await ctx.reply(
    `🛒 **МАГАЗИН ИМУЩЕСТВА**\n\n` +
    `🚘 \`купить авто 1\` — Chevrolet Spark (50,000 монет)\n` +
    `🚘 \`купить авто 2\` — Chevrolet Malibu (500,000 монет)\n` +
    `🏠 \`купить дом 1\` — Квартира (300,000 монет)\n` +
    `🏠 \`купить дом 2\` — Вилла (5,000,000 монет)`,
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^купить авто 1$/i, async (ctx) => {
  const u = ecoUser(ctx);
  if (u.balance < 50000) return ctx.reply("❌ Недостаточно средств!");
  u.balance -= 50000;
  u.car = "Chevrolet Spark";
  await ctx.reply("🎉 Поздравляем с покупкой Chevrolet Spark!");
});

bot.hears(/^купить авто 2$/i, async (ctx) => {
  const u = ecoUser(ctx);
  if (u.balance < 500000) return ctx.reply("❌ Недостаточно средств!");
  u.balance -= 500000;
  u.car = "Chevrolet Malibu";
  await ctx.reply("🎉 Поздравляем с покупкой Chevrolet Malibu!");
});

// 📌 2. O'YINLAR
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
    await ctx.reply(`🎮 **ИГРА: ${gameName.toUpperCase()}**\n\n🎉 **ПОБЕДА!**\n💰 Вы выиграли: **+${prize.toLocaleString()} монет**`);
  } else {
    u.losses++;
    await ctx.reply(`🎮 **ИГРА: ${gameName.toUpperCase()}**\n\n📉 **ПРОИГРЫШ...**\n💸 Вы потеряли: **-${bet.toLocaleString()} монет**`);
  }
});

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🚀 ПОЛНЫЙ МЕГА-БОТ УСПЕШНО ЗАПУЩЕН!");
  } catch (err) {
    console.error("Ошибка:", err);
  }
}

startBot();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
