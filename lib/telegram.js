const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');

let telegramBot = null;
let isInitialized = false;

function initializeTelegramBot() {
    if (isInitialized) return telegramBot;
    
    try {
        const botToken = config.BOT_TOKEN;
        
        if (!botToken || botToken === 'test-token' || botToken === '8573095889:AAFnvhryIkSQjcDjXCTjt8scyXQ1dDh9wwE') {
            console.log('⚠️  Telegram bot token not configured or using default - Telegram bridge disabled');
            return null;
        }

        telegramBot = new TelegramBot(botToken, { 
            polling: {
                interval: 2000,
                autoStart: true,
                params: { timeout: 10 }
            }
        });
        
        telegramBot.on('polling_error', (error) => {
            console.error('Telegram polling error:', error.message);
        });

        telegramBot.on('error', (error) => {
            console.error('Telegram bot error:', error.message);
        });

        setupTelegramHandlers();
        isInitialized = true;
        
        console.log('╭━━━━━━━━━━━━━━━━━━━━━╮');
        console.log('┃ ✅ Telegram Bot Started');
        console.log('┃ 📱 Owner ID: ' + config.TELEGRAM_OWNER_ID);
        console.log('╰━━━━━━━━━━━━━━━━━━━━━╯');
        
        return telegramBot;
    } catch (error) {
        console.error('❌ Failed to initialize Telegram bot:', error.message);
        return null;
    }
}

