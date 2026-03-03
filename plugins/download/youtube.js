const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "youtube",
    aliases: ["yt", "ytdl", "ytdownload"],
    category: "download",
    description: "Download YouTube videos with quality options (MP3/MP4)",

    async execute(context) {
        const { reply, react, q, sock, from, m } = context;

        if (!q) {
            return reply(`╭──▧ *ADEEL YOUTUBE* ▧──╮
│
│ ❌ Please provide a YouTube URL
│
│ *Usage:* .youtube <url>
│
│ *Example:*
│ .youtube https://youtu.be/...
│
│ You will get quality options!
│
╰────────────────────────╯
> © ADEEL-MINI`);
        }

        await react("📺");

        try {
            const apiUrl = `https://www.zaynix.zone.id/api/ytdl?url=${encodeURIComponent(q)}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data || !data.success) {
                return reply(`╭──▧ *ADEEL YOUTUBE* ▧──╮
│
│ ❌ Failed to fetch video info
│ Please check the URL
│
╰────────────────────────╯
> © ADEEL-MINI`);
            }

            const result = data.result || data.data || data;
            const title = result.title || "Unknown";
            const duration = result.duration || "N/A";
            const views = result.views || result.view_count || "N/A";
            const author = result.author || result.channel || "Unknown";
            const thumbnail = result.thumbnail || result.image;

            const caption = `╭──▧ *ADEEL YOUTUBE* ▧──╮
│
│ 📺 *Title:* ${title}
│ 👤 *Channel:* ${author}
│ ⏱️ *Duration:* ${duration}
│ 👁️ *Views:* ${views}
│
│ *Select Quality:*
│
╰────────────────────────╯
> © ADEEL-MINI`;

            const buttons = [
                {
                    buttonId: `ytmp3_${q}`,
                    buttonText: { displayText: "🎵 MP3 Audio" },
                    type: 1
                },
                {
                    buttonId: `ytmp4_360_${q}`,
                    buttonText: { displayText: "📹 360p Video" },
                    type: 1
                },
                {
                    buttonId: `ytmp4_720_${q}`,
                    buttonText: { displayText: "📺 720p Video" },
                    type: 1
                }
            ];

            try {
                const buttonMessage = {
                    image: { url: config.XD_IMAGE_PATH },
                    caption: caption,
                    footer: "© ADEEL-MINI",
                    buttons: buttons,
                    headerType: 4
                };
                await sock.sendMessage(from, buttonMessage, { quoted: m });
                await react("✅");
            } catch (btnError) {
                const interactiveMsg = {
                    image: { url: config.XD_IMAGE_PATH },
                    caption: caption + `\n\n*Reply with:*\n• 1 - MP3 Audio\n• 2 - 360p Video\n• 3 - 720p Video\n\n> © Zaynix-PRIME ッ`
                };
                await sock.sendMessage(from, interactiveMsg, { quoted: m });

                if (result.audio || result.mp3) {
                    await sock.sendMessage(from, {
                        audio: { url: result.audio || result.mp3 },
                        mimetype: "audio/mpeg",
                        fileName: `${title}.mp3`
                    }, { quoted: m });
                }
                
                if (result.video || result.mp4) {
                    await sock.sendMessage(from, {
                        video: { url: result.video || result.mp4 },
                        caption: `╭──▧ *ADEEL YOUTUBE* ▧──╮
│
│ 📺 *${title}*
│
╰────────────────────────╯
> © ADEEL-MINI`
                    }, { quoted: m });
                }
                
                await react("✅");
            }

        } catch (error) {
            console.error("YouTube download error:", error.message);
            await react("❌");
            return reply(`╭──▧ *ADEEL YOUTUBE* ▧──╮
│
│ ❌ Error: ${error.message}
│
╰────────────────────────╯
> © ADEEL-MINI`);
        }
    }
};
