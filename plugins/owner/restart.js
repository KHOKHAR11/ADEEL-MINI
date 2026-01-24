module.exports = {
  name: "restart",
  aliases: ["reboot"],
  category: "owner",
  description: "Restart the bot",
  
  async execute(context) {
    const { reply, react, isOwner } = context;
    
    if (!isOwner) {
      return reply("❌ Only the bot owner can use this command!");
    }
    
    try {
      await react("🔄");
      
      await reply(`╭━━━━━━━━━━━━━━━╮
┃  🔄 *RESTARTING*
┃━━━━━━━━━━━━━━━
┃  ⏳ Please wait...
┃  Bot will be back soon!
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      
      setTimeout(() => {
        process.exit(0);
      }, 2000);
      
    } catch (error) {
      console.error("Restart error:", error);
      return reply(`❌ Error: ${error.message}`);
    }
  }
};
