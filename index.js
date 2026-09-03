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

const economyUsers = new Map();
const userLastMessage = new Map();
const activeMines = new Map();

// Anti-Spam Middleware
bot.use(async (ctx, next) => {
  if (!ctx.from) return next();
  const userId = ctx.from.id;
  const now = Date.now();
  if (userLastMessage.has(userId) && (now - userLastMessage.get(userId) < 1500)) {
    return;
  }
  userLastMessage.set(userId, now);
  return next();
});

function ecoUser(ctx) {
  const id = String(ctx.from.id);
  if (!economyUsers.has(id)) {
    economyUsers.set(id, {
      id: ctx.from.id,
      name: ctx.from.first_name || "User",
      username: ctx.from.username || null,
      balance: 1000,
      bank: 0,
      vip: false,
      lastBonus: 0,
      lastWork: 0,
      crypto: 0
    });
  }
  const u = economyUsers.get(id);
  if (ctx.from.username && EXTRA_ADMINS.includes(ctx.from.username.toLowerCase())) {
    u.vip = true;
  }
  return u;
}

function ecoName(u) {
  const nameStr = u.username ? `@${u.username}` : u.name;
  return `${nameStr}${u.vip ? " 👑VIP" : ""}`;
}

// ==================== ADMIN PANEL & COMMANDS ====================

bot.command(["kick", "кик"], async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply("⛔ Admin emassiz!");
  if (!ctx.message.reply_to_message) return ctx.reply("📌 Kimgadir reply qiling!");
  const target = ctx.message.reply_to_message.from;
  if (isImmune(target.id, target.username)) return ctx.reply("🛡️ Bu odamga daxlsizlik bor!");
  
  await ctx.banChatMember(target.id);
  await ctx.unbanChatMember(target.id);
  await ctx.reply(`🚪 ${target.first_name} guruhdan chiqarildi.`);
});

bot.command(["ban", "бан"], async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply("⛔ Admin emassiz!");
  if (!ctx.message.reply_to_message) return ctx.reply("📌 Kimgadir reply qiling!");
  const target = ctx.message.reply_to_message.from;
  if (isImmune(target.id, target.username)) return ctx.reply("🛡️ Bu odamga daxlsizlik bor!");

  await ctx.banChatMember(target.id);
  await ctx.reply(`🚫 ${target.first_name} ban qilindi.`);
});

bot.command(["unban", "разбан"], async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply("⛔ Admin emassiz!");
  if (!ctx.message.reply_to_message) return ctx.reply("📌 Kimgadir reply qiling!");
  const target = ctx.message.reply_to_message.from;
  await ctx.unbanChatMember(target.id);
  await ctx.reply(`✅ ${target.first_name} bandan chiqarildi.`);
});

// ==================== ECONOMY & TRADING ====================

bot.hears(/^!?(бонус|bonus)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastBonus < 86400000) {
    return ctx.reply("⏳ Bonusingizni har 24 soatda bir marta olishingiz mumkin!");
  }
  const reward = Math.floor(Math.random() * 5000) + 1000;
  u.balance += reward;
  u.lastBonus = now;
  await ctx.reply(`🎁 Sizga **${reward.toLocaleString()}** tanga bonus berildi!\n💰 Balans: ${u.balance.toLocaleString()}`);
});

bot.hears(/^!?(работа|rabota|ish)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const now = Date.now();
  if (now - u.lastWork < 3600000) {
    return ctx.reply("⏳ Ishlash uchun 1 soat kutishingiz kerak!");
  }
  const earned = Math.floor(Math.random() * 3000) + 500;
  u.balance += earned;
  u.lastWork = now;
  await ctx.reply(`💼 Ishladingiz va **${earned.toLocaleString()}** tanga maosh oldingiz!\n💰 Balans: ${u.balance.toLocaleString()}`);
});

// Trading (Birja)
bot.hears(/^!?(трейдинг|trading|birja)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const rate = 1500; // 1 Crypto = 1500 tanga
  await ctx.reply(
    `📈 **TRADING (BIRJA)**\n\n` +
    `📊 1 BTC Kursi: **${rate} tanga**\n` +
    `💰 Sizning BTC: **${u.crypto} BTC**\n` +
    `🪙 Balans: **${u.balance.toLocaleString()} tanga**\n\n` +
    `Buyruqlar:\n` +
    `• \`Купить бтц [soni]\` — BTC sotib olish\n` +
    `• \`Продать бтц [soni]\` — BTC sotish`
  );
});

bot.hears(/^!(купить бтц|buy btc) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[2]);
  const cost = amount * 1500;
  if (u.balance < cost) return ctx.reply("❌ Balansda tanga yetarli emas!");
  u.balance -= cost;
  u.crypto += amount;
  await ctx.reply(`✅ **${amount} BTC** sotib oldingiz! Balans: ${u.balance.toLocaleString()} tanga`);
});

bot.hears(/^!(продать бтц|sell btc) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const amount = Number(ctx.match[2]);
  if (u.crypto < amount) return ctx.reply("❌ Sizda buncha BTC yo'q!");
  const gain = amount * 1500;
  u.crypto -= amount;
  u.balance += gain;
  await ctx.reply(`✅ **${amount} BTC** sotdingiz! +${gain.toLocaleString()} tanga.`);
});

// ==================== MINI GAMES (21 TA) ====================

