require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("❌ CRITICAL ERROR: BOT_TOKEN is missing in Environment Variables!");
  process.exit(1);
}

const bot = new Telegraf(token);
const OWNER_ID = Number(process.env.OWNER_ID || 8480297110);

// Data structures
const economyUsers = new Map();
const activeMinesGames = new Map();
const activePyramidGames = new Map();
const activeTradingGames = new Map();
const activeCrashGames = new Map();

// VIP Systems Definition
const VIP_LEVELS = {
  1: { name: "VIP Bronze 🥉", price: 5000000, bonusMult: 1.1, workMult: 1.1 },
  2: { name: "VIP Silver 🥈", price: 25000000, bonusMult: 1.25, workMult: 1.25 },
  3: { name: "VIP Gold 🥇", price: 100000000, bonusMult: 1.5, workMult: 1.5 },
  4: { name: "VIP Platinum 💎", price: 500000000, bonusMult: 2.0, workMult: 2.0 },
  5: { name: "VIP DIAMOND 👑", price: 2000000000, bonusMult: 3.0, workMult: 3.0 }
};

// SHOP Items
const SHOP_ITEMS = [
  { id: 1, name: "🚗 Chevrolet Cobalt", price: 250000, type: "car" },
  { id: 2, name: "🚘 Gentra Black Edition", price: 600000, type: "car" },
  { id: 3, name: "🏎️ BMW M5 F90 CS", price: 3000000, type: "car" },
  { id: 4, name: "🏎️ Porsche 911 GT3 RS", price: 10000000, type: "car" },
  { id: 5, name: "🏎️ Bugatti Chiron", price: 50000000, type: "car" },
  { id: 6, name: "☕ Небольшая Кофейня", price: 1000000, type: "biz" },
  { id: 7, name: "🏬 Сеть Супермаркетов", price: 8000000, type: "biz" },
  { id: 8, name: "🏭 Нефтяная Вышка", price: 40000000, type: "biz" },
  { id: 9, name: "🏢 IT-Холдинг Corp", price: 200000000, type: "biz" }
];

// CASES
const CASES = [
  { id: 1, name: "📦 Бронзовый Кейс", price: 50000, minWin: 5000, maxWin: 80000 },
  { id: 2, name: "🎁 Серебряный Кейс", price: 250000, minWin: 20000, maxWin: 400000 },
  { id: 3, name: "💎 Золотой Кейс", price: 1000000, minWin: 100000, maxWin: 1800000 },
  { id: 4, name: "👑 Драгоценный Кейс", price: 10000000, minWin: 1000000, maxWin: 15000000 }
];

// User initialization
function ecoUser(ctx) {
  const id = String(ctx.from.id);
  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id: ctx.from.id,
      name: ctx.from.first_name || "Игрок",
      username: ctx.from.username || null,
      balance: 10000, // Kamlangangan boshlang'ich balans
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

// Bank Interest Interval (+1% every hour)
setInterval(() => {
  economyUsers.forEach((u) => {
    if (u.bank > 0) {
      const interest = Math.floor(u.bank * 0.01);
      u.bank += interest;
    }
  });
}, 60 * 60 * 1000);

// ==================== PROFILE / BALANCE / BANK ====================

bot.hears(/^(профиль|баланс|паспорт|проф|profile|balans)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const totalMoney = u.balance + u.bank;
  const vipName = u.vip > 0 ? VIP_LEVELS[u.vip].name : "Отсутствует";

  await ctx.reply(
    `👤 **ПРОФИЛЬ ИГРОКА** — ${ecoName(u)}\n` +
    `🆔 **ID:** \`${u.id}\`\n\n` +
    `💰 **Кошелек:** **${u.balance.toLocaleString()} монет**\n` +
    `🏛️ **Банк:** **${u.bank.toLocaleString()} монет** (+1%/час)\n` +
    `📊 **Всего капитала:** **${totalMoney.toLocaleString()} монет**\n\n` +
    `👑 **VIP Статус:** ${vipName}\n` +
    `🚘 **Автомобиль:** ${u.car}\n` +
    `🏢 **Бизнес:** ${u.business}`
  );
});

