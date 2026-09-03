require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);
const OWNER_ID = Number(process.env.OWNER_ID || 8480297110);
const EXTRA_ADMINS = ["man_mass", "man_admin", "man_adminn", "man_adminnn"];

const economyUsers = new Map();
const activeMinesGames = new Map();
const activePyramidGames = new Map();

function ecoUser(ctx) {
  const id = String(ctx.from.id);
  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id: ctx.from.id,
      name: ctx.from.first_name || "Пользователь",
      username: ctx.from.username || null,
      balance: 50000,
      bank: 0,
      vip: false,
      lastBonus: 0
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

// Ежечасный процент в банке (+3%)
setInterval(() => {
  economyUsers.forEach((u) => {
    if (u.bank > 0) {
      const interest = Math.floor(u.bank * 0.03);
      u.bank += interest;
    }
  });
}, 60 * 60 * 1000);

// ==================== МЕНЮ ВСЕХ 21 ИГР ====================

bot.hears(/^(игры|games)$/i, async (ctx) => {
  await ctx.reply(
    `🎰 **ПОЛНЫЙ СПИСОК 21 ИГРЫ** 🎰\n\n` +
    `1. \`мина [ставка]\` — Пошаговые Мины 7x7 на кнопках\n` +
    `2. \`пирамида [ставка]\` — Пошаговая Пирамида (4 кнопки, до x50)\n` +
    `3. \`кубик [1-6] [ставка]\` — Угадать число на кости\n` +
    `4. \`рулетка [red/black] [ставка]\` — Красное или черное\n` +
    `5. \`казино [ставка]\` — Испытать удачу\n` +
    `6. \`монета [орел/решка] [ставка]\` — Орел или решка\n` +
    `7. \`сейф [ставка]\` — Взлом сейфа\n` +
    `8. \`дуэль [ставка]\` — Дуэль с ботом\n` +
    `9. \`суперкубик [ставка]\` — Бросок двух костей\n` +
    `10. \`блэкджек [ставка]\` — Карточная игра 21\n` +
    `11. \`фортуна [ставка]\` — Колесо фортуны\n` +
    `12. \`скачки [1-4] [ставка]\` — Скачки лошадей\n` +
    `13. \`лотерея\` — Ежедневный лотерейный билет\n` +
    `14. \`футбол [ставка]\` — Пенальти\n` +
    `15. \`баскетбол [ставка]\` — Бросок в корзину\n` +
    `16. \`боулинг [ставка]\` — Сбить кегли\n` +
    `17. \`дартс [ставка]\` — Попасть в яблочко\n` +
    `18. \`коробка [ставка]\` — Тайная коробка\n` +
    `19. \`краш [ставка]\` — Успеть забрать до краша\n` +
    `20. \`хайло [выше/ниже] [ставка]\` — Игра Выше или Ниже\n` +
    `21. \`камень [камень/ножницы/бумага] [ставка]\` — Цу-е-фа\n\n` +
    `📝 Команды работают **без знака !**`
  );
});

// ==================== 1. ПИРАМИДА (4 КНОПКИ, ДО X50) ====================

const PYRAMID_CONFIG = [
  { step: 1, minesCount: 1, mult: 1.3 },
  { step: 2, minesCount: 1, mult: 1.7 },
  { step: 3, minesCount: 1, mult: 2.2 },
  { step: 4, minesCount: 2, mult: 4.0 },
  { step: 5, minesCount: 2, mult: 7.5 },
  { step: 6, minesCount: 2, mult: 13.0 },
  { step: 7, minesCount: 3, mult: 22.0 },
  { step: 8, minesCount: 3, mult: 32.0 },
  { step: 9, minesCount: 3, mult: 42.0 },
  { step: 10, minesCount: 3, mult: 50.0 }
];

function generateMinesForStep(minesCount) {
  const mines = new Set();
  while (mines.size < minesCount) {
    mines.add(Math.floor(Math.random() * 4));
  }
  return mines;
}

bot.hears(/^(пирамида|pyramid) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);
  if (u.balance < bet) return ctx.reply("❌ Недостаточно монет!");

  u.balance -= bet;
  const userId = ctx.from.id;

  activePyramidGames.set(userId, {
    bet: bet,
    stepIdx: 0,
    mines: generateMinesForStep(PYRAMID_CONFIG[0].minesCount)
  });

  await renderPyramidStep(ctx, userId, "🔺 **ПОШАГОВАЯ ПИРАМИДА**\n\nУровень 1: Выберите безопасную ячейку!");
});

