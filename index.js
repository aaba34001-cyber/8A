require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("❌ CRITICAL ERROR: BOT_TOKEN is missing!");
  process.exit(1);
}

const bot = new Telegraf(token);
const OWNER_ID = Number(process.env.OWNER_ID || 8480297110);

// Global xotira
const economyUsers = new Map();
const activeMinesGames = new Map();
const activePyramidGames = new Map();
const activeCrashGames = new Map();

// Foydalanuvchini olish yoki yaratish
function ecoUser(ctx) {
  const id = String(ctx.from.id);
  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id: ctx.from.id,
      name: ctx.from.first_name || "Игрок",
      username: ctx.from.username || null,
      balance: 25000,
      bank: 0,
      vip: 0,
      experience: 0,
      level: 1,
      business: "Отсутствует",
      bizIncome: 0,
      lastBizCollect: 0,
      car: "Отсутствует",
      house: "Отсутствует",
      phone: "Отсутствует",
      lastBonus: 0,
      lastWork: 0,
      lastCrime: 0,
      lastRob: 0,
      wins: 0,
      losses: 0
    });
  } else {
    const u = economyUsers.get(id);
    u.name = ctx.from.first_name || u.name;
    u.username = ctx.from.username || u.username;
  }
  return economyUsers.get(id);
}

function ecoName(u) {
  return u.username ? `@${u.username}` : u.name;
}

function addExp(u, amount) {
  u.experience += amount;
  if (u.experience >= u.level * 100) {
    u.level += 1;
    u.experience = 0;
    u.balance += u.level * 10000;
  }
}

// ==================== EXTENDED SHOP DATA ====================

const CARS = [
  { name: "🚲 Velosiped", price: 5000, speed: "15 km/h" },
  { name: "🛵 Scooter", price: 15000, speed: "60 km/h" },
  { name: "🏎 Spark", price: 50000, speed: "140 km/h" },
  { name: "🚘 Cobalt", price: 120000, speed: "170 km/h" },
  { name: "🚘 Gentra", price: 200000, speed: "190 km/h" },
  { name: "🏎 Malibu 2 Turbo", price: 500000, speed: "220 km/h" },
  { name: "🏎 Tahoe", price: 1000000, speed: "200 km/h" },
  { name: "🏎 BMW M5 CS", price: 2500000, speed: "305 km/h" },
  { name: "🏎 Mercedes GT 63s", price: 5000000, speed: "315 km/h" },
  { name: "🏎 Porsche 911 GT3", price: 8000000, speed: "320 km/h" },
  { name: "🏎 Bugatti Chiron", price: 20000000, speed: "420 km/h" }
];

const HOUSES = [
  { name: "⛺️ Chodir (Palatka)", price: 10000 },
  { name: "🛋 Ijaradagi xona", price: 50000 },
  { name: "🏠 1 xonali xonadon", price: 250000 },
  { name: "🏡 Novostroyka (3 xonali)", price: 800000 },
  { name: "🏰 Shahardagi Hovli", price: 2500000 },
  { name: "🏰 Hashamatli Villa", price: 10000000 },
  { name: "👑 VIP Qasr", price: 50000000 }
];

const PHONES = [
  { name: "📞 Nokia 3310", price: 2000 },
  { name: "📱 Redmi Note 12", price: 20000 },
  { name: "📱 Samsung S24 Ultra", price: 100000 },
  { name: "📱 iPhone 16 Pro Max", price: 250000 },
  { name: "💎 Gold Diamond Phone", price: 2000000 }
];

const BIZ = [
  { name: "📦 Paynet Shaxobchasi", price: 100000, income: 5000 },
  { name: "🍔 Lavashxona", price: 300000, income: 18000 },
  { name: "☕️ Qahvaxona (Coffee Shop)", price: 800000, income: 50000 },
  { name: "🛒 Supermarket", price: 2000000, income: 140000 },
  { name: "🏢 IT Kompaniya", price: 5000000, income: 400000 },
  { name: "🏨 Mehmonxona (Hotel)", price: 15000000, income: 1300000 },
  { name: "⛽️ Zapravka tarmog'i", price: 40000000, income: 3800000 }
];

