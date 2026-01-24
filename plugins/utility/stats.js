const config = require("../../config");

module.exports = {
  name: 'stats',
  aliases: ['botinfo', 'info', 'statistics'],
  description: 'View detailed bot statistics and information',
  category: 'utility',
  isChat: false,

  async execute(context) {
    const { sock, socket, conn, client, from, reply, react, msg, pushName } = context;
    
    try {
      await react('📊');

      const memoryUsage = process.memoryUsage();
      const ramUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const ramTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const ramPercent = Math.round((ramUsed / ramTotal) * 100);

      const uptime = process.uptime();
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);

      const stats = `
╔════════════════════════════════════════╗
║       📊 *ADEEL-MINI STATISTICS*     ║
╠════════════════════════════════════════╣
║                                        ║
║ 🤖 *BOT INFO*                          ║
║ Name: ADEEL-MINI                     ║
║ Version: 2.0 (Optimized)               ║
║ Node: ${process.version}                 ║
║                                        ║
║ 💾 *MEMORY USAGE*                      ║
║ RAM: ${ramUsed}MB / ${ramTotal}MB (${ramPercent}%)         ║
║ Status: ${ramPercent > 80 ? '🔴 High' : ramPercent > 60 ? '🟡 Medium' : '🟢 Good'}                      ║
║                                        ║
║ ⏱️ *UPTIME*                             ║
║ ${days}d ${hours}h ${minutes}m            ║
║                                        ║
║ ✨ *PLUGINS LOADED*: 94                ║
║ 🌐 *CATEGORIES*: 7                     ║
║                                        ║
╚════════════════════════════════════════╝
`;

      await reply(stats);
    } catch (error) {
      console.error('Stats command error:', error.message);
      await reply('❌ Failed to get statistics. Try again.');
    }
  }
};