function setupTelegramHandlers() {
    if (!telegramBot) return;

    telegramBot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const userName = msg.from.first_name || 'User';
        const founderName = config.FOUNDER_NAME || 'ADEEL-MD';
        const botName = config.BOT_NAME || 'ADEEL-MINI BOT';
        
        const welcomeMessage = `
╭━━━━━━━━━━━━━━━╮
┃  🤖 *${botName}*
┃  ━━━━━━━━━━━━━━━
┃  👋 Welcome, *${userName}*!
╰━━━━━━━━━━━━━━━━╯

*Available Commands:*

📱 /pair <number> - Connect WhatsApp
🏓 /ping - Check bot status
📊 /status - Bot statistics
❓ /help - Show all commands

*Quick Links:*
💬 Get Support
🚀 Get Started
📚 Learn More

> © *${founderName}* ッ
`;

        telegramBot.sendMessage(chatId, welcomeMessage, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '💬 Get Support', callback_data: 'support' },
                        { text: '🚀 Get Started', callback_data: 'start_guide' }
                    ],
                    [
                        { text: '📚 Learn More', callback_data: 'learn' },
                        { text: '🔍 Explore', callback_data: 'explore' }
                    ]
                ]
            }
        });
    });

    telegramBot.onText(/\/help/, (msg) => {
        const chatId = msg.chat.id;
        const founderName = config.FOUNDER_NAME || 'ADEEL-MINI';
        
        const helpMessage = `
╭━━━━━━━━━━━━━━━╮
┃  📖 *HELP MENU*
╰━━━━━━━━━━━━━━━━╯

*Bot Commands:*
/start - Start bot
/help - This menu
/pair <number> - Pair WhatsApp
/ping - Check latency
/status - Bot stats

*Example:*
/pair +923035512967

> © *${founderName}* ッ
`;

        telegramBot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    });

    telegramBot.onText(/\/ping/, (msg) => {
        const chatId = msg.chat.id;
        const startTime = Date.now();
        
        const memoryUsage = process.memoryUsage();
        const ramUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const ramTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);
        
        const pingTime = Date.now() - startTime;
        
        const statusMessage = `
╭━━━━━━━━━━━━━━━╮
┃  🏓 *PONG!*
┃  ━━━━━━━━━━━━━━━
┃  ⚡ Response: ${pingTime}ms
┃  💾 RAM: ${ramUsed}MB / ${ramTotal}MB
┃  🟢 Status: Online
╰━━━━━━━━━━━━━━━━╯
`;

        telegramBot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
    });

    telegramBot.onText(/\/status/, (msg) => {
        const chatId = msg.chat.id;
        
        const uptimeMs = process.uptime() * 1000;
        const uptimeSec = Math.floor(uptimeMs / 1000);
        const hours = Math.floor(uptimeSec / 3600);
        const minutes = Math.floor((uptimeSec % 3600) / 60);
        const seconds = uptimeSec % 60;
        
        const memoryUsage = process.memoryUsage();
        const ramUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const ramTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);
        
        const statusMessage = `
╭━━━━━━━━━━━━━━━╮
┃  📊 *BOT STATUS*
╰━━━━━━━━━━━━━━━━╯

⏰ *Uptime:* ${hours}h ${minutes}m ${seconds}s
💾 *Memory:* ${ramUsed}MB / ${ramTotal}MB
🟢 *Status:* Online
🔧 *Node:* ${process.version}

> Last updated: ${new Date().toLocaleString()}
`;

        telegramBot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
    });

    telegramBot.onText(/\/pair (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const phoneNumber = match[1];
        const userId = msg.from.id;
        
        if (!phoneNumber) {
            return telegramBot.sendMessage(chatId, 
                `❌ *Missing Phone Number*\n\nUsage: /pair +923035512967`,
                { parse_mode: 'Markdown' }
            );
        }

        if (!phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
            return telegramBot.sendMessage(chatId,
                `❌ *Invalid Phone Format*\n\nUse format: +923035512967`,
                { parse_mode: 'Markdown' }
            );
        }

        try {
            telegramBot.sendMessage(chatId,
                `📱 *WhatsApp Pairing*\n\n` +
                `📞 Number: ${phoneNumber}\n` +
                `🔄 Status: Processing...\n\n` +
                `Please wait while we generate your pairing code...\n\n` +
                `⏳ You will receive the pairing code here shortly.`,
                { parse_mode: 'Markdown' }
            );

            global.telegramPairingStore = global.telegramPairingStore || {};
            global.telegramPairingStore[phoneNumber] = {
                chatId: chatId,
                userId: userId,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Pairing error:', error.message);
            telegramBot.sendMessage(chatId,
                `❌ *Error*\n\nFailed to process pairing request.\n\nError: ${error.message}`,
                { parse_mode: 'Markdown' }
            );
        }
    });

    telegramBot.on('callback_query', (query) => {
        const chatId = query.message.chat.id;
        const data = query.data;

        let responseText = '';

        switch (data) {
            case 'support':
                responseText = '💬 *Get Support*\n\nContact: @ROMEK_XD\nOr use /help for commands';
                break;
            case 'start_guide':
                responseText = '🚀 *Getting Started*\n\n1. Use /pair +number to connect\n2. Enter code in WhatsApp\n3. Start using bot!';
                break;
            case 'learn':
                responseText = '📚 *Learn More*\n\nThis bot connects WhatsApp and Telegram.\nUse /help to see all commands.';
                break;
            case 'explore':
                responseText = '🔍 *Explore Features*\n\n• WhatsApp Pairing\n• Bot Status\n• Session Management';
                break;
            default:
                responseText = 'Unknown action';
        }

        telegramBot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
        telegramBot.answerCallbackQuery(query.id);
    });
}

function sendTelegramMessage(chatId, message, options = {}) {
    if (!telegramBot) {
        console.log('Telegram bot not initialized');
        return Promise.resolve(null);
    }
    
    return telegramBot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        ...options
    }).catch(err => {
        console.error('Failed to send Telegram message:', err.message);
        return null;
    });
}

function notifyOwner(message) {
    const ownerId = config.TELEGRAM_OWNER_ID;
    if (ownerId && telegramBot) {
        return sendTelegramMessage(ownerId, message);
    }
    return Promise.resolve(null);
}

function stopTelegramBot() {
    if (telegramBot) {
        telegramBot.stopPolling();
        isInitialized = false;
        console.log('Telegram bot stopped');
    }
}

module.exports = {
    initializeTelegramBot,
    sendTelegramMessage,
    notifyOwner,
    stopTelegramBot,
    getTelegramBot: () => telegramBot
};
