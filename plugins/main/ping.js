const config = require("../../config");
const { extractJid } = require("../../lib/msg");

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

      const speed = Date.now() - start;
      const user = await getUserConfig();
      const prefix = user.PREFIX || config.PREFIX || ".";

      let ramUsedMB = 0;
      let ramTotalMB = 0;
      let uptimeSeconds = 0;
      let nodeVersion = process.version || 'Unknown';

      try {
        const memoryUsage = process.memoryUsage();
        ramUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        ramTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
        uptimeSeconds = Math.floor(process.uptime());
      } catch {}

      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = uptimeSeconds % 60;

      let uptimeStr = "";
      if (days > 0) uptimeStr += `${days}d `;
      if (hours > 0) uptimeStr += `${hours}h `;
      if (minutes > 0) uptimeStr += `${minutes}m `;
      uptimeStr += `${seconds}s`;

      let latencyStatus = '🟢 Excellent';
      let latencyBar = '█████████░';
      if (speed > 100) { latencyStatus = '🟡 Good'; latencyBar = '███████░░░'; }
      if (speed > 300) { latencyStatus = '🟠 Moderate'; latencyBar = '█████░░░░░'; }
      if (speed > 500) { latencyStatus = '🔴 Slow'; latencyBar = '███░░░░░░░'; }
      if (speed > 1000) { latencyStatus = '🔴 Very Slow'; latencyBar = '█░░░░░░░░░'; }

      const ramPercent = Math.round((ramUsedMB / ramTotalMB) * 100);
      const filledBars = Math.round(ramPercent / 10);
      const ramBar = '█'.repeat(filledBars) + '░'.repeat(10 - filledBars);

      const userJid = from ? extractJid(from) : 'Unknown';

      const statusMessage = `╭━━━━━━━━━━━━━━╮
┃  🏓 *PONG!*
┃━━━━━━━━━━━━━━━━━
┃  ⚡ *Response:* ${speed}ms
┃  📊 *Latency:* ${latencyStatus}
┃  [${latencyBar}]
┃━━━━━━━━━━━━━━━
┃  💾 *RAM:* ${ramUsedMB}MB / ${ramTotalMB}MB
┃  [${ramBar}] ${ramPercent}%
┃━━━━━━━━━━━━━━━━━━━
┃  ⏱️ *Uptime:* ${uptimeStr}
┃  🔧 *Node:* ${nodeVersion}
┃  👤 *JID:* ${userJid}
┃  🟢 *Status:* Operational
╰━━━━━━━━━━━━━━━━━━━╯

> ADEEL-MINI | Fast & Reliable`;

      if (botClient && from) {
        await botClient.sendMessage(from, { text: statusMessage });
      } else {
        await reply(statusMessage);
      }

      await react('🏓');

    } catch (error) {
      await react('❌');
      await reply(`❌ Error: ${error?.message || 'Unknown error'}`);
    }
  }
};