bot.hears(/^(банк|bank)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `🏛️ **БАНК "8A HARD CAPITAL"**\n\n` +
    `💰 Баланс в банке: **${u.bank.toLocaleString()} монет**\n` +
    `📈 Доходность: **+1% каждый час**\n\n` +
    `📌 **Команды:**\n` +
    `• \`банк положить [сумма/все]\` — Внести на депозит\n` +
    `• \`банк снять [сумма/все]\` — Снять с депозита`
  );
});

bot.hears(/^(банк|bank) (положить|dep) (\d+|все)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  let amount = ctx.match[3] === "все" ? u.balance : Number(ctx.match[3]);
  if (!amount || amount <= 0 || u.balance < amount) return ctx.reply("❌ Недостаточно монет в кошельке!");

  u.balance -= amount;
  u.bank += amount;
  await ctx.reply(`🏛️ Вы успешно внесли **${amount.toLocaleString()} монет** в банк!`);
});

bot.hears(/^(банк|bank) (снять|wd) (\d+|все)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  let amount = ctx.match[3] === "все" ? u.bank : Number(ctx.match[3]);
  if (!amount || amount <= 0 || u.bank < amount) return ctx.reply("❌ Недостаточно средств в банке!");

  u.bank -= amount;
  u.balance += amount;
  await ctx.reply(`🏛️ Вы успешно сняли **${amount.toLocaleString()} монет** из банка!`);
});

// ==================== WORK & BONUS (HARDMODE) ====================

bot.hears(/^(работа|работать|ish|ishlash)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  const cooldown = 30 * 60 * 1000; // 30 daqiqa cooldown

  if (now - u.lastWork < cooldown) {
    const remainingSec = Math.ceil((cooldown - (now - u.lastWork)) / 1000);
    const min = Math.floor(remainingSec / 60);
    const sec = remainingSec % 60;
    return ctx.reply(`⏳ Вы переутомились! Отдыхайте еще **${min} мин. ${sec} сек.**`);
  }

  const mult = u.vip > 0 ? VIP_LEVELS[u.vip].workMult : 1.0;
  const baseSalary = Math.floor(Math.random() * 1500) + 500; // Qiyinlashtirilgan oylik
  const salary = Math.floor(baseSalary * mult);

  u.balance += salary;
  u.lastWork = now;

  const jobs = [
    "🛠️ Вы тяжелая работали на шахте",
    "🚖 Вы развозили заказы в ночную смену",
    "🧹 Вы убирали улицу в мороз",
    "📦 Вы разгружали вагоны с грузом"
  ];
  const rJob = jobs[Math.floor(Math.random() * jobs.length)];

  await ctx.reply(`${rJob} и заработали: **+${salary.toLocaleString()} монет**! ${u.vip > 0 ? `(VIP x${mult})` : ""}`);
});

bot.hears(/^(бонус|bonus)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  const cooldown = 24 * 60 * 60 * 1000;

  if (now - u.lastBonus < cooldown) {
    const rem = cooldown - (now - u.lastBonus);
    const hours = Math.floor(rem / (1000 * 60 * 60));
    const mins = Math.floor((rem % (1000 * 60 * 60)) / (1000 * 60));
    return ctx.reply(`⏳ Ежедневный бонус доступен через **${hours} ч. ${mins} мин.**`);
  }

  const mult = u.vip > 0 ? VIP_LEVELS[u.vip].bonusMult : 1.0;
  const bonusAmount = Math.floor(3000 * mult); // Kichikroq bonus

  u.balance += bonusAmount;
  u.lastBonus = now;
  await ctx.reply(`🎁 Вы получили ежедневный бонус: **+${bonusAmount.toLocaleString()} монет**!`);
});

