module.exports = {
    name: "hidetag",
    aliases: ["htag", "silentmention", "h"],
    category: "group",
    description: "Silently tag all members without showing mentions",

    async execute(context) {
        const { reply, react, socket, sock, conn, client, from, isAdmins, isBotOwner, q, pushName } = context;
        const botClient = socket || sock || conn || client;

        if (!botClient || typeof botClient.groupMetadata !== 'function') {
            return reply("❌ Bot client not available. Please try again.");
        }

        try {
            await react("🔇");
        } catch (e) {}

        if (!from || !from.endsWith("@g.us")) {
            return reply("❌ This command only works in groups!");
        }

        if (!isAdmins && !isBotOwner) {
            return reply("❌ Only group admins can use this command!");
        }

        const message = q || "👀";

        try {
            const meta = await botClient.groupMetadata(from);
            
            if (!meta || !meta.participants) {
                return reply("❌ Failed to get group members. Please try again.");
            }

            const members = meta.participants.map(p => p.id);

            await botClient.sendMessage(from, {
                text: message,
                mentions: members
            });

            await react("✅");

        } catch (error) {
            console.error("Hidetag error:", error.message);
            await reply(`❌ Failed to send hidden tag: ${error.message}`);
        }
    }
};
