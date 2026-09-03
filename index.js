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

// Anti-Spam (1.2 soniya)
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
      balance: 15000,
      bank: 0,
      vip: false,
      vipExpires: 0,
      business: null,
      car: null,
      house: null,
      jewelry: null,
      phone: null,
      yacht: null,
      lastBonus: 0,
      lastWork: 0,
      btc: 0,
      eth: 0,
      ton: 0,
      notcoin: 0,
      dogs: 0,
      notif: true
    });
  }
  const u = economyUsers.get(id);
  if (ctx.from.username && EXTRA_ADMINS.includes(ctx.from.username.toLowerCase())) {
    u.vip = true;
    u.vipExpires = now + SERVICE_7_DAYS * 52;
  }
  return u;
}

function ecoName(u) {
  const nameStr = u.username ? `@${u.username}` : u.name;
  const isVipActive = u.vip && (u.vipExpires === 0 || Date.now() < u.vipExpires);
  return `${nameStr}${isVipActive ? " 👑VIP" : ""}`;
}

// ==================== KATTA DONAT BO'LIMI (STARS) ====================

bot.hears(/^!?(донат|donat|stars)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("⭐ 25 Stars ➔ 🪙 2,500,000 монет", "buy_stars_25")],
    [Markup.button.callback("⭐ 50 Stars ➔ 🪙 6,000,000 монет", "buy_stars_50")],
    [Markup.button.callback("⭐ 100 Stars ➔ 🪙 15,000,000 монет", "buy_stars_100")],
    [Markup.button.callback("⭐ 250 Stars ➔ 🪙 50,000,000 монет", "buy_stars_250")],
    [Markup.button.callback("⭐ 500 Stars ➔ 🪙 120,000,000 монет", "buy_stars_500")],
    [Markup.button.callback("👑 7 Дней VIP Status ➔ ⭐ 75 Stars", "buy_vip_stars_7")],
    [Markup.button.callback("💎 30 Дней Premium Status ➔ ⭐ 200 Stars", "buy_vip_stars_30")]
  ]);

  await ctx.reply(
    `⭐ **ДОНАТ И РАСШИРЕННЫЙ МАГАЗИН STARS** ⭐\n\n` +
    `Поддержите проект и получите огромные бонусы!\n\n` +
    `💰 Ваш текущий баланс: 🪙 **${u.balance.toLocaleString()} монет**\n` +
    `👑 Ваш VIP статус: **${u.vip ? "АКТИВЕН" : "НЕТ"}**\n\n` +
    `Выберите подходящий пакет:`,
    keyboard
  );
});

// ==================== ULKAN MAGAZIN (SHOP) ====================

bot.hears(/^!?(магазин|shop|magazin)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("👑 VIP на 7 дней - 100,000 монет", "shop_vip_7")],
    [Markup.button.callback("📱 Телефоны и Гаджеты", "cat_phones")],
    [Markup.button.callback("🏎️ Автосалон (Машины)", "cat_cars")],
    [Markup.button.callback("🏰 Недвижимость (Дома)", "cat_houses")],
    [Markup.button.callback("💼 Бизнесы и Предприятия", "cat_biz")],
    [Markup.button.callback("💎 Ювелирка и Аксессуары", "cat_jewelry")],
    [Markup.button.callback("🛥️ Яхты и Самолеты", "cat_air")]
  ]);

  await ctx.reply(
    `🛍️ **ГЛАВНЫЙ СУПЕРМАРКЕТ И ИМУЩЕСТВО**\n\n` +
    `💰 Ваш баланс: 🪙 **${u.balance.toLocaleString()} монет**\n\n` +
    `Выберите категорию для покупок:`,
    keyboard
  );
});

// Category: Phones
bot.action("cat_phones", async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("📱 Redmi Note 13 - 30,000", "buy_p_redmi")],
    [Markup.button.callback("📱 iPhone 15 Pro Max - 150,000", "buy_p_iphone")],
    [Markup.button.callback("📱 Samsung S24 Ultra - 140,000", "buy_p_samsung")],
    [Markup.button.callback("⬅️ Назад", "back_shop")]
  ]);
  await ctx.editMessageText("📱 **ГАДЖЕТЫ И ТЕЛЕФОНЫ**\nВыберите устройство:", keyboard);
});

