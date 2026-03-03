const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "githubstalk",
    aliases: ["ghs", "ghstalk", "gitstalk", "github"],
    category: "main",
    description: "Stalk GitHub user profile",

    async execute(context) {
        const { reply, react, q, sock, from, m } = context;

        if (!q) {
            return reply(`╭──▧ *ADEEL GITHUB STALK* ▧──╮
│
│ ❌ Please provide a GitHub username
│
│ *Usage:* .githubstalk <username>
│
│ *Example:*
│ .githubstalk octocat
│
╰────────────────────────────╯
> © ADEEL-MINI`);
        }

        await react("🔍");

        try {
            const apiUrl = `https://www.zaynix.zone.id/api/githubstalk?username=${encodeURIComponent(q)}`;
            const { data } = await axios.get(apiUrl, { timeout: 30000 });

            if (!data || !data.success) {
                return reply(`╭──▧ *ADEEL GITHUB STALK* ▧──╮
│
│ ❌ User "${q}" not found
│
╰────────────────────────────╯
> © ADEEL-MINI`);
            }

            const user = data.result || data.data || data;
            const name = user.name || user.login || q;
            const username = user.login || user.username || q;
            const bio = user.bio || "No bio";
            const location = user.location || "Not specified";
            const company = user.company || "Not specified";
            const blog = user.blog || "Not specified";
            const followers = user.followers || 0;
            const following = user.following || 0;
            const repos = user.public_repos || user.repos || 0;
            const gists = user.public_gists || user.gists || 0;
            const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A";
            const avatar = user.avatar_url || user.avatar;

            const caption = `╭──▧ *ADEEL GITHUB STALK* ▧──╮
│
│ 👤 *Name:* ${name}
│ 📛 *Username:* @${username}
│ 📝 *Bio:* ${bio}
│ 📍 *Location:* ${location}
│ 🏢 *Company:* ${company}
│ 🌐 *Blog:* ${blog}
│
├────────────────────────────┤
│
│ 👥 *Followers:* ${followers}
│ 👣 *Following:* ${following}
│ 📦 *Repositories:* ${repos}
│ 📋 *Gists:* ${gists}
│ 📅 *Joined:* ${createdAt}
│
│ 🔗 github.com/${username}
│
╰────────────────────────────╯
> © ADEEL-MINI`;

            await sock.sendMessage(from, {
                image: { url: config.XD_IMAGE_PATH },
                caption: caption
            }, { quoted: m });

            await react("✅");

        } catch (error) {
            console.error("GitHub stalk error:", error.message);
            await react("❌");
            return reply(`╭──▧ *ADEEL GITHUB STALK* ▧──╮
│
│ ❌ Error: ${error.message}
│
╰────────────────────────────╯
> © ADEEL-MINI`);
        }
    }
};
