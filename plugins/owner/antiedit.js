const config = require("../../config");

module.exports = {
    name: "antiedit",
    aliases: ["ae", "trackedit"],
    category: "owner",
    description: "Toggle anti-edit feature",

    async execute(context) {
        const { reply, react, args, isOwner, getUserConfig, updateUserConfig } = context;

        try {
            if (!isOwner) {
                return reply("❌ Only the owner can use this command!");
            }

            await react("✏️");
            const userConfig = await getUserConfig();
            const currentStatus = userConfig.ANTIEDIT || 'false';
            const option = args[0]?.toLowerCase();

            if (!option) {
                const modeText = currentStatus === 'private' ? '🔒 PRIVATE' : 
                               currentStatus === 'chat' ? '💬 CHAT' : '❌ OFF';
                const statusText = `╭━━━━ *ANTI-EDIT SETTINGS* ━━━━╮
┃
┃ 📊 *Current Status:* ${currentStatus !== 'false' ? '✅ ENABLED' : '❌ DISABLED'}
┃ 📍 *Mode:* ${modeText}
┃
┃ 📝 *Usage:*
┃ • .antiedit on - Chat mode
┃ • .antiedit private - Owner only
┃ • .antiedit off - Disable
┃
┃ ℹ️ Edited messages will be
┃ forwarded based on mode!
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

> © ADEEL-MINI`;
                return reply(statusText);
            }

            if (option === 'on' || option === 'enable' || option === 'chat') {
                userConfig.ANTIEDIT = 'chat';
                await updateUserConfig(userConfig);
                await react("✅");
                return reply(`✅ *Anti-Edit Enabled (CHAT MODE)!*

Edited messages will be forwarded to the same chat.

> © ADEEL-MINI`);
            } else if (option === 'private' || option === 'dm') {
                userConfig.ANTIEDIT = 'private';
                await updateUserConfig(userConfig);
                await react("🔒");
                return reply(`🔒 *Anti-Edit Enabled (PRIVATE MODE)!*

Edited messages will be forwarded to bot owner only.

> © ADEEL-MINI`);
            } else if (option === 'off' || option === 'disable' || option === 'false') {
                userConfig.ANTIEDIT = 'false';
                await updateUserConfig(userConfig);
                await react("❌");
                return reply(`❌ *Anti-Edit Disabled!*

Edited messages will not be tracked.

> © ADEEL-MINI`);
            } else {
                return reply("❌ Invalid option! Use: .antiedit on/private/off");
            }

        } catch (error) {
            console.error("AntiEdit error:", error);
            return reply(`❌ Error: ${error.message}`);
        }
    }
};
