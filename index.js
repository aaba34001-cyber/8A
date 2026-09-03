require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("❌ CRITICAL ERROR: BOT_TOKEN is missing!");
  process.exit(1);
}

const bot = new Telegraf(token);
const OWNER_ID = Number(process.env.OWNER_ID || 8480297110);

const economyUsers = new Map();
const activeMinesGames = new Map();
const activePyramidGames = new Map();

const VIP_LEVELS = {
  1: { name: "VIP Bronze 🥉", price: 5000000, bonusMult: 1.1, workMult: 1.1 },
  2: { name: "VIP Silver 🥈", price: 25000000, bonusMult: 1.25, workMult: 1.25 },
  3: { name: "VIP Gold 🥇", price: 100000000, bonusMult: 1.5, workMult: 1.5 },
  4: { name: "VIP Platinum 💎", price: 500000000, bonusMult: 2.0, workMult: 2.0 },
  5: { name: "VIP DIAMOND 👑", price: 3000000000, bonusMult: 3.0, workMult: 3.0 }
};

function ecoUser(ctx) {
  const id = String(ctx.from.id);
  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id: ctx.from.id,
      name: ctx.from.first_name || "Игрок",
      username: ctx.from.username || null,
      balance: 10000,
      bank: 0,
      vip: 0,
      business: "Отсутствует",
      car: "Отсутствует"
    });
  }
  return economyUsers.get(id);
}

function ecoName(u) {
  return u.username ? `@${u.username}` : u.name;
}

// ==================== ADMIN & MODERATSIYA (KIK, BAN, RAZBAN) ====================

bot.hears(/^(кик|kik|kick)$/i, async (ctx) => {
  if (!ctx.message.reply_to_message) return ctx.reply("❌ Ответьте (reply) на сообщение пользователя, которого хотите кикнуть!");
  try {
    const target = ctx.message.reply_to_message.from;
    await ctx.banChatMember(target.id);
    await ctx.unbanChatMember(target.id);
    await ctx.reply(`🚪 Пользователь **${target.first_name}** был кикнут из группы.`);
  } catch (e) {
    ctx.reply("❌ Ошибка при кике! Убедитесь, что бот является администратором.");
  }
});

bot.hears(/^(бан|ban)$/i, async (ctx) => {
  if (!ctx.message.reply_to_message) return ctx.reply("❌ Ответьте (reply) на сообщение пользователя, которого хотите забанить!");
  try {
    const target = ctx.message.reply_to_message.from;
    await ctx.banChatMember(target.id);
    await ctx.reply(`🚫 Пользователь **${target.first_name}** был забанен.`);
  } catch (e) {
    ctx.reply("❌ Ошибка при бане!");
  }
});

bot.hears(/^(разбан|unban)$/i, async (ctx) => {
  if (!ctx.message.reply_to_message) return ctx.reply("❌ Ответьте (reply) на сообщение пользователя для разбана!");
  try {
    const target = ctx.message.reply_to_message.from;
    await ctx.unbanChatMember(target.id);
    await ctx.reply(`✅ Пользователь **${target.first_name}** разбанен.`);
  } catch (e) {
    ctx.reply("❌ Ошибка при разбане!");
  }
});

// ==================== CRASH (КРАШ) O'YINI ====================

bot.hears(/^(краш|crash|krash) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);

  if (!bet || bet < 100) return ctx.reply("❌ Мин. ставка: 100!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;

  const isCrash = Math.random() < 0.45;
  if (isCrash) {
    const crashPoint = (Math.random() * 0.8 + 1.0).toFixed(2);
    return ctx.reply(`📈 **CRASH GAME**\n\n💥 График график упал на **x${crashPoint}**!\n📉 Вы потеряли **-${bet.toLocaleString()} монет**.`);
  } else {
    const winMult = (Math.random() * 3.5 + 1.2).toFixed(2);
    const winAmount = Math.floor(bet * winMult);
    u.balance += winAmount;
    return ctx.reply(`📈 **CRASH GAME**\n\n🚀 Ракета улетела до **x${winMult}**!\n🎉 Вы успели забрать **+${winAmount.toLocaleString()} монет**!`);
  }
});

// ==================== PIRAMIDA (2x2 FORMAT) ====================

bot.hears(/^(пирамида|pyramid|piramida) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);

  if (!bet || bet < 100) return ctx.reply("❌ Мин. ставка: 100!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;
  const userId = ctx.from.id;

  activePyramidGames.set(userId, {
    bet,
    level: 1,
    mults: [1.8, 3.2, 6.0, 12.0],
    trap: Math.floor(Math.random() * 2) // 2 ta katakdan 1 tasi mina
  });

  await renderPyramid2x2(ctx, userId);
});

