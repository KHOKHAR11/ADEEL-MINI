const express = require('express');
const app = express();
__path = process.cwd();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 3000;
const config = require('./config');

require('events').EventEmitter.defaultMaxListeners = 500;

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

let code = require('./pair');
let telegramBot = null;

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.use('/code', code);

app.use('/pair', async (req, res, next) => {
    try {
        res.sendFile(__path + '/pair.html');
    } catch (error) {
        console.error('Error serving pair.html:', error.message);
        res.status(500).send('Error loading page');
    }
});

app.use('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        telegram: 'connected (initialized in pair.js)'
    });
});

// Admin Panel API - Get all users data
app.use('/api/users', async (req, res) => {
    try {
        const { Session, isMongoConnected } = require('./lib/userConfigService');
        
        if (!isMongoConnected()) {
            return res.json({ users: [], error: 'MongoDB not connected' });
        }
        
        const sessions = await Session.find({}).select('number isActive lastActive connectionCount createdAt metadata').lean();
        
        const users = sessions.map(session => ({
            number: session.number,
            isActive: session.isActive,
            lastActive: session.lastActive,
            connectionCount: session.connectionCount || 0,
            createdAt: session.createdAt,
            mode: (session.metadata && session.metadata.MODE) || 'public'
        }));
        
        res.json({ users });
    } catch (error) {
        console.error('API users error:', error);
        res.json({ users: [], error: error.message });
    }
});

// Admin Panel HTML
app.use('/admin', (req, res) => {
    try {
        res.sendFile(__path + '/admin.html');
    } catch (error) {
        console.error('Error serving admin.html:', error.message);
        res.status(500).send('Error loading admin panel');
    }
});

app.use('/', async (req, res, next) => {
    try {
        res.sendFile(__path + '/main.html');
    } catch (error) {
        console.error('Error serving main.html:', error.message);
        res.status(500).send('Error loading page');
    }
});

app.use((err, req, res, next) => {
    console.error('Express error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
    const founderName = config.FOUNDER_NAME || 'ADEEL';
    const botName = config.BOT_NAME || 'ADEEL-MINI BOT';
    
    console.log(`
╭━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃  🤖 ${botName}
┃━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  ✅ Server Running!
┃  🌐 Port: ${PORT}
┃  📡 http://0.0.0.0:${PORT}
┃  👑 Founder: ${founderName}
┃  📲 Telegram: Connected
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`);
});

module.exports = app;
