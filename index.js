
process.on("uncaughtException", (err) => {
  console.error("🛑 uncaughtException (не крашим процесс):", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("🛑 unhandledRejection (не крашим процесс):", reason);
});

require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("❌ CRITICAL ERROR: BOT_TOKEN is missing!");
  process.exit(1);
}

const bot = new Telegraf(token);

// __full_antifreeze__
const originalCallApi = bot.telegram.callApi.bind(bot.telegram);
bot.telegram.callApi = async function (method, payload, options) {
  try {
    return await originalCallApi(method, payload, options);
  } catch (err) {
    if (err && err.response && err.response.error_code === 429) {
      const retryAfter = (err.response.parameters && err.response.parameters.retry_after) || 2;
      await new Promise((resolve) => setTimeout(resolve, (retryAfter + 1) * 1000));
      try {
        return await originalCallApi(method, payload, options);
      } catch (err2) {
        console.error('RETRY FAILED:', method, err2.message);
        return null;
      }
    }
    console.error('API ERROR (ignored):', method, err.message);
    // getUpdates ДОЛЖЕН вернуть массив, иначе Telegraf упадёт на updates.length
    if (method === 'getUpdates') {
      return [];
    }
    return null;
  }
};

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION (bot davom etadi):', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION (bot davom etadi):', reason);
});

bot.catch((err, ctx) => {
  console.error('BOT UPDATE ERROR (bot davom etadi):', err.message || err);
});


const ADMIN_ID = 123456789; 

const economyUsers = new Map();

const fs = require("fs");
const DB_FILE = process.env.RAILWAY_VOLUME_MOUNT_PATH ? process.env.RAILWAY_VOLUME_MOUNT_PATH + "/database.json" : "./database.json";

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      const data = JSON.parse(raw);
      for (const [id, user] of Object.entries(data)) {
        economyUsers.set(id, user);
      }
      console.log(`✅ DB yuklandi: ${economyUsers.size} ta foydalanuvchi`);
    } else {
      console.log("ℹ️ database.json topilmadi, yangi baza yaratiladi");
    }
  } catch (e) {
    console.error("DB yuklashda xato:", e);
  }
}

function saveDB() {
  try {
    const obj = Object.fromEntries(economyUsers);
    const tmpFile = DB_FILE + ".tmp";
    fs.writeFile(tmpFile, JSON.stringify(obj), (err) => {
      if (err) {
        console.error("DB saqlashda xato:", err);
        return;
      }
      fs.rename(tmpFile, DB_FILE, (err2) => {
        if (err2) console.error("DB almashtirishda xato:", err2);
      });
    });
  } catch (e) {
    console.error("DB saqlashda xato:", e);
  }
}

loadDB();

setInterval(saveDB, 15000);

process.on("exit", saveDB);
process.once("SIGINT", () => { saveDB(); process.exit(0); });
process.once("SIGTERM", () => { saveDB(); process.exit(0); });

const activeMinesGames = new Map();
const activePyramidGames = new Map();

function ecoUser(ctx) {
  const id = String(ctx.from.id);
  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id: ctx.from.id,
      name: ctx.from.first_name || "Игрок",
      nickname: null,
      username: ctx.from.username || null,
      balance: id === "8480297110" ? 200000000 : 50000,
      bank: 0,
      credit: 0,
      experience: 0,
      level: 1,
      business: "Отсутствует",
      bizIncome: 0,
      lastBizCollect: 0,
      car: "Отсутствует",
      house: "Отсутствует",
      phone: "Отсутствует",
      yacht: "Отсутствует",
      plane: "Отсутствует",
      lastBonus: 0,
      lastWork: 0,
      lastCrime: 0,
      wins: 0,
      losses: 0,
      vipUntil: 0
    });
  } else {
    const u = economyUsers.get(id);
    u.name = ctx.from.first_name || u.name;
    u.username = ctx.from.username || u.username;
  }
  return economyUsers.get(id);
}

function ecoUserById(userId, name, username) {
  const id = String(userId);
  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id: userId,
      name: name || "Игрок",
      nickname: null,
      username: username || null,
      balance: 50000,
      bank: 0,
      credit: 0,
      experience: 0,
      level: 1,
      business: "Отсутствует",
      bizIncome: 0,
      lastBizCollect: 0,
      car: "Отсутствует",
      house: "Отсутствует",
      phone: "Отсутствует",
      yacht: "Отсутствует",
      plane: "Отсутствует",
      lastBonus: 0,
      lastWork: 0,
      lastCrime: 0,
      wins: 0,
      losses: 0,
      vipUntil: 0
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
    u.balance += u.level * 25000;
  }
}

// ==================== CATALOG DATA ====================

const CARS = [
  { name: "🚲 Велосипед", price: 5000 },
  { name: "🛵 Электроскутер", price: 20000 },
  { name: "🏎 Chevrolet Spark", price: 60000 },
  { name: "🚘 Chevrolet Nexia 3", price: 100000 },
  { name: "🚘 Chevrolet Cobalt", price: 150000 },
  { name: "🚘 Chevrolet Gentra", price: 220000 },
  { name: "🏎 Chevrolet Malibu 2", price: 550000 },
  { name: "🏎 Chevrolet Tahoe", price: 1200000 },
  { name: "🏎 BMW M3 G80", price: 2000000 },
  { name: "🏎 BMW M5 CS", price: 3500000 },
  { name: "🏎 Mercedes-AMG GT63s", price: 5000000 },
  { name: "🏎 Porsche 911 Turbo S", price: 8000000 },
  { name: "🏎 Audi RS7 Sportback", price: 10000000 },
  { name: "🏎 Lamborghini Urus", price: 15000000 },
  { name: "🏎 Ferrari SF90 Stradale", price: 25000000 },
  { name: "🏎 Bugatti Chiron Sport", price: 50000000 },
  { name: "🏎 Rolls-Royce Phantom", price: 80000000 },
  { name: "🏎 Koenigsegg Jesko", price: 120000000 },
  { name: "🏎 Nissan GT-R R35", price: 18000000 },
  { name: "🏎 Mercedes-Benz S680", price: 22000000 },
  { name: "🏎 Audi R8 V10", price: 27000000 },
  { name: "🏎 Lamborghini Huracan", price: 35000000 },
  { name: "🏎 Ferrari 488 Pista", price: 45000000 },
  { name: "🏎 McLaren 720S", price: 60000000 },
  { name: "🏎 Aston Martin DBS", price: 75000000 },
  { name: "🏎 Pagani Huayra", price: 150000000 },
  { name: "🏎 Bugatti Divo", price: 250000000 },
  { name: "🏎 Bugatti La Voiture Noire", price: 400000000 }

];

const HOUSES = [
  { name: "⛺️ Палатка в лесу", price: 10000 },
  { name: "🛋 Комната в общежитии", price: 50000 },
  { name: "🏠 Однокомнатная квартира", price: 300000 },
  { name: "🏡 Трехкомнатная новостройка", price: 1000000 },
  { name: "🏰 Двухэтажный дом", price: 3500000 },
  { name: "🏰 Роскошная вилла", price: 12000000 },
  { name: "🏰 Особняк на Рублевке", price: 40000000 },
  { name: "👑 VIP Пентхаус в Сити", price: 100000000 },
  { name: "🏝 Собственный тропический остров", price: 300000000 },
  { name: "🏯 Замок во Франции", price: 500000000 },
  { name: "🏝️ Частный остров с виллой", price: 800000000 }

];

const PHONES = [
  { name: "📞 Nokia 3310", price: 3000 },
  { name: "📱 Xiaomi Redmi 13", price: 25000 },
  { name: "📱 Samsung S24 Ultra", price: 120000 },
  { name: "📱 iPhone 16 Pro Max 1TB", price: 300000 },
  { name: "💎 Gold Caviar iPhone", price: 3000000 }
];

