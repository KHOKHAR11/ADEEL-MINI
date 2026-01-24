const config = require("../../config");
const { extractJid } = require("../../lib/msg");

const latencyEmojis = ['⚡','🔥','🚀','💨','🎯','🎉','🌟','💥','🕐','🔹'];

module.exports = {
  name: 'ping',
  aliases: ['speed', 'pong', 'test', 'latency'],
  description: 'Check bot response speed and status',
  category: 'main',

  async execute(context) {
    const { sock, socket, conn, client, from, reply, react, getUserConfig } = context;
    const botClient = socket || sock || conn || client;

    try {
      const start = Date.now();
      await react('⏳');

      // Measure response time fast
      const speed = Date.now() - start;

      // User config for prefix
      const user = await getUserConfig();
      const prefix = user.PREFIX || config.PREFIX || ".";

      // System info
      let ramUsedMB = 0, ramTotalMB = 0, uptimeSeconds = 0, nodeVersion = process.version || 'Unknown';
      try {
        const mem = process.memoryUsage();
        ramUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
        ramTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
        uptimeSeconds = Math.floor(process.uptime());
      } catch {}

      // Uptime formatting
      const d = Math.floor(uptimeSeconds / 86400);
      const h = Math.floor((uptimeSeconds % 86400) / 3600);
      const m = Math.floor((uptimeSeconds % 3600) / 60);
      const s = uptimeSeconds % 60;
      const uptimeStr = `${d?d+'d ':''}${h?h+'h ':''}${m?m+'m ':''}${s}s`;

      // Latency status
      let latencyStatus = '🟢 Excellent', latencyBar = '█████████░';
      if (speed > 100) { latencyStatus = '🟡 Good'; latencyBar = '███████░░░'; }
      if (speed > 300) { latencyStatus = '🟠 Moderate'; latencyBar = '█████░░░░░'; }
      if (speed > 500) { latencyStatus = '🔴 Slow'; latencyBar = '███░░░░░░░'; }
      if (speed > 1000) { latencyStatus = '🔴 Very Slow'; latencyBar = '█░░░░░░░░░'; }

      // RAM bar
      const ramPercent = Math.round((ramUsedMB / ramTotalMB) * 100);
      const filled = Math.round(ramPercent / 10);
      const ramBar = '█'.repeat(filled) + '░'.repeat(10 - filled);

      const userJid = from ? extractJid(from) : 'Unknown';
      const randomEmoji = latencyEmojis[Math.floor(Math.random() * latencyEmojis.length)];

      // Status message
      const statusMessage = `╭━━━━━━━━━━━━━━╮
┃  🏓 *PONG!* ${randomEmoji}
┃━━━━━━━━━━━━━━━━━
┃  ⚡ *Response:* ${speed}ms
┃  📊 *Latency:* ${latencyStatus}
┃  [${latencyBar}]
┃━━━━━━━━━━━━━━━━━
┃  💾 *RAM:* ${ramUsedMB}MB / ${ramTotalMB}MB
┃  [${ramBar}] ${ramPercent}%
┃━━━━━━━━━━━━━━━━━
┃  ⏱️ *Uptime:* ${uptimeStr}
┃  🔧 *Node:* ${nodeVersion}
┃  👤 *JID:* ${userJid}
┃  🟢 *Status:* Operational
╰━━━━━━━━━━━━━━━━━╯

> ADEEL-MINI | Fast & Reliable`;

      await reply(statusMessage);
      await react('🏓');

    } catch (error) {
      console.error("Ping command error:", error);
      try {
        await react('❌');
        await reply(`❌ *Error:* ${error?.message || 'Unknown error occurred'}`);
      } catch {}
    }
  }
};
