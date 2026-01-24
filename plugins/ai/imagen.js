const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "imagen",
    aliases: ["txt2img", "ai2img", "generateimg", "aiimage"],
    category: "ai",
    description: "Generate images from text using AI",

    async execute(context) {
        const { reply, react, q, sock, from, m } = context;

        if (!q) {
            return reply(`╭──▧ *ADEEL MINI* ▧──╮
│
│ ❌ Please provide a prompt
│
│ *Usage:* .imagen <prompt>
│
│ *Example:*
│ .imagen A beautiful sunset
│ .imagen Cyberpunk city at night
│
╰────────────────────────╯
> © ADEEL-MINI ッ`);
        }

        await react("🎨");
        await reply(`╭──▧ *ADEEL MINI* ▧──╮
│
│ 🎨 Generating image...
│ ⏳ Please wait
│
│ *Prompt:* ${q.slice(0, 50)}...
│
╰────────────────────────╯
> © ADEEL-MINI ッ`);

        try {
            const apiUrl = `https://www.zaynix.zone.id/api/txt2img?prompt=${encodeURIComponent(q)}`;
            const { data } = await axios.get(apiUrl, { timeout: 120000 });

            if (!data || !data.success) {
                return reply(`╭──▧ *ADEEL MINI* ▧──╮
│
│ ❌ Failed to generate image
│
╰────────────────────────╯
> © ADEE-MINI ッ`);
            }

            const imageUrl = data.result || data.image || data.url || data.data;

            if (!imageUrl) {
                return reply(`╭──▧ *ADEEL MINI* ▧──╮
│
│ ❌ No image was generated
│
╰────────────────────────╯
> © Zaynix-PRIME ッ`);
            }

            const caption = `╭──▧ *ZAYNIX IMAGEN* ▧──╮
│
│ 🎨 *AI Generated Image*
│
│ 📝 *Prompt:* ${q}
│
╰────────────────────────╯
> © ADEEL-MINI ッ`;

            await sock.sendMessage(from, {
                image: { url: imageUrl },
                caption: caption
            }, { quoted: m });

            await react("✅");

        } catch (error) {
            console.error("Imagen error:", error.message);
            await react("❌");
            return reply(`╭──▧ *ADEEL MINI* ▧──╮
│
│ ❌ Error: ${error.message}
│
╰────────────────────────╯
> © ADEEL-MINI ッ`);
        }
    }
};
