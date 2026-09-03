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
  if (ctx.from.username && EXTRA_ADMINS.some(a => a.toLowerCase() === ctx.from.username.toLowerCase())) return true;
  if (!isGroup(ctx)) return false;
  try {
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);
    return admins.some((admin) => Number(admin.user.id) === Number(ctx.from.id));
  } catch (error) {
    return false;
  }
}

const economyUsers = new Map();
const activeMinesGames = new Map(); // 7x7 Mina o'yini holati

function ecoUser(ctx) {
  const id = String(ctx.from.id);
  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id: ctx.from.id,
      name: ctx.from.first_name || "Пользователь",
      username: ctx.from.username || null,
      balance: 50000,
      bank: 0,
      vip: false,
      vipExpires: 0,
      lastBonus: 0,
      lastWork: 0
    });
  }
  return economyUsers.get(id);
}

function ecoName(u) {
  return u.username ? `@${u.username}` : u.name;
}

// ==================== 7x7 MINA O'YINI (BUTTON LI) ====================

bot.hears(/^!?(мины|mina|мины) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);
  if (u.balance < bet) return ctx.reply("❌ Garov uchun mablag' yetarli emas!");

  u.balance -= bet;
  const userId = ctx.from.id;

  // 7x7 setka (49 ta katak, 7 ta mina tasodifiy joylashtiriladi)
  const mines = new Set();
  while (mines.size < 7) {
    mines.add(Math.floor(Math.random() * 49));
  }

  activeMinesGames.set(userId, {
    bet: bet,
    mines: mines,
    revealed: new Set(),
    multiplier: 1.0
  });

  await renderMinesGrid(ctx, userId, "💣 **7x7 MINA O'YINI**\n\nKatakchalarni tanlang va minalardan qoching!");
});

async function renderMinesGrid(ctx, userId, messageText) {
  const game = activeMinesGames.get(userId);
  if (!game) return;

  const buttons = [];
  for (let r = 0; r < 7; r++) {
    const row = [];
    for (let c = 0; c < 7; c++) {
      const idx = r * 7 + c;
      if (game.revealed.has(idx)) {
        row.push(Markup.button.callback("💎", `mines_none`));
      } else {
        row.push(Markup.button.callback("🟦", `mines_click_${idx}`));
      }
    }
    buttons.push(row);
  }

  buttons.push([Markup.button.callback(`💰 Yutuqni olish (${(game.bet * game.multiplier).toFixed(0)} монет)`, `mines_cashout`)]);

  const keyboard = Markup.inlineKeyboard(buttons);
  if (ctx.callbackQuery) {
    await ctx.editMessageText(`${messageText}\n\n📊 Joriy ko'paytiruvchi: **x${game.multiplier.toFixed(2)}**`, keyboard);
  } else {
    await ctx.reply(`${messageText}\n\n📊 Joriy ko'paytiruvchi: **x${game.multiplier.toFixed(2)}**`, keyboard);
  }
}

bot.action(/^mines_click_(\d+)$/, async (ctx) => {
  const userId = ctx.from.id;
  const game = activeMinesGames.get(userId);
  if (!game) return ctx.answerCbQuery("❌ O'yin topilmadi yoki yakunlangan!", { show_alert: true });

  const idx = Number(ctx.match[1]);
  if (game.mines.has(idx)) {
    activeMinesGames.delete(userId);
    return ctx.editMessageText(`💥 **BOMBA!** siz minaga tushdingiz va 🪙 **${game.bet}** yutqazdingiz.`);
  }

  game.revealed.add(idx);
  game.multiplier += 0.25;

  if (game.revealed.size === 42) {
    const win = Math.floor(game.bet * game.multiplier);
    const u = ecoUser(ctx);
    u.balance += win;
    activeMinesGames.delete(userId);
    return ctx.editMessageText(`🎉 **MUKAMMAL!** Barcha xavfsiz kataklarni topdingiz va 🪙 **${win}** yutdingiz!`);
  }

  await renderMinesGrid(ctx, userId, "💣 **7x7 MINA O'YINI**");
});