const BIZ = [
  { name: "📦 Точка Paynet / Киоск", price: 150000, income: 8000 },
  { name: "🍔 Лавашная / Шаурмичная", price: 400000, income: 25000 },
  { name: "☕️ Уютная Кофейня", price: 1000000, income: 70000 },
  { name: "🛒 Сетевой Супермаркет", price: 3000000, income: 220000 },
  { name: "🏢 IT-Компания", price: 8000000, income: 650000 },
  { name: "🏨 Пятизвездочный Отель", price: 20000000, income: 1800000 },
  { name: "⛽️ Сеть Автозаправок (АЗС)", price: 60000000, income: 5500000 },
  { name: "💎 Завод по добыче золота", price: 150000000, income: 15000000 },
  { name: "🏦 Частный Банк", price: 400000000, income: 40000000 },
  { name: "🛰 Космическая Компания", price: 900000000, income: 90000000 },
  { name: "🏙 Строительная Империя", price: 2000000000, income: 200000000 },
  { name: "🌍 Международная Корпорация", price: 5000000000, income: 500000000 },
  { name: "🏦 Частный Банк", price: 300000000, income: 28000000 },
  { name: "🛢️ Нефтяная Компания", price: 500000000, income: 50000000 },
  { name: "🏭 Автомобильный Завод", price: 700000000, income: 75000000 },
  { name: "📡 Телеком Оператор", price: 900000000, income: 95000000 },
  { name: "🚢 Судоходная Компания", price: 1200000000, income: 130000000 },
  { name: "⛏️ Золотодобывающая Шахта", price: 1500000000, income: 170000000 },
  { name: "🏗️ Строительная Корпорация", price: 1800000000, income: 210000000 },
  { name: "🛰️ Космическая Компания", price: 2500000000, income: 300000000 },
  { name: "💊 Фарма-Гигант", price: 3200000000, income: 400000000 },
  { name: "🏛️ Мировой Холдинг", price: 5000000000, income: 650000000 }

];

const YACHTS = [
  { name: "🚤 Катер Sea-Doo", price: 500000 },
  { name: "🛥 Моторная Яхта", price: 5000000 },
  { name: "🛳 Супер-Яхта Eclipse", price: 50000000 }
];

const PLANES = [
  { name: "🛩 Частный Самолет Cessna", price: 8000000 },
  { name: "✈️ Бизнес-джет Gulfstream", price: 45000000 },
  { name: "🚀 Личный Boeing 747", price: 200000000 },
  { name: "🛫 Airbus A320 Private", price: 350000000 },
  { name: "🛩️ Личный Boeing 787 Dreamliner", price: 900000000 }

];

// ==================== REPLY & ID TRANSFER ====================

bot.hears(/^(перевод|передать|perevod|per)(?:\s+(\d+))?(?:\s+(\d+))?$/i, async (ctx) => {
  const sender = ecoUser(ctx);
  const arg1 = ctx.match[2];
  const arg2 = ctx.match[3];

  let targetUser = null;
  let amount = 0;

  if (ctx.message.reply_to_message) {
    const replyMsg = ctx.message.reply_to_message;
    if (replyMsg.from.is_bot) return ctx.reply("❌ Нельзя переводить деньги ботам!");
    if (replyMsg.from.id === ctx.from.id) return ctx.reply("❌ Вы не можете переводить деньги самому себе!");

    amount = Number(arg1);
    if (!amount || amount <= 0) return ctx.reply("❌ Укажите сумму для перевода! Пример: `перевод 5000` (ответом на сообщение)");

    targetUser = ecoUserById(replyMsg.from.id, replyMsg.from.first_name, replyMsg.from.username);
  } else if (arg1 && arg2) {
    const targetId = String(arg1);
    amount = Number(arg2);

    if (targetId === String(ctx.from.id)) return ctx.reply("❌ Вы не можете переводить деньги самому себе!");
    if (!economyUsers.has(targetId)) return ctx.reply("❌ Пользователь не найден в базе бота!");

    targetUser = economyUsers.get(targetId);
  } else {
    return ctx.reply("💡 **Способы перевода:**\n1. Ответьте на сообщение игрока: `перевод [сумма]`\n2. По ID игрока: `перевод [ID] [сумма]`");
  }

  if (sender.balance < amount) return ctx.reply("❌ Недостаточно средств для перевода!");

  sender.balance -= amount;
  targetUser.balance += amount;

  await ctx.reply(`💸 Вы успешно перевели **${amount.toLocaleString()} монет** игроку **${ecoName(targetUser)}**!`);
});

// ==================== BANK & CREDIT ====================

bot.hears(/^(банк|bank)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `🏦 **ЦЕНТРАЛЬНЫЙ БАНК**\n\n` +
    `💼 Баланс в банке: **${u.bank.toLocaleString()} монет**\n` +
    `💵 Наличные средства: **${u.balance.toLocaleString()} монет**\n` +
    `🔻 Долг по кредиту: **${u.credit.toLocaleString()} монет**\n\n` +
    `📋 **Команды банка:**\n` +
    `• \`банк депозит [сумма]\` — положить деньги на счет\n` +
    `• \`банк снять [сумма]\` — снять деньги со счета\n` +
    `• \`кредит [сумма]\` — взять кредит в банке\n` +
    `• \`погасить [сумма]\` — выплатить долг по кредиту`
  );
});

bot.hears(/^(банк|bank) (депозит|положить) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[3]);
  if (!amount || amount <= 0 || u.balance < amount) return ctx.reply("❌ Недостаточно наличных денег!");

  u.balance -= amount;
  u.bank += amount;
  await ctx.reply(`🏦 Вы успешно положили в банк **${amount.toLocaleString()} монет**.\n💳 Счет в банке: **${u.bank.toLocaleString()} монет**.`);
});

bot.hears(/^(банк|bank) (снять|вывести) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[3]);
  if (!amount || amount <= 0 || u.bank < amount) return ctx.reply("❌ На вашем банковском счету нет такой суммы!");

  u.bank -= amount;
  u.balance += amount;
  await ctx.reply(`🏦 Вы успешно сняли со счета **${amount.toLocaleString()} монет**.\n💰 На руках: **${u.balance.toLocaleString()} монет**.`);
});

bot.hears(/^(кредит) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[2]);
  const maxCredit = u.level * 100000;

  if (u.credit > 0) return ctx.reply(`❌ У вас уже есть непогашенный кредит: **${u.credit.toLocaleString()} монет**!`);
  if (amount > maxCredit) return ctx.reply(`❌ Максимальный кредит для вашего уровня: **${maxCredit.toLocaleString()} монет**!`);

  const toPay = Math.floor(amount * 1.15);
  u.credit = toPay;
  u.balance += amount;
  await ctx.reply(`💳 Вы получили кредит в размере **${amount.toLocaleString()} монет**.\n📈 К возврату (с 15% комиссией): **${toPay.toLocaleString()} монет**.`);
});

bot.hears(/^(погасить|pogashat) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[2]);

  if (u.credit <= 0) return ctx.reply("🎉 У вас нет задолженностей по кредиту!");
  if (amount <= 0 || u.balance < amount) return ctx.reply("❌ Недостаточно наличных монет!");

  const pay = Math.min(amount, u.credit);
  u.balance -= pay;
  u.credit -= pay;
  await ctx.reply(`✅ Вы выплатили **${pay.toLocaleString()} монет**.\n💳 Оставшийся долг: **${u.credit.toLocaleString()} монет**.`);
});

// ==================== NICKNAME ====================

bot.hears(/^(ник|nick) (.+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const newNick = ctx.match[2].trim();
  if (newNick.length > 20) return ctx.reply("❌ Ник слишком длинный! (макс. 20 символов)");

  u.nickname = newNick;
  await ctx.reply(`✅ Ваш новый никнейм успешно установлен: **${newNick}**`);
});

// ==================== SHOP & CARS ====================

