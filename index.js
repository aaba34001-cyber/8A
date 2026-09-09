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
  { name: "🏎 Koenigsegg Jesko", price: 120000000 }
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
  { name: "🏝 Собственный тропический остров", price: 300000000 }
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
  { name: "🌍 Международная Корпорация", price: 5000000000, income: 500000000 }
];

const YACHTS = [
  { name: "🚤 Катер Sea-Doo", price: 500000 },
  { name: "🛥 Моторная Яхта", price: 5000000 },
  { name: "🛳 Супер-Яхта Eclipse", price: 50000000 }
];

const PLANES = [
  { name: "🛩 Частный Самолет Cessna", price: 8000000 },
  { name: "✈️ Бизнес-джет Gulfstream", price: 45000000 },
  { name: "🚀 Личный Boeing 747", price: 200000000 }
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
bot.hears(/^(трейдинг|trade) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.40, 1.8, "📊 **БИРЖЕВОЙ ТРЕЙДИНГ**"));
bot.hears(/^(казино|casino) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.35, 2.0, "🎰 **КАЗИНО**"));
bot.hears(/^(кубик|dice) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.35, 2.0, "🎲 **ИГРА В КОСТИ**"));
bot.hears(/^(слоты|slots) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.25, 3.5, "🎰 **СЛОТ-МАШИНА**"));
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
