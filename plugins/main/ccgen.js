const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "ccgen",
    aliases: ["vcc", "gencc", "creditcard"],
    category: "main",
    description: "Generate virtual credit card for testing",

    async execute(context) {
        const { reply, react, q, sock, from, m, isOwner } = context;

        if (!isOwner) {
            return reply(`╭──▧ *ZAYNIX CCGEN* ▧──╮
│
│ ❌ Owner Only Command
│
╰────────────────────────╯
> © ADEEL-MINI`);
        }

        await react("💳");

        try {
            const bin = q || "";
            const apiUrl = bin 
                ? `https://www.zaynix.zone.id/api/vcc?bin=${encodeURIComponent(bin)}`
                : `https://www.zaynix.zone.id/api/vcc`;
            
            const { data } = await axios.get(apiUrl, { timeout: 30000 });

            if (!data || !data.success) {
                return reply(`╭──▧ *ADEEL CCGEN* ▧──╮
│
│ ❌ Failed to generate card
│
╰────────────────────────╯
> © ADEEL-MINI`);
            }

            const result = data.result || data.data || data;
            const cards = Array.isArray(result) ? result : [result];

            let cardInfo = `╭──▧ *ADEEL CCGEN* ▧──╮
│
│ 💳 *Virtual Cards Generated*
│\n`;

            for (let i = 0; i < Math.min(cards.length, 10); i++) {
                const card = cards[i];
                const number = card.number || card.cc || card.card || "";
                const expiry = card.expiry || card.exp || `${card.month || "XX"}/${card.year || "XXXX"}`;
                const cvv = card.cvv || card.cvc || "XXX";
                const brand = card.brand || card.type || "Unknown";

                cardInfo += `│ *${i + 1}.* ${number}
│    📅 ${expiry} | 🔐 ${cvv}
│    🏷️ ${brand}
│\n`;
            }

            cardInfo += `╰────────────────────────╯

⚠️ *For Testing Purposes Only*

> © ADEEL-MINI`;

            await sock.sendMessage(from, {
                image: { url: config.XD_IMAGE_PATH },
                caption: cardInfo
            }, { quoted: m });

            await react("✅");

        } catch (error) {
            console.error("CCGen error:", error.message);
            await react("❌");
            return reply(`╭──▧ *ADEEL CCGEN* ▧──╮
│
│ ❌ Error: ${error.message}
│
╰────────────────────────╯
> © ADEEL-MINI ッ`);
        }
    }
};
