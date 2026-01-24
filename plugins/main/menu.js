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
    const founderName = config.FOUNDER_NAME || "ADEEL";
    const botName = config.BOT_NAME || "ADEEL-MINI";
    const extractJid = (jid) => jid ? jid.split('@')[0] : 'Unknown';

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
┃ ${prefix}menu - Commands
┃ ${prefix}alive - Bot status
┃ ${prefix}ping - Response time
┃ ${prefix}about - Bot info
┃ ${prefix}owner - Contact owner
┃ ${prefix}uptime - Runtime
┃ ${prefix}channel - Bot channel
╰━━━━━━━━━━━━━━━━╯

╭━━━━ *👥 GROUP* ━━━━╮
┃ ${prefix}add - Add member
┃ ${prefix}kick - Remove member
┃ ${prefix}promote - Make admin
┃ ${prefix}demote - Remove admin
┃ ${prefix}admins - List admins
┃ ${prefix}tagall - Tag everyone
┃ ${prefix}hidetag - Silent tag
┃ ${prefix}open - Open group
┃ ${prefix}close - Close group
┃ ${prefix}ginfo - Group info
┃ ${prefix}welcome - Welcome msg
┃ ${prefix}goodbye - Goodbye msg
┃ ${prefix}warn - Warn user
┃ ${prefix}mute - Mute user
┃ ${prefix}unmute - Unmute user
┃ ${prefix}antibot - Anti-bot
┃ ${prefix}antispam - Anti-spam
╰━━━━━━━━━━━━━━━━╯

╭━━━━ *🤖 AI* ━━━━╮
┃ ${prefix}ai - ChatGPT
┃ ${prefix}gpt - GPT Chat
┃ ${prefix}gemini - Google AI
┃ ${prefix}claude - Claude AI
┃ ${prefix}deepseek - DeepSeek
┃ ${prefix}codeai - Code Helper
╰━━━━━━━━━━━━━━━━━╯

╭━━━━ *📥 DOWNLOAD* ━━━━╮
┃ ${prefix}play - YouTube MP3
┃ ${prefix}video - YouTube MP4
┃ ${prefix}autosong - Auto songs
┃ ${prefix}fb - Facebook
┃ ${prefix}insta - Instagram
┃ ${prefix}tiktok - TikTok
┃ ${prefix}spotify - Spotify
┃ ${prefix}ytsearch - YT Search
╰━━━━━━━━━━━━━━━━━━━╯

╭━━━━ *🛠️ UTILITY* ━━━━╮
┃ ${prefix}weather - Weather
┃ ${prefix}translate - Translate
┃ ${prefix}calc - Calculator
┃ ${prefix}qr - QR Code
┃ ${prefix}google - Search
╰━━━━━━━━━━━━━━━━━╯

╭━━━━ *🎉 FUN* ━━━━╮
┃ ${prefix}joke - Random joke
┃ ${prefix}quote - Quotes
┃ ${prefix}fact - Random facts
╰━━━━━━━━━━━━━━━━╯

╭━━━━ *⚙️ OWNER* ━━━━╮
┃ ${prefix}anticall - Block calls
┃ ${prefix}antiedit - Track edits
┃ ${prefix}antidelete - Track deletes
┃ ${prefix}antilink - Block links
┃ ${prefix}antigroup - Anti-group
┃ ${prefix}settings - Bot settings
┃ ${prefix}mode - Public/Private
┃ ${prefix}setprefix - Change prefix
┃ ${prefix}allvar - Toggle cmds
┃ ${prefix}broadcast - Announce
┃ ${prefix}block - Block user
┃ ${prefix}unblock - Unblock user
┃ ${prefix}restart - Restart bot
┃ ${prefix}jid - Get chat JID
╰━━━━━━━━━━━━━━━━╯

> © *${founderName}* | ${botName} ッ`;

    const imgPath = "./data/Adeel.jpg";
    const hasImage = fs.existsSync(imgPath);
    const chatId = from || (m && m.chat) || context.chat || null;

    try {
      if (botClient && typeof botClient.sendPresenceUpdate === "function" && chatId) {
        await botClient.sendPresenceUpdate("composing", chatId);
        await new Promise(res => setTimeout(res, 500));
      }
    } catch (err) {}

    const buttons = [
      { 
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
          display_text: 'Follow Us',
          url: config.CHANNEL_LINK || 'https://whatsapp.com/channel/0029VbBmz4V5vKAIaWfYPT0C',
          merchant_url: config.CHANNEL_LINK || 'https://whatsapp.com/channel/0029VbBmz4V5vKAIaWfYPT0C'
        })
      }
    ];

    const sections = [
      {
        title: '📌 Quick Actions',
        rows: [
          { title: '📋 Menu', rowId: `${prefix}menu`, description: 'Show command list' },
          { title: '🤖 Alive', rowId: `${prefix}alive`, description: 'Check bot status' },
          { title: '🏓 Ping', rowId: `${prefix}ping`, description: 'Test response time' },
          { title: '👑 Owner', rowId: `${prefix}owner`, description: 'Contact owner' },
          { title: '⚙️ Settings', rowId: `${prefix}settings`, description: 'View settings' }
        ]
      },
      {
        title: '👥 Group Management',
        rows: [
          { title: '📢 Tagall', rowId: `${prefix}tagall`, description: 'Tag all members' },
          { title: '🔇 Mute', rowId: `${prefix}mute @user`, description: 'Mute a user' },
          { title: '⚠️ Warn', rowId: `${prefix}warn @user`, description: 'Warn a user' }
        ]
      }
    ];

    try {
      if (hasImage && botClient && typeof botClient.sendMessage === "function" && chatId) {
        const imgBuffer = fs.readFileSync(imgPath);
        
        try {
          await botClient.sendMessage(chatId, {
            image: imgBuffer,
            caption,
            footer: `© ${founderName}`,
            buttons,
            headerType: 4
          });
        } catch (btnErr) {
          try {
            await botClient.sendMessage(chatId, {
              image: imgBuffer,
              caption,
              footer: `© ${founderName}`,
              buttonText: "Select Option",
              sections,
              headerType: 4
            });
          } catch {
            await botClient.sendMessage(chatId, { image: imgBuffer, caption });
          }
        }
      } else if (typeof reply === "function") {
        try {
          if (hasImage) {
            await reply({ image: fs.readFileSync(imgPath), caption });
          } else {
            await reply(caption);
          }
        } catch (e) {
          await reply(caption);
        }
      } else if (botClient && typeof botClient.sendMessage === "function" && chatId) {
        await botClient.sendMessage(chatId, { text: caption });
      }
    } catch (sendErr) {
      try {
        if (typeof reply === "function") await reply(caption);
      } catch (finalErr) {
        console.error("Menu command error:", finalErr.message);
      }
    }

    try {
      if (react) await react("✅");
    } catch (e) {}

    try {
      if (botClient && typeof botClient.sendPresenceUpdate === "function" && chatId) {
        await botClient.sendPresenceUpdate("paused", chatId);
      }
    } catch (err) {}
  }
};
