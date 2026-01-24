const axios = require("axios");

module.exports = {
    name: "fb",
    aliases: ["facebook"],
    category: "downloader",
    description: "Download Facebook videos",

    async execute(context) {
        const { reply, react, q, sock, from } = context;

        await react("📘");

        if (!q) {
            return reply("❌ Example:\nfb https://facebook.com/reel/xxxx");
        }

        try {
            const apiUrl = `https://edith-apis.vercel.app/download/facebook?url=${encodeURIComponent(q)}`;
            const { data } = await axios.get(apiUrl, { timeout: 20000 });

            if (!data.status || !data.result?.media) {
                return reply("❌ Video not available or API error.");
            }

            const info = data.result.info || {};
            const media = data.result.media;

            // HD priority → SD fallback
            const videoUrl = media.video_hd || media.video_sd;
            if (!videoUrl) {
                return reply("❌ No downloadable video found.");
            }

            const title =
                info.title?.slice(0, 300) || "Facebook Video";

        

            await reply("📥 Downloading Facebook video...");


        
            await sock.sendMessage(from, {
                video: { url: videoUrl },
                caption: "✅ Downloaded By Adeel-mini",
                mimetype: "video/mp4"
            });

            await react("✅");

        } catch (e) {
            console.error("FB Downloader Error:", e);
            await react("❌");
            return reply("❌ Error: " + e.message);
        }
    }
};
