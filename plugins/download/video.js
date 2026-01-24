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

// Only to get download URL from API
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
    description: "Download YouTube video with thumbnail, title, views & channel",

    async execute(context) {
        const { reply, react, q, socket, sock, conn, from } = context;
        const client = socket || sock || conn;

        try {
            await react("🎬");

            if (!q) return reply("❌ Please provide a YouTube URL or search term!");

            let videoUrl = q;
            let thumb = null;
            let views = "Unknown";
            let channel = "Unknown Channel";
            let displayTitle = "YouTube Video"; // This shows in thumbnail
            const videoTitle = "ADEEL-MINI"; // Fixed video title for video message

            // Search if query is not direct URL
            if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
                const search = await yts(q);
                if (search.videos && search.videos.length > 0) {
                    const video = search.videos[0];
                    videoUrl = video.url;
                    thumb = video.thumbnail;
                    displayTitle = video.title; // thumbnail caption
                    views = video.views?.toLocaleString() || "Unknown";
                    channel = video.author?.name || "Unknown Channel";
                }
            } else {
                // If direct URL, try to fetch metadata using yts
                const search = await yts(videoUrl);
                if (search.videos && search.videos.length > 0) {
                    const video = search.videos[0];
                    thumb = video.thumbnail;
                    displayTitle = video.title;
                    views = video.views?.toLocaleString() || "Unknown";
                    channel = video.author?.name || "Unknown Channel";
                }
            }

            // Get download link from API
            const downloadUrl = await getYupra(videoUrl);
            if (!downloadUrl) return reply("❌ Failed to fetch video download link!");

            // Step 1: Send Thumbnail with title, views & channel
            await client.sendMessage(from, {
                image: { url: thumb },
                caption: `📌 *${displayTitle}*\n👁️ *Views:* ${views}\n📺 *Channel:* ${channel}\n\n> Preview by ADEEL-MINI`
            });

            // Step 2: Send Video with fixed title ADEEL-MINI
            await client.sendMessage(from, {
                video: { url: downloadUrl },
                mimetype: "video/mp4",
                caption: `🎬 *${videoTitle}*\n📺 *Channel:* ${channel}\n\n> © ADEEL-MINI ッ`
            });

            await react("✅");

        } catch (err) {
            console.error(err);
            await react("❌");
            await reply("❌ Something went wrong!");
        }
    }
};
