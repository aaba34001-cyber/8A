require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);
const OWNER_ID = Number(process.env.OWNER_ID || 8480297110);

const economyUsers = new Map();
const activeMinesGames = new Map();
const activePyramidGames = new Map();
const activeTradingGames = new Map();

function ecoUser(ctx) {
  const id = String(ctx.from.id);
  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id: ctx.from.id,
      name: ctx.from.first_name || "Пользователь",
      username: ctx.from.username || null,
      balance: 50000,
      bank: 0,
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

// Bankka har soatda +3% foyda
setInterval(() => {
  economyUsers.forEach((u) => {
    if (u.bank > 0) {
      const interest = Math.floor(u.bank * 0.03);
      u.bank += interest;
    }
  });
}, 60 * 60 * 1000);

// ==================== ПРОФИЛЬ / БАЛАНС / ПАСПОРТ ====================

bot.hears(/^(профиль|баланс|паспорт|проф|profile|balans)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const totalMoney = u.balance + u.bank;

  await ctx.reply(
    `👤 **ПРОФИЛЬ ИГРОКА** — ${ecoName(u)}\n` +
    `🆔 **ID:** \`${u.id}\`\n\n` +
    `💰 **Кошелек:** **${u.balance.toLocaleString()} монет**\n` +
    `🏛️ **Банк:** **${u.bank.toLocaleString()} монет**\n` +
    `📊 **Всего капитала:** **${totalMoney.toLocaleString()} монет**\n\n` +
    `🚘 **Автомобиль:** ${u.car}\n` +
    `🏢 **Бизнес:** ${u.business}`
  );
});

// ==================== РАБОТА (HAR 10 DAQIQADA) ====================

bot.hears(/^(работа|работать|ish|ishlash)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  const cooldown = 10 * 60 * 1000;

  if (now - u.lastWork < cooldown) {
    const remainingSec = Math.ceil((cooldown - (now - u.lastWork)) / 1000);
    const min = Math.floor(remainingSec / 60);
    const sec = remainingSec % 60;
    return ctx.reply(`⏳ Вы устали! Отдохните еще **${min} мин. ${sec} сек.**`);
  }

  const salary = Math.floor(Math.random() * 5000) + 3000;
  u.balance += salary;
  u.lastWork = now;

  const jobs = [
    "🛠️ Вы поработали на стройке",
    "🚖 Вы поработали таксистом",
    "💻 Вы написали код на заказ",
    "📦 Вы доставили посылки",
    "☕ Вы поработали баристой"
  ];
  const randomJob = jobs[Math.floor(Math.random() * jobs.length)];

  await ctx.reply(`${randomJob} и заработали: **+${salary.toLocaleString()} монет**!`);
});

// ==================== БОНУС (HAR 24 SOATDA) ====================

bot.hears(/^(бонус|bonus)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  const cooldown = 24 * 60 * 60 * 1000;

  if (now - u.lastBonus < cooldown) {
    const remainingMs = cooldown - (now - u.lastBonus);
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    return ctx.reply(`⏳ Вы уже получали бонус! Приходите через **${hours} ч. ${mins} мин.**`);
  }

  const bonusAmount = 15000;
  u.balance += bonusAmount;
  u.lastBonus = now;
  await ctx.reply(`🎁 Вы получили ежедневный бонус: **+${bonusAmount.toLocaleString()} монет**!`);
});

// ==================== МАГАЗИН ====================

const SHOP_ITEMS = [
  { id: 1, name: "🚗 Chevrolet Gentra", price: 100000, type: "car" },
  { id: 2, name: "🏎️ BMW M5 CS", price: 500000, type: "car" },
  { id: 3, name: "🏎️ Porsche 911 GT3 RS", price: 1500000, type: "car" },
  { id: 4, name: "☕ Небольшая Кофейня", price: 300000, type: "biz" },
  { id: 5, name: "🏬 Супермаркет", price: 1000000, type: "biz" },
  { id: 6, name: "🏢 IT-Компания", price: 5000000, type: "biz" }
];

