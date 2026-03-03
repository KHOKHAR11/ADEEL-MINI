// ADEEL-MINI 2
// Main pairing / bot management router with MongoDB
// OPTIMIZED VERSION with Caching
require('dotenv').config();
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const router = express.Router();
const pino = require('pino');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const crypto = require('crypto');
const axios = require('axios');
const { sms, downloadMediaMessage } = require("./lib/msg");
const os = require('os');
const config = require('./config');

const { userConfigCache, sessionCache, messageCache } = require('./lib/cache');

let Jimp = null;
let FileType = null;
let FormData = null;
let QRCode = null;
let yts = null;

const lazyLoadModules = () => {
    if (!Jimp) Jimp = require('jimp');
    if (!FileType) FileType = require('file-type');
    if (!FormData) FormData = require('form-data');
    if (!QRCode) QRCode = require('qrcode');
    if (!yts) yts = require('yt-search');
};

const PluginLoader = require('./plugins/pluginLoader');
const pluginManager = new PluginLoader();

const TelegramBot = require('node-telegram-bot-api');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    getContentType,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser,
    downloadContentFromMessage,
    proto,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    S_WHATSAPP_NET
} = require('@whiskeysockets/baileys');

let telegramBot = null;



// Initialize Telegram Bot
function initializeTelegramBot() {
    try {
        const telegramConfig = config;
        
        if (!telegramConfig.BOT_TOKEN) {
            console.log('❌ Telegram bot token not configured');
            return null;
        }

        // Using node-telegram-bot-api
        telegramBot = new TelegramBot(telegramConfig.BOT_TOKEN, { polling: true });
        
        console.log('✅ Telegram bot initialized successfully');
        setupTelegramHandlers();
        return telegramBot;
    } catch (error) {
        console.error('❌ Failed to initialize Telegram bot:', error.message);
        return null;
    }
}

// Setup Telegram Command Handlers
function setupTelegramHandlers() {
    if (!telegramBot) return;

    try {
        telegramBot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            telegramBot.sendMessage(chatId, 
                `🤖 *ADEEL-MINI Mini Bot*\n\n` +
                `Available Commands:\n` +
                `/pair - Connect WhatsApp bot\n` +
                `/ping - Check bot status\n\n` +
                `_Powered by ADEEL_`, 
                { parse_mode: 'Markdown' }
            );
        });

        telegramBot.onText(/\/pair/, async (msg) => {
            const chatId = msg.chat.id;
            await handleTelegramPairCommand(chatId, msg);
        });

        telegramBot.onText(/\/ping/, async (msg) => {
            const chatId = msg.chat.id;
            await handleTelegramPingCommand(chatId, msg);
        });
    } catch (error) {
        console.error('Error setting up Telegram handlers:', error.message);
    }
}

// Handle Telegram Pair Command
async function handleTelegramPairCommand(chatId, msg) {
    let processingMsgId = null;
    try {
        const messageText = msg.text || '';
        const args = messageText.split(' ').slice(1);
        const phoneNumber = args[0];

        // ============ Input Validation ============
        if (!phoneNumber) {
            await sendTelegramMessage(chatId,
                `╭─ 📱 *WhatsApp Pairing* ─╮\n` +
                `│\n` +
                `│ ❌ Phone number required!\n` +
                `│\n` +
                `│ 📌 *Usage:*\n` +
                `│ /pair +923035512967\n` +
                `│\n` +
                `│ 🌍 *Format Rules:*\n` +
                `│ • Must include country code\n` +
                `│ • Example: +923035512967\n` +
                `│\n` +
                `│ 💡 *Tip:* Use your WhatsApp account\n` +
                `│ number format exactly\n` +
                `│\n` +
                `╰──────────────────────────╯`
            );
            return;
        }

        // Phone number validation
        if (!phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
            await sendTelegramMessage(chatId,
                `╭─ ⚠️ *Invalid Format* ─╮\n` +
                `│\n` +
                `│ ❌ Number: ${phoneNumber}\n` +
                `│\n` +
                `│ ✅ *Expected Format:*\n` +
                `│ +923035512967\n` +
                `│\n` +
                `│ 🔢 *Rules:*\n` +
                `│ • 9-15 digits after country code\n` +
                `│ • Must start with +\n` +
                `│\n` +
                `╰──────────────────────────╯`
            );
            return;
        }

        // ============ Processing Request ============
        const processingMsg = await sendTelegramMessage(chatId,
            `╭─ ⏳ *Processing...* ─╮\n` +
            `│\n` +
            `│ 📞 Number: ${phoneNumber}\n` +
            `│ 🔄 Status: Connecting...\n` +
            `│\n` +
            `│ Please wait... (5-10 seconds)\n` +
            `│\n` +
            `╰──────────────────────────╯`,
            { disable_notification: true }
        );
        processingMsgId = processingMsg?.message_id;

        let pairingCode = null;
        let attempts = 0;
        const maxAttempts = 3;

        // Generate pairing code with retry logic
        while (attempts < maxAttempts && !pairingCode) {
            try {
                const mockRes = {
                    headersSent: false,
                    send: (data) => {
                        if (data && data.code) {
                            pairingCode = data.code;
                        }
                    },
                    status: () => mockRes
                };

                await EmpirePair(phoneNumber.replace(/[^0-9]/g, ''), mockRes);
                
                if (pairingCode) break;
                attempts++;
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } catch (retryErr) {
                console.warn(`Pairing attempt ${attempts + 1} failed:`, retryErr.message);
                attempts++;
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }

        if (!pairingCode) {
            throw new Error('Failed to generate pairing code after 3 attempts');
        }

        // ============ SUCCESS RESPONSE ============
        const successMsg = 
            `╭─ ✅ *CODE GENERATED* ─╮\n` +
            `│\n` +
            `│ 📱 Number: ${phoneNumber}\n` +
            `│ 🔐 Code: *${pairingCode}*\n` +
            `│\n` +
            `├─ 📋 *STEPS:*\n` +
            `│ 1️⃣  Open WhatsApp\n` +
            `│ 2️⃣  Settings → Linked Devices\n` +
            `│ 3️⃣  Link a Device\n` +
            `│ 4️⃣  Enter code above\n` +
            `│\n` +
            `│ ⏰ Code expires in 60 seconds!\n` +
            `│\n` +
            `╰──────────────────────────╯`;

        await sendTelegramMessage(chatId, successMsg, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '📋 Copy Code',
                            callback_data: `copy_${pairingCode}`
                        },
                        {
                            text: '🔄 New Code',
                            callback_data: `pair_${phoneNumber}`
                        }
                    ],
                    [
                        {
                            text: '❓ Help',
                            callback_data: 'help_pair'
                        }
                    ]
                ]
            }
        });

        // Delete processing message
        if (processingMsgId) {
            try {
                await telegramBot.deleteMessage(chatId, processingMsgId);
            } catch (err) {
                console.warn('Failed to delete processing message:', err.message);
            }
        }

    } catch (error) {
        console.error("Telegram Pair Command Error:", error.message, error.stack);

        const errorMsg = `╭─ ❌ *ERROR* ─╮\n` +
            `│\n` +
            `│ 🚫 Failed to generate code\n` +
            `│\n` +
            `│ 🔧 *Error:*\n` +
            `│ ${error.message.substring(0, 40)}...\n` +
            `│\n` +
            `│ 🔄 Try again or contact support\n` +
            `│\n` +
            `╰──────────────────────────╯`;

        await sendTelegramMessage(chatId, errorMsg);

        // Delete processing message on error
        if (processingMsgId) {
            try {
                await telegramBot.deleteMessage(chatId, processingMsgId);
            } catch (err) {
                console.warn('Failed to delete processing message:', err.message);
            }
        }
    }
}

// Handle Telegram Ping Command
async function handleTelegramPingCommand(chatId, msg) {
    try {
        const startTime = Date.now();
        
        const activeSessions = activeSockets?.size || 0;
        const memoryUsage = process.memoryUsage();
        const ramUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const ramTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);
        const ramPercentage = Math.round((ramUsed / ramTotal) * 100);

        const pingTime = Date.now() - startTime;
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        // Status bar
        let statusBar = '🟢';
        if (ramPercentage > 80) statusBar = '🔴';
        else if (ramPercentage > 60) statusBar = '🟡';

        const statusMsg = 
            `╭─ 🏓 *Bot Status* ─╮\n` +
            `│\n` +
            `│ ⚡ Response: ${pingTime}ms\n` +
            `│ 🤖 Sessions: ${activeSessions}\n` +
            `│\n` +
            `│ ⏰ Uptime:\n` +
            `│ ${days}d ${hours}h ${minutes}m ${seconds}s\n` +
            `│\n` +
            `│ 💾 Memory: ${statusBar}\n` +
            `│ ${ramUsed}MB / ${ramTotal}MB (${ramPercentage}%)\n` +
            `│\n` +
            `│ 🟢 Status: Operational\n` +
            `│\n` +
            `╰──────────────────────────╯\n` +
            `_${new Date().toLocaleString()}_`;

        await sendTelegramMessage(chatId, statusMsg);

    } catch (error) {
        console.error('Telegram Ping Command Error:', error.message, error.stack);
        const errorMsg = 
            `╭─ ❌ *Status Failed* ─╮\n` +
            `│\n` +
            `│ Error: ${error.message.substring(0, 30)}...\n` +
            `│\n` +
            `│ Try again later\n` +
            `│\n` +
            `╰──────────────────────────╯`;
        
        await sendTelegramMessage(chatId, errorMsg);
    }
}

// Handle button callbacks
function setupTelegramCallbacks() {
    if (!telegramBot) return;
    
    try {
        telegramBot.on('callback_query', async (query) => {
            const chatId = query.message.chat.id;
            const data = query.data;

            try {
                // Copy code button
                if (data.startsWith('copy_')) {
                    const code = data.replace('copy_', '');
                    await telegramBot.answerCallbackQuery(query.id, {
                        text: `✅ Code copied: ${code}`,
                        show_alert: true
                    });
                    return;
                }

                // Help button
                if (data === 'help_pair') {
                    const helpMsg = 
                        `╭─ ❓ *Pairing Help* ─╮\n` +
                        `│\n` +
                        `│ 📋 *Steps to Pair:*\n` +
                        `│\n` +
                        `│ 1. Open WhatsApp\n` +
                        `│ 2. Settings → Linked Devices\n` +
                        `│ 3. Tap Link a Device\n` +
                        `│ 4. Scan QR or enter code\n` +
                        `│\n` +
                        `│ ⏰ Code expires in 60 seconds\n` +
                        `│\n` +
                        `│ 🔗 *Commands:*\n` +
                        `│ /pair +number\n` +
                        `│ /ping - Check status\n` +
                        `│ /start - Menu\n` +
                        `│\n` +
                        `╰──────────────────────────╯`;

                    await sendTelegramMessage(chatId, helpMsg);
                    await telegramBot.answerCallbackQuery(query.id);
                    return;
                }

                await telegramBot.answerCallbackQuery(query.id);
            } catch (err) {
                console.error('Callback error:', err.message);
                await telegramBot.answerCallbackQuery(query.id, {
                    text: 'Error processing request',
                    show_alert: false
                });
            }
        });

        console.log('✅ Telegram callbacks registered');
    } catch (error) {
        console.error('Error setting up callbacks:', error.message);
    }
}

// Utility function to send Telegram messages with error handling
async function sendTelegramMessage(chatId, message, options = {}) {
    if (!telegramBot) {
        console.warn('Telegram bot not initialized');
        return null;
    }
    
    try {
        return await telegramBot.sendMessage(chatId, message, { 
            parse_mode: 'Markdown',
            ...options 
        });
    } catch (error) {
        console.error('Failed to send Telegram message:', error.message);
        throw error;
    }
}

// Initialize Telegram bot when module loads
const telegramBotInstance = initializeTelegramBot();
setupTelegramCallbacks();
// MongoDB Connection (Optional) - OPTIMIZED with Connection Pooling
let useMongoDb = false;
const connectMongoDB = async () => {
    if (!config.MONGODB_URI || config.MONGODB_URI === '') {
        console.log('⚠️  MongoDB URI not configured - using local file-based session storage');
        useMongoDb = false;
        return;
    }

    try {
        await mongoose.connect(config.MONGODB_URI, {
            maxPoolSize: 10,
            minPoolSize: 2,
            maxIdleTimeMS: 30000,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log('✅ Connected to MongoDB successfully (Pool: 10 connections)');
        useMongoDb = true;

        await mongoose.connection.db.collection('sessions').createIndex({ number: 1 }, { unique: true });
        await mongoose.connection.db.collection('sessions').createIndex({ updatedAt: 1 });

    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.log('⚠️  Falling back to local file-based session storage');
        useMongoDb = false;
    }
};

// Call MongoDB connection on startup
connectMongoDB();

const { Session, loadUserConfig, updateUserConfig, deleteUserConfig } = require('./lib/userConfigService');

const activeSockets = new Map();
const socketCreationTime = new Map();
const SESSION_BASE_PATH = config.SESSION_BASE_PATH;
const NUMBER_LIST_PATH = config.NUMBER_LIST_PATH;
const otpStore = new Map();

// ===== PERFORMANCE CACHES =====
const groupMetadataCache = new Map(); // { jid -> { data, expiresAt } }
const GROUP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedGroupMetadata(socket, jid) {
    const now = Date.now();
    const cached = groupMetadataCache.get(jid);
    if (cached && now < cached.expiresAt) return cached.data;
    try {
        const data = await socket.groupMetadata(jid);
        groupMetadataCache.set(jid, { data, expiresAt: now + GROUP_CACHE_TTL });
        return data;
    } catch (e) {
        return null;
    }
}

// In-memory file caches (refreshed every 30s)
let _banCache = null;
let _sudoCache = null;
let _banCacheTime = 0;
let _sudoCacheTime = 0;
const FILE_CACHE_TTL = 30000;

function getBanList() {
    if (_banCache && Date.now() - _banCacheTime < FILE_CACHE_TTL) return _banCache;
    try { _banCache = JSON.parse(fs.readFileSync('./lib/ban.json', 'utf-8')); } catch { _banCache = []; }
    _banCacheTime = Date.now();
    return _banCache;
}

function getSudoList() {
    if (_sudoCache && Date.now() - _sudoCacheTime < FILE_CACHE_TTL) return _sudoCache;
    try { _sudoCache = JSON.parse(fs.readFileSync('./lib/sudo.json', 'utf-8')); } catch { _sudoCache = []; }
    _sudoCacheTime = Date.now();
    return _sudoCache;
}

function invalidateBanCache() { _banCache = null; }
function invalidateSudoCache() { _sudoCache = null; }

if (!fs.existsSync(SESSION_BASE_PATH)) {
    fs.mkdirSync(SESSION_BASE_PATH, { recursive: true });
}

let adminCache = null;
let adminCacheTime = 0;
const ADMIN_CACHE_TTL = 60000;

function loadAdmins() {
    if (adminCache && (Date.now() - adminCacheTime) < ADMIN_CACHE_TTL) {
        return [...adminCache];
    }
    
    try {
        if (fs.existsSync(config.ADMIN_LIST_PATH)) {
            const admins = JSON.parse(fs.readFileSync(config.ADMIN_LIST_PATH, 'utf8'));
            adminCache = [...admins];
            adminCacheTime = Date.now();
            return [...adminCache];
        }
        return [];
    } catch (error) {
        console.error('Failed to load admin list:', error);
        return [];
    }
}

function clearAdminCache() {
    adminCache = null;
    adminCacheTime = 0;
}

function formatMessage(title, content, footer) {
    return `*${title}*\n\n${content}\n\n> *${footer}*`;
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function getSriLankaTimestamp() {
    return moment().tz('Africa/Harare').format('YYYY-MM-DD HH:mm:ss');
}

function resolveBooleanFlag(userValue, defaultValue) {
    if (userValue !== undefined && userValue !== null) {
        return userValue === true || userValue === 'true';
    }
    return defaultValue === true || defaultValue === 'true';
}

async function downloadMediaBuffer(mediaMessage, messageType) {
    try {
        const stream = await downloadContentFromMessage(mediaMessage, messageType);
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    } catch (error) {
        console.error(`Failed to download ${messageType}:`, error);
        return null;
    }
}

async function cleanDuplicateFiles(number) {
    // No need for this with MongoDB - automatic deduplication
    console.log(`Session management for ${number} handled by MongoDB`);
}

async function joinGroup(socket) {
    let retries = config.MAX_RETRIES;
    const inviteCodeMatch = config.GROUP_INVITE_LINK.match(/chat\.whatsapp\.com\/([a-zA-Z0-9-_]+)/);
    if (!inviteCodeMatch) {
        console.error('Invalid group invite link format');
        return { status: 'failed', error: 'Invalid group invite link' };
    }
    const inviteCode = inviteCodeMatch[1];

    while (retries > 0) {
        try {
            const response = await socket.groupAcceptInvite(inviteCode);
            if (response?.gid) {
                console.log(`Successfully joined group with ID: ${response.gid}`);
                return { status: 'success', gid: response.gid };
            }
            throw new Error('No group ID in response');
        } catch (error) {
            retries--;
            let errorMessage = error.message || 'Unknown error';
            if (error.message && error.message.includes('not-authorized')) {
                errorMessage = 'Bot is not authorized to join (possibly banned)';
            } else if (error.message && error.message.includes('conflict')) {
                errorMessage = 'Bot is already a member of the group';
            } else if (error.message && error.message.includes('gone')) {
                errorMessage = 'Group invite link is invalid or expired';
            }
            console.warn(`Failed to join group, retries left: ${retries}`, errorMessage);
            if (retries === 0) {
                return { status: 'failed', error: errorMessage };
            }
            await delay(2000 * (config.MAX_RETRIES - retries));
        }
    }
    return { status: 'failed', error: 'Max retries reached' };
}

/*async function sendOwnerConnectMessage(socket, number, groupResult) {
    if (!config.OWNER_NUMBER || config.OWNER_NUMBER === '') {
        console.log('⚠️ OWNER_NUMBER not configured, skipping connect message');
        return;
    }

    const groupStatus = groupResult.status === 'success'
        ? `✅ Joined Group`
        : `❌ ${groupResult.error || 'Could not join group'}`;

    const caption = `╭━━━━━━━━━━━━━╮
┃  🤖 *ADEEL-MINI* 
┃━━━━━━━━━━━━━
┃ ✅ *Bot Connected Successfully!*
┃━━━━━━━━━━━━━
┃ 📱 *Number:* ${number || 'Unknown'}
┃ 🌐 *Status:* Online
┃ 📡 *Group:* ${groupStatus}
┃ 🎯 *Prefix:* ${config.PREFIX || '.'}
┃ 📝 *Command:* ${config.PREFIX || '.'}menu
┃━━━━━━━━━━━━
┃ ⏰ *Time:* ${new Date().toLocaleString()}
╰━━━━━━━━━━━━╯
> © ADEEL-MINI ッ`;

    try {
        const imagePath = config.XD_IMAGE_PATH || './data/ADEEL.jpg';
        
        if (fs.existsSync(imagePath)) {
            await socket.sendMessage(
                `${config.OWNER_NUMBER}@s.whatsapp.net`,
                {
                    image: { url: imagePath },
                    caption
                }
            );
        } else {
            await socket.sendMessage(
                `${config.OWNER_NUMBER}@s.whatsapp.net`,
                { text: caption }
            );
        }
        console.log(`✅ Connect message sent to owner ${config.OWNER_NUMBER}`);
    } catch (error) {
        console.error(`❌ Failed to send connect message to owner ${config.OWNER_NUMBER}:`, error.message);
    }
}
*/
async function sendOTP(socket, number, otp) {
    const userJid = jidNormalizedUser(socket.user.id);
    const message = formatMessage(
        '🔐 OTP VERIFICATION',
        `Your OTP for config update is: *${otp}*\nThis OTP will expire in ${Math.floor(config.OTP_EXPIRY / 60000)} minutes.`,
        '> ADEEL-MINI :)'
    );

    try {
        await socket.sendMessage(userJid, { text: message });
        console.log(`OTP ${otp} sent to ${number}`);
    } catch (error) {
        console.error(`Failed to send OTP to ${number}:`, error);
        throw error;
    }
}

function setupNewsletterHandlers(socket) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const message = messages[0];
        if (!message?.key) return;

        const allNewsletterJIDs = await loadNewsletterJIDsFromRaw();
        const jid = message.key.remoteJid;

        if (!allNewsletterJIDs.includes(jid)) return;

        try {
            const emojis = ['👍', '❤️', ',🪩', '😮'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            const messageId = message.newsletterServerId;

            if (!messageId) {
                console.warn('No newsletterServerId found in message:', message);
                return;
            }

            let retries = 3;
            while (retries-- > 0) {
                try {
                    await socket.newsletterReactMessage(jid, messageId.toString(), randomEmoji);
                    console.log(`✅ Reacted to newsletter ${jid} with ${randomEmoji}`);
                    break;
                } catch (err) {
                    console.warn(`❌ Reaction attempt failed (${3 - retries}/3):`, err.message || err);
                    await delay(1500);
                }
            }
        } catch (error) {
            console.error('⚠️ Newsletter reaction handler failed:', error.message || error);
        }
    });
}

async function setupStatusHandlers(socket, number) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const message = messages[0];
        if (!message?.key || message.key.remoteJid !== 'status@broadcast' || !message.key.participant || message.key.remoteJid === config.NEWSLETTER_JID) return;

        try {
            const sanitizedNumber = number.replace(/[^0-9]/g, '');
            const userConfig = await loadUserConfig(sanitizedNumber);

            if (resolveBooleanFlag(userConfig.AUTO_RECORDING, config.AUTO_RECORDING) && message.key.remoteJid) {
                await socket.sendPresenceUpdate("recording", message.key.remoteJid);
            }

            if (resolveBooleanFlag(userConfig.AUTO_VIEW_STATUS, config.AUTO_VIEW_STATUS)) {
                let retries = config.MAX_RETRIES;
                while (retries > 0) {
                    try {
                        await socket.readMessages([message.key]);
                        break;
                    } catch (error) {
                        retries--;
                        console.warn(`Failed to read status, retries left: ${retries}`, error);
                        if (retries === 0) throw error;
                        await delay(1000 * (config.MAX_RETRIES - retries));
                    }
                }
            }

            if (resolveBooleanFlag(userConfig.AUTO_LIKE_STATUS, config.AUTO_LIKE_STATUS)) {
                const randomEmoji = config.AUTO_LIKE_EMOJI[Math.floor(Math.random() * config.AUTO_LIKE_EMOJI.length)];
                let retries = config.MAX_RETRIES;
                while (retries > 0) {
                    try {
                        await socket.sendMessage(
                            message.key.remoteJid,
                            { react: { text: randomEmoji, key: message.key } },
                            { statusJidList: [message.key.participant] }
                        );
                        console.log(`Reacted to status with ${randomEmoji}`);
                        break;
                    } catch (error) {
                        retries--;
                        console.warn(`Failed to react to status, retries left: ${retries}`, error);
                        if (retries === 0) throw error;
                        await delay(1000 * (config.MAX_RETRIES - retries));
                    }
                }
            }
        } catch (error) {
            console.error('Status handler error:', error);
        }
    });
}

