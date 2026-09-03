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
const ADMINS = ["123456789"]; // O'z Telegram ID ingizni shu yerga yozing

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf8");
      return new Map(JSON.parse(data));
    }
  } catch (e) {
    console.error("DB o'qishda xatolik:", e);
  }
  return new Map();
}

function saveDB() {
  try {
    const data = JSON.stringify(Array.from(economyUsers.entries()));
    fs.writeFileSync(DB_FILE, data, "utf8");
  } catch (e) {
    console.error("DB saqlashda xatolik:", e);
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
      business: "Yo'q",
      bizIncome: 0,
      car: "Yo'q",
      house: "Yo'q",
      phone: "Yo'q",
      yacht: "Yo'q",
      helicopter: "Yo'q",
      plane: "Yo'q",
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
  { name: "Talabalar yotoqxonasi", price: 10000000 },
  { name: "1-xonali Kvartira", price: 40000000 },
  { name: "Shahar tashqarisidagi Hovli", price: 150000000 },
  { name: "Elit Kottej", price: 500000000 },
  { name: "Skyline Penthouse", price: 1500000000 },
  { name: "Shaxsiy Orol va Qasr", price: 5000000000 }
];

const BIZ = [
  { name: "Fast-Food shoxobchasi", price: 100000000, income: 5000000 },
  { name: "Katta Supermarket", price: 400000000, income: 22000000 },
  { name: "IT Startap Kompaniya", price: 1200000000, income: 75000000 },
  { name: "Neft Quduqlari va Zavod", price: 5000000000, income: 350000000 }
];

const PHONES = [
  { name: "Nokia 3310", price: 500000 },
  { name: "Redmi Note 12", price: 4000000 },
  { name: "iPhone 15 Pro Max", price: 22000000 },
  { name: "Vertu Diamond Signature", price: 100000000 }
];

// ==================== ASOSIY MENYU & START ====================

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
    `🤖 **MEGA ECONOMY EMPIRE BOT (ULTIMATE ELITE EDITION)**\n\n` +
    `👤 \`профиль\` — Shaxsiy kabinet va mulklar\n` +
    `💰 \`баланс\` — Naqd, bank va kreditlar\n` +
    `🏦 \`банк [summa]\` / \`снять [summa]\`\n` +
    `💳 \`kredit [summa]\` / \`kredit tola\`\n` +
    `🎁 \`бонус\` — Kunlik mega-mukofot\n` +
    `💼 \`работа\` — Ishlash va tajriba yig'ish\n` +
    `🦹‍♂️ \`грабеж\` / \`криминал\` — Tavakkal jinoyatlar\n` +
    `🏢 \`бизнесы\` — Biznes sotib olish\n` +
    `🛒 \`магазин\` — Mashina, uylar, telefonlar\n` +
    `👥 \`реф\` — Referal tizimi\n` +
    `🏆 \`топ\` — Dunyoning eng badavlat odamlari\n` +
    `💸 \`передать [ID] [summa]\` — Pul o'tkazish\n` +
    `⚙️ \`nik [ism]\` — Nikni o'zgartirish\n\n` +
    `🎮 **Mini-o'yinlar:**\n` +
    `🔺 \`пирамида [stavka]\`\n` +
    `💣 \`мина [stavka]\` (7x7 Interactive)\n` +
    `📈 \`трейдинг [stavka]\`\n` +
    `🎲 \`кости [stavka]\`\n` +
    `🎰 \`слоты [stavka]\`\n\n` +
    (ADMINS.includes(String(ctx.from.id)) ? `👑 \`admin\` — Admin boshqaruv paneli` : ""),
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^(баланс|balance|бал)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `💰 **Sizning kapitalingiz:**\n\n` +
    `💵 Naqd pul: **$${u.balance.toLocaleString()}**\n` +
    `🏦 Bankda: **$${u.bank.toLocaleString()}**\n` +
    `💳 Kredit qarzi: **$${u.credit.toLocaleString()}**`,
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^(профиль|проф|profile)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `👤 **FOYDALANUVCHI PROFILI:**\n\n` +
    `👨‍💼 Ism: **${ecoName(u)}**\n` +
    `🆔 ID: \`${u.id}\`\n` +
    `⭐ Daraja: **${u.level} LVL** (${u.experience}/${u.level * 200} XP)\n\n` +
    `💵 Naqd: **$${u.balance.toLocaleString()}**\n` +
    `🏦 Bank: **$${u.bank.toLocaleString()}**\n\n` +
    `🚘 Mashina: **${u.car}**\n` +
    `🏠 Uy: **${u.house}**\n` +
    `📱 Telefon: **${u.phone}**\n` +
    `🏢 Biznes: **${u.business}** (+$${u.bizIncome.toLocaleString()}/soat)\n` +
    `👥 Referallar soni: **${u.referralsCount} ta**\n\n` +
    `🏆 G'alabalar: ${u.wins} | Mag'lubiyatlar: ${u.losses}`,
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^nik\s+(.+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const newNick = ctx.match[1].trim();
  if (newNick.length > 25) return ctx.reply("❌ Nik 25 ta belgidan oshmasligi kerak!");
  u.nickname = newNick;
  saveDB();
  await ctx.reply(`✅ Nikosizingiz muvaffaqiyatli o'zgartirildi: **${newNick}**`);
});