async function renderPyramidStep(ctx, userId, titleText) {
  const game = activePyramidGames.get(userId);
  if (!game) return;

  const currentLevel = PYRAMID_CONFIG[game.stepIdx];
  const currentWin = Math.floor(game.bet * currentLevel.mult);

  const buttons = [
    [
      Markup.button.callback("1️⃣", `pyr_step_0`),
      Markup.button.callback("2️⃣", `pyr_step_1`),
      Markup.button.callback("3️⃣", `pyr_step_2`),
      Markup.button.callback("4️⃣", `pyr_step_3`)
    ],
    [Markup.button.callback(`💰 Забрать выигрыш (${currentWin.toLocaleString()} монет)`, `pyr_cashout`)]
  ];

  const keyboard = Markup.inlineKeyboard(buttons);
  const msg = `${titleText}\n\n🪜 Уровень: **${currentLevel.step}/10**\n💣 Мин на уровне: **${currentLevel.minesCount} из 4**\n📊 Множитель: **x${currentLevel.mult}**\n💵 Выигрыш: **${currentWin.toLocaleString()} монет**`;

  if (ctx.callbackQuery) await ctx.editMessageText(msg, keyboard);
  else await ctx.reply(msg, keyboard);
}

bot.action(/^pyr_step_(\d+)$/, async (ctx) => {
  const userId = ctx.from.id;
  const game = activePyramidGames.get(userId);
  if (!game) return ctx.answerCbQuery("❌ Игра не найдена!", { show_alert: true });

  const choice = Number(ctx.match[1]);
  if (game.mines.has(choice)) {
    activePyramidGames.delete(userId);
    return ctx.editMessageText(`💥 **ПИРАМИДА ОБРУШИЛАСЬ!** Вы потеряли 🪙 **${game.bet.toLocaleString()}** монет.`);
  }

  game.stepIdx += 1;
  if (game.stepIdx >= PYRAMID_CONFIG.length) {
    const win = Math.floor(game.bet * 50.0);
    const u = ecoUser(ctx);
    u.balance += win;
    activePyramidGames.delete(userId);
    return ctx.editMessageText(`🏆 **ПОБЕДА!** Вы прошли все 10 уровней и забрали 🪙 **${win.toLocaleString()}** монет (x50)!`);
  }

  const nextLevel = PYRAMID_CONFIG[game.stepIdx];
  game.mines = generateMinesForStep(nextLevel.minesCount);
  await renderPyramidStep(ctx, userId, `🎉 **Переход на уровень ${nextLevel.step}!**`);
});

bot.action("pyr_cashout", async (ctx) => {
  const userId = ctx.from.id;
  const game = activePyramidGames.get(userId);
  if (!game) return ctx.answerCbQuery("❌ Игра не найдена!", { show_alert: true });

  const currentLevel = PYRAMID_CONFIG[game.stepIdx];
  const win = Math.floor(game.bet * currentLevel.mult);
  const u = ecoUser(ctx);
  u.balance += win;
  activePyramidGames.delete(userId);
  await ctx.editMessageText(`🤑 **ВЫИГРЫШ ЗАБРАН!** Вы забрали 🪙 **${win.toLocaleString()} монет**!`);
});

// ==================== 2. МИНЫ 7x7 (КНОПКИ) ====================

bot.hears(/^(мина|мины|mina) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);
  if (u.balance < bet) return ctx.reply("❌ Недостаточно монет!");

  u.balance -= bet;
  const userId = ctx.from.id;

  const mines = new Set();
  while (mines.size < 7) mines.add(Math.floor(Math.random() * 49));

  activeMinesGames.set(userId, { bet: bet, mines: mines, revealed: new Set(), multiplier: 1.0 });
  await renderMinesGrid(ctx, userId, "💣 **ИГРА МИНЫ (7x7)**");
});