async function handleAntiDelete(socket, number) {
    const { getAnti, setAnti } = require('./data/antidel');

    socket.ev.on('messages.delete', async ({ keys }) => {
        if (!keys || keys.length === 0) return;

        try {
            const messageKey = keys[0];
            const chatId = messageKey.remoteJid;
            const messageId = messageKey.id;

            // Check antidelete settings based on chat type
            const isGroup = chatId.endsWith('@g.us');
            const isStatus = chatId === 'status@broadcast';
            const isDM = !isGroup && !isStatus;

            let shouldHandle = false;
            if (isGroup) {
                shouldHandle = await getAnti('gc');
            } else if (isDM) {
                shouldHandle = await getAnti('dm');
            } else if (isStatus) {
                shouldHandle = await getAnti('status');
            }

            if (!shouldHandle) {
                return;
            }

            const storedMessage = getStoredMessage(chatId, messageId);

            if (!storedMessage) {
                console.log(`No stored message found for deleted message: ${messageId}`);
                return;
            }

            const sanitizedNumber = number.replace(/[^0-9]/g, '');
            const userConfig = await loadUserConfig(sanitizedNumber);
            const antideleteMode = userConfig.ANTIDELETE || config.ANTIDELETE || 'chat';

            const userJid = jidNormalizedUser(socket.user.id);
            const ownerJid = config.OWNER_NUMBER + '@s.whatsapp.net';
            const deletionTime = getSriLankaTimestamp();

            const targetJid = antideleteMode === 'private' ? ownerJid : chatId;

            const sender = storedMessage.key?.participant || storedMessage.key?.remoteJid || 'Unknown';
            const senderName = storedMessage.pushName || sender.split('@')[0];

            let deletedContent = `🗑️ *DELETED MESSAGE*\n\n`;
            deletedContent += `👤 From: ${senderName}\n`;
            deletedContent += `📱 Number: ${sender}\n`;
            deletedContent += `💬 Chat: ${chatId}\n`;
            deletedContent += `🕒 Deleted at: ${deletionTime}\n\n`;

            let actualMessage = storedMessage.message;

            if (actualMessage?.ephemeralMessage) {
                actualMessage = actualMessage.ephemeralMessage.message;
            }
            if (actualMessage?.viewOnceMessage) {
                actualMessage = actualMessage.viewOnceMessage.message;
            }
            if (actualMessage?.viewOnceMessageV2) {
                actualMessage = actualMessage.viewOnceMessageV2.message;
            }
            if (actualMessage?.viewOnceMessageV2Extension) {
                actualMessage = actualMessage.viewOnceMessageV2Extension.message;
            }

            const messageType = Object.keys(actualMessage || {})[0];

            if (actualMessage?.conversation || actualMessage?.extendedTextMessage?.text) {
                const textContent = actualMessage?.conversation || actualMessage?.extendedTextMessage?.text;
                deletedContent += `📝 Message: ${textContent}`;

                await socket.sendMessage(targetJid, {
                    text: deletedContent + '\n\n> © ADEEL-MINI :)'
                });
            } else if (actualMessage?.imageMessage) {
                const caption = actualMessage.imageMessage.caption || 'No caption';
                const imageBuffer = await downloadMediaBuffer(actualMessage.imageMessage, 'image');
                if (imageBuffer) {
                    await socket.sendMessage(targetJid, {
                        image: imageBuffer,
                        caption: deletedContent + `🖼️ Image Caption: ${caption}\n\n> © ADEEL-MINI :)`
                    });
                } else {
                    await socket.sendMessage(targetJid, {
                        text: deletedContent + `🖼️ Image was deleted (failed to retrieve)\nCaption: ${caption}\n\n> © ADEEL-MINI :)`
                    });
                }
            } else if (actualMessage?.videoMessage) {
                const caption = actualMessage.videoMessage.caption || 'No caption';
                const videoBuffer = await downloadMediaBuffer(actualMessage.videoMessage, 'video');
                if (videoBuffer) {
                    await socket.sendMessage(targetJid, {
                        video: videoBuffer,
                        caption: deletedContent + `🎥 Video Caption: ${caption}\n\n> © ADEEL-MINI :)`
                    });
                } else {
                    await socket.sendMessage(targetJid, {
                        text: deletedContent + `🎥 Video was deleted (failed to retrieve)\nCaption: ${caption}\n\n> © ADEEL-MINI :)`
                    });
                }
            } else if (actualMessage?.stickerMessage) {
                const stickerBuffer = await downloadMediaBuffer(actualMessage.stickerMessage, 'sticker');
                if (stickerBuffer) {
                    await socket.sendMessage(targetJid, {
                        text: deletedContent + `🎨 Sticker was deleted\n\n> © ADEEL-MINI :)`
                    });
                    await socket.sendMessage(targetJid, {
                        sticker: stickerBuffer
                    });
                } else {
                    await socket.sendMessage(targetJid, {
                        text: deletedContent + `🎨 Sticker was deleted (failed to retrieve)\n\n> © ADEEL-MINI :)`
                    });
                }
            } else if (actualMessage?.audioMessage) {
                const audioBuffer = await downloadMediaBuffer(actualMessage.audioMessage, 'audio');
                if (audioBuffer) {
                    await socket.sendMessage(targetJid, {
                        audio: audioBuffer,
                        mimetype: actualMessage.audioMessage.mimetype || 'audio/mp4'
                    });
                    await socket.sendMessage(targetJid, {
                        text: deletedContent + `🎵 Audio message\n\n> © ADEEL-MINI :)`
                    });
                } else {
                    await socket.sendMessage(targetJid, {
                        text: deletedContent + `🎵 Audio was deleted (failed to retrieve)\n\n> © ADEEL-MINI :)`
                    });
                }
            } else if (actualMessage?.documentMessage) {
                const fileName = actualMessage.documentMessage.fileName || 'document';
                const docBuffer = await downloadMediaBuffer(actualMessage.documentMessage, 'document');
                if (docBuffer) {
                    await socket.sendMessage(targetJid, {
                        document: docBuffer,
                        mimetype: actualMessage.documentMessage.mimetype,
                        fileName: fileName,
                        caption: deletedContent + `📄 Document: ${fileName}\n\n> © ADEEL-MINI :)`
                    });
                } else {
                    await socket.sendMessage(targetJid, {
                        text: deletedContent + `📄 Document was deleted (failed to retrieve)\nFile: ${fileName}\n\n> © ADEEL-MINI :)`
                    });
                }
            } else {
                deletedContent += `ℹ️ Message Type: ${messageType || 'Unknown'}`;
                await socket.sendMessage(targetJid, {
                    text: deletedContent + '\n\n> © ADEEL-MINI :)'
                });
            }

            console.log(`[ANTIDELETE] Forwarded deleted message to ${antideleteMode} mode`);

        } catch (error) {
            console.error('[ANTIDELETE] Error handling deleted message:', error);
        }
    });
}

const messageStore = new Map();

function storeMessage(chatId, messageId, message) {
    if (!messageStore.has(chatId)) {
        messageStore.set(chatId, new Map());
    }

    const messageClone = JSON.parse(JSON.stringify(message));
    messageStore.get(chatId).set(messageId, messageClone);

    setTimeout(() => {
        const chatMessages = messageStore.get(chatId);
        if (chatMessages) {
            chatMessages.delete(messageId);
            if (chatMessages.size === 0) {
                messageStore.delete(chatId);
            }
        }
    }, 24 * 60 * 60 * 1000);
}

function getStoredMessage(chatId, messageId) {
    return messageStore.get(chatId)?.get(messageId);
}

async function handleAntiEdit(socket, m, number) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        const userConfig = await loadUserConfig(sanitizedNumber);
        const antieditMode = userConfig.ANTIEDIT || config.ANTIEDIT;

        if (!antieditMode || antieditMode === 'false') {
            return;
        }

        if (!m.message?.protocolMessage?.editedMessage) {
            return;
        }

        const messageId = m.message.protocolMessage.key.id;
        const chatId = m.chat;
        const editedBy = m.sender;

        const originalMsg = getStoredMessage(chatId, messageId);

        if (!originalMsg) {
            console.log("⚠️ Original message not found in store.");
            return;
        }

        const sender = originalMsg.key?.participant || originalMsg.key?.remoteJid;

        let chatName;
        if (chatId.endsWith("@g.us")) {
            try {
                const groupInfo = await socket.groupMetadata(chatId);
                chatName = groupInfo.subject || "Group Chat";
            } catch {
                chatName = "Group Chat";
            }
        } else {
            chatName = originalMsg.pushName || "Private Chat";
        }

        const xtipes = moment(originalMsg.messageTimestamp * 1000).tz('Africa/Harare').locale('en').format('HH:mm z');
        const xdptes = moment(originalMsg.messageTimestamp * 1000).tz('Africa/Harare').format("DD/MM/YYYY");

        const originalText = originalMsg.message?.conversation || 
                          originalMsg.message?.extendedTextMessage?.text ||
                          "[Text not available]";

        const editedText = m.message.protocolMessage?.editedMessage?.conversation || 
                        m.message.protocolMessage?.editedMessage?.extendedTextMessage?.text ||
                        "[Edit content not available]";

        const readmore = '\u200B'.repeat(4001);
        const replyText = `🔮 *𝙴𝙳𝙸𝚃𝙴𝙳 𝙼𝙴𝚂𝚂𝙰𝙶𝙴!* 🔮
${readmore}
• 𝙲𝙷𝙰𝚃: ${chatName}
• 𝚂𝙴𝙽𝚃 𝙱𝚈: @${sender.split('@')[0]} 
• 𝚃𝙸𝙼𝙴: ${xtipes}
• 𝙳𝙰𝚃𝙴: ${xdptes}
• 𝙴𝙳𝙸𝚃𝙴𝙳 𝙱𝚈: @${editedBy.split('@')[0]}

• 𝙾𝚁𝙸𝙶𝙸𝙽𝙰𝙻: ${originalText}

• 𝙴𝙳𝙸𝚃𝙴𝙳 𝚃𝙾: ${editedText}`;

        const quotedMessage = {
            key: {
                remoteJid: chatId,
                fromMe: sender === socket.user.id,
                id: messageId,
                participant: sender
            },
            message: {
                conversation: originalText 
            }
        };

        let targetChat;
        if (antieditMode === 'private') {
            targetChat = socket.user.id;
            console.log(`📤 Anti-edit: Sending to bot owner's inbox`);
        } else if (antieditMode === 'chat') {
            targetChat = chatId;
            console.log(`📤 Anti-edit: Sending to same chat`);
        } else {
            console.log("❌ Invalid anti-edit mode");
            return;
        }

        await socket.sendMessage(
            targetChat, 
            { text: replyText, mentions: [sender, editedBy] }, 
            { quoted: quotedMessage }
        );

        console.log(`✅ Edited message captured and sent to: ${antieditMode === 'private' ? 'bot owner' : 'same chat'}`);

    } catch (err) {
        console.error("❌ Error processing edited message:", err);
    }
}

async function resize(image, width, height) {
    if (!Jimp) Jimp = require('jimp');
    let oyy = await Jimp.read(image);
    let kiyomasa = await oyy.resize(width, height).getBufferAsync(Jimp.MIME_JPEG);
    return kiyomasa;
}

