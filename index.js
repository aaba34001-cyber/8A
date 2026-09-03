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

const VIP_LEVELS = {
  1: { name: "VIP Bronze 🥉", price: 5000000, bonusMult: 1.1, workMult: 1.1 },
  2: { name: "VIP Silver 🥈", price: 25000000, bonusMult: 1.25, workMult: 1.25 },
  3: { name: "VIP Gold 🥇", price: 100000000, bonusMult: 1.5, workMult: 1.5 },
  4: { name: "VIP Platinum 💎", price: 500000000, bonusMult: 2.0, workMult: 2.0 },
  5: { name: "VIP DIAMOND 👑", price: 2000000000, bonusMult: 3.0, workMult: 3.0 }
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

const CASES = [
  { id: 1, name: "📦 Бронзовый Кейс", price: 50000, minWin: 5000, maxWin: 80000 },
  { id: 2, name: "🎁 Серебряный Кейс", price: 250000, minWin: 20000, maxWin: 400000 },
  { id: 3, name: "💎 Золотой Кейс", price: 1000000, minWin: 100000, maxWin: 1800000 },
  { id: 4, name: "👑 Драгоценный Кейс", price: 10000000, minWin: 1000000, maxWin: 15000000 }
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

setInterval(() => {
  economyUsers.forEach((u) => {
    if (u.bank > 0) {
      u.bank += Math.floor(u.bank * 0.01);
    }
    if (u.business !== "Отсутствует") {
      const biz = SHOP_ITEMS.find(i => i.name === u.business);
      if (biz) {
        if (biz.id === 6) u.balance += 15000;
        if (biz.id === 7) u.balance += 100000;
        if (biz.id === 8) u.balance += 600000;
        if (biz.id === 9) u.balance += 3500000;
      }
    }
  });
}, 60 * 60 * 1000);

// ==================== REPLY PEREVOD (NO ID) ====================

bot.hears(/^(перевод|transfer|otkazma) (\d+)$/i, async (ctx) => {
  const sender = ecoUser(ctx);
  const amount = Number(ctx.match[2]);

  if (!ctx.message.reply_to_message) {
    return ctx.reply("❌ Чтобы перевести монеты, ответьте (reply) на сообщение игрока!");
  }

  const targetUserObj = ctx.message.reply_to_message.from;
  if (targetUserObj.is_bot) return ctx.reply("❌ Нельзя переводить деньги ботам!");
  if (targetUserObj.id === ctx.from.id) return ctx.reply("❌ Нельзя переводить деньги самому себе!");

  if (!amount || amount <= 0) return ctx.reply("❌ Неверная сумма перевода!");
  if (sender.balance < amount) return ctx.reply("❌ Недостаточно монет на балансе!");

  const targetId = String(targetUserObj.id);
  if (!economyUsers.has(targetId)) {
    economyUsers.set(targetId, {
      id: targetUserObj.id,
      name: targetUserObj.first_name || "Игрок",
      username: targetUserObj.username || null,
      balance: 10000,
      bank: 0,
      vip: 0,
      business: "Отсутствует",
      car: "Отсутствует",
      lastBonus: 0,
      lastWork: 0
    });
  }

  const receiver = economyUsers.get(targetId);
  sender.balance -= amount;
  receiver.balance += amount;

  await ctx.reply(`💸 **УСПЕШНЫЙ ПЕРЕВОД!**\n\n👤 От: **${ecoName(sender)}**\n👤 Кому: **${ecoName(receiver)}**\n💰 Сумма: **${amount.toLocaleString()} монет**`);
});

// ==================== BALANS & PROFILE (SEPARATED) ====================

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

// ==================== LEADERBOARD ====================

bot.hears(/^(богатые|богачи|топ|top|boylar)$/i, async (ctx) => {
  if (economyUsers.size === 0) return ctx.reply("📊 Список пока пуст!");

  const usersArr = Array.from(economyUsers.values());
  usersArr.sort((a, b) => (b.balance + b.bank) - (a.balance + a.bank));

  const top10 = usersArr.slice(0, 10);
  let text = `🏆 **ТОП-10 САМЫХ БОГАТЫХ ИГРОКОВ**\n\n`;
  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

  top10.forEach((u, index) => {
    const total = u.balance + u.bank;
    text += `${medals[index]} **${ecoName(u)}** — **${total.toLocaleString()} монет**\n`;
  });

  const currentUser = ecoUser(ctx);
  const userRank = usersArr.findIndex(u => String(u.id) === String(currentUser.id)) + 1;
  text += `\n👤 **Ваше место:** #${userRank} (${(currentUser.balance + currentUser.bank).toLocaleString()} монет)`;

  await ctx.reply(text);
});

// ==================== BANK ====================

bot.hears(/^(банк|bank)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `🏛️ **БАНК "8A HARD CAPITAL"**\n\n` +
    `💰 Баланс в банке: **${u.bank.toLocaleString()} монет**\n` +
    `📈 Доходность: **+1% каждый час**\n\n` +
    `📌 **Команды:**\n` +
    `• \`банк положить [сумма/все]\`\n` +
    `• \`банк снять [сумма/все]\``
  );
});

