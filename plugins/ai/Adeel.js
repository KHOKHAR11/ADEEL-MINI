const axios = require("axios");

module.exports = {
    name: "Adeel",
    aliases: ["iqra"],
    category: "ai",
    description: "Chat with Adeel AI",

    async execute(context) {
        const { reply, react, args } = context;

        await react("👨‍💻");

        const q = args.join(" ");
        if (!q) return reply("Example: bandahelai How to study?");

        try {
            const url = `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(
                `You are Adeel AI, built by Adeel. User: ${q}`
            )}`;

            const { data } = await axios.get(url);

            await reply(data.message);
            await react("✅");
        } catch (e) {
            await reply("❌ Error: " + e.message);
        }
    }
};
