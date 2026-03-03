const axios = require("axios");

module.exports = {
    name: "comedy",
    aliases: ["joke"],
    category: "ai",
    description: "Comedy AI — jokes & fun",

    async execute(context) {
        const { reply, react, q } = context;

        await react("😂");

        if (!q) return reply("Example: comedy Programming jokes.");

        try {
            const prompt = `You are Comedy AI, make everything funny. User: ${q}`;

            const url = `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(prompt)}`;
            const { data } = await axios.get(url);

            await reply(data.message || "❌ No comedy returned.");
            await react("🤣");
        } catch (e) {
            await reply("❌ " + e.message);
        }
    }
};