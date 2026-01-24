const axios = require("axios");
const yts = require("yt-search");
const config = require("../../config");

module.exports = {
    name: "ytmp4",
    aliases: ["video", "yt", "ytvideo"],
    category: "downloader",
    description: "Download YouTube video",

    async execute(context) {
        const { reply, react, q, socket, sock, conn, from } = context;
        const client = socket || sock || conn;

        try {
            await react("🎬");

            if (!q) {
                return reply(
                    "❌ Please provide a YouTube URL or search term!\n\n" +
                    "Example: .video https://youtu.be/...\n" +
                    "Or: .video Never Gonna Give You Up"
                );
            }

            let videoUrl = q;
            let title = "YouTube Video";

            // 🔍 Search if not URL
            if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
                await reply("🔍 Searching...");
                const search = await yts(q);

                if (!search.videos || search.videos.length === 0) {
                    return reply("❌ No results found.");
                }

                const video = search.videos[0];
                videoUrl = video.url;
                title = video.title;
            }

            // ✅ NEW API
            const apiUrl =
                `https://zaynixapi12.vercel.app/api/ytmp4-fixed` +
                `?url=${encodeURIComponent(videoUrl)}` +
                `&apiKey=zaynixapi`;

            const { data } = await axios.get(apiUrl, { timeout: 30000 });

            if (!data || !data.status || !data.url) {
                return reply("❌ Failed to download video. Try again later.");
            }

            const downloadUrl = data.url;
            title = data.title || title;

            await reply(`🎬 *${title}*\n\n⏳ Sending video...`);

            if (client && from) {
                await client.sendMessage(from, {
                    video: { url: downloadUrl },
                    caption: `🎬 *${title}*\n\n> © ADEEL-MINI ッ`,
                    mimetype: "video/mp4"
                });
            }

            await react("✅");

        } catch (e) {
            console.error("ytmp4 error:", e.message);
            await react("❌");
            return reply(`❌ Error: ${e.message}`);
        }
    }
};
