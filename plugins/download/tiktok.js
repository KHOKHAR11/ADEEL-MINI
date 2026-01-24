const axios = require("axios");

module.exports = {
    name: "tiktok",
    aliases: ["tt", "ttdl", "tiktokdl"],
    category: "download",

    async execute(context) {
        const { reply, react, q, sock, from, m } = context;

        if (!q) return reply(`❌ Provide a TikTok URL`);

        await react("🎬");

        try {
            const api = `https://edith-apis.vercel.app/download/tiktok?url=${encodeURIComponent(q)}`;
            const { data } = await axios.get(api);

            if (!data.status) return reply(`❌ Invalid URL`);

            const r = data.result;

            // Preview message with metadata
            const info = `🥏 ≡ TIKTOK DOWNLOADER ≡

➠ | *Title* : ${r.description || "N/A"}
➠ | *Region* : ${r.region || "N/A"}
➠ | *Duration* : ${r.duration || "N/A"}
➠ | *Url* : ${q}

© ADEEL-MINI`;

            await sock.sendMessage(from, { text: info }, { quoted: m });

            // List Menu
            const listMessage = {
                title: "Click Here",
                text: "Select Format",
                footer: "Zaynix-PRIME",
                buttonText: "CLICK HERE",
                sections: [
                    {
                        title: "TikTok Format Options",
                        rows: [
                            {
                                title: "No Watermark",
                                rowId: `.nowm ${q}`
                            },
                            {
                                title: "No Watermark HD",
                                rowId: `.nowm_hd ${q}`
                            },
                            {
                                title: "With Watermark",
                                rowId: `.wm ${q}`
                            },
                            {
                                title: "Audio Only",
                                rowId: `.audio ${q}`
                            }
                        ]
                    }
                ]
            };

            await sock.sendMessage(from, listMessage, { quoted: m });

            // Button Under It
            await sock.sendMessage(from, {
                buttons: [
                    {
                        buttonId: `Adeel${Date.now()}`,
                        buttonText: { displayText: "Adeel-md" },
                        type: 1
                    }
                ],
                text: "~ Done!"
            }, { quoted: m });

            await react("✅");

        } catch (err) {
            await react("❌");
            reply(`❌ ${err.message}`);
        }
    }
};
