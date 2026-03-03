module.exports = {
    name: 'version',
    aliases: ['ver'],
    description: 'Show bot version',
    category: 'main',

    async execute(context) {
        const { reply, react, getUserConfig } = context;

        await react("📌");

        const user = await getUserConfig();
        const prefix = user.PREFIX || context.config.PREFIX;

        const txt = 
`📌 *Bot Version:* 1.0.0
⚙ Node.js: ${process.version}
🔐 Status: Stable
📝 Prefix: ${prefix}
💾 Memory Use: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`;

        await reply(txt);
        await react("✅");
    }
};