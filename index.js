require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const fs = require("fs");

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("❌ CRITICAL ERROR: BOT_TOKEN is missing!");
  process.exit(1);
}

const bot = new Telegraf(token);
const DB_FILE = "./database.json";
const ADMINS = ["123456789"];

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf8");
      return new Map(JSON.parse(data));
    }
  } catch (e) {
    console.error("Ошибка чтения БД:", e);
  }
  return new Map();
}

function saveDB() {
  try {
    const data = JSON.stringify(Array.from(economyUsers.entries()));
    fs.writeFileSync(DB_FILE, data, "utf8");
  } catch (e) {
    console.error("Ошибка сохранения БД:", e);
  }
}

const economyUsers = loadDB();

function ecoUser(ctx) {
  const id = String(ctx.from.id);
  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id: ctx.from.id,
      name: ctx.from.first_name || "Игрок",
      nickname: null,
      username: ctx.from.username || null,
      balance: 500000,
      bank: 2000000,
      credit: 0,
      experience: 0,
      level: 1,
      business: "Нет",
      bizIncome: 0,
      car: "Нет",
      house: "Нет",
      phone: "Нет",
      yacht: "Нет",
      helicopter: "Нет",
      plane: "Нет",
      mineGrid: null,
      wins: 0,
      losses: 0,
      lastBonus: 0,
      lastWork: 0,
      lastRob: 0,
      lastCrime: 0,
      invitedBy: null,
      referralsCount: 0
    });
    saveDB();
  } else {
    const u = economyUsers.get(id);
    u.name = ctx.from.first_name || u.name;
    u.username = ctx.from.username || u.username;
  }
  return economyUsers.get(id);
}

function ecoName(u) {
  if (u.nickname) return u.nickname;
  return u.username ? `@${u.username}` : u.name;
}

function addExp(u, amount) {
  u.experience += amount;
  if (u.experience >= u.level * 200) {
    u.level += 1;
    u.experience = 0;
    u.balance += u.level * 50000;
  }
  saveDB();
}

const CARS = [
  { name: "Matiz", price: 2000000 },
  { name: "Cobalt", price: 15000000 },
  { name: "Malibu Turbo", price: 60000000 },
  { name: "BMW M5 Competition", price: 180000000 },
  { name: "Lamborghini Huracan", price: 500000000 },
  { name: "Bugatti Chiron Super Sport", price: 2000000000 }
];

const HOUSES = [
  { name: "Студенческое общежитие", price: 10000000 },
  { name: "1-комнатная квартира", price: 40000000 },
  { name: "Дом за городом", price: 150000000 },
  { name: "Элитный коттедж", price: 500000000 },
  { name: "Пентхаус Skyline", price: 1500000000 },
  { name: "Личный остров и Замок", price: 5000000000 }
];

const BIZ = [
  { name: "Точка Фаст-Фуда", price: 100000000, income: 5000000 },
  { name: "Большой Супермаркет", price: 400000000, income: 22000000 },
  { name: "IT Стартап Компания", price: 1200000000, income: 75000000 },
  { name: "Нефтяные вышки и Завод", price: 5000000000, income: 350000000 }
];

const PHONES = [
  { name: "Nokia 3310", price: 500000 },
  { name: "Redmi Note 12", price: 4000000 },
  { name: "iPhone 15 Pro Max", price: 22000000 },
  { name: "Vertu Diamond Signature", price: 100000000 }
];

