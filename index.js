require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);
const OWNER_ID = Number(process.env.OWNER_ID || 8480297110);
const EXTRA_ADMINS = ["man_mass", "man_admin", "man_adminn", "man_adminnn"];

function isGroup(ctx) {
  return ctx.chat && (ctx.chat.type === "group" || ctx.chat.type === "supergroup");
}

async function isAdmin(ctx) {
  if (!ctx.from) return false;
  if (Number(ctx.from.id) === OWNER_ID) return true;
  if (ctx.from.username && EXTRA_ADMINS.some(a => a.toLowerCase() === ctx.from.username.toLowerCase())) {
    return true;
  }
  if (!isGroup(ctx)) return false;
  try {
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);
    return admins.some((admin) => Number(admin.user.id) === Number(ctx.from.id));
  } catch (error) {
    return false;
  }
}

function isImmune(userId, username) {
  if (Number(userId) === OWNER_ID) return true;
  if (username && EXTRA_ADMINS.some(a => a.toLowerCase() === username.toLowerCase())) {
    return true;
  }
  return false;
}

const economyUsers = new Map();
const userLastMessage = new Map();

// Anti-Spam
bot.use(async (ctx, next) => {
  if (!ctx.from) return next();
  const userId = ctx.from.id;
  const now = Date.now();
  if (userLastMessage.has(userId) && (now - userLastMessage.get(userId) < 1200)) {
    return;
  }
  userLastMessage.set(userId, now);
  return next();
});

const SERVICE_7_DAYS = 7 * 24 * 60 * 60 * 1000;
const SERVICE_30_DAYS = 30 * 24 * 60 * 60 * 1000;

function ecoUser(ctx) {
  const id = String(ctx.from.id);
  const now = Date.now();
  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id: ctx.from.id,
      name: ctx.from.first_name || "Пользователь",
      username: ctx.from.username || null,
      balance: 10000,
      bank: 0,
      vip: false,
      vipExpires: 0,
      business: null,
      car: null,
      house: null,
      jewelry: null,
      lastBonus: 0,
      lastWork: 0,
      btc: 0,
      eth: 0,
      ton: 0,
      notif: true
    });
  }
  const u = economyUsers.get(id);
  if (ctx.from.username && EXTRA_ADMINS.includes(ctx.from.username.toLowerCase())) {
    u.vip = true;
    u.vipExpires = now + SERVICE_7_DAYS * 10;
  }
  return u;
}

function ecoName(u) {
  const nameStr = u.username ? `@${u.username}` : u.name;
  const isVipActive = u.vip && (u.vipExpires === 0 || Date.now() < u.vipExpires);
  return `${nameStr}${isVipActive ? " 👑VIP" : ""}`;
}

// ==================== РАСШИРЕННЫЙ ДОНАТ (STARS) ====================

bot.hears(/^!?(донат|donat|stars)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("⭐ 50 Stars ➔ 🪙 5,000,000 монет", "buy_stars_50")],
    [Markup.button.callback("⭐ 150 Stars ➔ 🪙 20,000,000 монет", "buy_stars_150")],
    [Markup.button.callback("⭐ 500 Stars ➔ 🪙 100,000,000 монет", "buy_stars_500")],
    [Markup.button.callback("👑 7 Дней VIP Status ➔ ⭐ 100 Stars", "buy_vip_stars_7")],
    [Markup.button.callback("💎 30 Дней Premium Status ➔ ⭐ 250 Stars", "buy_vip_stars_30")]
  ]);

  await ctx.reply(
    `⭐ **ДОНАТ И ПОКУПКА STARS** ⭐\n\n` +
    `Поддержите развитие проекта и получите эксклюзивные бонусы!\n\n` +
    `💰 Ваш текущий баланс: 🪙 **${u.balance.toLocaleString()} монет**\n\n` +
    `Выберите подходящий пакет:`,
    keyboard
  );
});

// ==================== РАСШИРЕННЫЙ МАГАЗИН ====================

bot.hears(/^!?(магазин|shop)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("👑 VIP на 7 дней - 100,000 монет", "shop_vip_7")],
    [Markup.button.callback("🏎️ Автосалон (Машины)", "cat_cars")],
    [Markup.button.callback("🏰 Недвижимость (Дома)", "cat_houses")],
    [Markup.button.callback("💼 Бизнесы и Предприятия", "cat_biz")],
    [Markup.button.callback("💎 Украшения и Аксессуары", "cat_jewelry")]
  ]);

  await ctx.reply(
    `🛍️ **ГЛАВНЫЙ МАГАЗИН**\n\n` +
    `💰 Баланс: 🪙 **${u.balance.toLocaleString()} монет**\n\n` +
    `Выберите категорию товаров:`,
    keyboard
  );
});

