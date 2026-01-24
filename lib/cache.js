const { EventEmitter } = require('events');

class Cache extends EventEmitter {
    constructor(options = {}) {
        super();
        this.store = new Map();
        this.defaultTTL = options.defaultTTL || null;
        this.namespace = options.namespace || 'default';
        this.maxSize = options.maxSize || 10000;
        
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0,
            errors: 0
        };
        
        // Setup error handling for EventEmitter
        this.on('error', (err) => {
            console.error(`Cache Error [${this.namespace}]:`, err.message || err);
        });
        
        if (options.cleanupInterval) {
            this._startCleanup(options.cleanupInterval);
        }
    }

    _isExpired(entry) {
        if (!entry) return true;
        try {
            return entry.expiresAt !== null && Date.now() > entry.expiresAt;
        } catch (error) {
            this.stats.errors++;
            return true;
        }
    }

    _getEntry(key) {
        try {
            if (!key) {
                this.stats.misses++;
                return undefined;
            }
            
            const entry = this.store.get(key);
            if (!entry) {
                this.stats.misses++;
                return undefined;
            }
            if (this._isExpired(entry)) {
                this.store.delete(key);
                this.stats.evictions++;
                this.emit('evict', { key, reason: 'expired', namespace: this.namespace });
                return undefined;
            }
            this.stats.hits++;
            return entry;
        } catch (error) {
            this.stats.errors++;
            this.emit('error', { key, error, namespace: this.namespace });
            return undefined;
        }
    }

    _enforceMaxSize() {
        try {
            if (this.store.size >= this.maxSize) {
                // Remove oldest entry (first in Map)
                const oldestKey = this.store.keys().next().value;
                if (oldestKey !== undefined) {
                    this.store.delete(oldestKey);
                    this.stats.evictions++;
                    this.emit('evict', { key: oldestKey, reason: 'maxSize', namespace: this.namespace });
                }
            }
        } catch (error) {
            this.stats.errors++;
        }
    }

    set(key, value, ttlMs = undefined) {
        if (key === undefined || key === null) {
            return value;
        }
        
        try {
            this._enforceMaxSize();
            const ttl = ttlMs !== undefined ? ttlMs : this.defaultTTL;
            const expiresAt = ttl ? Date.now() + ttl : null;
            this.store.set(key, { 
                value, 
                expiresAt, 
                createdAt: Date.now() 
            });
            this.stats.sets++;
            this.emit('set', { key, namespace: this.namespace });
            return value;
        } catch (error) {
            this.stats.errors++;
            this.emit('error', { key, error, namespace: this.namespace });
            return value;
        }
    }

    get(key) {
        if (key === undefined || key === null) {
            return undefined;
        }
        
        try {
            const entry = this._getEntry(key);
            return entry ? entry.value : undefined;
        } catch (error) {
            this.stats.errors++;
            return undefined;
        }
    }

    has(key) {
        if (key === undefined || key === null) {
            return false;
        }
        
        try {
            return !!this._getEntry(key);
        } catch (error) {
            this.stats.errors++;
            return false;
        }
    }

    delete(key) {
        if (key === undefined || key === null) {
            return false;
        }
        
        try {
            const result = this.store.delete(key);
            if (result) {
                this.stats.deletes++;
                this.emit('delete', { key, namespace: this.namespace });
            }
            return result;
        } catch (error) {
            this.stats.errors++;
            this.emit('error', { key, error, namespace: this.namespace });
            return false;
        }
    }

    clear() {
        try {
            const size = this.store.size;
            this.store.clear();
            this.emit('clear', { clearedCount: size, namespace: this.namespace });
        } catch (error) {
            this.stats.errors++;
            this.emit('error', { error, namespace: this.namespace });
        }
    }

    size() {
        try {
            // Clean expired entries while counting
            for (const [k, v] of this.store) {
                if (this._isExpired(v)) {
                    this.store.delete(k);
                    this.stats.evictions++;
                }
            }
            return this.store.size;
        } catch (error) {
            this.stats.errors++;
            return 0;
        }
    }

    keys() {
        const ks = [];
        try {
            for (const [k, v] of this.store) {
                if (!this._isExpired(v)) {
                    ks.push(k);
                } else {
                    this.store.delete(k);
                    this.stats.evictions++;
                }
            }
        } catch (error) {
            this.stats.errors++;
        }
        return ks;
    }

    values() {
        const vals = [];
        try {
            for (const [k, v] of this.store) {
                if (!this._isExpired(v)) {
                    vals.push(v.value);
                } else {
                    this.store.delete(k);
                    this.stats.evictions++;
                }
            }
        } catch (error) {
            this.stats.errors++;
        }
        return vals;
    }

    entries() {
        const entries = [];
        try {
            for (const [k, v] of this.store) {
                if (!this._isExpired(v)) {
                    entries.push([k, v.value]);
                } else {
                    this.store.delete(k);
                    this.stats.evictions++;
                }
            }
        } catch (error) {
            this.stats.errors++;
        }
        return entries;
    }

    async getOrSet(key, factoryFn, ttlMs = undefined) {
        if (key === undefined || key === null) {
            throw new Error('Cache key is required');
        }
        
        if (typeof factoryFn !== 'function') {
            throw new Error('Factory function is required');
        }
        
        try {
            const existing = this.get(key);
            if (existing !== undefined) return existing;
            
            const result = await Promise.resolve(factoryFn()).catch(error => {
                this.stats.errors++;
                this.emit('error', { key, error, operation: 'getOrSet', namespace: this.namespace });
                throw error;
            });
            
            this.set(key, result, ttlMs);
            return result;
        } catch (error) {
            this.stats.errors++;
            throw error;
        }
    }

    getStats() {
        try {
            const hitRate = this.stats.hits + this.stats.misses > 0 
                ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
                : 0;
                
            return {
                ...this.stats,
                hitRate: `${hitRate}%`,
                currentSize: this.store.size,
                maxSize: this.maxSize,
                namespace: this.namespace
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    resetStats() {
        try {
            this.stats = {
                hits: 0,
                misses: 0,
                sets: 0,
                deletes: 0,
                evictions: 0,
                errors: 0
            };
            this.emit('statsReset', { namespace: this.namespace });
        } catch (error) {
            console.error('Error resetting cache stats:', error.message);
        }
    }

    _startCleanup(intervalMs) {
        if (this._cleanupInterval) {
            clearInterval(this._cleanupInterval);
        }
        
        this._cleanupInterval = setInterval(() => {
            try {
                let cleaned = 0;
                for (const [k, v] of this.store) {
                    if (this._isExpired(v)) {
                        this.store.delete(k);
                        this.stats.evictions++;
                        cleaned++;
                    }
                }
                if (cleaned > 0) {
                    this.emit('cleanup', { cleaned, namespace: this.namespace });
                }
            } catch (error) {
                this.stats.errors++;
                this.emit('error', { error, operation: 'cleanup', namespace: this.namespace });
            }
        }, intervalMs);
        
        // Allow process to exit
        if (this._cleanupInterval.unref) {
            this._cleanupInterval.unref();
        }
    }

    stopCleanup() {
        if (this._cleanupInterval) {
            clearInterval(this._cleanupInterval);
            this._cleanupInterval = null;
        }
    }

    touch(key, ttlMs = undefined) {
        if (key === undefined || key === null) {
            return false;
        }
        
        try {
            const entry = this.store.get(key);
            if (entry && !this._isExpired(entry)) {
                const ttl = ttlMs !== undefined ? ttlMs : this.defaultTTL;
                entry.expiresAt = ttl ? Date.now() + ttl : null;
                return true;
            }
            return false;
        } catch (error) {
            this.stats.errors++;
            return false;
        }
    }

    getTTL(key) {
        if (key === undefined || key === null) {
            return null;
        }
        
        try {
            const entry = this.store.get(key);
            if (!entry || this._isExpired(entry)) return null;
            if (entry.expiresAt === null) return Infinity;
            return Math.max(0, entry.expiresAt - Date.now());
        } catch (error) {
            this.stats.errors++;
            return null;
        }
    }

    mget(keys) {
        if (!Array.isArray(keys)) {
            return {};
        }
        
        const result = {};
        for (const key of keys) {
            if (key !== undefined && key !== null) {
                result[key] = this.get(key);
            }
        }
        return result;
    }

    mset(entries, ttlMs = undefined) {
        if (!entries || typeof entries !== 'object') {
            return;
        }
        
        for (const [key, value] of Object.entries(entries)) {
            if (key !== undefined && key !== null) {
                this.set(key, value, ttlMs);
            }
        }
    }

    // Destroy cache and cleanup
    destroy() {
        try {
            this.stopCleanup();
            this.clear();
            this.removeAllListeners();
            console.log(`Cache [${this.namespace}] destroyed`);
        } catch (error) {
            console.error('Error destroying cache:', error.message);
        }
    }
}

// Create cache instances with error handling
const userConfigCache = new Cache({ 
    defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
    namespace: 'userConfig',
    maxSize: 5000,
    cleanupInterval: 5 * 60 * 1000 // 5 minutes
});

const sessionCache = new Cache({ 
    defaultTTL: 30 * 60 * 1000, // 30 minutes
    namespace: 'session',
    maxSize: 1000,
    cleanupInterval: 60 * 1000 // 1 minute
});

const messageCache = new Cache({ 
    defaultTTL: 10 * 60 * 1000, // 10 minutes (was unlimited, now has TTL)
    namespace: 'message',
    maxSize: 50000,
    cleanupInterval: 2 * 60 * 1000 // 2 minutes
});

const commandCache = new Cache({
    defaultTTL: 60 * 1000, // 1 minute
    namespace: 'command',
    maxSize: 1000,
    cleanupInterval: 30 * 1000 // 30 seconds
});

// Add process cleanup
process.on('beforeExit', () => {
    try {
        userConfigCache.destroy();
        sessionCache.destroy();
        messageCache.destroy();
        commandCache.destroy();
    } catch (error) {
        console.error('Error cleaning up caches:', error.message);
    }
});

module.exports = {
    Cache,
    userConfigCache,
    sessionCache,
    messageCache,
    commandCache
};