bot.hears(/^(меню|menu|start|старт)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  
  const textPayload = ctx.message.text.split(" ")[1];
  if (textPayload && textPayload.startsWith("ref_") && !u.invitedBy && textPayload !== `ref_${ctx.from.id}`) {
    const inviterId = textPayload.replace("ref_", "");
    if (economyUsers.has(inviterId)) {
      u.invitedBy = inviterId;
      const inviter = economyUsers.get(inviterId);
      inviter.referralsCount++;
      inviter.balance += 100000;
      saveDB();
    }
  }

  await ctx.reply(
    `🤖 **MEGA ECONOMY EMPIRE BOT**\n\n` +
    `👤 \`профиль\` — Личный кабинет и имущество\n` +
    `💰 \`баланс\` — Наличные, банк и кредиты\n` +
    `🏦 \`банк [сумма]\` / \`снять [сумма / все]\`\n` +
    `💳 \`кредит [сумма]\` / \`кредит погасить\`\n` +
    `🎁 \`бонус\` — Ежедневный бонус\n` +
    `💼 \`работа\` — Работа и опыт\n` +
    `🦹‍♂️ \`грабеж\` / \`криминал\` — Рискованные преступления\n` +
    `🏢 \`бизнесы\` — Список бизнесов\n` +
    `🛒 \`магазин\` — Машины, дома, телефоны\n` +
    `👥 \`реф\` — Реферальная система\n` +
    `🏆 \`топ\` / \`богатые\` — Самые богатые игроки\n` +
    `💸 \`передать [ID] [сумма]\` — Перевод денег\n` +
    `⚙️ \`ник [имя]\` — Изменить никнейм\n\n` +
    `🎮 \`игры\` — Меню мини-игр\n\n` +
    (ADMINS.includes(String(ctx.from.id)) ? `👑 \`admin\` — Панель администратора` : ""),
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^(игры|игра|games|game)$/i, async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("🔺 Пирамида", "menu_pyr"), Markup.button.callback("💣 Мина 7x7", "menu_mine")],
    [Markup.button.callback("📈 Трейдинг", "menu_tr"), Markup.button.callback("🎲 Кости", "menu_dice")]
  ]);

  await ctx.reply(
    `🎮 **ЦЕНТР МИНИ-ИГР**\n\n` +
    `Выберите игру или используйте команды:\n` +
    `• \`пирамида [ставка]\`\n` +
    `• \`мина [ставка]\`\n` +
    `• \`трейдинг [ставка]\`\n` +
    `• \`кости [ставка]\``,
    { parse_mode: "Markdown", ...keyboard }
  );
});

bot.action("menu_pyr", async (ctx) => {
  await ctx.editMessageText("🔺 **ИГРА ПИРАМИДА**\n\nYozing: `пирамида [ставка]`", { parse_mode: "Markdown" }).catch(() => {});
  await ctx.answerCbQuery();
});

bot.action("menu_mine", async (ctx) => {
  await ctx.editMessageText("💣 **МИННОЕ ПОЛЕ 7x7**\n\nYozing: `мина [ставка]`", { parse_mode: "Markdown" }).catch(() => {});
  await ctx.answerCbQuery();
});

bot.action("menu_tr", async (ctx) => {
  await ctx.editMessageText("📈 **ТРЕЙДИНГ**\n\nYozing: `трейдинг [ставка]`", { parse_mode: "Markdown" }).catch(() => {});
  await ctx.answerCbQuery();
});

bot.action("menu_dice", async (ctx) => {
  await ctx.editMessageText("🎲 **КОСТИ**\n\nYozing: `кости [ставка]`", { parse_mode: "Markdown" }).catch(() => {});
  await ctx.answerCbQuery();
});

bot.hears(/^(баланс|balance|бал)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `💰 **Ваш капитал:**\n\n` +
    `💵 Наличные: **$${u.balance.toLocaleString()}**\n` +
    `🏦 В банке: **$${u.bank.toLocaleString()}**\n` +
    `💳 Кредитный долг: **$${u.credit.toLocaleString()}**`,
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^(профиль|проф|profile|профил)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `👤 **ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ:**\n\n` +
    `👨‍💼 Имя: **${ecoName(u)}**\n` +
    `🆔 ID: \`${u.id}\`\n` +
    `⭐ Уровень: **${u.level} LVL** (${u.experience}/${u.level * 200} XP)\n\n` +
    `💵 Наличные: **$${u.balance.toLocaleString()}**\n` +
    `🏦 Банк: **$${u.bank.toLocaleString()}**\n\n` +
    `🚘 Машина: **${u.car}**\n` +
    `🏠 Дом: **${u.house}**\n` +
    `📱 Телефон: **${u.phone}**\n` +
    `🏢 Бизнес: **${u.business}** (+$${u.bizIncome.toLocaleString()}/час)\n` +
    `👥 Рефералы: **${u.referralsCount} чел.**\n\n` +
    `🏆 Победы: ${u.wins} | Поражения: ${u.losses}`,
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^ник\s+(.+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const newNick = ctx.match[1].trim();
  if (newNick.length > 25) return ctx.reply("❌ Ник не должен превышать 25 символов!");
  u.nickname = newNick;
  saveDB();
  await ctx.reply(`✅ Ваш никнейм успешно изменен на: **${newNick}**`);
});

