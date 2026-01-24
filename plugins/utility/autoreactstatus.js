const config = require("../../config");

module.exports = {
    name: "autoreact",
    aliases: ["autoreactstatus", "statusreact", "reactstatus"],
    category: "utility",
    description: "Toggle auto react to status updates",

    async execute(context) {
        const { reply, react, args, isOwner, getUserConfig, updateUserConfig } = context;

        try {
            await react("⚙️");

            if (!isOwner) {
                return reply("❌ Only the owner can use this command!");
            }

            const userConfig = await getUserConfig();
            const currentStatus = userConfig.AUTO_LIKE_STATUS === 'true';
            const option = args[0]?.toLowerCase();

            if (!option) {
                const statusText = `╭━━━━ *AUTO REACT STATUS* ━━━━╮
┃
┃ 📊 *Current Status:* ${currentStatus ? '✅ ENABLED' : '❌ DISABLED'}
┃
┃ 📝 *Usage:*
┃ • .autoreact on - Enable
┃ • .autoreact off - Disable
┃
┃ ℹ️ When enabled, bot will
┃ automatically react to all
┃ status updates with random
┃ emojis!
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯

> © ADEEL-MINI`;
                return reply(statusText);
            }

            if (option === 'on' || option === 'enable' || option === 'true') {
                userConfig.AUTO_LIKE_STATUS = 'true';
                await updateUserConfig(userConfig);
                await react("✅");
                return reply(`✅ *Auto React Status Enabled!*

Bot will now automatically react to all status updates with random emojis.

> © ADEEL-MINI`);
            } else if (option === 'off' || option === 'disable' || option === 'false') {
                userConfig.AUTO_LIKE_STATUS = 'false';
                await updateUserConfig(userConfig);
                await react("❌");
                return reply(`❌ *Auto React Status Disabled!*

Bot will no longer automatically react to status updates.

> © ADEEL-MINI`);
            } else {
                return reply("❌ Invalid option! Use: .autoreact on/off");
            }

        } catch (error) {
            console.error("AutoReact error:", error);
            return reply(`❌ Error: ${error.message}`);
        }
    }
};
