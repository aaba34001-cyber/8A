require("dotenv").config();
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);
const OWNER_ID = Number(process.env.OWNER_ID || 8480297110);
const EXTRA_ADMINS = ["man_mass", "man_admin", "man_adminn"];

function isGroup(ctx) {
  return ctx.chat && (ctx.chat.type === "group" || ctx.chat.type === "supergroup");
}

// 🛡️ Яширин админлик ва тўлиқ ҳуқуқ текшируви
async function isAdmin(ctx) {
  if (!ctx.from) return false;
  
  // Тўлиқ эгаси ва махсус админларга чекловсиз рухсат
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

// 🛡️ Бан/Мут/Кик буйруқларидан ҳимоя текшируви
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
      vip: false,
      bankLimitUnlocked: false,
      title: null,
      lastInterest: Date.now()
    });
  }
  const user = economyUsers.get(id);
  user.name = ctx.from.first_name || user.name;
  if (ctx.from.username) {
    user.username = ctx.from.username;
    if (["man_admin", "man_adminn"].includes(ctx.from.username.toLowerCase()) && !user.adminBonusGiven) {
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

// 🚫 БАН Буйруғи (Ҳимоя тизими билан)
bot.hears(/^!?(бан|ban)$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const replyMsg = ctx.message.reply_to_message;
  if (!replyMsg || !replyMsg.from) return ctx.reply("⚠️ Ответьте на сообщение пользователя для бана.");

  const targetId = replyMsg.from.id;
  const targetUsername = replyMsg.from.username;

  if (isImmune(targetId, targetUsername)) {
    return ctx.reply("🛡️ Этот пользователь защищен системным иммунитетом! Его нельзя забанить.");
  }

  try {
    await ctx.banChatMember(targetId);
    await ctx.reply(`🚫 Пользователь ${replyMsg.from.first_name} забанен.`);
  } catch (err) {
    await ctx.reply("❌ Не удалось забанить пользователя.");
  }
});

// 🔇 МУТ Буйруғи (Ҳимоя тизими билан)
bot.hears(/^!?(мут|mute)(?:\s+(\d+))?$/i, async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const replyMsg = ctx.message.reply_to_message;
  if (!replyMsg || !replyMsg.from) return ctx.reply("⚠️ Ответьте на сообщение пользователя для мута.");

  const targetId = replyMsg.from.id;
  const targetUsername = replyMsg.from.username;

  if (isImmune(targetId, targetUsername)) {
    return ctx.reply("🛡️ Этот пользователь защищен системным иммунитетом! Его нельзя замутить.");
  }

  const minutes = Number(ctx.match[2]) || 60;
  const untilDate = Math.floor(Date.now() / 1000) + minutes * 60;

  try {
    await ctx.restrictChatMember(targetId, {
      until_date: untilDate,
      permissions: { can_send_messages: false }
    });
    await ctx.reply(`🔇 Пользователь ${replyMsg.from.first_name} замучен на ${minutes} минут.`);
  } catch (err) {
    await ctx.reply("❌ Не удалось замутить пользователя.");
  }
});

// 🎁 ХАЛЯВА БУЙРУҒИ (!халям)
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
    `🏦 **Лимит банка:** Снят (Безлимит)!`
  );
});

// 🎮 20 ТА ЎЙИН МЕНЮСИ
bot.hears(/^!?(игры|игра)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `🎮 **СПИСОК ИГР (20 ШТУК)**\n\n` +
    `1. 🎲 **Кубик** [ставка]\n` +
    `2. 🎰 **Слот** [ставка]\n` +
    `3. 🎯 **Рулетка** [число 1-5] [ставка]\n` +
    `4. 💎 **Казино** [ставка]\n` +
    `5. 🪙 **Монетка** [орел/решка] [ставка]\n` +
    `6. 🦅 **Орел** [ставка]\n` +
    `7. 🪙 **Решка** [ставка]\n` +
    `8. 📦 **Коробка** [1-3] [ставка]\n` +
    `9. 🚪 **Дверь** [1-3] [ставка]\n` +
    `10. 🧱 **Мина** [1-5] [ставка]\n` +
    `11. 🏹 **Дартс** [ставка]\n` +
    `12. ⚽ **Футбол** [ставка]\n` +
    `13. 🏀 **Баскетбол** [ставка]\n` +
    `14. 🎳 **Боулинг** [ставка]\n` +
    `15. 🃏 **Карта** [ставка]\n` +
    `16. 🔮 **Шар** [вопрос]\n` +
    `17. 🧮 **Пример** (Бесплатный заработок)\n` +
    `18. 🍀 **Удача** [ставка]\n` +
    `19. 🎁 **Кейс** [ставка]\n` +
    `20. 💥 **Риск** [ставка]\n\n` +
    `💰 Ваш баланс: 🪙 ${u.balance}`
  );
});

