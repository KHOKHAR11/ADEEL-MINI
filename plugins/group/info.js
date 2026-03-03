module.exports = {
    name: "ginfo",
    aliases: [],
    category: "group",
    description: "Group information",

    async execute(context) {
        const { reply, react, socket, from } = context;

        await react("📄");
if (!isAdmins) return reply("ONLY ADMINS CAN USE");
        const meta = await socket.groupMetadata(from);

        const info = 
`📛 *Group Name:* ${meta.subject}
👑 *Owner:* ${meta.owner || "Unknown"}
👥 *Members:* ${meta.participants.length}
🕒 *Created:* ${new Date(meta.creation * 1000).toLocaleString()}`;

        await reply(info);
    }
};
