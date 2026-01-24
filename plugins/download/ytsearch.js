const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "ytsearch",
    aliases: ["yts", "youtubesearch", "searchyt"],
    category: "download",
    description: "Search YouTube videos with thumbnails and download buttons",

    async execute(context) {
        const { reply, react, q, sock, from, m } = context;

        if (!q) {
            return reply(`╭──▧ *ADEEL YOUTUBE SEARCH* ▧──╮
│
│ ❌ Please provide a search query
│
│ *Usage:* .ytsearch <query>
│
│ *Example:*
│ .ytsearch Arijit Singh songs
│
╰────────────────────────────────╯
> © ADEEL-MINI`);
        }

        await react("🔍");

        try {
            const apiUrl = `https://www.zaynix.zone.id/api/ytsearch?query=${encodeURIComponent(q)}`;
            const { data } = await axios.get(apiUrl, { timeout: 30000 });

            if (!data || !data.success || !data.result) {
                return reply(`╭──▧ *ADEEL YOUTUBE SEARCH* ▧──╮
│
│ ❌ No results found for "${q}"
│
╰────────────────────────────────╯
> © ADEEL-MINI`);
            }

            const results = Array.isArray(data.result) ? data.result : [data.result];
            const topResults = results.slice(0, 5);

            let searchResult = `╭──▧ *ADEEL YOUTUBE SEARCH* ▧──╮
│
│ 🔍 *Query:* ${q}
│ 📊 *Found:* ${results.length} results
│
├────────────────────────────────┤\n`;

            for (let i = 0; i < topResults.length; i++) {
                const video = topResults[i];
                const title = video.title || "Unknown";
                const duration = video.duration || video.timestamp || "N/A";
                const views = video.views || "N/A";
                const channel = video.author?.name || video.channel || "Unknown";
                const url = video.url || video.link || "";

                searchResult += `│
│ *${i + 1}.* ${title.slice(0, 40)}...
│ ⏱️ ${duration} | 👁️ ${views}
│ 👤 ${channel}
│ 🔗 ${url}
│\n`;
            }

            searchResult += `╰────────────────────────────────╯

*Reply with number (1-5) to download*

> © ADEEL-MINI`;

            const firstVideo = topResults[0];
            const thumbnailUrl = firstVideo?.thumbnail || firstVideo?.image || config.XD_IMAGE_PATH;

            const buttons = topResults.map((video, i) => ({
                buttonId: `ytdl_${video.url || video.link}`,
                buttonText: { displayText: `${i + 1}. ${(video.title || "Video").slice(0, 20)}...` },
                type: 1
            }));

            try {
                await sock.sendMessage(from, {
                    image: { url: config.XD_IMAGE_PATH },
                    caption: searchResult,
                    footer: "© ADEEL-MINI",
                    buttons: buttons.slice(0, 3),
                    headerType: 4
                }, { quoted: m });
            } catch (btnError) {
                await sock.sendMessage(from, {
                    image: { url: config.XD_IMAGE_PATH },
                    caption: searchResult
                }, { quoted: m });
            }

            await react("✅");

        } catch (error) {
            console.error("YouTube search error:", error.message);
            await react("❌");
            return reply(`╭──▧ *ADEEL YOUTUBE SEARCH* ▧──╮
│
│ ❌ Error: ${error.message}
│
╰────────────────────────────────╯
> © ADEEL-MINI`);
        }
    }
};
