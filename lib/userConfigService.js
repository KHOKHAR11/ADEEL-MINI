const mongoose = require('mongoose');
const config = require('../config');
const { userConfigCache, sessionCache } = require('./cache');

// Define session schema with improved validation
const sessionSchema = new mongoose.Schema({
    number: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        match: /^\d+$/,
        index: true
    },
    creds: { 
        type: mongoose.Schema.Types.Mixed, 
        required: true 
    },
    keys: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    config: { 
        type: mongoose.Schema.Types.Mixed, 
        default: {} 
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastActive: { 
        type: Date, 
        default: Date.now 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    },
    connectionCount: {
        type: Number,
        default: 0
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
});

// Add indexes for better performance
sessionSchema.index({ lastActive: -1 });
sessionSchema.index({ isActive: 1 });

// Pre-save hook
sessionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method for safe number sanitization
sessionSchema.statics.sanitizeNumber = function(number) {
    if (!number) return null;
    return String(number).replace(/[^0-9]/g, '');
};

let Session;
try {
    Session = mongoose.model('Session');
} catch {
    Session = mongoose.model('Session', sessionSchema);
}

// Check if MongoDB is connected
function isMongoConnected() {
    return mongoose.connection.readyState === 1;
}

// Load user config with caching
async function loadUserConfig(number) {
    if (!number) {
        console.warn('loadUserConfig: Number is required');
        return getDefaultConfig();
    }
    
    const sanitizedNumber = Session.sanitizeNumber(number);
    if (!sanitizedNumber) {
        console.warn('loadUserConfig: Invalid number format');
        return getDefaultConfig();
    }
    
    const cacheKey = `config_${sanitizedNumber}`;
    
    // Check cache first
    try {
        const cached = userConfigCache.get(cacheKey);
        if (cached) {
            return cached;
        }
    } catch (error) {
        console.warn('Cache get error:', error.message);
    }
    
    // Check MongoDB connection
    if (!isMongoConnected()) {
        console.warn('loadUserConfig: MongoDB not connected, using default config');
        return getDefaultConfig();
    }
    
    try {
        const session = await Session.findOne({ number: sanitizedNumber }).lean();
        
        if (session && session.config && Object.keys(session.config).length > 0) {
            // Merge with default config to ensure all keys exist
            const mergedConfig = { ...getDefaultConfig(), ...session.config };
            userConfigCache.set(cacheKey, mergedConfig, 120000);
            return mergedConfig;
        }
        
        return getDefaultConfig();
    } catch (error) {
        console.error(`❌ Error loading config for ${sanitizedNumber}:`, error.message);
        return getDefaultConfig();
    }
}

// Update user config
async function updateUserConfig(number, newConfig) {
    if (!number) {
        throw new Error('Number is required');
    }
    
    if (!newConfig || typeof newConfig !== 'object') {
        throw new Error('Config must be an object');
    }
    
    const sanitizedNumber = Session.sanitizeNumber(number);
    if (!sanitizedNumber) {
        throw new Error('Invalid number format');
    }
    
    if (!isMongoConnected()) {
        throw new Error('MongoDB not connected');
    }
    
    const cacheKey = `config_${sanitizedNumber}`;
    
    try {
        const result = await Session.findOneAndUpdate(
            { number: sanitizedNumber },
            { 
                config: newConfig, 
                updatedAt: new Date(),
                lastActive: new Date()
            },
            { 
                upsert: true,
                new: true,
                runValidators: true
            }
        );
        
        // Update cache
        const mergedConfig = { ...getDefaultConfig(), ...newConfig };
        userConfigCache.set(cacheKey, mergedConfig, 120000);
        
        console.log(`✅ Config updated for ${sanitizedNumber}`);
        return true;
    } catch (error) {
        console.error('❌ Config update error:', error.message);
        throw error;
    }
}

// Delete user config and clear cache
async function deleteUserConfig(number) {
    if (!number) {
        throw new Error('Number is required');
    }
    
    const sanitizedNumber = Session.sanitizeNumber(number);
    if (!sanitizedNumber) {
        throw new Error('Invalid number format');
    }
    
    try {
        // Clear caches
        sessionCache.delete(`session_${sanitizedNumber}`);
        userConfigCache.delete(`config_${sanitizedNumber}`);
        
        if (isMongoConnected()) {
            await Session.findOneAndUpdate(
                { number: sanitizedNumber },
                { config: {}, updatedAt: new Date() }
            );
        }
        
        console.log(`✅ Config cleared for ${sanitizedNumber}`);
        return true;
    } catch (error) {
        console.error('❌ Config delete error:', error.message);
        throw error;
    }
}

// Get default config (deep clone)
function getDefaultConfig() {
    return JSON.parse(JSON.stringify(config));
}

// Save session to MongoDB
async function saveSession(number, creds, keys = {}) {
    if (!number || !creds) {
        throw new Error('Number and creds are required');
    }
    
    const sanitizedNumber = Session.sanitizeNumber(number);
    if (!sanitizedNumber) {
        throw new Error('Invalid number format');
    }
    
    if (!isMongoConnected()) {
        throw new Error('MongoDB not connected');
    }
    
    try {
        const result = await Session.findOneAndUpdate(
            { number: sanitizedNumber },
            { 
                creds,
                keys,
                updatedAt: new Date(),
                lastActive: new Date(),
                isActive: true,
                $inc: { connectionCount: 1 }
            },
            { 
                upsert: true,
                new: true,
                runValidators: true
            }
        );
        
        // Update session cache
        sessionCache.set(`session_${sanitizedNumber}`, { creds, keys }, 30 * 60 * 1000);
        
        console.log(`✅ Session saved for ${sanitizedNumber}`);
        return result;
    } catch (error) {
        console.error('❌ Session save error:', error.message);
        throw error;
    }
}

// Load session from MongoDB
async function loadSession(number) {
    if (!number) {
        return null;
    }
    
    const sanitizedNumber = Session.sanitizeNumber(number);
    if (!sanitizedNumber) {
        return null;
    }
    
    // Check cache first
    const cacheKey = `session_${sanitizedNumber}`;
    const cached = sessionCache.get(cacheKey);
    if (cached) {
        return cached;
    }
    
    if (!isMongoConnected()) {
        console.warn('loadSession: MongoDB not connected');
        return null;
    }
    
    try {
        const session = await Session.findOne({ number: sanitizedNumber }).lean();
        
        if (session && session.creds) {
            const sessionData = { 
                creds: session.creds, 
                keys: session.keys || {} 
            };
            sessionCache.set(cacheKey, sessionData, 30 * 60 * 1000);
            return sessionData;
        }
        
        return null;
    } catch (error) {
        console.error('❌ Session load error:', error.message);
        return null;
    }
}

// Delete session
async function deleteSession(number) {
    if (!number) {
        throw new Error('Number is required');
    }
    
    const sanitizedNumber = Session.sanitizeNumber(number);
    if (!sanitizedNumber) {
        throw new Error('Invalid number format');
    }
    
    try {
        // Clear caches
        sessionCache.delete(`session_${sanitizedNumber}`);
        userConfigCache.delete(`config_${sanitizedNumber}`);
        
        if (isMongoConnected()) {
            await Session.deleteOne({ number: sanitizedNumber });
        }
        
        console.log(`✅ Session deleted for ${sanitizedNumber}`);
        return true;
    } catch (error) {
        console.error('❌ Session delete error:', error.message);
        throw error;
    }
}

// Get all active sessions
async function getActiveSessions() {
    if (!isMongoConnected()) {
        return [];
    }
    
    try {
        const sessions = await Session.find({ isActive: true })
            .select('number lastActive connectionCount')
            .lean();
        return sessions;
    } catch (error) {
        console.error('❌ Error getting active sessions:', error.message);
        return [];
    }
}

// Clean up old/banned sessions (older than 30 days)
async function cleanupOldSessions(daysOld = 30) {
    if (!isMongoConnected()) {
        console.warn('MongoDB not connected, skipping cleanup');
        return false;
    }
    
    try {
        const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
        
        const result = await Session.deleteMany({
            lastActive: { $lt: cutoffDate }
        });
        
        if (result.deletedCount > 0) {
            console.log(`✅ Cleaned up ${result.deletedCount} old session(s) (older than ${daysOld} days)`);
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error cleaning up old sessions:', error.message);
        return false;
    }
}

// Mark multiple sessions as inactive (batch operation)
async function markSessionsInactive(numbers) {
    if (!Array.isArray(numbers) || numbers.length === 0) return false;
    if (!isMongoConnected()) return false;
    
    try {
        const sanitizedNumbers = numbers.map(n => Session.sanitizeNumber(n)).filter(Boolean);
        if (sanitizedNumbers.length === 0) return false;
        
        const result = await Session.updateMany(
            { number: { $in: sanitizedNumbers } },
            { isActive: false, updatedAt: new Date() }
        );
        
        sanitizedNumbers.forEach(num => {
            sessionCache.delete(`session_${num}`);
        });
        
        console.log(`✅ Marked ${result.modifiedCount} session(s) as inactive`);
        return true;
    } catch (error) {
        console.error('❌ Error marking sessions inactive:', error.message);
        return false;
    }
}

// Mark session as inactive
async function markSessionInactive(number) {
    if (!number) return false;
    
    const sanitizedNumber = Session.sanitizeNumber(number);
    if (!sanitizedNumber || !isMongoConnected()) return false;
    
    try {
        await Session.findOneAndUpdate(
            { number: sanitizedNumber },
            { isActive: false, updatedAt: new Date() }
        );
        sessionCache.delete(`session_${sanitizedNumber}`);
        return true;
    } catch (error) {
        console.error('❌ Error marking session inactive:', error.message);
        return false;
    }
}

module.exports = {
    loadUserConfig,
    updateUserConfig,
    deleteUserConfig,
    getDefaultConfig,
    saveSession,
    loadSession,
    deleteSession,
    getActiveSessions,
    markSessionInactive,
    cleanupOldSessions,
    markSessionsInactive,
    isMongoConnected,
    Session
};
