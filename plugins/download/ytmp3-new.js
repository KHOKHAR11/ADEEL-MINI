const axios = require('axios');

module.exports = {
    name: 'ytmp3new',
    aliases: ['yt-mp3', 'ytaudio'],
    category: 'download',
    description: 'Download YouTube video as MP3',

    async execute(context) {
        const { reply, text, react, args } = context;

        try {
            if (react) await react('⏳');

            if (!args[0]) {
                return reply('❌ *Usage:* `.ytmp3 <YouTube URL>`\n\nExample: `.ytmp3 https://youtu.be/dQw4w9WgXcQ`');
            }

            const url = args[0];
            if (!url.includes('youtu')) {
                return reply('❌ Invalid YouTube URL!');
            }

            reply('🎵 *Converting your video...* Please wait\n\n⏳ This may take 30-60 seconds');

            const response = await axios.get('https://zaynixapi12.vercel.app/api/ytmp3', {
                params: {
                    url: url,
                    apiKey: 'zaynixapi'
                },
                timeout: 120000
            });

            if (!response.data.success) {
                return reply(`❌ *Error:* ${response.data.error || 'Failed to convert video'}`);
            }

            const downloadUrl = response.data.download;
            if (!downloadUrl) {
                return reply('❌ No download link received');
            }

            const audioTitle = response.data.title || 'Audio';
            reply(`🎵 *Download your MP3:*\n\n📝 Title: ${audioTitle}\n🔗 Link: ${downloadUrl}\n\n> © ADEEL-MINI`);

        } catch (error) {
            console.error('[YTMP3-NEW] Error:', error.message);
            reply(`❌ *Error:* ${error.message || 'Failed to process request'}\n\nTry again later or use a different URL.`);
        }
    }
};
