module.exports = {
    name: "close",
    aliases: [],
    category: "group",
    description: "Close the group",

    async execute(context) {
        const { reply, react, socket, from, isAdmins, isBotAdmins } = context;

        try {
            await react("🔒");
            
            if (!isAdmins) {
                return reply("❌ *Only group admins can close the group!*\n\n> © ADEEL-MINI");
            }
            
            if (!isBotAdmins) {
                return reply("❌ *Bot needs to be admin to close the group.*\n\n> © ADEEL-MINI");
            }
            
            await socket.groupSettingUpdate(from, "announcement");
            await reply("🔒 *Group is now CLOSED.*\n\nOnly admins can send messages.\n\n> © ADEEL-MINI");
        } catch (error) {
            console.error("Close group error:", error.message);
            await reply(`❌ *Error closing group:* ${error.message || 'Unknown error'}\n\n> © ADEEL-MINI`);
        }
    }
};
