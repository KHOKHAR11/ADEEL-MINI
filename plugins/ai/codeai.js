const axios = require("axios");

module.exports = {
    name: "codeai",
    aliases: ["devai"],
    category: "ai",
    description: "AI coding assistant",

    async execute(context) {
        const { reply, react, args } = context;

        await react("💻");

        const q = args.join(" ");
        if (!q) return reply("Example: codeai Create JS function.");

        try {
            const prompt = `You are a coding assistant. Only answer programming questions. User: ${q}`;

            const url = `https://api.deline.web.id/ai/copilot?text=${encodeURIComponent(prompt)}`;
            const { data } = await axios.get(url);

            await reply(data.result);
            await react("✅");
        } catch (e) {
            await reply("❌ Error: " + e.message);
        }
    }
};