const axios = require("axios");
const yts = require("yt-search");
const config = require("../../config");

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
    }
};

async function getYupra(url) {
    try {
        const api = `https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(url)}`;
        const res = await axios.get(api, AXIOS_DEFAULTS);
        const d = res?.data?.data || {};
        return d.download_url || null;
    } catch {
        return null;
    }
}

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

            if (!q) return;

            let videoUrl = q;
            let title = "YouTube Video";

            if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
                const search = await yts(q);
                if (search.videos && search.videos.length > 0) {
                    const video = search.videos[0];
                    videoUrl = video.url;
                    title = video.title;
                }
            }

            const downloadUrl = await getYupra(videoUrl);
            if (!downloadUrl) return;

            if (client && from) {
                await client.sendMessage(from, {
                    video: { url: downloadUrl },
                    mimetype: "video/mp4",
                    caption: `🎬 *${title}*\n\n> © ADEEL-MINI ッ`
                });
            }

            await react("✅");

        } catch {
            await react("❌");
        }
    }
};
