module.exports = {
    name: "status",
    aliases: ["botstatus"],
    category: "main",
    description: "Shows bot health status",

    async execute(context) {
        const { reply, react } = context;

        await react("📊");

        const mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

        const txt =
`🟢 *BOT STATUS*

💾 Memory: ${mem} MB
⚙ Node: ${process.version}
📡 Platform: ADEEL-MINI
🔋 Running: Perfectly`;

        await reply(txt);
        await react("✅");
    }
};