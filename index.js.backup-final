require("dotenv").config();

const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

const OWNER_ID = 8480297110;

async function owner(ctx) {
  if (!ctx.from) return false;

  // Bot egasi
  if (String(ctx.from.id) === String(OWNER_ID)) {
    return true;
  }

  // Faqat guruhda adminlarni tekshiramiz
  if (
    ctx.chat?.type !== "group" &&
    ctx.chat?.type !== "supergroup"
  ) {
    return false;
  }

  try {
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);

    return admins.some(
      admin => String(admin.user.id) === String(ctx.from.id)
    );
  } catch (error) {
    console.error("ADMIN CHECK ERROR:", error);
    return false;
  }
}

async function isAdmin(ctx) {
  if (owner(ctx)) return true;

  if (
    ctx.chat?.type !== "group" &&
    ctx.chat?.type !== "supergroup"
  ) {
    return false;
  }

  try {
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);

    return admins.some(
      admin => Number(admin.user.id) === Number(ctx.from?.id)
    );
  } catch (error) {
    console.error("ADMIN CHECK ERROR:", error);
    return false;
  }
}

async function requireAdmin(ctx) {
  if (await isAdmin(ctx)) return true;

  await ctx.reply("⛔ Доступ запрещён. Только администраторы группы.");
  return false;
}

// ====================
// !старт
// ====================
bot.hears(/^!?старт$/i, async (ctx) => {
  

  await ctx.reply(
    "🔥 8-A ADMIN BOT 🔥\n\n" +
    "👑 Владелец: СКРЫТ\n" +
    "🛡 Модерация: ВКЛ\n\n" +
    "!панель — Панель администратора\n" +
    "!админы — Администраторы\n" +
    "!бан — Заблокировать пользователя\n" +
    "!разбан — Разблокировать пользователя\n" +
    "!удалить — Удалить сообщение\n" +
    "!мойид — Ваш ID"
  );
});

// ====================
// !мойид
// ====================
bot.hears(/^!?мойид$/i, (ctx) => {
  ctx.reply(`Ваш ID: ${ctx.from.id}`);
});

// ====================
// !панель
// ====================
bot.hears(/^!?панель$/i, async (ctx) => {
  

  await ctx.reply(
    "👑 ПАНЕЛЬ АДМИНИСТРАТОРА\n\n" +
    "🟢 Бот: ОНЛАЙН\n" +
    "🔐 Владелец: СКРЫТ\n" +
    "🛡 Модерация: ВКЛ"
  );
});

// ====================
// !админы
// ====================
bot.hears(/^!?админы$/i, async (ctx) => {
  if (!(await isAdmin(ctx))) {
    return ctx.reply("⛔ Доступ запрещён. Только администраторы группы.");
  }

  if (ctx.chat.type !== "group" && ctx.chat.type !== "supergroup") {
    return ctx.reply("❗ Эту команду нужно использовать в группе.");
  }

  try {
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);

    let text = "👑 АДМИНИСТРАТОРЫ ГРУППЫ\n\n";
    let number = 1;

    for (const admin of admins) {
      const user = admin.user;

      // ВЛАДЕЛЕЦ СКРЫТ
      if (Number(user.id) === OWNER_ID) continue;

      text += `${number}. ${user.first_name || "Пользователь"}`;

      if (user.username) {
        text += ` (@${user.username})`;
      }

      text += "\n";
      number++;
    }

    if (number === 1) {
      text += "Других администраторов нет.";
    }

    await ctx.reply(text);

  } catch (error) {
    console.error("ADMINS ERROR:", error);
    await ctx.reply("❌ Не удалось получить список администраторов.");
  }
});

// ====================
// !бан
// Только REPLY
// ====================
bot.hears(/^!?бан$/i, async (ctx) => {
  if (!(await isAdmin(ctx))) {
    return ctx.reply("⛔ Доступ запрещён. Только администраторы группы.");
  }

  if (ctx.chat.type !== "group" && ctx.chat.type !== "supergroup") {
    return ctx.reply("❗ !бан работает только в группе.");
  }

  const target = ctx.message.reply_to_message;

  if (!target?.from) {
    return ctx.reply(
      "❗ Ответьте на сообщение пользователя и напишите !бан."
    );
  }

  const userId = Number(target.from.id);

  if (userId === OWNER_ID) {
    return ctx.reply("❌ Владелец защищён от блокировки.");
  }

  try {
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);

    const isAdmin = admins.some(
      (admin) => Number(admin.user.id) === userId
    );

    if (isAdmin) {
      return ctx.reply(
        "❌ Нельзя заблокировать администратора группы."
      );
    }

    await ctx.telegram.banChatMember(
      ctx.chat.id,
      userId
    );

    await ctx.reply(
      `🚫 ${target.from.first_name || "Пользователь"} заблокирован.`
    );

  } catch (error) {
    console.error("BAN ERROR:", error);

    await ctx.reply(
      "❌ Не удалось заблокировать пользователя.\n\n" +
      "Проверьте права бота в группе."
    );
  }
});


