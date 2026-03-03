module.exports = {
    name: "about",
    aliases: ["info"],
    category: "main",
    description: "About this bot",

    async execute(context) {
        const { reply, react } = context;

        await react("ℹ️");

        const txt =
`🤖 *ADEEL-MINI BOT*
Lightweight, fast, and powerful WhatsApp bot.

👤 Developer: *ADEEL-MD*
🚀 Performance: Optimized
🛡 Security: Active
⚙ Framework: ADEEL-MINI NEXT Engine`;

        await reply(txt);
        await react("✅");
    }
};