// ==================== SHOP & VIP & CASES ====================

bot.hears(/^(магазин|shop)$/i, async (ctx) => {
  let text = `🛒 **МАГАЗИН ИМУЩЕСТВА**\n\n🚘 **Автомобили:**\n`;
  SHOP_ITEMS.filter(i => i.type === "car").forEach(i => {
    text += `${i.id}. ${i.name} — **${i.price.toLocaleString()} монет**\n`;
  });
  text += `\n🏢 **Бизнесы:**\n`;
  SHOP_ITEMS.filter(i => i.type === "biz").forEach(i => {
    text += `${i.id}. ${i.name} — **${i.price.toLocaleString()} монет**\n`;
  });
  text += `\n📝 Для покупки: \`купить [номер]\``;
  await ctx.reply(text);
});

bot.hears(/^(купить|buy) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const itemId = Number(ctx.match[2]);
  const item = SHOP_ITEMS.find(i => i.id === itemId);

  if (!item) return ctx.reply("❌ Товар не найден!");
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств на балансе!");

  u.balance -= item.price;
  if (item.type === "car") u.car = item.name;
  else u.business = item.name;

  await ctx.reply(`🎉 Вы успешно купили: **${item.name}**!`);
});

bot.hears(/^(vip|вип)$/i, async (ctx) => {
  let text = `👑 **VIP СТАТУСЫ**\n\n`;
  for (const [lvl, info] of Object.entries(VIP_LEVELS)) {
    text += `${lvl}. **${info.name}** — **${info.price.toLocaleString()} монет**\n`;
    text += `   📊 Множитель работы/бонусов: x${info.workMult}\n`;
  }
  text += `\n📝 Для покупки: \`купить вип [номер]\``;
  await ctx.reply(text);
});

bot.hears(/^(купить|buy) (vip|вип) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const lvl = Number(ctx.match[3]);
  const vipObj = VIP_LEVELS[lvl];

  if (!vipObj) return ctx.reply("❌ Неверный номер VIP!");
  if (u.balance < vipObj.price) return ctx.reply("❌ Недостаточно денег!");

  u.balance -= vipObj.price;
  u.vip = lvl;
  await ctx.reply(`🎉 Вы купили статус **${vipObj.name}**!`);
});

bot.hears(/^(кейсы|cases)$/i, async (ctx) => {
  let text = `📦 **СЕКРЕТНЫЕ КЕЙСЫ**\n\n`;
  CASES.forEach(c => {
    text += `${c.id}. **${c.name}** — Стоимость: **${c.price.toLocaleString()} монет**\n`;
    text += `   🎁 Возможный выигрыш: ${c.minWin.toLocaleString()} - ${c.maxWin.toLocaleString()}\n`;
  });
  text += `\n📝 Для открытия: \`открыть кейс [номер]\``;
  await ctx.reply(text);
});

bot.hears(/^(открыть кейс|кейс) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const caseId = Number(ctx.match[2]);
  const c = CASES.find(x => x.id === caseId);

  if (!c) return ctx.reply("❌ Кейс не найден!");
  if (u.balance < c.price) return ctx.reply("❌ Недостаточно монет!");

  u.balance -= c.price;

  // Qattiq shans: 80% holatda zararga kiradi
  const isLucky = Math.random() < 0.20;
  let winAmount = 0;

  if (isLucky) {
    winAmount = Math.floor(Math.random() * (c.maxWin - c.price)) + c.price;
  } else {
    winAmount = Math.floor(Math.random() * (c.price - c.minWin)) + c.minWin;
  }

  u.balance += winAmount;
  await ctx.reply(
    `📦 **ОТКРЫТИЕ КЕЙСА: ${c.name}**\n\n` +
    `🎰 Вы выбили: **${winAmount.toLocaleString()} монет**!\n` +
    `${winAmount >= c.price ? "🎉 Отличный куш!" : "📉 Увы, кейс не окупился!"}`
  );
});

