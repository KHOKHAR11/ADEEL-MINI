const config = require("../../config");

module.exports = {
    name: "anticall",
    aliases: ["antical", "blockcall"],
    category: "owner",
    description: "Toggle anti-call feature",

    async execute(context) {
        const { reply, react, args, isOwner, getUserConfig, updateUserConfig } = context;

        try {
            if (!isOwner) {
                return reply("❌ Only the owner can use this command!");
            }

            await react("📵");
            const userConfig = await getUserConfig();
            const currentStatus = userConfig.ANTICALL === 'true';
            const option = args[0]?.toLowerCase();

            if (!option) {
                const statusText = `╭━━━━ *ANTI-CALL SETTINGS* ━━━━╮
┃
┃ 📊 *Current Status:* ${currentStatus ? '✅ ENABLED' : '❌ DISABLED'}
┃
┃ 📝 *Usage:*
┃ • .anticall on - Enable
┃ • .anticall off - Disable
┃
┃ ℹ️ When enabled, bot will
┃ automatically reject all
┃ incoming calls!
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

> © ADEEL-MINI`;
                return reply(statusText);
            }

            if (option === 'on' || option === 'enable' || option === 'true') {
                userConfig.ANTICALL = 'true';
                await updateUserConfig(userConfig);
                await react("✅");
                return reply(`✅ *Anti-Call Enabled!*

All incoming calls will be automatically rejected.

> © ADEEL-MINI`);
            } else if (option === 'off' || option === 'disable' || option === 'false') {
                userConfig.ANTICALL = 'false';
                await updateUserConfig(userConfig);
                await react("❌");
                return reply(`❌ *Anti-Call Disabled!*

Incoming calls will not be automatically rejected.

> © ADEEL-MINI`);
            } else {
                return reply("❌ Invalid option! Use: .anticall on/off");
            }

        } catch (error) {
            console.error("AntiCall error:", error);
            return reply(`❌ Error: ${error.message}`);
        }
    }
};
