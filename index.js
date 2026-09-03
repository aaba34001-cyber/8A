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

function ecoUser(ctx) {
  const id = String(ctx.from.id);
  const now = Date.now();
  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id: ctx.from.id,
      name: ctx.from.first_name || "Пользователь",
      username: ctx.from.username || null,
      balance: 5000,
      bank: 0,
      vip: false,
      vipExpires: 0,
      business: null,
      car: null,
      house: null,
      lastBonus: 0,
      lastWork: 0,
      crypto: 0,
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

// ==================== АДМИН ПАНЕЛЬ ====================

bot.command(["kick", "кик"], async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply("⛔ Доступ запрещен!");
  if (!ctx.message.reply_to_message) return ctx.reply("📌 Ответьте на сообщение пользователя!");
  const target = ctx.message.reply_to_message.from;
  if (isImmune(target.id, target.username)) return ctx.reply("🛡️ У этого пользователя иммунитет!");

  await ctx.banChatMember(target.id);
  await ctx.unbanChatMember(target.id);
  await ctx.reply(`🚪 **${target.first_name}** был кикнут из группы.`);
});

bot.command(["ban", "бан"], async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply("⛔ Доступ запрещен!");
  if (!ctx.message.reply_to_message) return ctx.reply("📌 Ответьте на сообщение пользователя!");
  const target = ctx.message.reply_to_message.from;
  if (isImmune(target.id, target.username)) return ctx.reply("🛡️ У этого пользователя иммунитет!");

  await ctx.banChatMember(target.id);
  await ctx.reply(`🚫 **${target.first_name}** забанен.`);
});

bot.command(["unban", "разбан"], async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply("⛔ Доступ запрещен!");
  if (!ctx.message.reply_to_message) return ctx.reply("📌 Ответьте на сообщение пользователя!");
  const target = ctx.message.reply_to_message.from;

  await ctx.unbanChatMember(target.id);
  await ctx.reply(`✅ **${target.first_name}** разбанен.`);
});

bot.command(["mute", "мут"], async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply("⛔ Доступ запрещен!");
  if (!ctx.message.reply_to_message) return ctx.reply("📌 Ответьте на сообщение!");
  const target = ctx.message.reply_to_message.from;
  if (isImmune(target.id, target.username)) return ctx.reply("🛡️ У пользователя иммунитет!");

  await ctx.restrictChatMember(target.id, { permissions: { can_send_messages: false }, until_date: Math.floor(Date.now() / 1000) + 3600 });
  await ctx.reply(`🔇 **${target.first_name}** переведен в режим чтения на 1 час.`);
});

// ==================== МАГАЗИН И 7 КУНЛИК VIP ====================

bot.hears(/^!?(магазин|shop|донат)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("👑 VIP статус (7 дней) - 50,000 монет", "buy_vip_7")],
    [Markup.button.callback("🏎️ Машина: BMW M5 CS - 100,000 монет", "buy_car")],
    [Markup.button.callback("🏰 Вилла на Пхукете - 500,000 монет", "buy_house")],
    [Markup.button.callback("💼 Бизнес: Нефтяная Вышка - 1,000,000 монет", "buy_biz")]
  ]);

  await ctx.reply(
    `🛒 **МАГАЗИН И УСЛУГИ**\n\n` +
    `💰 Ваш баланс: 🪙 **${u.balance.toLocaleString()} монет**\n\n` +
    `Выберите товар для покупки:`,
    keyboard
  );
});

bot.action("buy_vip_7", async (ctx) => {
  const u = ecoUser(ctx);
  if (u.balance < 50000) return ctx.answerCbQuery("❌ Недостаточно средств! Нужно 50,000 монет.", { show_alert: true });

  u.balance -= 50000;
  u.vip = true;
  u.vipExpires = Date.now() + SERVICE_7_DAYS;

  await ctx.editMessageText(`🎉 **ПОЗДРАВЛЯЕМ!**\nВы успешно приобрели 👑 **VIP статус на 7 дней**!\n\n💰 Остаток: ${u.balance.toLocaleString()} монет`);
});

bot.action("buy_car", async (ctx) => {
  const u = ecoUser(ctx);
  if (u.balance < 100000) return ctx.answerCbQuery("❌ Недостаточно средств!", { show_alert: true });
  u.balance -= 100000;
  u.car = "BMW M5 CS";
  await ctx.editMessageText(`🏎️ Вы успешно купили **BMW M5 CS**!`);
});

bot.action("buy_house", async (ctx) => {
  const u = ecoUser(ctx);
  if (u.balance < 500000) return ctx.answerCbQuery("❌ Недостаточно средств!", { show_alert: true });
  u.balance -= 500000;
  u.house = "Вилла на Пхукете";
  await ctx.editMessageText(`🏰 Вы успешно купили **Виллу на Пхукете**!`);
});

bot.action("buy_biz", async (ctx) => {
  const u = ecoUser(ctx);
  if (u.balance < 1000000) return ctx.answerCbQuery("❌ Недостаточно средств!", { show_alert: true });
  u.balance -= 1000000;
  u.business = "Нефтяная Вышка";
  await ctx.editMessageText(`💼 Вы успешно купили **Бизнес: Нефтяная Вышка**!`);
});

// ==================== СОЗЛАМАЛАР (SETTINGS) ====================

bot.hears(/^!?(настройки|settings|созламалар)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const status = u.notif ? "🔔 Включены" : "🔕 Выключены";
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback(`Уведомления: ${status}`, "toggle_notif")],
    [Markup.button.callback("📜 Инструкция / Обучение", "show_help")]
  ]);

  await ctx.reply(
    `⚙️ **НАСТРОЙКИ ПРОФИЛЯ**\n\n` +
    `👤 Пользователь: ${ecoName(u)}\n` +
    `🆔 ID: \`${u.id}\`\n` +
    `🔔 Уведомления: **${status}**\n\n` +
    `Выберите нужную опцию:`,
    keyboard
  );
});