bot.hears(/^(реф|referral|referans)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const botUsername = ctx.botInfo.username;
  const refLink = `https://t.me/${botUsername}?start=ref_${u.id}`;
  await ctx.reply(
    `👥 **РЕФЕРАЛЬНАЯ СИСТЕМА**\n\n` +
    `Приглашайте друзей и получайте **$100,000** за каждого игрока!\n\n` +
    `🔗 Ссылка:\n\`${refLink}\`\n\n` +
    `📊 Приглашено: **${u.referralsCount} чел.**`,
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^банк\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[1]);
  if (!amount || amount <= 0) return ctx.reply("❌ Введите правильную сумму!");
  if (u.balance < amount) return ctx.reply("❌ У вас недостаточно наличных!");

  u.balance -= amount;
  u.bank += amount;
  saveDB();
  await ctx.reply(`🏦 В банк внесено **$${amount.toLocaleString()}**!`);
});

bot.hears(/^снять\s+(.+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const param = ctx.match[1].trim().toLowerCase();
  
  let amount = 0;
  if (param === "все" || param === "всё" || param === "all") {
    amount = u.bank;
  } else {
    amount = Number(param);
  }

  if (!amount || amount <= 0) return ctx.reply("❌ Введите правильную сумму!");
  if (u.bank < amount) return ctx.reply(`❌ В банке нет столько денег!`);

  u.bank -= amount;
  u.balance += amount;
  saveDB();
  await ctx.reply(`💵 Снято с банка: **$${amount.toLocaleString()}**!`);
});

bot.hears(/^кредит\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[1]);
  if (u.credit > 0) return ctx.reply("❌ У вас уже есть кредит!");
  if (amount <= 0 || amount > 1000000000) return ctx.reply("❌ Сумма от 1 до $1,000,000,000!");

  u.credit = Math.floor(amount * 1.3);
  u.balance += amount;
  saveDB();
  await ctx.reply(`💳 Выдан кредит: **$${amount.toLocaleString()}**. К возврату: **$${u.credit.toLocaleString()}**`);
});

bot.hears(/^кредит\s+погасить$/i, async (ctx) => {
  const u = ecoUser(ctx);
  if (u.credit <= 0) return ctx.reply("❌ У вас нет кредита!");
  if (u.balance < u.credit) return ctx.reply(`❌ Недостаточно средств! Нужно: $${u.credit.toLocaleString()}`);

  u.balance -= u.credit;
  u.credit = 0;
  saveDB();
  await ctx.reply("✅ Кредит полностью погашен!");
});

bot.hears(/^(бонус|bonus)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastBonus < 86400000) {
    const hoursLeft = Math.ceil((86400000 - (now - u.lastBonus)) / 3600000);
    return ctx.reply(`⏳ Бонус будет доступен через ${hoursLeft} ч.!`);
  }

  const reward = 100000 * u.level;
  u.balance += reward;
  u.lastBonus = now;
  addExp(u, 40);
  saveDB();
  await ctx.reply(`🎁 Ежедневный бонус: **+$${reward.toLocaleString()}**!`);
});

