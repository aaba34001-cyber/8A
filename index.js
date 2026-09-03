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
      business: "Отсутствует",
      bizIncome: 0,
      car: "Отсутствует",
      house: "Отсутствует",
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

bot.hears(/^(игры|igri|игры 🎮|oyinlar|o'yinlar|21)$/i, async (ctx) => {
  const gamesText = `
🎮 **ДОСТУПНЫЕ ИГРЫ (21 ШТ.)**

🎲 **Удача и Казино:**
1. \`казино [ставка]\` — Умножьте свою ставку
2. \`кубик [1-6] [ставка]\` — Бросок костей
3. \`рулетка [красное/черное] [ставка]\` — Испытайте удачу
4. \`слот [ставка]\` — Игровой автомат
5. \`21 [ставка]\` — Очко / Блэкджек
6. \`монета [орел/решка] [ставка]\` — Подбросить монетку
7. \`сейф [1-10] [ставка]\` — Угадать код от сейфа

💥 **Азартные мини-игры:**
8. \`пуш [ставка]\` — Нажимайте Пуш и поднимайте икс
9. \`пушка [ставка]\` — Выстрел из пушки на коэффициент
10. \`пирамида [ставка]\` — Подъем по пирамиде
11. \`мина [ставка]\` — Минное поле (7x7)
12. \`математика\` — Решите пример на время
13. \`викторина\` — Ответьте на вопрос

🎯 **Спорт и Точность:**
14. \`дартс [ставка]\` — Бросок в мишень
15. \`баскетбол [ставка]\` — Бросок в корзину
16. \`футбол [ставка]\` — Забить пенальти
17. \`боулинг [ставка]\` — Сбить кегли

⚔️ **PvP / Дуэли:**
18. \`дуэль [@username] [ставка]\` — Вызов игрока
19. \`бой [ставка]\` — Битва с случайным игроком
20. \`гонки [ставка]\` — Автомобильные гонки
21. \`лотерея\` — Ежедневный билет удачи

📌 *Чтобы начать, отправьте нужную команду в чат!*
`;

  await ctx.reply(gamesText, { parse_mode: "Markdown" });
});

// PUSH O'YINI (push [stavka])
bot.hears(/^(пуш|push) (\d+)$/i, async (ctx) => {
  const u = ecoUser(ctx);
  const bet = Number(ctx.match[2]);

  if (!bet || bet <= 0 || u.balance < bet) {
    return ctx.reply("❌ Balansingizda yetarli mablag' yo'q yoki noto'g'ri stavka kiritdingiz!");
  }

  u.balance -= bet;

  await ctx.reply(
    `🔴 **PUSH O'YINI**\n\nStavka: **${bet.toLocaleString()} tanga**\nOmadni sinash uchun pastdagi tugmani bosing!`,
    Markup.inlineKeyboard([
      [Markup.button.callback(`🚀 Push qilish (${bet * 2}x)`, `do_push_${bet}`)],
      [Markup.button.callback(`❌ Bekor qilish`, `cancel_push`)]
    ])
  );
});

bot.action(/^do_push_(\d+)$/, async (ctx) => {
  try {
    const bet = Number(ctx.match[1]);
    const u = ecoUser(ctx);

    if (Math.random() < 0.40) {
      const prize = Math.floor(bet * 2.0);
      u.balance += prize;
      u.wins++;
      await ctx.editMessageText(
        `🔴 **PUSH O'YINI**\n\n🎉 **TABRIKLEYSIZ! YUTDINGIZ!**\n💰 Mukofot: **+${prize.toLocaleString()} tanga**`
      );
    } else {
      u.losses++;
      await ctx.editMessageText(
        `🔴 **PUSH O'YINI**\n\n📉 **Afsuski, yutqazdingiz...**\n💸 Yo'qotish: **-${bet.toLocaleString()} tanga**`
      );
    }
  } catch (err) {
    await ctx.answerCbQuery("Xatolik yuz berdi!");
  }
});

bot.action('cancel_push', async (ctx) => {
  try {
    await ctx.editMessageText("❌ O'yin bekor qilindi.");
  } catch (err) {}
});

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🚀 BOT ONLINE!");
  } catch (err) {
    console.error("Start Error:", err);
  }
}

startBot();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
