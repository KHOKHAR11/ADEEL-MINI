const axios = require("axios");

module.exports = {
    name: "felo",
    aliases: [],
    category: "ai",
    description: "Chat with Felo AI Assistant",

    async execute(context) {
        const { reply, react, q } = context;

        await react("🌟");

        if (!q) return reply("Example: felo How does ML work?");

        try {
            const url = `https://api.xyro.site/ai/felo?text=${encodeURIComponent(q)}`;
            const { data } = await axios.get(url);

            await reply(data.result?.answer || "❌ No response.");
            await react("✅");
        } catch (e) {
            await reply("❌ " + e.message);
        }
    }
};