bot.action("cat_cars", async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("🚗 BMW M5 F90 - 250,000", "buy_car_bmw")],
    [Markup.button.callback("🏎️ Porsche 911 GT3 - 750,000", "buy_car_porsche")],
    [Markup.button.callback("🏎️ Bugatti Chiron - 3,000,000", "buy_car_bugatti")],
    [Markup.button.callback("⬅️ Назад", "back_shop")]
  ]);
  await ctx.editMessageText("🏎️ **АВТОСАЛОН**\nВыберите автомобиль:", keyboard);
});

bot.action("cat_houses", async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("🏢 Квартира в Сити - 500,000", "buy_h_apt")],
    [Markup.button.callback("🏡 Загородный Пентхаус - 2,000,000", "buy_h_pent")],
    [Markup.button.callback("🏰 Вилла на Бали - 10,000,000", "buy_h_villa")],
    [Markup.button.callback("⬅️ Назад", "back_shop")]
  ]);
  await ctx.editMessageText("🏰 **НЕДВИЖИМОСТЬ**\nВыберите элитный дом:", keyboard);
});

bot.action("cat_biz", async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("☕ Сеть Кофейн - 1,500,000", "buy_b_coffee")],
    [Markup.button.callback("🛢️ Нефтяная Вышка - 15,000,000", "buy_b_oil")],
    [Markup.button.callback("🚀 Космическая Компания - 100,000,000", "buy_b_space")],
    [Markup.button.callback("⬅️ Назад", "back_shop")]
  ]);
  await ctx.editMessageText("💼 **БИЗНЕСЫ**\nВыберите предприятие:", keyboard);
});

bot.action("cat_jewelry", async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("⌚ Часы Rolex Daytona - 300,000", "buy_j_rolex")],
    [Markup.button.callback("💍 Бриллиантовое Кольцо - 800,000", "buy_j_ring")],
    [Markup.button.callback("👑 Золотая Корона - 5,000,000", "buy_j_crown")],
    [Markup.button.callback("⬅️ Назад", "back_shop")]
  ]);
  await ctx.editMessageText("💎 **ЮВЕЛИРНЫЙ МАГАЗИН**\nВыберите украшение:", keyboard);
});

bot.action("back_shop", async (ctx) => {
  const u = ecoUser(ctx);
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("👑 VIP на 7 дней - 100,000 монет", "shop_vip_7")],
    [Markup.button.callback("🏎️ Автосалон (Машины)", "cat_cars")],
    [Markup.button.callback("🏰 Недвижимость (Дома)", "cat_houses")],
    [Markup.button.callback("💼 Бизнесы и Предприятия", "cat_biz")],
    [Markup.button.callback("💎 Украшения и Аксессуары", "cat_jewelry")]
  ]);
  await ctx.editMessageText(`🛍️ **ГЛАВНЫЙ МАГАЗИН**\n\n💰 Баланс: 🪙 **${u.balance.toLocaleString()} монет**`, keyboard);
});

// Shop Xarid qilish logikasi
function processBuy(ctx, price, field, itemName) {
  const u = ecoUser(ctx);
  if (u.balance < price) {
    return ctx.answerCbQuery(`❌ Недостаточно средств! Нужно 🪙 ${price.toLocaleString()}`, { show_alert: true });
  }
  u.balance -= price;
  u[field] = itemName;
  return ctx.editMessageText(`✅ Вы успешно купили **${itemName}** за 🪙 ${price.toLocaleString()} монет!`);
}

bot.action("shop_vip_7", (ctx) => {
  const u = ecoUser(ctx);
  if (u.balance < 100000) return ctx.answerCbQuery("❌ Недостаточно средств!", { show_alert: true });
  u.balance -= 100000;
  u.vip = true;
  u.vipExpires = Date.now() + SERVICE_7_DAYS;
  ctx.editMessageText("🎉 Вы успешно купили 👑 **VIP статус на 7 дней**!");
});

bot.action("buy_car_bmw", (ctx) => processBuy(ctx, 250000, "car", "BMW M5 F90"));
bot.action("buy_car_porsche", (ctx) => processBuy(ctx, 750000, "car", "Porsche 911 GT3"));
bot.action("buy_car_bugatti", (ctx) => processBuy(ctx, 3000000, "car", "Bugatti Chiron"));

bot.action("buy_h_apt", (ctx) => processBuy(ctx, 500000, "house", "Квартира в Сити"));
bot.action("buy_h_pent", (ctx) => processBuy(ctx, 2000000, "house", "Загородный Пентхаус"));
bot.action("buy_h_villa", (ctx) => processBuy(ctx, 10000000, "house", "Вилла на Бали"));

bot.action("buy_b_coffee", (ctx) => processBuy(ctx, 1500000, "business", "Сеть Кофейн"));
bot.action("buy_b_oil", (ctx) => processBuy(ctx, 15000000, "business", "Нефтяная Вышка"));
bot.action("buy_b_space", (ctx) => processBuy(ctx, 100000000, "business", "Космическая Компания"));

