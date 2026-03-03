const axios = require('axios');

const songQueues = new Map();

module.exports = {
    name: 'autosong',
    aliases: ['as', 'automusic'],
    category: 'download',
    description: 'Auto song request every 10 minutes (Hindi/Urdu/Pakistani)',

    async execute(context) {
        const { reply, react, args, from, socket } = context;

        try {
            if (react) await react('🎵');

            const action = (args[0] || 'start').toLowerCase();

            if (action === 'start' || action === 'on') {
                if (songQueues.has(from)) {
                    return reply('🎵 *Auto Song is already running in this chat!*');
                }

                reply('🎵 *Auto Song Starting!*\n\nA new Hindi/Urdu/Pakistani song will be sent every 10 minutes.\n\nUse `.autosong stop` to disable.');

                const interval = setInterval(async () => {
                    try {
                        const songs = ['Dil Diyan Gallan', 'Chaleya', 'Main Phir Bhi Tumko Chahunga', 'Gerua', 'Tum Hi Ho', 'Meri Aashiqui'];
                        const randomSong = songs[Math.floor(Math.random() * songs.length)];

                        const response = await axios.get('https://zaynixapi12.vercel.app/api/ytmp3', {
                            params: {
                                url: `https://youtu.be/search?q=${randomSong}`,
                                apiKey: 'zaynixapi'
                            },
                            timeout: 60000
                        }).catch(() => ({ data: { success: false } }));

                        if (response.data.success) {
                            await socket.sendMessage(from, {
                                text: `🎵 *Auto Song #${Math.floor((Date.now() - (songQueues.get(from) || Date.now())) / 600000) + 1}*\n\n🎶 Now Playing: ${randomSong}\n\n> © Adeel-mini ッ`
                            });
                        }
                    } catch (err) {
                        console.warn('[AUTOSONG] Interval error:', err.message);
                    }
                }, 600000);

                songQueues.set(from, Date.now());
                songQueues.get(from).interval = interval;

                return;
            }

            if (action === 'stop' || action === 'off') {
                if (!songQueues.has(from)) {
                    return reply('⚠️ *Auto Song is not running!*');
                }

                const queue = songQueues.get(from);
                if (queue.interval) clearInterval(queue.interval);
                songQueues.delete(from);

                return reply('⏹️ *Auto Song Stopped!*');
            }

            return reply('❌ *Usage:* `.autosong start|stop`');

        } catch (error) {
            console.error('[AUTOSONG] Error:', error.message);
            reply(`❌ *Error:* ${error.message}`);
        }
    }
};