// ==================== MINES 7x7 INTERACTIVE GAME ====================

bot.hears(/^(мина|мины|mina) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);

  if (!bet || bet < 500) return ctx.reply("❌ Минимальная ставка: 500 монет!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;
  const userId = ctx.from.id;

  // 15 minalar 49 ta katakdan (Portlash ehtimoli juda yuqori)
  const mines = new Set();
  while (mines.size < 15) mines.add(Math.floor(Math.random() * 49));

  activeMinesGames.set(userId, { bet, mines, revealed: new Set(), mult: 1.0 });
  await renderMinesGrid(ctx, userId, "💣 **МИННОЕ ПОЛЕ (7x7 HARDMODE)**\n15 мин скрыто на поле!");
});

async function renderMinesGrid(ctx, userId, title) {
  const g = activeMinesGames.get(userId);
  if (!g) return;

  const buttons = [];
  for (let r = 0; r < 7; r++) {
    const row = [];
    for (let c = 0; c < 7; c++) {
      const idx = r * 7 + c;
      if (g.revealed.has(idx)) row.push(Markup.button.callback("💎", "mines_nop"));
      else row.push(Markup.button.callback("🟦", `mines_click_${idx}`));
    }
    buttons.push(row);
  }

  const curWin = Math.floor(g.bet * g.mult);
  buttons.push([Markup.button.callback(`💰 Забрать (${curWin.toLocaleString()} монет)`, "mines_cashout")]);

  const text = `${title}\n\n📊 Множитель: **x${g.mult.toFixed(2)}**\n💵 Выигрыш: **${curWin.toLocaleString()} монет**`;

  if (ctx.callbackQuery) await ctx.editMessageText(text, Markup.inlineKeyboard(buttons));
  else await ctx.reply(text, Markup.inlineKeyboard(buttons));
}

bot.action(/^mines_click_(\d+)$/, async (ctx) => {
  const userId = ctx.from.id;
  const g = activeMinesGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ Игра завершена!", { show_alert: true });

  const idx = Number(ctx.match[1]);
  if (g.mines.has(idx)) {
    activeMinesGames.delete(userId);
    return ctx.editMessageText(`💥 **БОМБА ВЗОРВАЛАСЬ!** Вы потеряли **${g.bet.toLocaleString()} монет**.`);
  }

  g.revealed.add(idx);
  g.mult += 0.15; // Kichikroq ko'paytiruvchi
  await renderMinesGrid(ctx, userId, "💣 **МИННОЕ ПОЛЕ (7x7)**");
});

bot.action("mines_cashout", async (ctx) => {
  const userId = ctx.from.id;
  const g = activeMinesGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ Игра завершена!", { show_alert: true });

  const win = Math.floor(g.bet * g.mult);
  ecoUser(ctx).balance += win;
  activeMinesGames.delete(userId);
  await ctx.editMessageText(`🤑 **ВЫИГРЫШ ЗАБРАН!** Вы забрали **${win.toLocaleString()} монет**!`);
});

bot.action("mines_nop", (ctx) => ctx.answerCbQuery());

// ==================== TRADING SIMULATION (BINARY OPTIONS) ====================

bot.hears(/^(трейдинг|trade) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);

  if (!bet || bet < 1000) return ctx.reply("❌ Минимальная ставка в трейдинге: 1,000 монет!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;
  const userId = ctx.from.id;
  const price = (Math.random() * 2000 + 60000).toFixed(2);

  activeTradingGames.set(userId, { bet, price: Number(price) });

  const btns = Markup.inlineKeyboard([
    [Markup.button.callback("📈 LONG (Вверх)", "trade_long"), Markup.button.callback("📉 SHORT (Вниз)", "trade_short")]
  ]);

  await ctx.reply(`📊 **БИРЖА BTC/USDT**\n\n💵 Ваша ставка: **${bet.toLocaleString()} монет**\n📍 Текущая цена: **$${price}**\n\nСделайте прогноз:`, btns);
});