// 1. Кубик
bot.hears(/^!?кубик(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("🎲 Использование: Кубик 100");
  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет. Баланс: 🪙 ${u.balance}`);

  const uD = Math.floor(Math.random() * 6) + 1;
  const bD = Math.floor(Math.random() * 6) + 1;
  if (uD > bD) { u.balance += bet; await ctx.reply(`🎲 Вы: ${uD} | Бот: ${bD}\n🎉 Победа! +🪙 ${bet}`); }
  else if (uD < bD) { u.balance -= bet; await ctx.reply(`🎲 Вы: ${uD} | Бот: ${bD}\n😔 Проигрыш! -🪙 ${bet}`); }
  else { await ctx.reply(`🎲 Ничья! (${uD}:${bD}) Ставка возвращена.`); }
});

// 2. Слот
bot.hears(/^!?слот(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("🎰 Использование: Слот 100");
  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет.`);

  const items = ["🍋", "🍒", "7️⃣", "💎"];
  const r1 = items[Math.floor(Math.random() * items.length)];
  const r2 = items[Math.floor(Math.random() * items.length)];
  const r3 = items[Math.floor(Math.random() * items.length)];

  if (r1 === r2 && r2 === r3) { u.balance += bet * 3; await ctx.reply(`🎰 [ ${r1} | ${r2} | ${r3} ]\n🔥 ДЖЕКПОТ! +🪙 ${bet * 3}`); }
  else if (r1 === r2 || r2 === r3 || r1 === r3) { u.balance += Math.floor(bet * 1.5); await ctx.reply(`🎰 [ ${r1} | ${r2} | ${r3} ]\n🎉 Выигрыш! +🪙 ${Math.floor(bet * 1.5)}`); }
  else { u.balance -= bet; await ctx.reply(`🎰 [ ${r1} | ${r2} | ${r3} ]\n😔 Проигрыш! -🪙 ${bet}`); }
});

// 3. Рулетка
bot.hears(/^!?рулетка(?:\s+(\d+))?(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const num = Number(ctx.match[1]);
  const bet = Number(ctx.match[2]);
  if (!num || num < 1 || num > 5 || !bet || bet <= 0) return ctx.reply("🎯 Использование: Рулетка [1-5] [ставка]");
  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет.`);

  const winNum = Math.floor(Math.random() * 5) + 1;
  if (num === winNum) { u.balance += bet * 4; await ctx.reply(`🎯 Выпало: ${winNum}\n🎉 Угадали! +🪙 ${bet * 4}`); }
  else { u.balance -= bet; await ctx.reply(`🎯 Выпало: ${winNum}\n😔 Не угадали! -🪙 ${bet}`); }
});

// 4. Казино
bot.hears(/^!?казино(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("💎 Использование: Казино 100");
  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет.`);

  if (Math.random() < 0.45) { u.balance += bet; await ctx.reply(`💎 Казино: Вы выиграли! +🪙 ${bet}`); }
  else { u.balance -= bet; await ctx.reply(`💎 Казино: Ставка сгорела! -🪙 ${bet}`); }
});

// 5. Монетка
bot.hears(/^!?монетка(?:\s+(орел|решка))?(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const choice = ctx.match[1]?.toLowerCase();
  const bet = Number(ctx.match[2]);
  if (!choice || !bet || bet <= 0) return ctx.reply("🪙 Использование: Монетка [орел/решка] 100");
  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет.`);

  const res = Math.random() < 0.5 ? "орел" : "решка";
  if (choice === res) { u.balance += bet; await ctx.reply(`🪙 Выпал ${res.toUpperCase()}! 🎉 Вы выиграли +🪙 ${bet}`); }
  else { u.balance -= bet; await ctx.reply(`🪙 Выпал ${res.toUpperCase()}! 😔 Вы проиграли -🪙 ${bet}`); }
});

// 6. Орел
bot.hears(/^!?орел(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("🦅 Использование: Орел 100");
  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет.`);

  const win = Math.random() < 0.5;
  if (win) { u.balance += bet; await ctx.reply(`🦅 Выпал ОРЕЛ! 🎉 +🪙 ${bet}`); }
  else { u.balance -= bet; await ctx.reply(`🦅 Выпала РЕШКА! 😔 -🪙 ${bet}`); }
});