async function renderMinesGrid(ctx, userId, messageText) {
  const game = activeMinesGames.get(userId);
  if (!game) return;

  const buttons = [];
  for (let r = 0; r < 7; r++) {
    const row = [];
    for (let c = 0; c < 7; c++) {
      const idx = r * 7 + c;
      if (game.revealed.has(idx)) row.push(Markup.button.callback("💎", `mines_none`));
      else row.push(Markup.button.callback("🟦", `mines_click_${idx}`));
    }
    buttons.push(row);
  }

  const currentWin = Math.floor(game.bet * game.multiplier);
  buttons.push([Markup.button.callback(`💰 Забрать выигрыш (${currentWin.toLocaleString()} монет)`, `mines_cashout`)]);

  const keyboard = Markup.inlineKeyboard(buttons);
  const text = `${messageText}\n\n📊 Множитель: **x${game.multiplier.toFixed(2)}**\n💵 Выигрыш: **${currentWin.toLocaleString()} монет**`;

  if (ctx.callbackQuery) await ctx.editMessageText(text, keyboard);
  else await ctx.reply(text, keyboard);
}

bot.action(/^mines_click_(\d+)$/, async (ctx) => {
  const userId = ctx.from.id;
  const game = activeMinesGames.get(userId);
  if (!game) return ctx.answerCbQuery("❌ Игра не найдена!", { show_alert: true });

  const idx = Number(ctx.match[1]);
  if (game.mines.has(idx)) {
    activeMinesGames.delete(userId);
    return ctx.editMessageText(`💥 **ВЗРЫВ!** Вы потеряли 🪙 **${game.bet.toLocaleString()}** монет.`);
  }

  game.revealed.add(idx);
  game.multiplier += 0.25;

  if (game.revealed.size === 42) {
    const win = Math.floor(game.bet * game.multiplier);
    ecoUser(ctx).balance += win;
    activeMinesGames.delete(userId);
    return ctx.editMessageText(`🎉 **ИДЕАЛЬНО!** Вы выиграли 🪙 **${win.toLocaleString()}** монет!`);
  }

  await renderMinesGrid(ctx, userId, "💣 **ИГРА МИНЫ (7x7)**");
});

bot.action("mines_cashout", async (ctx) => {
  const userId = ctx.from.id;
  const game = activeMinesGames.get(userId);
  if (!game) return ctx.answerCbQuery("❌ Игра не найдена!", { show_alert: true });

  const win = Math.floor(game.bet * game.multiplier);
  ecoUser(ctx).balance += win;
  activeMinesGames.delete(userId);
  await ctx.editMessageText(`🤑 **ВЫИГРЫШ ЗАБРАН!** Вы выиграли 🪙 **${win.toLocaleString()} монет**!`);
});

bot.action("mines_none", (ctx) => ctx.answerCbQuery());

// ==================== 3-21 ОСТАЛЬНЫЕ МИНИ-ИГРЫ ====================

bot.hears(/^кубик ([1-6]) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const choice = Number(ctx.match[1]);
  const bet = Number(ctx.match[2]);
  if (u.balance < bet) return ctx.reply("❌ Недостаточно монет!");

  u.balance -= bet;
  const rolled = Math.floor(Math.random() * 6) + 1;
  if (rolled === choice) {
    const win = bet * 4;
    u.balance += win;
    await ctx.reply(`🎲 Выпало **${rolled}**! Вы выиграли 🪙 **${win.toLocaleString()}** монет!`);
  } else {
    await ctx.reply(`🎲 Выпало **${rolled}**. Вы проиграли 🪙 **${bet.toLocaleString()}** монет.`);
  }
});

bot.hears(/^рулетка (red|black|красное|черное) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);
  if (u.balance < bet) return ctx.reply("❌ Недостаточно монет!");

  u.balance -= bet;
  const isRed = Math.random() > 0.5;
  const userChoiceRed = ctx.match[1].toLowerCase() === "red" || ctx.match[1].toLowerCase() === "красное";

  if (isRed === userChoiceRed) {
    const win = bet * 2;
    u.balance += win;
    await ctx.reply(`🎰 Выпало **${isRed ? "🔴 Красное" : "⬛ Черное"}**! Вы выиграли 🪙 **${win.toLocaleString()}** монет!`);
  } else {
    await ctx.reply(`🎰 Выпало **${isRed ? "🔴 Красное" : "⬛ Черное"}**. Вы проиграли 🪙 **${bet.toLocaleString()}** монет.`);
  }
});

