require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("❌ CRITICAL ERROR: BOT_TOKEN is missing!");
  process.exit(1);
}

const bot = new Telegraf(token);
const OWNER_ID = Number(process.env.OWNER_ID || 8480297110);

const economyUsers = new Map();
const activeMinesGames = new Map();
const activePyramidGames = new Map();

const VIP_LEVELS = {
  1: { name: "VIP Bronze 🥉", price: 5000000, bonusMult: 1.1, workMult: 1.1 },
  2: { name: "VIP Silver 🥈", price: 25000000, bonusMult: 1.25, workMult: 1.25 },
  3: { name: "VIP Gold 🥇", price: 100000000, bonusMult: 1.5, workMult: 1.5 },
  4: { name: "VIP Platinum 💎", price: 500000000, bonusMult: 2.0, workMult: 2.0 },
  5: { name: "VIP DIAMOND 👑", price: 3000000000, bonusMult: 3.0, workMult: 3.0 }
};

const SHOP_ITEMS = [
  { id: 1, name: "🚗 Chevrolet Cobalt", price: 250000, type: "car", income: "+5% к зарплате" },
  { id: 2, name: "🚘 Gentra Black Edition", price: 600000, type: "car", income: "+10% к зарплате" },
  { id: 3, name: "🏎️ BMW M5 F90 CS", price: 3000000, type: "car", income: "+20% к зарплате" },
  { id: 4, name: "🏎️ Porsche 911 GT3 RS", price: 10000000, type: "car", income: "+35% к зарплате" },
  { id: 5, name: "🏎️ Bugatti Chiron", price: 50000000, type: "car", income: "+50% к зарплате" },
  { id: 6, name: "☕ Кофейня", price: 1000000, type: "biz", income: "+15,000 монет / час" },
  { id: 7, name: "🏬 Супермаркет", price: 8000000, type: "biz", income: "+100,000 монет / час" },
  { id: 8, name: "🏭 Нефтяная Вышка", price: 40000000, type: "biz", income: "+600,000 монет / час" },
  { id: 9, name: "🏢 IT-Холдинг Corp", price: 200000000, type: "biz", income: "+3,500,000 монет / час" }
];

function ecoUser(ctx) {
  const id = String(ctx.from.id);
  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id: ctx.from.id,
      name: ctx.from.first_name || "Игрок",
      username: ctx.from.username || null,
      balance: 10000,
      bank: 0,
      vip: 0,
      business: "Отсутствует",
      car: "Отсутствует",
      lastBonus: 0,
      lastWork: 0
    });
  } else {
    const u = economyUsers.get(id);
    u.name = ctx.from.first_name || u.name;
    u.username = ctx.from.username || u.username;
  }
  return economyUsers.get(id);
}

function ecoName(u) {
  return u.username ? `@${u.username}` : u.name;
}

// ==================== MAIN PROFILE & BALANCE ====================

bot.hears(/^(баланс|balans|balance)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `💰 **ВАШ БАЛАНС**\n\n` +
    `💵 На руках: **${u.balance.toLocaleString()} монет**\n` +
    `🏛️ В банке: **${u.bank.toLocaleString()} монет**\n` +
    `📊 Всего: **${(u.balance + u.bank).toLocaleString()} монет**`
  );
});

bot.hears(/^(профиль|паспорт|проф|profile)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const vipName = u.vip > 0 ? VIP_LEVELS[u.vip].name : "Отсутствует";

  await ctx.reply(
    `👤 **ПРОФИЛЬ ИГРОКА**\n\n` +
    `📝 Имя: **${ecoName(u)}**\n` +
    `🆔 ID: \`${u.id}\`\n` +
    `👑 VIP: **${vipName}**\n` +
    `🚘 Автомобиль: **${u.car}**\n` +
    `🏢 Бизнес: **${u.business}**`
  );
});

// ==================== PIRAMIDA (4 KATAKLI INLINE) ====================

bot.hears(/^(пирамида|pyramid|piramida) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);

  if (!bet || bet < 100) return ctx.reply("❌ Мин. ставка: 100!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;
  const userId = ctx.from.id;

  activePyramidGames.set(userId, {
    bet,
    level: 1,
    mults: [1.4, 2.0, 3.2, 5.0],
    trap: Math.floor(Math.random() * 4)
  });

  await renderPyramid(ctx, userId);
});

