const config = require("../../config");

module.exports = {
    name: "mode",
    aliases: ["botmode", "setmode"],
    category: "owner",
    description: "Set bot mode (public/private)",

    async execute(context) {
        const { reply, react, args, isOwner, getUserConfig, updateUserConfig } = context;

        try {
            if (!isOwner) {
                return reply("❌ Only the owner can use this command!");
            }

            await react("⚙️");
            const userConfig = await getUserConfig();
            const currentMode = userConfig.MODE || config.MODE || 'public';
            const option = args[0]?.toLowerCase();

            if (!option) {
                const statusText = `╭━━━━ *BOT MODE SETTINGS* ━━━━╮
┃
┃ 📊 *Current Mode:* ${currentMode === 'public' ? '🌐 PUBLIC' : '🔒 PRIVATE'}
┃
┃ 📝 *Usage:*
┃ • .mode public - Everyone
┃ • .mode private - Owner only
┃
┃ ℹ️ *PUBLIC:* All users can
┃ use bot commands.
┃
┃ ℹ️ *PRIVATE:* Only bot owner
┃ can use commands.
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

> © ADEEL-MINI`;
                return reply(statusText);
            }

            if (option === 'public' || option === 'all') {
                userConfig.MODE = 'public';
                await updateUserConfig(userConfig);
                await react("🌐");
                return reply(`🌐 *Bot Mode: PUBLIC*

All users can now use bot commands.

> © ADEEL-MINI`);
            } else if (option === 'private' || option === 'owner') {
                userConfig.MODE = 'private';
                await updateUserConfig(userConfig);
                await react("🔒");
                return reply(`🔒 *Bot Mode: PRIVATE*

Only bot owner can use commands now.

> © ADEEL-MINI`);
            } else {
                return reply("❌ Invalid option! Use: .mode public/private");
            }

        } catch (error) {
            console.error("Mode error:", error);
            return reply(`❌ Error: ${error.message}`);
        }
    }
};
