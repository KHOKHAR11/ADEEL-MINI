const axios = require("axios");

module.exports = {
    name: "chatgpt",
    aliases: ["cgpt"],
    category: "ai",
    description: "Chat with ChatGPT model",

    async execute(context) {
        const { reply, react, q } = context;

        await react("🤖");

        if (!q) return reply("Example: chatgpt Improve my writing.");

        try {
            const url = `https://jawad-tech.vercel.app/ai/gpt?q=${encodeURIComponent(q)}`;
            const { data } = await axios.get(url);

            await reply(data.result || "❌ No response.");
            await react("✅");
        } catch (e) {
            await reply("❌ " + e.message);
        }
    }
};