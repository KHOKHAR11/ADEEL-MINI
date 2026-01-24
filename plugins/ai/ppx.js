const axios = require("axios");

module.exports = {
    name: "perplexity",
    aliases: ["ppx"],
    category: "ai",
    description: "Chat with Perplexity AI",

    async execute(context) {
        const { reply, react, q } = context;

        await react("🎯");

        if (!q) return reply("Example: perplexity Quantum computing news.");

        try {
            const url = `https://zelapioffciall.koyeb.app/ai/perplexity?text=${encodeURIComponent(q)}`;
            const { data } = await axios.get(url);

            await reply(data.message || "❌ No response.");
            await react("✅");
        } catch (e) {
            await reply("❌ " + e.message);
        }
    }
};