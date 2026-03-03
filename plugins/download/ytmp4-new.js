const axios = require('axios');

module.exports = {
    name: 'ytmp4new',
    aliases: ['yt-mp4', 'ytvideo'],
    category: 'download',
    description: 'Download YouTube video as MP4',

    async execute(context) {
        const { reply, text, react, args } = context;

        try {
            if (react) await react('⏳');

            if (!args[0]) {
                return reply('❌ *Usage:* `.ytmp4 <YouTube URL>`\n\nExample: `.ytmp4 https://youtu.be/dQw4w9WgXcQ`');
            }

            const url = args[0];
            if (!url.includes('youtu')) {
                return reply('❌ Invalid YouTube URL!');
            }

            reply('🎥 *Converting your video...* Please wait\n\n⏳ This may take 1-2 minutes');

            const response = await axios.get('https://zaynixapi12.vercel.app/api/ytmp4-fixed', {
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

            const videoTitle = response.data.title || 'Video';
            reply(`🎥 *Download your MP4:*\n\n📝 Title: ${videoTitle}\n🔗 Link: ${downloadUrl}\n\n> © ADEEL-MINI`);

        } catch (error) {
            console.error('[YTMP4-NEW] Error:', error.message);
            reply(`❌ *Error:* ${error.message || 'Failed to process request'}\n\nTry again later or use a different URL.`);
        }
    }
};
