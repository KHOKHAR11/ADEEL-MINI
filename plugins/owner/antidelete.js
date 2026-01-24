const config = require("../../config");

module.exports = {
    name: "antidelete",
    aliases: ["ad", "trackdelete"],
    category: "owner",
    description: "Toggle anti-delete feature",

    async execute(context) {
        const { reply, react, args, isOwner, getUserConfig, updateUserConfig } = context;

        try {
            if (!isOwner) {
                return reply("❌ Only the owner can use this command!");
            }

            await react("🗑️");
            const userConfig = await getUserConfig();
            const currentStatus = userConfig.ANTIDELETE || 'false';
            const option = args[0]?.toLowerCase();

            if (!option) {
                const modeText = currentStatus === 'private' ? '🔒 PRIVATE' : 
                               currentStatus === 'chat' ? '💬 CHAT' : '❌ OFF';
                const statusText = `╭━━━━ *ANTI-DELETE SETTINGS* ━━━━╮
┃
┃ 📊 *Current Status:* ${currentStatus !== 'false' ? '✅ ENABLED' : '❌ DISABLED'}
┃ 📍 *Mode:* ${modeText}
┃
┃ 📝 *Usage:*
┃ • .antidelete on - Chat mode
┃ • .antidelete private - Owner only
┃ • .antidelete off - Disable
┃
┃ ℹ️ Deleted messages will be
┃ forwarded based on mode!
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

> © ADEEL-MINI`;
                return reply(statusText);
            }

            if (option === 'on' || option === 'enable' || option === 'chat') {
                userConfig.ANTIDELETE = 'chat';
                await updateUserConfig(userConfig);
                await react("✅");
                return reply(`✅ *Anti-Delete Enabled (CHAT MODE)!*

Deleted messages will be forwarded to the same chat.

> © ADEEL-MINI`);
            } else if (option === 'private' || option === 'dm') {
                userConfig.ANTIDELETE = 'private';
                await updateUserConfig(userConfig);
                await react("🔒");
                return reply(`🔒 *Anti-Delete Enabled (PRIVATE MODE)!*

Deleted messages will be forwarded to bot owner only.

> © ADEEL-MINI`);
            } else if (option === 'off' || option === 'disable' || option === 'false') {
                userConfig.ANTIDELETE = 'false';
                await updateUserConfig(userConfig);
                await react("❌");
                return reply(`❌ *Anti-Delete Disabled!*

Deleted messages will not be tracked.

> © ADEEL-MINI`);
            } else {
                return reply("❌ Invalid option! Use: .antidelete on/private/off");
            }

        } catch (error) {
            console.error("AntiDelete error:", error);
            return reply(`❌ Error: ${error.message}`);
        }
    }
};
