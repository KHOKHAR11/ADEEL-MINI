const axios = require('axios');
const fs = require('fs');
const path = require('path');

const activeQueues = new Map();

module.exports = {
    name: 'autosongvoice',
    aliases: ['asvoice', 'asvn'],
    category: 'download',
    description: 'Auto send Hindi/Urdu/Pakistani songs every 10 minutes as voice notes',

    async execute(context) {
        const { reply, react, args, from, socket } = context;

        try {
            if (react) await react('🎵');

            const action = (args[0] || 'status').toLowerCase();
            const songList = [
                { title: 'Dil Diyan Gallan', query: 'dil diyan gallan' },
                { title: 'Chaleya', query: 'chaleya song' },
                { title: 'Main Phir Bhi Tumko Chahunga', query: 'main phir bhi tumko chahunga' },
                { title: 'Gerua', query: 'gerua song' },
                { title: 'Tum Hi Ho', query: 'tum hi ho' },
                { title: 'Aashiqui 2', query: 'aashiqui 2 songs' },
                { title: 'Raaz', query: 'raaz movie songs' },
                { title: 'Rang De Basanti', query: 'rang de basanti' }
            ];

            if (action === 'start' || action === 'on') {
                if (activeQueues.has(from)) {
                    return reply('🎵 *Auto Song Voice is already running!*\n\nUse `.autosongvoice stop` to disable.');
                }

                reply('🎵 *Auto Song Voice Starting!*\n\nA new Hindi/Pakistani/Urdu song will be sent every 10 minutes as voice note.\n\nUse `.autosongvoice stop` to disable.');

                const intervalFunc = setInterval(async () => {
                    try {
                        const randomSong = songList[Math.floor(Math.random() * songList.length)];
                        
                        try {
                            const response = await axios.get('https://zaynixapi12.vercel.app/api/ytmp3', {
                                params: {
                                    url: `https://youtu.be/search?q=${randomSong.query}`,
                                    apiKey: 'zaynixapi'
                                },
                                timeout: 60000
                            }).catch(() => ({ data: { success: false } }));

                            if (response.data.success && response.data.download) {
                                await socket.sendMessage(from, {
                                    audio: { url: response.data.download },
                                    mimetype: 'audio/mpeg',
                                    ptt: true
                                });
                            }
                        } catch (err) {
                            console.warn('[AUTOSONG-VOICE] Download error:', err.message);
                        }
                    } catch (error) {
                        console.error('[AUTOSONG-VOICE] Interval error:', error.message);
                    }
                }, 600000);

                activeQueues.set(from, intervalFunc);
                return;
            }

            if (action === 'stop' || action === 'off') {
                if (!activeQueues.has(from)) {
                    return reply('⚠️ *Auto Song Voice is not running!*');
                }

                clearInterval(activeQueues.get(from));
                activeQueues.delete(from);
                return reply('⏹️ *Auto Song Voice Stopped!*\n\nNo more automatic songs.');
            }

            if (action === 'list') {
                let songText = '🎵 *Available Songs:*\n\n';
                songList.forEach((song, i) => {
                    songText += `${i + 1}. ${song.title}\n`;
                });
                return reply(songText);
            }

            const status = activeQueues.has(from) ? '✅ Running' : '❌ Stopped';
            return reply(`🎵 *Auto Song Voice Status:* ${status}\n\n*Commands:*\n.autosongvoice start\n.autosongvoice stop\n.autosongvoice list`);

        } catch (error) {
            console.error('[AUTOSONG-VOICE] Error:', error.message);
            reply(`❌ *Error:* ${error.message}`);
        }
    }
};
