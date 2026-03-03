const axios = require("axios");

module.exports = {
    name: "claude",
    aliases: ["anthropic"],
    category: "ai",
    description: "Chat with Claude AI",

    async execute(context) {
        const { reply, react, q } = context;

        await react("🤵");

        if (!q) return reply("Example: claude What is AI ethics?");

        try {
            const url = `https://apis.sandarux.sbs/api/ai/claude?text=${encodeURIComponent(q)}`;
            const { data } = await axios.get(url);

            await reply(data.response || "❌ No response.");
            await react("✅");
        } catch (e) {
            await reply("❌ " + e.message);
        }
    }
};