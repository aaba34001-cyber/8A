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
const userWarns = new Map();

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

// ==================== DONAT & VYVOD ====================

bot.hears(/^(донат|donat)$/i, async (ctx) => {
  await ctx.reply(
    `💎 **ПОКУПКА МОНЕТ (ДОНАТ)**\n\n` +
    `• **50 Telegram Stars** — 5,000,000 монет\n` +
    `• **100 Telegram Stars** — 12,000,000 монет\n` +
    `• **500 Telegram Stars** — 70,000,000 монет\n\n` +
    `👨‍💻 Пополнение: @Man_adminn`
  );
});

bot.hears(/^(вывод|vyvod)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  if (u.balance < 8000000) {
    return ctx.reply(`❌ **НЕДОСТАТОЧНО МОНЕТ!**\nДля вывода **50 Stars** нужно **8,000,000 монет**.\n💰 Ваш баланс: **${u.balance.toLocaleString()}**.`);
  }
  await ctx.reply("✅ Заявка отправлена администратору!");
});

// ==================== PIRAMIDA 2x2 ====================

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
    mults: [1.8, 3.2, 6.0, 12.0],
    trap: Math.floor(Math.random() * 2)
  });

  await renderPyramid2x2(ctx, userId);
});

async function renderPyramid2x2(ctx, userId) {
  const g = activePyramidGames.get(userId);
  if (!g) return;

  const buttons = [[
    Markup.button.callback("❓ 1", "pyr2_0"),
    Markup.button.callback("❓ 2", "pyr2_1")
  ]];

  const curWin = Math.floor(g.bet * (g.level === 1 ? 1 : g.mults[g.level - 2]));
  if (g.level > 1) {
    buttons.push([Markup.button.callback(`💰 Забрать (${curWin.toLocaleString()})`, "pyr2_take")]);
  }

  const text = `🔺 **ПИРАМИДА 2x2 (Уровень ${g.level}/4)**\n\n🎯 Множитель: **x${g.mults[g.level - 1]}**\n💵 Выигрыш: **${curWin.toLocaleString()} монет**\n\nВыберите 1 из 2 клеток:`;

  if (ctx.callbackQuery) await ctx.editMessageText(text, Markup.inlineKeyboard(buttons));
  else await ctx.reply(text, Markup.inlineKeyboard(buttons));
}

bot.action(/^pyr2_(\d+)$/, async (ctx) => {
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
    return ctx.editMessageText(`🏆 **ПОБЕДА!** Вы выиграли **${win.toLocaleString()} монет**!`);
  }

  g.level += 1;
  g.trap = Math.floor(Math.random() * 2);
  await renderPyramid2x2(ctx, userId);
});

bot.action("pyr2_take", async (ctx) => {
  const userId = ctx.from.id;
  const g = activePyramidGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ Игра завершена!", { show_alert: true });

  const win = Math.floor(g.bet * g.mults[g.level - 2]);
  ecoUser(ctx).balance += win;
  activePyramidGames.delete(userId);
  await ctx.editMessageText(`🤑 **ВЫИГРЫШ ЗАБРАН!** Вы выиграли **${win.toLocaleString()} монет**!`);
});

// ==================== CRASH (REAL DANGER: HAM + HAM -) ====================

bot.hears(/^(краш|crash|krash) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);

  if (!bet || bet < 100) return ctx.reply("❌ Мин. ставка: 100!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;

  const isCrash = Math.random() < 0.50; // 50% chance crash
  if (isCrash) {
    const crashPoint = (Math.random() * 0.9 + 1.0).toFixed(2);
    return ctx.reply(`📈 **CRASH GAME**\n\n💥 График рухнул на **x${crashPoint}**!\n📉 Вы потеряли **-${bet.toLocaleString()} монет**.`);
  } else {
    const winMult = (Math.random() * 2.5 + 1.2).toFixed(2);
    const winAmount = Math.floor(bet * winMult);
    u.balance += winAmount;
    return ctx.reply(`📈 **CRASH GAME**\n\n🚀 Ракета взлетела до **x${winMult}**!\n🎉 Вы зафиксировали **+${winAmount.toLocaleString()} монет**!`);
  }
});

// ==================== TRADING (HAM + HAM -) ====================

bot.hears(/^(трейдинг|trade) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);

  if (!bet || bet < 100) return ctx.reply("❌ Мин. ставка: 100!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;

  const isWin = Math.random() < 0.45; // 45% win chance
  if (isWin) {
    const mult = (Math.random() * 1.5 + 1.2).toFixed(2);
    const winAmount = Math.floor(bet * mult);
    u.balance += winAmount;
    return ctx.reply(`📊 **ТРЕЙДИНГ**\n\n🟢 Курс пошел вверх! Сделка закрыта в плюс (x${mult}).\n🎉 Вы вывели **+${winAmount.toLocaleString()} монет**!`);
  } else {
    return ctx.reply(`📊 **ТРЕЙДИНГ**\n\n🔴 Сработал Stop-Loss! Курс резко упал.\n📉 Потеря: **-${bet.toLocaleString()} монет**.`);
  }
});

