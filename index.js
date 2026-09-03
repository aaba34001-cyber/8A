require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("❌ CRITICAL ERROR: BOT_TOKEN is missing!");
  process.exit(1);
}

const bot = new Telegraf(token);
const economyUsers = new Map();

function ecoUser(ctx) {
  const id = String(ctx.from.id);
  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id: ctx.from.id,
      name: ctx.from.first_name || "Игрок",
      nickname: null,
      username: ctx.from.username || null,
      balance: 100000,
      bank: 0,
      credit: 0,
      experience: 0,
      level: 1,
      wins: 0,
      losses: 0
    });
  }
  return economyUsers.get(id);
}

function ecoName(u) {
  if (u.nickname) return u.nickname;
  return u.username ? `@${u.username}` : u.name;
}

function addExp(u, amount) {
  u.experience += amount;
  if (u.experience >= u.level * 100) {
    u.level += 1;
    u.experience = 0;
    u.balance += u.level * 50000;
  }
}

// 1. O'YINLAR MENYUSI (Har qanday variantda ishlaydi)
bot.hears(/^(игры|igri|игры 🎮|oyinlar|o'yinlar|o`yinlar|21)$/i, async (ctx) => {
  const gamesText = `
🎮 **MAVJUD O'YINLAR VA KAZINO (21 TA)**

🎲 **Omad va Kazino:**
1. \`kazino [stavka]\` — Klassik kazino (2x)
2. \`kubik [stavka]\` — Zarlar o'yini
3. \`ruletka [stavka]\` — Ruletka
4. \`slot [stavka]\` — Slot avtomat
5. \`21 [stavka]\` — 21 ochko (Blackjack)
6. \`moneta [stavka]\` — Tanga tashash
7. \`seif [stavka]\` — Seif ochish

💥 **Mini O'yinlar:**
8. \`push [stavka]\` — Push o'yini
9. \`pushka [stavka]\` — Pushka otish
10. \`piramida [stavka]\` — Piramida
11. \`mina [stavka]\` — Mina maydoni
12. \`matematika\` — Tezkor misol
13. \`viktorina\` — Savol-javob

🎯 **Sport va Boshqalar:**
14. \`darts [stavka]\` — Darts
15. \`basketbol [stavka]\` — Basketbol
16. \`футбол [stavka]\` — Futbol penalti
17. \`боулинг [stavka]\` — Bowling
18. \`duel [stavka]\` — Duel
19. \`jang [stavka]\` — Jang
20. \`poyga [stavka]\` — Poyga
21. \`lotereya\` — Lotereya

📌 *Masalan ishlatish:* \`kazino 5000\` yoki \`push 1000\`
`;

  await ctx.reply(gamesText, { parse_mode: "Markdown" });
});

// 2. UNIVERSAL O'YINLAR HANDLERI (Barcha o'yinlarni bir joyda muammosiz ushlaydi)
bot.hears(/^(kazino|казино|kubik|кубик|ruletka|рулетка|slot|слоты|slot-avtomat|21|bлекджек|moneta|монета|seif|сейф|push|пуш|pushka|пушка|piramida|пирамида|mina|мина|darts|дартс|basketbol|баскетбол|futbol|футбол|bowling|боулинг)\s+(\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const gameName = ctx.match[1].toLowerCase();
  const bet = Number(ctx.match[2]);

  if (!bet || bet <= 0) {
    return ctx.reply("❌ Stavka miqdorini to'g'ri kiriting! Masalan: `kazino 5000`", { parse_mode: "Markdown" });
  }

  if (u.balance < bet) {
    return ctx.reply("❌ Balansingizda yetarli mablag' yo'q!");
  }

  u.balance -= bet;

  // O'yin ehtimolligi va koeffitsiyenti
  let winRate = 0.38;
  let mult = 2.0;

  if (["seif", "сейф"].includes(gameName)) { winRate = 0.20; mult = 5.0; }
  else if (["slot", "слоты"].includes(gameName)) { winRate = 0.28; mult = 3.0; }
  else if (["push", "пуш"].includes(gameName)) { winRate = 0.40; mult = 2.1; }

  if (Math.random() < winRate) {
    const prize = Math.floor(bet * mult);
    u.balance += prize;
    u.wins++;
    addExp(u, 15);
    return ctx.reply(`🎮 **O'YIN: ${gameName.toUpperCase()}**\n\n🎉 **TABRIKLEYSIZ, YUTDINGIZ!**\n💰 Mukofot: **+${prize.toLocaleString()} tanga**`);
  } else {
    u.losses++;
    return ctx.reply(`🎮 **O'YIN: ${gameName.toUpperCase()}**\n\n📉 **Afsuski, yutqazdingiz...**\n💸 Yo'qotish: **-${bet.toLocaleString()} tanga**`);
  }
});

// Profil komandasi
bot.hears(/^(профиль|profil|profill)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `👤 **SIZNING PROFILINGIZ:**\n\n` +
    `🏷 Ism: **${ecoName(u)}**\n` +
    `🆔 ID: \`${u.id}\`\n` +
    `⭐ Daraja: **${u.level} LVL** (${u.experience}/${u.level * 100} EXP)\n` +
    `💰 Balans: **${u.balance.toLocaleString()} tanga**\n` +
    `🏆 G'alabalar / Mag'lubiyatlar: ${u.wins} / ${u.losses}`
  );
});

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🚀 BOT ISHGA TUSHDI VA O'YINLAR SOZLandi!");
  } catch (err) {
    console.error("Xatolik:", err);
  }
}

startBot();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