bot.action(/^trade_(long|short)$/, async (ctx) => {
  const userId = ctx.from.id;
  const g = activeTradingGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ Сделка истекла!", { show_alert: true });

  activeTradingGames.delete(userId);
  const dir = ctx.match[1];
  const u = ecoUser(ctx);

  // Qattiq shanslar: 25% yutish, 75% yutqazish
  const isWin = Math.random() < 0.25;
  const diff = (Math.random() * 500 + 100).toFixed(2);
  const finalPrice = dir === "long" 
    ? (isWin ? g.price + Number(diff) : g.price - Number(diff))
    : (isWin ? g.price - Number(diff) : g.price + Number(diff));

  if (isWin) {
    const win = Math.floor(g.bet * 1.8);
    u.balance += win;
    await ctx.editMessageText(`📊 **ТРЕЙДИНГ УСПЕШЕН!**\n\n📍 Вход: $${g.price}\n🏁 Закрытие: $${finalPrice.toFixed(2)}\n💰 Вы зафиксировали прибыль: **+${win.toLocaleString()} монет**!`);
  } else {
    await ctx.editMessageText(`📉 **ЛИКВИДАЦИЯ ПОЗИЦИИ!**\n\n📍 Вход: $${g.price}\n🏁 Закрытие: $${finalPrice.toFixed(2)}\n💸 Ваша позиция ликвидирована: **-${g.bet.toLocaleString()} монет**.`);
  }
});

// ==================== CRASH / ROCKET GAME ====================

bot.hears(/^(краш|crash) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);

  if (!bet || bet < 1000) return ctx.reply("❌ Минимальная ставка: 1,000 монет!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;

  // 80% holatlarda 1.0x - 1.2x oralig'ida raketa portlaydi
  const crashPoint = Math.random() < 0.8 ? (Math.random() * 0.3 + 1.0).toFixed(2) : (Math.random() * 3.0 + 1.2).toFixed(2);
  const userTakePoint = (Math.random() * 1.5 + 1.1).toFixed(2);

  if (Number(userTakePoint) <= Number(crashPoint)) {
    const win = Math.floor(bet * Number(userTakePoint));
    u.balance += win;
    await ctx.reply(`🚀 **РАКЕТА УСПЕШНО УЛЕТЕЛА!**\n\n💥 Взрыв на: **x${crashPoint}**\n✅ Ваша авто-забор: **x${userTakePoint}**\n💰 Вы выиграли: **+${win.toLocaleString()} монет**!`);
  } else {
    await ctx.reply(`💥 **РАКЕТА ВЗОРВАЛАСЬ!**\n\n💥 Взрыв на: **x${crashPoint}**\n❌ Вы не успели забрать!\n💸 Потеряно: **-${bet.toLocaleString()} монет**.`);
  }
});

// ==================== HARDMODE GAMBLING ENGINE FOR 21 GAMES ====================

function playHardGame(ctx, bet, winRate, winMult, gameTitle) {
  const u = ecoUser(ctx);
  if (!bet || bet <= 0) return ctx.reply("❌ Укажите корректную ставку!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно монет на балансе!");

  u.balance -= bet;
  
  // Qattiq foizlar bilan tasodifiy mantiq
  const isWin = Math.random() < winRate;

  if (isWin) {
    const prize = Math.floor(bet * winMult);
    u.balance += prize;
    return ctx.reply(`${gameTitle}\n🎉 **ПОБЕДА!** Вы выиграли: **+${prize.toLocaleString()} монет**!`);
  } else {
    return ctx.reply(`${gameTitle}\n📉 **ПРОИГРЫШ!** Вы потеряли: **-${bet.toLocaleString()} монет**.`);
  }
}