// ====================
// BAN / !BAN
// ====================

bot.hears(/^!?ban$/i, async (ctx) => {
  if (!(await isAdmin(ctx))) {
    return ctx.reply("⛔ Доступ запрещён. Только администраторы группы.");
  }

  if (
    ctx.chat.type !== "group" &&
    ctx.chat.type !== "supergroup"
  ) {
    return ctx.reply("❗ Эту команду нужно использовать в группе.");
  }

  const target = ctx.message.reply_to_message;

  if (!target?.from) {
    return ctx.reply(
      "❗ Ответьте на сообщение пользователя и напишите ban."
    );
  }

  const userId = Number(target.from.id);

  if (userId === OWNER_ID) {
    return ctx.reply("❌ Владелец защищён от блокировки.");
  }

  try {
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);

    const isTargetAdmin = admins.some(
      admin => Number(admin.user.id) === userId
    );

    if (isTargetAdmin) {
      return ctx.reply("❌ Нельзя заблокировать администратора.");
    }

    await ctx.telegram.banChatMember(
      ctx.chat.id,
      userId
    );

    await ctx.reply(
      `🚫 ${target.from.first_name || "Пользователь"} заблокирован.`
    );

  } catch (error) {
    console.error("BAN ERROR:", error);
    await ctx.reply(
      "❌ Не удалось заблокировать пользователя.\n\n" +
      "Проверьте права бота в группе."
    );
  }
});

// ====================
// !разбан
// Только REPLY
// ====================
bot.hears(/^!?разбан$/i, async (ctx) => {
  if (!(await isAdmin(ctx))) {
    return ctx.reply("⛔ Доступ запрещён. Только администраторы группы.");
  }

  if (ctx.chat.type !== "group" && ctx.chat.type !== "supergroup") {
    return ctx.reply("❗ !разбан работает только в группе.");
  }

  const target = ctx.message.reply_to_message;

  if (!target?.from) {
    return ctx.reply(
      "❗ Ответьте на сообщение пользователя и напишите !разбан."
    );
  }

  try {
    await ctx.telegram.unbanChatMember(
      ctx.chat.id,
      target.from.id,
      {
        only_if_banned: true
      }
    );

    await ctx.reply("✅ Пользователь разблокирован.");

  } catch (error) {
    console.error("UNBAN ERROR:", error);
    await ctx.reply("❌ Не удалось разблокировать пользователя.");
  }
});

// ====================
// !удалить
// Удаляет REPLY-сообщение
// ====================
bot.hears(/^!?удалить$/i, async (ctx) => {
  if (!(await isAdmin(ctx))) {
    return ctx.reply("⛔ Доступ запрещён. Только администраторы группы.");
  }

  if (ctx.chat.type !== "group" && ctx.chat.type !== "supergroup") {
    return ctx.reply("❗ !удалить работает только в группе.");
  }

  const target = ctx.message.reply_to_message;

  if (!target) {
    return ctx.reply(
      "❗ Ответьте на сообщение, которое хотите удалить, и напишите !удалить."
    );
  }

  try {
    await ctx.telegram.deleteMessage(
      ctx.chat.id,
      target.message_id
    );

  } catch (error) {
    console.error("DELETE ERROR:", error);

    await ctx.reply(
      "❌ Не удалось удалить сообщение."
    );
  }
});


// ====================
// МУТ
// Reply + vaqt: мут 10
// ====================

