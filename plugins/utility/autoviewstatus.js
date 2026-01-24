const config = require("../../config");

module.exports = {
    name: "autoview",
    aliases: ["autoviewstatus", "statusview", "viewstatus"],
    category: "utility",
    description: "Toggle auto view status updates",

    async execute(context) {
        const { reply, react, args, isOwner, getUserConfig, updateUserConfig } = context;

        try {
            await react("👁️");

            if (!isOwner) {
                return reply("❌ Only the owner can use this command!");
            }

            const userConfig = await getUserConfig();
            const currentStatus = userConfig.AUTO_VIEW_STATUS === 'true';
            const option = args[0]?.toLowerCase();

            if (!option) {
                const statusText = `╭━━━━ *AUTO VIEW STATUS* ━━━━╮
┃
┃ 📊 *Current Status:* ${currentStatus ? '✅ ENABLED' : '❌ DISABLED'}
┃
┃ 📝 *Usage:*
┃ • .autoview on - Enable
┃ • .autoview off - Disable
┃
┃ ℹ️ When enabled, bot will
┃ automatically view all
┃ status updates!
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯

> © ADEEL-MINI`;
                return reply(statusText);
            }

            if (option === 'on' || option === 'enable' || option === 'true') {
                userConfig.AUTO_VIEW_STATUS = 'true';
                await updateUserConfig(userConfig);
                await react("✅");
                return reply(`✅ *Auto View Status Enabled!*

Bot will now automatically view all status updates.

> © ADEEL-MINI`);
            } else if (option === 'off' || option === 'disable' || option === 'false') {
                userConfig.AUTO_VIEW_STATUS = 'false';
                await updateUserConfig(userConfig);
                await react("❌");
                return reply(`❌ *Auto View Status Disabled!*

Bot will no longer automatically view status updates.

> © ADEEL-MINI`);
            } else {
                return reply("❌ Invalid option! Use: .autoview on/off");
            }

        } catch (error) {
            console.error("AutoView error:", error);
            return reply(`❌ Error: ${error.message}`);
        }
    }
};