bot.action("mines_cashout", async (ctx) => {
  const userId = ctx.from.id;
  const game = activeMinesGames.get(userId);
  if (!game) return ctx.answerCbQuery("❌ Faol o'yin yo'q!", { show_alert: true });

  const win = Math.floor(game.bet * game.multiplier);
  const u = ecoUser(ctx);
  u.balance += win;
  activeMinesGames.delete(userId);

  await ctx.editMessageText(`🤑 **YUTUQ OLINDI!** Siz 🪙 **${win.toLocaleString()} монет** yutib oldingiz!`);
});

bot.action("mines_none", (ctx) => ctx.answerCbQuery());

// ==================== 21 TA O'YIN RO'YXATI VA BUYRUQLARI ====================

bot.hears(/^!?(игры|games|o'yinlar)[\s\.]*$/i, async (ctx) => {
  await ctx.reply(
    `🎰 **21 TA MINI-O'YINLAR TIZIMI** 🎰\n\n` +
    `1. \`!мина [garov]\` — 7x7 tugmali mina o'yini\n` +
    `2. \`!кубик [1-6] [garov]\` — Zar tashlash\n` +
    `3. \`!рулетка [red/black] [garov]\` — Ruletka\n` +
    `4. \`!пирамида [garov]\` — Piramida pog'onasi\n` +
    `5. \`!казино [garov]\` — Tasodifiy kazino\n` +
    `6. \`!монета [орел/решка] [garov]\` — Tanga tashlash\n` +
    `7. \`!сейф [garov]\` — Seif kodini topish\n` +
    `8. \`!дуэль [garov]\` — Qudratli duel\n` +
    `9. \`!суперкубик [garov]\` — Ikki karra zar\n` +
    `10. \`!блэкджек [garov]\` — 21 ochko\n` +
    `11. \`!фортуна [garov]\` — Omad g'ildiragi\n` +
    `12. \`!скачки [garov]\` — Ot poygasi\n` +
    `13. \`!лотерея\` — Kunlik omadli chipta\n` +
    `14. \`!футбол [garov]\` — Penalti tepish\n` +
    `15. \`!баскетбол [garov]\` — To'p oshirish\n` +
    `16. \`!боулинг [garov]\` — Kegli yiqitish\n` +
    `17. \`!дартс [garov]\` — Nishonga urish\n` +
    `18. \`!коробка [garov]\` — Sirli quti\n` +
    `19. \`!краш [garov]\` — Ko'paytiruvchi grafik\n` +
    `20. \`!хайло [garov]\` — Baland yoki past\n` +
    `21. \`!камень [garov]\` — Tosh, qaychi, qog'oz`
  );
});

// O'yin namunalari
bot.hears(/^!кубик ([1-6]) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const choice = Number(ctx.match[1]);
  const bet = Number(ctx.match[2]);
  if (u.balance < bet) return ctx.reply("❌ Balansda pul kam!");

  u.balance -= bet;
  const res = Math.floor(Math.random() * 6) + 1;
  if (res === choice) {
    const win = bet * 4;
    u.balance += win;
    await ctx.reply(`🎲 Zar tushdi: **${res}**!\n🎉 Yutdingiz: +🪙 **${win}**!`);
  } else {
    await ctx.reply(`🎲 Zar tushdi: **${res}**.\n😔 Yutqazdingiz: -🪙 **${bet}**.`);
  }
});

bot.hears(/^!пирамида (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[1]);
  if (u.balance < bet) return ctx.reply("❌ Balansda pul kam!");

  u.balance -= bet;
  if (Math.random() > 0.48) {
    const win = Math.floor(bet * 1.9);
    u.balance += win;
    await ctx.reply(`🔺 **Piramida cho'qqisi zabt etildi!** Yutuq: 🪙 **${win}**!`);
  } else {
    await ctx.reply(`🔺 **Piramida yiqildi!** Yutqazdingiz: 🪙 **${bet}**.`);
  }
});

// START VA BOSHQA BO'LIMLAR
bot.command("start", async (ctx) => {
  await ctx.reply("👋 Xush kelibsiz! `Игры` deb yozing va 21 ta o'yinni ko'ring.");
});

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🔥 Bot to'liq yangilandi!");
  } catch (err) {
    console.error(err);
  }
}

startBot();
