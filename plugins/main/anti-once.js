const { cmd } = require("../command");

cmd({
    pattern: "vv2",
    alias: ["wah", "💋", "❤️", "✌", "nice", "ok"],
    desc: "Owner Only - retrieve quoted view once message",
    category: "owner",
    filename: __filename
}, async (conn, m, store, { from, isCreator, reply }) => {
    try {
        if (!isCreator) return;

        if (!m.quoted) {
            return reply("*🍁 Please reply to a view once message!*");
        }

        const buffer = await m.quoted.download();
        const mtype = m.quoted.mtype;

        let messageContent = {};

        switch (mtype) {
            case "imageMessage":
                messageContent = {
                    image: buffer,
                    caption: m.quoted.text || "",
                    mimetype: m.quoted.mimetype || "image/jpeg"
                };
                break;

            case "videoMessage":
                messageContent = {
                    video: buffer,
                    caption: m.quoted.text || "",
                    mimetype: m.quoted.mimetype || "video/mp4"
                };
                break;

            case "audioMessage":
                messageContent = {
                    audio: buffer,
                    mimetype: "audio/mp4",
                    ptt: m.quoted.ptt || false
                };
                break;

            default:
                return reply("❌ Only image, video, and audio messages are supported");
        }

        // Send recovered message to owner's DM
        await conn.sendMessage(m.sender, messageContent, { quoted: m });

    } catch (error) {
        console.error("[VV2 ERROR]", error);
        reply("❌ Error fetching vv message:\n" + error.message);
    }
});