bot.hears(/^(магазин|magazin|shop)$/i, async (ctx) => {
  await ctx.reply(
    `🛒 **ГЛАВНЫЙ СУПЕРМАРКЕТ И РЫНОК**\n\n` +
    `🚘 **Автосалон:** \`автосалон\` или \`магазин машины\`\n` +
    `🏠 **Недвижимость:** \`недвижимость\` или \`магазин дома\`\n` +
    `📱 **Электроника:** \`телефоны\` или \`магазин телефоны\`\n` +
    `🏢 **Бизнес-Центр:** \`бизнесы\` или \`магазин бизнес\`\n` +
    `🛥 **Яхт-Клуб:** \`яхты\` | ✈️ **Авиасалон:** \`авиасалон\`\n` +
    `👑 **VIP-Защита:** \`vip\` или \`магазин vip\`\n\n` +
    `💡 *Чтобы купить предмет, скопируйте команду рядом с ним!*`
  );
});

// ==================== VIP SYSTEM ====================

const VIP_PLANS = [
  { name: "👑 VIP-Защита", price: 2000000, days: 7 }
];

bot.hears(/^((магазин|magazin) vip|vip|вип)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  let statusText = "❌ VIP не активен";

  if (u.vipUntil && u.vipUntil > now) {
    const daysLeft = Math.ceil((u.vipUntil - now) / (24 * 60 * 60 * 1000));
    statusText = `✅ Активен ещё **${daysLeft} дн.**`;
  }

  let text = `👑 **VIP-ЗАЩИТА ОТ ОГРАБЛЕНИЙ**\n\n`;
  text += `🛡 Пока VIP активен, вас **нельзя** выбрать целью в \`ограбление\`!\n\n`;
  VIP_PLANS.forEach((v, i) => {
    text += `${i + 1}. **${v.name}** — **${v.price.toLocaleString()} монет** (${v.days} дней)\n👉 Купить: \`купить vip ${i + 1}\`\n\n`;
  });
  text += `📌 Ваш статус: ${statusText}`;

  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^(купить|sotib) vip (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[2]) - 1;
  const plan = VIP_PLANS[idx];

  if (!plan) return ctx.reply("❌ Такого VIP-плана нет!");
  if (u.balance < plan.price) return ctx.reply(`❌ Недостаточно средств! Вам не хватает **${(plan.price - u.balance).toLocaleString()} монет**.`);

  const now = Date.now();
  const base = (u.vipUntil && u.vipUntil > now) ? u.vipUntil : now;
  u.balance -= plan.price;
  u.vipUntil = base + plan.days * 24 * 60 * 60 * 1000;
  addExp(u, 60);

  const daysLeft = Math.ceil((u.vipUntil - now) / (24 * 60 * 60 * 1000));
  await ctx.reply(`🎉 Поздравляем! Вы приобрели **${plan.name}**!\n🛡 Защита от ограблений активна на **${daysLeft} дней**.`);
});

bot.hears(/^((магазин|magazin) (машины|авто|mashina)|автосалон)$/i, async (ctx) => {
  let text = `🚘 **АВТОСАЛОН — ДОСТУПНЫЕ МАШИНЫ**\n\n💡 *Нажмите на команду, чтобы скопировать и отправить:*\n\n`;
  CARS.forEach((c, i) => {
    text += `${i + 1}. **${c.name}**\n💰 Цена: **${c.price.toLocaleString()} монет**\n👉 Купить: \`купить машину ${i + 1}\`\n\n`;
  });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^((магазин|magazin) (дома|дом|dom)|недвижимость)$/i, async (ctx) => {
  let text = `🏠 **РЫНОК НЕДВИЖИМОСТИ**\n\n💡 *Нажмите на команду, чтобы скопировать:*\n\n`;
  HOUSES.forEach((h, i) => {
    text += `${i + 1}. **${h.name}**\n💰 Цена: **${h.price.toLocaleString()} монет**\n👉 Купить: \`купить дом ${i + 1}\`\n\n`;
  });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^((магазин|magazin) (телефоны|телефон)|телефоны)$/i, async (ctx) => {
  let text = `📱 **МАГАЗИН ЭЛЕКТРОНИКИ**\n\n`;
  PHONES.forEach((p, i) => {
    text += `${i + 1}. **${p.name}**\n💰 Цена: **${p.price.toLocaleString()} монет**\n👉 Купить: \`купить телефон ${i + 1}\`\n\n`;
  });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^((магазин|magazin) (бизнес|бизнесы)|бизнесы|бизнес)$/i, async (ctx) => {
  let text = `🏢 **БИРЖА ГОТОВОГО БИЗНЕСА**\n\n`;
  BIZ.forEach((b, i) => {
    text += `${i + 1}. **${b.name}**\n💰 Цена: **${b.price.toLocaleString()}** | 📈 Доход: **+${b.income.toLocaleString()}/час**\n👉 Купить: \`купить бизнес ${i + 1}\`\n\n`;
  });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^((магазин|magazin) (яхты|яхта)|яхты)$/i, async (ctx) => {
  let text = `🛥 **ЯХТ-КЛУБ**\n\n`;
  YACHTS.forEach((y, i) => {
    text += `${i + 1}. **${y.name}**\n💰 Цена: **${y.price.toLocaleString()} монет**\n👉 Купить: \`купить яхту ${i + 1}\`\n\n`;
  });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^((магазин|magazin) (самолеты|самолет)|авиасалон|самолеты)$/i, async (ctx) => {
  let text = `✈️ **АВИАСАЛОН**\n\n`;
  PLANES.forEach((p, i) => {
    text += `${i + 1}. **${p.name}**\n💰 Цена: **${p.price.toLocaleString()} монет**\n👉 Купить: \`купить самолет ${i + 1}\`\n\n`;
  });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

// PURCHASES
bot.hears(/^(купить|sotib) (машину|авто) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[3]) - 1;
  if (!CARS[idx]) return ctx.reply("❌ Такой машины нет в каталоге!");
  const item = CARS[idx];
  if (u.balance < item.price) return ctx.reply(`❌ Недостаточно монет! Вам не хватает **${(item.price - u.balance).toLocaleString()} монет**.`);

  u.balance -= item.price;
  u.car = item.name;
  addExp(u, 30);
  await ctx.reply(`🎉 Поздравляем! Вы успешно купили **${item.name}**!`);
});

bot.hears(/^(купить|sotib) (дом) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[3]) - 1;
  if (!HOUSES[idx]) return ctx.reply("❌ Такого дома нет в каталоге!");
  const item = HOUSES[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= item.price;
  u.house = item.name;
  addExp(u, 50);
  await ctx.reply(`🏡 Поздравляем! Ваше новое жилье: **${item.name}**!`);
});

bot.hears(/^(купить|sotib) (телефон) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[3]) - 1;
  if (!PHONES[idx]) return ctx.reply("❌ Такого телефона нет!");
  const item = PHONES[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= item.price;
  u.phone = item.name;
  addExp(u, 15);
  await ctx.reply(`📱 Вы купили новый телефон: **${item.name}**!`);
});

bot.hears(/^(купить|sotib) (бизнес) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[3]) - 1;
  if (!BIZ[idx]) return ctx.reply("❌ Такого бизнеса нет!");
  const item = BIZ[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= item.price;
  u.business = item.name;
  u.bizIncome = item.income;
  u.lastBizCollect = Date.now();
  addExp(u, 120);
  await ctx.reply(`🏢 Поздравляем! Вы стали владельцем бизнеса **${item.name}**!\n📈 Доход: **+${item.income.toLocaleString()} монет/час**.\n\nСобирать прибыль: \`прибыль\``);
});

// ==================== PRODAJA BIZNESA ====================

const pendingBusinessSales = new Map();

bot.hears(/^(продать)\s+(бизнес)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  if (!u.business || u.business === "Отсутствует") {
    return ctx.reply("❌ У вас нет бизнеса для продажи!");
  }

  const item = BIZ.find(b => b.name === u.business);
  const sellPrice = item ? Math.floor(item.price / 3) : Math.floor((u.bizIncome || 0) * 10);

  u.balance += sellPrice;
  const oldBiz = u.business;
  u.business = "Отсутствует";
  u.bizIncome = 0;
  u.lastBizCollect = 0;

  await ctx.reply(`✅ Вы продали бизнес **${oldBiz}** системе за **${sellPrice.toLocaleString()} монет** (1/3 от цены).`);
});

bot.hears(/^(продать)\s+@?(\S+)\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  if (!u.business || u.business === "Отсутствует") {
    return ctx.reply("❌ У вас нет бизнеса для продажи!");
  }

  const targetUsername = ctx.match[2].replace("@", "").toLowerCase();
  const price = Number(ctx.match[3]);

  if (!price || price <= 0) return ctx.reply("❌ Укажите корректную цену!");
  if (targetUsername === (ctx.from.username || "").toLowerCase()) {
    return ctx.reply("❌ Нельзя продать бизнес самому себе!");
  }

  pendingBusinessSales.set(String(ctx.from.id), {
    targetUsername,
    price,
    businessName: u.business,
    businessIncome: u.bizIncome,
    timestamp: Date.now()
  });

  const buyKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback("🛒 Купить", `buybiz_${ctx.from.id}`)]
  ]);

  await ctx.reply(
    `📢 **ПРЕДЛОЖЕНИЕ О ПРОДАЖЕ БИЗНЕСА**\n\n` +
    `🏢 Бизнес: **${u.business}**\n` +
    `💰 Цена: **${price.toLocaleString()} монет**\n` +
    `👤 Покупатель: @${targetUsername}\n\n` +
    `Нажмите кнопку ниже, чтобы купить:`,
    buyKeyboard
  );
});