bot.hears(/^!?мут(?:\s+(\d+))?$/i, async (ctx) => {
  if (!(await isAdmin(ctx))) {
    return ctx.reply("⛔ Доступ запрещён. Только администраторы группы.");
  }

  if (ctx.chat.type !== "group" && ctx.chat.type !== "supergroup") {
    return ctx.reply("❗ Эту команду нужно использовать в группе.");
  }

  const target = ctx.message.reply_to_message;

  if (!target?.from) {
    return ctx.reply(
      "❗ Ответьте на сообщение пользователя.\n\n" +
      "Пример: мут 10"
    );
  }

  const userId = Number(target.from.id);

  if (userId === OWNER_ID) {
    return ctx.reply("❌ Владелец защищён.");
  }

  const minutes = Number(ctx.match?.[1] || 10);

  if (minutes < 1 || minutes > 10080) {
    return ctx.reply("❗ Время должно быть от 1 до 10080 минут.");
  }

  try {
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);

    const isAdmin = admins.some(
      admin => Number(admin.user.id) === userId
    );

    if (isAdmin) {
      return ctx.reply("❌ Нельзя замутить администратора.");
    }

    const untilDate = Math.floor(Date.now() / 1000) + minutes * 60;

    await ctx.telegram.restrictChatMember(
      ctx.chat.id,
      userId,
      {
        until_date: untilDate,
        permissions: {
          can_send_messages: false,
          can_send_audios: false,
          can_send_documents: false,
          can_send_photos: false,
          can_send_videos: false,
          can_send_video_notes: false,
          can_send_voice_notes: false,
          can_send_polls: false,
          can_send_other_messages: false,
          can_add_web_page_previews: false,
          can_change_info: false,
          can_invite_users: false,
          can_pin_messages: false
        }
      }
    );

    await ctx.reply(
      `🔇 ${target.from.first_name || "Пользователь"} получил мут на ${minutes} мин.`
    );

  } catch (error) {
    console.error("MUTE ERROR:", error);
    await ctx.reply(
      "❌ Не удалось выдать мут.\n\n" +
      "Проверьте права бота в группе."
    );
  }
});


// ====================
// РАЗМУТ
// ====================

bot.hears(/^!?размут$/i, async (ctx) => {
  if (!(await isAdmin(ctx))) {
    return ctx.reply("⛔ Доступ запрещён. Только администраторы группы.");
  }

  if (ctx.chat.type !== "group" && ctx.chat.type !== "supergroup") {
    return ctx.reply("❗ Эту команду нужно использовать в группе.");
  }

  const target = ctx.message.reply_to_message;

  if (!target?.from) {
    return ctx.reply(
      "❗ Ответьте на сообщение пользователя и напишите размут."
    );
  }

  try {
    await ctx.telegram.restrictChatMember(
      ctx.chat.id,
      target.from.id,
      {
        permissions: {
          can_send_messages: true,
          can_send_audios: true,
          can_send_documents: true,
          can_send_photos: true,
          can_send_videos: true,
          can_send_video_notes: true,
          can_send_voice_notes: true,
          can_send_polls: true,
          can_send_other_messages: true,
          can_add_web_page_previews: true
        }
      }
    );

    await ctx.reply(
      `🔊 ${target.from.first_name || "Пользователь"} размучен.`
    );

  } catch (error) {
    console.error("UNMUTE ERROR:", error);
    await ctx.reply("❌ Не удалось снять мут.");
  }
});


// ====================
// ИНФО
// ====================

bot.hears(/^!?инфо$/i, async (ctx) => {
  if (!(await isAdmin(ctx))) {
    return ctx.reply("⛔ Доступ запрещён. Только администраторы группы.");
  }

  const target = ctx.message.reply_to_message;

  if (!target?.from) {
    return ctx.reply(
      "❗ Ответьте на сообщение пользователя и напишите инфо."
    );
  }

  const user = target.from;

  let text =
    "👤 ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ\n\n" +
    `🆔 ID: ${user.id}\n` +
    `👤 Имя: ${user.first_name || "Не указано"}\n`;

  if (user.last_name) {
    text += `📝 Фамилия: ${user.last_name}\n`;
  }

  if (user.username) {
    text += `🔗 Username: @${user.username}\n`;
  } else {
    text += "🔗 Username: отсутствует\n";
  }

  text += `🤖 Bot: ${user.is_bot ? "Да" : "Нет"}`;

  await ctx.reply(text);
});



// ====================
// АНТИ-МАТ: UZ + RU
// ====================

const badWords = [
  // UZ
  "so'kinish1",
  "so'kinish2",
  "so'kinish3",

  // RU
  "mat1",
  "mat2",
  "mat3"
];

