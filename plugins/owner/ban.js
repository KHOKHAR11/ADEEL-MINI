const fs = require("fs");

module.exports = {
    name: "ban",
    aliases: ["block"],
    category: "owner",
    description: "Ban a user from using the bot",

    async execute(context) {
        const { reply, react, args, msg, isOwner, q } = context;

        try {
            if (!isOwner) {
                return reply("❌ Only the owner can use this command!");
            }

            await react("🚫");

            let target;
            if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
                target = msg.message.extendedTextMessage.contextInfo.participant;
            } else if (q) {
                target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
            } else {
                return reply(`❌ Please reply to a message or provide a number!

Usage: .ban 923XXXXXXXXX
Or reply to someone's message with .ban`);
            }

            const banPath = "./lib/ban.json";
            let bannedUsers = [];
            
            try {
                if (fs.existsSync(banPath)) {
                    bannedUsers = JSON.parse(fs.readFileSync(banPath, "utf-8"));
                }
            } catch {}

            if (bannedUsers.includes(target)) {
                return reply(`⚠️ User @${target.split('@')[0]} is already banned!`, { mentions: [target] });
            }

            bannedUsers.push(target);
            fs.writeFileSync(banPath, JSON.stringify(bannedUsers, null, 2));

            await react("✅");
            return reply(`🚫 *User Banned!*

@${target.split('@')[0]} has been banned from using the bot.

Use .unban to remove the ban.

> © ADEEL-MINI`, { mentions: [target] });

        } catch (error) {
            console.error("Ban error:", error);
            return reply(`❌ Error: ${error.message}`);
        }
    }
};
