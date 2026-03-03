const fs = require('fs-extra');
const path = require('path');

module.exports = {
  name: 'help',
  aliases: ['menu', 'commands', 'cmd'],
  description: 'Show all available commands',
  category: 'main',

  async execute(context) {
    const { sock, socket, conn, client, from, reply, react, msg, getUserConfig } = context;
    
    try {
      await react('📚');

      const user = await getUserConfig();
      const prefix = user?.PREFIX || '.';

      const helpText = `
╔═══════════════════════════════════════════╗
║    🤖 *ADEEL-MINI HELP & COMMANDS*     ║
╠═══════════════════════════════════════════╣
║                                           ║
║ 📌 *PREFIX*: ${prefix}                         ║
║                                           ║
║ 🔮 *MAIN COMMANDS*:                      ║
║ ${prefix}help - Show this menu                    ║
║ ${prefix}ping - Bot status                        ║
║ ${prefix}alive - Check if online                  ║
║                                           ║
║ 🎵 *DOWNLOAD COMMANDS*:                  ║
║ ${prefix}play <song> - Search & play              ║
║ ${prefix}ytmp3 <url> - Download MP3              ║
║ ${prefix}ytmp4 <url> - Download video            ║
║ ${prefix}tiktok <url> - Download TikTok          ║
║                                           ║
║ 🎨 *UTILITY COMMANDS*:                   ║
║ ${prefix}qr <text> - Generate QR code            ║
║ ${prefix}calc <math> - Calculate                  ║
║ ${prefix}translate - Translate text               ║
║ ${prefix}weather <city> - Get weather            ║
║                                           ║
║ 🤖 *AI COMMANDS*:                        ║
║ ${prefix}gpt <prompt> - ChatGPT                   ║
║ ${prefix}bard <prompt> - Google Bard              ║
║ ${prefix}claude <prompt> - Claude AI              ║
║                                           ║
║ 👥 *GROUP COMMANDS*:                     ║
║ ${prefix}tagall - Tag all members                 ║
║ ${prefix}promote @user - Make admin               ║
║ ${prefix}demote @user - Remove admin              ║
║ ${prefix}kick @user - Remove member               ║
║                                           ║
║ 📊 *STATS COMMANDS*:                     ║
║ ${prefix}stats - View bot statistics              ║
║ ${prefix}status - Bot status                      ║
║                                           ║
║ 💡 *TIP*: Use commands with proper syntax║
║ Type: ${prefix}<command> <argument>              ║
║                                           ║
╚═══════════════════════════════════════════╝
`;

      await reply(helpText);
    } catch (error) {
      console.error('Help command error:', error.message);
      await reply('❌ Failed to load help menu. Try again.');
    }
  }
};