bot.hears(/^казино (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (u.balance < bet) return ctx.reply("❌ Недостаточно монет!");

  u.balance -= bet;
  const chance = Math.random();
  if (chance > 0.55) {
    const win = Math.floor(bet * 2.2);
    u.balance += win;
    await ctx.reply(`🎰 **УДАЧА!** Вы выиграли 🪙 **${win.toLocaleString()}** монет!`);
  } else {
    await ctx.reply(`🎰 **НЕУДАЧА!** Вы проиграли 🪙 **${bet.toLocaleString()}** монет.`);
  }
});

bot.hears(/^монета (орел|решка) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);
  if (u.balance < bet) return ctx.reply("❌ Недостаточно монет!");

  u.balance -= bet;
  const res = Math.random() > 0.5 ? "орел" : "решка";
  if (res === ctx.match[1].toLowerCase()) {
    const win = bet * 2;
    u.balance += win;
    await ctx.reply(`🪙 Выпал **${res.toUpperCase()}**! Вы выиграли 🪙 **${win.toLocaleString()}** монет!`);
  } else {
    await ctx.reply(`🪙 Выпал **${res.toUpperCase()}**. Вы проиграли 🪙 **${bet.toLocaleString()}** монет.`);
  }
});

bot.hears(/^сейф (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (u.balance < bet) return ctx.reply("❌ Недостаточно монет!");

  u.balance -= bet;
  if (Math.random() < 0.25) {
    const win = bet * 5;
    u.balance += win;
    await ctx.reply(`🔓 **СЕЙФ ВЗЛОМАН!** Вы получили 🪙 **${win.toLocaleString()}** монет!`);
  } else {
    await ctx.reply(`🔒 **ОШИБКА КОДА!** Вы потеряли 🪙 **${bet.toLocaleString()}** монет.`);
  }
});

bot.hears(/^дуэль (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (u.balance < bet) return ctx.reply("❌ Недостаточно монет!");

  u.balance -= bet;
  if (Math.random() > 0.48) {
    const win = Math.floor(bet * 1.95);
    u.balance += win;
    await ctx.reply(`⚔️ **ВЫ ПРАЗИЛИ СОПЕРНИКА!** Выигрыш: 🪙 **${win.toLocaleString()}** монет!`);
  } else {
    await ctx.reply(`⚔️ **СОПЕРНИК ОКАЗАЛСЯ СИЛЬНЕЕ!** Проигрыш: 🪙 **${bet.toLocaleString()}** монет.`);
  }
});

bot.hears(/^суперкубик (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (u.balance < bet) return ctx.reply("❌ Недостаточно монет!");

  u.balance -= bet;
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const sum = d1 + d2;
  if (sum >= 8) {
    const win = Math.floor(bet * 1.8);
    u.balance += win;
    await ctx.reply(`🎲 Выпало **${d1}** и **${d2}** (Сумма: ${sum})! Вы выиграли 🪙 **${win.toLocaleString()}** монет!`);
  } else {
    await ctx.reply(`🎲 Выпало **${d1}** и **${d2}** (Сумма: ${sum}). Вы проиграли 🪙 **${bet.toLocaleString()}** монет.`);
  }
});

bot.hears(/^блэкджек (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (u.balance < bet) return ctx.reply("❌ Недостаточно монет!");

  u.balance -= bet;
  const player = Math.floor(Math.random() * 7) + 15;
  const dealer = Math.floor(Math.random() * 7) + 15;

  if (player <= 21 && (player > dealer || dealer > 21)) {
    const win = bet * 2;
    u.balance += win;
    await ctx.reply(`🃏 У вас **${player}**, у дилера **${dealer}**. Вы выиграли 🪙 **${win.toLocaleString()}** монет!`);
  } else {
    await ctx.reply(`🃏 У вас **${player}**, у дилера **${dealer}**. Вы проиграли 🪙 **${bet.toLocaleString()}** монет.`);
  }
});

