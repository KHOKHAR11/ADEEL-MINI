const axios = require("axios");

module.exports = {
    name: "gpt",
    aliases: ["chatgpt4"],
    category: "ai",
    description: "Chat with GPT-4o model",

    async execute(context) {
        const { reply, react, args } = context;

        await react("🤖");

        const q = args.join(" ");
        if (!q) return reply("Example: gpt Explain AI.");

        try {
            const url = `https://api.hanggts.xyz/ai/chatgpt4o?text=${encodeURIComponent(q)}`;
            const { data } = await axios.get(url);

            await reply(data.result.data);
            await react("✅");
        } catch (e) {
            await reply("❌ Error: " + e.message);
        }
    }
};