bot.hears(/^(реф|referral|referans)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const botUsername = ctx.botInfo.username;
  const refLink = `https://t.me/${botUsername}?start=ref_${u.id}`;
  await ctx.reply(
    `👥 **REFERAL TIZIMI**\n\n` +
    `Do'stlaringizni taklif qiling va har bir taklif qilingan o'yinchi uchun **$100,000** mukofot oling!\n\n` +
    `🔗 Sizning shaxsiy havolangiz:\n\`${refLink}\`\n\n` +
    `📊 Taklif qilgan do'stlaringiz: **${u.referralsCount} ta**`,
    { parse_mode: "Markdown" }
  );
});

// ==================== BANK & KREDIT ====================

bot.hears(/^банк\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[1]);
  if (!amount || amount <= 0) return ctx.reply("❌ Summani to'g'ri kiriting!");
  if (u.balance < amount) return ctx.reply("❌ Naqd pulingiz yetarli emas!");

  u.balance -= amount;
  u.bank += amount;
  saveDB();
  await ctx.reply(`🏦 Bankga **$${amount.toLocaleString()}** qo'shildi!`);
});

bot.hears(/^снять\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[1]);
  if (!amount || amount <= 0) return ctx.reply("❌ Summani to'g'ri kiriting!");
  if (u.bank < amount) return ctx.reply("❌ Bankda buncha pul yo'q!");

  u.bank -= amount;
  u.balance += amount;
  saveDB();
  await ctx.reply(`💵 Bankdan **$${amount.toLocaleString()}** yechib olindi!`);
});

bot.hears(/^kredit\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[1]);
  if (u.credit > 0) return ctx.reply("❌ Sizda allaqachon yopilmagan kredit bor!");
  if (amount <= 0 || amount > 1000000000) return ctx.reply("❌ Kredit miqdori 1 dan $1,000,000,000 gacha bo'lishi mumkin!");

  u.credit = Math.floor(amount * 1.3);
  u.balance += amount;
  saveDB();
  await ctx.reply(`💳 **$${amount.toLocaleString()}** miqdorida kredit berildi. Qaytarish summasi (30% foiz bilan): **$${u.credit.toLocaleString()}**`);
});

bot.hears(/^kredit\s+tola$/i, async (ctx) => {
  const u = ecoUser(ctx);
  if (u.credit <= 0) return ctx.reply("❌ Sizda kredit qarzi yo'q!");
  if (u.balance < u.credit) return ctx.reply(`❌ Kreditni yopish uchun naqd pulingiz yetarli emas! Kerak: $${u.credit.toLocaleString()}`);

  u.balance -= u.credit;
  u.credit = 0;
  saveDB();
  await ctx.reply("✅ Kredit qarzingiz to'liq yopildi!");
});

// ==================== ISHLASH & BONUSLAR ====================

bot.hears(/^(бонус|bonus)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastBonus < 86400000) {
    const hoursLeft = Math.ceil((86400000 - (now - u.lastBonus)) / 3600000);
    return ctx.reply(`⏳ Kunlik bonusni yana ${hoursLeft} soatdan keyin olishingiz mumkin!`);
  }

  const reward = 100000 * u.level;
  u.balance += reward;
  u.lastBonus = now;
  addExp(u, 40);
  saveDB();
  await ctx.reply(`🎁 Kunlik mega-bonus olindi: **+$${reward.toLocaleString()}**!`);
});

