const axios = require("axios");

module.exports = {
    name: "dj",
    aliases: [],
    category: "ai",
    description: "Chat with DJ Music AI",

    async execute(context) {
        const { reply, react, q } = context;

        await react("🎵");

        if (!q) return reply("Example: dj Best music software?");

        try {
            const prompt = `You are DJ AI, a music expert. User: ${q}`;

            const url = `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(prompt)}`;
            const { data } = await axios.get(url);

            await reply(data.message || "❌ No DJ response.");
            await react("✅");
        } catch (e) {
            await reply("❌ " + e.message);
        }
    }
};