bot.hears(/^(работа|work)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastWork < 180000) {
    return ctx.reply("⏳ Подождите 3 минуты до следующей работы.");
  }

  const earned = Math.floor(Math.random() * 50000) + 20000 * u.level;
  u.balance += earned;
  u.lastWork = now;
  addExp(u, 25);
  saveDB();
  await ctx.reply(`💼 Зарплата за смену: **+$${earned.toLocaleString()}**!`);
});

bot.hears(/^(грабеж|rob|криминал)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastRob < 600000) {
    return ctx.reply("⏳ Полиция ищет вас! Подождите 10 минут.");
  }

  u.lastRob = now;
  const success = Math.random() < 0.45;
  if (success) {
    const loot = Math.floor(Math.random() * 200000) + 50000;
    u.balance += loot;
    addExp(u, 50);
    saveDB();
    await ctx.reply(`🦹‍♂️ Успешно! Добыча: **+$${loot.toLocaleString()}**`);
  } else {
    const fine = Math.floor(Math.random() * 100000) + 25000;
    u.balance = Math.max(0, u.balance - fine);
    saveDB();
    await ctx.reply(`🚨 Вас поймали! Штраф: **-$${fine.toLocaleString()}**`);
  }
});

bot.hears(/^(топ|рейтинг|top|богатые|богати)$/i, async (ctx) => {
  ecoUser(ctx);
  const usersArr = Array.from(economyUsers.values());
  usersArr.sort((a, b) => (b.balance + b.bank) - (a.balance + a.bank));

  let text = `🏆 **ТОП БОГАТЫХ ИГРОКОВ**\n\n`;
  usersArr.slice(0, 10).forEach((user, i) => {
    text += `${i + 1}. **${ecoName(user)}** — $${(user.balance + user.bank).toLocaleString()}\n`;
  });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^передать\s+(\d+)\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const targetId = ctx.match[1];
  const amount = Number(ctx.match[2]);

  if (amount <= 0 || u.balance < amount) return ctx.reply("❌ Недостаточно средств!");
  if (!economyUsers.has(targetId)) return ctx.reply("❌ Игрок не найден!");

  const targetUser = economyUsers.get(targetId);
  u.balance -= amount;
  targetUser.balance += amount;
  saveDB();

  await ctx.reply(`✅ Переведено \`${targetId}\` ID ga: **$${amount.toLocaleString()}**!`, { parse_mode: "Markdown" });
});

bot.hears(/^(магазин|shop)$/i, async (ctx) => {
  let text = `🛒 **ЭЛИТНЫЙ МАГАЗИН**\n\n🚗 **Машины:**\n`;
  CARS.forEach((c, i) => { text += `${i+1}. ${c.name} — $${c.price.toLocaleString()} (\`купить маш ${i+1}\`)\n`; });
  text += `\n🏠 **Дома:**\n`;
  HOUSES.forEach((h, i) => { text += `${i+1}. ${h.name} — $${h.price.toLocaleString()} (\`купить дом ${i+1}\`)\n`; });
  text += `\n📱 **Телефоны:**\n`;
  PHONES.forEach((p, i) => { text += `${i+1}. ${p.name} — $${p.price.toLocaleString()} (\`купить тел ${i+1}\`)\n`; });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^(бизнесы|бизнес|business)$/i, async (ctx) => {
  let text = `🏢 **ИМПЕРИЯ БИЗНЕСОВ**\n\n`;
  BIZ.forEach((b, i) => { text += `${i+1}. ${b.name} — Цена: $${b.price.toLocaleString()} | Доход: +$${b.income.toLocaleString()}/час (\`купить биз ${i+1}\`)\n`; });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^купит[ь]?\s+маш[ин]*\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!CARS[idx]) return ctx.reply("❌ Машина не найдена!");
  const car = CARS[idx];
  if (u.balance < car.price) return ctx.reply(`❌ Нужно: $${car.price.toLocaleString()}`);

  u.balance -= car.price;
  u.car = car.name;
  saveDB();
  await ctx.reply(`🚗 Поздравляем с покупкой **${car.name}**!`);
});