// ==================== SHOP COMMANDS ====================

bot.hears(/^(магазин|magazin|dokon|do'kon)$/i, async (ctx) => {
  await ctx.reply(
    `🛒 **KATTA BOZOR VA MAGAZIN**\n\n` +
    `Quyidagi bo'limlardan birini tanlang:\n\n` +
    `🚘 **Avtosalon:** \`magazin mashina\`\n` +
    `🏠 **Ko'chmas mulk:** \`magazin uy\`\n` +
    `📱 **Texnika va Telefonlar:** \`magazin telefon\`\n` +
    `🏢 **Biznes Markazi:** \`magazin biznes\`\n\n` +
    `💡 *Sotib olish uchun tegishli bo'limga kiring.*`
  );
});

bot.hears(/^(magazin|магазин) (mashina|машина)$/i, async (ctx) => {
  let text = `🚘 **AVTOSALON — MASHINALAR**\n\n`;
  CARS.forEach((c, i) => {
    text += `${i + 1}. **${c.name}**\n   💰 Narxi: **${c.price.toLocaleString()}** | ⚡️ Tezlik: ${c.speed}\n   🛒 Sotib olish: \`sotib mashina ${i + 1}\`\n\n`;
  });
  await ctx.reply(text);
});

bot.hears(/^(magazin|магазин) (uy|дом)$/i, async (ctx) => {
  let text = `🏠 **KO'CHMAS MULK BO'LIMI**\n\n`;
  HOUSES.forEach((h, i) => {
    text += `${i + 1}. **${h.name}**\n   💰 Narxi: **${h.price.toLocaleString()}**\n   🛒 Sotib olish: \`sotib uy ${i + 1}\`\n\n`;
  });
  await ctx.reply(text);
});

bot.hears(/^(magazin|магазин) (telefon|телефон)$/i, async (ctx) => {
  let text = `📱 **ELEKTRONIKA VA TELEFONLAR**\n\n`;
  PHONES.forEach((p, i) => {
    text += `${i + 1}. **${p.name}**\n   💰 Narxi: **${p.price.toLocaleString()}**\n   🛒 Sotib olish: \`sotib telefon ${i + 1}\`\n\n`;
  });
  await ctx.reply(text);
});

bot.hears(/^(magazin|магазин) (biznes|бизнес)$/i, async (ctx) => {
  let text = `🏢 **BIZNES BIRJASI**\n\n`;
  BIZ.forEach((b, i) => {
    text += `${i + 1}. **${b.name}**\n   💰 Narxi: **${b.price.toLocaleString()}**\n   📈 Soatlik daromad: **+${b.income.toLocaleString()}/soat**\n   🛒 Sotib olish: \`sotib biznes ${i + 1}\`\n\n`;
  });
  await ctx.reply(text);
});

// Sotib olish harakatlari
bot.hears(/^(sotib|купить) (mashina|машина) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[3]) - 1;
  if (!CARS[idx]) return ctx.reply("❌ Bunday mashina mavjud emas!");
  const item = CARS[idx];
  if (u.balance < item.price) return ctx.reply(`❌ Mablag' yetarli emas! Sizga yana **${(item.price - u.balance).toLocaleString()} монет** kerak.`);
  
  u.balance -= item.price;
  u.car = item.name;
  addExp(u, 25);
  await ctx.reply(`🎉 Tabriklaymiz! Siz **${item.name}** xarid qildingiz!`);
});

bot.hears(/^(sotib|купить) (uy|дом) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[3]) - 1;
  if (!HOUSES[idx]) return ctx.reply("❌ Bunday uy mavjud emas!");
  const item = HOUSES[idx];
  if (u.balance < item.price) return ctx.reply(`❌ Mablag' yetarli emas!`);

  u.balance -= item.price;
  u.house = item.name;
  addExp(u, 40);
  await ctx.reply(`🏡 Tabriklaymiz! Yangi uyingiz: **${item.name}**!`);
});

