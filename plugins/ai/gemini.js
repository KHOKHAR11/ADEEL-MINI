const axios = require("axios");

module.exports = {
    name: "gemini",
    aliases: ["gmini"],
    category: "ai",
    description: "Chat with Google Gemini AI",

    async execute(context) {
        const { reply, react, q } = context;

        await react("🔮");

        if (!q) return reply("Example: gemini Latest AI news?");

        try {
            const url = `https://api.xyro.site/ai/gemini?prompt=${encodeURIComponent(q)}`;
            const { data } = await axios.get(url);

            await reply(data?.result?.parts?.[0]?.text || "❌ No response.");
            await react("✅");
        } catch (e) {
            await reply("❌ " + e.message);
        }
    }
};