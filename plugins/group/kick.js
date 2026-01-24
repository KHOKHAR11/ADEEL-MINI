module.exports = {
    name: "kick",
    aliases: ["remove", "ban"],
    category: "group",
    description: "Kick/remove a member from group",

    async execute(context) {
        const { reply, react, socket, sock, conn, client, msg, args, from, q, isAdmins, isBotAdmins, isBotOwner, m } = context;
        const botClient = socket || sock || conn || client;

        if (!botClient || typeof botClient.groupParticipantsUpdate !== 'function') {
            return reply("❌ Bot client not available. Please try again.");
        }

        try {
            await react("👢");
        } catch (e) {}

        if (!from || !from.endsWith("@g.us")) {
            return reply("❌ This command only works in groups!");
        }

        if (!isAdmins && !isBotOwner) {
            return reply("❌ Only group admins can use this command!");
        }

        if (!isBotAdmins) {
            return reply("❌ Bot needs to be admin to kick users!");
        }

        let target;
        let targetNumber;

        if (msg?.quoted || m?.quoted) {
            const quoted = msg?.quoted || m?.quoted;
            target = quoted.sender || quoted.participant;
            targetNumber = target?.split('@')[0];
        } else if (q) {
            targetNumber = q.replace(/[^0-9]/g, "");
            target = targetNumber + "@s.whatsapp.net";
        } else {
            return reply(`❌ Please specify who to kick!\n\n📝 *Usage:*\n• Reply to a message with .kick\n• Or use: .kick 923xxxxxxxxx`);
        }

        if (!target || !targetNumber) {
            return reply("❌ Could not identify the user to kick!");
        }

        try {
            const groupMeta = await botClient.groupMetadata(from);
            const isTargetAdmin = groupMeta.participants.find(p => 
                p.id === target && (p.admin === 'admin' || p.admin === 'superadmin')
            );

            if (isTargetAdmin && !isBotOwner) {
                return reply("❌ Cannot kick an admin! Demote them first.");
            }

            const botId = botClient.user?.id?.split(':')[0] + '@s.whatsapp.net';
            if (target === botId) {
                return reply("❌ I cannot kick myself!");
            }

            await botClient.groupParticipantsUpdate(from, [target], "remove");
            
            await reply(`╭━━━━━━━━━━━━━━━╮
┃  ✅ *USER KICKED*
┃  ━━━━━━━━━━━━━━━
┃  📱 Number: ${targetNumber}
┃  👤 Status: Removed from group
╰━━━━━━━━━━━━━━━━╯`);

            await react("✅");

        } catch (error) {
            console.error("Kick user error:", error.message);
            
            let errorMsg = "Unknown error occurred";
            if (error.message?.includes("not-authorized")) {
                errorMsg = "Not authorized to remove this user";
            } else if (error.message?.includes("participant")) {
                errorMsg = "User is not in the group";
            }

            await reply(`╭━━━━━━━━━━━━━━━╮
┃  ❌ *FAILED TO KICK*
┃  ━━━━━━━━━━━━━━━
┃  📱 Number: ${targetNumber}
┃  🚫 Error: ${errorMsg}
╰━━━━━━━━━━━━━━━━╯`);
        }
    }
};