// Category: Cars
bot.action("cat_cars", async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("🚗 Chevrolet Gentra - 80,000", "buy_c_gentra")],
    [Markup.button.callback("🏎️ BMW M5 CS - 350,000", "buy_c_bmw")],
    [Markup.button.callback("🏎️ Mercedes GT63 S - 450,000", "buy_c_merc")],
    [Markup.button.callback("🏎️ Bugatti Tourbillon - 5,000,000", "buy_c_bugatti")],
    [Markup.button.callback("⬅️ Назад", "back_shop")]
  ]);
  await ctx.editMessageText("🏎️ **АВТОСАЛОН**\nВыберите авто:", keyboard);
});

// Category: Houses
bot.action("cat_houses", async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("🏢 3-х комнатная квартира - 200,000", "buy_h_apt")],
    [Markup.button.callback("🏡 Коттедж в Горах - 1,500,000", "buy_h_cot")],
    [Markup.button.callback("🏰 Вилла на Майами - 8,000,000", "buy_h_villa")],
    [Markup.button.callback("⬅️ Назад", "back_shop")]
  ]);
  await ctx.editMessageText("🏰 **НЕДВИЖИМОСТЬ**\nВыберите место жительства:", keyboard);
});

// Category: Businesses
bot.action("cat_biz", async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("☕ Автомойка / Автосервис - 300,000", "buy_b_wash")],
    [Markup.button.callback("🍔 Сеть Ресторанов - 2,000,000", "buy_b_rest")],
    [Markup.button.callback("🛢️ Нефтяная Вышка - 20,000,000", "buy_b_oil")],
    [Markup.button.callback("🚀 Частная Аэрокосмическая Компания - 150,000,000", "buy_b_space")],
    [Markup.button.callback("⬅️ Назад", "back_shop")]
  ]);
  await ctx.editMessageText("💼 **БИЗНЕСЫ**\nВыберите предприятие:", keyboard);
});

// Category: Jewelry
bot.action("cat_jewelry", async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("⌚ Rolex Submariner - 200,000", "buy_j_rolex")],
    [Markup.button.callback("💎 Бриллиантовое Колье - 1,000,000", "buy_j_neck")],
    [Markup.button.callback("👑 Золотая Корона - 10,000,000", "buy_j_crown")],
    [Markup.button.callback("⬅️ Назад", "back_shop")]
  ]);
  await ctx.editMessageText("💎 **ЮВЕЛИРКА**\nВыберите украшение:", keyboard);
});

// Category: Air / Yacht
bot.action("cat_air", async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("🛥️ Яхта Riva 88 - 12,000,000", "buy_a_yacht")],
    [Markup.button.callback("🛩️ Частный Самолет Gulfstream - 50,000,000", "buy_a_jet")],
    [Markup.button.callback("⬅️ Назад", "back_shop")]
  ]);
  await ctx.editMessageText("🛥️ **ЯХТЫ И САМОЛЕТЫ**\nВыберите элитный транспорт:", keyboard);
});

bot.action("back_shop", async (ctx) => {
  const u = ecoUser(ctx);
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("👑 VIP на 7 дней - 100,000 монет", "shop_vip_7")],
    [Markup.button.callback("📱 Телефоны и Гаджеты", "cat_phones")],
    [Markup.button.callback("🏎️ Автосалон (Машины)", "cat_cars")],
    [Markup.button.callback("🏰 Недвижимость (Дома)", "cat_houses")],
    [Markup.button.callback("💼 Бизнесы и Предприятия", "cat_biz")],
    [Markup.button.callback("💎 Ювелирка и Аксессуары", "cat_jewelry")],
    [Markup.button.callback("🛥️ Яхты и Самолеты", "cat_air")]
  ]);
  await ctx.editMessageText(`🛍️ **ГЛАВНЫЙ СУПЕРМАРКЕТ**\n\n💰 Баланс: 🪙 **${u.balance.toLocaleString()} монет**`, keyboard);
});

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

// Purchases
bot.action("buy_p_redmi", (ctx) => processBuy(ctx, 30000, "phone", "Redmi Note 13"));
bot.action("buy_p_iphone", (ctx) => processBuy(ctx, 150000, "phone", "iPhone 15 Pro Max"));
bot.action("buy_p_samsung", (ctx) => processBuy(ctx, 140000, "phone", "Samsung S24 Ultra"));

