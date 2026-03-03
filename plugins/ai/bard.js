const axios = require("axios");

module.exports = {
    name: "bard",
    aliases: [],
    category: "ai",
    description: "Chat with Google Bard AI",

    async execute(context) {
        const { reply, react, q } = context;

        await react("🎭");

        if (!q) return reply("Example: bard Write a creative story.");

        try {
            const url = `https://api.xyro.site/ai/bard?text=${encodeURIComponent(q)}`;
            const { data } = await axios.get(url);

            await reply(data.result || "❌ Bard gave no response.");
            await react("✅");
        } catch (e) {
            await reply("❌ Error: " + e.message);
        }
    }
};