function capital(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const createSerial = (size) => {
    return crypto.randomBytes(size).toString('hex').slice(0, size);
}

async function oneViewmeg(socket, isOwner, msg ,sender) {
    if (isOwner) {  
        try {
            const akuru = sender;
            const quot = msg;
            if (quot) {
                if (quot.imageMessage?.viewOnce) {
                    let cap = quot.imageMessage?.caption || "";
                    let anu = await socket.downloadAndSaveMediaMessage(quot.imageMessage);
                    await socket.sendMessage(akuru, { image: { url: anu }, caption: cap });
                } else if (quot.videoMessage?.viewOnce) {
                    let cap = quot.videoMessage?.caption || "";
                    let anu = await socket.downloadAndSaveMediaMessage(quot.videoMessage);
                    await socket.sendMessage(akuru, { video: { url: anu }, caption: cap });
                } else if (quot.audioMessage?.viewOnce) {
                    let cap = quot.audioMessage?.caption || "";
                    let anu = await socket.downloadAndSaveMediaMessage(quot.audioMessage);
                    await socket.sendMessage(akuru, { audio: { url: anu }, caption: cap });
                } else if (quot.viewOnceMessageV2?.message?.imageMessage){
                    let cap = quot.viewOnceMessageV2?.message?.imageMessage?.caption || "";
                    let anu = await socket.downloadAndSaveMediaMessage(quot.viewOnceMessageV2.message.imageMessage);
                    await socket.sendMessage(akuru, { image: { url: anu }, caption: cap });
                } else if (quot.viewOnceMessageV2?.message?.videoMessage){
                    let cap = quot.viewOnceMessageV2?.message?.videoMessage?.caption || "";
                    let anu = await socket.downloadAndSaveMediaMessage(quot.viewOnceMessageV2.message.videoMessage);
                    await socket.sendMessage(akuru, { video: { url: anu }, caption: cap });
                } else if (quot.viewOnceMessageV2Extension?.message?.audioMessage){
                    let cap = quot.viewOnceMessageV2Extension?.message?.audioMessage?.caption || "";
                    let anu = await socket.downloadAndSaveMediaMessage(quot.viewOnceMessageV2Extension.message.audioMessage);
                    await socket.sendMessage(akuru, { audio: { url: anu }, caption: cap });
                }
            }        
        } catch (error) {
            console.error('oneViewmeg error:', error);
        }
    }
}

function setupCommandHandlers(socket, number) {
    // Contact message for verified context (used as quoted message)
   /* const verifiedContact = {
        key: {
            fromMe: false,
            participant: `0@s.whatsapp.net`,
            remoteJid: "status@broadcast"
        },
        message: {
            contactMessage: {
                displayName: "ADEEL-MINI",
                vcard: "BEGIN:VCARD\nVERSION:3.0\nFN: Tᴇʀʀɪ 🧚‍♀️\nORG:Vᴇʀᴏɴɪᴄᴀ BOT;\nTEL;type=CELL;type=VOICE;waid=93775551335:+9230355129679341378016\nEND:VCARD"
            }
        }
    };
    */

  // Create the AI message structure
        const verifiedContact = {
            key: {
                remoteJid: "status@broadcast",
                fromMe: false,
                participant: "13135550002@s.whatsapp.net"
            },
            message: {
                contactMessage: {
                    displayName: "© ADEEL-MINI :) ",
                    vcard: `BEGIN:VCARD
VERSION:3.0
FN:Meta AI
TEL;type=CELL;type=VOICE;waid=13135550002:+1 3135550002
END:VCARD`
                }
            }
        };  
        // Create the AI message structure
        const BOT_NAME = "ADEEL-MINI";
        const ai = {
    key: {
        fromMe: false,
        participant: `0@s.whatsapp.net`,
        remoteJid: 'status@broadcast'
    },
    message: {
        contactMessage: {
            displayName: `${BOT_NAME}`,
            vcard:
`BEGIN:VCARD
VERSION:3.0
N:;${BOT_NAME};;;
FN:${BOT_NAME}
item1.TEL;waid=923035512967:ADEEL-MINI
item1.X-ABLabel:ADEEL-MINI
END:VCARD`
        }
    }
};

    // Anti-call system - per user configuration
    const recentCallers = new Set();
    socket.ev.on("call", async (callData) => {
        try {
            const sanitizedNumber = number.replace(/[^0-9]/g, '');
            const userConfig = await loadUserConfig(sanitizedNumber);

            if (userConfig.ANTICALL !== 'true') {
                console.log(`📞 Anti-call is disabled for ${sanitizedNumber}, ignoring call`);
                return;
            }

            const calls = Array.isArray(callData) ? callData : [callData];

            for (const call of calls) {
                if (call.status === "offer" && !call.fromMe) {
                    console.log(`📵 Incoming call from: ${call.from} to ${sanitizedNumber}`);

                    try {
                        await socket.rejectCall(call.id, call.from);
                        console.log('✅ Call rejected');
                    } catch (e) {
                        console.log('⚠️ Could not reject call (might be already ended):', e.message);
                    }

                    if (!recentCallers.has(call.from)) {
                        recentCallers.add(call.from);

                        try {
                            await socket.sendMessage(call.from, {
                                text: `*📵 Call Rejected Automatically!*\n\n*Owner is busy, please do not call!* ⚠️\n\nSend a message instead for faster response.\n\n> © ADEEL-MINI ッ`
                            });
                            console.log('📩 Warning message sent');
                        } catch (msgError) {
                            console.log('⚠️ Could not send warning message:', msgError.message);
                        }

                        setTimeout(() => {
                            recentCallers.delete(call.from);
                            console.log(`🔄 Cleared caller from recent list: ${call.from}`);
                        }, 10 * 60 * 1000);
                    } else {
                        console.log('⚠️ Already sent warning to this caller recently');
                    }
                }
            }
        } catch (error) {
            console.error('❌ Anti-call system error:', error.message);
        }
    });

    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.remoteJid === 'status@broadcast' || msg.key.remoteJid === config.NEWSLETTER_JID) return;

        if (msg.key.id && msg.key.remoteJid) {
            storeMessage(msg.key.remoteJid, msg.key.id, msg);
        }

        const type = getContentType(msg.message);
        if (!msg.message) return;
        msg.message = (getContentType(msg.message) === 'ephemeralMessage') ? msg.message.ephemeralMessage.message : msg.message;
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        const m = sms(socket, msg);

        if (type === 'protocolMessage' && msg.message.protocolMessage?.editedMessage) {
            await handleAntiEdit(socket, m, number);
            return;
        }

        const quoted =
            type == "extendedTextMessage" &&
            msg.message.extendedTextMessage.contextInfo != null
            ? msg.message.extendedTextMessage.contextInfo.quotedMessage || []
            : [];
        const body = (type === 'conversation') ? msg.message.conversation 
            : msg.message?.extendedTextMessage?.contextInfo?.hasOwnProperty('quotedMessage') 
            ? msg.message.extendedTextMessage.text 
            : (type == 'interactiveResponseMessage') 
            ? msg.message.interactiveResponseMessage?.nativeFlowResponseMessage 
                && JSON.parse(msg.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson)?.id 
            : (type == 'templateButtonReplyMessage') 
            ? msg.message.templateButtonReplyMessage?.selectedId 
            : (type === 'extendedTextMessage') 
            ? msg.message.extendedTextMessage.text 
            : (type == 'imageMessage') && msg.message.imageMessage.caption 
            ? msg.message.imageMessage.caption 
            : (type == 'videoMessage') && msg.message.videoMessage.caption 
            ? msg.message.videoMessage.caption 
            : (type == 'buttonsResponseMessage') 
            ? msg.message.buttonsResponseMessage?.selectedButtonId 
            : (type == 'listResponseMessage') 
            ? msg.message.listResponseMessage?.singleSelectReply?.selectedRowId 
            : (type == 'messageContextInfo') 
            ? (msg.message.buttonsResponseMessage?.selectedButtonId 
                || msg.message.listResponseMessage?.singleSelectReply?.selectedRowId 
                || msg.text) 
            : (type === 'viewOnceMessage') 
            ? msg.message[type]?.message[getContentType(msg.message[type].message)] 
            : (type === "viewOnceMessageV2") 
            ? (msg.msg.message.imageMessage?.caption || msg.msg.message.videoMessage?.caption || "") 
            : '';
        // Ensure body is a string
        const bodyStr = typeof body === 'string' ? body : (body ? String(body) : '');
        
        let sender = msg.key.remoteJid;
        const nowsender = msg.key.fromMe ? (socket.user.id.split(':')[0] + '@s.whatsapp.net' || socket.user.id) : (msg.key.participant || msg.key.remoteJid);
        const senderNumber = nowsender.split('@')[0];
        const developers = `${config.OWNER_NUMBER}`;
        const botNumber = socket.user.id.split(':')[0];
        const isbot = botNumber.includes(senderNumber);
        const isOwner = isbot ? isbot : developers.includes(senderNumber);

        // Check if message is from a group
        const isGroup = sender.endsWith('@g.us');
        const from = sender;

        // Fast command detection BEFORE any DB calls
        // We need prefix for this, so get a quick default first
        const quickPrefix = config.PREFIX;
        const hasPrefix = bodyStr && bodyStr.startsWith(quickPrefix);
        
        // Load userConfig only if message has prefix (potential command) or antilink active
        const userConfig = await loadUserConfig(sanitizedNumber);
        const prefix = userConfig.PREFIX || config.PREFIX;
        
        const command = bodyStr && bodyStr.startsWith(prefix) ? bodyStr.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
        const pushName = msg.pushName || m.pushName || "USER";
const text = bodyStr?.trim() || "";
const fullCommandText = text && typeof text === 'string' && text.startsWith(prefix) ? text.slice(prefix.length).trim() : "";
const args = fullCommandText ? fullCommandText.split(/\s+/).slice(1) : [];
const q = args.join(" ").trim();
  const reply = async (teks) => {
  await socket.sendMessage(from, {
    text: teks,
    contextInfo: {
      mentionedJid: [nowsender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363403380688821@newsletter', // Newsletter JID
        newsletterName: "ADEEL-MINI", // Newsletter name
        serverMessageId: 143 // Static ya dynamic ID
      }
    }
  }, { quoted: ai });
};
const react = async (emoji) => {
  await socket.sendMessage(from, {
    react: {
      text: emoji,     // Emoji to react with
      key: msg.key      // Same quoted message key as reply
    }
  });
};

const getGroupAdmins = (participants) => {
        var admins = []
        for (let i of participants) {
                i.admin !== null  ? admins.push(i.id) : ''
        }
        return admins
}
      const botNumber2 = await jidNormalizedUser(socket.user.id);
      const groupMetadata = isGroup ? await getCachedGroupMetadata(socket, from) : null
  const groupName = isGroup ? groupMetadata?.subject : ''
  const participants = isGroup ? groupMetadata?.participants : []
  const groupAdmins = isGroup ? await getGroupAdmins(participants) : []
  const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false
  const isAdmins = isGroup ? groupAdmins.includes(nowsender) : false

        // ==================== ANTILINK ENFORCEMENT ====================
        if (isGroup && !isAdmins && body) {
            try {
                const { getAntiLink } = require('./data/antilink');
                const antilinkEnabled = await getAntiLink(from);

                if (antilinkEnabled) {
                    const linkPatterns = [
                        /https?:\/\/(?:chat\.whatsapp\.com|wa\.me)\/\S+/gi,
                        /^https?:\/\/(www\.)?whatsapp\.com\/channel\/([a-zA-Z0-9_-]+)$/,
                        /wa\.me\/\S+/gi,
                        /https?:\/\/(?:t\.me|telegram\.me)\/\S+/gi,
                        /https?:\/\/(?:www\.)?youtube\.com\/\S+/gi,
                        /https?:\/\/youtu\.be\/\S+/gi,
                        /https?:\/\/(?:www\.)?facebook\.com\/\S+/gi,
                        /https?:\/\/fb\.me\/\S+/gi,
                        /https?:\/\/(?:www\.)?instagram\.com\/\S+/gi,
                        /https?:\/\/(?:www\.)?twitter\.com\/\S+/gi,
                        /https?:\/\/(?:www\.)?tiktok\.com\/\S+/gi,
                        /https?:\/\/(?:www\.)?linkedin\.com\/\S+/gi,
                        /https?:\/\/(?:www\.)?snapchat\.com\/\S+/gi,
                        /https?:\/\/(?:www\.)?pinterest\.com\/\S+/gi,
                        /https?:\/\/(?:www\.)?reddit\.com\/\S+/gi,
                        /https?:\/\/ngl\/\S+/gi,
                        /https?:\/\/(?:www\.)?discord\.com\/\S+/gi,
                        /https?:\/\/(?:www\.)?twitch\.tv\/\S+/gi,
                        /https?:\/\/(?:www\.)?vimeo\.com\/\S+/gi,
                        /https?:\/\/(?:www\.)?dailymotion\.com\/\S+/gi,
                        /https?:\/\/(?:www\.)?medium\.com\/\S+/gi
                    ];

                    const containsLink = linkPatterns.some(pattern => pattern.test(body));

                    if (containsLink) {
                        await socket.sendMessage(from, { 'delete': msg.key });
                        await socket.sendMessage(from, {
                            'text': `⚠️ *LINK DETECTED!*\n\n@${senderNumber} sent a link and has been removed from the group.\n\n🚫 Links are not allowed in this group.\n\n> © ADEEL-MINI ッ`,
                            'mentions': [nowsender]
                        });
                        await socket.groupParticipantsUpdate(from, [nowsender], "remove");
                        console.log(`✅ Kicked ${senderNumber} for posting link in ${from}`);
                        return;
                    }
                }
            } catch (error) {
                console.error('Antilink enforcement error:', error);
            }
        }

        socket.downloadAndSaveMediaMessage = async(message, filename = (Date.now()).toString(), attachExtension = true) => {
            let quoted = message.msg ? message.msg : message;
            let mime = (message.msg || message).mimetype || '';
            let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
            const stream = await downloadContentFromMessage(quoted, messageType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            if (!FileType) FileType = require('file-type');
            let type = await FileType.fromBuffer(buffer);
            const trueFileName = attachExtension ? (filename + '.' + (type ? type.ext : 'bin')) : filename;
            await fs.writeFileSync(trueFileName, buffer);
            return trueFileName;
        }

        // Handle prefix change
        if (global.pendingPrefixChange && global.pendingPrefixChange.has(nowsender)) {
            const prefixData = global.pendingPrefixChange.get(nowsender);
            if (Date.now() - prefixData.timestamp < 60000) {
                const newPrefix = body.trim();
                if (newPrefix.length === 1 || newPrefix.length === 2) {
                    const userConfig = await loadUserConfig(prefixData.number);
                    userConfig.PREFIX = newPrefix;
                    await updateUserConfig(prefixData.number, userConfig);
                    await socket.sendMessage(sender, {
                        text: `✅ *Prefix Changed*\n\nNew prefix: *${newPrefix}*\n\nExample: ${newPrefix}menu\n\n> © ADEEL-MINI ッ`
                    }, { quoted: msg });
                    global.pendingPrefixChange.delete(nowsender);
                    return;
                } else {
                    await socket.sendMessage(sender, {
                        text: `❌ Invalid prefix. Must be 1-2 characters.\n\nTry again with ${prefix}settings`
                    }, { quoted: msg });
                    global.pendingPrefixChange.delete(nowsender);
                    return;
                }
            } else {
                global.pendingPrefixChange.delete(nowsender);
            }
        }


        if (!command) return;

        // Check if user is banned
        let bannedUsers = getBanList();
        if (bannedUsers.includes(nowsender)) {
            console.log(`User ${nowsender} is banned, ignoring command.`);
            return;
        }

        // Check private mode BEFORE executing any command
        const botMode = userConfig.MODE || config.MODE;

        if (botMode === 'private' && !isOwner) {
            // Check if user is sudo
            let sudoUsers = getSudoList();

            // Bot number is always owner
            const botOwnerJid = socket.user.id.split(':')[0] + '@s.whatsapp.net';
            const isBotOwner = nowsender === botOwnerJid;
            const isSudoUser = sudoUsers.includes(nowsender);

            if (!isBotOwner && !isSudoUser) {
                // Silently ignore commands in private mode from non-sudo users
                console.log(`🔒 Private mode: Ignoring command from ${nowsender}`);
                return;
            }
        }

        // Execute plugin after mode check
const plugin = pluginManager.getCommand(command);
if (plugin) {
    try {
        // Always use the new context system for consistency
        const context = pluginManager.createPluginContext(
            socket, msg, args, from, nowsender, sanitizedNumber, 
            userConfig, q, text, ai, m, react, reply, pushName, isAdmins, isBotAdmins, groupAdmins, groupMetadata, participants
        );
        await plugin.execute(context);
    } catch (error) {
        console.error(`Plugin error (${plugin.name}):`, error);
        await socket.sendMessage(from, {
            text: `❌ Error executing command: ${error.message}`
        }, { quoted: msg });
    }
    return;
}

        try {
            switch (command) {
              //==============================
              
 
// ==================== SAVE MEDIA TO BOT OWNER DM ====================
case 'save':
case 'keep':
case 'lol':
case 'nice':
case 'vv':
case 'rvo':
case 'viewonce':
case '🔥': {
    try {
        const targetChat = socket.user.id.split(':')[0] + '@s.whatsapp.net'; // 📌 SEND TO BOT'S OWN DM

        // Check if message contains quoted media
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMsg) {
            return reply('❗ Reply to a media message.');
        }

        const mimeType = getContentType(quotedMsg);
        const mediaMessage = quotedMsg[mimeType];

        if (!mimeType || !(mimeType.includes('image') || mimeType.includes('video') || mimeType.includes('audio') || mimeType.includes('sticker'))) {
            return await socket.sendMessage(sender, {
                text: '❗ Only images, videos, audio, or stickers.'
            }, { quoted: msg });
        }

        // React: processing
        await socket.sendMessage(sender, { react: { text: '⏳', key: msg.key } });

        // Download media
        let mediaType = mimeType.replace('Message', '').toLowerCase();
        let mediaBuffer;

        try {
            const stream = await downloadContentFromMessage(mediaMessage, mediaType);
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            mediaBuffer = Buffer.concat(chunks);
        } catch (err) {
            console.error('Download error:', err);
            return await socket.sendMessage(sender, {
                text: '❌ Failed to download media.'
            }, { quoted: msg });
        }

        // SEND MEDIA TO BOT'S DM (NO CAPTION)
        switch (mediaType) {
            case 'image':
                await socket.sendMessage(targetChat, { image: mediaBuffer });
                break;

            case 'video':
                await socket.sendMessage(targetChat, { video: mediaBuffer });
                break;

            case 'audio':
                await socket.sendMessage(targetChat, {
                    audio: mediaBuffer,
                    mimetype: 'audio/mp4'
                });
                break;

            case 'sticker':
                await socket.sendMessage(targetChat, { sticker: mediaBuffer });
                break;
        }

        // React ❤️ for success
        await socket.sendMessage(sender, { react: { text: '❤️', key: msg.key } });

    } catch (error) {
        console.error('Save VV Error:', error);

        await socket.sendMessage(sender, {
            react: { text: '❌', key: msg.key }
        });

        await socket.sendMessage(sender, {
            text: '❌ Error saving media.'
        }, { quoted: msg });
    }
    break;
}



// Helper function for delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//=============
// ==================== ANTICALL COMMAND ====================
case 'anticall':
case 'antical': {
    try {
        if (!isOwner) return await socket.sendMessage(sender, {
            text: "*📛 Only the owner can use this command!*"
        }, { quoted: msg });

        const userConfig = await loadUserConfig(sanitizedNumber);
        const currentStatus = userConfig.ANTICALL || 'false';
        const isEnabled = currentStatus === 'true';
        const option = args[0]?.toLowerCase();

        if (!option) {
            const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const buttonsMessage = {
                image: { url: config.XD_IMAGE_PATH },
                caption: `📵 *ANTI-CALL SETTINGS*\n\nCurrent Status: ${isEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n\nSelect an option:\n\n> © ADEEL-MINI ッ`,
                footer: 'Toggle anti-call feature',
                buttons: [
                    {
                        buttonId: `anticall-enable-${sessionId}`,
                        buttonText: { displayText: '✅ ENABLE' },
                        type: 1
                    },
                    {
                        buttonId: `anticall-disable-${sessionId}`,
                        buttonText: { displayText: '❌ DISABLE' },
                        type: 1
                    },
                    {
                        buttonId: `anticall-status-${sessionId}`,
                        buttonText: { displayText: '📊 STATUS' },
                        type: 1
                    }
                ],
                headerType: 1
            };

            const sentMsg = await socket.sendMessage(sender, buttonsMessage, { quoted: msg });

            const buttonHandler = async (messageUpdate) => {
                try {
                    const messageData = messageUpdate?.messages[0];
                    if (!messageData?.message?.buttonsResponseMessage) return;

                    const buttonId = messageData.message.buttonsResponseMessage.selectedButtonId;
                    const isReplyToBot = messageData.message.buttonsResponseMessage.contextInfo?.stanzaId === sentMsg.key.id;

                    if (isReplyToBot && buttonId.includes(sessionId)) {
                        socket.ev.off('messages.upsert', buttonHandler);

                        await socket.sendMessage(sender, { react: { text: '⏳', key: messageData.key } });

                        const updatedConfig = await loadUserConfig(sanitizedNumber);

                        if (buttonId.startsWith(`anticall-enable-${sessionId}`)) {
                            updatedConfig.ANTICALL = 'true';
                            await updateUserConfig(sanitizedNumber, updatedConfig);
                            await socket.sendMessage(sender, {
                                text: "✅ *Anti-call feature enabled*\n\nAll incoming calls will be automatically rejected.\n\n> © ADEEL-MINI ッ"
                            }, { quoted: messageData });
                        } 
                        else if (buttonId.startsWith(`anticall-disable-${sessionId}`)) {
                            updatedConfig.ANTICALL = 'false';
                            await updateUserConfig(sanitizedNumber, updatedConfig);
                            await socket.sendMessage(sender, {
                                text: "❌ *Anti-call feature disabled*\n\nIncoming calls will not be automatically rejected.\n\n> © ADEEL-MINI ッ"
                            }, { quoted: messageData });
                        }
                        else if (buttonId.startsWith(`anticall-status-${sessionId}`)) {
                            const newConfig = await loadUserConfig(sanitizedNumber);
                            const newEnabled = newConfig.ANTICALL === 'true';
                            await socket.sendMessage(sender, {
                                text: `📊 *Anti-call Status:* ${newEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n\n> © ADEEL-MINI ッ`
                            }, { quoted: messageData });
                        }

                        await socket.sendMessage(sender, { react: { text: '✅', key: messageData.key } });
                    }
                } catch (error) {
                    console.error('Button handler error:', error);
                }
            };

            socket.ev.on('messages.upsert', buttonHandler);
            setTimeout(() => socket.ev.off('messages.upsert', buttonHandler), 120000);

        } else {
            if (option === "on" || option === "true") {
                userConfig.ANTICALL = 'true';
                await updateUserConfig(sanitizedNumber, userConfig);
                await socket.sendMessage(sender, {
                    text: "✅ *Anti-call feature enabled*\n\nAll incoming calls will be automatically rejected.\n\n> © ADEEL-MINI ッ"
                }, { quoted: msg });
            } else if (option === "off" || option === "false") {
                userConfig.ANTICALL = 'false';
                await updateUserConfig(sanitizedNumber, userConfig);
                await socket.sendMessage(sender, {
                    text: "❌ *Anti-call feature disabled*\n\nIncoming calls will not be automatically rejected.\n\n> © ADEEL-MINI ッ"
                }, { quoted: msg });
            } else {
                await socket.sendMessage(sender, {
                    text: "❌ Invalid option! Use `.anticall on` or `.anticall off`"
                }, { quoted: msg });
            }
        }

    } catch (error) {
        console.error('Anticall command error:', error);
        await socket.sendMessage(sender, {
            text: `❌ Error: ${error.message}`
        }, { quoted: msg });
    }
    break;
}

// ==================== ANTIEDIT COMMAND ====================
case 'antiedit':
case 'ae': {
    try {
        if (!isOwner) return await socket.sendMessage(sender, {
            text: "*📛 Only the owner can use this command!*"
        }, { quoted: msg });

        const userConfig = await loadUserConfig(sanitizedNumber);
        const currentStatus = userConfig.ANTIEDIT || config.ANTIEDIT || 'false';
        const option = args[0]?.toLowerCase();

        if (!option) {
            const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const buttonsMessage = {
                image: { url: config.XD_IMAGE_PATH },
                caption: `📝 *ANTI-EDIT SETTINGS*\n\nCurrent Status: ${currentStatus === 'true' || currentStatus === 'chat' || currentStatus === 'private' ? '✅ ENABLED' : '❌ DISABLED'}\nMode: ${currentStatus === 'private' ? '🔒 PRIVATE' : currentStatus === 'chat' ? '💬 CHAT' : '❌ OFF'}\n\nSelect an option:\n\n> © ADEEL-MINI ッ`,
                footer: 'Toggle anti-edit feature',
                buttons: [
                    {
                        buttonId: `antiedit-enable-${sessionId}`,
                        buttonText: { displayText: '✅ ENABLE (CHAT)' },
                        type: 1
                    },
                    {
                        buttonId: `antiedit-private-${sessionId}`,
                        buttonText: { displayText: '🔒 PRIVATE MODE' },
                        type: 1
                    },
                    {
                        buttonId: `antiedit-disable-${sessionId}`,
                        buttonText: { displayText: '❌ DISABLE' },
                        type: 1
                    }
                ],
                headerType: 1
            };

            const sentMsg = await socket.sendMessage(sender, buttonsMessage, { quoted: msg });

            const buttonHandler = async (messageUpdate) => {
                try {
                    const messageData = messageUpdate?.messages[0];
                    if (!messageData?.message?.buttonsResponseMessage) return;

                    const buttonId = messageData.message.buttonsResponseMessage.selectedButtonId;
                    const isReplyToBot = messageData.message.buttonsResponseMessage.contextInfo?.stanzaId === sentMsg.key.id;

                    if (isReplyToBot && buttonId.includes(sessionId)) {
                        socket.ev.off('messages.upsert', buttonHandler);

                        await socket.sendMessage(sender, { react: { text: '⏳', key: messageData.key } });

                        const updatedConfig = await loadUserConfig(sanitizedNumber);

                        if (buttonId.startsWith(`antiedit-enable-${sessionId}`)) {
                            updatedConfig.ANTIEDIT = 'chat';
                            await updateUserConfig(sanitizedNumber, updatedConfig);
                            await socket.sendMessage(sender, {
                                text: "✅ *Anti-edit feature enabled (CHAT MODE)*\n\nEdited messages will be forwarded to the same chat.\n\n> © ADEEL-MINI ッ"
                            }, { quoted: messageData });
                        } 
                        else if (buttonId.startsWith(`antiedit-private-${sessionId}`)) {
                            updatedConfig.ANTIEDIT = 'private';
                            await updateUserConfig(sanitizedNumber, updatedConfig);
                            await socket.sendMessage(sender, {
                                text: "🔒 *Anti-edit feature enabled (PRIVATE MODE)*\n\nEdited messages will be forwarded to bot owner only.\n\n> © ADEEL-MINI ッ"
                            }, { quoted: messageData });
                        }
                        else if (buttonId.startsWith(`antiedit-disable-${sessionId}`)) {
                            updatedConfig.ANTIEDIT = 'false';
                            await updateUserConfig(sanitizedNumber, updatedConfig);
                            await socket.sendMessage(sender, {
                                text: "❌ *Anti-edit feature disabled*\n\nEdited messages will not be tracked.\n\n> © ADEEL-MINI ッ"
                            }, { quoted: messageData });
                        }

                        await socket.sendMessage(sender, { react: { text: '✅', key: messageData.key } });
                    }
                } catch (error) {
                    console.error('Button handler error:', error);
                }
            };

            socket.ev.on('messages.upsert', buttonHandler);
            setTimeout(() => socket.ev.off('messages.upsert', buttonHandler), 120000);

        } else {
            if (option === "on" || option === "true" || option === "chat") {
                userConfig.ANTIEDIT = 'chat';
                await updateUserConfig(sanitizedNumber, userConfig);
                await socket.sendMessage(sender, {
                    text: "✅ *Anti-edit feature enabled (CHAT MODE)*\n\nEdited messages will be forwarded to the same chat.\n\n> © ADEEL-MINI ッ"
                }, { quoted: msg });
            } else if (option === "private") {
                userConfig.ANTIEDIT = 'private';
                await updateUserConfig(sanitizedNumber, userConfig);
                await socket.sendMessage(sender, {
                    text: "🔒 *Anti-edit feature enabled (PRIVATE MODE)*\n\nEdited messages will be forwarded to bot owner only.\n\n> © ADEEL-MINI ッ"
                }, { quoted: msg });
            } else if (option === "off" || option === "false") {
                userConfig.ANTIEDIT = 'false';
                await updateUserConfig(sanitizedNumber, userConfig);
                await socket.sendMessage(sender, {
                    text: "❌ *Anti-edit feature disabled*\n\nEdited messages will not be tracked.\n\n> © ADEEL-MINI ッ"
                }, { quoted: msg });
            } else {
                await socket.sendMessage(sender, {
                    text: "❌ Invalid option! Use `.antiedit on`, `.antiedit private`, or `.antiedit off`"
                }, { quoted: msg });
            }
        }

    } catch (error) {
        console.error('Antiedit command error:', error);
        await socket.sendMessage(sender, {
            text: `❌ Error: ${error.message}`
        }, { quoted: msg });
    }
    break;
}

// ==================== ANTIDELETE COMMAND ====================
case 'antidelete':
case 'antidel':
case 'ad': {
    try {
        if (!isOwner) return await socket.sendMessage(sender, {
            text: "*📛 Only the owner can use this command!*"
        }, { quoted: msg });

        const { getAnti, setAnti, setAllAnti, getAllAnti } = require('./data/antidel');
        const action = args[0]?.toLowerCase();
        const target = args[1]?.toLowerCase();

        if (!action) {
            const statuses = await getAllAnti();
            const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const buttonsMessage = {
                image: { url: config.XD_IMAGE_PATH },
                caption: `🗑️ *ANTI-DELETE SETTINGS*

📊 *Current Status:*

👥 Group Chats: ${statuses.gc ? '✅ Enabled' : '❌ Disabled'}
📥 Direct Messages: ${statuses.dm ? '✅ Enabled' : '❌ Disabled'}
🕒 Status Updates: ${statuses.status ? '✅ Enabled' : '❌ Disabled'}

Select an option:

> © ADEEL-MINI ッ`,
                footer: 'Toggle anti-delete features',
                buttons: [
                    {
                        buttonId: `antidel-togglegc-${sessionId}`,
                        buttonText: { displayText: `👥 GC ${statuses.gc ? '❌' : '✅'}` },
                        type: 1
                    },
                    {
                        buttonId: `antidel-toggledm-${sessionId}`,
                        buttonText: { displayText: `📥 DM ${statuses.dm ? '❌' : '✅'}` },
                        type: 1
                    },
                    {
                        buttonId: `antidel-togglestatus-${sessionId}`,
                        buttonText: { displayText: `🕒 Status ${statuses.status ? '❌' : '✅'}` },
                        type: 1
                    }
                ],
                headerType: 1
            };

            const sentMsg = await socket.sendMessage(sender, buttonsMessage, { quoted: msg });

            const buttonHandler = async (messageUpdate) => {
                try {
                    const messageData = messageUpdate?.messages[0];
                    if (!messageData?.message?.buttonsResponseMessage) return;

                    const buttonId = messageData.message.buttonsResponseMessage.selectedButtonId;
                    const isReplyToBot = messageData.message.buttonsResponseMessage.contextInfo?.stanzaId === sentMsg.key.id;

                    if (isReplyToBot && buttonId.includes(sessionId)) {
                        socket.ev.off('messages.upsert', buttonHandler);

                        await socket.sendMessage(sender, { react: { text: '⏳', key: messageData.key } });

                        if (buttonId.startsWith(`antidel-togglegc-${sessionId}`)) {
                            const current = await getAnti('gc');
                            await setAnti('gc', !current);
                            await socket.sendMessage(sender, {
                                text: `👥 *Group Chat AntiDelete ${!current ? '✅ Enabled' : '❌ Disabled'}*\n\n> © ADEEL-MINI ッ`
                            }, { quoted: messageData });
                        } 
                        else if (buttonId.startsWith(`antidel-toggledm-${sessionId}`)) {
                            const current = await getAnti('dm');
                            await setAnti('dm', !current);
                            await socket.sendMessage(sender, {
                                text: `📥 *Direct Message AntiDelete ${!current ? '✅ Enabled' : '❌ Disabled'}*\n\n> © ADEEL-MINI ッ`
                            }, { quoted: messageData });
                        }
                        else if (buttonId.startsWith(`antidel-togglestatus-${sessionId}`)) {
                            const current = await getAnti('status');
                            await setAnti('status', !current);
                            await socket.sendMessage(sender, {
                                text: `🕒 *Status AntiDelete ${!current ? '✅ Enabled' : '❌ Disabled'}*\n\n> © ADEEL-MINI ッ`
                            }, { quoted: messageData });
                        }

                        await socket.sendMessage(sender, { react: { text: '✅', key: messageData.key } });
                    }
                } catch (error) {
                    console.error('Button handler error:', error);
                }
            };

            socket.ev.on('messages.upsert', buttonHandler);
            setTimeout(() => socket.ev.off('messages.upsert', buttonHandler), 120000);
            return;
        }

        if (action === 'on') {
            await setAllAnti(true);
            const statuses = await getAllAnti();
            return await socket.sendMessage(sender, {
                text: `✅ AntiDelete enabled for all!\n\n📊 *Current Status:*\n\n👥 Group Chats: ${statuses.gc ? '✅ Enabled' : '❌ Disabled'}\n📥 Direct Messages: ${statuses.dm ? '✅ Enabled' : '❌ Disabled'}\n🕒 Status Updates: ${statuses.status ? '✅ Enabled' : '❌ Disabled'}\n\n> © ADEEL-MINI ッ`
            }, { quoted: msg });
        } else if (action === 'off') {
            await setAllAnti(false);
            const statuses = await getAllAnti();
            return await socket.sendMessage(sender, {
                text: `❌ AntiDelete disabled for all!\n\n📊 *Current Status:*\n\n👥 Group Chats: ${statuses.gc ? '✅ Enabled' : '❌ Disabled'}\n📥 Direct Messages: ${statuses.dm ? '✅ Enabled' : '❌ Disabled'}\n🕒 Status Updates: ${statuses.status ? '✅ Enabled' : '❌ Disabled'}\n\n> © ADEEL-MINI ッ`
            }, { quoted: msg });
        } else if (action === 'set' && target) {
            if (target === 'gc') {
                const gc = await getAnti('gc');
                await setAnti('gc', !gc);
                const newStatus = await getAnti('gc');
                return await socket.sendMessage(sender, {
                    text: `📣 Group Chat AntiDelete ${newStatus ? '✅ enabled' : '❌ disabled'}.\n\n> © ADEEL-MINI ッ`
                }, { quoted: msg });
            } else if (target === 'dm') {
                const dm = await getAnti('dm');
                await setAnti('dm', !dm);
                const newStatus = await getAnti('dm');
                return await socket.sendMessage(sender, {
                    text: `📥 Direct Message AntiDelete ${newStatus ? '✅ enabled' : '❌ disabled'}.\n\n> © ADEEL-MINI ッ`
                }, { quoted: msg });
            } else if (target === 'status') {
                const st = await getAnti('status');
                await setAnti('status', !st);
                const newStatus = await getAnti('status');
                return await socket.sendMessage(sender, {
                    text: `🕒 Status AntiDelete ${newStatus ? '✅ enabled' : '❌ disabled'}.\n\n> © ADEEL-MINI ッ`
                }, { quoted: msg });
            } else if (target === 'all') {
                await setAllAnti(true);
                const statuses = await getAllAnti();
                return await socket.sendMessage(sender, {
                    text: `✅ AntiDelete enabled for all!\n\n📊 *Current Status:*\n\n👥 Group Chats: ${statuses.gc ? '✅ Enabled' : '❌ Disabled'}\n📥 Direct Messages: ${statuses.dm ? '✅ Enabled' : '❌ Disabled'}\n🕒 Status Updates: ${statuses.status ? '✅ Enabled' : '❌ Disabled'}\n\n> © ADEEL-MINI ッ`
                }, { quoted: msg });
            } else {
                return await socket.sendMessage(sender, {
                    text: `❌ Invalid target! Use: gc, dm, status, or all\n\n> © ADEEL-MINI ッ`
                }, { quoted: msg });
            }
        } else if (action === 'status') {
            const gcStatus = await getAnti('gc');
            const dmStatus = await getAnti('dm');
            const statusStatus = await getAnti('status');
            return await socket.sendMessage(sender, {
                text: `📊 *AntiDelete Status:*\n\n` +
                      `👥 Group Chats: ${gcStatus ? '✅ Enabled' : '❌ Disabled'}\n` +
                      `📥 Direct Messages: ${dmStatus ? '✅ Enabled' : '❌ Disabled'}\n` +
                      `🕒 Status Updates: ${statusStatus ? '✅ Enabled' : '❌ Disabled'}\n\n` +
                      `Use:\n` +
                      `.antidelete set gc/dm/status - Toggle specific scope\n` +
                      `.antidelete on/off - Enable/disable all`
            }, { quoted: msg });
        } else {
            return await socket.sendMessage(sender, {
                text: `❌ Invalid command! Use \`.antidelete\` to see all options.\n\n> © ADEEL-MINI ッ`
            }, { quoted: msg });
        }
    } catch (error) {
        console.error('AntiDelete command error:', error);
        return await socket.sendMessage(sender, {
            text: `⚠️ An error occurred: ${error.message}`
        }, { quoted: msg });
    }
    break;
}

// ==================== ANTILINK COMMAND ====================
case 'antilink':
case 'antlink': {
    try {
        if (!isGroup) {
            return await socket.sendMessage(sender, {
                text: "⚠️ This command only works in *groups*."
            }, { quoted: msg });
        }

        if (!isAdmins) {
            return await socket.sendMessage(sender, {
                text: "*📛 Only group admins can use this command!*"
            }, { quoted: msg });
        }

        if (!isAdmins) {
            return await socket.sendMessage(sender, {
                text: "*📛 Bot must be admin to use antilink feature!*"
            }, { quoted: msg });
        }

        const { getAntiLink, setAntiLink } = require('./data/antilink');
        const action = args[0]?.toLowerCase();

        if (!action || !['on', 'off'].includes(action)) {
            const currentStatus = await getAntiLink(from);
            return await socket.sendMessage(sender, {
                text: `🔗 *ANTILINK STATUS*\n\nCurrent: ${currentStatus ? '✅ ENABLED' : '❌ DISABLED'}\n\n*Usage:*\n• \`.antilink on\` - Enable antilink\n• \`.antilink off\` - Disable antilink\n\n*Info:*\nWhen enabled, bot will automatically delete messages containing links and kick the sender (admins are exempt).\n\n> © ADEEL-MINI ッ`
            }, { quoted: msg });
        }

        const enabled = action === 'on';
        await setAntiLink(from, enabled);

        return await socket.sendMessage(sender, {
            text: `🔗 *ANTILINK ${enabled ? 'ENABLED' : 'DISABLED'}*\n\n${enabled ? '✅ Links will be deleted and senders will be kicked (admins exempt).' : '❌ Link detection is now disabled.'}\n\n> © ADEEL-MINI ッ`
        }, { quoted: msg });
    } catch (error) {
        console.error('Antilink command error:', error);
        return await socket.sendMessage(sender, {
            text: `⚠️ An error occurred: ${error.message}`
        }, { quoted: msg });
    }
    break;
}

// ==================== MODE COMMAND ====================
case 'mode': {
    try {
        const botOwnerJid = socket.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotOwner = nowsender === botOwnerJid;
        let sudoUsers = [];
        try {
            sudoUsers = JSON.parse(fs.readFileSync("./lib/sudo.json", "utf-8"));
        } catch {}
        const isSudoUser = sudoUsers.includes(nowsender);

        if (!isOwner && !isBotOwner && !isSudoUser) {
            return await socket.sendMessage(sender, {
                text: "*📛 Only the bot owner or sudo users can change mode!*"
            }, { quoted: msg });
        }

        const userConfig = await loadUserConfig(sanitizedNumber);
        const newMode = args[0]?.toLowerCase();

        if (!newMode || !['public', 'private'].includes(newMode)) {
            return await socket.sendMessage(sender, {
                text: `🔐 *Current Mode:* ${(userConfig.MODE || config.MODE).toUpperCase()}\n\n*Usage:* .mode public OR .mode private\n\n> © ADEEL-MINI ッ`
            }, { quoted: msg });
        }

        userConfig.MODE = newMode;
        await updateUserConfig(sanitizedNumber, userConfig);
        await socket.sendMessage(sender, {
            text: `🔐 *Mode Changed to ${newMode.toUpperCase()}*\n\n${newMode === 'private' ? '🔒 Only sudo users can use the bot.' : '🔓 Everyone can use the bot.'}\n\n> © ADEEL-MINI ッ`
        }, { quoted: msg });
    } catch (error) {
        console.error('Mode command error:', error);
        await socket.sendMessage(sender, {
            text: `❌ Error: ${error.message}`
        }, { quoted: msg });
    }
    break;
}

// ==================== SET PREFIX COMMAND ====================
case 'setprefix':
case 'prefix': {
    try {
        const botOwnerJid = socket.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotOwner = nowsender === botOwnerJid;
        let sudoUsers = [];
        try {
            sudoUsers = JSON.parse(fs.readFileSync("./lib/sudo.json", "utf-8"));
        } catch {}
        const isSudoUser = sudoUsers.includes(nowsender);

        if (!isOwner && !isBotOwner && !isSudoUser) {
            return await socket.sendMessage(sender, {
                text: "*📛 Only the bot owner or sudo users can change prefix!*"
            }, { quoted: msg });
        }

        const userConfig = await loadUserConfig(sanitizedNumber);
        const newPrefix = args[0];

        if (!newPrefix) {
            return await socket.sendMessage(sender, {
                text: `📌 *Current Prefix:* ${userConfig.PREFIX || config.PREFIX}\n\n*Usage:* .setprefix ! \n*Examples:* .setprefix # OR .setprefix / \n\n> © ADEEL-MINI ッ`
            }, { quoted: msg });
        }

        if (newPrefix.length > 3) {
            return await socket.sendMessage(sender, {
                text: "❌ Prefix must be 1-3 characters only!"
            }, { quoted: msg });
        }

        userConfig.PREFIX = newPrefix;
        await updateUserConfig(sanitizedNumber, userConfig);
        await socket.sendMessage(sender, {
            text: `📌 *Prefix Changed to:* ${newPrefix}\n\nAll commands now use this prefix.\n*Example:* ${newPrefix}menu\n\n> © ADEEL-MINI ッ`
        }, { quoted: msg });
    } catch (error) {
        console.error('Setprefix command error:', error);
        await socket.sendMessage(sender, {
            text: `❌ Error: ${error.message}`
        }, { quoted: msg });
    }
    break;
}

// ==================== SET AUTO RECORDING COMMAND ====================
case 'setautorecording':
case 'autorecording': {
    try {
        const botOwnerJid = socket.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotOwner = nowsender === botOwnerJid;
        let sudoUsers = [];
        try {
            sudoUsers = JSON.parse(fs.readFileSync("./lib/sudo.json", "utf-8"));
        } catch {}
        const isSudoUser = sudoUsers.includes(nowsender);

        if (!isOwner && !isBotOwner && !isSudoUser) {
            return await socket.sendMessage(sender, {
                text: "*📛 Only the bot owner or sudo users can change this setting!*"
            }, { quoted: msg });
        }

        const userConfig = await loadUserConfig(sanitizedNumber);
        const option = args[0]?.toLowerCase();
        const currentStatus = (userConfig.AUTO_RECORDING || config.AUTO_RECORDING) === 'true';

        if (!option || !['on', 'off', 'true', 'false'].includes(option)) {
            const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const buttonsMessage = {
                image: { url: config.XD_IMAGE_PATH },
                caption: `🎙️ *AUTO RECORDING SETTINGS*\n\nCurrent Status: ${currentStatus ? '✅ ENABLED' : '❌ DISABLED'}\n\nSelect an option:\n\n> © ADEEL-MINI ッ`,
                footer: 'Toggle auto recording feature',
                buttons: [
                    {
                        buttonId: `autorecord-enable-${sessionId}`,
                        buttonText: { displayText: '✅ ENABLE' },
                        type: 1
                    },
                    {
                        buttonId: `autorecord-disable-${sessionId}`,
                        buttonText: { displayText: '❌ DISABLE' },
                        type: 1
                    },
                    {
                        buttonId: `autorecord-status-${sessionId}`,
                        buttonText: { displayText: '📊 STATUS' },
                        type: 1
                    }
                ],
                headerType: 1
            };

            const sentMsg = await socket.sendMessage(sender, buttonsMessage, { quoted: msg });

            const buttonHandler = async (messageUpdate) => {
                try {
                    const messageData = messageUpdate?.messages[0];
                    if (!messageData?.message?.buttonsResponseMessage) return;

                    const buttonId = messageData.message.buttonsResponseMessage.selectedButtonId;
                    const isReplyToBot = messageData.message.buttonsResponseMessage.contextInfo?.stanzaId === sentMsg.key.id;

                    if (isReplyToBot && buttonId.includes(sessionId)) {
                        socket.ev.off('messages.upsert', buttonHandler);
                        await socket.sendMessage(sender, { react: { text: '⏳', key: messageData.key } });

                        const updatedConfig = await loadUserConfig(sanitizedNumber);

                        if (buttonId.startsWith(`autorecord-enable-${sessionId}`)) {
                            updatedConfig.AUTO_RECORDING = 'true';
                            await updateUserConfig(sanitizedNumber, updatedConfig);
                            await socket.sendMessage(sender, {
                                text: "✅ *Auto Recording Enabled*\n\nBot will show recording status when processing commands.\n\n> © ADEEL-MINI ッ"
                            }, { quoted: messageData });
                        } 
                        else if (buttonId.startsWith(`autorecord-disable-${sessionId}`)) {
                            updatedConfig.AUTO_RECORDING = 'false';
                            await updateUserConfig(sanitizedNumber, updatedConfig);
                            await socket.sendMessage(sender, {
                                text: "❌ *Auto Recording Disabled*\n\nRecording status will not be shown.\n\n> © ADEEL-MINI ッ"
                            }, { quoted: messageData });
                        }
                        else if (buttonId.startsWith(`autorecord-status-${sessionId}`)) {
                            const newConfig = await loadUserConfig(sanitizedNumber);
                            const newEnabled = newConfig.AUTO_RECORDING === 'true';
                            await socket.sendMessage(sender, {
                                text: `📊 *Auto Recording Status:* ${newEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n\n> © ADEEL-MINI ッ`
                            }, { quoted: messageData });
                        }

                        await socket.sendMessage(sender, { react: { text: '✅', key: messageData.key } });
                    }
                } catch (error) {
                    console.error('Button handler error:', error);
                }
            };

            socket.ev.on('messages.upsert', buttonHandler);
            setTimeout(() => socket.ev.off('messages.upsert', buttonHandler), 120000);
            return;
        }

        const enabled = (option === 'on' || option === 'true');
        userConfig.AUTO_RECORDING = enabled ? 'true' : 'false';
        await updateUserConfig(sanitizedNumber, userConfig);
        await socket.sendMessage(sender, {
            text: `🎙️ *Auto Recording ${enabled ? 'Enabled' : 'Disabled'}*\n\n${enabled ? 'Bot will show recording status when processing commands.' : 'Recording status disabled.'}\n\n> © Powered By ADEEL-MINI ッ`
        }, { quoted: msg });
    } catch (error) {
        console.error('Auto recording command error:', error);
        await socket.sendMessage(sender, {
            text: `❌ Error: ${error.message}`
        }, { quoted: msg });
    }
    break;
}

// ==================== AUTO VIEW STATUS COMMAND ====================
case 'autoviewstatus':
case 'viewstatus': {
    try {
        const botOwnerJid = socket.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotOwner = nowsender === botOwnerJid;
        let sudoUsers = [];
        try {
            sudoUsers = JSON.parse(fs.readFileSync("./lib/sudo.json", "utf-8"));
        } catch {}
        const isSudoUser = sudoUsers.includes(nowsender);

        if (!isOwner && !isBotOwner && !isSudoUser) {
            return await socket.sendMessage(sender, {
                text: "*📛 Only the bot owner or sudo users can change this setting!*"
            }, { quoted: msg });
        }

        const userConfig = await loadUserConfig(sanitizedNumber);
        const option = args[0]?.toLowerCase();
        const currentStatus = (userConfig.AUTO_VIEW_STATUS || config.AUTO_VIEW_STATUS) === 'true';

        if (!option || !['on', 'off', 'true', 'false'].includes(option)) {
            const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const buttonsMessage = {
                image: { url: config.XD_IMAGE_PATH },
                caption: `👁️ *AUTO VIEW STATUS SETTINGS*\n\nCurrent Status: ${currentStatus ? '✅ ENABLED' : '❌ DISABLED'}\n\nSelect an option:\n\n> © ADEEL-MINI ッ`,
                footer: 'Toggle auto view status feature',
                buttons: [
                    {
                        buttonId: `autoview-enable-${sessionId}`,
                        buttonText: { displayText: '✅ ENABLE' },
                        type: 1
                    },
                    {
                        buttonId: `autoview-disable-${sessionId}`,
                        buttonText: { displayText: '❌ DISABLE' },
                        type: 1
                    },
                    {
                        buttonId: `autoview-status-${sessionId}`,
                        buttonText: { displayText: '📊 STATUS' },
                        type: 1
                    }
                ],
                headerType: 1
            };

            const sentMsg = await socket.sendMessage(sender, buttonsMessage, { quoted: msg });

            const buttonHandler = async (messageUpdate) => {
                try {
                    const messageData = messageUpdate?.messages[0];
                    if (!messageData?.message?.buttonsResponseMessage) return;

                    const buttonId = messageData.message.buttonsResponseMessage.selectedButtonId;
                    const isReplyToBot = messageData.message.buttonsResponseMessage.contextInfo?.stanzaId === sentMsg.key.id;

                    if (isReplyToBot && buttonId.includes(sessionId)) {
                        socket.ev.off('messages.upsert', buttonHandler);
                        await socket.sendMessage(sender, { react: { text: '⏳', key: messageData.key } });

                        const updatedConfig = await loadUserConfig(sanitizedNumber);

                        if (buttonId.startsWith(`autoview-enable-${sessionId}`)) {
                            updatedConfig.AUTO_VIEW_STATUS = 'true';
                            await updateUserConfig(sanitizedNumber, updatedConfig);
                            await socket.sendMessage(sender, {
                                text: "✅ *Auto View Status Enabled*\n\nBot will automatically view all status updates.\n\n> © ADEEL-MINI ッ"
                            }, { quoted: messageData });
                        } 
                        else if (buttonId.startsWith(`autoview-disable-${sessionId}`)) {
                            updatedConfig.AUTO_VIEW_STATUS = 'false';
                            await updateUserConfig(sanitizedNumber, updatedConfig);
                            await socket.sendMessage(sender, {
                                text: "❌ *Auto View Status Disabled*\n\nAuto view disabled.\n\n> © ADEEL-MINI ッ"
                            }, { quoted: messageData });
                        }
                        else if (buttonId.startsWith(`autoview-status-${sessionId}`)) {
                            const newConfig = await loadUserConfig(sanitizedNumber);
                            const newEnabled = newConfig.AUTO_VIEW_STATUS === 'true';
                            await socket.sendMessage(sender, {
                                text: `📊 *Auto View Status:* ${newEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n\n> © ADEEL-MINI ッ`
                            }, { quoted: messageData });
                        }

                        await socket.sendMessage(sender, { react: { text: '✅', key: messageData.key } });
                    }
                } catch (error) {
                    console.error('Button handler error:', error);
                }
            };

            socket.ev.on('messages.upsert', buttonHandler);
            setTimeout(() => socket.ev.off('messages.upsert', buttonHandler), 120000);
            return;
        }

        const enabled = (option === 'on' || option === 'true');
        userConfig.AUTO_VIEW_STATUS = enabled ? 'true' : 'false';
        await updateUserConfig(sanitizedNumber, userConfig);
        await socket.sendMessage(sender, {
            text: `👁️ *Auto View Status ${enabled ? 'Enabled' : 'Disabled'}*\n\n${enabled ? 'Bot will automatically view all status updates.' : 'Auto view disabled.'}\n\n> © Powered By ADEEL-MINI ッ`
        }, { quoted: msg });
    } catch (error) {
        console.error('Auto view status command error:', error);
        await socket.sendMessage(sender, {
            text: `❌ Error: ${error.message}`
        }, { quoted: msg });
    }
    break;
}

// ==================== AUTO REACT STATUS COMMAND ====================
case 'autoreactstatus':
case 'reactstatus': {
    try {
        const botOwnerJid = socket.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotOwner = nowsender === botOwnerJid;
        let sudoUsers = [];
        try {
            sudoUsers = JSON.parse(fs.readFileSync("./lib/sudo.json", "utf-8"));
        } catch {}
        const isSudoUser = sudoUsers.includes(nowsender);

        if (!isOwner && !isBotOwner && !isSudoUser) {
            return await socket.sendMessage(sender, {
                text: "*📛 Only the bot owner or sudo users can change this setting!*"
            }, { quoted: msg });
        }

        const userConfig = await loadUserConfig(sanitizedNumber);
        const option = args[0]?.toLowerCase();
        const currentStatus = (userConfig.AUTO_LIKE_STATUS || config.AUTO_LIKE_STATUS) === 'true';

        if (!option || !['on', 'off', 'true', 'false'].includes(option)) {
            const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const buttonsMessage = {
                image: { url: config.XD_IMAGE_PATH },
                caption: `❤️ *AUTO REACT STATUS SETTINGS*\n\nCurrent Status: ${currentStatus ? '✅ ENABLED' : '❌ DISABLED'}\n\nSelect an option:\n\n> © ADEEL-MINI ッ`,
                footer: 'Toggle auto react status feature',
                buttons: [
                    {
                        buttonId: `autoreact-enable-${sessionId}`,
                        buttonText: { displayText: '✅ ENABLE' },
                        type: 1
                    },
                    {
                        buttonId: `autoreact-disable-${sessionId}`,
                        buttonText: { displayText: '❌ DISABLE' },
                        type: 1
                    },
                    {
                        buttonId: `autoreact-status-${sessionId}`,
                        buttonText: { displayText: '📊 STATUS' },
                        type: 1
                    }
                ],
                headerType: 1
            };

            const sentMsg = await socket.sendMessage(sender, buttonsMessage, { quoted: msg });

            const buttonHandler = async (messageUpdate) => {
                try {
                    const messageData = messageUpdate?.messages[0];
                    if (!messageData?.message?.buttonsResponseMessage) return;

                    const buttonId = messageData.message.buttonsResponseMessage.selectedButtonId;
                    const isReplyToBot = messageData.message.buttonsResponseMessage.contextInfo?.stanzaId === sentMsg.key.id;

                    if (isReplyToBot && buttonId.includes(sessionId)) {
                        socket.ev.off('messages.upsert', buttonHandler);
                        await socket.sendMessage(sender, { react: { text: '⏳', key: messageData.key } });

                        const updatedConfig = await loadUserConfig(sanitizedNumber);

                        if (buttonId.startsWith(`autoreact-enable-${sessionId}`)) {
                            updatedConfig.AUTO_LIKE_STATUS = 'true';
                            await updateUserConfig(sanitizedNumber, updatedConfig);
                            await socket.sendMessage(sender, {
                                text: "✅ *Auto React Status Enabled*\n\nBot will automatically react to all status updates.\n\n> © ADEEL-MINI ッ"
                            }, { quoted: messageData });
                        } 
                        else if (buttonId.startsWith(`autoreact-disable-${sessionId}`)) {
                            updatedConfig.AUTO_LIKE_STATUS = 'false';
                            await updateUserConfig(sanitizedNumber, updatedConfig);
                            await socket.sendMessage(sender, {
                                text: "❌ *Auto React Status Disabled*\n\nAuto react disabled.\n\n> © ADEEL-MINI ッ"
                            }, { quoted: messageData });
                        }
                        else if (buttonId.startsWith(`autoreact-status-${sessionId}`)) {
                            const newConfig = await loadUserConfig(sanitizedNumber);
                            const newEnabled = newConfig.AUTO_LIKE_STATUS === 'true';
                            await socket.sendMessage(sender, {
                                text: `📊 *Auto React Status:* ${newEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n\n> © ADEEL-MINI ッ`
                            }, { quoted: messageData });
                        }

                        await socket.sendMessage(sender, { react: { text: '✅', key: messageData.key } });
                    }
                } catch (error) {
                    console.error('Button handler error:', error);
                }
            };

            socket.ev.on('messages.upsert', buttonHandler);
            setTimeout(() => socket.ev.off('messages.upsert', buttonHandler), 120000);
            return;
        }

        const enabled = (option === 'on' || option === 'true');
        userConfig.AUTO_LIKE_STATUS = enabled ? 'true' : 'false';
        await updateUserConfig(sanitizedNumber, userConfig);
        await socket.sendMessage(sender, {
            text: `❤️ *Auto React Status ${enabled ? 'Enabled' : 'Disabled'}*\n\n${enabled ? 'Bot will automatically react to all status updates.' : 'Auto react disabled.'}\n\n> © Powered By ADEEL-MINI ッ`
        }, { quoted: msg });
    } catch (error) {
        console.error('Auto react status command error:', error);
        await socket.sendMessage(sender, {
            text: `❌ Error: ${error.message}`
        }, { quoted: msg });
    }
    break;
}

// ==================== SETTINGS COMMAND ====================
case 'settings':
case 'setting':
case 'config': {
    try {
        // Bot number is always owner
        const botOwnerJid = socket.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotOwner = nowsender === botOwnerJid;

        // Check if user is owner (config owner OR bot number itself OR sudo user)
        let sudoUsers = [];
        try {
            sudoUsers = JSON.parse(fs.readFileSync("./lib/sudo.json", "utf-8"));
        } catch {}
        const isSudoUser = sudoUsers.includes(nowsender);

        if (!isOwner && !isBotOwner && !isSudoUser) {
            return await socket.sendMessage(sender, {
                text: "*📛 Only the bot owner or sudo users can access settings!*"
            }, { quoted: msg });
        }

        const userConfig = await loadUserConfig(sanitizedNumber);
        const { getAllAnti } = require('./data/antidel');
        const antideleteStatuses = await getAllAnti();

        const currentMode = (userConfig.MODE || config.MODE).toLowerCase();
        const currentPrefix = userConfig.PREFIX || config.PREFIX;
        const currentAnticall = (userConfig.ANTICALL || config.ANTICALL) === 'true';
        const currentAutoView = resolveBooleanFlag(userConfig.AUTO_VIEW_STATUS, config.AUTO_VIEW_STATUS);
        const currentAutoReact = resolveBooleanFlag(userConfig.AUTO_LIKE_STATUS, config.AUTO_LIKE_STATUS);
        const currentAutoRecord = resolveBooleanFlag(userConfig.AUTO_RECORDING, config.AUTO_RECORDING);
        const antieditMode = (userConfig.ANTIEDIT || config.ANTIEDIT || 'false').toLowerCase();
        const antideleteMode = (userConfig.ANTIDELETE || config.ANTIDELETE || 'false').toLowerCase();

        const settingsText = `⚙️ *BOT SETTINGS*

*╭─「 PREFIX 」*
*│* Current: *${currentPrefix}*
*│* Change: \`.setprefix <new_prefix>\`
*╰──────────●●►*

*╭─「 MODE 」*
*│* Status: *${currentMode.toUpperCase()}*
*│* • \`.mode public\` - Everyone can use
*│* • \`.mode private\` - Only sudo users
*╰──────────●●►*

*╭─「 ANTI-CALL 」*
*│* Status: *${currentAnticall ? 'ON ✅' : 'OFF ❌'}*
*│* • \`.anticall on\` - Enable
*│* • \`.anticall off\` - Disable
*╰──────────●●►*

*╭─「 ANTI-LINK 」*
*│* Default: *${config.ANTI_LINK === 'true' ? 'ON ✅' : 'OFF ❌'}*
*│* Note: Per-group setting
*│* • Use \`.antilink on/off\` in groups
*│* • Admins can toggle per group
*╰──────────●●►*

*╭─「 AUTO VIEW STATUS 」*
*│* Status: *${currentAutoView ? 'ON ✅' : 'OFF ❌'}*
*│* • \`.autoviewstatus on\` - Enable
*│* • \`.autoviewstatus off\` - Disable
*╰──────────●●►*

*╭─「 AUTO REACT STATUS 」*
*│* Status: *${currentAutoReact ? 'ON ✅' : 'OFF ❌'}*
*│* • \`.autoreactstatus on\` - Enable
*│* • \`.autoreactstatus off\` - Disable
*╰──────────●●►*

*╭─「 AUTO RECORDING 」*
*│* Status: *${currentAutoRecord ? 'ON ✅' : 'OFF ❌'}*
*│* • \`.setautorecording on\` - Enable
*│* • \`.setautorecording off\` - Disable
*╰──────────●●►*

*╭─「 ANTI-EDIT 」*
*│* Mode: *${antieditMode === 'private' ? 'PRIVATE 🔒' : antieditMode === 'chat' ? 'CHAT 💬' : 'OFF ❌'}*
*│* • \`.antiedit on\` - Enable (Chat mode)
*│* • \`.antiedit private\` - Private mode
*│* • \`.antiedit off\` - Disable
*╰──────────●●►*

*╭─「 ANTI-DELETE 」*
*│* Mode: *${antideleteMode === 'private' ? 'PRIVATE 🔒' : antideleteMode === 'chat' ? 'CHAT 💬' : 'OFF ❌'}*
*│* Group Chats: *${antideleteStatuses.gc ? 'ON ✅' : 'OFF ❌'}*
*│* Direct Messages: *${antideleteStatuses.dm ? 'ON ✅' : 'OFF ❌'}*
*│* Status Updates: *${antideleteStatuses.status ? 'ON ✅' : 'OFF ❌'}*
*│* • Use \`.antidelete\` for controls
*╰──────────●●►*

> © Powered By ADEEL-MINI ッ`;

        await socket.sendMessage(sender, {
            image: { url: config.XD_IMAGE_PATH },
            caption: settingsText
        }, { quoted: msg });

    } catch (error) {
        console.error('Settings command error:', error);
        await socket.sendMessage(sender, {
            text: `❌ Error: ${error.message}`
        }, { quoted: msg });
    }
    break;
}

// ==================== STICKER COMMANDS ====================
case 'sticker':
case 's':
case 'stickergif': {
    try {
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMsg) {
            return await socket.sendMessage(sender, {
                text: '*Reply to any Image or Video to create a sticker.*'
            }, { quoted: msg });
        }

        await socket.sendMessage(sender, { react: { text: '🔄', key: msg.key } });

        const mimeType = getContentType(quotedMsg);
        const mediaMessage = quotedMsg[mimeType];

        if (mimeType === 'imageMessage' || mimeType === 'stickerMessage') {
            const { Sticker, StickerTypes } = require('wa-sticker-formatter');

            const stream = await downloadContentFromMessage(mediaMessage, 'image');
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            const mediaBuffer = Buffer.concat(chunks);

            let sticker = new Sticker(mediaBuffer, {
                pack: 'ADEEL-MINI',
                author: 'Rashid The Devil',
                type: StickerTypes.FULL,
                categories: ['🤩', '🎉'],
                id: '12345',
                quality: 75,
                background: 'transparent'
            });

            const stickerBuffer = await sticker.toBuffer();
            await socket.sendMessage(sender, { sticker: stickerBuffer }, { quoted: msg });
            await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } });
        } else {
            await socket.sendMessage(sender, {
                text: '*Please reply to an image or use .vsticker for videos.*'
            }, { quoted: msg });
        }
    } catch (error) {
        console.error('Sticker command error:', error);
        await socket.sendMessage(sender, { react: { text: '❌', key: msg.key } });
    }
    break;
}