bot.hears(/^(банк|bank) (положить|dep) (\d+|все)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  let amount = ctx.match[3] === "все" ? u.balance : Number(ctx.match[3]);
  if (!amount || amount <= 0 || u.balance < amount) return ctx.reply("❌ Недостаточно монет!");

  u.balance -= amount;
  u.bank += amount;
  await ctx.reply(`🏛️ Вы внесли **${amount.toLocaleString()} монет** в банк!`);
});

bot.hears(/^(банк|bank) (снять|wd) (\d+|все)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  let amount = ctx.match[3] === "все" ? u.bank : Number(ctx.match[3]);
  if (!amount || amount <= 0 || u.bank < amount) return ctx.reply("❌ Недостаточно средств!");

  u.bank -= amount;
  u.balance += amount;
  await ctx.reply(`🏛️ Вы сняли **${amount.toLocaleString()} монет** из банка!`);
});

// ==================== STARS DONATE & WITHDRAW ====================

bot.hears(/^(донат|donat|stars)$/i, async (ctx) => {
  const btns = Markup.inlineKeyboard([
    [Markup.button.invoice("⭐ 50 Stars — 5,000,000 монет", "50 Stars", "Buy 5M Coins", "stars_50", "", "XTR", [{ amount: 50, label: "50 Stars" }])],
    [Markup.button.invoice("⭐ 100 Stars — 12,000,000 монет", "100 Stars", "Buy 12M Coins", "stars_100", "", "XTR", [{ amount: 100, label: "100 Stars" }])],
    [Markup.button.invoice("⭐ 500 Stars — 70,000,000 монет", "500 Stars", "Buy 70M Coins", "stars_500", "", "XTR", [{ amount: 500, label: "500 Stars" }])]
  ]);
  await ctx.reply(`⭐ **ДОНАТ TELEGRAM STARS** ⭐\n\nВыберите пакет:`, btns);
});

bot.on("pre_checkout_query", (ctx) => ctx.answerPreCheckoutQuery(true));

bot.on("successful_payment", async (ctx) => {
  const u = ecoUser(ctx);
  const payload = ctx.message.successful_payment.invoice_payload;
  let added = 0;
  if (payload === "stars_50") added = 5000000;
  else if (payload === "stars_100") added = 12000000;
  else if (payload === "stars_500") added = 70000000;

  u.balance += added;
  await ctx.reply(`🎉 **УСПЕШНАЯ ОПЛАТА!** Вам зачислено **+${added.toLocaleString()} монет**!`);
});