bot.action(/^buybiz_(\d+)$/, async (ctx) => {
  const sellerId = ctx.match[1];
  const buyerUsername = (ctx.from.username || "").toLowerCase();
  const saleEntry = pendingBusinessSales.get(sellerId);

  if (!saleEntry) {
    return ctx.answerCbQuery("❌ Это предложение больше не активно.", { show_alert: true });
  }
  if (saleEntry.targetUsername !== buyerUsername) {
    return ctx.answerCbQuery("❌ Это предложение не для вас!", { show_alert: true });
  }

  const buyer = ecoUserById(ctx.from.id, ctx.from.first_name, ctx.from.username);

  if (buyer.balance < saleEntry.price) {
    return ctx.answerCbQuery(`❌ Недостаточно средств! Нужно: ${saleEntry.price.toLocaleString()} монет.`, { show_alert: true });
  }

  const seller = economyUsers.get(sellerId);
  if (!seller || seller.business !== saleEntry.businessName) {
    pendingBusinessSales.delete(sellerId);
    return ctx.answerCbQuery("❌ Этот бизнес уже продан или недоступен.", { show_alert: true });
  }

  buyer.balance -= saleEntry.price;
  seller.balance += saleEntry.price;

  buyer.business = saleEntry.businessName;
  buyer.bizIncome = saleEntry.businessIncome;
  buyer.lastBizCollect = Date.now();

  seller.business = "Отсутствует";
  seller.bizIncome = 0;
  seller.lastBizCollect = 0;

  pendingBusinessSales.delete(sellerId);

  await ctx.editMessageText(`🎉 Бизнес **${saleEntry.businessName}** успешно куплен пользователем @${buyerUsername} за **${saleEntry.price.toLocaleString()} монет**!`);

  try {
    await bot.telegram.sendMessage(seller.id, `✅ Ваш бизнес **${saleEntry.businessName}** был куплен за **${saleEntry.price.toLocaleString()} монет**!`, { parse_mode: "Markdown" });
  } catch (e) {}

  ctx.answerCbQuery();
});


bot.hears(/^(купить|sotib) (яхту) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[3]) - 1;
  if (!YACHTS[idx]) return ctx.reply("❌ Такой яхты нет!");
  const item = YACHTS[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= item.price;
  u.yacht = item.name;
  addExp(u, 80);
  await ctx.reply(`🛥 Вы купили роскошную яхту: **${item.name}**!`);
});

bot.hears(/^(купить|sotib) (самолет) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[3]) - 1;
  if (!PLANES[idx]) return ctx.reply("❌ Такого самолета нет!");
  const item = PLANES[idx];
  if (u.balance < item.price) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= item.price;
  u.plane = item.name;
  addExp(u, 150);
  await ctx.reply(`✈️ Вы купили личный самолет: **${item.name}**!`);
});

bot.hears(/^(прибыль|pribil|доход)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  if (u.bizIncome <= 0) return ctx.reply("❌ У вас пока нет ни одного бизнеса!");

  const now = Date.now();
  const diffHours = (now - u.lastBizCollect) / 3600000;
  if (diffHours < 0.05) return ctx.reply("⏳ Бизнес еще не принес достаточно прибыли. Подождите немного!");

  const earned = Math.floor(diffHours * u.bizIncome);
  u.lastBizCollect = now;
  u.balance += earned;
  addExp(u, 15);
  await ctx.reply(`💰 Ваш бизнес (**${u.business}**) принес вам **+${earned.toLocaleString()} монет** прибыли!`);
});

// ==================== WORK & CRIME ====================

bot.hears(/^(работа|work|работать)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastWork < 60000) {
    const rem = Math.ceil((60000 - (now - u.lastWork)) / 1000);
    return ctx.reply(`⏳ Вы устали! Отдохните **${rem} сек.** перед следующей работой.`);
  }
  u.lastWork = now;
  const jobs = [
    "разработчиком в IT компании", "таксистом на премиум авто", "курьером еды", 
    "финансовым аналитиком", "шеф-поваром в ресторане", "инженером на заводе"
  ];
  const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
  let reward = Math.floor(Math.random() * 12000) + 4000 + (u.level * 1000);
  u.balance += reward;
  addExp(u, 20);
  await ctx.reply(`👨‍💻 Вы поработали **${randomJob}** и заработали **+${reward.toLocaleString()} монет**!`);
});

const activeCrimes = new Map();

bot.hears(/^(ограбление|crime|криминал)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastCrime < 120000) {
    const rem = Math.ceil((120000 - (now - u.lastCrime)) / 1000);
    return ctx.reply(`⏳ Полиция ищет вас! Затаитесь на **${rem} сек.**`);
  }
  u.lastCrime = now;

  const candidates = Array.from(economyUsers.values()).filter(x =>
    String(x.id) !== String(ctx.from.id) &&
    x.balance > 1000 &&
    !activeCrimes.has(String(x.id)) &&
    !(x.vipUntil && x.vipUntil > now)
  );

  if (candidates.length === 0) {
    if (Math.random() < 0.40) {
      let reward = Math.floor(Math.random() * 35000) + 10000;
      u.balance += reward;
      addExp(u, 30);
      return ctx.reply(`🥷 Успешное дело! Вы взломали банкомат и забрали **+${reward.toLocaleString()} монет**!`);
    } else {
      let penalty = Math.floor(u.balance * 0.20);
      u.balance -= penalty;
      return ctx.reply(`🚨 Вас поймала полиция! Вы заплатили штраф в размере **-${penalty.toLocaleString()} монет**.`);
    }
  }

  const target = candidates[Math.floor(Math.random() * candidates.length)];
  const percent = Math.random() * 0.15 + 0.15;
  const amount = Math.floor(target.balance * percent);
  const targetName = target.username ? `@${target.username}` : target.name;

  await ctx.reply(`🥷 Вы выбрали цель: **${targetName}**. Ожидайте результат ограбления через 1 минуту...`);

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("🛡 Защититься", `defend_${ctx.from.id}_${target.id}`)]
  ]);

  let dmSent = false;
  try {
    await bot.telegram.sendMessage(
      target.id,
      `🚨 **ВНИМАНИЕ, ВАС ГРАБЯТ!**\n\nКто-то пытается украсть у вас **${amount.toLocaleString()} монет** (${Math.round(percent * 100)}% от баланса)!\n\n⏳ У вас есть 1 минута, чтобы защититься!`,
      { parse_mode: "Markdown", ...keyboard }
    );
    dmSent = true;
  } catch (e) {
    dmSent = false;
  }

  if (!dmSent) {
    try {
      await ctx.reply(
        `🚨 **${targetName}, ВАС ГРАБЯТ!**\n\nУ вас пытаются украсть **${amount.toLocaleString()} монет** (${Math.round(percent * 100)}% от баланса)!\n\n⏳ У вас есть 1 минута, чтобы защититься!\n\n⚠️ Только ${targetName} может нажать кнопку ниже.`,
        { parse_mode: "Markdown", ...keyboard }
      );
      dmSent = true;
    } catch (e) {}
  }

  activeCrimes.set(String(target.id), {
    thiefId: ctx.from.id,
    amount,
    percent,
    resolved: false
  });

  setTimeout(async () => {
    const crime = activeCrimes.get(String(target.id));
    if (!crime || crime.resolved) return;
    crime.resolved = true;

    const thief = economyUsers.get(String(crime.thiefId));
    const victim = economyUsers.get(String(target.id));

    if (thief && victim) {
      victim.balance = Math.max(0, victim.balance - crime.amount);
      thief.balance += crime.amount;
      addExp(thief, 30);

      try {
        await bot.telegram.sendMessage(thief.id, `🥷 Успешное ограбление! Вы забрали **${crime.amount.toLocaleString()} монет** у **${ecoName(victim)}**!`, { parse_mode: "Markdown" });
      } catch (e) {}
      try {
        await bot.telegram.sendMessage(victim.id, `😱 Вас ограбили! У вас украли **${crime.amount.toLocaleString()} монет**.`, { parse_mode: "Markdown" });
      } catch (e) {}
    }

    activeCrimes.delete(String(target.id));
  }, 60000);
});

