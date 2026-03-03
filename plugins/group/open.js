module.exports = {
    name: "open",
    aliases: [],
    category: "group",
    description: "Open the group",

    async execute(context) {
        const { reply, react, socket, from, isAdmins, isBotAdmins } = context;

        try {
            await react("🔓");
            
            if (!isAdmins) {
                return reply("❌ *Only group admins can open the group!*\n\n> © ADEEL-MINI");
            }
            
            if (!isBotAdmins) {
                return reply("❌ *Bot needs to be admin to open the group.*\n\n> © ADEEL-MINI");
            }
            
            await socket.groupSettingUpdate(from, "not_announcement");
            await reply("🔓 *Group is now OPEN.*\n\nEveryone can send messages.\n\n> © ADEEL-MINI");
        } catch (error) {
            console.error("Open group error:", error.message);
            await reply(`❌ *Error opening group:* ${error.message || 'Unknown error'}\n\n> © ADEEL-MINI`);
        }
    }
};
