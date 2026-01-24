const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "spotify",
    aliases: ["sp", "spotifydl", "spdl"],
    category: "download",
    description: "Download songs from Spotify",

    async execute(context) {
        const { reply, react, q, sock, from, m } = context;

        if (!q) {
            return reply(`╭──▧ *ADEEL SPOTIFY* ▧──╮
│
│ ❌ Please provide a Spotify URL
│
│ *Usage:* .spotify <url>
│
│ *Example:*
│ .spotify https://open.spotify.com/track/...
│
╰────────────────────────╯
> © ADEEL-MINI`);
        }

        await react("🎵");

        try {
            const apiUrl = `https://www.zaynix.zone.id/api/spotifydl?url=${encodeURIComponent(q)}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });

            if (!data || !data.success) {
                return reply(`╭──▧ *ADEEL SPOTIFY* ▧──╮
│
│ ❌ Failed to download song
│ Please check the URL
│
╰────────────────────────╯
> © ADEEL-MINI`);
            }

            const result = data.result || data.data || data;
            const title = result.title || result.name || "Unknown";
            const artist = result.artist || result.artists || "Unknown";
            const album = result.album || "Unknown";
            const duration = result.duration || "N/A";
            const downloadUrl = result.download || result.downloadUrl || result.url;
            const thumbnail = result.thumbnail || result.image || result.cover;

            const caption = `╭──▧ *ADEEL SPOTIFY* ▧──╮
│
│ 🎵 *Title:* ${title}
│ 🎤 *Artist:* ${artist}
│ 💿 *Album:* ${album}
│ ⏱️ *Duration:* ${duration}
│
╰────────────────────────╯
> © ADEEL-MINI`;

            await sock.sendMessage(from, {
                image: { url: config.XD_IMAGE_PATH },
                caption: caption
            }, { quoted: m });

            if (downloadUrl) {
                await sock.sendMessage(from, {
                    audio: { url: downloadUrl },
                    mimetype: "audio/mpeg",
                    fileName: `${title}.mp3`
                }, { quoted: m });
                await react("✅");
            } else {
                await react("⚠️");
                return reply(`╭──▧ *ZAYNIX SPOTIFY* ▧──╮
│
│ ⚠️ No download link found
│
╰────────────────────────╯
> © ADEEL-MINI`);
            }

        } catch (error) {
            console.error("Spotify download error:", error.message);
            await react("❌");
            return reply(`╭──▧ *ADEEL SPOTIFY* ▧──╮
│
│ ❌ Error: ${error.message}
│
╰────────────────────────╯
> © ADEEL-MINI`);
        }
    }
};
