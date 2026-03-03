const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "tweet",
    aliases: ["twitter", "tweetdl", "xdl"],
    category: "main",
    description: "Download Twitter/X media and view tweets",

    async execute(context) {
        const { reply, react, q, sock, from, m } = context;

        if (!q) {
            return reply(`╭──▧ *ADEEL TWEET* ▧──╮
│
│ ❌ Please provide a tweet URL
│
│ *Usage:* .tweet <url>
│
│ *Example:*
│ .tweet https://twitter.com/...
│ .tweet https://x.com/...
│
╰────────────────────────╯
> © ADEEL-MINI`);
        }

        await react("🐦");

        try {
            const apiUrl = `https://www.zaynix.zone.id/api/tweet?url=${encodeURIComponent(q)}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data || !data.success) {
                return reply(`╭──▧ *ADEEL TWEET* ▧──╮
│
│ ❌ Failed to fetch tweet
│ Please check the URL
│
╰────────────────────────╯
> © ADEEL-MINI`);
            }

            const result = data.result || data.data || data;
            const text = result.text || result.content || result.tweet || "";
            const author = result.author || result.user || result.username || "Unknown";
            const likes = result.likes || result.like_count || "N/A";
            const retweets = result.retweets || result.retweet_count || "N/A";
            const replies = result.replies || result.reply_count || "N/A";
            const mediaUrl = result.media || result.video || result.image;
            const isVideo = result.type === "video" || mediaUrl?.includes("video");

            const caption = `╭──▧ *ADEEL TWEET* ▧──╮
│
│ 🐦 *Tweet Info*
│
│ 👤 *Author:* @${author}
│ 
│ 💬 *Tweet:*
│ ${text.slice(0, 200)}${text.length > 200 ? "..." : ""}
│
│ ❤️ *Likes:* ${likes}
│ 🔄 *Retweets:* ${retweets}
│ 💬 *Replies:* ${replies}
│
╰────────────────────────╯
> © ADEEL-MINI`;

            if (mediaUrl) {
                if (isVideo) {
                    await sock.sendMessage(from, {
                        video: { url: mediaUrl },
                        caption: caption
                    }, { quoted: m });
                } else {
                    await sock.sendMessage(from, {
                        image: { url: mediaUrl },
                        caption: caption
                    }, { quoted: m });
                }
            } else {
                await sock.sendMessage(from, {
                    image: { url: config.XD_IMAGE_PATH },
                    caption: caption
                }, { quoted: m });
            }

            await react("✅");

        } catch (error) {
            console.error("Tweet error:", error.message);
            await react("❌");
            return reply(`╭──▧ *ADEEL TWEET* ▧──╮
│
│ ❌ Error: ${error.message}
│
╰────────────────────────╯
> © ADEEL-MINI`);
        }
    }
};