bot.hears(/^купит[ь]?\s+дом[а]*\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!HOUSES[idx]) return ctx.reply("❌ Дом не найден!");
  const house = HOUSES[idx];
  if (u.balance < house.price) return ctx.reply(`❌ Нужно: $${house.price.toLocaleString()}`);

  u.balance -= house.price;
  u.house = house.name;
  saveDB();
  await ctx.reply(`🏠 Поздравляем с покупкой **${house.name}**!`);
});

bot.hears(/^купит[ь]?\s+тел[ефоны]*\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!PHONES[idx]) return ctx.reply("❌ Телефон не найден!");
  const phone = PHONES[idx];
  if (u.balance < phone.price) return ctx.reply(`❌ Нужно: $${phone.price.toLocaleString()}`);

  u.balance -= phone.price;
  u.phone = phone.name;
  saveDB();
  await ctx.reply(`📱 Поздравляем с покупкой **${phone.name}**!`);
});

bot.hears(/^купит[ь]?\s+бизнес*[ы]*\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!BIZ[idx]) return ctx.reply("❌ Бизнес не найден!");
  const biz = BIZ[idx];
  if (u.balance < biz.price) return ctx.reply(`❌ Нужно: $${biz.price.toLocaleString()}`);

  u.balance -= biz.price;
  u.business = biz.name;
  u.bizIncome = biz.income;
  saveDB();
  await ctx.reply(`🏢 Поздравляем с покупкой бизнеса **${biz.name}**!`);
});

bot.hears(/^пирамида\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("❌ Введите ставку!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;
  saveDB();

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("💎 1", `pyr_${ctx.from.id}_${bet}_0`), Markup.button.callback("💎 2", `pyr_${ctx.from.id}_${bet}_1`)],
    [Markup.button.callback("💎 3", `pyr_${ctx.from.id}_${bet}_2`), Markup.button.callback("💎 4", `pyr_${ctx.from.id}_${bet}_3`)]
  ]);

  await ctx.reply(`🔺 **ПИРАМИДА**\nСтавка: $${bet.toLocaleString()}\nВыберите ячейку:`, { parse_mode: "Markdown", ...keyboard });
});

bot.action(/^pyr_(\d+)_(\d+)_(\d+)$/, async (ctx) => {
  if (String(ctx.from.id) !== ctx.match[1]) return ctx.answerCbQuery("❌ Чужая игра!", { show_alert: true });
  const bet = Number(ctx.match[2]);
  const u = ecoUser(ctx);
  
  const isWin = [0, 1].includes(Math.floor(Math.random() * 4));
  let text = "";
  if (isWin) {
    const prize = Math.floor(bet * 2.2);
    u.balance += prize;
    u.wins++;
    addExp(u, 15);
    saveDB();
    text = `🎉 **ПЕРЕМОГА!**\n\n💰 Награда: **+$${prize.toLocaleString()}**`;
  } else {
    u.losses++;
    saveDB();
    text = `💥 **ПРОИГРЫШ!**\n\n💸 Потеря: **-$${bet.toLocaleString()}**`;
  }
  await ctx.editMessageText(text, { parse_mode: "Markdown" }).catch(() => {});
  await ctx.answerCbQuery();
});

bot.hears(/^мина\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("❌ Введите ставку!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;
  u.mineGrid = { bet, opened: 0, currentMultiplier: 1.0 };
  saveDB();

  const rows = [];
  for (let r = 0; r < 7; r++) {
    const rowBtns = [];
    for (let c = 0; c < 7; c++) {
      rowBtns.push(Markup.button.callback("⬜", `mine_${ctx.from.id}_${r}_${c}`));
    }
    rows.push(rowBtns);
  }
  rows.push([Markup.button.callback("🛑 ЗАБРАТЬ ($" + bet.toLocaleString() + ")", `mine_cash_${ctx.from.id}`)]);
  const keyboard = Markup.inlineKeyboard(rows);

  await ctx.reply(`💣 **МИННОЕ ПОЛЕ 7x7**\nСтавка: $${bet.toLocaleString()}\nВыберите ячейку:`, { parse_mode: "Markdown", ...keyboard });
});