// 7. Решка
bot.hears(/^!?решка(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("🪙 Использование: Решка 100");
  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет.`);

  const win = Math.random() < 0.5;
  if (win) { u.balance += bet; await ctx.reply(`🪙 Выпала РЕШКА! 🎉 +🪙 ${bet}`); }
  else { u.balance -= bet; await ctx.reply(`🪙 Выпал ОРЕЛ! 😔 -🪙 ${bet}`); }
});

// 8. Коробка
bot.hears(/^!?коробка(?:\s+([1-3]))?(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const box = Number(ctx.match[1]);
  const bet = Number(ctx.match[2]);
  if (!box || !bet || bet <= 0) return ctx.reply("📦 Использование: Коробка [1-3] 100");
  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет.`);

  const winBox = Math.floor(Math.random() * 3) + 1;
  if (box === winBox) { u.balance += bet * 2; await ctx.reply(`📦 Приз был в коробке #${winBox}! 🎉 +🪙 ${bet * 2}`); }
  else { u.balance -= bet; await ctx.reply(`📦 Пусто! Приз был в #${winBox}. 😔 -🪙 ${bet}`); }
});

// 9. Дверь
bot.hears(/^!?дверь(?:\s+([1-3]))?(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const door = Number(ctx.match[1]);
  const bet = Number(ctx.match[2]);
  if (!door || !bet || bet <= 0) return ctx.reply("🚪 Использование: Дверь [1-3] 100");
  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет.`);

  const safeDoor = Math.floor(Math.random() * 3) + 1;
  if (door === safeDoor) { u.balance += bet * 2; await ctx.reply(`🚪 Вы выбрали безопасную дверь! 🎉 +🪙 ${bet * 2}`); }
  else { u.balance -= bet; await ctx.reply(`🚪 За дверью был монстр! 😔 -🪙 ${bet}`); }
});

// 10. Мина
bot.hears(/^!?мина(?:\s+([1-5]))?(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const cell = Number(ctx.match[1]);
  const bet = Number(ctx.match[2]);
  if (!cell || !bet || bet <= 0) return ctx.reply("🧱 Использование: Мина [1-5] 100");
  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет.`);

  const bomb = Math.floor(Math.random() * 5) + 1;
  if (cell !== bomb) { u.balance += Math.floor(bet * 1.5); await ctx.reply(`🧱 Вы успешно прошли поле! 💣 Мина была на #${bomb}. 🎉 +🪙 ${Math.floor(bet * 1.5)}`); }
  else { u.balance -= bet; await ctx.reply(`💥 БУМ! Вы наступили на мину на #${bomb}! 😔 -🪙 ${bet}`); }
});

// 11. Дартс
bot.hears(/^!?дартс(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("🏹 Использование: Дартс 100");
  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет.`);

  const score = Math.floor(Math.random() * 10) + 1;
  if (score >= 6) { u.balance += bet; await ctx.reply(`🏹 Вы попали в центр! (${score}/10) 🎉 +🪙 ${bet}`); }
  else { u.balance -= bet; await ctx.reply(`🏹 Промах! (${score}/10) 😔 -🪙 ${bet}`); }
});

// 12. Футбол
bot.hears(/^!?футбол(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("⚽ Использование: Футбол 100");
  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет.`);

  const goal = Math.random() < 0.6;
  if (goal) { u.balance += bet; await ctx.reply(`⚽ ГОООЛ! 🎉 Вы забили мяч: +🪙 ${bet}`); }
  else { u.balance -= bet; await ctx.reply(`⚽ ВРАТАРЬ СЕЙВ! 😔 Сейв вратаря: -🪙 ${bet}`); }
});