bot.action("buy_c_gentra", (ctx) => processBuy(ctx, 80000, "car", "Chevrolet Gentra"));
bot.action("buy_c_bmw", (ctx) => processBuy(ctx, 350000, "car", "BMW M5 CS"));
bot.action("buy_c_merc", (ctx) => processBuy(ctx, 450000, "car", "Mercedes GT63 S"));
bot.action("buy_c_bugatti", (ctx) => processBuy(ctx, 5000000, "car", "Bugatti Tourbillon"));

bot.action("buy_h_apt", (ctx) => processBuy(ctx, 200000, "house", "3-х комн. квартира"));
bot.action("buy_h_cot", (ctx) => processBuy(ctx, 1500000, "house", "Коттедж в Горах"));
bot.action("buy_h_villa", (ctx) => processBuy(ctx, 8000000, "house", "Вилла на Майами"));

bot.action("buy_b_wash", (ctx) => processBuy(ctx, 300000, "business", "Автомойка"));
bot.action("buy_b_rest", (ctx) => processBuy(ctx, 2000000, "business", "Сеть Ресторанов"));
bot.action("buy_b_oil", (ctx) => processBuy(ctx, 20000000, "business", "Нефтяная Вышка"));
bot.action("buy_b_space", (ctx) => processBuy(ctx, 150000000, "business", "Аэрокосмическая Компания"));

bot.action("buy_j_rolex", (ctx) => processBuy(ctx, 200000, "jewelry", "Rolex Submariner"));
bot.action("buy_j_neck", (ctx) => processBuy(ctx, 1000000, "jewelry", "Бриллиантовое Колье"));
bot.action("buy_j_crown", (ctx) => processBuy(ctx, 10000000, "jewelry", "Золотая Корона"));

bot.action("buy_a_yacht", (ctx) => processBuy(ctx, 12000000, "yacht", "Яхта Riva 88"));
bot.action("buy_a_jet", (ctx) => processBuy(ctx, 50000000, "yacht", "Самолет Gulfstream"));

// ==================== KRIPTO TRADING (5 VALYUTA) ====================

const CRYPTO_RATES = {
  btc: 60000,
  eth: 3500,
  ton: 600,
  not: 2,
  dogs: 1
};

bot.hears(/^!?(трейдинг|birja|биржа|крипта|crypto)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `📈 **КРИПТО-БИРЖА И ТРЕЙДИНГ**\n\n` +
    `📊 **Курсы криптовалют:**\n` +
    `• 🟠 BTC: **${CRYPTO_RATES.btc.toLocaleString()} монет**\n` +
    `• 🔷 ETH: **${CRYPTO_RATES.eth.toLocaleString()} монет**\n` +
    `• 💎 TON: **${CRYPTO_RATES.ton.toLocaleString()} монет**\n` +
    `• 🟡 NOT: **${CRYPTO_RATES.not} монет**\n` +
    `• 🐶 DOGS: **${CRYPTO_RATES.dogs} монет**\n\n` +
    `💼 **Ваш портфель:**\n` +
    `• BTC: ${u.btc} | ETH: ${u.eth} | TON: ${u.ton}\n` +
    `• NOT: ${u.notcoin} | DOGS: ${u.dogs}\n` +
    `💰 Баланс: 🪙 **${u.balance.toLocaleString()} монет**\n\n` +
    `📝 **Примеры команд:**\n` +
    `• \`Купить btc 1\` | \`Продать btc 1\`\n` +
    `• \`Купить ton 10\` | \`Продать ton 10\`\n` +
    `• \`Купить not 1000\` | \`Продать not 1000\``
  );
});

bot.hears(/^!(купить|buy) (btc|eth|ton|not|dogs) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const coin = ctx.match[2].toLowerCase();
  const amount = Number(ctx.match[3]);

  let field = coin;
  if (coin === "not") field = "notcoin";

  const cost = amount * CRYPTO_RATES[coin];
  if (u.balance < cost) return ctx.reply(`❌ Недостаточно средств! Нужно 🪙 ${cost.toLocaleString()} монет.`);

  u.balance -= cost;
  u[field] += amount;
  await ctx.reply(`✅ Вы успешно купили **${amount} ${coin.toUpperCase()}** za 🪙 ${cost.toLocaleString()} монет!`);
});

