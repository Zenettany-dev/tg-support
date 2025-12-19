const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf('TYT_TOKEN');
const ADMIN_CHAT = 'TYT_ID_CHAT_ADMIN';

const userRequests = {};
const messageCounter = {};

const getAccountAge = (userId) => {
    const timestamp = (userId >> 32) * 1000;
    if (timestamp < 1000000000000) return 'неизвестно';
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU');
};

bot.start(async (ctx) => {
    const user = ctx.from;
    const userId = user.id;
    const accountAge = getAccountAge(userId);
    
    const welcomeMessage = `🎉 Добро пожаловать в поддержку Zenettany!\n\n` +
        `📋 Ваша информация:\n` +
        `👤 Никнейм: ${user.first_name}${user.last_name ? ' ' + user.last_name : ''}\n` +
        `🔖 ИД аккаунта: <code>${userId}</code>\n` +
        `📅 Дата создания аккаунта: ${accountAge}\n` +
        `🌐 Username: @${user.username || 'не установлен'}\n\n` +
        `💎 Разработчики:\n` +
        `• Zenettany: @kannadec\n` +
        `• Gromova\n\n` +
        `• aurproject.eu\n\n` +
        `🔧 Для обращения: /help [ваш вопрос]`;
    
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('Открыть тг Gromova', 'gromova_tg')],
        [Markup.button.url('🌐 AUR PROJECT', 'https://aurproject.eu')],
        [Markup.button.url('📢 Наш канал', 'https://t.me/kannadec_dev')]
    ]);
    
    await ctx.reply(welcomeMessage, {
        parse_mode: 'HTML',
        ...keyboard
    });
});

bot.action('gromova_tg', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('Не работает? Значит не судьба, бро... Всё что нужно — уже здесь 😉');
});

bot.command('help', (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        return ctx.reply('Напишите /help и ваш вопрос');
    }
    
    const question = args.slice(1).join(' ');
    const user = ctx.from;
    const userKey = `${user.id}_${ctx.chat.id}`;
    
    messageCounter[userKey] = (messageCounter[userKey] || 0) + 1;
    const shortId = `${user.id}_${messageCounter[userKey]}`;
    
    userRequests[shortId] = {
        id: user.id,
        username: user.username,
        chatId: ctx.chat.id
    };
    
    const adminMessage = `🆕 НОВЫЙ ЗАПРОС\n` +
        `👤 ID: <code>${user.id}</code>\n` +
        `📛 Юзернейм: @${user.username || 'нет'}\n` +
        `🆔 ID для ответа: <code>${shortId}</code>\n` +
        `📝 Текст: ${question}\n\n` +
        `📤 Ответить: /otvet ${user.id} [текст]`;
    
    ctx.telegram.sendMessage(ADMIN_CHAT, adminMessage, { parse_mode: 'HTML' });
    ctx.reply('✅ Запрос отправлен администраторам.');
});

bot.command('otvet', (ctx) => {
    if (String(ctx.chat.id) !== ADMIN_CHAT) return;
    
    const args = ctx.message.text.split(' ');
    if (args.length < 3) {
        return ctx.reply('Используйте: /otvet [ID_пользователя] [текст ответа]');
    }
    
    const targetId = args[1];
    const reply = args.slice(2).join(' ');
    
    let userId = null;
    let username = null;
    
    if (targetId.startsWith('@')) {
        const searchUsername = targetId.substring(1);
        for (const [shortId, data] of Object.entries(userRequests)) {
            if (data.username && data.username.toLowerCase() === searchUsername.toLowerCase()) {
                userId = data.id;
                username = data.username;
                break;
            }
        }
    } else {
        const numericId = parseInt(targetId);
        for (const [shortId, data] of Object.entries(userRequests)) {
            if (data.id === numericId) {
                userId = data.id;
                username = data.username;
                break;
            }
        }
    }
    
    if (!userId) {
        return ctx.reply(`❌ Пользователь с ID/юзернеймом "${targetId}" не найден в активных запросах.`);
    }
    
    ctx.telegram.sendMessage(userId, `💌 Ответ от поддержки Zenettany:\n\n${reply}\n\nРазработчик: @kannadec | aurproject.eu`)
        .then(() => ctx.reply(`✅ Ответ отправлен пользователю:\nID: <code>${userId}</code>\nЮзернейм: @${username || 'нет'}`, { parse_mode: 'HTML' }))
        .catch((err) => ctx.reply(`❌ Ошибка: ${err.message}`));
});

bot.on('text', (ctx) => {
    if (ctx.chat.type === 'private' && !ctx.message.text.startsWith('/')) {
        ctx.reply('Для обращения используйте команду /help [ваш вопрос]');
    }
});

bot.launch().then(() => {
    console.log('✅ Бот запущен: AUR PROJECT Support');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
