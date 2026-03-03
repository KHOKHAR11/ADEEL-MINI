const fs = require('fs');
const path = require('path');
const config = require('../config');

const dataPath = path.join(__dirname, 'antidel_settings.json');

let settings = {
    gc_status: config.ANTIDELETE === 'true',
    dm_status: config.ANTIDELETE === 'true',
    status_status: config.ANTIDELETE === 'true'
};

function loadSettings() {
    try {
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            settings = { ...settings, ...data };
        }
    } catch (error) {
        console.error('Error loading antidel settings:', error.message);
    }
    return settings;
}

function saveSettings() {
    try {
        const tempPath = dataPath + '.tmp';
        fs.writeFileSync(tempPath, JSON.stringify(settings, null, 2));
        fs.renameSync(tempPath, dataPath);
        return true;
    } catch (error) {
        console.error('Error saving antidel settings:', error.message);
        try { fs.unlinkSync(dataPath + '.tmp'); } catch (e) {}
        return false;
    }
}

loadSettings();

async function initializeAntiDeleteSettings() {
    loadSettings();
    return true;
}

async function setAnti(type, status) {
    if (!type || typeof status !== 'boolean') return false;
    const validTypes = ['gc', 'dm', 'status'];
    if (!validTypes.includes(type)) return false;
    
    settings[`${type}_status`] = status;
    return saveSettings();
}

async function getAnti(type) {
    if (!type) return false;
    const validTypes = ['gc', 'dm', 'status'];
    if (!validTypes.includes(type)) return false;
    
    return settings[`${type}_status`] ?? config.ANTIDELETE === 'true';
}

async function setAllAnti(status) {
    if (typeof status !== 'boolean') return false;
    
    settings.gc_status = status;
    settings.dm_status = status;
    settings.status_status = status;
    return saveSettings();
}

async function getAllAnti() {
    return {
        gc: settings.gc_status ?? false,
        dm: settings.dm_status ?? false,
        status: settings.status_status ?? false
    };
}

async function resetAntiDelete() {
    settings = {
        gc_status: false,
        dm_status: false,
        status_status: false
    };
    return saveSettings();
}

module.exports = {
    AntiDelDB: null,
    initializeAntiDeleteSettings,
    setAnti,
    getAnti,
    setAllAnti,
    getAllAnti,
    resetAntiDelete,
};
