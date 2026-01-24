const config = require("../../config");

module.exports = {
    name: "owner",
    aliases: ["creator", "dev", "support", "contact"],
    category: "main",
    description: "Show owner/founder information with contact details",

    async execute(context) {
        const { reply, react, socket, sock, conn, client, from, pushName } = context;

        try {
            if (react) await react("👑");
        } catch (e) {}

        const founderName = config.FOUNDER_NAME || "ADEEL";
        const botName = config.BOT_NAME || "ADEEL-MINI";
        const ownerNumber = config.OWNER_NUMBER || "923035512967";
        const userName = pushName || "User";

        const caption = `╭━━━━━━━━━━━━━━━╮
┃  👑 *BOT OWNER*
┃  ━━━━━━━━━━━━━━━
┃  👋 Hello, *${userName}*!
╰━━━━━━━━━━━━━━━━╯

╭━━*👤 OWNER INFO* ━━╮
┃
┃  👑 Name: *${founderName}*
┃  🤖 Bot: *${botName}*
┃  📱 WhatsApp: wa.me/${ownerNumber}
┃  📲 Telegram: @ADEEL
┃
╰━━━━━━━━━━━━━━━━━╯

╭━━ *💬 GET SUPPORT* ━━╮
┃
┃  🆘 Need help? Contact owner!
┃  💡 Suggestions welcome
┃  🐛 Report bugs to owner
┃
╰━━━━━━━━━━━━━━━━━╯

╭━━ *🔗 QUICK LINKS* ━━━╮
┃
┃  📢 Channel: ${config.CHANNEL_LINK || 'WhatsApp Channel'}
┃  👥 Group: ${config.GROUP_INVITE_LINK || 'Support Group'}
┃
╰━━━━━━━━━━━━━━━━━━━╯

> © *${founderName}* ッ`;

        const botClient = socket || sock || conn || client || null;
        const chatId = from || (context.m && context.m.chat) || context.chat || null;

        try {
            if (botClient && typeof botClient.sendPresenceUpdate === "function" && chatId) {
                await botClient.sendPresenceUpdate("composing", chatId);
                await new Promise(res => setTimeout(res, 400));
            }
        } catch (err) {}

        try {
            const vcard = [
                'BEGIN:VCARD',
                'VERSION:3.0',
                `FN:${founderName}`,
                `ORG:${botName};`,
                `TEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}`,
                'END:VCARD'
            ].join('\n');

            if (botClient && typeof botClient.sendMessage === "function" && chatId) {
                await botClient.sendMessage(chatId, { text: caption });
                
                await botClient.sendMessage(chatId, {
                    contacts: {
                        displayName: founderName,
                        contacts: [{ vcard }]
                    }
                });
            } else if (typeof reply === "function") {
                await reply(caption);
            }
        } catch (sendErr) {
            try {
                if (typeof reply === "function") await reply(caption);
            } catch (finalErr) {
                console.error("Owner command error:", finalErr.message);
            }
        }

        try {
            if (react) await react("✅");
        } catch (e) {}
    }
};
