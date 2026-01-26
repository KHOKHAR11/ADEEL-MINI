const {
    proto,
    downloadContentFromMessage,
    getContentType,
    jidNormalizedUser,
    jidDecode
} = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

const createButtonMessage = (text, buttons = []) => {
    return {
        text: text,
        footer: "ADEEL-MINI",
        templateButtons: buttons.length > 0 ? buttons : [
            {
                index: 1,
                urlButton: {
                    displayText: "Official Website",
                    url: "https://ADEEL.biz.id"
                }
            }
        ]
    };
};

const extractJid = (jid) => {
    try {
        if (!jid) return 'Unknown';
        return String(jid).split('@')[0];
    } catch (error) {
        console.warn('Error extracting JID:', error.message);
        return 'Unknown';
    }
};

const formatJidResponse = (jid) => {
    return `👤 *JID:* ${extractJid(jid)}`;
};

const parseJid = (jid) => {
    if (!jid) return { user: null, server: null, agent: null, device: null };
    try {
        const decoded = jidDecode(jid);
        return {
            user: decoded?.user || jid.split('@')[0] || null,
            server: decoded?.server || jid.split('@')[1] || null,
            agent: decoded?.agent || null,
            device: decoded?.device || null,
            isGroup: jid.endsWith('@g.us'),
            isNewsletter: jid.endsWith('@newsletter'),
            isBroadcast: jid === 'status@broadcast',
            isUser: jid.endsWith('@s.whatsapp.net'),
            full: jid
        };
    } catch (error) {
        return {
            user: jid.split('@')[0] || null,
            server: jid.split('@')[1] || null,
            agent: null,
            device: null,
            isGroup: jid.endsWith('@g.us'),
            isNewsletter: jid.endsWith('@newsletter'),
            isBroadcast: jid === 'status@broadcast',
            isUser: jid.endsWith('@s.whatsapp.net'),
            full: jid
        };
    }
};

const normalizeJid = (jid) => {
    if (!jid) return null;
    try {
        return jidNormalizedUser(jid);
    } catch {
        return jid;
    }
};

const getJidType = (jid) => {
    if (!jid) return 'unknown';
    if (jid.endsWith('@g.us')) return 'group';
    if (jid.endsWith('@newsletter')) return 'newsletter';
    if (jid === 'status@broadcast') return 'broadcast';
    if (jid.endsWith('@s.whatsapp.net')) return 'user';
    if (jid.endsWith('@lid')) return 'lid';
    return 'unknown';
};

function safeUnlink(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.warn('Failed to cleanup file:', filePath, error.message);
    }
}

const downloadMediaMessage = async (m, filename) => {
    if (!m) {
        throw new Error('Message is required');
    }
    
    try {
        let messageType = m.type;
        let messageContent = m.msg;
        
        if (!messageType) {
            throw new Error('Message type is invalid');
        }
        
        if (messageType === 'viewOnceMessage' || messageType === 'viewOnceMessageV2') {
            if (m.msg && m.msg.type) {
                messageType = m.msg.type;
            } else if (m.message) {
                try {
                    const innerType = getContentType(m.message[messageType]?.message);
                    if (innerType) {
                        messageType = innerType;
                        messageContent = m.message[messageType]?.message?.[innerType];
                    }
                } catch (err) {
                    console.warn('Error getting content type:', err.message);
                }
            }
        }
        
        if (!messageContent) {
            throw new Error('No media content found in message');
        }
        
        const typeMap = {
            'imageMessage': { ext: 'jpg', downloadType: 'image' },
            'videoMessage': { ext: 'mp4', downloadType: 'video' },
            'audioMessage': { ext: 'mp3', downloadType: 'audio' },
            'stickerMessage': { ext: 'webp', downloadType: 'sticker' },
            'documentMessage': { ext: null, downloadType: 'document' }
        };
        
        const typeInfo = typeMap[messageType];
        if (!typeInfo) {
            throw new Error(`Unsupported message type: ${messageType}`);
        }
        
        let extension = typeInfo.ext;
        if (messageType === 'documentMessage' && messageContent.fileName) {
            const parts = messageContent.fileName.split('.');
            if (parts.length > 1) {
                extension = parts.pop().toLowerCase()
                    .replace('jpeg', 'jpg')
                    .replace('m4a', 'mp3');
            } else {
                extension = 'bin';
            }
        }
        
        const safeFilename = filename 
            ? filename.replace(/[^a-zA-Z0-9_-]/g, '_')
            : `media_${Date.now()}`;
        const fullFilename = `${safeFilename}.${extension}`;
        
        const stream = await downloadContentFromMessage(messageContent, typeInfo.downloadType);
        
        const chunks = [];
        const timeout = setTimeout(() => {
            throw new Error('Download timeout');
        }, 60000);
        
        try {
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            clearTimeout(timeout);
        } catch (streamError) {
            clearTimeout(timeout);
            throw streamError;
        }
        
        const buffer = Buffer.concat(chunks);
        
        if (buffer.length === 0) {
            throw new Error('Downloaded empty file');
        }
        
        return buffer;
    } catch (error) {
        console.error('downloadMediaMessage error:', error.message);
        throw error;
    }
};