bot.hears(/^(работа|work)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastWork < 180000) {
    return ctx.reply("⏳ Charchagansiz! 3 daqiqadan keyin yana ishga chiqishingiz mumkin.");
  }

  const earned = Math.floor(Math.random() * 50000) + 20000 * u.level;
  u.balance += earned;
  u.lastWork = now;
  addExp(u, 25);
  saveDB();
  await ctx.reply(`💼 Korporativ smena yakunlandi. Ish haqi: **+$${earned.toLocaleString()}**!`);
});

bot.hears(/^(грабеж|rob|криминал)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastRob < 600000) {
    return ctx.reply("⏳ Politsiya qidirmoqda! 10 daqiqa kuting.");
  }

  u.lastRob = now;
  const success = Math.random() < 0.45;
  if (success) {
    const loot = Math.floor(Math.random() * 200000) + 50000;
    u.balance += loot;
    addExp(u, 50);
    saveDB();
    await ctx.reply(`🦹‍♂️ Muvaffaqiyatli jinoyat sodir etildi! O'lja: **+$${loot.toLocaleString()}**`);
  } else {
    const fine = Math.floor(Math.random() * 100000) + 25000;
    u.balance = Math.max(0, u.balance - fine);
    saveDB();
    await ctx.reply(`🚨 Politsiya qo'lga oldi va jarima soldi: **-$${fine.toLocaleString()}**`);
  }
});

bot.hears(/^(топ|рейтинг|top)$/i, async (ctx) => {
  ecoUser(ctx);
  const usersArr = Array.from(economyUsers.values());
  usersArr.sort((a, b) => (b.balance + b.bank) - (a.balance + a.bank));

  let text = `🏆 **FORBES DUNYONING ENG BADAVLAT ODAMLARI**\n\n`;
  usersArr.slice(0, 10).forEach((user, i) => {
    text += `${i + 1}. **${ecoName(user)}** — $${(user.balance + user.bank).toLocaleString()}\n`;
  });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^передать\s+(\d+)\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const targetId = ctx.match[1];
  const amount = Number(ctx.match[2]);

  if (amount <= 0 || u.balance < amount) return ctx.reply("❌ Mablag' yetarli emas yoki summa xato!");
  if (!economyUsers.has(targetId)) return ctx.reply("❌ Bunday ID egasi topilmadi!");

  const targetUser = economyUsers.get(targetId);
  u.balance -= amount;
  targetUser.balance += amount;
  saveDB();

  await ctx.reply(`✅ Muvaffaqiyatli ravishda \`${targetId}\` ga **$${amount.toLocaleString()}** o'tkazildi!`, { parse_mode: "Markdown" });
});

// ==================== DO'KON & BIZNES ====================

bot.hears(/^(магазин|shop)$/i, async (ctx) => {
  let text = `🛒 **ELIT MAHSULOTLAR SUPER DO'KONI**\n\n🚗 **Mashinalar:**\n`;
  CARS.forEach((c, i) => { text += `${i+1}. ${c.name} — $${c.price.toLocaleString()} (\`купить маш ${i+1}\`)\n`; });
  text += `\n🏠 **Uylar:**\n`;
  HOUSES.forEach((h, i) => { text += `${i+1}. ${h.name} — $${h.price.toLocaleString()} (\`купить дом ${i+1}\`)\n`; });
  text += `\n📱 **Telefonlar:**\n`;
  PHONES.forEach((p, i) => { text += `${i+1}. ${p.name} — $${p.price.toLocaleString()} (\`купить тел ${i+1}\`)\n`; });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^(бизнесы|business)$/i, async (ctx) => {
  let text = `🏢 **BIZNESLAR IMPERIYASI**\n\n`;
  BIZ.forEach((b, i) => { text += `${i+1}. ${b.name} — Narxi: $${b.price.toLocaleString()} | Daromad: +$${b.income.toLocaleString()}/soat (\`купить биз ${i+1}\`)\n`; });
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^купить маш (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!CARS[idx]) return ctx.reply("❌ Bunday mashina mavjud emas!");
  const car = CARS[idx];
  if (u.balance < car.price) return ctx.reply("❌ Pulingiz yetarli emas!");

  u.balance -= car.price;
  u.car = car.name;
  saveDB();
  await ctx.reply(`🚗 Tabriklaymiz! Siz yangi **${car.name}** mashinasini xarid qildingiz!`);
});

bot.hears(/^купить дом (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!HOUSES[idx]) return ctx.reply("❌ Bunday uy mavjud emas!");
  const house = HOUSES[idx];
  if (u.balance < house.price) return ctx.reply("❌ Pulingiz yetarli emas!");

  u.balance -= house.price;
  u.house = house.name;
  saveDB();
  await ctx.reply(`🏠 Tabriklaymiz! Siz yangi **${house.name}** xarid qildingiz!`);
});

