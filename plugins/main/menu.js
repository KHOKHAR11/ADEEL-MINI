const fs = require("fs");
const config = require("../../config");

module.exports = {
  name: "help",
  aliases: ["menu", "commands", "list", "cmd"],
  category: "main",
  description: "Show bot command list with full menu in custom font, all bold",

  async execute(context) {
    const { reply, react, getUserConfig, socket, sock, conn, client, from, pushName, m } = context;
    const botClient = socket || sock || conn || client;

    try { if (react) await react("📂"); } catch (e) {}

    const user = await (getUserConfig ? getUserConfig() : Promise.resolve({}));
    const prefix = (user && user.PREFIX) ? user.PREFIX : (config && config.PREFIX) ? config.PREFIX : ".";
    const userName = pushName || "User";
    const founderName = config.FOUNDER_NAME || "ADEEL";
    const botName = config.BOT_NAME || "ADEEL-MINI";

    const uptimeSeconds = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    const caption = `
『 *${botName.toUpperCase()}* 』

*╭───〔 👤 ᴜsᴇʀ ɪɴғᴏ 〕───┈⊷*
│ ⚡ *User:* *${userName}*
│ 🌀 *Prefix:* *${prefix}*
│ ⏳ *Uptime:* *${hours}h ${minutes}m*
╰────────────────┈⊷

*┏━━〔 💠 𝐌𝐀𝐈𝐍 〕*
┃ ❍ *${prefix}ᴀʟɪᴠᴇ*
┃ ❍ *${prefix}ᴘɪɴɢ*
┃ ❍ *${prefix}ᴀʙᴏᴜᴛ*
┃ ❍ *${prefix}ᴏᴡɴᴇʀ*
┃ ❍ *${prefix}ᴜᴘᴛɪᴍᴇ*
┃ ❍ *${prefix}ᴄʜᴀɴɴᴇʟ*
┗━━━━━━━━━━━━┛

*┏━━〔 👥 𝐆𝐑𝐎𝐔𝐏 〕*
┃ ❍ *${prefix}ᴀᴅᴅ*
┃ ❍ *${prefix}ᴋɪᴄᴋ*
┃ ❍ *${prefix}ᴘʀᴏᴍᴏᴛᴇ*
┃ ❍ *${prefix}ᴅᴇᴍᴏᴛᴇ*
┃ ❍ *${prefix}ᴀᴅᴍɪɴs*
┃ ❍ *${prefix}ᴛᴀɢᴀʟʟ*
┃ ❍ *${prefix}ʜɪᴅᴇᴛᴀɢ*
┃ ❍ *${prefix}ᴏᴘᴇɴ*
┃ ❍ *${prefix}ᴄʟᴏsᴇ*
┃ ❍ *${prefix}ɢɪɴғᴏ*
┃ ❍ *${prefix}ᴡᴇʟᴄᴏᴍᴇ*
┃ ❍ *${prefix}ɢᴏᴏᴅʙʏᴇ*
┃ ❍ *${prefix}ᴡᴀʀɴ*
┃ ❍ *${prefix}ᴍᴜᴛᴇ*
┃ ❍ *${prefix}ᴜɴᴍᴜᴛᴇ*
┃ ❍ *${prefix}ᴀɴᴛɪʙᴏᴛ*
┃ ❍ *${prefix}ᴀɴᴛɪsᴘᴀᴍ*
┗━━━━━━━━━━━━┛

*┏━━〔 🤖 𝐀𝐈 𝐓𝐎𝐎𝐋𝐒 〕*
┃ ❍ *${prefix}ᴀɪ*
┃ ❍ *${prefix}ɢᴘᴛ*
┃ ❍ *${prefix}ɢᴇᴍɪɴɪ*
┃ ❍ *${prefix}ᴄʟᴀᴜᴅᴇ*
┃ ❍ *${prefix}ᴅᴇᴇᴘsᴇᴇᴋ*
┃ ❍ *${prefix}ᴄᴏᴅᴇᴀɪ*
┗━━━━━━━━━━━━┛

*┏━━〔 📥 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 〕*
┃ ❍ *${prefix}ᴘʟᴀʏ*
┃ ❍ *${prefix}ᴠɪᴅᴇᴏ*
┃ ❍ *${prefix}ᴀᴜᴛᴏsᴏɴɢ*
┃ ❍ *${prefix}ғʙ*
┃ ❍ *${prefix}ɪɴsᴛᴀ*
┃ ❍ *${prefix}ᴛɪᴋᴛᴏᴋ*
┃ ❍ *${prefix}sᴘᴏᴛɪғʏ*
┃ ❍ *${prefix}ʏᴛsᴇᴀʀᴄʜ*
┗━━━━━━━━━━━━┛

*┏━━〔 🛠️ 𝐔𝐓𝐈𝐋𝐈𝐓𝐘 〕*
┃ ❍ *${prefix}ᴡᴇᴀᴛʜᴇʀ*
┃ ❍ *${prefix}ᴛʀᴀɴsʟᴀᴛᴇ*
┃ ❍ *${prefix}ᴄᴀʟᴄ*
┃ ❍ *${prefix}ǫʀ*
┃ ❍ *${prefix}ɢᴏᴏɢʟᴇ*
┗━━━━━━━━━━━━┛

*┏━━〔 🎉 𝐅𝐔𝐍 〕*
┃ ❍ *${prefix}ᴊᴏᴋᴇ*
┃ ❍ *${prefix}ǫᴜᴏᴛᴇ*
┃ ❍ *${prefix}ғᴀᴄᴛ*
┗━━━━━━━━━━━━┛

*┏━━〔 ⚙️ 𝐎𝐖𝐍𝐄𝐑 〕*
┃ ❍ *${prefix}ᴀɴᴛɪᴄᴀʟʟ*
┃ ❍ *${prefix}ᴀɴᴛɪᴇᴅɪᴛ*
┃ ❍ *${prefix}ᴀɴᴛɪᴅᴇʟᴇᴛᴇ*
┃ ❍ *${prefix}ᴀɴᴛɪʟɪɴᴋ*
┃ ❍ *${prefix}ᴀɴᴛɪɢʀᴏᴜᴘ*
┃ ❍ *${prefix}sᴇᴛᴛɪɴɢs*
┃ ❍ *${prefix}ᴍᴏᴅᴇ*
┃ ❍ *${prefix}sᴇᴛᴘʀᴇғɪx*
┃ ❍ *${prefix}ᴀʟʟᴠᴀʀ*
┃ ❍ *${prefix}ʙʀᴏᴀᴅᴄᴀsᴛ*
┃ ❍ *${prefix}ʙʟᴏᴄᴋ*
┃ ❍ *${prefix}ᴜɴʙʟᴏᴄᴋ*
┃ ❍ *${prefix}ʀᴇsᴛᴀʀᴛ*
┃ ❍ *${prefix}ᴊɪᴅ*
┗━━━━━━━━━━━━┛

> ɢᴇɴᴇʀᴀᴛᴇᴅ ʙʏ *${founderName}* ✨`;

    const imgPath = "./data/Adeel.jpg";
    const hasImage = fs.existsSync(imgPath);
    const chatId = from || (m && m.chat) || context.chat || null;

    try { if (botClient && typeof botClient.sendPresenceUpdate === "function" && chatId) {
      await botClient.sendPresenceUpdate("composing", chatId);
      await new Promise(res => setTimeout(res, 500));
    }} catch {}

    try {
      if (hasImage && botClient && typeof botClient.sendMessage === "function" && chatId) {
        await botClient.sendMessage(chatId, { image: fs.readFileSync(imgPath), caption });
      } else if (typeof reply === "function") await reply(caption);
    } catch { if (typeof reply === "function") await reply(caption); }

    try { if (react) await react("✅"); } catch {}
    try { if (botClient && typeof botClient.sendPresenceUpdate === "function" && chatId) {
      await botClient.sendPresenceUpdate("paused", chatId);
    }} catch {}
  }
};┃ ❍ ${prefix}antilink
┃ ❍ ${prefix}antigroup
┃ ❍ ${prefix}settings
┃ ❍ ${prefix}mode
┃ ❍ ${prefix}setprefix
┃ ❍ ${prefix}allvar
┃ ❍ ${prefix}broadcast
┃ ❍ ${prefix}block
┃ ❍ ${prefix}unblock
┃ ❍ ${prefix}restart
┃ ❍ ${prefix}jid
┗━━━━━━━━━━━━┛

> ɢᴇɴᴇʀᴀᴛᴇᴅ ʙʏ ${founderName} ✨`;

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