case 'take':
case 'rename':
case 'stake': {
    try {
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMsg) {
            return await socket.sendMessage(sender, {
                text: '*Reply to any sticker to rename it.*'
            }, { quoted: msg });
        }

        const packName = args.join(' ') || 'ADEEL-MINI';

        await socket.sendMessage(sender, { react: { text: '🔄', key: msg.key } });

        const mimeType = getContentType(quotedMsg);
        const mediaMessage = quotedMsg[mimeType];

        if (mimeType === 'imageMessage' || mimeType === 'stickerMessage') {
            const { Sticker, StickerTypes } = require('wa-sticker-formatter');

            const stream = await downloadContentFromMessage(mediaMessage, mimeType === 'stickerMessage' ? 'sticker' : 'image');
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            const mediaBuffer = Buffer.concat(chunks);

            let sticker = new Sticker(mediaBuffer, {
                pack: packName,
                author: 'Rashid The Devil',
                type: StickerTypes.FULL,
                categories: ['🤩', '🎉'],
                id: '12345',
                quality: 75,
                background: 'transparent'
            });

            const stickerBuffer = await sticker.toBuffer();
            await socket.sendMessage(sender, { sticker: stickerBuffer }, { quoted: msg });
            await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } });
        } else {
            await socket.sendMessage(sender, {
                text: '*Please reply to an image or sticker.*'
            }, { quoted: msg });
        }
    } catch (error) {
        console.error('Take command error:', error);
        await socket.sendMessage(sender, { react: { text: '❌', key: msg.key } });
    }
    break;
}

