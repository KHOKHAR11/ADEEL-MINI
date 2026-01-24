const axios = require("axios");

module.exports = {
    name: "meta",
    aliases: ["metai"],
    category: "ai",
    description: "Chat with Meta AI",

    async execute(context) {
        const { reply, react, q } = context;

        await react("💠");

        if (!q) return reply("Example: meta Future of social media?");

        try {
            const url = `https://jawad-tech.vercel.app/ai/metai?q=${encodeURIComponent(q)}`;
            const { data } = await axios.get(url);

            await reply(data.result || "❌ No response.");
            await react("✅");
        } catch (e) {
            await reply("❌ " + e.message);
        }
    }
};