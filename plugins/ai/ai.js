const axios = require("axios");

module.exports = {
    name: "ai",
    aliases: ["ask"],
    category: "ai",
    description: "Chat with general AI model",

    async execute(context) {
        const { reply, react, args } = context;

        await react("🤖");

        const q = args.join(" ");
        if (!q) return reply("Example: ai Tell me about space.");

        try {
            const url = `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(q)}`;
            const { data } = await axios.get(url);

            await reply(data.message);
            await react("✅");
        } catch (e) {
            await reply("❌ Error: " + e.message);
        }
    }
};