const downloadAndSaveMedia = async (m, filename) => {
    const buffer = await downloadMediaMessage(m, filename);
    const safeFilename = filename 
        ? filename.replace(/[^a-zA-Z0-9_-]/g, '_')
        : `media_${Date.now()}`;
    
    let extension = 'bin';
    const typeMap = {
        'imageMessage': 'jpg',
        'videoMessage': 'mp4',
        'audioMessage': 'mp3',
        'stickerMessage': 'webp'
    };
    if (m.type && typeMap[m.type]) {
        extension = typeMap[m.type];
    }
    
    const fullFilename = `${safeFilename}.${extension}`;
    fs.writeFileSync(fullFilename, buffer);
    return fullFilename;
};

const sms = (conn, m) => {
    if (!m || !conn) {
        console.warn('sms: Invalid parameters');
        return m || {};
    }
    
    try {
        if (m.key) {
            m.id = m.key.id;
            m.chat = m.key.remoteJid;
            m.fromMe = m.key.fromMe;
            m.isGroup = m.chat ? m.chat.endsWith('@g.us') : false;
            m.isNewsletter = m.chat ? m.chat.endsWith('@newsletter') : false;
            m.isBroadcast = m.chat === 'status@broadcast';
            m.isStatus = m.isBroadcast;
            
            try {
                if (m.fromMe) {
                    const userId = conn.user?.id || '';
                    m.sender = userId.split(':')[0] + '@s.whatsapp.net';
                } else if (m.isGroup) {
                    m.sender = m.key.participant || m.key.remoteJid;
                } else {
                    m.sender = m.key.remoteJid;
                }
            } catch (senderError) {
                console.warn('Error parsing sender:', senderError.message);
                m.sender = m.key.remoteJid || 'unknown@s.whatsapp.net';
            }
            
            m.pushName = m.key.pushName || 
                         m.pushName ||
                         m.message?.pushName || 
                         conn.user?.name || 
                         m.sender?.split('@')[0] || 
                         "User";
            
            m.senderName = m.pushName;
            m.senderNumber = m.sender?.split('@')[0] || '';
        }
        
        if (m.message) {
            try {
                m.type = getContentType(m.message);
                
                if (!m.type) {
                    return m;
                }
                
                if (m.type === 'viewOnceMessage' || m.type === 'viewOnceMessageV2') {
                    m.isViewOnce = true;
                    const innerMessage = m.message[m.type]?.message;
                    if (innerMessage) {
                        const innerType = getContentType(innerMessage);
                        m.msg = innerMessage[innerType];
                        if (m.msg) {
                            m.msg.type = innerType;
                        }
                    }
                } else if (m.type === 'ephemeralMessage') {
                    const ephemeralContent = m.message.ephemeralMessage?.message;
                    if (ephemeralContent) {
                        m.type = getContentType(ephemeralContent);
                        m.msg = ephemeralContent[m.type];
                    }
                } else {
                    m.msg = m.message[m.type];
                }
                
                if (!m.pushName && m.msg?.contextInfo?.pushName) {
                    m.pushName = m.msg.contextInfo.pushName;
                    m.senderName = m.pushName;
                }
                
                if (m.msg) {
                    try {
                        const contextInfo = m.msg.contextInfo;
                        const quotedMention = contextInfo?.participant || '';
                        const tagMention = contextInfo?.mentionedJid || [];
                        const mention = Array.isArray(tagMention) ? tagMention : [tagMention];
                        if (quotedMention) mention.push(quotedMention);
                        m.mentionUser = mention.filter(Boolean);
                        m.mentions = m.mentionUser;
                    } catch (mentionError) {
                        m.mentionUser = [];
                        m.mentions = [];
                    }
                    
                    try {
                        m.body = parseMessageBody(m);
                        m.text = m.body;
                    } catch (bodyError) {
                        m.body = '';
                        m.text = '';
                    }
                    
                    if (m.msg.contextInfo?.quotedMessage) {
                        try {
                            m.quoted = parseQuotedMessage(conn, m);
                        } catch (quotedError) {
                            console.warn('Error parsing quoted message:', quotedError.message);
                            m.quoted = null;
                        }
                    } else {
                        m.quoted = null;
                    }
                }
                
                m.download = (filename) => downloadMediaMessage(m, filename);
                
            } catch (messageError) {
                console.warn('Error parsing message content:', messageError.message);
            }
        }
        
        if (!m.pushName) {
            m.pushName = m.sender?.split('@')[0] || "User";
            m.senderName = m.pushName;
        }
        
        addHelperMethods(conn, m);
        
    } catch (error) {
        console.error('sms parser error:', error.message);
    }
    
    return m;
};