bot.hears(/^(sotib|купить) (telefon|телефон) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[3]) - 1;
  if (!PHONES[idx]) return ctx.reply("❌ Bunday telefon mavjud emas!");
  const item = PHONES[idx];
  if (u.balance < item.price) return ctx.reply(`❌ Mablag' yetarli emas!`);

  u.balance -= item.price;
  u.phone = item.name;
  addExp(u, 15);
  await ctx.reply(`📱 Yangi telefoningiz: **${item.name}**!`);
});

bot.hears(/^(sotib|купить) (biznes|бизнес) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[3]) - 1;
  if (!BIZ[idx]) return ctx.reply("❌ Bunday biznes mavjud emas!");
  const item = BIZ[idx];
  if (u.balance < item.price) return ctx.reply(`❌ Mablag' yetarli emas!`);

  u.balance -= item.price;
  u.business = item.name;
  u.bizIncome = item.income;
  u.lastBizCollect = Date.now();
  addExp(u, 100);
  await ctx.reply(`🏢 Tabriklaymiz! Siz **${item.name}** biznesi egasiga aylandingiz!\n📈 Soatlik daromad: **+${item.income.toLocaleString()} монет**.\n\nFoydani yig'ish uchun: \`pribil\` deb yozing.`);
});

// Biznesdan foyda yig'ish
bot.hears(/^(pribil|прибыль|foyda)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  if (u.bizIncome <= 0) return ctx.reply("❌ Sizda hali hech qanday biznes yo'q!");

  const now = Date.now();
  const diffHours = (now - u.lastBizCollect) / 3600000;
  if (diffHours < 0.1) return ctx.reply("⏳ Biznesingiz hali yetarlicha daromad keltirmadi. Biroz kutib qayta urinib ko'ring!");

  const earned = Math.floor(diffHours * u.bizIncome);
  u.lastBizCollect = now;
  u.balance += earned;
  addExp(u, 10);
  await ctx.reply(`💰 Businessingiz (**${u.business}**) sizga **+${earned.toLocaleString()} монет** foyda keltirdi!`);
});

// ==================== WORK, CRIME, ROB & BANK ====================

bot.hears(/^(работа|work|ish)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastWork < 60000) {
    const rem = Math.ceil((60000 - (now - u.lastWork)) / 1000);
    return ctx.reply(`⏳ Charchadingiz! **${rem} sek.** dam oling.`);
  }
  u.lastWork = now;
  const jobs = ["Dasturchilik qildi", "Taksi haydadi", "Kuryerlik qildi", "Dizayn tayyorladi", "Qurilishda ishladi"];
  const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
  let reward = Math.floor(Math.random() * 8000) + 3000 + (u.level * 500);
  u.balance += reward;
  addExp(u, 15);
  await ctx.reply(`👨‍💻 Siz **${randomJob}** va **+${reward.toLocaleString()} монет** ishladangiz!`);
});

bot.hears(/^(ограбление|crime|jinoyat)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastCrime < 120000) {
    const rem = Math.ceil((120000 - (now - u.lastCrime)) / 1000);
    return ctx.reply(`⏳ Militsiya sizni qidirmoqda! **${rem} sek.** berkitining.`);
  }
  u.lastCrime = now;

  if (Math.random() < 0.45) {
    let reward = Math.floor(Math.random() * 20000) + 8000;
    u.balance += reward;
    addExp(u, 25);
    await ctx.reply(`🥷 Muvaffaqiyatli jinoyat! Siz **+${reward.toLocaleString()} монет** o'g'irladingiz!`);
  } else {
    let penalty = Math.floor(u.balance * 0.15);
    u.balance -= penalty;
    await ctx.reply(`🚨 Politsiya sizni qo'lga olib, **-${penalty.toLocaleString()} монет** jarima soldi!`);
  }
});

bot.hears(/^(бонус|bonus)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastBonus < 86400000) {
    const hours = Math.ceil((86400000 - (now - u.lastBonus)) / 3600000);
    return ctx.reply(`⏳ Kunlik bonusni **${hours} soatdan** keyin olishingiz mumkin!`);
  }
  u.lastBonus = now;
  let reward = 50000 + (u.level * 5000);
  u.balance += reward;
  addExp(u, 30);
  await ctx.reply(`🎁 Kunlik bonus qabul qilindi: **+${reward.toLocaleString()} монет**!`);
});