bot.hears(/^(магазин|shop|dokon|do'kon)$/i, async (ctx) => {
  let text = `🛒 **МАГАЗИН ТОВАРОВ И БИЗНЕСОВ**\n\n`;
  text += `🚘 **Автомобили:**\n`;
  SHOP_ITEMS.filter(i => i.type === "car").forEach(i => {
    text += `${i.id}. ${i.name} — **${i.price.toLocaleString()} монет**\n`;
  });

  text += `\n🏢 **Бизнесы:**\n`;
  SHOP_ITEMS.filter(i => i.type === "biz").forEach(i => {
    text += `${i.id}. ${i.name} — **${i.price.toLocaleString()} монет**\n`;
  });

  text += `\n📝 Для покупки введите: \`купить [номер]\``;
  await ctx.reply(text);
});

bot.hears(/^(купить|buy) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const itemId = Number(ctx.match[2]);
  const item = SHOP_ITEMS.find(i => i.id === itemId);

  if (!item) return ctx.reply("❌ Товар с таким номером не найден!");
  if (u.balance < item.price) return ctx.reply("❌ У вас недостаточно денег!");

  u.balance -= item.price;
  if (item.type === "car") u.car = item.name;
  else u.business = item.name;

  await ctx.reply(`🎉 Вы успешно купили: **${item.name}**!`);
});

// ==================== ТРЕЙДИНГ ====================

bot.hears(/^(трейдинг|трейд|trade)( (\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = ctx.match[3] ? Number(ctx.match[3]) : 0;

  if (!bet || bet <= 0) {
    return ctx.reply("📉 Чтобы начать трейдинг, укажите ставку!\nПример: `трейдинг 1000`");
  }

  if (u.balance < bet) return ctx.reply("❌ Недостаточно монет в кошельке!");

  u.balance -= bet;
  const userId = ctx.from.id;
  const startPrice = (Math.random() * 5000 + 40000).toFixed(2);

  activeTradingGames.set(userId, { bet, startPrice: Number(startPrice) });

  const buttons = Markup.inlineKeyboard([
    [
      Markup.button.callback("📈 Вверх (LONG)", "trade_up"),
      Markup.button.callback("📉 Вниз (SHORT)", "trade_down")
    ]
  ]);

  await ctx.reply(
    `📊 **ТРЕЙДИНГ СИМУЛЯТОР (BTC/USDT)**\n\n` +
    `💵 Ваша ставка: **${bet.toLocaleString()} монет**\n` +
    `📍 Текущая цена: **$${startPrice}**\n\n` +
    `Сделайте ваш прогноз цены:`,
    buttons
  );
});

async function processTradeResult(ctx, direction) {
  const userId = ctx.from.id;
  const game = activeTradingGames.get(userId);
  if (!game) return ctx.answerCbQuery("❌ Сделка не найдена!", { show_alert: true });

  activeTradingGames.delete(userId);
  const u = ecoUser(ctx);

  const percentChange = (Math.random() * 10 - 5).toFixed(2);
  const priceChange = (game.startPrice * (percentChange / 100)).toFixed(2);
  const finalPrice = (game.startPrice + Number(priceChange)).toFixed(2);

  const isWin = (direction === "up" && percentChange > 0) || (direction === "down" && percentChange < 0);

  let resultMsg = `📊 **РЕЗУЛЬТАТ ТРЕЙДИНГА**\n\n` +
    `📍 Цена входа: **$${game.startPrice}**\n` +
    `🏁 Цена закрытия: **$${finalPrice}** (${percentChange >= 0 ? "+" : ""}${percentChange}%)\n\n`;

  if (isWin) {
    const win = Math.floor(game.bet * 1.95);
    u.balance += win;
    resultMsg += `🎉 **УСПЕШНАЯ СДЕЛКА!**\n💰 Вы выиграли: **${win.toLocaleString()} монет** (+95%)`;
  } else {
    resultMsg += `📉 **ЛИКВИДАЦИЯ!**\n💸 Вы потеряли: **${game.bet.toLocaleString()} монет**`;
  }

  await ctx.editMessageText(resultMsg);
}

bot.action("trade_up", (ctx) => processTradeResult(ctx, "up"));
bot.action("trade_down", (ctx) => processTradeResult(ctx, "down"));

// ==================== ПИРАМИДА (2x2 GRID FORMAT) ====================

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
  while (mines.size < minesCount) mines.add(Math.floor(Math.random() * 4));
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

  await renderPyramidStep(ctx, userId, "🔺 **ПОШАГОВАЯ ПИРАМИДА (2x2)**\n\nУровень 1: Выберите безопасную ячейку!");
});