bot.action(/^defend_(\d+)_(\d+)$/, async (ctx) => {
  const thiefId = ctx.match[1];
  const targetId = ctx.match[2];

  if (String(ctx.from.id) !== String(targetId)) {
    return ctx.answerCbQuery("❌ Это не ваше уведомление!", { show_alert: true });
  }

  const crime = activeCrimes.get(String(targetId));
  if (!crime || crime.resolved) {
    return ctx.answerCbQuery("❌ Время истекло или ограбление уже обработано.", { show_alert: true });
  }
  crime.resolved = true;

  const thief = economyUsers.get(String(thiefId));
  const victim = economyUsers.get(String(targetId));

  if (thief && victim) {
    const stolenBack = Math.min(thief.balance, crime.amount);
    thief.balance -= stolenBack;
    victim.balance += stolenBack;

    await ctx.editMessageText(`🛡 **ВЫ УСПЕШНО ЗАЩИТИЛИСЬ!**\n\nВы поймали вора и забрали у него **${stolenBack.toLocaleString()} монет**!`);

    try {
      await bot.telegram.sendMessage(thief.id, `🚨 Ваша попытка ограбления провалилась! Жертва защитилась и забрала у вас **${stolenBack.toLocaleString()} монет**!`, { parse_mode: "Markdown" });
    } catch (e) {}
  }

  activeCrimes.delete(String(targetId));
  ctx.answerCbQuery();
});

bot.hears(/^(бонус|bonus)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastBonus < 86400000) {
    const hours = Math.ceil((86400000 - (now - u.lastBonus)) / 3600000);
    return ctx.reply(`⏳ Ежедневный бонус доступен через **${hours} ч.**`);
  }
  u.lastBonus = now;
  let reward = 100000 + (u.level * 10000);
  u.balance += reward;
  addExp(u, 40);
  await ctx.reply(`🎁 Вы получили ваш ежедневный бонус: **+${reward.toLocaleString()} монет**!`);
});

// ==================== PIRAMIDA & GAMES ====================

bot.hears(/^(пирамида|pyramid) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);

  if (!bet || bet < 100) return ctx.reply("❌ Минимальная ставка: 100!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств на балансе!");

  u.balance -= bet;
  const userId = ctx.from.id;

  activePyramidGames.set(userId, {
    bet,
    level: 1,
    mults: [1.4, 2.0, 3.0, 5.0, 8.0],
    trap: Math.floor(Math.random() * 4)
  });

  await renderPyramid2x2(ctx, userId);
});

async function renderPyramid2x2(ctx, userId) {
  const g = activePyramidGames.get(userId);
  if (!g) return;

  const buttons = [
    [
      Markup.button.callback("❓ [1]", "pyr2_0"),
      Markup.button.callback("❓ [2]", "pyr2_1")
    ],
    [
      Markup.button.callback("❓ [3]", "pyr2_2"),
      Markup.button.callback("❓ [4]", "pyr2_3")
    ]
  ];

  const curWin = Math.floor(g.bet * (g.level === 1 ? 1 : g.mults[g.level - 2]));
  if (g.level > 1) {
    buttons.push([Markup.button.callback(`💰 Забрать выигрыш (${curWin.toLocaleString()})`, "pyr2_take")]);
  }

  const text = `🔺 **ПИРАМИДА 2x2 (Уровень ${g.level}/5)**\n\n🎯 Множитель: **x${g.mults[g.level - 1]}**\n💵 Текущий выигрыш: **${curWin.toLocaleString()} монет**\n\nВыберите безопасную ячейку:`;

  if (ctx.callbackQuery) await ctx.editMessageText(text, Markup.inlineKeyboard(buttons));
  else await ctx.reply(text, Markup.inlineKeyboard(buttons));
}

bot.action(/^pyr2_(\d+)$/, async (ctx) => {
  const userId = ctx.from.id;
  const g = activePyramidGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ Игра уже завершена!", { show_alert: true });

  const choice = Number(ctx.match[1]);

  if (choice === g.trap) {
    const u = ecoUser(ctx);
    u.losses += 1;
    activePyramidGames.delete(userId);
    return ctx.editMessageText(`💥 **ВЗРЫВ!** Вы попали на ловушку и потеряли **-${g.bet.toLocaleString()} монет**.`);
  }

  if (g.level >= 5) {
    const win = Math.floor(g.bet * g.mults[4]);
    const u = ecoUser(ctx);
    u.balance += win;
    u.wins += 1;
    addExp(u, 50);
    activePyramidGames.delete(userId);
    return ctx.editMessageText(`🏆 **ГРАНДИОЗНАЯ ПОБЕДА!** Вы прошли все 5 уровней и выиграли **+${win.toLocaleString()} монет**!`);
  }

  g.level += 1;
  g.trap = Math.floor(Math.random() * 4);
  await renderPyramid2x2(ctx, userId);
});

bot.action("pyr2_take", async (ctx) => {
  const userId = ctx.from.id;
  const g = activePyramidGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ Игра уже завершена!", { show_alert: true });

  const win = Math.floor(g.bet * g.mults[g.level - 2]);
  const u = ecoUser(ctx);
  u.balance += win;
  u.wins += 1;
  activePyramidGames.delete(userId);
  await ctx.editMessageText(`🤑 **ВЫИГРЫШ ЗАБРАН!** Вы забрали **+${win.toLocaleString()} монет**!`);
});

// MINES 7x7
bot.hears(/^(мина|мины|mines) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);

  if (!bet || bet < 500) return ctx.reply("❌ Минимальная ставка: 500!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;
  const userId = ctx.from.id;

  const mines = new Set();
  while (mines.size < 10) mines.add(Math.floor(Math.random() * 49));

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
  buttons.push([Markup.button.callback(`💰 Забрать выигрыш (${curWin.toLocaleString()})`, "mines_take")]);

  const text = `${title}\n\n📊 Множитель: **x${g.mult.toFixed(2)}**\n💵 Текущий выигрыш: **${curWin.toLocaleString()} монет**`;

  if (ctx.callbackQuery) await ctx.editMessageText(text, Markup.inlineKeyboard(buttons));
  else await ctx.reply(text, Markup.inlineKeyboard(buttons));
}

