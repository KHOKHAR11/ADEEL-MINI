module.exports = {
    name: "demote",
    aliases: ["removeadmin"],
    category: "group",
    description: "Demote admin to regular member",

    async execute(context) {
        const { reply, react, socket, sock, conn, client, msg, m, from, q, isAdmins, isBotAdmins, isBotOwner } = context;
        const botClient = socket || sock || conn || client;

        if (!botClient || typeof botClient.groupParticipantsUpdate !== 'function') {
            return reply("❌ Bot client not available. Please try again.");
        }

        try {
            await react("⬇️");
        } catch (e) {}

        if (!from || !from.endsWith("@g.us")) {
            return reply("❌ This command only works in groups!");
        }

        if (!isAdmins && !isBotOwner) {
            return reply("❌ Only group admins can use this command!");
        }

        if (!isBotAdmins) {
            return reply("❌ Bot needs to be admin to demote users!");
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
            return reply(`❌ Please specify who to demote!\n\n📝 *Usage:*\n• Reply to a message with .demote\n• Or use: .demote 923xxxxxxxxx`);
        }

        if (!target || !targetNumber) {
            return reply("❌ Could not identify the user to demote!");
        }

        try {
            await botClient.groupParticipantsUpdate(from, [target], "demote");
            
            await reply(`╭━━━━━━━━━━━━━━━╮
┃  ✅ *USER DEMOTED*
┃  ━━━━━━━━━━━━━━━
┃  📱 Number: ${targetNumber}
┃  👤 Status: Now a member
╰━━━━━━━━━━━━━━━━╯

> © ADEEL-MINI`);

            await react("✅");

        } catch (error) {
            console.error("Demote error:", error.message);
            let errorMsg = error.message;
            if (error.message.includes('not-authorized')) {
                errorMsg = 'User has privacy settings that prevent demotion';
            } else if (error.message.includes('not-admin')) {
                errorMsg = 'User is not an admin to demote';
            }
            
            await reply(`╭━━━━━━━━━━━━━━━╮
┃  ❌ *DEMOTION FAILED*
┃  ━━━━━━━━━━━━━━━
┃  📱 Number: ${targetNumber}
┃  🚫 Reason: ${errorMsg}
╰━━━━━━━━━━━━━━━━╯

> © ADEEL-MINI`);
        }
    }
};
