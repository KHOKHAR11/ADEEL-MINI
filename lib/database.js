const fs = require('fs');
const path = require('path');

const sessionDir = path.join(__dirname, '../session');
if (!fs.existsSync(sessionDir)) {
    try {
        fs.mkdirSync(sessionDir, { recursive: true });
        console.log('✅ Session directory created');
    } catch (error) {
        console.error('❌ Failed to create session directory:', error.message);
    }
}

const DATABASE = {
    authenticate: async () => true,
    sync: async () => true,
    close: async () => true
};

async function testConnection() {
    console.log('✅ Using MongoDB for database (SQLite disabled)');
    return true;
}

async function initDatabase() {
    console.log('✅ MongoDB database in use');
    return true;
}

async function closeDatabase() {
    return true;
}

function getDatabaseStats() {
    return {
        dialect: 'mongodb',
        connected: true
    };
}

module.exports = { 
    DATABASE,
    testConnection,
    initDatabase,
    closeDatabase,
    getDatabaseStats
};