bot.hears(/^фортуна (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (u.balance < bet) return ctx.reply("❌ Недостаточно монет!");

  u.balance -= bet;
  const mults = [0, 0.5, 1.5, 2.0, 3.0, 5.0];
  const mult = mults[Math.floor(Math.random() * mults.length)];
  const win = Math.floor(bet * mult);
  u.balance += win;
  await ctx.reply(`🎡 Колесо остановилось на **x${mult}**! Вы получили 🪙 **${win.toLocaleString()}** монет!`);
});

bot.hears(/^скачки ([1-4]) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const horse = Number(ctx.match[1]);
  const bet = Number(ctx.match[2]);
  if (u.balance < bet) return ctx.reply("❌ Недостаточно монет!");

  u.balance -= bet;
  const winner = Math.floor(Math.random() * 4) + 1;
  if (horse === winner) {
    const win = bet * 3;
    u.balance += win;
    await ctx.reply(`🏇 Победила лошадь **№${winner}**! Ваш выигрыш: 🪙 **${win.toLocaleString()}** монет!`);
  } else {
    await ctx.reply(`🏇 Победила лошадь **№${winner}**. Вы проиграли 🪙 **${bet.toLocaleString()}** монет.`);
  }
});

bot.hears(/^лотерея$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const win = Math.floor(Math.random() * 10000) + 1000;
  u.balance += win;
  await ctx.reply(`🎫 Ваш лотерейный билет принес: **+${win.toLocaleString()} монет**!`);
});

bot.hears(/^(футбол|баскетбол|боулинг|дартс) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const game = ctx.match[1].toLowerCase();
  const bet = Number(ctx.match[2]);
  if (u.balance < bet) return ctx.reply("❌ Недостаточно монет!");

  u.balance -= bet;
  if (Math.random() > 0.5) {
    const win = Math.floor(bet * 1.85);
    u.balance += win;
    await ctx.reply(`🎯 Успешный бросок/удар в **${game}**! Вы выиграли 🪙 **${win.toLocaleString()}** монет!`);
  } else {
    await ctx.reply(`🎯 Промах в **${game}**! Вы проиграли 🪙 **${bet.toLocaleString()}** монет.`);
  }
});

bot.hears(/^коробка (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (u.balance < bet) return ctx.reply("❌ Недостаточно монет!");

  u.balance -= bet;
  const mult = (Math.random() * 3).toFixed(1);
  const win = Math.floor(bet * mult);
  u.balance += win;
  await ctx.reply(`📦 В коробке оказался множитель **x${mult}**! Вы получили 🪙 **${win.toLocaleString()}** монет!`);
});

bot.hears(/^краш (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (u.balance < bet) return ctx.reply("❌ Недостаточно монет!");

  u.balance -= bet;
  const crash = (Math.random() * 4 + 1).toFixed(2);
  if (crash > 1.8) {
    const win = Math.floor(bet * crash);
    u.balance += win;
    await ctx.reply(`📈 График долетел до **x${crash}**! Вы забираете 🪙 **${win.toLocaleString()}** монет!`);
  } else {
    await ctx.reply(`💥 График свалился на **x${crash}**! Вы потеряли 🪙 **${bet.toLocaleString()}** монет.`);
  }
});

bot.hears(/^хайло (выше|ниже) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);
  if (u.balance < bet) return ctx.reply("❌ Недостаточно монет!");

  u.balance -= bet;
  const num = Math.floor(Math.random() * 100) + 1;
  const isHigher = num > 50;
  const userChoiceHigher = ctx.match[1].toLowerCase() === "выше";

  if (isHigher === userChoiceHigher) {
    const win = Math.floor(bet * 1.9);
    u.balance += win;
    await ctx.reply(`🔢 Выпало число **${num}**! Вы угадали и выиграли 🪙 **${win.toLocaleString()}** монет!`);
  } else {
    await ctx.reply(`🔢 Выпало число **${num}**. Вы проиграли 🪙 **${bet.toLocaleString()}** монет.`);
  }
});

