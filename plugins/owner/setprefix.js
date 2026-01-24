const config = require("../../config");

module.exports = {
    name: "setprefix",
    aliases: ["prefix", "changeprefix"],
    category: "owner",
    description: "Change bot command prefix",

    async execute(context) {
        const { reply, react, args, isOwner, getUserConfig, updateUserConfig } = context;

        try {
            if (!isOwner) {
                return reply("❌ Only the owner can use this command!");
            }

            await react("⚙️");
            const userConfig = await getUserConfig();
            const currentPrefix = userConfig.PREFIX || config.PREFIX || '.';
            const newPrefix = args[0];

            if (!newPrefix) {
                const statusText = `╭━━━━ *PREFIX SETTINGS* ━━━━╮
┃
┃ 📊 *Current Prefix:* ${currentPrefix}
┃
┃ 📝 *Usage:*
┃ • .setprefix ! - Set to !
┃ • .setprefix . - Set to .
┃ • .setprefix # - Set to #
┃
┃ ℹ️ Prefix must be 1-2
┃ characters only!
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

> © ADEEL-MINI`;
                return reply(statusText);
            }

            if (newPrefix.length > 2) {
                return reply("❌ Prefix must be 1-2 characters only!");
            }

            userConfig.PREFIX = newPrefix;
            await updateUserConfig(userConfig);
            await react("✅");
            return reply(`✅ *Prefix Changed!*

New prefix: *${newPrefix}*
Example: ${newPrefix}menu

> © ADEEL-MINI`);

        } catch (error) {
            console.error("SetPrefix error:", error);
            return reply(`❌ Error: ${error.message}`);
        }
    }
};