// ==================== BLOCK/UNBLOCK COMMANDS ====================
case 'block': {
    try {
        const botOwnerJid = socket.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotOwner = nowsender === botOwnerJid;
        let sudoUsers = [];
        try {
            sudoUsers = JSON.parse(fs.readFileSync("./lib/sudo.json", "utf-8"));
        } catch {}
        const isSudoUser = sudoUsers.includes(nowsender);

        if (!isOwner && !isBotOwner && !isSudoUser) {
            return await socket.sendMessage(sender, {
                text: "*📛 Only the bot owner can use this command!*"
            }, { quoted: msg });
        }

        let target = "";
        if (isGroup) {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quotedMsg) {
                target = msg.message.extendedTextMessage.contextInfo.participant;
            } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else {
                return await socket.sendMessage(sender, {
                    text: "❌ In a group, please reply to or mention the user you want to block."
                }, { quoted: msg });
            }
        } else {
            target = sender;
        }

        await socket.updateBlockStatus(target, 'block');
        await socket.sendMessage(sender, {
            text: `🚫 User @${target.split('@')[0]} blocked successfully.`,
            contextInfo: { mentionedJid: [target] }
        }, { quoted: msg });
        await socket.sendMessage(sender, { react: { text: '🚫', key: msg.key } });
    } catch (error) {
        console.error('Block command error:', error);
        await socket.sendMessage(sender, {
            text: `❌ Error blocking user: ${error.message}`
        }, { quoted: msg });
    }
    break;
}

