const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "google",
    aliases: ["search", "gs", "googlesearch"],
    category: "main",
    description: "Search Google for information",

    async execute(context) {
        const { reply, react, q, sock, from, m } = context;

        if (!q) {
            return reply(`╭──▧ *ADEEL GOOGLE* ▧──╮
│
│ ❌ Please provide a search query
│
│ *Usage:* .google <query>
│
│ *Example:*
│ .google How to code in JavaScript
│
╰─────────────────╯
> © ADEEL-MINI`);
        }

        await react("🔍");

        try {
            const apiUrl = `https://www.zaynix.zone.id/api/googlesearch?query=${encodeURIComponent(q)}`;
            const { data } = await axios.get(apiUrl, { timeout: 30000 });

            if (!data || !data.success) {
                return reply(`╭──▧ *ADEEL GOOGLE* ▧──╮
│
│ ❌ No results found for "${q}"
│
╰──────────────────╯
> © ADEEL-MINI`);
            }

            const results = data.result || data.data || [];
            const topResults = Array.isArray(results) ? results.slice(0, 5) : [results];

            let searchResult = `╭──▧ *ADEEL GOOGLE* ▧──╮
│
│ 🔍 *Query:* ${q}
│
├────────────────────────┤\n`;

            for (let i = 0; i < topResults.length; i++) {
                const item = topResults[i];
                const title = item.title || "No Title";
                const description = item.description || item.snippet || "No description";
                const link = item.link || item.url || "";

                searchResult += `│
│ *${i + 1}.* ${title.slice(0, 50)}
│ ${description.slice(0, 100)}...
│ 🔗 ${link}
│\n`;
            }

            searchResult += `╰────────────────────────╯
> © ADEEL-MINI`;

            await sock.sendMessage(from, {
                image: { url: config.XD_IMAGE_PATH },
                caption: searchResult
            }, { quoted: m });

            await react("✅");

        } catch (error) {
            console.error("Google search error:", error.message);
            await react("❌");
            return reply(`╭──▧ *ADEEL GOOGLE* ▧──╮
│
│ ❌ Error: ${error.message}
│
╰────────────────────────╯
> © ADEEL-MINI`);
        }
    }
};