function parseMessageBody(m) {
    const type = m.type;
    const msg = m.msg;
    const message = m.message;
    
    if (type === 'conversation') return msg || '';
    if (type === 'extendedTextMessage') return msg?.text || '';
    if (type === 'imageMessage') return msg?.caption || '';
    if (type === 'videoMessage') return msg?.caption || '';
    if (type === 'documentMessage') return msg?.caption || '';
    if (type === 'templateButtonReplyMessage') return msg?.selectedId || '';
    if (type === 'buttonsResponseMessage') return msg?.selectedButtonId || '';
    if (type === 'listResponseMessage') return msg?.singleSelectReply?.selectedRowId || '';
    if (type === 'interactiveResponseMessage') {
        try {
            const params = msg?.nativeFlowResponseMessage?.paramsJson;
            if (params) return JSON.parse(params)?.id || '';
        } catch {}
    }
    if (type === 'messageContextInfo') {
        return msg?.selectedButtonId || 
               msg?.singleSelectReply?.selectedRowId || 
               m.text || '';
    }
    
    return '';
}

function parseQuotedMessage(conn, m) {
    const contextInfo = m.msg.contextInfo;
    const quotedMessage = contextInfo.quotedMessage;
    
    if (!quotedMessage) return null;
    
    const quoted = { ...quotedMessage };
    quoted.type = getContentType(quotedMessage);
    quoted.id = contextInfo.stanzaId;
    quoted.sender = contextInfo.participant;
    quoted.fromMe = quoted.sender?.split('@')[0]?.includes(conn.user?.id?.split(':')[0]);
    quoted.chat = m.chat;
    
    if (quoted.type === 'viewOnceMessage' || quoted.type === 'viewOnceMessageV2') {
        const innerMsg = quotedMessage[quoted.type]?.message;
        if (innerMsg) {
            const innerType = getContentType(innerMsg);
            quoted.msg = innerMsg[innerType];
            if (quoted.msg) quoted.msg.type = innerType;
        }
    } else {
        quoted.msg = quotedMessage[quoted.type];
    }
    
    quoted.pushName = contextInfo?.pushName || 
                     quoted.sender?.split('@')[0] || 
                     "User";
    quoted.senderName = quoted.pushName;
    
    try {
        const quotedContext = quoted.msg?.contextInfo;
        const quotedMention = quotedContext?.participant || '';
        const quotedTagMention = quotedContext?.mentionedJid || [];
        const mentions = Array.isArray(quotedTagMention) ? quotedTagMention : [quotedTagMention];
        if (quotedMention) mentions.push(quotedMention);
        quoted.mentionUser = mentions.filter(Boolean);
    } catch {
        quoted.mentionUser = [];
    }
    
    try {
        quoted.body = '';
        if (quoted.type === 'conversation') quoted.body = quoted.msg || '';
        else if (quoted.type === 'extendedTextMessage') quoted.body = quoted.msg?.text || '';
        else if (quoted.type === 'imageMessage') quoted.body = quoted.msg?.caption || '';
        else if (quoted.type === 'videoMessage') quoted.body = quoted.msg?.caption || '';
        quoted.text = quoted.body;
    } catch {
        quoted.body = '';
        quoted.text = '';
    }
    
    quoted.fakeObj = proto.WebMessageInfo.fromObject({
        key: {
            remoteJid: m.chat,
            fromMe: quoted.fromMe,
            id: quoted.id,
            participant: quoted.sender
        },
        message: quotedMessage
    });
    
    quoted.download = (filename) => downloadMediaMessage(quoted, filename);
    quoted.delete = () => conn.sendMessage(m.chat, { delete: quoted.fakeObj.key });
    quoted.react = (emoji) => conn.sendMessage(m.chat, {
        react: { text: emoji, key: quoted.fakeObj.key }
    });
    
    return quoted;
}