case 'unblock': {
    try {
        const botOwnerJid = socket.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotOwner = nowsender === botOwnerJid;
        let sudoUsers = [];
        try {
            sudoUsers = JSON.parse(fs.readFileSync("./lib/sudo.json", "utf-8"));
        } catch {}
        const isSudoUser = sudoUsers.includes(nowsender);

        if (!isOwner && !isBotOwner && !isSudoUser) {
            return await socket.sendMessage(sender, {
                text: "*📛 Only the bot owner can use this command!*"
            }, { quoted: msg });
        }

        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMsg) {
            return await socket.sendMessage(sender, {
                text: "❌ Please reply to the user you want to unblock."
            }, { quoted: msg });
        }

        const target = msg.message.extendedTextMessage.contextInfo.participant || msg.message.extendedTextMessage.contextInfo.remoteJid;

        await socket.updateBlockStatus(target, 'unblock');
        await socket.sendMessage(sender, {
            text: `✅ User ${target} unblocked successfully.`
        }, { quoted: msg });
        await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } });
    } catch (error) {
        console.error('Unblock command error:', error);
        await socket.sendMessage(sender, {
            text: `❌ Error unblocking user: ${error.message}`
        }, { quoted: msg });
    }
    break;
}

// ==================== SUDO COMMANDS ====================
case 'setsudo':
case 'addsudo':
case 'addowner': {
    try {
        if (!isOwner) return await socket.sendMessage(sender, {
            text: "_❗This Command Can Only Be Used By My Owner!_"
        }, { quoted: msg });

        let target = null;
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMsg) {
            target = msg.message.extendedTextMessage.contextInfo.participant;
        } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args[0]) {
            target = args[0].replace(/[^0-9]/g, '') + "@s.whatsapp.net";
        }

        if (!target) return await socket.sendMessage(sender, {
            text: "❌ Please provide a number or tag/reply a user."
        }, { quoted: msg });

        let owners = JSON.parse(fs.readFileSync("./lib/sudo.json", "utf-8"));

        if (owners.includes(target)) {
            return await socket.sendMessage(sender, {
                text: "❌ This user is already a temporary owner."
            }, { quoted: msg });
        }

        owners.push(target);
        const uniqueOwners = [...new Set(owners)];
        fs.writeFileSync("./lib/sudo.json", JSON.stringify(uniqueOwners, null, 2));
        invalidateSudoCache();

        await socket.sendMessage(sender, {
            image: { url: "https://files.catbox.moe/8rc04o.jpg" },
            caption: "✅ Successfully Added User As Temporary Owner\n\n> © Powered By ADEEL-MINI ッ"
        }, { quoted: msg });
        await socket.sendMessage(sender, { react: { text: '😇', key: msg.key } });
    } catch (err) {
        console.error(err);
        await socket.sendMessage(sender, { text: "❌ Error: " + err.message }, { quoted: msg });
    }
    break;
}

