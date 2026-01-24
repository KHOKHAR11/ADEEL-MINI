const axios = require("axios");

module.exports = {
    name: "brain",
    aliases: ["powerbrain"],
    category: "ai",
    description: "Chat with PowerBrain AI",

    async execute(context) {
        const { reply, react, q } = context;

        await react("🧠");

        if (!q) return reply("Example: brain Explain deep learning.");

        try {
            const url = `https://api.xyro.site/ai/powerbrain?query=${encodeURIComponent(q)}`;
            const { data } = await axios.get(url);

            await reply(data.result || "❌ No response.");
            await react("✅");
        } catch (e) {
            await reply("❌ " + e.message);
        }
    }
};