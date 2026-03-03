const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "web2zip",
    aliases: ["sabtowab", "websitedl", "webdl"],
    category: "main",
    description: "Convert website to ZIP file",

    async execute(context) {
        const { reply, react, q, sock, from, m } = context;

        if (!q) {
            return reply(`╭──▧ *ADEEL WEB2ZIP* ▧──╮
│
│ ❌ Please provide a website URL
│
│ *Usage:* .web2zip <url>
│
│ *Example:*
│ .web2zip https://example.com
│
╰────────────────────────╯
> © ADEEL-MINI`);
        }

        await react("🌐");
        await reply(`╭──▧ *ADEEL WEB2ZIP* ▧──╮
│
│ 🌐 Converting website to ZIP...
│ ⏳ Please wait
│
│ *URL:* ${q.slice(0, 50)}
│
╰────────────────────────╯
> © ADEEL-MINI`);

        try {
            const apiUrl = `https://www.zaynix.zone.id/api/web2zip?url=${encodeURIComponent(q)}`;
            const { data } = await axios.get(apiUrl, { timeout: 120000 });

            if (!data || !data.success) {
                return reply(`╭──▧ *ADEEL WEB2ZIP* ▧──╮
│
│ ❌ Failed to convert website
│
╰────────────────────────╯
> © ADEEL-MINI`);
            }

            const result = data.result || data.data || data;
            const downloadUrl = result.download || result.url || result.zip;
            const fileName = result.filename || `website_${Date.now()}.zip`;

            if (!downloadUrl) {
                return reply(`╭──▧ *ADEEL WEB2ZIP* ▧──╮
│
│ ❌ No download link found
│
╰────────────────────────╯
> © ADEEL-MINI`);
            }

            await sock.sendMessage(from, {
                document: { url: downloadUrl },
                mimetype: "application/zip",
                fileName: fileName,
                caption: `╭──▧ *ADEEL WEB2ZIP* ▧──╮
│
│ ✅ *Website Downloaded*
│
│ 🌐 *URL:* ${q}
│ 📁 *File:* ${fileName}
│
╰────────────────────────╯
> © ADEEL-MINI`
            }, { quoted: m });

            await react("✅");

        } catch (error) {
            console.error("Web2Zip error:", error.message);
            await react("❌");
            return reply(`╭──▧ *ADEEL WEB2ZIP* ▧──╮
│
│ ❌ Error: ${error.message}
│
╰────────────────────────╯
> © ADEEL-MINI`);
        }
    }
};