bot.hears(/^(вывод|vyvod|withdraw)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const reqCoins = 8000000;

  if (u.balance < reqCoins) {
    return ctx.reply(`❌ **НЕДОСТАТОЧНО МОНЕТ!**\n\nДля вывода **50 Telegram Stars** нужно **8,000,000 монет**.\n💰 Ваш баланс: **${u.balance.toLocaleString()} монет**.`);
  }

  u.balance -= reqCoins;
  try {
    await bot.telegram.sendMessage(OWNER_ID, `🎁 **ЗАЯВКА НА ВЫВОД 50 STARS!**\n\n👤 Игрок: ${ecoName(u)}\n🆔 ID: \`${u.id}\``);
  } catch (err) {}

  await ctx.reply(`✅ **ЗАЯВКА ПРИНЯТА!** Списано **8,000,000 монет**. Заявка отправлена администратору!`);
});

// ==================== WORK & BONUS ====================

bot.hears(/^(работа|работать|ish|ishlash)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  const cooldown = 30 * 60 * 1000;

  if (now - u.lastWork < cooldown) {
    const rem = Math.ceil((cooldown - (now - u.lastWork)) / 1000);
    return ctx.reply(`⏳ Отдыхайте еще **${Math.floor(rem / 60)} мин. ${rem % 60} сек.**`);
  }

  let mult = u.vip > 0 ? VIP_LEVELS[u.vip].workMult : 1.0;
  if (u.car === "🚗 Chevrolet Cobalt") mult += 0.05;
  if (u.car === "🚘 Gentra Black Edition") mult += 0.10;
  if (u.car === "🏎️ BMW M5 F90 CS") mult += 0.20;
  if (u.car === "🏎️ Porsche 911 GT3 RS") mult += 0.35;
  if (u.car === "🏎️ Bugatti Chiron") mult += 0.50;

  const salary = Math.floor((Math.floor(Math.random() * 1500) + 500) * mult);
  u.balance += salary;
  u.lastWork = now;

  await ctx.reply(`🛠️ Вы поработали и заработали: **+${salary.toLocaleString()} монет**!`);
});

bot.hears(/^(бонус|bonus)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  const cooldown = 24 * 60 * 60 * 1000;

  if (now - u.lastBonus < cooldown) {
    const rem = cooldown - (now - u.lastBonus);
    return ctx.reply(`⏳ Бонус доступен через **${Math.floor(rem / (1000 * 60 * 60))} ч.**`);
  }

  const mult = u.vip > 0 ? VIP_LEVELS[u.vip].bonusMult : 1.0;
  const bonusAmount = Math.floor(3000 * mult);

  u.balance += bonusAmount;
  u.lastBonus = now;
  await ctx.reply(`🎁 Ваш ежедневный бонус: **+${bonusAmount.toLocaleString()} монет**!`);
});

// ==================== SHOP & VIP & CASES ====================

bot.hears(/^(магазин|shop)$/i, async (ctx) => {
  let text = `🛒 **МАГАЗИН ИМУЩЕСТВА**\n\n🚘 **Автомобили (Увеличивают доход на работе):**\n`;
  SHOP_ITEMS.filter(i => i.type === "car").forEach(i => {
    text += `${i.id}. ${i.name} — **${i.price.toLocaleString()} монет** (${i.income})\n`;
  });
  text += `\n🏢 **Бизнесы (Приносят пассивный доход каждый час):**\n`;
  SHOP_ITEMS.filter(i => i.type === "biz").forEach(i => {
    text += `${i.id}. ${i.name} — **${i.price.toLocaleString()} монет** (${i.income})\n`;
  });
  text += `\n📝 Покупка: \`купить [номер]\``;
  await ctx.reply(text);
});

bot.hears(/^(купить|buy) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const itemId = Number(ctx.match[2]);
  const item = SHOP_ITEMS.find(i => i.id === itemId);

  if (!item) return ctx.reply("❌ Товар не найден!");
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= item.price;
  if (item.type === "car") u.car = item.name;
  else u.business = item.name;

  await ctx.reply(`🎉 Вы успешно купили: **${item.name}**!`);
});