bot.hears(/^купить тел (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!PHONES[idx]) return ctx.reply("❌ Bunday telefon mavjud emas!");
  const phone = PHONES[idx];
  if (u.balance < phone.price) return ctx.reply("❌ Pulingiz yetarli emas!");

  u.balance -= phone.price;
  u.phone = phone.name;
  saveDB();
  await ctx.reply(`📱 Tabriklaymiz! Siz yangi **${phone.name}** xarid qildingiz!`);
});

bot.hears(/^купить биз (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const idx = Number(ctx.match[1]) - 1;
  if (!BIZ[idx]) return ctx.reply("❌ Bunday biznes mavjud emas!");
  const biz = BIZ[idx];
  if (u.balance < biz.price) return ctx.reply("❌ Pulingiz yetarli emas!");

  u.balance -= biz.price;
  u.business = biz.name;
  u.bizIncome = biz.income;
  saveDB();
  await ctx.reply(`🏢 Tabriklaymiz! Siz **${biz.name}** biznesini sotib oldingiz!`);
});

// ==================== MINI O'YINLAR ====================

bot.hears(/^пирамида\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("❌ Stavkani to'g'ri kiriting!");
  if (u.balance < bet) return ctx.reply("❌ Balansingiz yetarli emas!");

  u.balance -= bet;
  saveDB();

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("💎 Katak 1", `pyr_${ctx.from.id}_${bet}_0`), Markup.button.callback("💎 Katak 2", `pyr_${ctx.from.id}_${bet}_1`)],
    [Markup.button.callback("💎 Katak 3", `pyr_${ctx.from.id}_${bet}_2`), Markup.button.callback("💎 Katak 4", `pyr_${ctx.from.id}_${bet}_3`)]
  ]);

  await ctx.reply(`🔺 **PIRAMIDA O'YINI**\nStavka: $${bet.toLocaleString()}\nOmadli katakni tanlang (2x yutuq):`, { parse_mode: "Markdown", ...keyboard });
});

bot.action(/^pyr_(\d+)_(\d+)_(\d+)$/, async (ctx) => {
  if (String(ctx.from.id) !== ctx.match[1]) return ctx.answerCbQuery("❌ Bu o'yin sizniki emas!", { show_alert: true });
  const bet = Number(ctx.match[2]);
  const chosen = Number(ctx.match[3]);
  const u = ecoUser(ctx);
  const winIdx = Math.floor(Math.random() * 4);

  let text = "";
  if (chosen === winIdx) {
    const prize = bet * 2;
    u.balance += prize;
    u.wins++;
    addExp(u, 15);
    saveDB();
    text = `🎉 **YUTUQ!**\n\n💰 Mukofot: **+$${prize.toLocaleString()}**`;
  } else {
    u.losses++;
    saveDB();
    text = `💥 **YUTQAZDINGIZ!**\n\n💸 Yo'qotish: **-$${bet.toLocaleString()}**`;
  }
  await ctx.editMessageText(text, { parse_mode: "Markdown" }).catch(() => {});
  await ctx.answerCbQuery();
});