// Matnni tekshirish
function hasBadWord(text) {
  if (!text) return false;

  const normalized = text
    .toLowerCase()
    .replace(/[.,!?;:()[\]{}"'`~*_+=<>/\\|-]/g, " ");

  const words = normalized.split(/\s+/).filter(Boolean);

  return words.some(word => badWords.includes(word));
}

// Anti-mat
bot.on("message", async (ctx, next) => {
  try {
    // Botlar tekshirilmaydi
    if (ctx.from?.is_bot) return next();

    // Faqat guruh
    if (
      ctx.chat?.type !== "group" &&
      ctx.chat?.type !== "supergroup"
    ) {
      return next();
    }

    const text = ctx.message?.text || ctx.message?.caption || "";

    if (!hasBadWord(text)) {
      return next();
    }

    const userId = Number(ctx.from.id);

    // Owner himoyalangan
    if (userId === OWNER_ID) {
      return next();
    }

    // Adminlarga tegmaydi
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);

    const isAdmin = admins.some(
      admin => Number(admin.user.id) === userId
    );

    if (isAdmin) {
      return next();
    }

    // Xabarni o'chirish
    try {
      await ctx.telegram.deleteMessage(
        ctx.chat.id,
        ctx.message.message_id
      );
    } catch (error) {
      console.error("BAD WORD DELETE ERROR:", error);
    }

    // 1 daqiqalik mute
    try {
      const untilDate = Math.floor(Date.now() / 1000) + 60;

      await ctx.telegram.restrictChatMember(
        ctx.chat.id,
        userId,
        {
          until_date: untilDate,
          permissions: {
            can_send_messages: false,
            can_send_audios: false,
            can_send_documents: false,
            can_send_photos: false,
            can_send_videos: false,
            can_send_video_notes: false,
            can_send_voice_notes: false,
            can_send_polls: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false
          }
        }
      );

      await ctx.reply(
        `🔇 ${ctx.from.first_name || "Пользователь"} получил мут на 1 минуту за нарушение правил.`
      );

    } catch (error) {
      console.error("BAD WORD MUTE ERROR:", error);
    }

  } catch (error) {
    console.error("ANTI-MAT ERROR:", error);
  }

  return next();
});

// ====================
// ОШИБКИ
// ====================

// ====================
bot.catch((error) => {
  console.error("BOT ERROR:", error);
});

// ====================
// ЗАПУСК
// ====================



// ===== СТАТИСТИКА ТОП 24 ЧАСА =====
const messageStats = new Map();

bot.on("message", (ctx, next) => {
  // Botlarning xabarlari hisoblanmaydi
  if (ctx.from?.is_bot) return next();

  // Faqat guruhlar
  if (!ctx.chat || ctx.chat.type === "private") {
    return next();
  }

  // Buyruqlar TOP hisobiga kirmaydi
  const text = ctx.message?.text || "";
  const command = text.trim().toLowerCase();

  const commands = [
    "!топ", "топ",
    "!бан", "бан",
    "!разбан", "разбан",
    "!админы", "админы",
    "!удалить", "удалить",
    "!панель", "панель",
    "!старт", "старт",
    "!start", "start",
    "!ban", "ban",
    "!unban", "unban",
    "!admins", "admins",
    "!delete", "delete",
    "!panel", "panel",
    "!мут", "мут", "размут", "!размут",
    "!инфо", "инфо"
  ];

  if (commands.includes(command)) {
    return next();
  }

  const now = Date.now();
  const limit = now - 24 * 60 * 60 * 1000;
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;

  if (!messageStats.has(chatId)) {
    messageStats.set(chatId, new Map());
  }

  const chatStats = messageStats.get(chatId);

  if (!chatStats.has(userId)) {
    chatStats.set(userId, {
      count: 0,
      username: ctx.from.username || null,
      name: ctx.from.first_name || "Пользователь",
      times: []
    });
  }

  const user = chatStats.get(userId);

  user.times.push(now);
  user.times = user.times.filter(t => t >= limit);
  user.count = user.times.length;
  user.username = ctx.from.username || user.username;
  user.name = ctx.from.first_name || user.name;

  return next();
});

// !топ
bot.hears(/^!?топ$/i, async (ctx) => {
  if (!(await isAdmin(ctx))) {
    return ctx.reply("⛔ Доступ запрещён. Только администраторы группы.");
  }

  if (ctx.chat.type === "private") {
    return ctx.reply("❗ Команда работает только в группе.");
  }

  const chatStats = messageStats.get(ctx.chat.id);

  if (!chatStats || chatStats.size === 0) {
    return ctx.reply("📊 За последние 24 часа сообщений пока нет.");
  }

  const now = Date.now();
  const limit = now - 24 * 60 * 60 * 1000;
  const top = [];

  for (const [userId, user] of chatStats) {
    user.times = user.times.filter(t => t >= limit);
    user.count = user.times.length;

    if (user.count > 0) {
      top.push({
        id: userId,
        count: user.count,
        username: user.username,
        name: user.name
      });
    }
  }

  top.sort((a, b) => b.count - a.count);

  let text = "🏆 ТОП ЗА 24 ЧАСА\n\n";

  top.slice(0, 10).forEach((user, i) => {
    const name = user.username
      ? `@${user.username}`
      : user.name;

    text += `${i + 1}. ${name} — ${user.count} сообщений\n`;
  });

  await ctx.reply(text);
});



// ===== MAT FILTRI =====

bot.launch();

console.log("🔥 8-A Admin Bot запущен!");
console.log("👑 OWNER ID:", OWNER_ID);