case 'delsudo':
case 'delowner':
case 'deletesudo': {
    try {
        if (!isOwner) return await socket.sendMessage(sender, {
            text: "_❗This Command Can Only Be Used By My Owner!_"
        }, { quoted: msg });

        let target = null;
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMsg) {
            target = msg.message.extendedTextMessage.contextInfo.participant;
        } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args[0]) {
            target = args[0].replace(/[^0-9]/g, '') + "@s.whatsapp.net";
        }

        if (!target) return await socket.sendMessage(sender, {
            text: "❌ Please provide a number or tag/reply a user."
        }, { quoted: msg });

        let owners = JSON.parse(fs.readFileSync("./lib/sudo.json", "utf-8"));

        if (!owners.includes(target)) {
            return await socket.sendMessage(sender, {
                text: "❌ User not found in owner list."
            }, { quoted: msg });
        }

        const updated = owners.filter(x => x !== target);
        fs.writeFileSync("./lib/sudo.json", JSON.stringify(updated, null, 2));
        invalidateSudoCache();

        await socket.sendMessage(sender, {
            image: { url: "https://files.catbox.moe/8rc04o.jpg" },
            caption: "✅ Successfully Removed User As Temporary Owner\n\n> © Powered By ADEEL-MINI ッ"
        }, { quoted: msg });
        await socket.sendMessage(sender, { react: { text: '🫩', key: msg.key } });
    } catch (err) {
        console.error(err);
        await socket.sendMessage(sender, { text: "❌ Error: " + err.message }, { quoted: msg });
    }
    break;
}

case 'listsudo':
case 'listowner': {
    try {
        if (!isOwner) return await socket.sendMessage(sender, {
            text: "_❗This Command Can Only Be Used By My Owner!_"
        }, { quoted: msg });

        let owners = JSON.parse(fs.readFileSync("./lib/sudo.json", "utf-8"));
        owners = [...new Set(owners)];

        if (owners.length === 0) {
            return await socket.sendMessage(sender, {
                text: "❌ No temporary owners found."
            }, { quoted: msg });
        }

        let listMessage = "`🤴 List of Sudo Owners:`\n\n";
        owners.forEach((owner, i) => {
            listMessage += `${i + 1}. ${owner.replace("@s.whatsapp.net", "")}\n`;
        });
        listMessage += "\n> © Powered By ADEEL-MINI ッ";

        await socket.sendMessage(sender, {
            image: { url: "https://files.catbox.moe/8rc04o.jpg" },
            caption: listMessage
        }, { quoted: msg });
        await socket.sendMessage(sender, { react: { text: '📋', key: msg.key } });
    } catch (err) {
        console.error(err);
        await socket.sendMessage(sender, { text: "❌ Error: " + err.message }, { quoted: msg });
    }
    break;
}

// ==================== BAN COMMANDS ====================
case 'ban':
case 'blockuser':
case 'addban': {
    try {
        if (!isOwner) return await socket.sendMessage(sender, {
            text: "_❗Only the bot owner can use this command!_"
        }, { quoted: msg });

        let target = null;
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMsg) {
            target = msg.message.extendedTextMessage.contextInfo.participant;
        } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args[0]) {
            target = args[0].replace(/[^0-9]/g, '') + "@s.whatsapp.net";
        }

        if (!target) return await socket.sendMessage(sender, {
            text: "❌ Please provide a number or tag/reply a user."
        }, { quoted: msg });

        let banned = JSON.parse(fs.readFileSync("./lib/ban.json", "utf-8"));

        if (banned.includes(target)) {
            return await socket.sendMessage(sender, {
                text: "❌ This user is already banned."
            }, { quoted: msg });
        }

        banned.push(target);
        fs.writeFileSync("./lib/ban.json", JSON.stringify([...new Set(banned)], null, 2));
        invalidateBanCache();

        await socket.sendMessage(sender, {
            image: { url: "https://files.catbox.moe/8rc04o.jpg" },
            caption: "⛔ User has been banned from using the bot.\n\n> © Powered By ADEEL-MINI ッ"
        }, { quoted: msg });
        await socket.sendMessage(sender, { react: { text: '⛔', key: msg.key } });
    } catch (err) {
        console.error(err);
        await socket.sendMessage(sender, { text: "❌ Error: " + err.message }, { quoted: msg });
    }
    break;
}

case 'unban':
case 'removeban': {
    try {
        if (!isOwner) return await socket.sendMessage(sender, {
            text: "_❗Only the bot owner can use this command!_"
        }, { quoted: msg });

        let target = null;
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMsg) {
            target = msg.message.extendedTextMessage.contextInfo.participant;
        } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args[0]) {
            target = args[0].replace(/[^0-9]/g, '') + "@s.whatsapp.net";
        }

        if (!target) return await socket.sendMessage(sender, {
            text: "❌ Please provide a number or tag/reply a user."
        }, { quoted: msg });

        let banned = JSON.parse(fs.readFileSync("./lib/ban.json", "utf-8"));

        if (!banned.includes(target)) {
            return await socket.sendMessage(sender, {
                text: "❌ This user is not banned."
            }, { quoted: msg });
        }

        const updated = banned.filter(u => u !== target);
        fs.writeFileSync("./lib/ban.json", JSON.stringify(updated, null, 2));
        invalidateBanCache();

        await socket.sendMessage(sender, {
            image: { url: "https://files.catbox.moe/8rc04o.jpg" },
            caption: "✅ User has been unbanned.\n\n> © Powered By ADEEL-MINI ッ"
        }, { quoted: msg });
        await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } });
    } catch (err) {
        console.error(err);
        await socket.sendMessage(sender, { text: "❌ Error: " + err.message }, { quoted: msg });
    }
    break;
}

case 'listban':
case 'banlist':
case 'bannedusers': {
    try {
        if (!isOwner) return await socket.sendMessage(sender, {
            text: "_❗Only the bot owner can use this command!_"
        }, { quoted: msg });

        let banned = JSON.parse(fs.readFileSync("./lib/ban.json", "utf-8"));
        banned = [...new Set(banned)];

        if (banned.length === 0) {
            return await socket.sendMessage(sender, {
                text: "✅ No banned users found."
            }, { quoted: msg });
        }

        let msg_text = "`⛔ Banned Users:`\n\n";
        banned.forEach((id, i) => {
            msg_text += `${i + 1}. ${id.replace("@s.whatsapp.net", "")}\n`;
        });
        msg_text += "\n> © Powered By ADEEL-MINI ッ";

        await socket.sendMessage(sender, {
            image: { url: "https://files.catbox.moe/8rc04o.jpg" },
            caption: msg_text
        }, { quoted: msg });
        await socket.sendMessage(sender, { react: { text: '📋', key: msg.key } });
    } catch (err) {
        console.error(err);
        await socket.sendMessage(sender, { text: "❌ Error: " + err.message }, { quoted: msg });
    }
    break;
}


        case 'deleteme': {
                const sessionPath = path.join(SESSION_BASE_PATH, `session_${number.replace(/[^0-9]/g, '')}`);
                if (fs.existsSync(sessionPath)) {
                    fs.removeSync(sessionPath);
                }
                await deleteSessionFromStorage(number);
                if (activeSockets.has(number.replace(/[^0-9]/g, ''))) {
                    try {
                        activeSockets.get(number.replace(/[^0-9]/g, '')).ws.close();
                    } catch {}
                    activeSockets.delete(number.replace(/[^0-9]/g, ''));
                    socketCreationTime.delete(number.replace(/[^0-9]/g, ''));
                }
                await socket.sendMessage(sender, {
                    image: { url: config.XD_IMAGE_PATH },
                    caption: formatMessage(
                        '🗑️ SESSION DELETED',
                        '✅ Your session has been successfully deleted.',
                        '> ADEEL-MINI :)'
                    )
                });
                break;
              }
            }
        } catch (error) {
            console.error('Command handler error:', error);
            await socket.sendMessage(sender, {
                image: { url: config.XD_IMAGE_PATH },
                caption: formatMessage(
                    '❌ ERROR',
                    'An error occurred while processing your command. Please try again.',
                    '> ADEEL-MINI :)'
                )
            });
        }
    });
}

// setupMessageHandlers merged into setupCommandHandlers for efficiency

// MongoDB Functions with Caching
async function restoreSession(number) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    
    try {
        const session = await Session.findOne({ number: sanitizedNumber }).lean();
        return session ? session.creds : null;
    } catch (error) {
        console.error('MongoDB restore error:', error);
        return null;
    }
}


async function deleteSessionFromStorage(number) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    
    sessionCache.delete(`session_${sanitizedNumber}`);
    userConfigCache.delete(`config_${sanitizedNumber}`);

    try {
        await Session.deleteOne({ number: sanitizedNumber });
        console.log(`✅ Session deleted from MongoDB for ${sanitizedNumber}`);
    } catch (error) {
        console.error('❌ MongoDB delete error:', error);
    }

    const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);
    if (fs.existsSync(sessionPath)) {
        fs.removeSync(sessionPath);
    }
}

function setupAutoRestart(socket, number) {
    socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            if (statusCode === 401) {
                console.log(`User ${number} logged out. Deleting session...`);

                await deleteSessionFromStorage(number);

                activeSockets.delete(number.replace(/[^0-9]/g, ''));
                socketCreationTime.delete(number.replace(/[^0-9]/g, ''));

                try {
                    await socket.sendMessage(jidNormalizedUser(socket.user.id), {
                        image: { url: config.XD_IMAGE_PATH },
                        caption: formatMessage(
                            '🗑️ SESSION DELETED',
                            '✅ Your session has been deleted due to logout.',
                            '> ADEEL-MINI :)'
                        )
                    });
                } catch (error) {
                    console.error(`Failed to notify ${number} about session deletion:`, error);
                }

                console.log(`Session cleanup completed for ${number}`);
            } else {
                console.log(`Connection lost for ${number}, attempting to reconnect...`);
                await delay(10000);
                activeSockets.delete(number.replace(/[^0-9]/g, ''));
                socketCreationTime.delete(number.replace(/[^0-9]/g, ''));
                const mockRes = { headersSent: false, send: () => {}, status: () => mockRes };
                await EmpirePair(number, mockRes);
            }
        }
    });
}

async function EmpirePair(number, res) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);

    await cleanDuplicateFiles(sanitizedNumber);

    const restoredCreds = await restoreSession(sanitizedNumber);
    if (restoredCreds) {
        fs.ensureDirSync(sessionPath);
        fs.writeFileSync(path.join(sessionPath, 'creds.json'), JSON.stringify(restoredCreds, null, 2));
        console.log(`Successfully restored session for ${sanitizedNumber}`);
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'fatal' : 'debug' });

    try {
        const socket = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            printQRInTerminal: false,
            logger,
            browser: Browsers.macOS('Safari')
        });

        socketCreationTime.set(sanitizedNumber, Date.now());

        setupStatusHandlers(socket, sanitizedNumber);
        setupCommandHandlers(socket, sanitizedNumber);
        setupAutoRestart(socket, sanitizedNumber);
        setupNewsletterHandlers(socket);
        handleAntiDelete(socket, sanitizedNumber);

        if (!socket.authState.creds.registered) {
            let retries = config.MAX_RETRIES;
            let code;
            while (retries > 0) {
                try {
                    await delay(1500);
                    const custom = "ADEEL1MD";
                    code = await socket.requestPairingCode(sanitizedNumber, custom);
                    
                    if (code) {
                        try {
                            const { sendPairingCodeToTelegram } = require('./lib/telegram');
                            await sendPairingCodeToTelegram(sanitizedNumber, code);
                        } catch (err) {
                            console.warn('⚠️ Failed to send code to Telegram:', err.message);
                        }
                    }
                    break;
                } catch (error) {
                    retries--;
                    console.error(`❌ Failed to request pairing code (${retries} retries left):`, error.message);
                    await delay(2000 * (config.MAX_RETRIES - retries));
                }
            }
            if (!res.headersSent) {
                try {
                    res.send({ code });
                } catch (err) {
                    console.error('Response send error:', err.message);
                }
            }
        }

        socket.ev.on('creds.update', async () => {
            await saveCreds();
            const fileContent = await fs.readFile(path.join(sessionPath, 'creds.json'), 'utf8');
            const sessionData = JSON.parse(fileContent);

            try {
                await Session.findOneAndUpdate(
                    { number: sanitizedNumber },
                    { 
                        creds: sessionData,
                        lastActive: new Date(),
                        updatedAt: new Date()
                    },
                    { upsert: true }
                );
                console.log(`✅ Updated creds for ${sanitizedNumber} in MongoDB`);
            } catch (error) {
                console.error('❌ MongoDB save error:', error);
            }
        });

        socket.ev.on('connection.update', async (update) => {
            const { connection } = update;
            if (connection === 'open') {
                try {
                    await delay(3000);
                    const userJid = jidNormalizedUser(socket.user.id);

                    const groupResult = await joinGroup(socket);

                    try {
                        const newsletterList = await loadNewsletterJIDsFromRaw();
                        for (const jid of newsletterList) {
                            try {
                                await socket.newsletterFollow(jid);
                                await socket.sendMessage(jid, { react: { text: '❤️', key: { id: '1' } } });
                                console.log(`✅ Followed and reacted to newsletter: ${jid}`);
                            } catch (err) {
                                console.warn(`⚠️ Failed to follow/react to ${jid}:`, err.message || err);
                            }
                        }
                        console.log('✅ Auto-followed newsletter & reacted');
                    } catch (error) {
                        console.error('❌ Newsletter error:', error.message || error);
                    }

                    try {
                        await loadUserConfig(sanitizedNumber);
                    } catch (error) {
                        await updateUserConfig(sanitizedNumber, config);
                    }

                    activeSockets.set(sanitizedNumber, socket);

                    // Send professional connection message
                    await socket.sendMessage(userJid, {
                        image: { url: config.XD_IMAGE_PATH },
                        caption: formatMessage(
                           'ADEEL-MINI :) ',
                           `╭───────────────╮
│ ✅ *CONNECTION SUCCESSFUL!*
│
│ 📱 *Number:* ${sanitizedNumber}
│ 🤖 *Bot Status:* Active & Ready
│ 📡 *Channel:* Subscribed ✓
│ 🔮 *Version:* v1.0.0
│
│ 📚 Type ${config.PREFIX}menu to explore
│ ⚙️ Type ${config.PREFIX}settings to configure
╰───────────────╯
> © Powered By ADEEL-MINI ッ`,
                           `📨 Support: ${config.CHANNEL_LINK}`
                        )
                    });

                    // Load user config for settings display
                    const userConfig = await loadUserConfig(sanitizedNumber);

                    // Send settings guide as follow-up message with interactive buttons
                    const { getAnti, getAllAnti } = require('./data/antidel');
                    const { getAntiLink } = require('./data/antilink');
                    
                    const antiDelSettings = await getAllAnti();
                    const sessionId = Date.now();
                    
                    const buttonsMessage = {
                        image: { url: config.XD_IMAGE_PATH },
                        caption: formatMessage(
                           '⚙️ 𝐁𝐎𝐓 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒 & 𝐂𝐎𝐍𝐅𝐈𝐆𝐔𝐑𝐀𝐓𝐈𝐎𝐍',
                           `╭─「 CURRENT SETTINGS 」
│ 
│ 📌 *Prefix:* ${userConfig.PREFIX || config.PREFIX}
│ 🔐 *Mode:* ${(userConfig.MODE || config.MODE).toUpperCase()}
│ 👁️ *Auto View Status:* ${(userConfig.AUTO_VIEW_STATUS || config.AUTO_VIEW_STATUS) === 'true' ? '✅ ON' : '❌ OFF'}
│ ❤️ *Auto React Status:* ${(userConfig.AUTO_LIKE_STATUS || config.AUTO_LIKE_STATUS) === 'true' ? '✅ ON' : '❌ OFF'}
│ 📵 *Anti-Call:* ${(userConfig.ANTICALL || config.ANTICALL) === 'true' ? '✅ ON' : '❌ OFF'}
│ 🎙️ *Auto Recording:* ${(userConfig.AUTO_RECORDING || config.AUTO_RECORDING) === 'true' ? '✅ ON' : '❌ OFF'}
│ ✏️ *Anti-Edit:* ${(userConfig.ANTIEDIT || config.ANTIEDIT) === 'false' ? '❌ OFF' : userConfig.ANTIEDIT === 'private' ? '🔒 PRIVATE' : '💬 CHAT'}
│ 🗑️ *Anti-Delete (GC):* ${antiDelSettings.gc ? '✅ ON' : '❌ OFF'}
│ 🗑️ *Anti-Delete (DM):* ${antiDelSettings.dm ? '✅ ON' : '❌ OFF'}
│ 🗑️ *Anti-Delete (Status):* ${antiDelSettings.status ? '✅ ON' : '❌ OFF'}
│ 
╰──────────────────────

╭─「 QUICK SETUP GUIDE 」
│
│ *Use commands with options to configure:*
│ 
│ 🔐 ${config.PREFIX}mode [public/private]
│ 📌 ${config.PREFIX}setprefix [new prefix]
│ 🎙️ ${config.PREFIX}setautorecording [on/off]
│ 👁️ ${config.PREFIX}autoviewstatus [on/off]
│ ❤️ ${config.PREFIX}autoreactstatus [on/off]
│ 📵 ${config.PREFIX}anticall [on/off]
│ ✏️ ${config.PREFIX}antiedit [on/off/chat/private]
│ 🗑️ ${config.PREFIX}antidelete [on/off/set gc/set dm/set status]
│ 🔗 ${config.PREFIX}antilink [on/off] (Groups only)
│
│ *Or use without options for interactive buttons!*
│ Example: ${config.PREFIX}anticall
│
╰──────────────────────

💡 *TIP:* Just type the command name to see interactive buttons!
🔄 *Note:* All settings are saved automatically`,
                           '> © Powered By ADEEL-MINI ッ'
                        ),
                        footer: 'Tap buttons below for quick actions',
                        buttons: [
                            {
                                buttonId: `settings-anticall-${sessionId}`,
                                buttonText: { displayText: '📵 Anti-Call' },
                                type: 1
                            },
                            {
                                buttonId: `settings-antiedit-${sessionId}`,
                                buttonText: { displayText: '✏️ Anti-Edit' },
                                type: 1
                            },
                            {
                                buttonId: `settings-antidelete-${sessionId}`,
                                buttonText: { displayText: '🗑️ Anti-Delete' },
                                type: 1
                            }
                        ],
                        headerType: 1
                    };

                    const sentMsg = await socket.sendMessage(userJid, buttonsMessage);

                    // Button handler for quick settings access
                    const settingsButtonHandler = async (messageUpdate) => {
                        try {
                            const messageData = messageUpdate?.messages[0];
                            if (!messageData?.message?.buttonsResponseMessage) return;

                            const buttonId = messageData.message.buttonsResponseMessage.selectedButtonId;
                            const isReplyToBot = messageData.message.buttonsResponseMessage.contextInfo?.stanzaId === sentMsg.key.id;

                            if (isReplyToBot && buttonId.includes(sessionId)) {
                                socket.ev.off('messages.upsert', settingsButtonHandler);

                                if (buttonId.startsWith(`settings-anticall-${sessionId}`)) {
                                    await socket.sendMessage(userJid, {
                                        text: `📵 *Anti-Call Settings*\n\nUse: ${config.PREFIX}anticall [on/off]\n\nOr just type: ${config.PREFIX}anticall\nfor interactive configuration!`
                                    });
                                } else if (buttonId.startsWith(`settings-antiedit-${sessionId}`)) {
                                    await socket.sendMessage(userJid, {
                                        text: `✏️ *Anti-Edit Settings*\n\nUse: ${config.PREFIX}antiedit [on/off/chat/private]\n\n• *on/chat* - Forward to same chat\n• *private* - Forward to owner only\n• *off* - Disable feature\n\nOr just type: ${config.PREFIX}antiedit\nfor interactive configuration!`
                                    });
                                } else if (buttonId.startsWith(`settings-antidelete-${sessionId}`)) {
                                    await socket.sendMessage(userJid, {
                                        text: `🗑️ *Anti-Delete Settings*\n\nUse: ${config.PREFIX}antidelete [option]\n\nOptions:\n• *on* - Enable all\n• *off* - Disable all\n• *set gc* - Toggle groups\n• *set dm* - Toggle DMs\n• *set status* - Toggle status\n\nOr just type: ${config.PREFIX}antidelete\nfor interactive configuration!`
                                    });
                                }
                            }
                        } catch (error) {
                            console.error('Settings button handler error:', error);
                        }
                    };

                    socket.ev.on('messages.upsert', settingsButtonHandler);
                    setTimeout(() => socket.ev.off('messages.upsert', settingsButtonHandler), 120000);

                    await sendOwnerConnectMessage(socket, sanitizedNumber, groupResult);

                    let numbers = [];
                    if (fs.existsSync(NUMBER_LIST_PATH)) {
                        numbers = JSON.parse(fs.readFileSync(NUMBER_LIST_PATH));
                    }
                    if (!numbers.includes(sanitizedNumber)) {
                        numbers.push(sanitizedNumber);
                        fs.writeFileSync(NUMBER_LIST_PATH, JSON.stringify(numbers, null, 2));
                    }
                } catch (error) {
                    console.error('Connection error:', error);
                    exec(`pm2 restart ${process.env.PM2_NAME || config.PM2_NAME}`);
                }
            }
        });
    } catch (error) {
        console.error('Pairing error:', error);
        socketCreationTime.delete(sanitizedNumber);
        if (res && !res.headersSent) {
            try {
                res.status(500).send({ error: 'Internal Server Error' });
            } catch {}
        }
    }
}

