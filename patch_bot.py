#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re
from pathlib import Path

TARGET = Path("index.js")

if not TARGET.exists():
    print("❌ index.js не найден в текущей папке.")
    raise SystemExit(1)

s = TARGET.read_text(encoding="utf-8")
orig_len = len(s)

def once(pattern, s, msg_ok, msg_fail, flags=0, count=1):
    new_s, n = re.subn(pattern, "", s, count=count, flags=flags)
    if n:
        print("✅", msg_ok)
    else:
        print("⚠️", msg_fail)
    return new_s

# ==================== 1) УБИРАЕМ СЛОТЫ ====================
s = once(
    r'bot\.hears\(/\^\(слоты\|slots\)[^\n]*\n?',
    s,
    "Игра «Слоты» удалена",
    "Строка со слотами не найдена (возможно уже убрана)"
)

# ==================== 2) РАСШИРЯЕМ КАТАЛОГИ ====================

def extend_array(varname, new_items, s):
    pattern = re.compile(r'(const\s+' + varname + r'\s*=\s*\[)(.*?)(\n\];)', re.DOTALL)
    m = pattern.search(s)
    if not m:
        print(f"⚠️ Массив {varname} не найден — пропускаю")
        return s
    insert = ",\n  " + ",\n  ".join(new_items)
    new_block = m.group(1) + m.group(2).rstrip().rstrip(",") + insert + "\n" + m.group(3)
    s = s[:m.start()] + new_block + s[m.end():]
    print(f"✅ {varname}: добавлено {len(new_items)} новых позиций")
    return s

new_cars = [
    '{ name: "🏎 Nissan GT-R R35", price: 18000000 }',
    '{ name: "🏎 Mercedes-Benz S680", price: 22000000 }',
    '{ name: "🏎 Audi R8 V10", price: 27000000 }',
    '{ name: "🏎 Lamborghini Huracan", price: 35000000 }',
    '{ name: "🏎 Ferrari 488 Pista", price: 45000000 }',
    '{ name: "🏎 McLaren 720S", price: 60000000 }',
    '{ name: "🏎 Aston Martin DBS", price: 75000000 }',
    '{ name: "🏎 Pagani Huayra", price: 150000000 }',
    '{ name: "🏎 Bugatti Divo", price: 250000000 }',
    '{ name: "🏎 Bugatti La Voiture Noire", price: 400000000 }'
]
s = extend_array("CARS", new_cars, s)

new_biz = [
    '{ name: "🏦 Частный Банк", price: 300000000, income: 28000000 }',
    '{ name: "🛢️ Нефтяная Компания", price: 500000000, income: 50000000 }',
    '{ name: "🏭 Автомобильный Завод", price: 700000000, income: 75000000 }',
    '{ name: "📡 Телеком Оператор", price: 900000000, income: 95000000 }',
    '{ name: "🚢 Судоходная Компания", price: 1200000000, income: 130000000 }',
    '{ name: "⛏️ Золотодобывающая Шахта", price: 1500000000, income: 170000000 }',
    '{ name: "🏗️ Строительная Корпорация", price: 1800000000, income: 210000000 }',
    '{ name: "🛰️ Космическая Компания", price: 2500000000, income: 300000000 }',
    '{ name: "💊 Фарма-Гигант", price: 3200000000, income: 400000000 }',
    '{ name: "🏛️ Мировой Холдинг", price: 5000000000, income: 650000000 }'
]
s = extend_array("BIZ", new_biz, s)

new_planes = [
    '{ name: "🛫 Airbus A320 Private", price: 350000000 }',
    '{ name: "🛩️ Личный Boeing 787 Dreamliner", price: 900000000 }'
]
s = extend_array("PLANES", new_planes, s)

new_houses = [
    '{ name: "🏯 Замок во Франции", price: 500000000 }',
    '{ name: "🏝️ Частный остров с виллой", price: 800000000 }'
]
s = extend_array("HOUSES", new_houses, s)

