const fs = require("fs");
const config = require("../../config");

module.exports = {
  name: "help",
  aliases: ["menu", "commands", "list", "cmd"],
  category: "main",
  description: "Show bot command list with beautiful design",

  async execute(context) {
    const { reply, react, getUserConfig, socket, sock, conn, client, from, pushName, m } = context;
    const botClient = socket || sock || conn || client;

    try {
      if (react) await react("📖");
    } catch (e) {}

    const user = await (getUserConfig ? getUserConfig() : Promise.resolve({}));
    const prefix = (user && user.PREFIX) ? user.PREFIX : (config && config.PREFIX) ? config.PREFIX : ".";
    const userName = pushName || "User";
    const founderName = config.FOUNDER_NAME || "ADEEL-MD";
    const botName = config.BOT_NAME || "ADEEL-MINI";

    const uptimeSeconds = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    const caption = `╭━━━━━━━━━━━━━━━╮
┃  🤖 *${botName}*
┃━━━━━━━━━━━━━━━━━
┃  👋 Hello, *${userName}*!
┃  📝 Prefix: *${prefix}*
┃  ⏱️ Uptime: ${hours}h ${minutes}m
┃  👑 Founder: *${founderName}*
╰━━━━━━━━━━━━━━━━━╯

╭━━━━ *📌 MAIN* ━━━━╮
┃ ${prefix}menu
┃ ${prefix}alive
┃ ${prefix}ping
┃ ${prefix}about
┃ ${prefix}owner
┃ ${prefix}uptime
┃ ${prefix}channel
╰━━━━━━━━━━━━━━━━╯

╭━━━━ *👥 GROUP* ━━━━╮
┃ ${prefix}add
┃ ${prefix}kick
┃ ${prefix}promote
┃ ${prefix}demote
┃ ${prefix}admins
┃ ${prefix}tagall
┃ ${prefix}hidetag
┃ ${prefix}open
┃ ${prefix}close
┃ ${prefix}ginfo
┃ ${prefix}welcome
┃ ${prefix}goodbye
┃ ${prefix}warn
┃ ${prefix}mute
┃ ${prefix}unmute
┃ ${prefix}antibot
┃ ${prefix}antispam
╰━━━━━━━━━━━━━━━━╯

╭━━━━ *🤖 AI* ━━━━╮
┃ ${prefix}ai
┃ ${prefix}gpt
┃ ${prefix}gemini
┃ ${prefix}claude
┃ ${prefix}deepseek
┃ ${prefix}codeai
╰━━━━━━━━━━━━━━━━━╯

╭━━━━ *📥 DOWNLOAD* ━━━━╮
┃ ${prefix}play
┃ ${prefix}video
┃ ${prefix}autosong
┃ ${prefix}fb
┃ ${prefix}insta
┃ ${prefix}tiktok
┃ ${prefix}spotify
┃ ${prefix}ytsearch
╰━━━━━━━━━━━━━━━━━━━╯

╭━━━━ *🛠️ UTILITY* ━━━━╮
┃ ${prefix}weather
┃ ${prefix}translate
┃ ${prefix}calc
┃ ${prefix}qr
┃ ${prefix}google
╰━━━━━━━━━━━━━━━━━╯

╭━━━━ *🎉 FUN* ━━━━╮
┃ ${prefix}joke
┃ ${prefix}quote
┃ ${prefix}fact
╰━━━━━━━━━━━━━━━━╯

╭━━━━ *⚙️ OWNER* ━━━━╮
┃ ${prefix}anticall
┃ ${prefix}antiedit
┃ ${prefix}antidelete
┃ ${prefix}antilink
┃ ${prefix}antigroup
┃ ${prefix}settings
┃ ${prefix}mode
┃ ${prefix}setprefix
┃ ${prefix}allvar
┃ ${prefix}broadcast
┃ ${prefix}block
┃ ${prefix}unblock
┃ ${prefix}restart
┃ ${prefix}jid
╰━━━━━━━━━━━━━━━━╯

> © *${founderName}* | ${botName}`;

    const imgPath = "./data/Adeel.jpg";
    const hasImage = fs.existsSync(imgPath);
    const chatId = from || (m && m.chat) || context.chat || null;

    try {
      if (botClient && typeof botClient.sendPresenceUpdate === "function" && chatId) {
        await botClient.sendPresenceUpdate("composing", chatId);
        await new Promise(res => setTimeout(res, 500));
      }
    } catch {}

    try {
      if (hasImage && botClient && typeof botClient.sendMessage === "function" && chatId) {
        await botClient.sendMessage(chatId, {
          image: fs.readFileSync(imgPath),
          caption
        });
      } else if (typeof reply === "function") {
        await reply(caption);
      }
    } catch {
      if (typeof reply === "function") await reply(caption);
    }

    try {
      if (react) await react("✅");
    } catch {}

    try {
      if (botClient && typeof botClient.sendPresenceUpdate === "function" && chatId) {
        await botClient.sendPresenceUpdate("paused", chatId);
      }
    } catch {}
  }
};
