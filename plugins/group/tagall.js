module.exports = {
    name: "tagall",
    aliases: ["mentionall", "all"],
    category: "group",
    description: "Tag all users in the group",

    async execute(context) {
        const { reply, react, socket, sock, conn, client, from, isAdmins, isBotOwner, q, pushName } = context;
        const botClient = socket || sock || conn || client;

        if (!botClient || typeof botClient.groupMetadata !== 'function') {
            return reply("❌ Bot client not available. Please try again.");
        }

        try {
            await react("📢");
        } catch (e) {}

        if (!from || !from.endsWith("@g.us")) {
            return reply("❌ This command only works in groups!");
        }

        if (!isAdmins && !isBotOwner) {
            return reply("❌ Only group admins can use this command!");
        }

        try {
            const meta = await botClient.groupMetadata(from);
            
            if (!meta || !meta.participants) {
                return reply("❌ Failed to get group members. Please try again.");
            }

            const members = meta.participants.map(p => p.id);
            const message = q || "📢 Attention everyone!";
            const senderName = pushName || "Admin";

            const text = `╭━━━━━━━━━━━━━━━╮
┃  📢 *GROUP ANNOUNCEMENT*
┃  ━━━━━━━━━━━━━━━
┃  👤 From: *${senderName}*
┃  👥 Members: *${members.length}*
╰━━━━━━━━━━━━━━━━╯

📝 *Message:*
${message}

━━━━━━━━━━━━━━━
${members.map(m => `@${m.split("@")[0]}`).join(" ")}
━━━━━━━━━━━━━━━`;

            await botClient.sendMessage(from, {
                text: text,
                mentions: members
            });

            await react("✅");

        } catch (error) {
            console.error("Tagall error:", error.message);
            await reply(`❌ Failed to tag members: ${error.message}`);
        }
    }
};
