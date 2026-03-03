const axios = require("axios");

module.exports = {
    name: "deepseek",
    aliases: [],
    category: "ai",
    description: "Talk with DeepSeek AI",

    async execute(context) {
        const { reply, react, args } = context;

        await react("🧠");

        const q = args.join(" ");
        if (!q) return reply("Example: deepseek How are you?");

        try {
            const url = `https://api.xyro.site/ai/copilot?text=${encodeURIComponent(q)}&model=think-deeper`;
            const { data } = await axios.get(url);

            await reply(data.data.text);
            await react("✅");
        } catch (e) {
            await reply("❌ Error: " + e.message);
        }
    }
};