bot.hears(/^!(продать|sell) (btc|eth|ton|not|dogs) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const coin = ctx.match[2].toLowerCase();
  const amount = Number(ctx.match[3]);

  let field = coin;
  if (coin === "not") field = "notcoin";

  if (u[field] < amount) return ctx.reply(`❌ У вас нет **${amount} ${coin.toUpperCase()}**!`);

  const gain = amount * CRYPTO_RATES[coin];
  u[field] -= amount;
  u.balance += gain;
  await ctx.reply(`✅ Вы успешно продали **${amount} ${coin.toUpperCase()}** и получили +🪙 ${gain.toLocaleString()} монет!`);
});

// ==================== PROFIL VA ADMIN PANEL ====================

bot.hears(/^!?(профиль|profile|баланс|balance)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `👤 **ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ**\n\n` +
    `Имя: ${ecoName(u)}\n` +
    `🆔 ID: \`${u.id}\`\n` +
    `🪙 Кошелек: ${u.balance.toLocaleString()} монет\n` +
    `🏦 Банк: ${u.bank.toLocaleString()} монет\n\n` +
    `💼 Криптопортфель: BTC: ${u.btc} | ETH: ${u.eth} | TON: ${u.ton} | NOT: ${u.notcoin} | DOGS: ${u.dogs}\n\n` +
    `📱 Телефон: ${u.phone || "Нет"}\n` +
    `🏎️ Авто: ${u.car || "Нет"}\n` +
    `🏰 Дом: ${u.house || "Нет"}\n` +
    `💼 Бизнес: ${u.business || "Нет"}\n` +
    `💎 Украшение: ${u.jewelry || "Нет"}\n` +
    `🛥️ Элитный транспорт: ${u.yacht || "Нет"}`
  );
});

bot.command(["kick", "кик"], async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply("⛔ Доступ запрещен!");
  if (!ctx.message.reply_to_message) return ctx.reply("📌 Ответьте на сообщение!");
  const target = ctx.message.reply_to_message.from;
  if (isImmune(target.id, target.username)) return ctx.reply("🛡️ У этого пользователя иммунитет!");

  await ctx.banChatMember(target.id);
  await ctx.unbanChatMember(target.id);
  await ctx.reply(`🚪 **${target.first_name}** был кикнут из группы.`);
});

bot.command(["ban", "бан"], async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply("⛔ Доступ запрещен!");
  if (!ctx.message.reply_to_message) return ctx.reply("📌 Ответьте на сообщение!");
  const target = ctx.message.reply_to_message.from;
  if (isImmune(target.id, target.username)) return ctx.reply("🛡️ У этого пользователя иммунитет!");

  await ctx.banChatMember(target.id);
  await ctx.reply(`🚫 **${target.first_name}** забанен.`);
});

bot.command(["unban", "разбан"], async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply("⛔ Доступ запрещен!");
  if (!ctx.message.reply_to_message) return ctx.reply("📌 Ответьте на сообщение!");
  const target = ctx.message.reply_to_message.from;

  await ctx.unbanChatMember(target.id);
  await ctx.reply(`✅ **${target.first_name}** разбанен.`);
});

bot.command("start", async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `👋 **Приветствуем, ${u.name}!**\n\n` +
    `🤖 **8-A ULTIMATE ADMIN & GAME BOT**\n\n` +
    `📌 **Основные разделы:**\n` +
    `• \`Профиль\` — Личный кабинет и имущество\n` +
    `• \`Магазин\` — Телефоны, Авто, Дома, Бизнесы, Яхты\n` +
    `• \`Донат\` — Покупка VIP и монет за Telegram Stars\n` +
    `• \`Трейдинг\` — Крипто-биржа (BTC, ETH, TON, NOT, DOGS)\n` +
    `• \`Бонус\` / \`Работа\` — Заработок денег\n` +
    `• \`Игры\` — Список 21 игр`,
    Markup.removeKeyboard()
  );
});

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🔥 ULTIMATE Bot muvaffaqiyatli ishga tushdi!");
  } catch (err) {
    console.error(" Bot xatosi:", err);
  }
}

startBot();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