// 13. Баскетбол
bot.hears(/^!?баскетбол(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("🏀 Использование: Баскетбол 100");
  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет.`);

  const hit = Math.random() < 0.5;
  if (hit) { u.balance += bet; await ctx.reply(`🏀 ТОЧНО В КОРЗИНУ! 🎉 +🪙 ${bet}`); }
  else { u.balance -= bet; await ctx.reply(`🏀 МИМО! 😔 -🪙 ${bet}`); }
});

// 14. Боулинг
bot.hears(/^!?боулинг(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("🎳 Использование: Боулинг 100");
  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет.`);

  const pins = Math.floor(Math.random() * 10) + 1;
  if (pins === 10) { u.balance += bet * 3; await ctx.reply(`🎳 СТРАЙК! Сбито 10 кеглей! 🔥 +🪙 ${bet * 3}`); }
  else if (pins >= 5) { u.balance += Math.floor(bet * 1.2); await ctx.reply(`🎳 Сбито ${pins} кеглей! 🎉 +🪙 ${Math.floor(bet * 1.2)}`); }
  else { u.balance -= bet; await ctx.reply(`🎳 Сбито всего ${pins} кеглей. 😔 -🪙 ${bet}`); }
});

// 15. Карта
bot.hears(/^!?карта(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("🃏 Использование: Карта 100");
  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет.`);

  const uCard = Math.floor(Math.random() * 9) + 2;
  const bCard = Math.floor(Math.random() * 9) + 2;
  if (uCard > bCard) { u.balance += bet; await ctx.reply(`🃏 Ваша карта: ${uCard} | Карта бота: ${bCard}\n🎉 Вы выиграли +🪙 ${bet}`); }
  else if (uCard < bCard) { u.balance -= bet; await ctx.reply(`🃏 Ваша карта: ${uCard} | Карта бота: ${bCard}\n😔 Бот выиграл -🪙 ${bet}`); }
  else { await ctx.reply(`🃏 Ничья! (${uCard} : ${bCard}) Ставка возвращена.`); }
});

// 16. Шар
bot.hears(/^!?шар(?:\s+(.+))?$/i, async (ctx) => {
  const q = ctx.match[1];
  if (!q) return ctx.reply("🔮 Задайте вопрос: Шар выигрываю ли я?");
  const ans = ["Безусловно да", "Скорее всего да", "Знаки говорят - нет", "Даже не думай", "50 на 50", "Шансы хороши"];
  const r = ans[Math.floor(Math.random() * ans.length)];
  await ctx.reply(`🔮 **Магический Шар:** ${r}`);
});

// 17. Пример (Заработок)
const activeMath = new Map();
bot.hears(/^!?пример$/i, async (ctx) => {
  const n1 = Math.floor(Math.random() * 50) + 10;
  const n2 = Math.floor(Math.random() * 50) + 10;
  const ans = n1 + n2;
  activeMath.set(ctx.from.id, ans);
  await ctx.reply(`🧮 Решите пример за монеты: **${n1} + ${n2} = ?**\n✍️ Напишите: **Ответ [число]**`);
});

bot.hears(/^!?ответ(?:\s+(-?\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const userAns = Number(ctx.match[1]);
  const correctAns = activeMath.get(ctx.from.id);

  if (correctAns === undefined) return ctx.reply("❌ Возьмите пример командой: Пример");
  if (userAns === correctAns) {
    activeMath.delete(ctx.from.id);
    u.balance += 150;
    await ctx.reply(`✅ Правильно! Вы получили 🪙 150 монет!`);
  } else {
    await ctx.reply(`❌ Неправильно, попробуйте ещё раз.`);
  }
});

// 18. Удача
bot.hears(/^!?удача(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("🍀 Использование: Удача 100");
  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет.`);

  const chance = Math.random();
  if (chance < 0.1) { u.balance += bet * 5; await ctx.reply(`🍀 СВЕРХУДАЧА! 5X! 🔥 +🪙 ${bet * 5}`); }
  else if (chance < 0.4) { u.balance += bet * 2; await ctx.reply(`🍀 Удача улыбнулась! 🎉 +🪙 ${bet * 2}`); }
  else { u.balance -= bet; await ctx.reply(`🍀 Удача повернулась спиной. 😔 -🪙 ${bet}`); }
});

