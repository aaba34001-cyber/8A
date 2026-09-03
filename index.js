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

// Anti-Spam (1.2s)
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
      dogs: 0
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

// ==================== ASOSIY BUYRUQLAR (KOMANDALAR) ====================

// Start
bot.hears(/^!?старт[\s\.]*$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `👋 **Приветствуем, ${u.name}!**\n\n` +
    `🤖 **8-A ULTIMATE MULTI-BOT**\n\n` +
    `📌 **Доступные разделы:**\n` +
    `• \`Баланс\` / \`Профиль\` — Личный кабинет\n` +
    `• \`Магазин\` — Авто, Дома, Бизнесы, Гаджеты\n` +
    `• \`Донат\` — Stars оркали VIP ва монеталар\n` +
    `• \`Трейдинг\` — Крипто-биржа (BTC, ETH, TON...)\n` +
    `• \`Банк\` — Хранение денег под процент\n` +
    `• \`Игры\` — Список 21 мини-игры`
  );
});

// Profile / Balance
bot.hears(/^!?(профиль|profile|баланс|balance)[\s\.]*$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `👤 **ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ**\n\n` +
    `Имя: ${ecoName(u)}\n` +
    `🆔 ID: \`${u.id}\`\n` +
    `🪙 Кошелек: **${u.balance.toLocaleString()} монет**\n` +
    `🏦 Банк: **${u.bank.toLocaleString()} монет**\n\n` +
    `💼 Криптопортфель:\n` +
    `• BTC: ${u.btc} | ETH: ${u.eth} | TON: ${u.ton}\n` +
    `• NOT: ${u.notcoin} | DOGS: ${u.dogs}\n\n` +
    `📱 Телефон: ${u.phone || "Нет"}\n` +
    `🏎️ Авто: ${u.car || "Нет"}\n` +
    `🏰 Дом: ${u.house || "Нет"}\n` +
    `💼 Бизнес: ${u.business || "Нет"}\n` +
    `💎 Украшение: ${u.jewelry || "Нет"}\n` +
    `🛥️ Элитный транспорт: ${u.yacht || "Нет"}`
  );
});

// Bank System
bot.hears(/^!?(банк|bank)[\s\.]*$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `🏦 **НАЦИОНАЛЬНЫЙ БАНК**\n\n` +
    `💰 В кошельке: **${u.balance.toLocaleString()} монет**\n` +
    `🏛️ На банковском счету: **${u.bank.toLocaleString()} монет**\n\n` +
    `📝 **Команды банка:**\n` +
    `• \`!банк положить [сумма]\` — Депозит в банк\n` +
    `• \`!банк снять [сумма]\` — Снять деньги с банка`
  );
});

bot.hears(/^!банк (положить|пополнить) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[2]);
  if (u.balance < amount) return ctx.reply("❌ Недостаточно средств в кошельке!");
  u.balance -= amount;
  u.bank += amount;
  await ctx.reply(`✅ Вы успешно положили в банк **${amount.toLocaleString()} монет**!`);
});

bot.hears(/^!банк (снять|забрать) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[2]);
  if (u.bank < amount) return ctx.reply("❌ Недостаточно средств на банковском счету!");
  u.bank -= amount;
  u.balance += amount;
  await ctx.reply(`✅ Вы успешно сняли с банка **${amount.toLocaleString()} монет**!`);
});

// Games List
bot.hears(/^!?(игры|игры|games)[\s\.]*$/i, async (ctx) => {
  await ctx.reply(
    `🎰 **СПИСОК ИГР И МИНИ-ИГР** 🎰\n\n` +
    `🎮 **Развлекательные игры:**\n` +
    `• \`!слот [ставка]\` — Игровой автомат\n` +
    `• \`!кубик [1-6] [ставка]\` — Кости\n` +
    `• \`!рулетка [красное/черное] [ставка]\`\n` +
    `• \`!пирамида [ставка]\` — Опасная пирамида\n` +
    `• \`!мины [ставка]\` — Поле с минами 7x7\n` +
    `• \`!казино [ставка]\` — Классическое казино\n` +
    `• \`!монета [орел/решка] [ставка]\`\n\n` +
    `💡 *Чтобы начать играть, просто введите команду, например: \`!слот 1000\`*`
  );
});

// Slot Game Example
bot.hears(/^!слот (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств для ставки!");

  u.balance -= bet;
  const items = ["🍋", "7️⃣", "💎", "🍒", "🔔"];
  const r1 = items[Math.floor(Math.random() * items.length)];
  const r2 = items[Math.floor(Math.random() * items.length)];
  const r3 = items[Math.floor(Math.random() * items.length)];

  let win = 0;
  if (r1 === r2 && r2 === r3) win = bet * 5;
  else if (r1 === r2 || r2 === r3 || r1 === r3) win = bet * 2;

  if (win > 0) {
    u.balance += win;
    await ctx.reply(`🎰 [ ${r1} | ${r2} | ${r3} ]\n🎉 Вы выиграли +🪙 **${win.toLocaleString()} монет**!`);
  } else {
    await ctx.reply(`🎰 [ ${r1} | ${r2} | ${r3} ]\n😔 Проигрыш! -🪙 **${bet.toLocaleString()} монет**`);
  }
});

// Multi-Game: Pyramid
bot.hears(/^!пирамида (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;
  const win = Math.random() > 0.45;
  if (win) {
    const prize = Math.floor(bet * 1.8);
    u.balance += prize;
    await ctx.reply(`🔺 **ПИРАМИДА**\n✨ Вы успешно поднялись и выиграли 🪙 **${prize.toLocaleString()} монет**!`);
  } else {
    await ctx.reply(`🔺 **ПИРАМИДА**\n💥 Пирамида обрушилась! Вы потеряли 🪙 **${bet.toLocaleString()} монет**.`);
  }
});

// SHOP & DONATE MODULES
bot.hears(/^!?(магазин|shop|magazin)[\s\.]*$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("👑 VIP 7 дней - 100,000", "shop_vip_7")],
    [Markup.button.callback("🏎️ Автосалон", "cat_cars")],
    [Markup.button.callback("🏰 Недвижимость", "cat_houses")],
    [Markup.button.callback("💼 Бизнесы", "cat_biz")]
  ]);
  await ctx.reply(`🛍️ **ГЛАВНЫЙ МАГАЗИН**\n💰 Баланс: 🪙 **${u.balance.toLocaleString()}**`, keyboard);
});

bot.hears(/^!?(донат|donat|stars)[\s\.]*$/i, async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("⭐ 50 Stars ➔ 🪙 6,000,000", "buy_stars_50")],
    [Markup.button.callback("👑 7 Дней VIP ➔ ⭐ 75 Stars", "buy_vip_stars_7")]
  ]);
  await ctx.reply(`⭐ **ДОНАТ STARS**\nВыберите пакет:`, keyboard);
});

bot.command("start", async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(`👋 Привет, ${u.name}! Введите **Старт** или **Игры** для начала.`);
});

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🔥 Bot mukammal ishga tushdi!");
  } catch (err) {
    console.error(" Xatolik:", err);
  }
}

startBot();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
