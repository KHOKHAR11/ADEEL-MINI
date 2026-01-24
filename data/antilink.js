const mongoose = require('mongoose');
const config = require('../config');

// Define schema with better validation
const antilinkSchema = new mongoose.Schema({
    groupId: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        index: true
    },
    enabled: { 
        type: Boolean, 
        default: true 
    },
    warnCount: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Add pre-save hook
antilinkSchema.pre('save', function(next) {
    this.lastUpdated = Date.now();
    next();
});

let AntiLink;
try {
    AntiLink = mongoose.model('AntiLink');
} catch {
    AntiLink = mongoose.model('AntiLink', antilinkSchema);
}

// Cache for antilink status
const antilinkCache = new Map();
const CACHE_TTL = 60000; // 1 minute

function isValidGroupId(groupId) {
    if (!groupId || typeof groupId !== 'string') return false;
    return groupId.endsWith('@g.us') || groupId.endsWith('@s.whatsapp.net');
}

async function getAntiLink(groupId) {
    // Gracefully handle invalid groupId - return default
    if (!groupId || typeof groupId !== 'string') {
        return config.ANTI_LINK === 'true';
    }
    
    // Accept any WhatsApp JID format
    const isValidJid = groupId.includes('@');
    if (!isValidJid) {
        return config.ANTI_LINK === 'true';
    }
    
    try {
        // Check cache first
        const cached = antilinkCache.get(groupId);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.enabled;
        }
        
        // Gracefully handle when MongoDB is not connected - return default
        if (mongoose.connection.readyState !== 1) {
            return config.ANTI_LINK === 'true';
        }
        
        const record = await AntiLink.findOne({ groupId }).lean();
        
        if (record) {
            // Update cache
            antilinkCache.set(groupId, { 
                enabled: record.enabled, 
                timestamp: Date.now() 
            });
            return record.enabled;
        }
        
        // Return default from config
        return config.ANTI_LINK === 'true';
    } catch (error) {
        // Gracefully degrade - return default on any error
        console.warn('getAntiLink error (using default):', error.message);
        return config.ANTI_LINK === 'true';
    }
}

async function setAntiLink(groupId, enabled) {
    // Validate groupId
    if (!groupId || typeof groupId !== 'string' || !groupId.includes('@')) {
        console.warn('setAntiLink: Invalid groupId, updating cache only');
        // Still update cache for local operation
        if (groupId && typeof enabled === 'boolean') {
            antilinkCache.set(groupId, { enabled, timestamp: Date.now() });
        }
        return true; // Return true to not break command flow
    }
    
    if (typeof enabled !== 'boolean') {
        enabled = Boolean(enabled);
    }
    
    try {
        // Gracefully handle when MongoDB is not connected
        if (mongoose.connection.readyState !== 1) {
            console.warn('setAntiLink: MongoDB not connected, using cache only');
            antilinkCache.set(groupId, { enabled, timestamp: Date.now() });
            return true; // Return true - feature works via cache
        }
        
        await AntiLink.findOneAndUpdate(
            { groupId },
            { 
                enabled,
                lastUpdated: new Date()
            },
            { 
                upsert: true, 
                new: true,
                runValidators: true
            }
        );
        
        // Update cache
        antilinkCache.set(groupId, { 
            enabled, 
            timestamp: Date.now() 
        });
        
        console.log(`✅ AntiLink for ${groupId} set to ${enabled}`);
        return true;
    } catch (error) {
        // Gracefully degrade - still update cache
        console.warn('setAntiLink DB error, using cache:', error.message);
        antilinkCache.set(groupId, { enabled, timestamp: Date.now() });
        return true;
    }
}

async function getAllAntiLink() {
    try {
        if (mongoose.connection.readyState !== 1) {
            console.warn('getAllAntiLink: MongoDB not connected');
            return [];
        }
        
        const records = await AntiLink.find({}).lean();
        return records || [];
    } catch (error) {
        console.error('❌ Error getting all antilink records:', error.message);
        return [];
    }
}

async function deleteAntiLink(groupId) {
    if (!isValidGroupId(groupId)) {
        console.error('deleteAntiLink: Invalid groupId:', groupId);
        return false;
    }
    
    try {
        if (mongoose.connection.readyState !== 1) {
            console.error('deleteAntiLink: MongoDB not connected');
            return false;
        }
        
        await AntiLink.deleteOne({ groupId });
        antilinkCache.delete(groupId);
        
        console.log(`✅ AntiLink record deleted for ${groupId}`);
        return true;
    } catch (error) {
        console.error('❌ Error deleting antilink record:', error.message);
        return false;
    }
}

function clearCache() {
    antilinkCache.clear();
    console.log('✅ AntiLink cache cleared');
}

// Get groups with antilink enabled
async function getEnabledGroups() {
    try {
        if (mongoose.connection.readyState !== 1) {
            return [];
        }
        
        const records = await AntiLink.find({ enabled: true }).lean();
        return records.map(r => r.groupId);
    } catch (error) {
        console.error('❌ Error getting enabled groups:', error.message);
        return [];
    }
}

module.exports = {
    AntiLink,
    getAntiLink,
    setAntiLink,
    getAllAntiLink,
    deleteAntiLink,
    clearCache,
    getEnabledGroups
};