// Low win rates (15% - 25% max)
bot.hears(/^(казино|casino) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.22, 2.0, "🎰 **КАЗИНО**"));
bot.hears(/^(кубик|dice) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.20, 2.0, "🎲 **КУБИК**"));
bot.hears(/^(дартс|darts) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.18, 2.2, "🎯 **ДАРТС**"));
bot.hears(/^(баскетбол|basket) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.18, 2.2, "🏀 **БАСКЕТБОЛ**"));
bot.hears(/^(футбол|football) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.20, 2.0, "⚽ **ФУТБОЛ**"));
bot.hears(/^(слоты|slots) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.15, 3.5, "🎰 **СЛОТЫ**"));
bot.hears(/^(монетка|flip) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.25, 1.9, "🪙 **МОНЕТКА**"));
bot.hears(/^(кости|bones) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.22, 2.0, "🎲 **КОСТИ**"));
bot.hears(/^(рулетка|roulette) (красное|черное|red|black) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[3]), 0.25, 1.95, "🎡 **РУЛЕТКА**"));
bot.hears(/^(камень|ножницы|бумага) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.20, 2.0, "✂️ **ЦУ-Е-ФА**"));
bot.hears(/^(орел|решка) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.25, 1.9, "🦅 **ОРЁЛ И РЕШКА**"));
bot.hears(/^(колесо|wheel) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.12, 4.0, "🎡 **КОЛЕСО ФОРТУНЫ**"));
bot.hears(/^(блекджек|blackjack) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.22, 2.0, "🃏 **БЛЕКДЖЕК**"));
bot.hears(/^(покер|poker) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.18, 2.5, "🎴 **ПОКЕР**"));
bot.hears(/^(лотерея|lotto) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.08, 8.0, "🎟️ **ЛОТЕРЕЯ**"));
bot.hears(/^(сейф|safe) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.10, 5.0, "🔐 **СЕЙФ**"));
bot.hears(/^(скачки|race) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.18, 3.0, "🐎 **СКАЧКИ**"));
bot.hears(/^(дуэль|duel) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.25, 1.9, "⚔️ **ДУЭЛЬ**"));

// ==================== GAMES MENU ====================

bot.hears(/^(игры|games)$/i, async (ctx) => {
  await ctx.reply(
    `🎰 **ПОЛНЫЙ СПИСОК ИГР И ИНТЕРАКТИВОВ**\n\n` +
    `🔥 **Интерактивные мини-игры (С кнопками):**\n` +
    `• \`мина [ставка]\` — Мины (7x7 Сетка)\n` +
    `• \`трейдинг [ставка]\` — Трейдинг бинарными опционами\n` +
    `• \`краш [ставка]\` — Игра Crash / Ракета\n` +
    `• \`кейсы\` / \`открыть кейс [номер]\` — Открытие кейсов\n\n` +
    `🎲 **Быстрые классические игры:**\n` +
    `• \`казино [ставка]\` | \`слоты [ставка]\` | \`рулетка красное [ставка]\`\n` +
    `• \`кубик [ставка]\` | \`дартс [ставка]\` | \`баскетбол [ставка]\`\n` +
    `• \`покер [ставка]\` | \`блекджек [ставка]\` | \`сейф [ставка]\`\n` +
    `• \`лотерея [ставка]\` | \`скачки [ставка]\` | \`дуэль [ставка]\`\n\n` +
    `💼 **Экономика:**\n` +
    `• \`профиль\` — Посмотреть баланс\n` +
    `• \`банк\` — Банковская система\n` +
    `• \`vip\` — VIP Статусы`
  );
});

bot.command("start", async (ctx) => {
  await ctx.reply("🔥 Бот успешно запущен в режиме HardMode! Введите `игры` или `профиль`.");
});

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🚀 HARDMODE BOT HAS STARTED SUCCESSFULLY!");
  } catch (err) {
    console.error("Critical Start Error:", err);
  }
}

startBot();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