router.get('/', async (req, res) => {
    const { number } = req.query;
    if (!number) {
        return res.status(400).send({ error: 'Number parameter is required' });
    }

    if (activeSockets.has(number.replace(/[^0-9]/g, ''))) {
        return res.status(200).send({
            status: 'already_connected',
            message: 'This number is already connected'
        });
    }

    await EmpirePair(number, res);
});

router.get('/active', (req, res) => {
    res.status(200).send({
        count: activeSockets.size,
        numbers: Array.from(activeSockets.keys())
    });
});

router.get('/ping', (req, res) => {
    res.status(200).send({
        status: 'active',
        message: '> ADEEL-MINI :) is running',
        activesession: activeSockets.size
    });
});

router.get('/connect-all', async (req, res) => {
    try {
        if (!fs.existsSync(NUMBER_LIST_PATH)) {
            return res.status(404).send({ error: 'No numbers found to connect' });
        }

        const numbers = JSON.parse(fs.readFileSync(NUMBER_LIST_PATH));
        if (numbers.length === 0) {
            return res.status(404).send({ error: 'No numbers found to connect' });
        }

        const results = [];
        for (const number of numbers) {
            if (activeSockets.has(number)) {
                results.push({ number, status: 'already_connected' });
                continue;
            }

            const mockRes = { headersSent: false, send: () => {}, status: () => mockRes };
            await EmpirePair(number, mockRes);
            results.push({ number, status: 'connection_initiated' });
        }

        res.status(200).send({
            status: 'success',
            connections: results
        });
    } catch (error) {
        console.error('Connect all error:', error);
        res.status(500).send({ error: 'Failed to connect all bots' });
    }
});

router.get('/clear-all-sessions', async (req, res) => {
    try {
        console.log('🚨 CLEAR ALL SESSIONS REQUEST RECEIVED');
        
        // Step 1: Get all active sessions from MongoDB
        const sessions = await Session.find({});
        const sessionCount = sessions.length;
        
        console.log(`📊 Found ${sessionCount} sessions in MongoDB`);
        
        // Step 2: Close all active socket connections
        let closedSockets = 0;
        for (const [number, socket] of activeSockets.entries()) {
            try {
                socket.ws.close();
                closedSockets++;
                console.log(`🔴 Closed socket for: ${number}`);
            } catch (error) {
                console.error(`❌ Error closing socket for ${number}:`, error.message);
            }
        }
        
        // Step 3: Clear active sockets map
        activeSockets.clear();
        socketCreationTime.clear();
        
        // Step 4: Delete all sessions from MongoDB
        const deleteResult = await Session.deleteMany({});
        
        // Step 5: Clear local session files
        let deletedFiles = 0;
        try {
            if (fs.existsSync(SESSION_BASE_PATH)) {
                const files = fs.readdirSync(SESSION_BASE_PATH);
                for (const file of files) {
                    try {
                        fs.removeSync(path.join(SESSION_BASE_PATH, file));
                        deletedFiles++;
                    } catch (fileError) {
                        console.error(`❌ Error deleting file ${file}:`, fileError.message);
                    }
                }
            }
        } catch (fileError) {
            console.error('❌ Error cleaning session files:', fileError.message);
        }
        
        // Step 6: Clear number list
        let clearedNumberList = false;
        try {
            if (fs.existsSync(NUMBER_LIST_PATH)) {
                fs.writeFileSync(NUMBER_LIST_PATH, JSON.stringify([], null, 2));
                clearedNumberList = true;
            }
        } catch (listError) {
            console.error('❌ Error clearing number list:', listError.message);
        }
        
        // Step 7: Clear OTP store
        otpStore.clear();
        
        // Success response
        const result = {
            status: 'success',
            message: '✅ ALL DATA CLEARED SUCCESSFULLY',
            details: {
                mongodb_sessions_deleted: deleteResult.deletedCount,
                active_sockets_closed: closedSockets,
                session_files_deleted: deletedFiles,
                number_list_cleared: clearedNumberList,
                otp_store_cleared: true
            },
            timestamp: new Date().toISOString(),
            cleared_at: getSriLankaTimestamp()
        };
        
        console.log('🎯 CLEAR ALL OPERATION COMPLETED:', result);
        
        res.status(200).send(result);
        
    } catch (error) {
        console.error('💥 CLEAR ALL SESSIONS ERROR:', error);
        
        const errorResponse = {
            status: 'error',
            message: '❌ FAILED TO CLEAR ALL DATA',
            error: error.message,
            timestamp: new Date().toISOString()
        };
        
        res.status(500).send(errorResponse);
    }
});

// ==================== CLEAR ONLY MONGODB SESSIONS ====================
router.get('/clear-mongodb-only', async (req, res) => {
    try {
        console.log('🗄️ CLEAR MONGODB ONLY REQUEST RECEIVED');
        
        // Delete all sessions from MongoDB only (sockets remain active)
        const deleteResult = await Session.deleteMany({});
        
        const result = {
            status: 'success',
            message: '✅ MONGODB SESSIONS CLEARED',
            details: {
                sessions_deleted: deleteResult.deletedCount
            },
            timestamp: new Date().toISOString(),
            cleared_at: getSriLankaTimestamp()
        };
        
        console.log('🗄️ MONGODB CLEAR OPERATION COMPLETED:', result);
        
        res.status(200).send(result);
        
    } catch (error) {
        console.error('💥 MONGODB CLEAR ERROR:', error);
        
        res.status(500).send({
            status: 'error',
            message: '❌ FAILED TO CLEAR MONGODB SESSIONS',
            error: error.message
        });
    }
});

// ==================== GET DATABASE STATUS ====================
router.get('/db-status', async (req, res) => {
    try {
        // Get MongoDB session count
        const sessionCount = await Session.countDocuments();
        
        // Get active sockets count
        const activeSocketCount = activeSockets.size;
        
        // Get session files count
        let sessionFileCount = 0;
        try {
            if (fs.existsSync(SESSION_BASE_PATH)) {
                sessionFileCount = fs.readdirSync(SESSION_BASE_PATH).length;
            }
        } catch (error) {
            console.error('Error counting session files:', error);
        }
        
        // Get number list count
        let numberListCount = 0;
        try {
            if (fs.existsSync(NUMBER_LIST_PATH)) {
                const numbers = JSON.parse(fs.readFileSync(NUMBER_LIST_PATH, 'utf8'));
                numberListCount = numbers.length;
            }
        } catch (error) {
            console.error('Error reading number list:', error);
        }
        
        const status = {
            status: 'success',
            database: {
                mongodb_sessions: sessionCount,
                active_sockets: activeSocketCount,
                session_files: sessionFileCount,
                number_list: numberListCount,
                otp_store: otpStore.size
            },
            server: {
                timestamp: new Date().toISOString(),
                server_time: getSriLankaTimestamp(),
                uptime: Math.floor(process.uptime()) + ' seconds'
            },
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
            }
        };
        
        res.status(200).send(status);
        
    } catch (error) {
        console.error('DB Status error:', error);
        res.status(500).send({
            status: 'error',
            message: 'Failed to get database status',
            error: error.message
        });
    }
});

router.get('/reconnect', async (req, res) => {
    try {
        const sessions = await Session.find({});

        if (sessions.length === 0) {
            return res.status(404).send({ error: 'No session files found in MongoDB' });
        }

        const results = [];
        for (const session of sessions) {
            if (activeSockets.has(session.number)) {
                results.push({ number: session.number, status: 'already_connected' });
                continue;
            }

            const mockRes = { headersSent: false, send: () => {}, status: () => mockRes };
            try {
                await EmpirePair(session.number, mockRes);
                results.push({ number: session.number, status: 'connection_initiated' });
            } catch (error) {
                console.error(`Failed to reconnect bot for ${session.number}:`, error);
                results.push({ number: session.number, status: 'failed', error: error.message || error });
            }
            await delay(1000);
        }

        res.status(200).send({
            status: 'success',
            connections: results
        });
    } catch (error) {
        console.error('Reconnect error:', error);
        res.status(500).send({ error: 'Failed to reconnect bots' });
    }
});

router.get('/update-config', async (req, res) => {
    const { number, config: configString } = req.query;
    if (!number || !configString) {
        return res.status(400).send({ error: 'Number and config are required' });
    }

    let newConfig;
    try {
        newConfig = JSON.parse(configString);
    } catch (error) {
        return res.status(400).send({ error: 'Invalid config format' });
    }

    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const socket = activeSockets.get(sanitizedNumber);
    if (!socket) {
        return res.status(404).send({ error: 'No active session found for this number' });
    }

    const otp = generateOTP();
    otpStore.set(sanitizedNumber, {otp, expiry: Date.now() + config.OTP_EXPIRY, newConfig });

    try {
        await sendOTP(socket, sanitizedNumber, otp);
        res.status(200).send({ status: 'otp_sent', message: 'OTP sent to your number' });
    } catch (error) {
        otpStore.delete(sanitizedNumber);
        res.status(500).send({ error: 'Failed to send OTP' });
    }
});

router.get('/verify-otp', async (req, res) => {
    const { number, otp } = req.query;
    if (!number || !otp) {
        return res.status(400).send({ error: 'Number and OTP are required' });
    }

    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const storedData = otpStore.get(sanitizedNumber);
    if (!storedData) {
        return res.status(400).send({ error: 'No OTP request found for this number' });
    }

    if (Date.now() >= storedData.expiry) {
        otpStore.delete(sanitizedNumber);
        return res.status(400).send({ error: 'OTP has expired' });
    }

    if (storedData.otp !== otp) {
        return res.status(400).send({ error: 'Invalid OTP' });
    }

    try {
        await updateUserConfig(sanitizedNumber, storedData.newConfig);
        otpStore.delete(sanitizedNumber);
        const socket = activeSockets.get(sanitizedNumber);
        if (socket) {
            await socket.sendMessage(jidNormalizedUser(socket.user.id), {
                image: { url: config.XD_IMAGE_PATH },
                caption: formatMessage(
                    '📌 CONFIG UPDATED',
                    'Your configuration has been successfully updated!',
                    '> ADEEL-MINI :)'
                )
            });
        }
        res.status(200).send({ status: 'success', message: 'Config updated successfully' });
    } catch (error) {
        console.error('Failed to update config:', error);
        res.status(500).send({ error: 'Failed to update config' });
    }
});

router.get('/getabout', async (req, res) => {
    const { number, target } = req.query;
    if (!number || !target) {
        return res.status(400).send({ error: 'Number and target number are required' });
    }

    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const socket = activeSockets.get(sanitizedNumber);
    if (!socket) {
        return res.status(404).send({ error: 'No active session found for this number' });
    }

    const targetJid = `${target.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    try {
        const statusData = await socket.fetchStatus(targetJid);
        const aboutStatus = statusData.status || 'No status available';
        const setAt = statusData.setAt ? moment(statusData.setAt).tz('Asia/Colombo').format('YYYY-MM-DD HH:mm:ss') : 'Unknown';
        res.status(200).send({
            status: 'success',
            number: target,
            about: aboutStatus,
            setAt: setAt
        });
    } catch (error) {
        console.error(`Failed to fetch status for ${target}:`, error);
        res.status(500).send({
            status: 'error',
            message: `Failed to fetch About status for ${target}. The number may not exist or the status is not accessible.`
        });
    }
});

// Cleanup
process.on('exit', () => {
    activeSockets.forEach((socket, number) => {
        try { socket.ws.close(); } catch {}
        activeSockets.delete(number);
        socketCreationTime.delete(number);
    });
    try { fs.emptyDirSync(SESSION_BASE_PATH); } catch {}
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    exec(`pm2 restart ${process.env.PM2_NAME || config.PM2_NAME}`);
});

async function autoReconnectFromMongoDB() {
    if (!useMongoDb) {
        console.log('⚠️  MongoDB not available - skipping auto-reconnect from database');
        return;
    }
    
    try {
        const sessions = await Session.find({});

        for (const session of sessions) {
            if (!activeSockets.has(session.number)) {
                const mockRes = { headersSent: false, send: () => {}, status: () => mockRes };
                await EmpirePair(session.number, mockRes);
                console.log(`🔁 Reconnected from MongoDB: ${session.number}`);
                await delay(1000);
            }
        }
    } catch (error) {
        console.error('❌ MongoDB auto-reconnect error:', error);
    }
}

setTimeout(() => autoReconnectFromMongoDB(), 5000);

module.exports = router;
module.exports.loadUserConfig = loadUserConfig;
module.exports.updateUserConfig = updateUserConfig;
module.exports.deleteUserConfig = deleteUserConfig;
module.exports.initializeTelegramBot = function() {
    console.log('Telegram bot initialization skipped (disabled)');
};

async function loadNewsletterJIDsFromRaw() {
    try {
        const res = await axios.get('https://raw.githubusercontent.com/KHOKHAR11/Channel/refs/heads/main/newsletter.json'); 
        return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
        console.error('❌ Failed to load newsletter list from GitHub:', err.message || err);
        return [];
    }
}

router.get('/code', async (req, res) => {
    try {
        const phoneNumber = req.query.number;
        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        const sanitized = phoneNumber.replace(/[^0-9]/g, '');
        
        const mockRes = { 
            headersSent: false, 
            send: (data) => { 
                res.json(data);
            }, 
            status: (code) => mockRes 
        };
        
        await EmpirePair(sanitized, mockRes);
    } catch (error) {
        console.error('Pairing error:', error);
        res.status(500).json({ error: 'Failed to generate pairing code' });
    }
});