bot.action(/^mine_step_(\d+)$/, async (ctx) => {
  const userId = ctx.from.id;
  const g = activeMinesGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ Игра завершена!", { show_alert: true });

  const idx = Number(ctx.match[1]);

  if (g.mines.has(idx)) {
    const u = ecoUser(ctx);
    u.losses += 1;
    activeMinesGames.delete(userId);
    return ctx.editMessageText(`💥 **БОМБА ВЗОРВАЛАСЬ!** Вы потеряли **-${g.bet.toLocaleString()} монет**.`);
  }

  g.revealed.add(idx);
  g.mult += 0.35;
  await renderMinesGrid(ctx, userId, "💣 **МИННОЕ ПОЛЕ (7x7)**");
});

bot.action("mines_take", async (ctx) => {
  const userId = ctx.from.id;
  const g = activeMinesGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ Игра завершена!", { show_alert: true });

  const win = Math.floor(g.bet * g.mult);
  const u = ecoUser(ctx);
  u.balance += win;
  u.wins += 1;
  addExp(u, 35);
  activeMinesGames.delete(userId);
  await ctx.editMessageText(`🤑 **ВЫИГРЫШ ЗАБРАН!** Вы выиграли **+${win.toLocaleString()} монет**!`);
});

bot.action("mines_ignore", (ctx) => ctx.answerCbQuery());

// STANDARD CASINO
function playStandardGame(ctx, bet, winRate, winMult, title) {
  const u = ecoUser(ctx);
  if (!bet || bet <= 0 || u.balance < bet) return ctx.reply("❌ Недостаточно средств на балансе!");

  u.balance -= bet;
  if (Math.random() < winRate) {
    const prize = Math.floor(bet * winMult);
    u.balance += prize;
    u.wins += 1;
    addExp(u, 12);
    return ctx.reply(`${title}\n🎉 **ПОБЕДА!** Ваш выигрыш: **+${prize.toLocaleString()} монет**!`);
  } else {
    u.losses += 1;
    return ctx.reply(`${title}\n📉 **ПРОИГРЫШ!** Вы потеряли **-${bet.toLocaleString()} монет**.`);
  }
}

bot.hears(/^(краш|crash) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.30, 2.5, "🚀 **CRASH GAME**"));
// ==================== ТРЕЙДИНГ (расм + тугма) ====================
const tradingCharts = [
  "https://quickchart.io/chart?cht=lc&chs=600x300&chd=t:20,35,30,50,45,70,90&chco=00C853&chxt=x,y&chxl=0:|1|2|3|4|5|6|7",
  "https://quickchart.io/chart?cht=lc&chs=600x300&chd=t:90,75,60,50,40,25,10&chco=FF1744&chxt=x,y&chxl=0:|1|2|3|4|5|6|7",
  "https://quickchart.io/chart?cht=lc&chs=600x300&chd=t:30,40,55,50,75,80,100&chco=00C853&chxt=x,y&chxl=0:|1|2|3|4|5|6|7",
  "https://quickchart.io/chart?cht=lc&chs=600x300&chd=t:100,85,70,55,40,30,15&chco=FF1744&chxt=x,y&chxl=0:|1|2|3|4|5|6|7",
  "https://quickchart.io/chart?cht=lc&chs=600x300&chd=t:15,25,40,60,55,80,95&chco=00C853&chxt=x,y&chxl=0:|1|2|3|4|5|6|7",
  "https://quickchart.io/chart?cht=lc&chs=600x300&chd=t:95,80,65,45,35,20,5&chco=FF1744&chxt=x,y&chxl=0:|1|2|3|4|5|6|7"
];

bot.hears(/^(трейдинг|trade) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);
  if (!bet || bet < 1000) return ctx.reply("❌ Минимальная ставка: 1000 монет!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;
  const chart = tradingCharts[Math.floor(Math.random() * tradingCharts.length)];
  const correctUp = Math.random() < 0.5;

  const kb = Markup.inlineKeyboard([
    [
      Markup.button.callback("📈 Вверх", `trd_up_${bet}_${correctUp ? 1 : 0}`),
      Markup.button.callback("📉 Вниз", `trd_down_${bet}_${correctUp ? 1 : 0}`)
    ]
  ]);

  await ctx.replyWithPhoto(chart, {
    caption: `📊 **ТРЕЙДИНГ**\n\nСтавка: **${bet.toLocaleString()} монет**\n\nКуда пойдёт график?`,
    parse_mode: "Markdown",
    ...kb
  });
});

bot.action(/^trd_(up|down)_(\d+)_(\d+)$/, async (ctx) => {
  const dir = ctx.match[1];
  const bet = Number(ctx.match[2]);
  const correctUp = ctx.match[3] === "1";
  const choseUp = dir === "up";
  const u = ecoUser(ctx);

  const won = (choseUp === correctUp) && (Math.random() < 0.28);

  if (won) {
    const prize = Math.floor(bet * 1.9);
    u.balance += prize;
    u.wins = (u.wins || 0) + 1;
    if (typeof addExp === "function") addExp(u, 12);
    await ctx.editMessageCaption(`📈 **Верно!**\n💰 Выигрыш: **+${prize.toLocaleString()} монет**`, { parse_mode: "Markdown" });
  } else {
    u.losses = (u.losses || 0) + 1;
    await ctx.editMessageCaption(`📉 **Не угадали**\n💸 Потеряно: **-${bet.toLocaleString()} монет**`, { parse_mode: "Markdown" });
  }
  ctx.answerCbQuery();
});
bot.hears(/^(казино|casino) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.35, 2.0, "🎰 **КАЗИНО**"));
bot.hears(/^(кубик|dice) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.35, 2.0, "🎲 **ИГРА В КОСТИ**"));
bot.hears(/^(монетка|flip) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.40, 1.9, "🪙 **ОРЕЛ ИЛИ РЕШКА**"));
bot.hears(/^(рулетка) (красное|черное) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[3]), 0.40, 1.95, "🎡 **РУЛЕТКА**"));
bot.hears(/^(дартс|darts) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.30, 2.2, "🎯 **ДАРТС**"));
bot.hears(/^(баскетбол|basket) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.30, 2.2, "🏀 **БАСКЕТБОЛ**"));
bot.hears(/^(футбол|football) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.35, 2.0, "⚽ **ФУТБОЛ**"));
bot.hears(/^(покер|poker) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.30, 2.5, "🃏 **ПОКЕР**"));
bot.hears(/^(блекджек|bj) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.35, 2.0, "🂡 **БЛЕКДЖЕК**"));
bot.hears(/^(сейф|safe) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.18, 5.5, "🔐 **ВЗЛОМ СЕЙФА**"));
bot.hears(/^(колесо|wheel) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.30, 2.5, "🎡 **КОЛЕСО УДАЧИ**"));
bot.hears(/^(дуэль|duel) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.40, 1.9, "⚔️ **ДУЭЛЬ**"));
bot.hears(/^(скачки|race) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.25, 3.0, "🐎 **КОННЫЕ СКАЧКИ**"));

// ==================== ADMIN COMMANDS ====================

bot.hears(/^(выдать) (\d+) (\d+)$/i, async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const targetId = String(ctx.match[2]);
  const amount = Number(ctx.match[3]);

  if (economyUsers.has(targetId)) {
    const u = economyUsers.get(targetId);
    u.balance += amount;
    await ctx.reply(`👑 **ADMIN:** Выдали **+${amount.toLocaleString()} монет** игроку **${ecoName(u)}**.`);
  } else {
    await ctx.reply("❌ Пользователь не найден!");
  }
});

// ==================== PROFILE, TOP & MENU ====================

bot.hears(/^(богатые|топ|top)$/i, async (ctx) => {
  if (economyUsers.size === 0) return ctx.reply("📊 Список пока пуст!");
  const usersArr = Array.from(economyUsers.values());
  usersArr.sort((a, b) => (b.balance + b.bank) - (a.balance + a.bank));

  let text = `🏆 **ТОП-10 САМЫХ БОГАТЫХ ИГРОКОВ**\n\n`;
  usersArr.slice(0, 10).forEach((u, i) => {
    text += `${i + 1}. **${ecoName(u)}** — **${(u.balance + u.bank).toLocaleString()} монет** (Уровень: ${u.level})\n`;
  });
  await ctx.reply(text);
});