// 19. Кейс
bot.hears(/^!?кейс(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("🎁 Использование: Кейс 100");
  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет.`);

  u.balance -= bet;
  const mults = [0, 0.5, 1, 1.5, 2, 3];
  const m = mults[Math.floor(Math.random() * mults.length)];
  const win = Math.floor(bet * m);
  u.balance += win;
  await ctx.reply(`🎁 Вы открыли кейс!\nМножитель: x${m}\n🪙 Получено: ${win} монет`);
});

// 20. Риск
bot.hears(/^!?риск(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("💥 Использование: Риск 100");
  if (u.balance < bet) return ctx.reply(`❌ Недостаточно монет.`);

  if (Math.random() < 0.25) { u.balance += bet * 4; await ctx.reply(`💥 РИСК ОПРАВДАЛСЯ! 🔥 +🪙 ${bet * 4}`); }
  else { u.balance -= bet; await ctx.reply(`💥 ВЗРЫВ! Все сгорело. 😔 -🪙 ${bet}`); }
});

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

bot.hears(/^!?банк(?:\s+(положить|снять|депозит|пополнить))?(?:\s+(\d+|все))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const action = ctx.match[1]?.toLowerCase();
  const amountArg = ctx.match[2]?.toLowerCase();
  const maxBankLimit = u.bankLimitUnlocked ? Infinity : 50000;

  if (!action) {
    return ctx.reply(`🏦 **БАНКОВСКИЙ СЧЁТ**\n\n🪙 Кошелёк: ${u.balance}\n🏦 В банке: ${u.bank} / ${u.bankLimitUnlocked ? "∞" : "50,000"}\n📈 Начисление: **2% в час**\n\n📥 Банк положить [сумма/все]\n📤 Банк снять [сумма/все]`);
  }
  if (action === "положить" || action === "депозит" || action === "пополнить") {
    let amount = amountArg === "все" ? u.balance : Number(amountArg);
    if (!amount || amount <= 0) return ctx.reply("📥 Укажите сумму: Банк положить 1000");
    if (u.balance < amount) return ctx.reply(`❌ Недостаточно монет.`);
    if (u.bank + amount > maxBankLimit) return ctx.reply(`❌ Превышен лимит банка.`);

    u.balance -= amount; u.bank += amount;
    return ctx.reply(`✅ Положено 🪙 ${amount} в банк.`);
  }
  if (action === "снять") {
    let amount = amountArg === "все" ? u.bank : Number(amountArg);
    if (!amount || amount <= 0) return ctx.reply("📤 Укажите сумму: Банк снять 1000");
    if (u.bank < amount) return ctx.reply(`❌ Недостаточно монет в банке.`);

    u.bank -= amount; u.balance += amount;
    return ctx.reply(`✅ Снято 🪙 ${amount} из банка.`);
  }
});

bot.hears(/^!?(магазин|дўкон)[\.\s]*$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(`🛒 **МАГАЗИН**\n\n1. 👑 **VIP Статус** — 🪙 5000\n2. 🏦 **Снять ограничения банка** — 🪙 3000\n3. 🎨 **Кастомный титул** — 🪙 2000\n\nКоманда: Купить [номер]\n💰 Баланс: 🪙 ${u.balance}`);
});

bot.hears(/^!?купить(?:\s+(\d+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const itemNum = Number(ctx.match[1]);
  if (!itemNum) return ctx.reply("🛒 Укажите номер товара: Купить 1");

  if (itemNum === 1) {
    if (u.vip) return ctx.reply("👑 Уже есть VIP!");
    if (u.balance < 5000) return ctx.reply(`❌ Недостаточно монет.`);
    u.balance -= 5000; u.vip = true; return ctx.reply(`🎉 Приобретен 👑 VIP Статус!`);
  } else if (itemNum === 2) {
    if (u.bankLimitUnlocked) return ctx.reply("🏦 Уже сняты ограничения!");
    if (u.balance < 3000) return ctx.reply(`❌ Недостаточно монет.`);
    u.balance -= 3000; u.bankLimitUnlocked = true; u.balance += 1000;
    return ctx.reply(`🎉 Сняты ограничения банка + 🪙 1000 бонус!`);
  } else if (itemNum === 3) {
    if (u.balance < 2000) return ctx.reply(`❌ Недостаточно монет.`);
    u.balance -= 2000; u.title = u.title || "Игрок";
    return ctx.reply(`🎉 Куплен Кастомный титул! Напишите: Титул [слово]`);
  }
});

bot.hears(/^!?титул(?:\s+(.+))?$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const newTitle = ctx.match[1];
  if (!u.title) return ctx.reply("❌ Купите титул в магазине (Купить 3).");
  if (!newTitle) return ctx.reply("✍️ Использование: Титул [текст]");
  u.title = newTitle.trim();
  await ctx.reply(`✅ Ваш титул: **[${u.title}]**`);
});

bot.hears(/^!?(богатые|богачи)[\.\s]*$/i, async (ctx) => {
  ecoUser(ctx);
  const sorted = Array.from(economyUsers.values()).map(u => ({ ...u, total: u.balance + u.bank })).sort((a, b) => b.total - a.total);
  let text = "💎 ТОП БОГАТЫХ УЧАСТНИКОВ\n\n";
  sorted.slice(0, 10).forEach((u, i) => {
    text += `${i + 1}. ${ecoName(u)} — 🪙 ${u.total} (Кошелёк: ${u.balance} | Банк: ${u.bank})\n`;
  });
  await ctx.reply(text);
});

bot.hears(/^!?(перевести|перевод)(?:\s+(\d+))?$/i, async (ctx) => {
  const sender = ecoUser(ctx);
  const amount = Number(ctx.match[2]);
  const replyMsg = ctx.message.reply_to_message;
  if (!replyMsg || !replyMsg.from || replyMsg.from.is_bot || replyMsg.from.id === ctx.from.id) return ctx.reply("💸 Ответьте человеку.");
  if (!amount || amount <= 0 || sender.balance < amount) return ctx.reply("❌ Недостаточно монет.");

  const receiver = ecoUser({ from: replyMsg.from });
  sender.balance -= amount; receiver.balance += amount;
  await ctx.reply(`✅ Переведено 🪙 ${amount} для ${ecoName(receiver)}`);
});

bot.hears(/^!?старт$/i, async (ctx) => { await ctx.reply("🔥 8-A ADMIN BOT 🔥\nКоманды: игры, профиль, банк, магазин, богатые, бонус, работа"); });
bot.hears(/^!?помощь$/i, async (ctx) => { await ctx.reply("📚 Команды: игры, профиль, банк, магазин, баланс, бонус, работа, богатые, перевести"); });
bot.hears(/^!?правила$/i, async (ctx) => { await ctx.reply("📜 ПРАВИЛА ГРУППЫ\n1. Без оскорблений.\n2. Без спама."); });
bot.hears(/^!?мойид$/i, async (ctx) => { await ctx.reply(`🆔 Ваш ID: ${ctx.from.id}`); });

bot.hears(/^!?баланс$/iu, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(`💰 ВАШ БАЛАНС\n\n👤 ${ecoName(u)}\n🪙 Кошелёк: ${u.balance}\n🏦 Банк: ${u.bank}\n💎 Всего: ${u.balance + u.bank}`);
});

bot.hears(/^!?бонус$/iu, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastBonus < ECO_BONUS_CD) return ctx.reply(`⏳ Бонус уже получен.`);
  const bonusAmount = u.vip ? ECO_BONUS * 2 : ECO_BONUS;
  u.balance += bonusAmount; u.lastBonus = now;
  await ctx.reply(`🎁 БОНУС ПОЛУЧЕН! +🪙 ${bonusAmount}`);
});

bot.hears(/^!?работа$/iu, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastWork < ECO_WORK_CD) return ctx.reply(`⏳ Вы уже работали.`);
  const reward = Math.floor(Math.random() * 451) + 50;
  u.balance += reward; u.lastWork = now;
  await ctx.reply(`💼 Заработано: +🪙 ${reward}`);
});

bot.hears(/^!?(профиль|profile)[\.\s]*$/iu, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `👤 **ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ**\n\n` +
    `🆔 **ID:** \`${u.id}\`\n` +
    `👤 **Имя:** ${ecoName(u)}\n` +
    `🪙 **Кошелёк:** ${u.balance} монет\n` +
    `🏦 **Банк:** ${u.bank} / ${u.bankLimitUnlocked ? "∞" : "50,000"}\n` +
    `💎 **Всего:** ${u.balance + u.bank} монет\n` +
    `👑 **VIP Статус:** ${u.vip ? "Активен" : "Нет"}`
  );
});

bot.catch((error) => console.error("BOT ERROR:", error));
bot.launch();
console.log("🔥 Bot started!");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
