require("dotenv").config();
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);
const OWNER_ID = Number(process.env.OWNER_ID || 8480297110);
const EXTRA_ADMINS = ["man_mass", "man_admin", "man_adminn"];

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

async function requireAdmin(ctx) {
  if (!(await isAdmin(ctx))) {
    await ctx.reply("⛔ Доступ запрещён. Только администраторы группы.");
    return false;
  }
  return true;
}

const messageStats = new Map();
const economyUsers = new Map();
const ECO_START = 100;
const ECO_BONUS = 500;
const ECO_BONUS_CD = 24 * 60 * 60 * 1000;
const ECO_WORK_CD = 60 * 60 * 1000;

function ecoUser(ctx) {
  const id = String(ctx.from.id);
  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id: ctx.from.id,
      name: ctx.from.first_name || "Пользователь",
      username: ctx.from.username || null,
      balance: ECO_START,
      bank: 0,
      lastBonus: 0,
      lastWork: 0,
      vip: false,
      bankLimitUnlocked: false,
      title: null
    });
  }
  const user = economyUsers.get(id);
  user.name = ctx.from.first_name || user.name;
  if (ctx.from.username) {
    user.username = ctx.from.username;
    if (EXTRA_ADMINS.includes(ctx.from.username.toLowerCase()) && !user.adminBonusGiven) {
      user.balance += 50000;
      user.vip = true;
      user.bankLimitUnlocked = true;
      user.adminBonusGiven = true;
    }
  }
  return user;
}

function ecoName(user) {
  const prefix = user.title ? `[${user.title}] ` : "";
  const nameStr = user.username ? `@${user.username}` : user.name;
  return `${prefix}${nameStr}${user.vip ? " 👑VIP" : ""}`;
}

// 🗑️ ХАБАРНИ ЎЧИРИШ (!удалить / !дел)
bot.hears(/^!?(удалить|дел|del)$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const replyMsg = ctx.message.reply_to_message;
  if (!replyMsg) return ctx.reply("⚠️ Ответьте на сообщение, которое нужно удалить.");

  try {
    await ctx.deleteMessage(replyMsg.message_id);
    await ctx.deleteMessage(ctx.message.message_id);
  } catch (err) {
    await ctx.reply("❌ Не удалось удалить сообщение. Проверьте права бота.");
  }
});

// 🚫 БАН
bot.hears(/^!?(бан|ban)$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const replyMsg = ctx.message.reply_to_message;
  if (!replyMsg || !replyMsg.from) return ctx.reply("⚠️ Ответьте на сообщение пользователя для бана.");

  if (isImmune(replyMsg.from.id, replyMsg.from.username)) {
    return ctx.reply("🛡️ Этот пользователь защищен системным иммунитетом!");
  }

  try {
    await ctx.banChatMember(replyMsg.from.id);
    await ctx.reply(`🚫 Пользователь ${replyMsg.from.first_name} забанен.`);
  } catch (err) {
    await ctx.reply("❌ Не удалось забанить пользователя.");
  }
});

// 👞 КИК
bot.hears(/^!?(кик|kick)$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const replyMsg = ctx.message.reply_to_message;
  if (!replyMsg || !replyMsg.from) return ctx.reply("⚠️ Ответьте на сообщение пользователя для кика.");

  if (isImmune(replyMsg.from.id, replyMsg.from.username)) {
    return ctx.reply("🛡️ Этот пользователь защищен системным иммунитетом!");
  }

  try {
    await ctx.banChatMember(replyMsg.from.id);
    await ctx.unbanChatMember(replyMsg.from.id);
    await ctx.reply(`👞 Пользователь ${replyMsg.from.first_name} кикнут из группы.`);
  } catch (err) {
    await ctx.reply("❌ Не удалось кикнуть пользователя.");
  }
});

// 🔇 МУТ
bot.hears(/^!?(мут|mute)(?:\s+(\d+))?$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const replyMsg = ctx.message.reply_to_message;
  if (!replyMsg || !replyMsg.from) return ctx.reply("⚠️ Ответьте на сообщение пользователя для мута.");

  if (isImmune(replyMsg.from.id, replyMsg.from.username)) {
    return ctx.reply("🛡️ Этот пользователь защищен системным иммунитетом!");
  }

  const minutes = Number(ctx.match[2]) || 60;
  const untilDate = Math.floor(Date.now() / 1000) + minutes * 60;

  try {
    await ctx.restrictChatMember(replyMsg.from.id, {
      until_date: untilDate,
      permissions: { can_send_messages: false }
    });
    await ctx.reply(`🔇 Пользователь ${replyMsg.from.first_name} замучен на ${minutes} минут.`);
  } catch (err) {
    await ctx.reply("❌ Не удалось замутить пользователя.");
  }
});

// 👑 АДМИНЛАР РЎЙХАТИ
bot.hears(/^!?(админы|админлар)$/i, async (ctx) => {
  if (!isGroup(ctx)) return ctx.reply("⚠️ Эта команда работает только в группах.");
  try {
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);
    let text = "👑 **СПИСОК АДМИНИСТРАТОРОВ:**\n\n";
    admins.forEach((a, i) => {
      text += `${i + 1}. ${a.user.first_name} (${a.user.username ? "@" + a.user.username : "без юзернейма"})\n`;
    });
    await ctx.reply(text);
  } catch (err) {
    await ctx.reply("❌ Ошибка при получении списка администраторов.");
  }
});