async function renderPyramid2x2(ctx, userId) {
  const g = activePyramidGames.get(userId);
  if (!g) return;

  const buttons = [
    [
      Markup.button.callback("❓ 1", "pyr2_0"),
      Markup.button.callback("❓ 2", "pyr2_1")
    ]
  ];

  const curWin = Math.floor(g.bet * (g.level === 1 ? 1 : g.mults[g.level - 2]));
  if (g.level > 1) {
    buttons.push([Markup.button.callback(`💰 Забрать (${curWin.toLocaleString()})`, "pyr2_take")]);
  }

  const text = `🔺 **ПИРАМИДА 2x2 (Уровень ${g.level}/4)**\n\n🎯 Коэффициент: **x${g.mults[g.level - 1]}**\n💵 Текущий выигрыш: **${curWin.toLocaleString()} монет**\n\nВыберите 1 из 2 клеток:`;

  if (ctx.callbackQuery) await ctx.editMessageText(text, Markup.inlineKeyboard(buttons));
  else await ctx.reply(text, Markup.inlineKeyboard(buttons));
}

bot.action(/^pyr2_(\d+)$/, async (ctx) => {
  const userId = ctx.from.id;
  const g = activePyramidGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ Игра завершена!", { show_alert: true });

  const choice = Number(ctx.match[1]);

  if (choice === g.trap) {
    activePyramidGames.delete(userId);
    return ctx.editMessageText(`💥 **ОШИБКА!** Вы выбрали мину и потеряли **${g.bet.toLocaleString()} монет**.`);
  }

  if (g.level >= 4) {
    const win = Math.floor(g.bet * g.mults[3]);
    ecoUser(ctx).balance += win;
    activePyramidGames.delete(userId);
    return ctx.editMessageText(`🏆 **ПОБЕДА!** Вы прошли пирамиду 2x2 и выиграли **${win.toLocaleString()} монет**!`);
  }

  g.level += 1;
  g.trap = Math.floor(Math.random() * 2);
  await renderPyramid2x2(ctx, userId);
});

bot.action("pyr2_take", async (ctx) => {
  const userId = ctx.from.id;
  const g = activePyramidGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ Игра завершена!", { show_alert: true });

  const win = Math.floor(g.bet * g.mults[g.level - 2]);
  ecoUser(ctx).balance += win;
  activePyramidGames.delete(userId);
  await ctx.editMessageText(`🤑 **ВЫИГРЫШ ЗАБРАН!** Вы выиграли **${win.toLocaleString()} монет**!`);
});

// ==================== BOGATIE / TOP / MENU / START ====================

bot.hears(/^(богатые|богачи|топ|top|boylar)$/i, async (ctx) => {
  if (economyUsers.size === 0) return ctx.reply("📊 Список пока пуст!");

  const usersArr = Array.from(economyUsers.values());
  usersArr.sort((a, b) => (b.balance + b.bank) - (a.balance + a.bank));

  const top10 = usersArr.slice(0, 10);
  let text = `🏆 **ТОП-10 САМЫХ БОГАТЫХ ИГРОКОВ**\n\n`;
  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

  top10.forEach((u, index) => {
    const total = u.balance + u.bank;
    text += `${medals[index]} **${ecoName(u)}** — **${total.toLocaleString()} монет**\n`;
  });

  await ctx.reply(text);
});

bot.hears(/^(игры|games|правила|qoidalar|menu|o'yinlar|меню)$/i, async (ctx) => {
  await ctx.reply(
    `📜 **СПИСОК ИГР И ИНСТРУКЦИЯ**\n\n` +
    `🚀 **Краш:** \`краш [ставка]\` — игра на множитель ракетой.\n` +
    `🔺 **Пирамида (2x2):** \`пирамида [ставка]\` — выбор 1 из 2 клеток.\n` +
    `💣 **Мины (7x7):** \`мина [ставка]\` — поле с бомбами.\n` +
    `🎰 **Классика:** \`казино\`, \`слоты\`, \`кубик\`, \`монетка\`, \`трейдинг\`.\n\n` +
    `🛡️ **Админ Команды:** \`кик\`, \`бан\`, \`разбан\` (в ответ на сообщение)\n` +
    `💼 **Прочее:** \`баланс\`, \`профиль\`, \`богатые\`, \`донат\`, \`вывод\``
  );
});

bot.command("start", async (ctx) => {
  await ctx.reply("🔥 Бот онлайн! Введите `игры` или `меню`.");
});

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🚀 BOT HAS STARTED!");
  } catch (err) {
    console.error("Start Error:", err);
  }
}

startBot();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