bot.action("buy_j_rolex", (ctx) => processBuy(ctx, 300000, "jewelry", "Rolex Daytona"));
bot.action("buy_j_ring", (ctx) => processBuy(ctx, 800000, "jewelry", "Бриллиантовое Кольцо"));
bot.action("buy_j_crown", (ctx) => processBuy(ctx, 5000000, "jewelry", "Золотая Корона"));

// ==================== МНОГОФУНКЦИОНАЛЬНЫЙ ТРЕЙДИНГ ====================

const CRYPTO_RATES = {
  btc: 50000,
  eth: 3000,
  ton: 500
};

bot.hears(/^!?(трейдинг|birja|биржа|крипта)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `📈 **КРИПТО-БИРЖА И ТРЕЙДИНГ**\n\n` +
    `📊 **Актуальные курсы:**\n` +
    `• 🟠 BTC: **${CRYPTO_RATES.btc.toLocaleString()} монет**\n` +
    `• 🔷 ETH: **${CRYPTO_RATES.eth.toLocaleString()} монет**\n` +
    `• 💎 TON: **${CRYPTO_RATES.ton.toLocaleString()} монет**\n\n` +
    `💼 **Ваш портфель:**\n` +
    `• BTC: ${u.btc} | ETH: ${u.eth} | TON: ${u.ton}\n` +
    `💰 Баланс: 🪙 **${u.balance.toLocaleString()} монет**\n\n` +
    `📝 **Команды для торговли:**\n` +
    `• \`Купить бтц [кол-во]\` | \`Продать бтц [кол-во]\` \n` +
    `• \`Купить этх [кол-во]\` | \`Продать этх [кол-во]\` \n` +
    `• \`Купить тон [кол-во]\` | \`Продать тон [кол-во]\``
  );
});

// Трейдинг buy/sell buyruqlari
bot.hears(/^!(купить|buy) (бтц|btc|этх|eth|тон|ton) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const coin = ctx.match[2].toLowerCase();
  const amount = Number(ctx.match[3]);
  let key = "btc";
  if (coin === "этх" || coin === "eth") key = "eth";
  if (coin === "тон" || coin === "ton") key = "ton";

  const cost = amount * CRYPTO_RATES[key];
  if (u.balance < cost) return ctx.reply(`❌ Недостаточно средств! Нужно 🪙 ${cost.toLocaleString()} монет.`);

  u.balance -= cost;
  u[key] += amount;
  await ctx.reply(`✅ Вы успешно купили **${amount} ${key.toUpperCase()}** за 🪙 ${cost.toLocaleString()} монет!`);
});

bot.hears(/^!(продать|sell) (бтц|btc|этх|eth|тон|ton) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const coin = ctx.match[2].toLowerCase();
  const amount = Number(ctx.match[3]);
  let key = "btc";
  if (coin === "этх" || coin === "eth") key = "eth";
  if (coin === "тон" || coin === "ton") key = "ton";

  if (u[key] < amount) return ctx.reply(`❌ У вас нет **${amount} ${key.toUpperCase()}**!`);

  const gain = amount * CRYPTO_RATES[key];
  u[key] -= amount;
  u.balance += gain;
  await ctx.reply(`✅ Вы успешно продали **${amount} ${key.toUpperCase()}** и получили +🪙 ${gain.toLocaleString()} монет!`);
});

// ==================== ОБЩИЕ КОМАНДЫ И ИГРЫ ====================

bot.hears(/^!?(профиль|profile|баланс)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `👤 **ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ**\n\n` +
    `Имя: ${ecoName(u)}\n` +
    `🆔 ID: \`${u.id}\`\n` +
    `🪙 Кошелек: ${u.balance.toLocaleString()} монет\n` +
    `🏦 Банк: ${u.bank.toLocaleString()} монет\n\n` +
    `💼 Криптопортфель: BTC: ${u.btc} | ETH: ${u.eth} | TON: ${u.ton}\n\n` +
    `🏎️ Авто: ${u.car || "Отсутствует"}\n` +
    `🏰 Дом: ${u.house || "Отсутствует"}\n` +
    `💼 Бизнес: ${u.business || "Отсутствует"}\n` +
    `💎 Украшение: ${u.jewelry || "Отсутствует"}`
  );
});

bot.command("start", async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `👋 **Приветствуем, ${u.name}!**\n\n` +
    `🤖 **8-A ADMIN & MULTI-GAME BOT**\n\n` +
    `📌 **Основные модули:**\n` +
    `• \`Профиль\` — Личный кабинет и имущество\n` +
    `• \`Магазин\` — Авто, Недвижимость, Бизнесы и Аксессуары\n` +
    `• \`Донат\` — Покупка VIP и монет за Telegram Stars\n` +
    `• \`Трейдинг\` — Крипто-биржа (BTC, ETH, TON)\n` +
    `• \`Игры\` — Список 21 мини-игр`,
    Markup.removeKeyboard()
  );
});

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🔥 Бот с новым магазином и трейдингом запущен!");
  } catch (err) {
    console.error(" Ошибка бота:", err);
  }
}

startBot();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