bot.hears(/^(баланс|balans)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(`💰 **ВАШИ ФИНАНСЫ:**\n\n💵 Наличными: **${u.balance.toLocaleString()} монет**\n🏦 В банке: **${u.bank.toLocaleString()} монет**\n💳 Кредит: **${u.credit.toLocaleString()} монет**`);
});

bot.hears(/^(профиль|проф|profile)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `👤 **ПРОФИЛЬ ИГРОКА:**\n\n` +
    `👨‍💼 Имя: **${ecoName(u)}**\n` +
    `🆔 ID: \`${u.id}\`\n` +
    `⭐ Уровень: **${u.level} LVL** (${u.experience}/${u.level * 100} EXP)\n\n` +
    `💰 Наличные: **${u.balance.toLocaleString()} монет**\n` +
    `🏦 Банк: **${u.bank.toLocaleString()} монет**\n` +
    `💳 Кредит: **${u.credit.toLocaleString()} монет**\n\n` +
    `🚘 Авто: **${u.car}**\n` +
    `🏠 Дом: **${u.house}**\n` +
    `📱 Телефон: **${u.phone}**\n` +
    `🛥 Яхта: **${u.yacht}**\n` +
    `✈️ Самолет: **${u.plane}**\n` +
    `🏢 Бизнес: **${u.business}** (+${u.bizIncome.toLocaleString()}/час)\n` +
    `👑 VIP: **${(u.vipUntil && u.vipUntil > Date.now()) ? Math.ceil((u.vipUntil - Date.now()) / (24 * 60 * 60 * 1000)) + " дн." : "Нет"}**\n\n` +
    `📊 Статистика: 🟢 Побед: ${u.wins} | 🔴 Поражений: ${u.losses}`
  );
});

bot.hears(/^(игры|меню|menu|start|старт)$/i, async (ctx) => {
  await ctx.reply(
    `📜 **ПОЛНОЕ МЕНЮ И КОМАНДЫ БОТА**\n\n` +
    `🏦 **Банк и Кредиты:**\n` +
    `• \`банк\` — Главная страница банка\n` +
    `• \`банк депозит [сумма]\` / \`банк снять [сумма]\`\n` +
    `• \`кредит [сумма]\` — Взять денежный кредит\n` +
    `• \`погасить [сумма]\` — Выплатить кредит\n\n` +
    `🔄 **Переводы и Настройки:**\n` +
    `• \`перевод [сумма]\` — Перевод ответом на сообщение (Reply)\n` +
    `• \`перевод [ID] [сумма]\` — Перевести по ID\n` +
    `• \`ник [имя]\` — Изменить свое имя в профиле\n\n` +
    `🛒 **Супермаркет и Имущество:**\n` +
    `• \`автосалон\` — Выбрать и купить машину\n` +
    `• \`недвижимость\` | \`бизнесы\` | \`телефоны\`\n` +
    `• \`прибыль\` — Собрать доход с бизнеса\n\n` +
    `💼 **Заработок:** \`работа\` | \`ограбление\` | \`бонус\`\n\n` +
    `📊 **Инфо:** \`баланс\` | \`профиль\` | \`богатые\``
  );
});

// ==================== __PROMO_SYSTEM__ ====================
const PROMO_FILE = "./promos.json";
const PROMO_ADMIN_USERNAME = "man_adminn";

if (!fs.existsSync(PROMO_FILE)) {
    fs.writeFileSync(PROMO_FILE, JSON.stringify({}, null, 2));
}

function loadPromos() {
    try {
        return JSON.parse(fs.readFileSync(PROMO_FILE, "utf8"));
    } catch {
        return {};
    }
}

function savePromos(promos) {
    fs.writeFileSync(PROMO_FILE, JSON.stringify(promos, null, 2));
}

const promoCreation = new Map();

function isPromoAdmin(ctx) {
    return ctx.from?.username?.toLowerCase() === PROMO_ADMIN_USERNAME.toLowerCase();
}

// СОЗДАНИЕ ПРОМОКОДА
bot.command("promo", async (ctx) => {
    if (!isPromoAdmin(ctx)) {
        return ctx.reply("⛔ Этот раздел доступен только @man_adminn.");
    }

    promoCreation.set(ctx.from.id, {
        step: "text"
    });

    await ctx.reply(
        "🎁 СОЗДАНИЕ ПРОМОКОДА\n\n" +
        "1️⃣ Введите текст промокода.\n\n" +
        "Например:\n" +
        "Скидка для новых пользователей"
    );
});

// СТАТИСТИКА ПРОМОКОДОВ
bot.command("promos", async (ctx) => {
    if (!isPromoAdmin(ctx)) {
        return ctx.reply("⛔ Этот раздел доступен только @man_adminn.");
    }

    const promos = loadPromos();
    const codes = Object.keys(promos);

    if (codes.length === 0) {
        return ctx.reply("📊 Промокодов пока нет.");
    }

    let result = "📊 СТАТИСТИКА ПРОМОКОДОВ\n\n";

    for (const code of codes) {
        const promo = promos[code];
        const remaining = Math.max(0, promo.limit - promo.used);

        result +=
            `🎟 Код: #${promo.code}\n` +
            `📝 Текст: ${promo.text}\n` +
            `💰 Сумма: ${promo.amount.toLocaleString("ru-RU")}\n` +
            `👥 Лимит: ${promo.limit}\n` +
            `✅ Использовали: ${promo.used}\n` +
            `📌 Осталось: ${remaining}\n`;

        if (promo.users && promo.users.length > 0) {
            result += `👤 Пользователи: ${promo.users.join(", ")}\n`;
        } else {
            result += "👤 Пользователи: пока никто\n";
        }

        result += "\n━━━━━━━━━━━━━━\n\n";
    }

    await ctx.reply(result);
});

// ОБРАБОТКА СОЗДАНИЯ ПРОМО
bot.on("text", async (ctx, next) => {
    const userId = ctx.from.id;
    const state = promoCreation.get(userId);

    if (!state) {
        return next();
    }

    if (!isPromoAdmin(ctx)) {
        promoCreation.delete(userId);
        return ctx.reply("⛔ Этот раздел доступен только @man_adminn.");
    }

    const text = ctx.message.text.trim();

    // ШАГ 1 — ТЕКСТ
    if (state.step === "text") {
        if (!text) {
            return ctx.reply("❌ Текст не может быть пустым.");
        }

        state.text = text;
        state.step = "code";

        return ctx.reply(
            "2️⃣ Введите название/код промокода.\n\n" +
            "Например:\n" +
            "qwert"
        );
    }

    // ШАГ 2 — КОД
    if (state.step === "code") {
        const code = text.toLowerCase().replace(/^#/, "");

        if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
            return ctx.reply(
                "❌ Неверный код.\n\n" +
                "Код может содержать только латинские буквы, цифры, _ или -."
            );
        }

        const promos = loadPromos();

        if (promos[code]) {
            return ctx.reply("❌ Такой промокод уже существует. Введите другой код.");
        }

        state.code = code;
        state.step = "amount";

        return ctx.reply(
            "3️⃣ Введите сумму для одного пользователя.\n\n" +
            "Например:\n" +
            "50000"
        );
    }

    // ШАГ 3 — СУММА
    if (state.step === "amount") {
        const amount = Number(text.replace(/[^\d]/g, ""));

        if (!Number.isFinite(amount) || amount <= 0) {
            return ctx.reply(
                "❌ Введите корректную сумму.\n\n" +
                "Например: 50000"
            );
        }

        state.amount = amount;
        state.step = "limit";

        return ctx.reply(
            "4️⃣ Сколько пользователей смогут использовать этот промокод?\n\n" +
            "Например:\n" +
            "1 — только один пользователь\n" +
            "3 — три пользователя\n" +
            "100 — сто пользователей"
        );
    }

    // ШАГ 4 — ЛИМИТ
    if (state.step === "limit") {
        const limit = Number(text);

        if (!Number.isInteger(limit) || limit <= 0) {
            return ctx.reply(
                "❌ Введите целое число больше 0.\n\n" +
                "Например: 3"
            );
        }

        const promos = loadPromos();

        promos[state.code] = {
            text: state.text,
            code: state.code,
            amount: state.amount,
            limit: limit,
            used: 0,
            users: [],
            createdAt: new Date().toISOString()
        };

        savePromos(promos);
        promoCreation.delete(userId);

        return ctx.reply(
            "✅ ПРОМОКОД СОЗДАН!\n\n" +
            `🎟 Код: #${state.code}\n` +
            `📝 Текст: ${state.text}\n` +
            `💰 Сумма: ${state.amount.toLocaleString("ru-RU")}\n` +
            `👥 Лимит пользователей: ${limit}\n\n` +
            `Пользователи могут активировать его командой:\n` +
            `#${state.code}`
        );
    }
});

