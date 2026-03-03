const config = require('../config');

const messageQueue = new Map();
const rateLimitTracker = new Map();
const sessionHealth = new Map();

const RATE_LIMIT_DELAY = config.SESSION_SAFETY?.RATE_LIMIT_DELAY || 1500;
const MAX_MESSAGES_PER_MINUTE = config.SESSION_SAFETY?.MAX_MESSAGES_PER_MINUTE || 20;
const ANTI_SPAM_DELAY = config.SESSION_SAFETY?.ANTI_SPAM_DELAY || 2000;

async function safeDelay(ms = RATE_LIMIT_DELAY) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function checkRateLimit(sessionId) {
    const now = Date.now();
    const tracker = rateLimitTracker.get(sessionId) || { count: 0, resetTime: now + 60000 };
    
    if (now > tracker.resetTime) {
        tracker.count = 0;
        tracker.resetTime = now + 60000;
    }
    
    tracker.count++;
    rateLimitTracker.set(sessionId, tracker);
    
    return tracker.count <= MAX_MESSAGES_PER_MINUTE;
}

function getRateLimitStatus(sessionId) {
    const tracker = rateLimitTracker.get(sessionId);
    if (!tracker) return { remaining: MAX_MESSAGES_PER_MINUTE, resetIn: 60000 };
    
    return {
        remaining: Math.max(0, MAX_MESSAGES_PER_MINUTE - tracker.count),
        resetIn: Math.max(0, tracker.resetTime - Date.now())
    };
}

async function safeSendMessage(socket, jid, content, options = {}) {
    if (!socket || typeof socket.sendMessage !== 'function') {
        console.error('safeSendMessage: Invalid socket provided');
        return null;
    }
    
    if (!jid) {
        console.error('safeSendMessage: No JID provided');
        return null;
    }
    
    const sessionId = socket?.user?.id || 'default';
    
    try {
        if (!checkRateLimit(sessionId)) {
            const status = getRateLimitStatus(sessionId);
            console.log(`⚠️ Rate limit reached for ${sessionId}. Waiting ${status.resetIn}ms`);
            await safeDelay(Math.min(status.resetIn, 5000));
        }
        
        await safeDelay(ANTI_SPAM_DELAY);
        
        const result = await socket.sendMessage(jid, content, options);
        
        updateSessionHealth(sessionId, true);
        
        return result;
    } catch (error) {
        console.error(`safeSendMessage error for ${sessionId}:`, error.message);
        updateSessionHealth(sessionId, false, error.message);
        throw error;
    }
}

function updateSessionHealth(sessionId, success, errorMessage = null) {
    const health = sessionHealth.get(sessionId) || {
        successCount: 0,
        failCount: 0,
        lastSuccess: null,
        lastError: null,
        lastErrorMessage: null
    };
    
    if (success) {
        health.successCount++;
        health.lastSuccess = Date.now();
    } else {
        health.failCount++;
        health.lastError = Date.now();
        health.lastErrorMessage = errorMessage;
    }
    
    sessionHealth.set(sessionId, health);
}

function getSessionHealth(sessionId) {
    return sessionHealth.get(sessionId) || {
        successCount: 0,
        failCount: 0,
        lastSuccess: null,
        lastError: null,
        lastErrorMessage: null
    };
}

function isSessionHealthy(sessionId) {
    const health = getSessionHealth(sessionId);
    
    if (health.failCount === 0) return true;
    
    const failRate = health.failCount / (health.successCount + health.failCount);
    return failRate < 0.3;
}

function clearSessionData(sessionId) {
    messageQueue.delete(sessionId);
    rateLimitTracker.delete(sessionId);
    sessionHealth.delete(sessionId);
}

function addToQueue(sessionId, messageData) {
    const queue = messageQueue.get(sessionId) || [];
    queue.push({
        ...messageData,
        timestamp: Date.now()
    });
    messageQueue.set(sessionId, queue);
}

async function processQueue(socket, sessionId) {
    const queue = messageQueue.get(sessionId);
    if (!queue || queue.length === 0) return;
    
    const batch = queue.splice(0, 5);
    
    for (const msg of batch) {
        try {
            await safeSendMessage(socket, msg.jid, msg.content, msg.options);
        } catch (error) {
            console.error('Queue message failed:', error.message);
        }
    }
    
    messageQueue.set(sessionId, queue);
}

function getAntiSpamRecommendations(sessionId) {
    const health = getSessionHealth(sessionId);
    const recommendations = [];
    
    if (health.failCount > 10) {
        recommendations.push('Consider reducing message frequency');
    }
    
    const status = getRateLimitStatus(sessionId);
    if (status.remaining < 5) {
        recommendations.push('Rate limit almost reached - slow down');
    }
    
    if (!isSessionHealthy(sessionId)) {
        recommendations.push('Session health is poor - check for connection issues');
    }
    
    return recommendations;
}

module.exports = {
    safeDelay,
    checkRateLimit,
    getRateLimitStatus,
    safeSendMessage,
    updateSessionHealth,
    getSessionHealth,
    isSessionHealthy,
    clearSessionData,
    addToQueue,
    processQueue,
    getAntiSpamRecommendations,
    RATE_LIMIT_DELAY,
    MAX_MESSAGES_PER_MINUTE,
    ANTI_SPAM_DELAY
};
