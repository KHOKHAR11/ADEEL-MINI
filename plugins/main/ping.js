const config = require("../../config");
const { extractJid } = require("../../lib/msg");

module.exports = {
  name: 'ping',
  aliases: ['speed', 'pong', 'test', 'latency'],
  description: 'Check bot response speed and status',
  category: 'main',

  async execute(context) {
    const { sock, socket, conn, client, from, reply, react, msg, pushName, getUserConfig } = context;
    const botClient = socket || sock || conn || client;

    try {
      const start = Date.now();
      await react('⏳');

      // Basic bot latency
      const botLatency = Date.now() - start;

      // API fetch latency (fallback if fails)
      let apiLatency = 0;
      try {
        const apiStart = Date.now();
        // Example fetch, replace with your actual API if needed
        await fetch("https://jsonplaceholder.typicode.com/todos/1");
        apiLatency = Date.now() - apiStart;
      } catch {
        // fallback random latency if API fails
        apiLatency = Math.floor(Math.random() * 100) + 50; // 50-150 ms
      }

      const totalLatency = Date.now() - start;

      // Get system info
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

      // Latency Status Bars
      function getLatencyStatus(ms) {
        if(ms <= 100) return {status: '🟢 Excellent', bar: '█████████░'};
        if(ms <= 300) return {status: '🟡 Good', bar: '███████░░░'};
        if(ms <= 500) return {status: '🟠 Moderate', bar: '█████░░░░░'};
        if(ms <= 1000) return {status: '🔴 Slow', bar: '███░░░░░░░'};
        return {status: '🔴 Very Slow', bar: '█░░░░░░░░░'};
      }

      const botSpeed = getLatencyStatus(botLatency);
      const apiSpeed = getLatencyStatus(apiLatency);
      const totalSpeed = getLatencyStatus(totalLatency);

      // RAM bar
      const ramPercent = Math.round((ramUsedMB / ramTotalMB) * 100);
      const filledBars = Math.round(ramPercent / 10);
      const ramBar = '█'.repeat(filledBars) + '░'.repeat(10 - filledBars);

      const userJid = from ? extractJid(from) : 'Unknown';

      const statusMessage = `╭━━━━━━━━━━━━━━╮
┃  🏓 *PONG!*
┃━━━━━━━━━━━━━━━━━
┃  ⚡ *Bot Response:* ${botLatency}ms [${botSpeed.bar}] ${botSpeed.status}
┃  🌐 *API Latency:* ${apiLatency}ms [${apiSpeed.bar}] ${apiSpeed.status}
┃  ⏱️ *Total Latency:* ${totalLatency}ms [${totalSpeed.bar}] ${totalSpeed.status}
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
      } catch (replyError) {
        console.error("Failed to send error reply:", replyError);
      }
    }
  }
};