function addHelperMethods(conn, m) {
    m.reply = (text, id = m.chat, options = { mentions: [m.sender] }) => {
        if (!text) return Promise.resolve();
        return conn.sendMessage(id, {
            text: String(text),
            contextInfo: { mentionedJid: options.mentions || [] }
        }, { quoted: m }).catch(err => {
            console.error('Reply error:', err.message);
        });
    };
    
    m.replyWithButtons = (text, buttons, id = m.chat) => {
        if (!text) return Promise.resolve();
        return conn.sendMessage(id, {
            text: String(text),
            footer: '© ADEEL-MINI',
            buttons: buttons,
            headerType: 1
        }, { quoted: m }).catch(err => {
            console.error('ReplyWithButtons error:', err.message);
            return m.reply(text);
        });
    };
    
    m.replyS = (sticker, id = m.chat, options = { mentions: [m.sender] }) => {
        if (!sticker) return Promise.resolve();
        return conn.sendMessage(id, {
            sticker,
            contextInfo: { mentionedJid: options.mentions || [] }
        }, { quoted: m }).catch(err => {
            console.error('ReplyS error:', err.message);
        });
    };
    
    m.replyImg = (img, caption, id = m.chat, options = { mentions: [m.sender] }) => {
        if (!img) return Promise.resolve();
        return conn.sendMessage(id, {
            image: img,
            caption: caption || '',
            contextInfo: { mentionedJid: options.mentions || [] }
        }, { quoted: m }).catch(err => {
            console.error('ReplyImg error:', err.message);
        });
    };
    
    m.replyVid = (vid, caption, id = m.chat, options = { mentions: [m.sender], gif: false }) => {
        if (!vid) return Promise.resolve();
        return conn.sendMessage(id, {
            video: vid,
            caption: caption || '',
            gifPlayback: options.gif || false,
            contextInfo: { mentionedJid: options.mentions || [] }
        }, { quoted: m }).catch(err => {
            console.error('ReplyVid error:', err.message);
        });
    };
    
    m.replyAud = (aud, id = m.chat, options = { mentions: [m.sender], ptt: false }) => {
        if (!aud) return Promise.resolve();
        return conn.sendMessage(id, {
            audio: aud,
            ptt: options.ptt || false,
            mimetype: 'audio/mpeg',
            contextInfo: { mentionedJid: options.mentions || [] }
        }, { quoted: m }).catch(err => {
            console.error('ReplyAud error:', err.message);
        });
    };
    
    m.replyDoc = (doc, id = m.chat, options = { 
        mentions: [m.sender],
        filename: 'document.pdf',
        mimetype: 'application/pdf'
    }) => {
        if (!doc) return Promise.resolve();
        return conn.sendMessage(id, {
            document: doc,
            mimetype: options.mimetype || 'application/pdf',
            fileName: options.filename || 'document.pdf',
            contextInfo: { mentionedJid: options.mentions || [] }
        }, { quoted: m }).catch(err => {
            console.error('ReplyDoc error:', err.message);
        });
    };
    
    m.replyContact = (name, info, number) => {
        if (!name || !number) return Promise.resolve();
        const vcard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${name}`,
            `ORG:${info || ''};`,
            `TEL;type=CELL;type=VOICE;waid=${number}:+${number}`,
            'END:VCARD'
        ].join('\n');
        
        return conn.sendMessage(m.chat, {
            contacts: {
                displayName: name,
                contacts: [{ vcard }]
            }
        }, { quoted: m }).catch(err => {
            console.error('ReplyContact error:', err.message);
        });
    };
    
    m.react = (emoji) => {
        if (!emoji) return Promise.resolve();
        return conn.sendMessage(m.chat, {
            react: { text: emoji, key: m.key }
        }).catch(err => {
            console.error('React error:', err.message);
        });
    };
    
    m.forward = (jid, forceForward = false) => {
        return conn.sendMessage(jid, {
            forward: m,
            force: forceForward
        }).catch(err => {
            console.error('Forward error:', err.message);
        });
    };
    
    m.delete = () => {
        return conn.sendMessage(m.chat, {
            delete: m.key
        }).catch(err => {
            console.error('Delete error:', err.message);
        });
    };
    
    m.copyNForward = (jid, forceForward = false, options = {}) => {
        return conn.copyNForward(jid, m, forceForward, options).catch(err => {
            console.error('CopyNForward error:', err.message);
        });
    };
}

const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    result += `${secs}s`;
    
    return result.trim();
};

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const isUrl = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return urlRegex.test(text);
};

const extractUrls = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
};

module.exports = {
    sms,
    downloadMediaMessage,
    downloadAndSaveMedia,
    safeUnlink,
    parseJid,
    normalizeJid,
    getJidType,
    jidNormalizedUser,
    jidDecode,
    formatUptime,
    formatBytes,
    delay,
    getRandomElement,
    isUrl,
    extractUrls
};