bot.hears(/^(vip|вип)$/i, async (ctx) => {
  let text = `👑 **VIP СТАТУСЫ**\n\n`;
  for (const [lvl, info] of Object.entries(VIP_LEVELS)) {
    text += `${lvl}. **${info.name}** — **${info.price.toLocaleString()} монет**\n`;
  }
  text += `\n📝 Покупка: \`купить вип [номер]\``;
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
    text += `${c.id}. **${c.name}** — **${c.price.toLocaleString()} монет**\n`;
  });
  text += `\n📝 Открытие: \`открыть кейс [номер]\``;
  await ctx.reply(text);
});

bot.hears(/^(открыть кейс|кейс) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const caseId = Number(ctx.match[2]);
  const c = CASES.find(x => x.id === caseId);

  if (!c) return ctx.reply("❌ Кейс не найден!");
  if (u.balance < c.price) return ctx.reply("❌ Недостаточно монет!");

  u.balance -= c.price;
  const isLucky = Math.random() < 0.20;
  let winAmount = isLucky ? Math.floor(Math.random() * (c.maxWin - c.price)) + c.price : Math.floor(Math.random() * (c.price - c.minWin)) + c.minWin;

  u.balance += winAmount;
  await ctx.reply(`📦 **КЕЙС: ${c.name}**\n\n🎰 Вы выбили: **${winAmount.toLocaleString()} монет**!`);
});

// ==================== INTERACTIVE MINES 7x7 ====================

bot.hears(/^(мина|мины|mina) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);

  if (!bet || bet < 500) return ctx.reply("❌ Мин. ставка: 500!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;
  const userId = ctx.from.id;

  const mines = new Set();
  while (mines.size < 15) mines.add(Math.floor(Math.random() * 49));

  activeMinesGames.set(userId, { bet, mines, revealed: new Set(), mult: 1.0 });
  await renderMinesGrid(ctx, userId, "💣 **МИНЫ (7x7 HARDMODE)**");
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
  buttons.push([Markup.button.callback(`💰 Забрать (${curWin.toLocaleString()})`, "mines_cashout")]);

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
  g.mult += 0.15;
  await renderMinesGrid(ctx, userId, "💣 **МИННОЕ ПОЛЕ (7x7)**");
});

bot.action("mines_cashout", async (ctx) => {
  const userId = ctx.from.id;
  const g = activeMinesGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ Игра завершена!", { show_alert: true });

  const win = Math.floor(g.bet * g.mult);
  ecoUser(ctx).balance += win;
  activeMinesGames.delete(userId);
  await ctx.editMessageText(`🤑 **ВЫИГРЫШ ЗАБРАН!** Вы выиграли **${win.toLocaleString()} монет**!`);
});

bot.action("mines_nop", (ctx) => ctx.answerCbQuery());

// ==================== ALL 21 GAMBLING GAMES ====================