# ==================== 3) НОВЫЙ БЛОК: продажа + аукцион + трейдинг + мини-игры ====================

big_block = r'''
// ==================== __EXTRA_FEATURES__ ====================

const AUCTION_FILE = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? process.env.RAILWAY_VOLUME_MOUNT_PATH + "/auctions.json"
  : "./auctions.json";

function loadAuctions() {
  try {
    if (fs.existsSync(AUCTION_FILE)) {
      return JSON.parse(fs.readFileSync(AUCTION_FILE, "utf8"));
    }
  } catch (e) {}
  return {};
}

function saveAuctions(data) {
  try {
    fs.writeFileSync(AUCTION_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Ошибка сохранения аукциона:", e);
  }
}

let auctions = loadAuctions();
let auctionCounter = Object.keys(auctions).length
  ? Math.max(...Object.keys(auctions).map(Number)) + 1
  : 1;

const SELLABLE = {
  "машину": { field: "car", list: CARS, label: "Автомобиль" },
  "авто": { field: "car", list: CARS, label: "Автомобиль" },
  "дом": { field: "house", list: HOUSES, label: "Дом" },
  "бизнес": { field: "business", list: BIZ, label: "Бизнес" },
  "самолет": { field: "plane", list: PLANES, label: "Самолёт" },
  "яхту": { field: "yacht", list: YACHTS, label: "Яхта" },
  "телефон": { field: "phone", list: PHONES, label: "Телефон" }
};

const pendingSales = new Map();

bot.hears(/^(продать)\s+(машину|авто|дом|бизнес|самолет|яхту|телефон)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const kind = ctx.match[2].toLowerCase();
  const info = SELLABLE[kind];
  if (!info) return;

  const current = u[info.field];
  if (!current || current === "Отсутствует") {
    return ctx.reply(`❌ У вас нет предмета в категории «${info.label}».`);
  }

  const catalogItem = info.list.find((x) => x.name === current);
  const basePrice = catalogItem ? catalogItem.price : 10000;
  const offer = Math.floor(basePrice * 0.5);

  pendingSales.set(ctx.from.id, { field: info.field, itemName: current, price: offer, basePrice, label: info.label });

  await ctx.reply(
    `💰 **ПРОДАЖА: ${info.label}**\n\n` +
    `📦 Предмет: **${current}**\n` +
    `💵 Предложенная цена: **${offer.toLocaleString()} монет**\n\n` +
    `Вы можете поторговаться с помощью кнопок ниже:`,
    Markup.inlineKeyboard([
      [
        Markup.button.callback("➖ 5000", "sale_dec"),
        Markup.button.callback("➕ 5000", "sale_inc")
      ],
      [Markup.button.callback("✅ Продать за эту цену", "sale_confirm")],
      [Markup.button.callback("❌ Отмена", "sale_cancel")]
    ])
  );
});

async function renderSale(ctx) {
  const state = pendingSales.get(ctx.from.id);
  if (!state) return;
  await ctx.editMessageText(
    `💰 **ПРОДАЖА: ${state.label}**\n\n` +
    `📦 Предмет: **${state.itemName}**\n` +
    `💵 Текущая цена: **${state.price.toLocaleString()} монет**\n\n` +
    `Поторгуйтесь или подтвердите продажу:`,
    Markup.inlineKeyboard([
      [
        Markup.button.callback("➖ 5000", "sale_dec"),
        Markup.button.callback("➕ 5000", "sale_inc")
      ],
      [Markup.button.callback("✅ Продать за эту цену", "sale_confirm")],
      [Markup.button.callback("❌ Отмена", "sale_cancel")]
    ])
  );
}

bot.action("sale_inc", async (ctx) => {
  const state = pendingSales.get(ctx.from.id);
  if (!state) return ctx.answerCbQuery("❌ Нет активной продажи", { show_alert: true });
  state.price = Math.min(state.basePrice, state.price + 5000);
  await renderSale(ctx);
  ctx.answerCbQuery();
});

bot.action("sale_dec", async (ctx) => {
  const state = pendingSales.get(ctx.from.id);
  if (!state) return ctx.answerCbQuery("❌ Нет активной продажи", { show_alert: true });
  state.price = Math.max(1000, state.price - 5000);
  await renderSale(ctx);
  ctx.answerCbQuery();
});

bot.action("sale_cancel", async (ctx) => {
  pendingSales.delete(ctx.from.id);
  await ctx.editMessageText("❌ Продажа отменена.");
  ctx.answerCbQuery();
});

bot.action("sale_confirm", async (ctx) => {
  const state = pendingSales.get(ctx.from.id);
  if (!state) return ctx.answerCbQuery("❌ Нет активной продажи", { show_alert: true });

  const u = ecoUser(ctx);
  u.balance += state.price;
  u[state.field] = "Отсутствует";
  if (state.field === "business") u.bizIncome = 0;

  pendingSales.delete(ctx.from.id);

  await ctx.editMessageText(
    `✅ **ПРОДАНО!**\n\n` +
    `📦 ${state.itemName}\n` +
    `💰 Получено: **+${state.price.toLocaleString()} монет**\n` +
    `💵 Баланс: **${u.balance.toLocaleString()} монет**`
  );
  ctx.answerCbQuery();
});

// ---------- АУКЦИОН ----------
bot.hears(/^(аукцион)\s+(.+?)\s+(\d+)\s+(\d{1,2}):(\d{2})$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const itemName = ctx.match[2].trim();
  const startPrice = Number(ctx.match[3]);
  const hh = Number(ctx.match[4]);
  const mm = Number(ctx.match[5]);

  if (!startPrice || startPrice <= 0) return ctx.reply("❌ Укажите правильную стартовую цену.");
  if (hh > 23 || mm > 59) return ctx.reply("❌ Неверное время. Формат: ЧЧ:ММ, например 11:00");

  const now = new Date();
  let endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0);
  if (endTime.getTime() <= now.getTime()) {
    endTime.setDate(endTime.getDate() + 1);
  }

  const id = String(auctionCounter++);
  auctions[id] = {
    id,
    sellerId: ctx.from.id,
    sellerName: ecoName(u),
    itemName,
    startPrice,
    currentBid: startPrice,
    currentBidderId: null,
    currentBidderName: null,
    endTime: endTime.getTime(),
    active: true,
    cancelled: false
  };
  saveAuctions(auctions);

  await ctx.reply(
    `🏷️ **АУКЦИОН СОЗДАН!**\n\n` +
    `🎁 Лот: **${itemName}**\n` +
    `💰 Стартовая цена: **${startPrice.toLocaleString()} монет**\n` +
    `⏰ Завершится в: **${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}**\n` +
    `🆔 Номер лота: **#${id}**\n\n` +
    `Чтобы сделать ставку: \`ставка ${id} [сумма]\`\n` +
    `Чтобы отменить: \`отменить аукцион ${id}\``
  );

  const delay = endTime.getTime() - Date.now();
  setTimeout(() => finishAuction(id), Math.min(delay, 2147000000));
});

bot.hears(/^(ставка)\s+(\d+)\s+(\d+)$/i, async (ctx) => {
  const id = ctx.match[2];
  const amount = Number(ctx.match[3]);
  const lot = auctions[id];

  if (!lot || !lot.active || lot.cancelled) return ctx.reply("❌ Такого активного аукциона нет.");
  if (Date.now() >= lot.endTime) return ctx.reply("❌ Время аукциона уже истекло.");
  if (String(lot.sellerId) === String(ctx.from.id)) return ctx.reply("❌ Вы не можете делать ставку на свой же лот.");
  if (amount <= lot.currentBid) return ctx.reply(`❌ Ставка должна быть выше текущей: **${lot.currentBid.toLocaleString()} монет**.`);

  const u = ecoUser(ctx);
  if (u.balance < amount) return ctx.reply("❌ У вас недостаточно монет для такой ставки.");

  lot.currentBid = amount;
  lot.currentBidderId = ctx.from.id;
  lot.currentBidderName = ecoName(u);
  saveAuctions(auctions);

  await ctx.reply(
    `✅ **Ставка принята!**\n\n` +
    `🎁 Лот: ${lot.itemName}\n` +
    `💰 Новая ставка: **${amount.toLocaleString()} монет**\n` +
    `👤 От: ${lot.currentBidderName}`
  );
});

bot.hears(/^(отменить)\s+(аукцион)\s+(\d+)$/i, async (ctx) => {
  const id = ctx.match[3];
  const lot = auctions[id];
  if (!lot) return ctx.reply("❌ Такого аукциона нет.");
  if (String(lot.sellerId) !== String(ctx.from.id)) return ctx.reply("❌ Отменить может только создатель аукциона.");
  if (!lot.active) return ctx.reply("❌ Этот аукцион уже завершён.");

  lot.active = false;
  lot.cancelled = true;
  saveAuctions(auctions);

  await ctx.reply(`🚫 Аукцион #${id} («${lot.itemName}») отменён создателем.`);
});

async function finishAuction(id) {
  const lot = auctions[id];
  if (!lot || !lot.active || lot.cancelled) return;

  lot.active = false;
  saveAuctions(auctions);

  const seller = economyUsers.get(String(lot.sellerId));

  if (!lot.currentBidderId) {
    if (seller) {
      try {
        await bot.telegram.sendMessage(lot.sellerId, `🏷️ Аукцион #${id} («${lot.itemName}») завершён без ставок.`);
      } catch (e) {}
    }
    return;
  }

  const buyer = economyUsers.get(String(lot.currentBidderId));
  if (buyer && seller) {
    buyer.balance = Math.max(0, buyer.balance - lot.currentBid);
    seller.balance += lot.currentBid;
    saveDB();

    try {
      await bot.telegram.sendMessage(
        lot.sellerId,
        `🏷️ **АУКЦИОН #${id} ЗАВЕРШЁН!**\n\n🎁 ${lot.itemName}\n💰 Продано за: **${lot.currentBid.toLocaleString()} монет**\n👤 Покупатель: ${lot.currentBidderName}`
      );
    } catch (e) {}
    try {
      await bot.telegram.sendMessage(
        lot.currentBidderId,
        `🎉 **ВЫ ВЫИГРАЛИ АУКЦИОН #${id}!**\n\n🎁 ${lot.itemName}\n💰 Оплачено: **${lot.currentBid.toLocaleString()} монет**`
      );
    } catch (e) {}
  }
}

for (const id of Object.keys(auctions)) {
  const lot = auctions[id];
  if (lot.active && !lot.cancelled) {
    const delay = lot.endTime - Date.now();
    if (delay > 0) {
      setTimeout(() => finishAuction(id), Math.min(delay, 2147000000));
    } else {
      finishAuction(id);
    }
  }
}

// ---------- ТРЕЙДИНГ С ГРАФИКОМ ----------

function generateChart(points) {
  const rows = ["📈 **ГРАФИК ЦЕНЫ**", ""];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(1, max - min);
  const height = 6;

  for (let row = height; row >= 0; row--) {
    let line = "";
    for (const p of points) {
      const level = Math.round(((p - min) / range) * height);
      line += level === row ? "🟩" : "⬛";
    }
    rows.push(line);
  }
  return rows.join("\n");
}

bot.hears(/^(трейдинг|trade)\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);
  if (!bet || bet <= 0 || u.balance < bet) return ctx.reply("❌ Недостаточно средств на балансе!");

  u.balance -= bet;

  const points = [50];
  for (let i = 0; i < 9; i++) {
    const change = (Math.random() - 0.5) * 14;
    points.push(Math.max(5, Math.min(95, points[points.length - 1] + change)));
  }

  const direction = Math.random() < 0.5 ? "up" : "down";

  const chart = generateChart(points);

  await ctx.reply(
    `${chart}\n\n` +
    `💰 Ставка: **${bet.toLocaleString()} монет**\n` +
    `📊 Куда пойдёт цена дальше?\n\n` +
    `Выберите направление:`,
    Markup.inlineKeyboard([
      [
        Markup.button.callback("📈 Вверх", `trade_${direction}_up_${bet}`),
        Markup.button.callback("📉 Вниз", `trade_${direction}_down_${bet}`)
      ]
    ])
  );
});

bot.action(/^trade_(up|down)_(up|down)_(\d+)$/, async (ctx) => {
  const actual = ctx.match[1];
  const guess = ctx.match[2];
  const bet = Number(ctx.match[3]);
  const u = ecoUser(ctx);

  const win = actual === guess;
  if (win) {
    const prize = Math.floor(bet * 1.9);
    u.balance += prize;
    addExp(u, 15);
    await ctx.editMessageText(
      `📊 **РЕЗУЛЬТАТ ТРЕЙДИНГА**\n\n` +
      `Цена пошла: **${actual === "up" ? "ВВЕРХ 📈" : "ВНИЗ 📉"}**\n` +
      `🎉 Ваш прогноз верный!\n💰 Выигрыш: **+${prize.toLocaleString()} монет**`
    );
  } else {
    await ctx.editMessageText(
      `📊 **РЕЗУЛЬТАТ ТРЕЙДИНГА**\n\n` +
      `Цена пошла: **${actual === "up" ? "ВВЕРХ 📈" : "ВНИЗ 📉"}**\n` +
      `📉 Ваш прогноз не сбылся.\n💸 Потеряно: **-${bet.toLocaleString()} монет**`
    );
  }
  ctx.answerCbQuery();
});

// ---------- 4 НОВЫЕ КНОПОЧНЫЕ ИГРЫ ----------

const activeDoorsGames = new Map();

bot.hears(/^(двери|doors)\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);
  if (!bet || bet <= 0 || u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;
  const winDoor = Math.floor(Math.random() * 3);
  activeDoorsGames.set(ctx.from.id, { bet, winDoor });

  await ctx.reply(
    `🚪 **ТРИ ДВЕРИ**\n\nСтавка: **${bet.toLocaleString()} монет**\nЗа одной из дверей приз x3. Выберите дверь:`,
    Markup.inlineKeyboard([[
      Markup.button.callback("🚪 1", "door_0"),
      Markup.button.callback("🚪 2", "door_1"),
      Markup.button.callback("🚪 3", "door_2")
    ]])
  );
});

bot.action(/^door_(\d)$/, async (ctx) => {
  const game = activeDoorsGames.get(ctx.from.id);
  if (!game) return ctx.answerCbQuery("❌ Игра завершена!", { show_alert: true });
  const choice = Number(ctx.match[1]);
  const u = ecoUser(ctx);
  activeDoorsGames.delete(ctx.from.id);

  if (choice === game.winDoor) {
    const win = game.bet * 3;
    u.balance += win;
    await ctx.editMessageText(`🎉 **ПРИЗ!** За дверью было золото!\n💰 Выигрыш: **+${win.toLocaleString()} монет**`);
  } else {
    await ctx.editMessageText(`💨 Пусто... Приз был за дверью №${game.winDoor + 1}.\n💸 Потеряно: **-${game.bet.toLocaleString()} монет**`);
  }
  ctx.answerCbQuery();
});

const activeWheelGames = new Map();

bot.hears(/^(колесо|wheel)\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);
  if (!bet || bet <= 0 || u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;
  activeWheelGames.set(ctx.from.id, { bet });

  await ctx.reply(
    `🎡 **КОЛЕСО ФОРТУНЫ**\n\nСтавка: **${bet.toLocaleString()} монет**\nНажмите, чтобы раскрутить колесо:`,
    Markup.inlineKeyboard([[Markup.button.callback("🎡 Крутить!", "wheel_spin")]])
  );
});

bot.action("wheel_spin", async (ctx) => {
  const game = activeWheelGames.get(ctx.from.id);
  if (!game) return ctx.answerCbQuery("❌ Игра завершена!", { show_alert: true });
  activeWheelGames.delete(ctx.from.id);

  const sectors = [0, 0.5, 1, 1.5, 2, 3, 5, 0];
  const mult = sectors[Math.floor(Math.random() * sectors.length)];
  const u = ecoUser(ctx);
  const win = Math.floor(game.bet * mult);
  u.balance += win;

  if (mult > 0) {
    await ctx.editMessageText(`🎡 Выпал множитель **x${mult}**!\n💰 Выигрыш: **+${win.toLocaleString()} монет**`);
  } else {
    await ctx.editMessageText(`🎡 Выпал пустой сектор.\n💸 Потеряно: **-${game.bet.toLocaleString()} монет**`);
  }
  ctx.answerCbQuery();
});

const activeMemoryGames = new Map();

bot.hears(/^(память|memory|пара)\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);
  if (!bet || bet <= 0 || u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;

  const symbols = ["🍒", "🍒", "🍋", "🍋", "🍀", "🍀"];
  for (let i = symbols.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
  }

  activeMemoryGames.set(ctx.from.id, { bet, symbols, opened: [], matched: [] });
  await renderMemory(ctx, ctx.from.id, "🧠 **НАЙДИ ПАРУ**\n\nОткройте две одинаковые карточки подряд:");
});

async function renderMemory(ctx, userId, title) {
  const g = activeMemoryGames.get(userId);
  if (!g) return;
  const buttons = [];
  for (let i = 0; i < 6; i += 3) {
    const row = [];
    for (let j = i; j < i + 3; j++) {
      const label = g.matched.includes(j) ? g.symbols[j] : "❓";
      row.push(Markup.button.callback(label, `mem_${j}`));
    }
    buttons.push(row);
  }
  const text = `${title}\n\n💰 Ставка: **${g.bet.toLocaleString()} монет**`;
  if (ctx.callbackQuery) await ctx.editMessageText(text, Markup.inlineKeyboard(buttons));
  else await ctx.reply(text, Markup.inlineKeyboard(buttons));
}

bot.action(/^mem_(\d)$/, async (ctx) => {
  const g = activeMemoryGames.get(ctx.from.id);
  if (!g) return ctx.answerCbQuery("❌ Игра завершена!", { show_alert: true });

  const idx = Number(ctx.match[1]);
  if (g.matched.includes(idx) || g.opened.includes(idx)) return ctx.answerCbQuery();

  g.opened.push(idx);

  if (g.opened.length === 2) {
    const [a, b] = g.opened;
    if (g.symbols[a] === g.symbols[b]) {
      g.matched.push(a, b);
      g.opened = [];
      if (g.matched.length === 6) {
        const u = ecoUser(ctx);
        const win = Math.floor(g.bet * 2.5);
        u.balance += win;
        activeMemoryGames.delete(ctx.from.id);
        await ctx.editMessageText(`🎉 **ВСЕ ПАРЫ НАЙДЕНЫ!**\n💰 Выигрыш: **+${win.toLocaleString()} монет**`);
        return ctx.answerCbQuery();
      }
      await renderMemory(ctx, ctx.from.id, "🧠 **НАЙДИ ПАРУ**\n\n✅ Пара найдена! Продолжайте:");
    } else {
      activeMemoryGames.delete(ctx.from.id);
      await ctx.editMessageText(`💥 Не совпало!\n💸 Потеряно: **-${g.bet.toLocaleString()} монет**`);
    }
  } else {
    await renderMemory(ctx, ctx.from.id, "🧠 **НАЙДИ ПАРУ**\n\nОткрыта первая карточка. Выберите вторую:");
  }
  ctx.answerCbQuery();
});

const activeDuelGames = new Map();

bot.hears(/^(дуэльставок|duelbet)\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);
  if (!bet || bet <= 0 || u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;
  activeDuelGames.set(ctx.from.id, { bet, round: 1, score: 0 });

  await ctx.reply(
    `⚔️ **ДУЭЛЬ СТАВОК** (Раунд 1/3)\n\nСтавка: **${bet.toLocaleString()} монет**\nВыберите оружие:`,
    Markup.inlineKeyboard([[
      Markup.button.callback("🗡️ Меч", "duel_sword"),
      Markup.button.callback("🛡️ Щит", "duel_shield"),
      Markup.button.callback("🏹 Лук", "duel_bow")
    ]])
  );
});

bot.action(/^duel_(sword|shield|bow)$/, async (ctx) => {
  const g = activeDuelGames.get(ctx.from.id);
  if (!g) return ctx.answerCbQuery("❌ Игра завершена!", { show_alert: true });

  const choice = ctx.match[1];
  const options = ["sword", "shield", "bow"];
  const botChoice = options[Math.floor(Math.random() * 3)];

  const beats = { sword: "bow", bow: "shield", shield: "sword" };
  let roundResult;
  if (choice === botChoice) {
    roundResult = "ничья";
  } else if (beats[choice] === botChoice) {
    roundResult = "победа";
    g.score += 1;
  } else {
    roundResult = "поражение";
    g.score -= 1;
  }

  g.round += 1;

  if (g.round > 3) {
    activeDuelGames.delete(ctx.from.id);
    const u = ecoUser(ctx);
    if (g.score > 0) {
      const win = Math.floor(g.bet * 2.2);
      u.balance += win;
      await ctx.editMessageText(`⚔️ **ДУЭЛЬ ЗАВЕРШЕНА!**\n\nПоследний раунд: ${roundResult}\n🎉 Вы победили в дуэли!\n💰 Выигрыш: **+${win.toLocaleString()} монет**`);
    } else if (g.score < 0) {
      await ctx.editMessageText(`⚔️ **ДУЭЛЬ ЗАВЕРШЕНА!**\n\nПоследний раунд: ${roundResult}\n💸 Вы проиграли дуэль!\nПотеряно: **-${g.bet.toLocaleString()} монет**`);
    } else {
      u.balance += g.bet;
      await ctx.editMessageText(`⚔️ **ДУЭЛЬ ЗАВЕРШЕНА!**\n\nПоследний раунд: ${roundResult}\n🤝 Ничья! Ставка возвращена.`);
    }
    return ctx.answerCbQuery();
  }

  await ctx.editMessageText(
    `⚔️ **ДУЭЛЬ СТАВОК** (Раунд ${g.round}/3)\n\nРаунд: ${roundResult}\nВыберите оружие:`,
    Markup.inlineKeyboard([[
      Markup.button.callback("🗡️ Меч", "duel_sword"),
      Markup.button.callback("🛡️ Щит", "duel_shield"),
      Markup.button.callback("🏹 Лук", "duel_bow")
    ]])
  );
  ctx.answerCbQuery();
});

// ==================== END __EXTRA_FEATURES__ ====================
'''

marker = "async function startBot() {"
idx = s.find(marker)
if idx == -1:
    print("❌ Не найден маркер 'async function startBot()' — блок не вставлен")
else:
    s = s[:idx] + big_block + "\n\n" + s[idx:]
    print("✅ Добавлены: продажа с торгом, аукцион, трейдинг с графиком, 4 новые игры")

TARGET.write_text(s, encoding="utf-8")
print(f"\nГотово. Размер файла: {orig_len} -> {len(s)} символов")
