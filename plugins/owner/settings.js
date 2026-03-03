const config = require("../../config");

module.exports = {
    name: "settings",
    aliases: ["botsettings", "config"],
    category: "owner",
    description: "View all bot settings",

    async execute(context) {
        const { reply, react, isOwner, getUserConfig, number } = context;

        try {
            if (!isOwner) {
                return reply("❌ Only the owner can use this command!");
            }

            await react("⚙️");
            const userConfig = await getUserConfig();
            
            const settings = {
                prefix: userConfig.PREFIX || config.PREFIX || '.',
                mode: userConfig.MODE || config.MODE || 'public',
                anticall: userConfig.ANTICALL === 'true' ? '✅' : '❌',
                antiedit: userConfig.ANTIEDIT !== 'false' ? `✅ (${userConfig.ANTIEDIT})` : '❌',
                antidelete: userConfig.ANTIDELETE !== 'false' ? `✅ (${userConfig.ANTIDELETE})` : '❌',
                autoview: userConfig.AUTO_VIEW_STATUS === 'true' ? '✅' : '❌',
                autoreact: userConfig.AUTO_LIKE_STATUS === 'true' ? '✅' : '❌',
            };

            const statusText = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃  ⚙️ *BOT SETTINGS*
┃━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ 📱 *Number:* ${number || 'Unknown'}
┃━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ 🎯 *Prefix:* ${settings.prefix}
┃ 🌐 *Mode:* ${settings.mode === 'public' ? '🌐 PUBLIC' : '🔒 PRIVATE'}
┃━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ 📵 *Anti-Call:* ${settings.anticall}
┃ ✏️ *Anti-Edit:* ${settings.antiedit}
┃ 🗑️ *Anti-Delete:* ${settings.antidelete}
┃━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ 👁️ *Auto View Status:* ${settings.autoview}
┃ 💝 *Auto React Status:* ${settings.autoreact}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📝 *Available Commands:*
• .anticall on/off
• .antiedit on/private/off
• .antidelete on/private/off
• .autoview on/off
• .autoreact on/off
• .mode public/private
• .setprefix <prefix>

> © ADEEL-MINI`;

            await react("✅");
            return reply(statusText);

        } catch (error) {
            console.error("Settings error:", error);
            return reply(`❌ Error: ${error.message}`);
        }
    }
};