bot.action(/^mine_(\d+)_(\d+)_(\d+)$/, async (ctx) => {
  const targetId = ctx.match[1];
  if (String(ctx.from.id) !== targetId) return ctx.answerCbQuery("❌ Чужая игра!", { show_alert: true });
  
  const u = ecoUser(ctx);
  if (!u.mineGrid) return ctx.answerCbQuery("❌ Игра завершена!", { show_alert: true });

  if (Math.random() < 0.15) {
    u.losses++;
    const lostBet = u.mineGrid.bet;
    u.mineGrid = null;
    saveDB();
    await ctx.editMessageText(`💥 **БУМ! Мина!**\n\n💸 Потеря: **-$${lostBet.toLocaleString()}**`, { parse_mode: "Markdown" }).catch(() => {});
    return ctx.answerCbQuery("Мина!");
  } else {
    u.mineGrid.opened++;
    u.mineGrid.currentMultiplier = Number((1 + (u.mineGrid.opened * 0.4)).toFixed(2));
    const currentPrize = Math.floor(u.mineGrid.bet * u.mineGrid.currentMultiplier);
    saveDB();

    const rows = [];
    for (let r = 0; r < 7; r++) {
      const rowBtns = [];
      for (let c = 0; c < 7; c++) {
        rowBtns.push(Markup.button.callback("🟩", `mine_${ctx.from.id}_${r}_${c}`));
      }
      rows.push(rowBtns);
    }
    rows.push([Markup.button.callback(`🛑 ЗАБРАТЬ ($${currentPrize.toLocaleString()})`, `mine_cash_${ctx.from.id}`)]);
    
    await ctx.editMessageText(`💣 **МИННОЕ ПОЛЕ 7x7**\nОткрыто: ${u.mineGrid.opened}\nВыигрыш: **$${currentPrize.toLocaleString()}** (х${u.mineGrid.currentMultiplier})`, { parse_mode: "Markdown", reply_markup: Markup.inlineKeyboard(rows).reply_markup }).catch(() => {});
    return ctx.answerCbQuery(`+$${currentPrize.toLocaleString()}!`);
  }
});

bot.action(/^mine_cash_(\d+)$/, async (ctx) => {
  const targetId = ctx.match[1];
  if (String(ctx.from.id) !== targetId) return ctx.answerCbQuery("❌ Чужая игра!", { show_alert: true });

  const u = ecoUser(ctx);
  if (!u.mineGrid) return ctx.answerCbQuery("❌ Игра не найдена!", { show_alert: true });

  const prize = Math.floor(u.mineGrid.bet * u.mineGrid.currentMultiplier);
  u.balance += prize;
  u.wins++;
  addExp(u, 20);
  u.mineGrid = null;
  saveDB();

  await ctx.editMessageText(`🎉 **ВЫИГРЫШ ЗАБРАН!**\n\n💰 Награда: **+$${prize.toLocaleString()}**`, { parse_mode: "Markdown" }).catch(() => {});
  await ctx.answerCbQuery("Saqlandi!");
});

bot.hears(/^трейдинг\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("❌ Введите ставку!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;
  saveDB();

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("📈 LONG", `tr_${ctx.from.id}_${bet}_up`), Markup.button.callback("📉 SHORT", `tr_${ctx.from.id}_${bet}_down`)]
  ]);

  await ctx.reply(`📈 **ТРЕЙДИНГ**\nСтавка: $${bet.toLocaleString()}\nВыберите направление:`, { parse_mode: "Markdown", ...keyboard });
});