bot.hears(/^мина\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("❌ Stavkani to'g'ri kiriting!");
  if (u.balance < bet) return ctx.reply("❌ Balansingiz yetarli emas!");

  u.balance -= bet;
  u.mineGrid = { bet, opened: 0 };
  saveDB();

  const rows = [];
  for (let r = 0; r < 7; r++) {
    const rowBtns = [];
    for (let c = 0; c < 7; c++) {
      rowBtns.push(Markup.button.callback("⬜", `mine_${ctx.from.id}_${r}_${c}`));
    }
    rows.push(rowBtns);
  }
  const keyboard = Markup.inlineKeyboard(rows);

  await ctx.reply(`💣 **7x7 MINA DALASI**\nStavka: $${bet.toLocaleString()}\nXavfsiz katakni tanlang:`, { parse_mode: "Markdown", ...keyboard });
});

bot.action(/^mine_(\d+)_(\d+)_(\d+)$/, async (ctx) => {
  const targetId = ctx.match[1];
  if (String(ctx.from.id) !== targetId) return ctx.answerCbQuery("❌ Bu o'yin sizniki emas!", { show_alert: true });
  
  const u = ecoUser(ctx);
  if (!u.mineGrid) return ctx.answerCbQuery("❌ O'yin topilmadi!", { show_alert: true });

  const isBomb = Math.random() < 0.22;
  if (isBomb) {
    u.losses++;
    const lostBet = u.mineGrid.bet;
    u.mineGrid = null;
    saveDB();
    await ctx.editMessageText(`💥 **BOOM! Mina portladi!**\n\n💸 Yo'qotish: **-$${lostBet.toLocaleString()}**`, { parse_mode: "Markdown" }).catch(() => {});
    return ctx.answerCbQuery("Mina portladi!");
  } else {
    u.mineGrid.opened++;
    const multiplier = 1 + (u.mineGrid.opened * 0.35);
    const currentPrize = Math.floor(u.mineGrid.bet * multiplier);
    saveDB();
    await ctx.answerCbQuery(`+$${currentPrize.toLocaleString()} (Ajoyib!)`);
  }
});

bot.hears(/^трейдинг\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("❌ Stavkani kiriting!");
  if (u.balance < bet) return ctx.reply("❌ Balansingiz yetarli emas!");

  u.balance -= bet;
  saveDB();

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("📈 LONG (O'sadi)", `tr_${ctx.from.id}_${bet}_up`), Markup.button.callback("📉 SHORT (Tushadi)", `tr_${ctx.from.id}_${bet}_down`)]
  ]);

  await ctx.reply(`📈 **WALL STREET TREYDING**\nStavka: $${bet.toLocaleString()}\nBozor yo'nalishini tanlang:`, { parse_mode: "Markdown", ...keyboard });
});

bot.action(/^tr_(\d+)_(\d+)_([a-z]+)$/, async (ctx) => {
  if (String(ctx.from.id) !== ctx.match[1]) return ctx.answerCbQuery("❌ Bu o'yin sizniki emas!", { show_alert: true });
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
    text = `🚀 **Muvaffaqiyatli treyd!**\n\n💰 Foyda: **+$${prize.toLocaleString()}**`;
  } else {
    u.losses++;
    saveDB();
    text = `📉 **Likvidatsiya! Bozor teskari ketdi.**\n\n💸 Yo'qotish: **-$${bet.toLocaleString()}**`;
  }
  await ctx.editMessageText(text, { parse_mode: "Markdown" }).catch(() => {});
  await ctx.answerCbQuery();
});

bot.hears(/^кости\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("❌ Stavkani kiriting!");
  if (u.balance < bet) return ctx.reply("❌ Balansingiz yetarli emas!");

  u.balance -= bet;
  saveDB();

  const userDice = Math.floor(Math.random() * 6) + 1;
  const botDice = Math.floor(Math.random() * 6) + 1;

  let text = `🎲 **ZAR O'YINI (KOSTI)**\n\nSiz tashladingiz: **${userDice}**\nBot tashladi: **${botDice}**\n\n`;
  if (userDice > botDice) {
    const prize = bet * 2;
    u.balance += prize;
    u.wins++;
    addExp(u, 12);
    text += `🎉 G'alaba! Mukofot: **+$${prize.toLocaleString()}**`;
  } else if (userDice === botDice) {
    u.balance += bet;
    text += `🤝 Durang! Stavka qaytarildi.`;
  } else {
    u.losses++;
    text += `💥 Mag'lubiyat! Yo'qotish: **-$${bet.toLocaleString()}**`;
  }
  saveDB();
  await ctx.reply(text, { parse_mode: "Markdown" });
});