function playHardGame(ctx, bet, winRate, winMult, gameTitle) {
  const u = ecoUser(ctx);
  if (!bet || bet <= 0 || u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;
  const isWin = Math.random() < winRate;

  if (isWin) {
    const prize = Math.floor(bet * winMult);
    u.balance += prize;
    return ctx.reply(`${gameTitle}\n🎉 **ПОБЕДА!** +${prize.toLocaleString()} монет!`);
  } else {
    return ctx.reply(`${gameTitle}\n📉 **ПРОИГРЫШ!** -${bet.toLocaleString()} монет.`);
  }
}

bot.hears(/^(казино|casino) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.22, 2.0, "🎰 **КАЗИНО**"));
bot.hears(/^(кубик|dice) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.20, 2.0, "🎲 **КУБИК**"));
bot.hears(/^(дартс|darts) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.18, 2.2, "🎯 **ДАРТС**"));
bot.hears(/^(баскетбол|basket) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.18, 2.2, "🏀 **БАСКЕТБОЛ**"));
bot.hears(/^(футбол|football) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.20, 2.0, "⚽ **ФУТБОЛ**"));
bot.hears(/^(слоты|slots) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.15, 3.5, "🎰 **СЛОТЫ**"));
bot.hears(/^(монетка|flip) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.25, 1.9, "🪙 **МОНЕТКА**"));
bot.hears(/^(кости|bones) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.22, 2.0, "🎲 **КОСТИ**"));
bot.hears(/^(рулетка|roulette) (красное|черное) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[3]), 0.25, 1.95, "🎡 **РУЛЕТКА**"));
bot.hears(/^(камень|ножницы|бумага) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.20, 2.0, "✂️ **ЦУ-Е-ФА**"));
bot.hears(/^(орел|решка) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.25, 1.9, "🦅 **ОРЁЛ И РЕШКА**"));
bot.hears(/^(колесо|wheel) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.12, 4.0, "🎡 **КОЛЕСО ФОРТУНЫ**"));
bot.hears(/^(блекджек|blackjack) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.22, 2.0, "🃏 **БЛЕКДЖЕК**"));
bot.hears(/^(покер|poker) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.18, 2.5, "🎴 **ПОКЕР**"));
bot.hears(/^(лотерея|lotto) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.08, 8.0, "🎟️ **ЛОТЕРЕЯ**"));
bot.hears(/^(сейф|safe) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.10, 5.0, "🔐 **СЕЙФ**"));
bot.hears(/^(скачки|race) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.18, 3.0, "🐎 **СКАЧКИ**"));
bot.hears(/^(дуэль|duel) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.25, 1.9, "⚔️ **ДУЭЛЬ**"));
bot.hears(/^(трейдинг|trade) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.25, 1.95, "📈 **ТРЕЙДИНГ**"));
bot.hears(/^(пирамида|pyramid) (\d+)$/i, ctx => playHardGame(ctx, Number(ctx.match[2]), 0.20, 2.5, "🔺 **ПИРАМИДА**"));

// ==================== GAMES & RULES MENU ====================

bot.hears(/^(игры|games|правила|qoidalar|menu)$/i, async (ctx) => {
  await ctx.reply(
    `📜 **ПРАВИЛА И МЕНЮ БОТА**\n\n` +
    `💸 **Перевод монет:**\n` +
    `• \`перевод [сумма]\` — пишется в **ответ (reply)** на сообщение игрока.\n\n` +
    `🚘 **Что дают Машины:**\n` +
    `• Увеличивают зарплату на работе (\`работа\`): Cobalt (+5%), Gentra (+10%), BMW M5 (+20%), Porsche (+35%), Bugatti (+50%).\n\n` +
    `🏢 **Что дают Бизнесы:**\n` +
    `• Каждый час приносят пассивный доход на ваш баланс (от 15,000 до 3,500,000 монет в час).\n\n` +
    `👤 **Профиль и Баланс:**\n` +
    `• \`баланс\` — показывает ваши монеты на руках и в банке.\n` +
    `• \`профиль\` — показывает имя, ID, VIP, машину и бизнес.\n\n` +
    `🎮 **Мини-игры (21 игра):**\n` +
    `• \`мина [ставка]\` — интерактивная игра 7x7 на кнопках.\n` +
    `• \`пирамида [ставка]\`, \`казино\`, \`слоты\`, \`рулетка красное/черное\`, \`покер\`, \`блекджек\`, \`трейдинг\`, \`дуэль\`, \`скачки\`, \`кубик\`, \`сейф\`, \`колесо\` и др.\n\n` +
    `💼 **Экономика:** \`банк\`, \`магазин\`, \`vip\`, \`кейсы\`, \`работа\`, \`бонус\`, \`богатые\`, \`донат\`, \`вывод\``
  );
});

bot.command("start", async (ctx) => {
  await ctx.reply("🔥 Бот онлайн! Введите `игры` или `правила`.");
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