bot.action(/^tr_(\d+)_(\d+)_([a-z]+)$/, async (ctx) => {
  if (String(ctx.from.id) !== ctx.match[1]) return ctx.answerCbQuery("❌ Чужая игра!", { show_alert: true });
  const bet = Number(ctx.match[2]);
  const choice = ctx.match[3];
  const u = ecoUser(ctx);
  const actual = Math.random() < 0.5 ? "up" : "down";

  let text = "";
  if (choice === actual) {
    const prize = Math.floor(bet * 2.1);
    u.balance += prize;
    u.wins++;
    addExp(u, 15);
    saveDB();
    text = `🚀 **Успешно!**\n\n💰 Прибыль: **+$${prize.toLocaleString()}**`;
  } else {
    u.losses++;
    saveDB();
    text = `📉 **Ликвидация!**\n\n💸 Потеря: **-$${bet.toLocaleString()}**`;
  }
  await ctx.editMessageText(text, { parse_mode: "Markdown" }).catch(() => {});
  await ctx.answerCbQuery();
});

bot.hears(/^кости\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("❌ Введите ставку!");
  if (u.balance < bet) return ctx.reply("❌ Недостаточно средств!");

  u.balance -= bet;
  saveDB();

  const userDice = Math.floor(Math.random() * 6) + 1;
  const botDice = Math.floor(Math.random() * 6) + 1;

  let text = `🎲 **КОСТИ**\n\nSiz: **${userDice}**\nBot: **${botDice}**\n\n`;
  if (userDice > botDice) {
    const prize = bet * 2;
    u.balance += prize;
    u.wins++;
    addExp(u, 12);
    text += `🎉 Победа: **+$${prize.toLocaleString()}**`;
  } else if (userDice === botDice) {
    u.balance += bet;
    text += `🤝 Ничья!`;
  } else {
    u.losses++;
    text += `💥 Поражение: **-$${bet.toLocaleString()}**`;
  }
  saveDB();
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^admin$/i, async (ctx) => {
  if (!ADMINS.includes(String(ctx.from.id))) return;
  await ctx.reply(
    `👑 **АДМИН ПАНЕЛЬ**\n\n` +
    `➕ \`addbal [ID] [сумма]\`\n` +
    `➖ \`delbal [ID] [сумма]\`\n` +
    `📢 \`sendall [текст]\``,
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^addbal\s+(\d+)\s+(\d+)$/i, async (ctx) => {
  if (!ADMINS.includes(String(ctx.from.id))) return;
  const targetId = ctx.match[1];
  const amount = Number(ctx.match[2]);

  if (!economyUsers.has(targetId)) return ctx.reply("❌ Игрок не найден!");
  const targetUser = economyUsers.get(targetId);
  targetUser.balance += amount;
  saveDB();
  await ctx.reply(`✅ Добавлено $${amount.toLocaleString()}!`);
});

bot.hears(/^delbal\s+(\d+)\s+(\d+)$/i, async (ctx) => {
  if (!ADMINS.includes(String(ctx.from.id))) return;
  const targetId = ctx.match[1];
  const amount = Number(ctx.match[2]);

  if (!economyUsers.has(targetId)) return ctx.reply("❌ Игрок не найден!");
  const targetUser = economyUsers.get(targetId);
  targetUser.balance = Math.max(0, targetUser.balance - amount);
  saveDB();
  await ctx.reply(`✅ Списано $${amount.toLocaleString()}!`);
});

bot.hears(/^sendall\s+(.+)$/i, async (ctx) => {
  if (!ADMINS.includes(String(ctx.from.id))) return;
  const msg = ctx.match[1];
  let count = 0;
  for (const [id] of economyUsers.entries()) {
    try {
      await bot.telegram.sendMessage(id, `📢 ${msg}`, { parse_mode: "Markdown" });
      count++;
    } catch (e) {}
  }
  await ctx.reply(`✅ Отправлено ${count} пользователям!`);
});

setInterval(() => {
  for (const [id, u] of economyUsers.entries()) {
    if (u.bizIncome > 0) {
      u.bank += u.bizIncome;
    }
  }
  saveDB();
}, 3600000);

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🚀 BOT IS ONLINE!");
  } catch (err) {
    console.error("Ошибка:", err);
  }
}

startBot();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
