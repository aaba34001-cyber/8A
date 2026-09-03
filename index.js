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
      wins: 0,
      losses: 0
    });
  }
  return economyUsers.get(id);
}

function addExp(u, amount) {
  u.experience += amount;
  if (u.experience >= u.level * 100) {
    u.level += 1;
    u.experience = 0;
    u.balance += u.level * 50000;
  }
}

// Список всех доступных игр для проверки ставки
const ALL_GAMES = [
  "казино", "кубик", "рулетка", "слот", "21", "монета", "сейф", "карты",
  "пуш", "пушка", "краш", "трейдинг", "мина", "пирамида", "башня", "бочки",
  "дартс", "баскетбол", "футбол", "боулинг", "гонки", "кейс", "охота"
];

// Если игрок написал название игры без ставки
bot.hears(new RegExp(`^(${ALL_GAMES.join("|")})$`, "i"), async (ctx) => {
  const game = ctx.match[1].toLowerCase();
  await ctx.reply(`❌ Вы не указали ставку!\n\n📌 Пример правильного использования:\n\`${game} 5000\``, { parse_mode: "Markdown" });
});

// Универсальный обработчик для всех игр со ставкой
bot.hears(new RegExp(`^(${ALL_GAMES.join("|")})\\s+(\\d+)$`, "i"), async (ctx) => {
  const u = ecoUser(ctx);
  const gameName = ctx.match[1].toLowerCase();
  const bet = Number(ctx.match[2]);

  if (!bet || bet <= 0) {
    return ctx.reply("❌ Укажите корректную ставку!");
  }

  if (u.balance < bet) {
    return ctx.reply("❌ У вас недостаточно монет на балансе!");
  }

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
    console.log("🚀 БОТ ОНЛАЙН!");
  } catch (err) {
    console.error("Ошибка:", err);
  }
}

startBot();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