bot.action("toggle_notif", async (ctx) => {
  const u = ecoUser(ctx);
  u.notif = !u.notif;
  const status = u.notif ? "🔔 Включены" : "🔕 Выключены";
  await ctx.answerCbQuery(`Уведомления: ${status}`);
  await ctx.editMessageReplyMarkup(Markup.inlineKeyboard([
    [Markup.button.callback(`Уведомления: ${status}`, "toggle_notif")],
    [Markup.button.callback("📜 Инструкция / Обучение", "show_help")]
  ]).reply_markup);
});

bot.action("show_help", async (ctx) => {
  await ctx.reply(
    `📖 **ОБУЧЕНИЕ И ИНСТРУКЦИЯ**\n\n` +
    `1. **Заработок:** Используйте команды \`Бонус\` (раз в 24 часа) и \`Работа\` (раз в час).\n` +
    `2. **Трейдинг:** Покупайте BTC дешевле через \`Купить бтц\` и продавайте через \`Продать бтц\`.\n` +
    `3. **Магазин:** Введите \`Магазин\` для покупки VIP статуса на 7 дней, машин и домов.\n` +
    `4. **Игры:** Пишите \`Игры\` для вывода 21 уникальных мини-игр.`
  );
});

// ==================== ИГРЫ И ЭКОНОМИКА ====================

bot.hears(/^!?(бонус|bonus)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastBonus < 86400000) {
    return ctx.reply("⏳ Вы уже получали бонус! Возвращайтесь через 24 часа.");
  }
  const reward = u.vip ? 15000 : 5000;
  u.balance += reward;
  u.lastBonus = now;
  await ctx.reply(`🎁 Вы получили ежедневный бонус: +🪙 **${reward.toLocaleString()} монет**!\n💰 Баланс: ${u.balance.toLocaleString()}`);
});

bot.hears(/^!?(работа|rabota)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastWork < 3600000) {
    return ctx.reply("⏳ Отдохните! Работать можно раз в час.");
  }
  const earned = Math.floor(Math.random() * 4000) + 1000;
  u.balance += earned;
  u.lastWork = now;
  await ctx.reply(`💼 Вы успешно поработали и заработали: +🪙 **${earned.toLocaleString()} монет**!`);
});

bot.hears(/^!?(профиль|profile|баланс)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `👤 **ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ**\n\n` +
    `Имя: ${ecoName(u)}\n` +
    `🆔 ID: \`${u.id}\`\n` +
    `🪙 Кошелек: ${u.balance.toLocaleString()} монет\n` +
    `🏦 Банк: ${u.bank.toLocaleString()} монет\n` +
    `📊 Крипта: ${u.crypto} BTC\n\n` +
    `🏎️ Авто: ${u.car || "Нет"}\n` +
    `🏰 Дом: ${u.house || "Нет"}\n` +
    `💼 Бизнес: ${u.business || "Нет"}`
  );
});

// 21 ТА ИГРА
bot.hears(/^!?(игры|igri)$/i, async (ctx) => {
  await ctx.reply(
    `🎮 **СПИСОК 21 МИНИ-ИГР:**\n\n` +
    `1. \`Мина [ставка]\` - Игра Мина (5x5)\n` +
    `2. \`Пирамида [ставка]\` - Строительство пирамиды\n` +
    `3. \`Бомба [ставка]\` - Разминирование\n` +
    `4. \`Кость [ставка]\` - Игровой кубик\n` +
    `5. \`Дартс [ставка]\` - Бросок в мишень\n` +
    `6. \`Баскетбол [ставка]\` - Бросок в корзину\n` +
    `7. \`Футбол [ставка]\` - Пенальти\n` +
    `8. \`Казино [ставка]\` - Рулетка\n` +
    `9. \`Орел [ставка]\` - Монетка Орел\n` +
    `10. \`Решка [ставка]\` - Монетка Решка\n` +
    `11. \`Дуэль [ставка]\` - Перестрелка\n` +
    `12. \`Угадай [1-5] [ставка]\` - Угадай число\n` +
    `13. \`Сейф [ставка]\` - Взлом сейфа\n` +
    `14. \`Сундук [ставка]\` - Открыть сундук\n` +
    `15. \`Колесо [ставка]\` - Колесо фортуны\n` +
    `16. \`Лотерея [ставка]\` - Купон\n` +
    `17. \`Тир [ставка]\` - Стрельба\n` +
    `18. \`Скачки [ставка]\` - Скачки лошадей\n` +
    `19. \`Крипто [ставка]\` - Ставка на курс\n` +
    `20. \`Блекджек [ставка]\` - Картeжная игра\n` +
    `21. \`Кости2 [ставка]\` - Кости с ботом`
  );
});

// START
bot.command("start", async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `👋 **Приветствуем, ${u.name}!**\n\n` +
    `🤖 **8-A ADMIN & GAME BOT**\n\n` +
    `📌 **Основные команды:**\n` +
    `• \`Профиль\` / \`Баланс\` — Личный кабинет\n` +
    `• \`Магазин\` — Покупка VIP (7 дней), машин, домов\n` +
    `• \`Настройки\` — Настройки профиля и обучение\n` +
    `• \`Бонус\` — Ежедневная награда\n` +
    `• \`Работа\` — Заработать монеты\n` +
    `• \`Игры\` — Список 21 игр`,
    Markup.removeKeyboard()
  );
});

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🔥 Бот успешно запущен и обновлен!");
  } catch (err) {
    console.error(" Ошибка бота:", err);
  }
}

startBot();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