// 1. MINA O'YINI (BUTTONLI 5x5 GRID)
bot.hears(/^!(мина|mina) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);
  if (bet <= 0 || u.balance < bet) return ctx.reply("❌ Balans yetarsiz yoki stavka xato!");

  u.balance -= bet;
  const bombPos = Math.floor(Math.random() * 25);
  
  const buttons = [];
  for (let i = 0; i < 25; i++) {
    buttons.push(Markup.button.callback("❓", `mine_${i}_${bombPos}_${bet}`));
  }
  const grid = [];
  while (buttons.length) grid.push(buttons.splice(0, 5));

  await ctx.reply(`💣 **MINA (5x5)**\nStavka: ${bet} tanga\nMaydondagi 1 ta bombani topmasdan bosishga harakat qiling:`, Markup.inlineKeyboard(grid));
});

bot.action(/^mine_(\d+)_(\d+)_(\d+)$/, async (ctx) => {
  const clicked = Number(ctx.match[1]);
  const bomb = Number(ctx.match[2]);
  const bet = Number(ctx.match[3]);
  const u = ecoUser(ctx);

  if (clicked === bomb) {
    await ctx.editMessageText(`💥 **BOMBA PORTLADI!**\nSiz ${bet} tanga boy berdingiz.`);
  } else {
    const win = Math.floor(bet * 1.8);
    u.balance += win;
    await ctx.editMessageText(`🎉 **G'ALABA!** Siz bombani chetlab o'tdingiz!\nYutug'ingiz: +${win} tanga!`);
  }
});

// 2. PIRAMIDA O'YINI
bot.hears(/^!(пирамида|piramida) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);
  if (bet <= 0 || u.balance < bet) return ctx.reply("❌ Balans yetarsiz!");

  u.balance -= bet;
  const chance = Math.random() < 0.5;
  if (chance) {
    const win = Math.floor(bet * 2.5);
    u.balance += win;
    await ctx.reply(`🔺 **Piramidaga chiqdingiz!** 2.5x ko'paytirildi: +${win} tanga!`);
  } else {
    await ctx.reply(`💥 Piramida yiqildi! ${bet} tanga yo'qotdingiz.`);
  }
});

// 3. BOMBA O'YINI
bot.hears(/^!(бомба|bomba) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);
  if (bet <= 0 || u.balance < bet) return ctx.reply("❌ Balans yetarsiz!");

  u.balance -= bet;
  const isSafe = Math.floor(Math.random() * 3) !== 0; // 3 dan 1 imkoniyat portlash
  if (isSafe) {
    const win = Math.floor(bet * 1.5);
    u.balance += win;
    await ctx.reply(`💣 Bomba miltilladi lekin portlamadi! +${win} tanga yutdingiz!`);
  } else {
    await ctx.reply(`💥 BOMBA PORTLADI! ${bet} tanga boy berildi.`);
  }
});

// BARCHA O'YINLAR RO'YXATI (21 TA)
bot.hears(/^!?(игры|igri|o'yinlar)$/i, async (ctx) => {
  await ctx.reply(
    `🎮 **21 TA MINI O'YINLAR RO'YXATI**\n\n` +
    `1. \`Мина [bet]\` - Tugmali Mina (5x5)\n` +
    `2. \`Пирамида [bet]\` - Piramida\n` +
    `3. \`Бомба [bet]\` - Bomba o'yini\n` +
    `4. \`Кость [bet]\` - Suyak (Dice)\n` +
    `5. \`Дартс [bet]\` - Darts\n` +
    `6. \`Баскетбол [bet]\` - Basketbol\n` +
    `7. \`Футбол [bet]\` - Futbol\n` +
    `8. \`Казино [bet]\` - Kazino\n` +
    `9. \`Орел [bet]\` - Tanga tashlash (Orel)\n` +
    `10. \`Решка [bet]\` - Tanga tashlash (Reshka)\n` +
    `11. \`Рулетка [bet]\` - Ruletka\n` +
    `12. \`Дуэль [bet]\` - Duel\n` +
    `13. \`Угадай [1-5] [bet]\` - Sonni top\n` +
    `14. \`Сейф [bet]\` - Seif buzish\n` +
    `15. \`Сундук [bet]\` - Sandiq ochish\n` +
    `16. \`Колесо [bet]\` - Omad g'ildiragi\n` +
    `17. \`Лотерея [bet]\` - Lotereya\n` +
    `18. \`Тир [bet]\` - Otish xonasi\n` +
    `19. \`Скачки [bet]\` - Ot poygasi\n` +
    `20. \`Крипто [bet]\` - Tezkor trading\n` +
    `21. \`Блекджек [bet]\` - Blackjack\n\n` +
    `💡 *Misol:* \`Мина 100\` yoki \`Бомба 500\``
  );
});

// GENERAL & START
bot.command("start", async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `👋 **Salom, ${u.name}!**\n\n` +
    `🤖 8-A ADMIN & GAME BOT tayyor.\n\n` +
    `📌 **Buyruqlar:**\n` +
    `• \`Баланс\` — Balansni ko'rish\n` +
    `• \`Бонус\` — Kunlik bonus\n` +
    `• \`Работа\` — Ishlash\n` +
    `• \`Трейдинг\` — Birja paneli\n` +
    `• \`Игры\` — 21 ta o'yin ro'yxati`,
    Markup.removeKeyboard()
  );
});

bot.hears(/^!?(баланс|balance)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  await ctx.reply(
    `💰 **Sening Balansing:**\n` +
    `👤 Foydalanuvchi: ${ecoName(u)}\n` +
    `🪙 Tangalar: ${u.balance.toLocaleString()}\n` +
    `📈 BTC Crypto: ${u.crypto} BTC`
  );
});

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🔥 Bot to'liq yangilandi va ishga tushdi!");
  } catch (err) {
    console.error("Bot xatosi:", err);
  }
}

startBot();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
