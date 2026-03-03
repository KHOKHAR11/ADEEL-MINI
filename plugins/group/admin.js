module.exports = {
    name: "admins",
    aliases: ["adminlist"],
    category: "group",
    description: "Show all group admins",

    async execute(context) {
        const { reply, react, socket, from, isAdmins } = context;

        await react("👑");
 if(!isAdmins) return reply("only Admin Command");
        const meta = await socket.groupMetadata(from);
        const admins = meta.participants.filter(p => p.admin);

        let text = "👑 *Group Admins:*\n\n";
        admins.forEach((a, i) => text += `${i+1}. @${a.id.split("@")[0]}\n`);

        await reply(text, { mentions: admins.map(a => a.id) });
    }
};