async function renderPyramid(ctx, userId) {
  const g = activePyramidGames.get(userId);
  if (!g) return;

  const buttons = [];
  const row = [];
  for (let i = 0; i < 4; i++) {
    row.push(Markup.button.callback(`❓ ${i + 1}`, `pyr_btn_${i}`));
  }
  buttons.push(row);

  const curWin = Math.floor(g.bet * (g.level === 1 ? 1 : g.mults[g.level - 2]));
  if (g.level > 1) {
    buttons.push([Markup.button.callback(`💰 Забрать (${curWin.toLocaleString()})`, "pyr_take")]);
  }

  const text = `🔺 **ПИРАМИДА (Уровень ${g.level}/4)**\n\n🎯 Коэффициент: **x${g.mults[g.level - 1]}**\n💵 Текущий выигрыш: **${curWin.toLocaleString()} монет**\n\nВыберите 1 из 4 клеток:`;

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, Markup.inlineKeyboard(buttons));
  } else {
    await ctx.reply(text, Markup.inlineKeyboard(buttons));
  }
}

bot.action(/^pyr_btn_(\d+)$/, async (ctx) => {
  const userId = ctx.from.id;
  const g = activePyramidGames.get(userId);

  if (!g) return ctx.answerCbQuery("❌ Игра завершена!", { show_alert: true });

  const choice = Number(ctx.match[1]);

  if (choice === g.trap) {
    activePyramidGames.delete(userId);
    return ctx.editMessageText(`💥 **ОШИБКА!** Вы попали на ловушку и потеряли **${g.bet.toLocaleString()} монет**.`);
  }

  if (g.level >= 4) {
    const win = Math.floor(g.bet * g.mults[3]);
    ecoUser(ctx).balance += win;
    activePyramidGames.delete(userId);
    return ctx.editMessageText(`🏆 **ПОБЕДА!** Вы прошли всю пирамиду и выиграли **${win.toLocaleString()} монет**!`);
  }

  g.level += 1;
  g.trap = Math.floor(Math.random() * 4);
  await renderPyramid(ctx, userId);
});

bot.action("pyr_take", async (ctx) => {
  const userId = ctx.from.id;
  const g = activePyramidGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ Игра завершена!", { show_alert: true });

  const win = Math.floor(g.bet * g.mults[g.level - 2]);
  ecoUser(ctx).balance += win;
  activePyramidGames.delete(userId);
  await ctx.editMessageText(`🤑 **ВЫИГРЫШ ЗАБРАН!** Вы выиграли **${win.toLocaleString()} монет**!`);
});

// ==================== MINA (MINES 7x7) ====================

bot.hears(/^(мина|мины|mina|mines) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);

  if (!bet || bet < 500) return ctx.reply("❌ Мин. ставка: 500!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;
  const userId = ctx.from.id;

  const mines = new Set();
  while (mines.size < 8) mines.add(Math.floor(Math.random() * 49));

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
      if (g.revealed.has(idx)) {
        row.push(Markup.button.callback("💎", "mines_ignore"));
      } else {
        row.push(Markup.button.callback("🟦", `mine_step_${idx}`));
      }
    }
    buttons.push(row);
  }

  const curWin = Math.floor(g.bet * g.mult);
  buttons.push([Markup.button.callback(`💰 Забрать (${curWin.toLocaleString()})`, "mines_take")]);

  const text = `${title}\n\n📊 Множитель: **x${g.mult.toFixed(2)}**\n💵 Выигрыш: **${curWin.toLocaleString()} монет**`;

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, Markup.inlineKeyboard(buttons));
  } else {
    await ctx.reply(text, Markup.inlineKeyboard(buttons));
  }
}

