require("dotenv").config();
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);
const OWNER_ID = Number(process.env.OWNER_ID || 8480297110);

function isGroup(ctx) {
  return ctx.chat && (ctx.chat.type === "group" || ctx.chat.type === "supergroup");
}

async function isAdmin(ctx) {
  if (!ctx.from) return false;
  if (Number(ctx.from.id) === OWNER_ID) return true;
  if (!isGroup(ctx)) return false;

  try {
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);
    return admins.some((admin) => Number(admin.user.id) === Number(ctx.from.id));
  } catch (error) {
    return false;
  }
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
const ECO_TASK_CD = 30 * 60 * 1000;

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
      lastTask: 0,
      vip: null
    });
  }
  const user = economyUsers.get(id);
  user.name = ctx.from.first_name || user.name;
  if (ctx.from.username) user.username = ctx.from.username;
  return user;
}

function ecoName(user) {
  return user.username ? `@${user.username}` : user.name;
}

function ecoTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h} ч. ${m} мин.`;
}

bot.hears(/^!?(богатые|богачи)$/i, async (ctx) => {
  const currentUser = ecoUser(ctx);
  if (currentUser.balance === ECO_START && currentUser.bank === 0) {
    currentUser.balance += 500; // Автоматический бонус для теста
  }

  const sorted = Array.from(economyUsers.values())
    .map(u => ({ ...u, total: u.balance + u.bank }))
    .sort((a, b) => b.total - a.total);

  let text = "💎 **ТОП БОГАТЫХ УЧАСТНИКОВ**\n\n";
  sorted.slice(0, 10).forEach((u, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    text += `${medal} ${ecoName(u)} — 🪙 ${u.total}\n`;
  });

  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^!?баланс$/iu, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `💰 ВАШ БАЛАНС\n\n👤 ${ecoName(u)}\n🪙 Кошелёк: ${u.balance}\n🏦 Банк: ${u.bank}\n💎 Всего: ${u.balance + u.bank}`
  );
});

bot.hears(/^!?бонус$/iu, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();

  if (now - u.lastBonus < ECO_BONUS_CD) {
    const left = ECO_BONUS_CD - (now - u.lastBonus);
    return ctx.reply(`⏳ Бонус уже получен.\nСледующий бонус через: ${ecoTime(left)}`);
  }

  u.balance += ECO_BONUS;
  u.lastBonus = now;
  await ctx.reply(`🎁 БОНУС ПОЛУЧЕН!\n\n🪙 +${ECO_BONUS} монет\n💰 Баланс: ${u.balance}`);
});

bot.hears(/^!?работа$/iu, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();

  if (now - u.lastWork < ECO_WORK_CD) {
    const left = ECO_WORK_CD - (now - u.lastWork);
    return ctx.reply(`⏳ Вы уже работали.\nСледующая работа через: ${ecoTime(left)}`);
  }

  const reward = Math.floor(Math.random() * 451) + 50;
  u.balance += reward;
  u.lastWork = now;
  await ctx.reply(`💼 ВЫ ПОРАБОТАЛИ!\n\n🪙 Заработано: +${reward}\n💰 Баланс: ${u.balance}`);
});

bot.hears(/^!?админы$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  if (!isGroup(ctx)) return ctx.reply("❗ Эту команду нужно использовать в группе.");

  try {
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);
    let text = "👑 АДМИНИСТРАТОРЫ ГРУППЫ\n\n";
    let number = 1;
    for (const admin of admins) {
      text += `${number}. ${admin.user.first_name || "Пользователь"}`;
      if (admin.user.username) text += ` (@${admin.user.username})`;
      text += "\n";
      number++;
    }
    await ctx.reply(text);
  } catch (error) {
    await ctx.reply("❌ Не удалось получить список администраторов.");
  }
});

bot.catch((error) => {
  console.error("BOT ERROR:", error);
});

bot.launch();
console.log("🔥 8-A Admin Bot запущен!");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
