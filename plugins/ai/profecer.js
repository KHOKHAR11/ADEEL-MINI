const axios = require("axios");

module.exports = {
    name: "professor",
    aliases: ["teach"],
    category: "ai",
    description: "Chat with Professor AI (Educational Expert)",

    async execute(context) {
        const { reply, react, q } = context;

        await react("👨‍🏫");

        if (!q) return reply("Example: professor Explain relativity.");

        try {
            const prompt = `You are Professor AI with deep knowledge. User: ${q}`;

            const url = `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(prompt)}`;
            const { data } = await axios.get(url);

            await reply(data.message || "❌ No response from Professor.");
            await react("✅");
        } catch (e) {
            await reply("❌ Error: " + e.message);
        }
    }
};