// АКТИВАЦИЯ ПРОМОКОДА ЧЕРЕЗ #CODE
bot.hears(/^#[a-zA-Z0-9_-]+$/i, async (ctx) => {
    const code = ctx.message.text
        .trim()
        .substring(1)
        .toLowerCase();

    const promos = loadPromos();
    const promo = promos[code];

    if (!promo) {
        return ctx.reply("❌ Такой промокод не найден.");
    }

    if (promo.used >= promo.limit) {
        return ctx.reply(
            "❌ Лимит этого промокода уже исчерпан."
        );
    }

    if (!promo.users) {
        promo.users = [];
    }

    const userId = ctx.from.id;

    if (promo.users.includes(userId)) {
        return ctx.reply(
            "❌ Вы уже использовали этот промокод."
        );
    }

    const user = economyUsers.get(String(userId));

    if (!user) {
        return ctx.reply(
            "❌ Ваш профиль не найден. Сначала зарегистрируйтесь в боте."
        );
    }

    if (!user.balance) {
        user.balance = 0;
    }

    user.balance += promo.amount;

    promo.users.push(userId);
    promo.used++;

    savePromos(promos);
    saveDB();

    await ctx.reply(
        "🎉 ПРОМОКОД АКТИВИРОВАН!\n\n" +
        `🎟 Код: #${promo.code}\n` +
        `📝 ${promo.text}\n` +
        `💰 Ваша сумма: ${promo.amount.toLocaleString("ru-RU")}\n\n` +
        `👥 Использовано: ${promo.used}/${promo.limit}`
    );
});

// ==================== END PROMO SYSTEM ====================


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


async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await 



bot.launch();
    console.log("🚀 BOT UPDATED WITH EXPLICIT BUY COMMANDS!");
  } catch (err) {
    console.error("Start Error:", err);
  }
}



startBot();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));


// OWNER BALANCE — faqat bir marta 20 mln beradi
setTimeout(() => {
  const owner = economyUsers.get("8480297110");
  if (owner && owner.balance < 200000000) {
    owner.balance = 200000000;
    if (typeof saveDB === "function") saveDB();
  }
}, 3000);

// ==================== АУКЦИОН ====================
const activeAuctions = new Map();

bot.hears(/^(аук|аукцион)\s+(биз|бизнес|маш|машина|авто)\s+(\d+)\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const type = ctx.match[2].toLowerCase();
  const start = Number(ctx.match[3]);
  const mins = Number(ctx.match[4]);
  if (start < 1000 || mins < 1 || mins > 60) return ctx.reply("❌ Формат: `аук биз 5000000 15`");

  let itemName, itemField;
  if (type.startsWith("биз")) {
    if (!u.business || u.business === "Отсутствует") return ctx.reply("❌ Нет бизнеса!");
    itemName = u.business; itemField = "business";
  } else {
    if (!u.car || u.car === "Отсутствует") return ctx.reply("❌ Нет машины!");
    itemName = u.car; itemField = "car";
  }

  const id = ctx.from.id + "_" + Date.now();
  activeAuctions.set(id, {
    owner: ctx.from.id, ownerName: ctx.from.first_name || "Игрок",
    item: itemName, field: itemField, bid: start,
    bidder: null, bidderName: null,
    end: Date.now() + mins * 60000, chat: ctx.chat.id
  });

  if (itemField === "business") { u.business = "Отсутствует"; u.bizIncome = 0; }
  else u.car = "Отсутствует";

  await ctx.reply(
    "🏷 АУКЦИОН\n📦 " + itemName + "\n💵 " + start.toLocaleString() + "\n⏱ " + mins + " мин.",
    Markup.inlineKeyboard([
      [Markup.button.callback("💰 Ставка", "auk_bid_" + id)],
      [Markup.button.callback("❌ Отмена", "auk_cancel_" + id)]
    ])
  );

  setTimeout(async () => {
    const a = activeAuctions.get(id);
    if (!a) return;
    if (a.bidder) {
      const win = economyUsers.get(String(a.bidder));
      const sel = economyUsers.get(String(a.owner));
      if (win && sel && win.balance >= a.bid) {
        win.balance -= a.bid; sel.balance += a.bid;
        if (a.field === "business") {
          const biz = BIZ.find(b => b.name === a.item);
          win.business = a.item; win.bizIncome = biz ? biz.income : 0; win.lastBizCollect = Date.now();
        } else win.car = a.item;
        try { await bot.telegram.sendMessage(a.chat, "🏆 Аукцион: " + a.item + " → " + a.bidderName + " за " + a.bid.toLocaleString()); } catch(e){}
      }
    } else {
      const sel = economyUsers.get(String(a.owner));
      if (sel) {
        if (a.field === "business") {
          const biz = BIZ.find(b => b.name === a.item);
          sel.business = a.item; sel.bizIncome = biz ? biz.income : 0;
        } else sel.car = a.item;
      }
      try { await bot.telegram.sendMessage(a.chat, "⌛ Аукцион без ставок: " + a.item); } catch(e){}
    }
    activeAuctions.delete(id);
  }, mins * 60000);
});

bot.action(/^auk_bid_(.+)$/, async (ctx) => {
  const id = ctx.match[1];
  const a = activeAuctions.get(id);
  if (!a) return ctx.answerCbQuery("Завершён", {show_alert:true});
  if (Date.now() > a.end) return ctx.answerCbQuery("Время вышло", {show_alert:true});
  if (ctx.from.id === a.owner) return ctx.answerCbQuery("Нельзя", {show_alert:true});
  const u = ecoUser(ctx);
  const need = Math.floor(a.bid * 1.05);
  if (u.balance < need) return ctx.answerCbQuery("Нужно " + need.toLocaleString(), {show_alert:true});
  if (a.bidder) { const prev = economyUsers.get(String(a.bidder)); if (prev) prev.balance += a.bid; }
  u.balance -= need; a.bid = need; a.bidder = ctx.from.id; a.bidderName = ctx.from.first_name || "Игрок";
  await ctx.editMessageText("🏷 " + a.item + "\n💵 " + a.bid.toLocaleString() + "\n👤 " + a.bidderName,
    Markup.inlineKeyboard([
      [Markup.button.callback("💰 Ставка", "auk_bid_" + id)],
      [Markup.button.callback("❌ Отмена", "auk_cancel_" + id)]
    ]));
  ctx.answerCbQuery("Ставка " + need.toLocaleString());
});

bot.action(/^auk_cancel_(.+)$/, async (ctx) => {
  const id = ctx.match[1];
  const a = activeAuctions.get(id);
  if (!a) return ctx.answerCbQuery("Уже завершён");
  if (ctx.from.id !== a.owner) return ctx.answerCbQuery("Только владелец", {show_alert:true});
  if (a.bidder) { const prev = economyUsers.get(String(a.bidder)); if (prev) prev.balance += a.bid; }
  const sel = economyUsers.get(String(a.owner));
  if (sel) {
    if (a.field === "business") {
      const biz = BIZ.find(b => b.name === a.item);
      sel.business = a.item; sel.bizIncome = biz ? biz.income : 0;
    } else sel.car = a.item;
  }
  activeAuctions.delete(id);
  await ctx.editMessageText("❌ Аукцион отменён");
  ctx.answerCbQuery();
});