bot.hears(/^камень (камень|ножницы|бумага) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const userChoice = ctx.match[1].toLowerCase();
  const bet = Number(ctx.match[2]);
  if (u.balance < bet) return ctx.reply("❌ Недостаточно монет!");

  u.balance -= bet;
  const choices = ["камень", "ножницы", "бумага"];
  const botChoice = choices[Math.floor(Math.random() * 3)];

  if (userChoice === botChoice) {
    u.balance += bet;
    await ctx.reply(`✂️ Ничья! Бот тож выбрал **${botChoice}**. Ставка возвращена.`);
  } else if (
    (userChoice === "камень" && botChoice === "ножницы") ||
    (userChoice === "ножницы" && botChoice === "бумага") ||
    (userChoice === "бумага" && botChoice === "камень")
  ) {
    const win = bet * 2;
    u.balance += win;
    await ctx.reply(`🎉 Вы выиграли! Бот выбрал **${botChoice}**. Вы получаете 🪙 **${win.toLocaleString()}** монет!`);
  } else {
    await ctx.reply(`😔 Бот выбрал **${botChoice}** и победил. Вы потеряли 🪙 **${bet.toLocaleString()}** монет.`);
  }
});

// ==================== БАНК, БОНУС, БОГАТЫЕ ====================

bot.hears(/^банк$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `🏦 **НАЦИОНАЛЬНЫЙ БАНК**\n\n` +
    `💰 В кошельке: **${u.balance.toLocaleString()} монет**\n` +
    `🏛️ На банковском счету: **${u.bank.toLocaleString()} монет**\n` +
    `📈 Ежечасный процент: **+3%**\n\n` +
    `📝 **Команды банка:**\n` +
    `• \`банк положить [сумма/все]\` — Депозит в банк\n` +
    `• \`банк снять [сумма/все]\` — Снять деньги из банка`
  );
});

bot.hears(/^банк положить (\d+|все)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  let amount = ctx.match[1].toLowerCase() === "все" ? u.balance : Number(ctx.match[1]);
  if (amount <= 0 || u.balance < amount) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= amount;
  u.bank += amount;
  await ctx.reply(`🏛️ Положено в банк: **${amount.toLocaleString()} монет**!`);
});

bot.hears(/^банк снять (\d+|все)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  let amount = ctx.match[1].toLowerCase() === "все" ? u.bank : Number(ctx.match[1]);
  if (amount <= 0 || u.bank < amount) return ctx.reply("❌ Недостаточно средств в банке!");

  u.bank -= amount;
  u.balance += amount;
  await ctx.reply(`💰 Снято из банка: **${amount.toLocaleString()} монет**!`);
});

bot.hears(/^(богатые|топ|top)$/i, async (ctx) => {
  const allUsers = Array.from(economyUsers.values());
  if (allUsers.length === 0) return ctx.reply("📊 Список богат пока пуст.");

  allUsers.sort((a, b) => (b.balance + b.bank) - (a.balance + a.bank));

  let text = `💎 **ТОП-10 БОГАТЫХ ИГРОКОВ** 💎\n\n`;
  allUsers.slice(0, 10).forEach((u, i) => {
    const total = u.balance + u.bank;
    text += `${i + 1}. ${ecoName(u)} — **${total.toLocaleString()}** монет\n`;
  });

  await ctx.reply(text);
});

bot.hears(/^бонус$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  const cooldown = 4 * 60 * 60 * 1000;

  if (now - u.lastBonus < cooldown) {
    const remaining = Math.ceil((cooldown - (now - u.lastBonus)) / (60 * 1000));
    return ctx.reply(`⏳ Вы уже получали бонус! Приходите через **${remaining} мин.**`);
  }

  const bonusAmount = 15000;
  u.balance += bonusAmount;
  u.lastBonus = now;
  await ctx.reply(`🎁 Вы получили бонус: **+${bonusAmount.toLocaleString()} монет**!`);
});

bot.command("start", async (ctx) => {
  await ctx.reply("👋 Бот готов к работе! Все 21 игра доступны без знак '!'. Напишите `игры`.");
});

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🔥 Полная версия с 21 игрой успешно запущена!");
  } catch (err) {
    console.error(err);
  }
}

startBot();
