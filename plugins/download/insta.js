const axios = require("axios");

module.exports = {
    name: "insta",
    aliases: ["ig", "instagram"],
    category: "downloader",
    description: "Download Instagram reels, posts, videos",

    async execute(context) {
        const { reply, react, q, sock, from } = context;

        await react("📸");

        if (!q) {
            return reply("Example: insta https://www.instagram.com/reel/...");
        }

        try {
            const apiUrl =
                `https://api.giftedtech.co.ke/api/download/instadl` +
                `?apikey=gifted&url=${encodeURIComponent(q)}`;

            const { data } = await axios.get(apiUrl, { timeout: 30000 });

            if (!data || !data.success || !data.result?.download_url) {
                return reply("❌ No media found.");
            }

            const videoUrl = data.result.download_url;

            // 🎥 Send ONLY video
            await sock.sendMessage(from, {
                video: { url: videoUrl },
                mimetype: "video/mp4"
            });

            await react("✅");

        } catch (e) {
            await react("❌");
            return reply("❌ " + e.message);
        }
    }
};