async function renderPyramidStep(ctx, userId, titleText) {
  const game = activePyramidGames.get(userId);
  if (!game) return;

  const currentLevel = PYRAMID_CONFIG[game.stepIdx];
  const currentWin = Math.floor(game.bet * currentLevel.mult);

  const buttons = [
    [
      Markup.button.callback("1️⃣", `pyr_step_0`),
      Markup.button.callback("2️⃣", `pyr_step_1`)
    ],
    [
      Markup.button.callback("3️⃣", `pyr_step_2`),
      Markup.button.callback("4️⃣", `pyr_step_3`)
    ],
    [Markup.button.callback(`💰 Забрать выигрыш (${currentWin.toLocaleString()} монет)`, `pyr_cashout`)]
  ];

  const keyboard = Markup.inlineKeyboard(buttons);
  const msg = `${titleText}\n\n🪜 Уровень: **${currentLevel.step}/10**\n💣 Мин на сетке 2x2: **${currentLevel.minesCount} из 4**\n📊 Множитель: **x${currentLevel.mult}**\n💵 Выигрыш: **${currentWin.toLocaleString()} монет**`;

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
    return ctx.editMessageText(`💥 **ПИРАМИДА ОБРУШИЛАСЬ!** Вы попали на мину и потеряли 🪙 **${game.bet.toLocaleString()}** монет.`);
  }

  game.stepIdx += 1;
  if (game.stepIdx >= PYRAMID_CONFIG.length) {
    const win = Math.floor(game.bet * 50.0);
    ecoUser(ctx).balance += win;
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
  ecoUser(ctx).balance += win;
  activePyramidGames.delete(userId);
  await ctx.editMessageText(`🤑 **ВЫИГРЫШ ЗАБРАН!** Вы забрали 🪙 **${win.toLocaleString()} монет**!`);
});

// ==================== МИНЫ 7x7 ====================

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

// ==================== ИГРЫ МЕНЮ ====================

bot.hears(/^(игры|games)$/i, async (ctx) => {
  await ctx.reply(
    `🎰 **ПОЛНЫЙ СПИСОК ИГР И ФУНКЦИЙ** 🎰\n\n` +
    `💼 **Экономика:**\n` +
    `• \`профиль\` / \`баланс\` — Посмотреть баланс и имущество\n` +
    `• \`работа\` — Заработать (КД 10 мин)\n` +
    `• \`магазин\` — Авто и Бизнесы\n` +
    `• \`бонус\` — Бонус 15k (КД 24 часа)\n` +
    `• \`банк\` — Накопительный счет\n` +
    `• \`трейдинг [ставка]\` — Трейдинг бинарками\n\n` +
    `🎮 **Мини-игры:**\n` +
    `1. \`мина [ставка]\` — Пошаговые Мины 7x7\n` +
    `2. \`пирамида [ставка]\` — Пирамида (2x2 сетка)\n` +
    `3. \`казино [ставка]\` — Казино\n` +
    `4. \`рулетка [red/black] [ставка]\` — Рулетка\n` +
    `5. \`камень [камень/ножницы/бумага] [ставка]\` — Цу-е-фа`
  );
});

bot.command("start", async (ctx) => {
  await ctx.reply("👋 Бот обновлен! Теперь есть команды `профиль` и `баланс`!");
});

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🔥 Бот обновлен va yurgizildi!");
  } catch (err) {
    console.error(err);
  }
}

startBot();