bot.hears(/^слоты\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (!bet || bet <= 0) return ctx.reply("❌ Stavkani kiriting!");
  if (u.balance < bet) return ctx.reply("❌ Balansingiz yetarli emas!");

  u.balance -= bet;
  saveDB();

  const symbols = ["🍒", "🍋", "🍊", "💎", "7️⃣"];
  const s1 = symbols[Math.floor(Math.random() * symbols.length)];
  const s2 = symbols[Math.floor(Math.random() * symbols.length)];
  const s3 = symbols[Math.floor(Math.random() * symbols.length)];

  let text = `🎰 **CASINO SLOTS**\n\n[ ${s1} | ${s2} | ${s3} ]\n\n`;
  if (s1 === s2 && s2 === s3) {
    const prize = s1 === "7️⃣" ? bet * 12 : bet * 6;
    u.balance += prize;
    u.wins++;
    addExp(u, 30);
    text += `JACKPOT! Ulkan yutuq: **+$${prize.toLocaleString()}**`;
  } else if (s1 === s2 || s2 === s3 || s1 === s3) {
    const prize = Math.floor(bet * 1.6);
    u.balance += prize;
    u.wins++;
    addExp(u, 12);
    text += `🎉 Ikki bir xil! Yutuq: **+$${prize.toLocaleString()}**`;
  } else {
    u.losses++;
    text += `💥 Yutqazdingiz! Yo'qotish: **-$${bet.toLocaleString()}**`;
  }
  saveDB();
  await ctx.reply(text, { parse_mode: "Markdown" });
});

// ==================== ADMIN PANEL ====================

bot.hears(/^admin$/i, async (ctx) => {
  if (!ADMINS.includes(String(ctx.from.id))) return;
  await ctx.reply(
    `👑 **ADMIN BOSHQARUV PANELI**\n\n` +
    `➕ \`addbal [ID] [summa]\` — Foydalanuvchiga pul berish\n` +
    `➖ \`delbal [ID] [summa]\` — Foydalanuvchidan pul olish\n` +
    `📢 \`sendall [matn]\` — Hammaga xabar yuborish`,
    { parse_mode: "Markdown" }
  );
});

bot.hears(/^addbal\s+(\d+)\s+(\d+)$/i, async (ctx) => {
  if (!ADMINS.includes(String(ctx.from.id))) return;
  const targetId = ctx.match[1];
  const amount = Number(ctx.match[2]);

  if (!economyUsers.has(targetId)) return ctx.reply("❌ Foydalanuvchi topilmadi!");
  const targetUser = economyUsers.get(targetId);
  targetUser.balance += amount;
  saveDB();
  await ctx.reply(`✅ \`${targetId}\` foydalanuvchiga $${amount.toLocaleString()} qo'shildi!`, { parse_mode: "Markdown" });
});

bot.hears(/^delbal\s+(\d+)\s+(\d+)$/i, async (ctx) => {
  if (!ADMINS.includes(String(ctx.from.id))) return;
  const targetId = ctx.match[1];
  const amount = Number(ctx.match[2]);

  if (!economyUsers.has(targetId)) return ctx.reply("❌ Foydalanuvchi topilmadi!");
  const targetUser = economyUsers.get(targetId);
  targetUser.balance = Math.max(0, targetUser.balance - amount);
  saveDB();
  await ctx.reply(`✅ \`${targetId}\` foydalanuvchidan $${amount.toLocaleString()} yechib olindi!`, { parse_mode: "Markdown" });
});

bot.hears(/^sendall\s+(.+)$/i, async (ctx) => {
  if (!ADMINS.includes(String(ctx.from.id))) return;
  const msg = ctx.match[1];
  let count = 0;
  for (const [id] of economyUsers.entries()) {
    try {
      await bot.telegram.sendMessage(id, `📢 **DIQQAT E'LON:**\n\n${msg}`, { parse_mode: "Markdown" });
      count++;
    } catch (e) {}
  }
  await ctx.reply(`✅ Xabar ${count} ta foydalanuvchiga yuborildi!`);
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
    console.log("🚀 ULTIMATE ELITE ECONOMY BOT IS ONLINE!");
  } catch (err) {
    console.error("Xatolik:", err);
  }
}

startBot();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
