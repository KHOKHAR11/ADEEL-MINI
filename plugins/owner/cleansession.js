const { cleanupOldSessions, markSessionsInactive } = require("../../lib/userConfigService");

module.exports = {
    name: "cleansession",
    aliases: ["cleanold", "sessionclean"],
    category: "owner",
    description: "Clean old/banned sessions from database",

    async execute(context) {
        const { reply, react, isOwner, args } = context;

        if (!isOwner) return reply("❌ Owner only!");

        try {
            await react?.("🧹");

            const action = args[0]?.toLowerCase();
            const daysOld = parseInt(args[1]) || 30;

            if (action === "cleanup" || !action) {
                const success = await cleanupOldSessions(daysOld);
                
                if (success) {
                    await reply(`✅ *Session Cleanup*\n\nCleaned sessions older than ${daysOld} days`);
                } else {
                    await reply("❌ Cleanup failed (MongoDB not connected)");
                }
            } else {
                await reply(`╭━━━━━━━━━━━━━━━╮
┃  🧹 *SESSION CLEANUP*
┃━━━━━━━━━━━━━━━
┃  📝 *Usage:*
┃  .cleansession
┃  .cleansession cleanup <days>
┃━━━━━━━━━━━━━━━
┃  ℹ️ Removes old sessions
┃  Default: 30 days
╰━━━━━━━━━━━━━━━╯`);
            }

            await react?.("✅");
        } catch (e) {
            console.error("Clean session error:", e.message);
            await reply(`❌ Error: ${e.message?.split('\n')[0]}`);
        }
    }
};