bot.action(/^mine_step_(\d+)$/, async (ctx) => {
  const userId = ctx.from.id;
  const g = activeMinesGames.get(userId);

  if (!g) return ctx.answerCbQuery("❌ Игра завершена!", { show_alert: true });

  const idx = Number(ctx.match[1]);

  if (g.mines.has(idx)) {
    activeMinesGames.delete(userId);
    return ctx.editMessageText(`💥 **БОМБА ВЗОРВАЛАСЬ!** Вы потеряли **${g.bet.toLocaleString()} монет**.`);
  }

  g.revealed.add(idx);
  g.mult += 0.25;
  await renderMinesGrid(ctx, userId, "💣 **МИННОЕ ПОЛЕ (7x7)**");
});

bot.action("mines_take", async (ctx) => {
  const userId = ctx.from.id;
  const g = activeMinesGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ Игра завершена!", { show_alert: true });

  const win = Math.floor(g.bet * g.mult);
  ecoUser(ctx).balance += win;
  activeMinesGames.delete(userId);
  await ctx.editMessageText(`🤑 **ВЫИГРЫШ ЗАБРАН!** Вы выиграли **${win.toLocaleString()} монет**!`);
});

bot.action("mines_ignore", (ctx) => ctx.answerCbQuery());

// ==================== BARCHA QOLGAN O'YINLAR (GAMBLING) ====================

function playStandardGame(ctx, bet, winRate, winMult, gameTitle) {
  const u = ecoUser(ctx);
  if (!bet || bet <= 0 || u.balance < bet) return ctx.reply("❌ Недостаточно средств на балансе!");

  u.balance -= bet;
  const isWin = Math.random() < winRate;

  if (isWin) {
    const prize = Math.floor(bet * winMult);
    u.balance += prize;
    return ctx.reply(`${gameTitle}\n🎉 **ПОБЕДА!** Вы выиграли **+${prize.toLocaleString()} монет**!`);
  } else {
    return ctx.reply(`${gameTitle}\n📉 **ПРОИГРЫШ!** Вы потеряли **-${bet.toLocaleString()} монет**.`);
  }
}

bot.hears(/^(казино|casino) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.25, 2.0, "🎰 **КАЗИНО**"));
bot.hears(/^(кубик|dice) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.25, 2.0, "🎲 **КУБИК**"));
bot.hears(/^(дартс|darts) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.22, 2.2, "🎯 **ДАРТС**"));
bot.hears(/^(баскетбол|basket) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.22, 2.2, "🏀 **БАСКЕТБОЛ**"));
bot.hears(/^(футбол|football) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.25, 2.0, "⚽ **ФУТБОЛ**"));
bot.hears(/^(слоты|slots) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.18, 3.5, "🎰 **СЛОТЫ**"));
bot.hears(/^(монетка|flip) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.30, 1.9, "🪙 **МОНЕТКА**"));
bot.hears(/^(рулетка|roulette) (красное|черное) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[3]), 0.30, 1.95, "🎡 **РУЛЕТКА**"));
bot.hears(/^(трейдинг|trade) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.30, 1.95, "📈 **ТРЕЙДИНГ**"));

// ==================== IGRI / QOIDALAR / MENU ====================

bot.hears(/^(игры|games|правила|qoidalar|menu|o'yinlar|oynlar)$/i, async (ctx) => {
  await ctx.reply(
    `📜 **СПИСОК ИГР И ИНСТРУКЦИЯ**\n\n` +
    `🔺 **Пирамида (4 клетки):**\n` +
    `• \`пирамида [ставка]\` — выбор из 4 клеток.\n\n` +
    `💣 **Мины (7x7):**\n` +
    `• \`мина [ставка]\` — откройте клетки и не наступите на бомбу.\n\n` +
    `🎰 **Классические игры:**\n` +
    `• \`казино [ставка]\`, \`слоты [ставка]\`, \`кубик [ставка]\`\n` +
    `• \`рулетка красное [ставка]\`, \`трейдинг [ставка]\`, \`монетка [ставка]\`\n\n` +
    `💼 **Прочее:** \`баланс\`, \`профиль\`, \`работа\`, \`бонус\``
  );
});

bot.command("start", async (ctx) => {
  await ctx.reply("🔥 Бот онлайн! Введите `игры` или `игры` чтобы узнать доступные команды.");
});

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🚀 BOT HAS STARTED!");
  } catch (err) {
    console.error("Start Error:", err);
  }
}

startBot();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
