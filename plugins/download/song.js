const axios = require("axios");
const yts = require("yt-search");
const config = require("../../config");

module.exports = {
    name: "play",
    aliases: ["song", "ytmp3", "music"],
    category: "downloader",
    description: "Download YouTube audio",

    async execute(context) {
        const { reply, react, q, socket, sock, conn, from } = context;
        const client = socket || sock || conn;

        try {
            await react("🎧");

            if (!q) {
                return reply("❌ Please provide a song name!\n\nExample: .play Another Love by Tom Odell");
            }

            const search = await yts(q);
            if (!search.videos || search.videos.length === 0) {
                return reply("❌ No results found. Try a different search term.");
            }

            const video = search.videos[0];
            const videoUrl = video.url;
            const duration = video.duration?.timestamp || "Unknown";
            const views = video.views?.toLocaleString() || "Unknown";
            const channel = video.author?.name || "Unknown Channel";
            const title = video.title;
            let thumbnail = video.thumbnail;

            const apis = [
                `https://sarkar-apis.bandaheali.site/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
                `https://api.dreaded.site/api/ytmp3?url=${encodeURIComponent(videoUrl)}`,
                `https://itzpire.com/download/ytmp3?url=${encodeURIComponent(videoUrl)}`
            ];

            let downloadUrl = null;

            for (const apiUrl of apis) {
                try {
                    const { data } = await axios.get(apiUrl, { timeout: 15000 });
                    if (data.success && data.result?.download_url) {
                        downloadUrl = data.result.download_url;
                        thumbnail = data.result?.thumbnail || thumbnail;
                        break;
                    } else if (data.result?.downloadUrl) {
                        downloadUrl = data.result.downloadUrl;
                        break;
                    } else if (data.downloadUrl) {
                        downloadUrl = data.downloadUrl;
                        break;
                    }
                } catch (apiErr) {
                    console.log(`API failed: ${apiUrl}`, apiErr.message);
                    continue;
                }
            }

            if (!downloadUrl) {
                return reply(`❌ Download failed. APIs are temporarily unavailable.\n\n🎵 *${title}*\n🔗 ${videoUrl}\n\nPlease try again later or use the link above.`);
            }

            // 1️⃣ Thumbnail with video info in desired style
            await client.sendMessage(from, {
                image: { url: thumbnail || config.XD_IMAGE_PATH },
                caption: `🎵 *"${title}"*\n\n⏱️ ${duration}\n👁️ ${views} views\n📺 ${channel}\n\n> *ADEEL-MINI*`
            });

            // 2️⃣ Audio message with only your name
            await client.sendMessage(from, {
                audio: { url: downloadUrl },
                mimetype: "audio/mpeg",
                fileName: `${title}.mp3`,
                caption: `> © *ADEEL-MINI*`
            });

            await react("✅");

        } catch (e) {
            console.error("Play command error:", e);
            await react("❌");
            return reply(`❌ Error: ${e.message}\n\nPlease try again later.`);
        }
    }
};
