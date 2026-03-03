const fs = require("fs");
const config = require("../../config");

module.exports = {
  name: "alive",
  aliases: ["bot", "status"],
  category: "main",
  description: "Check if bot is running with full status",

  async execute(context) {
    const { reply, react, getUserConfig, socket, sock, conn, client, from, pushName } = context;
    const botClient = socket || sock || conn || client;

    try {
      await react("💫");

      const user = await getUserConfig();
      const prefix = user.PREFIX || config.PREFIX || ".";
      const userName = pushName || "User";
      const founderName = config.FOUNDER_NAME || "ADEEL-MINI";
      const botName = config.BOT_NAME || "ADEEL-MINI";

      const uptimeSeconds = Math.floor(process.uptime());
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = uptimeSeconds % 60;
      
      let uptimeStr = "";
      if (days > 0) uptimeStr += `${days}d `;
      if (hours > 0) uptimeStr += `${hours}h `;
      if (minutes > 0) uptimeStr += `${minutes}m `;
      uptimeStr += `${seconds}s`;

      const memoryUsage = process.memoryUsage();
      const ramUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const ramTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);

      const startTime = Date.now();
      await new Promise(r => setTimeout(r, 1));
      const speed = Date.now() - startTime;

      let speedStatus = "🟢 Fast";
      if (speed > 100) speedStatus = "🟡 Medium";
      if (speed > 500) speedStatus = "🔴 Slow";

      const caption = `╭━━━━━━━━━━━━━━━━━━╮
┃  🤖 *${botName} IS ALIVE!*
┃━━━━━━━━━━━━━━━━━━━━
┃  👋 Hello, *${userName}*!
┃━━━━━━━━━━━━━━━━━━━━
┃  ⏱️ *Uptime:* ${uptimeStr}
┃  ⚡ *Speed:* ${speed}ms ${speedStatus}
┃  💾 *RAM:* ${ramUsed}MB / ${ramTotal}MB
┃  🔧 *Node:* ${process.version}
┃━━━━━━━━━━━━━━━━━━━━
┃  🎯 *Prefix:* ${prefix}
┃  🌐 *Mode:* ${user.MODE === 'private' ? '🔒 Private' : '🌍 Public'}
┃  👑 *Founder:* ${founderName}
┃━━━━━━━━━━━━━━━━━━━━
┃  📝 Type *${prefix}menu* for commands
╰━━━━━━━━━━━━━━━━━━╯

> © ${founderName} | ADEEL-MINI`;

      const imgPath = "./data/zaynix.jpg";
      const hasImage = fs.existsSync(imgPath);

      const buttons = [
        { 
          name: 'cta_url',
          buttonParamsJson: JSON.stringify({
            display_text: 'Follow Channel',
            url: config.CHANNEL_LINK || 'https://whatsapp.com/channel/0029VbBmz4V5vKAIaWfYPT0C',
            merchant_url: config.CHANNEL_LINK || 'https://whatsapp.com/channel/0029VbBmz4V5vKAIaWfYPT0C'
          })
        }
      ];

      try {
        if (hasImage && botClient && from) {
          const imgBuffer = fs.readFileSync(imgPath);
          try {
            await botClient.sendMessage(from, {
              image: imgBuffer,
              caption,
              footer: `© ${founderName}`,
              templateButtons: buttons,
              headerType: 4
            });
          } catch {
            await botClient.sendMessage(from, { image: imgBuffer, caption });
          }
        } else {
          await reply(caption);
        }
      } catch {
        await reply(caption);
      }

      await react("✅");

    } catch (error) {
      console.error("Alive command error:", error);
      try {
        await react("❌");
        await reply(`❌ Error: ${error.message || 'Unknown error'}`);
      } catch (replyErr) {
        console.error("Failed to send error reply:", replyErr.message);
      }
    }
  }
};
