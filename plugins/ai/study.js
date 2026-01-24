const axios = require("axios");

module.exports = {
    name: "study",
    aliases: [],
    category: "ai",
    description: "Study AI — academic help",

    async execute(context) {
        const { reply, react, q } = context;

        await react("📚");

        if (!q) return reply("Example: study Best exam tips?");

        try {
            const prompt = `You are Study AI. Help the user with academic learning. User: ${q}`;

            const url = `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(prompt)}`;
            const { data } = await axios.get(url);

            await reply(data.message || "❌ No study response.");
            await react("✅");
        } catch (e) {
            await reply("❌ " + e.message);
        }
    }
};