// Bank tizimi
bot.hears(/^(банк|bank) (положить|депозит|depozit) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[3]);
  if (!amount || amount <= 0 || u.balance < amount) return ctx.reply("❌ Balansda yetarli pul yo'q!");

  u.balance -= amount;
  u.bank += amount;
  await ctx.reply(`🏦 Bankka **${amount.toLocaleString()} монет** qo'yildi.\n💰 Bankdagi jami: **${u.bank.toLocaleString()}**`);
});

bot.hears(/^(банк|bank) (снять|yechish) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[3]);
  if (!amount || amount <= 0 || u.bank < amount) return ctx.reply("❌ Bankingizda yetarli pul yo'q!");

  u.bank -= amount;
  u.balance += amount;
  await ctx.reply(`🏦 Bankdan **${amount.toLocaleString()} монет** yechib olindi.\n💳 Yoninzgdagi pul: **${u.balance.toLocaleString()}**`);
});

// ==================== PIRAMIDA 2x2 ====================

bot.hears(/^(пирамида|pyramid|piramida) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);

  if (!bet || bet < 100) return ctx.reply("❌ Eng kam stavka: 100!");
  if (u.balance < bet) return ctx.reply("❌ Balansda yetarli pul yo'q!");

  u.balance -= bet;
  const userId = ctx.from.id;

  activePyramidGames.set(userId, {
    bet,
    level: 1,
    mults: [1.8, 3.2, 6.0, 12.0],
    trap: Math.floor(Math.random() * 2)
  });

  await renderPyramid2x2(ctx, userId);
});

async function renderPyramid2x2(ctx, userId) {
  const g = activePyramidGames.get(userId);
  if (!g) return;

  const buttons = [[
    Markup.button.callback("❓ 1-Kletka", "pyr2_0"),
    Markup.button.callback("❓ 2-Kletka", "pyr2_1")
  ]];

  const curWin = Math.floor(g.bet * (g.level === 1 ? 1 : g.mults[g.level - 2]));
  if (g.level > 1) {
    buttons.push([Markup.button.callback(`💰 Yutuqni olish (${curWin.toLocaleString()})`, "pyr2_take")]);
  }

  const text = `🔺 **PIRAMIDA 2x2 (Bosqich ${g.level}/4)**\n\n🎯 Mnojitel: **x${g.mults[g.level - 1]}**\n💵 Joriy yutuq: **${curWin.toLocaleString()} монет**\n\nTuzoqqa tushmasdan to'g'ri kletkani tanlang:`;

  if (ctx.callbackQuery) await ctx.editMessageText(text, Markup.inlineKeyboard(buttons));
  else await ctx.reply(text, Markup.inlineKeyboard(buttons));
}

bot.action(/^pyr2_(\d+)$/, async (ctx) => {
  const userId = ctx.from.id;
  const g = activePyramidGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ O'yin yakunlangan!", { show_alert: true });

  const choice = Number(ctx.match[1]);

  if (choice === g.trap) {
    const u = ecoUser(ctx);
    u.losses += 1;
    activePyramidGames.delete(userId);
    return ctx.editMessageText(`💥 **BOMBA!** Siz tuzoqqa tushdingiz va **-${g.bet.toLocaleString()} монет** boy berdingiz.`);
  }

  if (g.level >= 4) {
    const win = Math.floor(g.bet * g.mults[3]);
    const u = ecoUser(ctx);
    u.balance += win;
    u.wins += 1;
    addExp(u, 50);
    activePyramidGames.delete(userId);
    return ctx.editMessageText(`🏆 **G'ALABA!** Piramidaning cho'qqisiga yetdingiz va **+${win.toLocaleString()} монет** yutdingiz!`);
  }

  g.level += 1;
  g.trap = Math.floor(Math.random() * 2);
  await renderPyramid2x2(ctx, userId);
});

