const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');

async function sendPairingCodeToTelegram(phoneNumber, pairingCode) {
    try {
        if (!global.telegramPairingStore || !global.telegramPairingStore[phoneNumber]) {
            console.log(`⚠️ No telegram chat found for pairing request: ${phoneNumber}`);
            return false;
        }

        const { chatId } = global.telegramPairingStore[phoneNumber];
        const botToken = config.BOT_TOKEN;

        if (!botToken || botToken === '8573095889:AAFnvhryIkSQjcDjXCTjt8scyXQ1dDh9wwE') {
            console.log('⚠️ Telegram bot not configured - skipping pairing code send');
            return false;
        }

        const bot = new TelegramBot(botToken, { polling: false });

        const message = `✅ *WhatsApp Pairing Code Ready!*\n\n` +
                       `📱 Number: *${phoneNumber}*\n` +
                       `🔐 Pairing Code:\n\n` +
                       `\`${pairingCode}\`\n\n` +
                       `📋 Instructions:\n` +
                       `1. Go to WhatsApp → Settings → Linked devices\n` +
                       `2. Click "Link a device"\n` +
                       `3. Enter the code above when asked\n\n` +
                       `⏱️ Code expires in 60 seconds\n\n` +
                       `> © ADEEL-MINI ッ`;

        await bot.sendMessage(chatId, message, { 
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '📋 Copy Code',
                            callback_data: `copy_code_${pairingCode}`
                        },
                        {
                            text: '🔄 New Code',
                            callback_data: `pair_${phoneNumber}`
                        }
                    ],
                    [
                        {
                            text: '❓ Help',
                            callback_data: 'pair_help'
                        }
                    ]
                ]
            }
        });
        
        console.log(`✅ Pairing code sent to Telegram: ${phoneNumber}`);
        
        delete global.telegramPairingStore[phoneNumber];
        return true;

    } catch (error) {
        console.error('❌ Failed to send pairing code to Telegram:', error.message);
        return false;
    }
}

module.exports = { sendPairingCodeToTelegram };
