module.exports = {
    name: "add",
    aliases: ["adduser"],
    category: "group",
    description: "Add a user to the group",

    async execute(context) {
        const { reply, react, socket, sock, conn, client, msg, q, from, isAdmins, isBotAdmins, isBotOwner } = context;
        const botClient = socket || sock || conn || client;

        if (!botClient || typeof botClient.groupParticipantsUpdate !== 'function') {
            return reply("❌ Bot client not available. Please try again.");
        }

        try {
            await react("➕");
        } catch (e) {}

        if (!from || !from.endsWith("@g.us")) {
            return reply("❌ This command only works in groups!");
        }

        if (!isAdmins && !isBotOwner) {
            return reply("❌ Only group admins can use this command!");
        }

        if (!isBotAdmins) {
            return reply("❌ Bot needs to be admin to add users!");
        }

        const number = q ? q.replace(/[^0-9]/g, "") : "";
        if (!number) {
            return reply(`❌ Please provide a phone number!\n\n📝 *Usage:* .add 923xxxxxxxxx\n💡 Include country code without + or spaces`);
        }

        if (number.length < 10 || number.length > 15) {
            return reply("❌ Invalid phone number! Please check the format.");
        }

        const jid = number + "@s.whatsapp.net";

        try {
            const [result] = await botClient.onWhatsApp(jid);
            
            if (!result?.exists) {
                return reply(`❌ Number ${number} is not registered on WhatsApp!`);
            }

            await botClient.groupParticipantsUpdate(from, [jid], "add");
            
            await reply(`╭━━━━━━━━━━━━━━━╮
┃  ✅ *USER ADDED*
┃  ━━━━━━━━━━━━━━━
┃  📱 Number: ${number}
┃  👤 Status: Added successfully
╰━━━━━━━━━━━━━━━━╯`);

            await react("✅");

        } catch (error) {
            console.error("Add user error:", error.message);
            
            let errorMsg = "Unknown error occurred";
            if (error.message?.includes("not-authorized")) {
                errorMsg = "User has privacy settings that prevent adding";
            } else if (error.message?.includes("conflict")) {
                errorMsg = "User is already in the group";
            } else if (error.message?.includes("forbidden")) {
                errorMsg = "Bot doesn't have permission to add users";
            }

            await reply(`╭━━━━━━━━━━━━━━━╮
┃  ❌ *FAILED TO ADD*
┃  ━━━━━━━━━━━━━━━
┃  📱 Number: ${number}
┃  🚫 Error: ${errorMsg}
╰━━━━━━━━━━━━━━━━╯`);
        }
    }
};