bot.action("pyr2_take", async (ctx) => {
  const userId = ctx.from.id;
  const g = activePyramidGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ O'yin yakunlangan!", { show_alert: true });

  const win = Math.floor(g.bet * g.mults[g.level - 2]);
  const u = ecoUser(ctx);
  u.balance += win;
  u.wins += 1;
  activePyramidGames.delete(userId);
  await ctx.editMessageText(`🤑 **YUTUQ YIG'ILDI!** Siz **+${win.toLocaleString()} монет** oldingiz!`);
});

// ==================== CRASH (70% LOSS RISK) ====================

bot.hears(/^(краш|crash|krash) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);

  if (!bet || bet < 100) return ctx.reply("❌ Eng kam stavka: 100!");
  if (u.balance < bet) return ctx.reply("❌ Balansda yetarli pul yo'q!");

  u.balance -= bet;

  // 70% Yutqazish ehtimoli
  const isCrash = Math.random() < 0.70;
  if (isCrash) {
    u.losses += 1;
    const crashPoint = (Math.random() * 0.9 + 1.0).toFixed(2);
    return ctx.reply(`📈 **CRASH GAME**\n\n💥 Raketa **x${crashPoint}** da portladi!\n📉 Siz **-${bet.toLocaleString()} монет** yo'qotdingiz.`);
  } else {
    u.wins += 1;
    const winMult = (Math.random() * 2.8 + 1.3).toFixed(2);
    const winAmount = Math.floor(bet * winMult);
    u.balance += winAmount;
    addExp(u, 20);
    return ctx.reply(`📈 **CRASH GAME**\n\n🚀 Raketa **x${winMult}** gacha uchdi!\n🎉 Siz **+${winAmount.toLocaleString()} монет** yutib oldingiz!`);
  }
});

// ==================== TRADING ====================

bot.hears(/^(трейдинг|trade|treyding) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);

  if (!bet || bet < 100) return ctx.reply("❌ Eng kam stavka: 100!");
  if (u.balance < bet) return ctx.reply("❌ Balansda yetarli pul yo'q!");

  u.balance -= bet;

  const isWin = Math.random() < 0.40;
  if (isWin) {
    u.wins += 1;
    const mult = (Math.random() * 1.6 + 1.2).toFixed(2);
    const winAmount = Math.floor(bet * mult);
    u.balance += winAmount;
    addExp(u, 15);
    return ctx.reply(`📊 **TRADING (BIRJA)**\n\n🟢 Grafik ko'tarildi (x${mult})!\n🎉 Sdelka yopildi: **+${winAmount.toLocaleString()} монет**.`);
  } else {
    u.losses += 1;
    return ctx.reply(`📊 **TRADING (BIRJA)**\n\n🔴 Stop-Loss ishladi! Grafik pastga sho'ng'idi.\n📉 Yo'qotish: **-${bet.toLocaleString()} монет**.`);
  }
});

// ==================== MINES 7x7 ====================

bot.hears(/^(мина|мины|mina|mines) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);

  if (!bet || bet < 500) return ctx.reply("❌ Eng kam stavka: 500!");
  if (u.balance < bet) return ctx.reply("❌ Balansda yetarli pul yo'q!");

  u.balance -= bet;
  const userId = ctx.from.id;

  const mines = new Set();
  while (mines.size < 10) mines.add(Math.floor(Math.random() * 49));

  activeMinesGames.set(userId, { bet, mines, revealed: new Set(), mult: 1.0 });
  await renderMinesGrid(ctx, userId, "💣 **MINALI MAYDON (7x7)**");
});

async function renderMinesGrid(ctx, userId, title) {
  const g = activeMinesGames.get(userId);
  if (!g) return;

  const buttons = [];
  for (let r = 0; r < 7; r++) {
    const row = [];
    for (let c = 0; c < 7; c++) {
      const idx = r * 7 + c;
      if (g.revealed.has(idx)) row.push(Markup.button.callback("💎", "mines_ignore"));
      else row.push(Markup.button.callback("🟦", `mine_step_${idx}`));
    }
    buttons.push(row);
  }

  const curWin = Math.floor(g.bet * g.mult);
  buttons.push([Markup.button.callback(`💰 Yutuqni olish (${curWin.toLocaleString()})`, "mines_take")]);

  const text = `${title}\n\n📊 Mnojitel: **x${g.mult.toFixed(2)}**\n💵 Joriy yutuq: **${curWin.toLocaleString()} монет**`;

  if (ctx.callbackQuery) await ctx.editMessageText(text, Markup.inlineKeyboard(buttons));
  else await ctx.reply(text, Markup.inlineKeyboard(buttons));
}

