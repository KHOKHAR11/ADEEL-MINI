const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

class PluginLoader {
    constructor() {
        this.commands = new Map();
        this.categories = new Map();
        this.loadErrors = [];
        this.loadAllPlugins();
    }

    loadAllPlugins() {
        const pluginsDir = __dirname;
        let totalLoaded = 0;
        let totalFailed = 0;
        
        try {
            const categories = fs.readdirSync(pluginsDir);

            categories.forEach(category => {
                try {
                    const categoryPath = path.join(pluginsDir, category);
                    
                    if (!fs.statSync(categoryPath).isDirectory()) return;
                    
                    const pluginFiles = fs.readdirSync(categoryPath)
                        .filter(file => file.endsWith('.js') && file !== 'index.js');

                    this.categories.set(category, []);

                    pluginFiles.forEach(pluginFile => {
                        try {
                            const pluginPath = path.join(categoryPath, pluginFile);
                            
                            delete require.cache[require.resolve(pluginPath)];
                            const plugin = require(pluginPath);
                            
                            if (plugin.name && plugin.execute) {
                                this.commands.set(plugin.name, {
                                    ...plugin,
                                    category: category,
                                    file: pluginFile
                                });
                                
                                this.categories.get(category).push(plugin.name);
                                
                                if (plugin.aliases && Array.isArray(plugin.aliases)) {
                                    plugin.aliases.forEach(alias => {
                                        if (alias && typeof alias === 'string') {
                                            this.commands.set(alias, {
                                                ...plugin,
                                                category: category,
                                                file: pluginFile,
                                                isAlias: true
                                            });
                                        }
                                    });
                                }
                                
                                totalLoaded++;
                                console.log(`✅ Loaded: ${category}/${plugin.name}`);
                            } else {
                                totalFailed++;
                                const errorDetails = {
                                    file: `${category}/${pluginFile}`,
                                    reason: 'Missing name or execute function',
                                    hasName: !!plugin.name,
                                    hasExecute: typeof plugin.execute === 'function'
                                };
                                this.loadErrors.push(errorDetails);
                                console.error(`❌ Invalid plugin: ${category}/${pluginFile} - Missing: ${!plugin.name ? 'name' : ''} ${typeof plugin.execute !== 'function' ? 'execute' : ''}`);
                            }
                        } catch (error) {
                            totalFailed++;
                            const errorDetails = {
                                file: `${category}/${pluginFile}`,
                                reason: error.message,
                                stack: error.stack?.split('\n')[1]?.trim() || 'No stack'
                            };
                            this.loadErrors.push(errorDetails);
                            console.error(`❌ Error loading ${category}/${pluginFile}: ${error.message}`);
                        }
                    });
                } catch (categoryError) {
                    console.error(`❌ Error processing category ${category}:`, categoryError.message);
                }
            });
            
            console.log(`\n╭━━━━━━━━━━━━━━━━━━━━━╮`);
            console.log(`┃ 🎯 Plugins Loaded: ${totalLoaded}`);
            console.log(`┃ ❌ Failed: ${totalFailed}`);
            console.log(`┃ 📁 Categories: ${Array.from(this.categories.keys()).length}`);
            console.log(`╰━━━━━━━━━━━━━━━━━━━━━╯\n`);
            
        } catch (error) {
            console.error('❌ Fatal error loading plugins:', error.message);
        }
    }