// 📊 ТОП АКТИВНЫХ (Сообщения)
bot.hears(/^!?(топ|статистика)$/i, async (ctx) => {
  if (!isGroup(ctx)) return ctx.reply("⚠️ Эта команда работает только в группах.");
  const chatId = ctx.chat.id;
  const chatStats = messageStats.get(chatId);

  if (!chatStats || chatStats.size === 0) {
    return ctx.reply("📊 Статистика сообщений пока пуста.");
  }

  const sorted = Array.from(chatStats.values())
    .map(u => ({ ...u, count: u.times.length }))
    .sort((a, b) => b.count - a.count);

  let text = "📊 **ТОП АКТИВНЫХ УЧАСТНИКОВ (ЗА 24Ч):**\n\n";
  sorted.slice(0, 10).forEach((u, i) => {
    text += `${i + 1}. ${u.name} — **${u.count}** сообщ.\n`;
  });
  await ctx.reply(text);
});

// 🎁 ХАЛЯВА
bot.hears(/^!?халям$/i, async (ctx) => {
  const u = ecoUser(ctx);
  u.balance += 100000;
  u.vip = true;
  u.bankLimitUnlocked = true;

  await ctx.reply(
    `🎁 **ХАЛЯВА ПОЛУЧЕНА!**\n\n` +
    `👤 Пользователь: ${ecoName(u)}\n` +
    `🪙 Добавлено: **+100,000 монет**\n` +
    `👑 **VIP Статус:** Активирован!\n` +
    `🏦 **Лимит банка:** Снят!`
  );
});

// 🛒 МАГАЗИН И ПОКУПКА
bot.hears(/^!?(магазин|дўкон)[\.\s]*$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `🛒 **МАГАЗИН ТОВАРОВ И УСЛУГ**\n\n` +
    `1. 👑 **VIP Статус** — 🪙 5000 монет\n` +
    `2. 🏦 **Снять ограничения банка** — 🪙 3000 монет\n` +
    `3. 🎨 **Кастомный титул** — 🪙 2000 монет\n\n` +
    `💡 *Чтобы купить, используйте команду: Купить [номер]*\n` +
    `💰 Ваш баланс: 🪙 ${u.balance}`
  );
});

bot.hears(/^!?купить(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const itemNum = Number(ctx.match[1]);
  if (!itemNum) return ctx.reply("🛒 Укажите номер товара: Купить 1");

  if (itemNum === 1) {
    if (u.vip) return ctx.reply("👑 У вас уже есть VIP статус!");
    if (u.balance < 5000) return ctx.reply(`❌ Недостаточно монет. Баланс: 🪙 ${u.balance}`);
    u.balance -= 5000; u.vip = true; 
    return ctx.reply(`🎉 Вы успешно приобрели 👑 VIP Статус!`);
  } else if (itemNum === 2) {
    if (u.bankLimitUnlocked) return ctx.reply("🏦 Лимит банка уже снят!");
    if (u.balance < 3000) return ctx.reply(`❌ Недостаточно монет. Баланс: 🪙 ${u.balance}`);
    u.balance -= 3000; u.bankLimitUnlocked = true;
    return ctx.reply(`🎉 Вы успешно сняли ограничения банка!`);
  } else if (itemNum === 3) {
    if (u.balance < 2000) return ctx.reply(`❌ Недостаточно монет. Баланс: 🪙 ${u.balance}`);
    u.balance -= 2000; u.title = u.title || "Игрок";
    return ctx.reply(`🎉 Вы приобрели Кастомный титул! Теперь установите его: Титул [ваш_текст]`);
  } else {
    return ctx.reply("❌ Товар с таким номером не найден.");
  }
});

bot.hears(/^!?титул(?:\s+(.+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const newTitle = ctx.match[1];
  if (!u.title) return ctx.reply("❌ Купите титул в магазине (Купить 3).");
  if (!newTitle) return ctx.reply("✍️ Использование: Титул [текст]");
  u.title = newTitle.trim();
  await ctx.reply(`✅ Ваш новый титул: **[${u.title}]**`);
});

bot.hears(/^!?(старт|помощь|инфо)$/i, async (ctx) => { 
  await ctx.reply(
    `🔥 **8-A ADMIN BOT** 🔥\n\n` +
    `📌 **Основные команды:**\n` +
    `• \`Игры\` — список 20 игр\n` +
    `• \`Профиль\` / \`Баланс\` — личный кабинет\n` +
    `• \`Банк\` / \`Магазин\` / \`Богатые\` — экономика\n` +
    `• \`Бонус\` / \`Работа\` — заработок монет\n` +
    `• \`Топ\` / \`Статистика\` — активность в группе\n` +
    `• \`Админы\` — список администрации\n` +
    `• \`Мойид\` — узнать свой ID`
  ); 
});

bot.hears(/^!?мойид$/i, async (ctx) => { await ctx.reply(`🆔 Ваш ID: \`${ctx.from.id}\``); });
bot.hears(/^!?правила$/i, async (ctx) => { await ctx.reply("📜 **ПРАВИЛА ГРУППЫ:**\n1. Без оскорблений.\n2. Без спама и рекламы."); });

bot.on("message", async (ctx, next) => {
  try {
    if (!ctx.from || ctx.from.is_bot || !isGroup(ctx)) return next();
    const now = Date.now();
    const limit = now - 24 * 60 * 60 * 1000;
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;

    if (!messageStats.has(chatId)) messageStats.set(chatId, new Map());
    const chatStats = messageStats.get(chatId);

    if (!chatStats.has(userId)) {
      chatStats.set(userId, { times: [], username: ctx.from.username || null, name: ctx.from.first_name || "Пользователь" });
    }

    const user = chatStats.get(userId);
    user.times.push(now);
    user.times = user.times.filter((time) => time >= limit);
    user.username = ctx.from.username || user.username;
    user.name = ctx.from.first_name || user.name;
  } catch (error) {}
  return next();
});

bot.catch((error) => console.error("BOT ERROR:", error));
bot.launch();
console.log("🔥 Bot started!");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
