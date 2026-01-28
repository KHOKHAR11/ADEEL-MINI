const { cmd } = require("../command");

cmd({
    pattern: "getpp",
    desc: "Get profile picture of mentioned/replied user or by number",
    category: "owner",
    react: "🖼",
    filename: __filename
}, async (conn, m, store, { from, args, reply }) => {
    try {
        let target;

        // 1️⃣ Reply
        if (m.quoted) {
            target = m.quoted.sender;
        }

        // 2️⃣ Mention
        else if (m.mentionedJid && m.mentionedJid.length > 0) {
            target =
                m.mentionedJid.find(jid => jid.endsWith("@s.whatsapp.net")) ||
                m.mentionedJid[0].replace(/@c\.us$/, "@s.whatsapp.net");
        }

        // 3️⃣ Number
        else if (args[0]) {
            let number = args[0].replace(/\D/g, "");
            if (number.length === 11 && number.startsWith("0")) {
                number = "92" + number.slice(1);
            } else if (number.length === 10) {
                number = "92" + number;
            }
            target = number + "@s.whatsapp.net";
        }

        // 4️⃣ Default (sender)
        else {
            target = m.sender;
        }

        if (!target) {
            return reply("❌ Please mention a user, reply to a message, or provide a number");
        }

        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(target, "image");
        } catch {
            return reply("❌ Couldn't fetch profile picture. It may be private or not set.");
        }

        await conn.sendMessage(from, {
            image: { url: ppUrl },
            caption: `🖼 Profile picture of @${target.split("@")[0]}`,
            mentions: [target]
        }, { quoted: m });

    } catch (error) {
        console.error("[GETPP ERROR]", error);
        reply("❌ An error occurred while fetching the profile picture");
    }
});