bot.action(/^mine_step_(\d+)$/, async (ctx) => {
  const userId = ctx.from.id;
  const g = activeMinesGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ O'yin yakunlangan!", { show_alert: true });

  const idx = Number(ctx.match[1]);

  if (g.mines.has(idx)) {
    const u = ecoUser(ctx);
    u.losses += 1;
    activeMinesGames.delete(userId);
    return ctx.editMessageText(`💥 **MINA PORTLADI!** Siz **-${g.bet.toLocaleString()} монет** boy berdingiz.`);
  }

  g.revealed.add(idx);
  g.mult += 0.30;
  await renderMinesGrid(ctx, userId, "💣 **MINALI MAYDON (7x7)**");
});

bot.action("mines_take", async (ctx) => {
  const userId = ctx.from.id;
  const g = activeMinesGames.get(userId);
  if (!g) return ctx.answerCbQuery("❌ O'yin yakunlangan!", { show_alert: true });

  const win = Math.floor(g.bet * g.mult);
  const u = ecoUser(ctx);
  u.balance += win;
  u.wins += 1;
  addExp(u, 30);
  activeMinesGames.delete(userId);
  await ctx.editMessageText(`🤑 **YUTUQ OLINDI!** Siz **+${win.toLocaleString()} монет** yutdingiz!`);
});

bot.action("mines_ignore", (ctx) => ctx.answerCbQuery());

// ==================== ALL 21 MINI GAMES ENGINE ====================

function playStandardGame(ctx, bet, winRate, winMult, title) {
  const u = ecoUser(ctx);
  if (!bet || bet <= 0 || u.balance < bet) return ctx.reply("❌ Balansda yetarli pul yo'q!");

  u.balance -= bet;
  if (Math.random() < winRate) {
    const prize = Math.floor(bet * winMult);
    u.balance += prize;
    u.wins += 1;
    addExp(u, 10);
    return ctx.reply(`${title}\n🎉 **G'ALABA!** Siz **+${prize.toLocaleString()} монет** yutib oldingiz!`);
  } else {
    u.losses += 1;
    return ctx.reply(`${title}\n📉 **YUTQAZDINGIZ!** Siz **-${bet.toLocaleString()} монет** yo'qotdingiz.`);
  }
}

bot.hears(/^(казино|casino) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.35, 2.0, "🎰 **KAZINO**"));
bot.hears(/^(кубик|dice) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.35, 2.0, "🎲 **KUBIK**"));
bot.hears(/^(слоты|slots) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.25, 3.5, "🎰 **SLOTLAR**"));
bot.hears(/^(монетка|flip) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.40, 1.9, "🪙 **TANGATASTASH**"));
bot.hears(/^(рулетка) (красное|черное) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[3]), 0.40, 1.95, "🎡 **RULETKA**"));
bot.hears(/^(дартс|darts) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.30, 2.2, "🎯 **DARTS**"));
bot.hears(/^(баскетбол|basket) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.30, 2.2, "🏀 **BASKETBOL**"));
bot.hears(/^(футбол|football) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.35, 2.0, "⚽ **FUTBOL**"));
bot.hears(/^(покер|poker) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.30, 2.5, "🃏 **POKER**"));
bot.hears(/^(блекджек|bj) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.35, 2.0, "🂡 **BLEKDJEK**"));
bot.hears(/^(сейф|safe) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.18, 5.5, "🔐 **SEYF NI OCHISH**"));
bot.hears(/^(колесо|wheel) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.30, 2.5, "🎡 **OMAD G'ATIRAGI**"));
bot.hears(/^(дуэль|duel) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.40, 1.9, "⚔️ **DUEL**"));
bot.hears(/^(скачки|race) (\d+)$/i, ctx => playStandardGame(ctx, Number(ctx.match[2]), 0.25, 3.0, "🐎 **OT CHAPISH (SKACHKI)**"));

