const axios = require("axios");

module.exports = {
    name: "tiktok",
    aliases: ["tt", "ttdl", "tiktokdl"],
    category: "download",

    async execute(context) {
        const { reply, react, q, sock, from, m } = context;

        if (!q) return reply("❌ Provide a TikTok URL");
        if (!q.includes("tiktok.com")) return reply("❌ Invalid TikTok URL");

        await react("🎬");

        try {
            // 🔄 SAME WORKING API (Edith v2)
            const api = `https://edith-apis.vercel.app/download/tiktok-v2?url=${encodeURIComponent(q)}`;
            const { data } = await axios.get(api);

            if (!data?.result?.data) return reply("❌ Failed to fetch video");

            const v = data.result.data;

            // ===== METADATA (STABLE) =====
            const title = v.title || v.desc || "TikTok Video";
            const author = v.author?.nickname || "Unknown";
            const username = v.author?.unique_id || "Unknown";

            // ===== VIDEO URL (AUTO DIRECT) =====
            const videoUrl =
                v.play ||        // no watermark
                v.hdplay ||      // hd
                v.wmplay;        // watermark fallback

            if (!videoUrl) return reply("❌ Video link not found");

            const caption = `🎵 *TikTok Video* 🎵

👤 *User:* ${author} (@${username})
📖 *Title:* ${title}

© ADEEL-MINI`;

            await sock.sendMessage(
                from,
                {
                    video: { url: videoUrl },
                    caption: caption
                },
                { quoted: m }
            );

            await react("✅");

        } catch (err) {
            await react("❌");
            reply("❌ Download failed");
        }
    }
};
