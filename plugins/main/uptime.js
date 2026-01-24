module.exports = {
    name: "runtime",
    aliases: ["uptime"],
    category: "main",
    description: "Show bot uptime",

    async execute(context) {
        const { reply, react } = context;

        await react("⏳");

        const sec = process.uptime();
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);

        await reply(`⏳ *Uptime:* ${h}h ${m}m ${s}s`);
        await react("✅");
    }
};