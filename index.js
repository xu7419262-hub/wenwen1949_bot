const { Telegraf } = require('telegraf');
const express = require('express');
const cors = require('cors');

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

const userSessions = {};

function getUserSession(userId) {
  if (!userSessions[userId]) {
    userSessions[userId] = { isPaid: false, messageCount: 0 };
  }
  return userSessions[userId];
}

// ===== 共用的回复逻辑，Telegram 和网页都调用这个函数 =====
function generateReply(userId, userText) {
  const session = getUserSession(userId);
  session.messageCount += 1;

  if (!session.isPaid && session.messageCount > 5) {
    return '⚠️ 免费额度已用完，请付费解锁继续使用。';
  }

  return `你说的是：「${userText}」\n（这里之后可以接入 AI 智能回复）`;
}

// ===== Telegram 部分 =====
bot.start((ctx) => {
  ctx.reply('你好！欢迎使用本机器人 👋\n发送任何消息，我都会自动回复你。');
});

bot.command('status', (ctx) => {
  const session = getUserSession(ctx.chat.id);
  ctx.reply(`你的状态：${session.isPaid ? '✅ 已付费用户' : '🆓 免费用户'}\n累计消息数：${session.messageCount}`);
});

bot.on('text', (ctx) => {
  const reply = generateReply('tg_' + ctx.chat.id, ctx.message.text);
  ctx.reply(reply);
});

bot.command('pay', (ctx) => {
  ctx.reply('💳 付费方式即将上线，敬请期待。');
});

// ===== 网页部分 =====
const app = express();
app.use(cors());
app.use(express.json());
app.use(bot.webhookCallback('/webhook'));

// 网页调用这个接口发消息
app.post('/api/chat', (req, res) => {
  const { userId, text } = req.body;
  if (!userId || !text) {
    return res.status(400).json({ error: 'userId 和 text 是必填的' });
  }
  const reply = generateReply('web_' + userId, text);
  res.json({ reply });
});

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
