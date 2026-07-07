const { Telegraf } = require('telegraf');
const express = require('express');

// 从环境变量读取 Token（不要把 Token 直接写在代码里）
const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

// 用内存存储每个用户的状态（生产环境建议换成数据库）
const userSessions = {};

function getUserSession(chatId) {
  if (!userSessions[chatId]) {
    userSessions[chatId] = { isPaid: false, messageCount: 0 };
  }
  return userSessions[chatId];
}

bot.start((ctx) => {
  ctx.reply('你好！欢迎使用本机器人 👋\n发送任何消息，我都会自动回复你。');
});

bot.command('status', (ctx) => {
  const session = getUserSession(ctx.chat.id);
  ctx.reply(`你的状态：${session.isPaid ? '✅ 已付费用户' : '🆓 免费用户'}\n累计消息数：${session.messageCount}`);
});

bot.on('text', (ctx) => {
  const chatId = ctx.chat.id;
  const session = getUserSession(chatId);
  session.messageCount += 1;

  const userText = ctx.message.text;

  if (!session.isPaid && session.messageCount > 5) {
    ctx.reply('⚠️ 免费额度已用完，请付费解锁继续使用。发送 /pay 查看付费方式。');
    return;
  }

  ctx.reply(`你说的是：「${userText}」\n（这里之后可以接入 AI 智能回复）`);
});

bot.command('pay', (ctx) => {
  ctx.reply('💳 付费方式即将上线，敬请期待。');
});

const app = express();
app.use(express.json());
app.use(bot.webhookCallback('/webhook'));

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