    reloadPlugin(pluginName) {
        try {
            const cmd = this.commands.get(pluginName);
            if (!cmd) return { success: false, error: 'Plugin not found' };
            
            const pluginPath = path.join(__dirname, cmd.category, cmd.file);
            delete require.cache[require.resolve(pluginPath)];
            const plugin = require(pluginPath);
            
            if (plugin.name && plugin.execute) {
                this.commands.set(plugin.name, {
                    ...plugin,
                    category: cmd.category,
                    file: cmd.file
                });
                return { success: true };
            }
            return { success: false, error: 'Invalid plugin structure after reload' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    getCommand(commandName) {
        if (!commandName || typeof commandName !== 'string') return null;
        return this.commands.get(commandName.toLowerCase());
    }

    getCommandsByCategory(category) {
        return this.categories.get(category) || [];
    }

    getAllCommands() {
        return Array.from(this.commands.entries())
            .filter(([name, cmd]) => !cmd.isAlias)
            .map(([name, cmd]) => ({
                name: cmd.name,
                category: cmd.category,
                description: cmd.description || 'No description',
                aliases: cmd.aliases || []
            }));
    }

    getCategories() {
        return Array.from(this.categories.keys());
    }

    getLoadErrors() {
        return [...this.loadErrors];
    }

    createPluginContext(socket, msg, args, from, sender, number, config, q, text, ai, m, react, reply, pushName, isAdmins, isBotAdmins, groupAdmins, groupMetadata, participants) {
        const botNumber = socket?.user?.id?.split(':')[0] || '';
        const senderNumber = sender?.split('@')[0] || '';
        const developers = `${config?.OWNER_NUMBER || ''}`;
        const isbot = botNumber && senderNumber && botNumber.includes(senderNumber);
        const isOwner = isbot ? isbot : developers.includes(senderNumber);
        const isGroup = from?.endsWith('@g.us') || false;
        const isNewsletter = from?.endsWith('@newsletter') || false;
        
        const isBotOwner = sender === socket?.user?.id || 
                          sender?.split('@')[0] === botNumber ||
                          (sender && botNumber && sender.includes(botNumber));

        return {
            socket, sock: socket, conn: socket, client: socket, msg, args, from,
            sender, number, config, q, text, ai, m, pushName,
            
            isAdmins: isAdmins || isBotOwner,
            isBotAdmins: isBotAdmins || false,
            groupAdmins: groupAdmins || [],
            groupMetadata: groupMetadata || null,
            participants: participants || [],
            isNewsletter,
            
            reply: async (message, options = {}) => {
                try {
                    if (!socket || !from) {
                        console.error('Reply error: socket or from is missing');
                        return null;
                    }
                    
                    if (typeof message === 'object' && message.image) {
                        return await socket.sendMessage(from, message, { quoted: ai, ...options });
                    }
                    return await socket.sendMessage(from, { 
                        text: String(message || ''),
                        contextInfo: {
                            mentionedJid: options.mentions || [sender].filter(Boolean),
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: config?.NEWSLETTER_JID || '1120363403380688821@newsletter',
                                newsletterName: config?.BOT_NAME || "ADEEL-MINI BOT",
                                serverMessageId: 143
                            }
                        }
                    }, { quoted: ai, ...options });
                } catch (error) {
                    console.error('Reply error:', error.message);
                    return null;
                }
            },
            
            react: async (emoji) => {
                try {
                    if (!socket || !from || !msg?.key) return null;
                    return await socket.sendMessage(from, { 
                        react: { text: emoji, key: msg.key } 
                    });
                } catch (error) {
                    console.error('React error:', error.message);
                    return null;
                }
            },
            
            sendMessage: async (content, options = {}) => {
                try {
                    if (!socket || !from) return null;
                    return await socket.sendMessage(from, content, { quoted: msg, ...options });
                } catch (error) {
                    console.error('SendMessage error:', error.message);
                    return null;
                }
            },
            
            downloadMedia: async (mediaMessage, messageType) => {
                try {
                    if (!mediaMessage) return null;
                    const stream = await downloadContentFromMessage(mediaMessage, messageType);
                    const chunks = [];
                    for await (const chunk of stream) chunks.push(chunk);
                    return Buffer.concat(chunks);
                } catch (error) {
                    console.error(`Failed to download ${messageType}:`, error.message);
                    return null;
                }
            },
            
            downloadAndSaveMediaMessage: async (message, filename, attachExtension = true) => {
                try {
                    const fsExtra = require('fs-extra');
                    let quoted = message?.msg ? message.msg : message;
                    let mime = (message?.msg || message)?.mimetype || '';
                    let messageType = message?.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
                    
                    if (!quoted || !messageType) return null;
                    
                    const stream = await downloadContentFromMessage(quoted, messageType);
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }
                    
                    let type = await require('file-type').fromBuffer(buffer);
                    const trueFileName = attachExtension ? (filename + '.' + (type ? type.ext : 'bin')) : filename;
                    await fsExtra.writeFileSync(trueFileName, buffer);
                    return trueFileName;
                } catch (error) {
                    console.error('Download and save error:', error.message);
                    return null;
                }
            },
            
            isGroup,
            isOwner: isOwner || isBotOwner,
            isBotOwner,
            isBotAdmin: isBotAdmins || false,
            userJid: sender,
            botJid: socket?.user?.id,
            
            getUserConfig: async () => {
                try {
                    const { loadUserConfig } = require('../lib/userConfigService');
                    return await loadUserConfig((number || '').replace(/[^0-9]/g, ''));
                } catch (error) {
                    console.error('getUserConfig error:', error.message);
                    return {};
                }
            },
            
            updateUserConfig: async (newConfig) => {
                try {
                    const { updateUserConfig } = require('../lib/userConfigService');
                    return await updateUserConfig((number || '').replace(/[^0-9]/g, ''), newConfig);
                } catch (error) {
                    console.error('updateUserConfig error:', error.message);
                    return null;
                }
            },
            
            delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
            getContentType: require('@whiskeysockets/baileys').getContentType,
            formatMessage: (title, content, footer) => {
                return `*${title}*\n\n${content}\n\n> *${footer}*`;
            }
        };
    }
}

module.exports = PluginLoader;