// ==================== MINES 7x7 ====================

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
      if (g.revealed.has(idx)) row.push(Markup.button.callback("💎", "mines_ignore"));
      else row.push(Markup.button.callback("🟦", `mine_step_${idx}`));
    }
    buttons.push(row);
  }

  const curWin = Math.floor(g.bet * g.mult);
  buttons.push([Markup.button.callback(`💰 Забрать (${curWin.toLocaleString()})`, "mines_take")]);

  const text = `${title}\n\n📊 Множитель: **x${g.mult.toFixed(2)}**\n💵 Выигрыш: **${curWin.toLocaleString()} монет**`;

  if (ctx.callbackQuery) await ctx.editMessageText(text, Markup.inlineKeyboard(buttons));
  else await ctx.reply(text, Markup.inlineKeyboard(buttons));
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

// ==================== ALL STANDARD GAMES ====================

function playStandardGame(ctx, bet, winRate, winMult, title) {
  const u = ecoUser(ctx);
  if (!bet || bet <= 0 || u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;
  if (Math.random() < winRate) {
    const prize = Math.floor(bet * winMult);
    u.balance += prize;
    return ctx.reply(`${title}\n🎉 **ПОБЕДА!** Вы выиграли **+${prize.toLocaleString()} монет**!`);
  } else {
    return ctx.reply(`${title}\n📉 **ПРОИГРЫШ!** Вы потеряли **-${bet.toLocaleString()} монет**.`);
  }
}

bot.hears(/^(казино|casino) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.35, 2.0, "🎰 **КАЗИНО**"));
bot.hears(/^(кубик|dice) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.35, 2.0, "🎲 **КУБИК**"));
bot.hears(/^(слоты|slots) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.25, 3.5, "🎰 **СЛОТЫ**"));
bot.hears(/^(монетка|flip) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.40, 1.9, "🪙 **МОНЕТКА**"));
bot.hears(/^(рулетка) (красное|черное) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[3]), 0.40, 1.95, "🎡 **РУЛЕТКА**"));
bot.hears(/^(дартс|darts) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.30, 2.2, "🎯 **ДАРТС**"));
bot.hears(/^(баскетбол|basket) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.30, 2.2, "🏀 **БАСКЕТБОЛ**"));
bot.hears(/^(футбол|football) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.35, 2.0, "⚽ **ФУТБОЛ**"));
bot.hears(/^(покер|poker) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.30, 2.5, "🃏 **ПОКЕР**"));
bot.hears(/^(блекджек|bj) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.35, 2.0, "🂡 **БЛЕКДЖЕК**"));
bot.hears(/^(сейф|safe) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.20, 5.0, "🔐 **СЕЙФ**"));
bot.hears(/^(колесо|wheel) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.30, 2.5, "🎡 **КОЛЕСО УДАЧИ**"));
bot.hears(/^(дуэль|duel) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.40, 1.9, "⚔️ **ДУЭЛЬ**"));
bot.hears(/^(скачки|race) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.25, 3.0, "🐎 **СКАЧКИ**"));

// ==================== MENU & COMMANDS ====================

bot.hears(/^(богатые|топ|top)$/i, async (ctx) => {
  if (economyUsers.size === 0) return ctx.reply("📊 Список пока пуст!");
  const usersArr = Array.from(economyUsers.values());
  usersArr.sort((a, b) => (b.balance + b.bank) - (a.balance + a.bank));

  let text = `🏆 **ТОП-10 ИГРОКОВ**\n\n`;
  usersArr.slice(0, 10).forEach((u, i) => {
    text += `${i + 1}. **${ecoName(u)}** — **${(u.balance + u.bank).toLocaleString()} монет**\n`;
  });
  await ctx.reply(text);
});

bot.hears(/^(баланс|balans)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(`💰 **БАЛАНС:** На руках: **${u.balance.toLocaleString()}** | В банке: **${u.bank.toLocaleString()}**`);
});

bot.hears(/^(профиль|проф)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(`👤 **ПРОФИЛЬ:** **${ecoName(u)}** | ID: \`${u.id}\` | VIP: **${u.vip}**`);
});

bot.hears(/^(игры|меню|menu|start|старт)$/i, async (ctx) => {
  await ctx.reply(
    `📜 **СПИСОК ИГР И КОМАНД**\n\n` +
    `🚀 **Краш:** \`краш [ставка]\` — есть риск проигрыша!\n` +
    `📊 **Трейдинг:** \`трейдинг [ставка]\` — риск и профит!\n` +
    `🔺 **Пирамида (2x2):** \`пирамида [ставка]\`\n` +
    `💣 **Мины (7x7):** \`мина [ставка]\`\n` +
    `🎲 **Мини-Игры:** \`казино\`, \`слоты\`, \`покер\`, \`блекджек\`, \`сейф\`, \`колесо\`, \`дуэль\`...\n\n` +
    `💎 **Финансы:** \`донат\`, \`вывод\`, \`баланс\`, \`профиль\`, \`богатые\``
  );
});

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🚀 BOT IS LIVE WITH BALANCED GAMES!");
  } catch (err) {
    console.error("Start Error:", err);
  }
}

startBot();

process.process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
