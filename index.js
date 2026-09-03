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
    u.balance += u.level * 50000;
  }
}

// 🎮 МЕГА-СПИСОК ВСЕХ ИГР (БОЛЕЕ 30 ИГР)
bot.hears(/^(игры|igri|игры 🎮|oyinlar|o'yinlar|21)$/i, async (ctx) => {
  const gamesText = `
🎮 **МЕГА-КАТАЛОГ ИГР И КАЗИНО (30+ ИГР)**

🎲 **1. Классика и Удача:**
• \`казино [ставка]\` — Классическое казино (2x)
• \`кубик [ставка]\` — Бросок костей
• \`рулетка [красное/черное] [ставка]\` — Рулетка
• \`слот [ставка]\` — Игровой автомат
• \`21 [ставка]\` — Блэкджек (21)
• \`монета [ставка]\` — Орел или решка
• \`сейф [ставка]\` — Взломать сейф
• \`карты [ставка]\` — Карточная дуэль

🚀 **2. Динамичные и Crash игры:**
• \`пуш [ставка]\` — Push игра с кнопками
• \`пушка [ставка]\` — Выстрел из пушки
• \`краш [ставка]\` — Ракета и коэффициенты
• \`трейдинг [ставка]\` — Торговля на бирже
• \`мина [ставка]\` — Минное поле (7x7)
• \`пирамида [ставка]\` — Подъем по пирамиде
• \`башня [ставка]\` — Строительство башни
• \`бочки [ставка]\` — Опасные бочки

🧠 **3. Интеллектуальные игры:**
• \`математика\` — Решить быстрый пример
• \`слово\` — Угадать слово
• \`флаг\` — Угадать страну по флагу
• \`викторина\` — Вопрос на эрудицию
• \`ребус\` — Разгадать ребус

🎯 **4. Спорт и Меткость:**
• \`дартс [ставка]\` — Бросок в дартс
• \`баскетбол [ставка]\` — Бросок мяча в кольцо
• \`футбол [ставка]\` — Забить пенальти
• \`боулинг [ставка]\` — Сбить кегли
• \`гонки [ставка]\` — Автомобильные гонки

⚔️ **5. Соревнования и PvP:**
• \`дуэль [@user] [ставка]\` — Вызвать игрока
• \`бой [ставка]\` — Бой с соперником
• \`лотерея\` — Ежедневный билет
• \`кейс [ставка]\` — Открыть ларец с призом
• \`охота [ставка]\` — Охота на монстров

📌 *Пример использования:* \`казино 5000\` или \`пуш 1000\`
`;

  await ctx.reply(gamesText, { parse_mode: "Markdown" });
});

// Универсальный обработчик всех азартных игр
bot.hears(/^(казино|кубик|рулетка|слот|21|монета|сейф|карты|пуш|пушка|краш|трейдинг|мина|пирамида|башня|бочки|дартс|баскетбол|футбол|боулинг|гонки|кейс|охота)\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const gameName = ctx.match[1].toLowerCase();
  const bet = Number(ctx.match[2]);

  if (!bet || bet <= 0) {
    return ctx.reply("❌ Укажите корректную ставку! Пример: `казино 5000`", { parse_mode: "Markdown" });
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
    addExp(u, 20);
    return ctx.reply(`🎮 **ИГРА: ${gameName.toUpperCase()}**\n\n🎉 **ПОБЕДА!**\n💰 Вы выиграли: **+${prize.toLocaleString()} монет**`);
  } else {
    u.losses++;
    return ctx.reply(`🎮 **ИГРА: ${gameName.toUpperCase()}**\n\n📉 **ПРОИГРЫШ...**\n💸 Вы потеряли: **-${bet.toLocaleString()} монет**`);
  }
});

// Профиль игрока
bot.hears(/^(профиль|проф|profile)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `👤 **ПРОФИЛЬ ИГРОКА:**\n\n` +
    `👨‍💼 Имя: **${ecoName(u)}**\n` +
    `🆔 ID: \`${u.id}\`\n` +
    `⭐ Уровень: **${u.level} LVL** (${u.experience}/${u.level * 100} EXP)\n` +
    `💰 Баланс: **${u.balance.toLocaleString()} монет**\n` +
    `🏆 Победы / Поражения: ${u.wins} / ${u.losses}`
  );
});

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🚀 БОТ УСПЕШНО ЗАПУЩЕН НА РУССКОМ ЯЗЫКЕ!");
  } catch (err) {
    console.error("Ошибка запуска:", err);
  }
}

startBot();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