// ==================== PROFILE, TOP & MENU ====================

bot.hears(/^(богатые|топ|top)$/i, async (ctx) => {
  if (economyUsers.size === 0) return ctx.reply("📊 Ro'yxat hali bo'sh!");
  const usersArr = Array.from(economyUsers.values());
  usersArr.sort((a, b) => (b.balance + b.bank) - (a.balance + a.bank));

  let text = `🏆 **TOP-10 ENG BOY O'YINCHILAR**\n\n`;
  usersArr.slice(0, 10).forEach((u, i) => {
    text += `${i + 1}. **${ecoName(u)}** — **${(u.balance + u.bank).toLocaleString()} монет** (Lvl: ${u.level})\n`;
  });
  await ctx.reply(text);
});

bot.hears(/^(баланс|balans)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(`💰 **MABLAG'LARINGIZ:**\n\n💳 Hamyonda: **${u.balance.toLocaleString()} монет**\n🏦 Bankda: **${u.bank.toLocaleString()} монет**`);
});

bot.hears(/^(профиль|проф|profil)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `👤 **FOYDALANUVCHI PROFILI:**\n\n` +
    `👨‍💼 Ism: **${ecoName(u)}**\n` +
    `🆔 ID: \`${u.id}\`\n` +
    `⭐ Daraja: **${u.level} LVL** (${u.experience}/${u.level * 100} EXP)\n\n` +
    `💰 Hamyon: **${u.balance.toLocaleString()} монет**\n` +
    `🏦 Bank: **${u.bank.toLocaleString()} монет**\n\n` +
    `🚘 Mashina: **${u.car}**\n` +
    `🏠 Uy: **${u.house}**\n` +
    `📱 Telefon: **${u.phone}**\n` +
    `🏢 Biznes: **${u.business}** (+${u.bizIncome.toLocaleString()}/s)\n\n` +
    `📊 O'yin statistikasi: 🟢 ${u.wins} / 🔴 ${u.losses}`
  );
});

bot.hears(/^(игры|меню|menu|start|старт|oyinlar)$/i, async (ctx) => {
  await ctx.reply(
    `📜 **BARCHA O'YINLAR VA BUYRUQLAR RO'YXATI**\n\n` +
    `🎮 **Mini-O'yinlar:**\n` +
    `• \`краш [stavka]\` | \`трейдинг [stavka]\`\n` +
    `• \`пирамида [stavka]\` | \`мина [stavka]\` (7x7)\n` +
    `• \`казино [stavka]\` | \`слоты [stavka]\`\n` +
    `• \`кубик [stavka]\` | \`монетка [stavka]\`\n` +
    `• \`рулетка красное/черное [stavka]\`\n` +
    `• \`дартс [stavka]\` | \`баскетбол [stavka]\`\n` +
    `• \`футбол [stavka]\` | \`покер [stavka]\`\n` +
    `• \`блекджек [stavka]\` | \`сейф [stavka]\`\n` +
    `• \`колесо [stavka]\` | \`дуэль [stavka]\` | \`скачки [stavka]\`\n\n` +
    `💼 **Daromad va Mehnat:**\n` +
    `• \`работа\` — Ishlab pul topish\n` +
    `• \`jinoyat\` — O'g'rilik/risk qilish\n` +
    `• \`бонус\` — Kunlik tekin bonus\n` +
    `• \`pribil\` — Biznesdan foyda yig'ish\n\n` +
    `🛒 **Bozor va Mulklar:**\n` +
    `• \`magazin\` — Magazin menyusi\n` +
    `• \`magazin mashina\` / \`magazin uy\` / \`magazin biznes\`\n\n` +
    `🏦 **Bank va Moliya:**\n` +
    `• \`bank depozit [summa]\` | \`bank yechish [summa]\`\n` +
    `• \`баланс\` | \`профиль\` | \`богатые\``
  );
});

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🚀 BOT IS LIVE WITH MASSIVE CODEBASE AND FULL FEATURES!");
  } catch (err) {
    console.error("Start Error:", err);
  }
}

startBot();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
