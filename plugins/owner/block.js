module.exports = {
  name: "block",
  aliases: ["blockuser"],
  category: "owner",
  description: "Block a user on WhatsApp",
  
  async execute(context) {
    const { reply, react, args, isOwner, socket, sock, conn, client, m, mentionUser } = context;
    const botClient = socket || sock || conn || client;
    
    if (!isOwner) {
      return reply("❌ Only the bot owner can use this command!");
    }
    
    try {
      const target = mentionUser?.[0] || m?.quoted?.sender || (args[0]?.includes("@") ? args[0] : args[0] + "@s.whatsapp.net");
      
      if (!target || target === "@s.whatsapp.net") {
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  🚫 *BLOCK USER*
┃━━━━━━━━━━━━━━━
┃  📝 *Usage:*
┃  .block @user
┃  .block <number>
┃  Reply to message
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
      await react("🚫");
      
      await botClient.updateBlockStatus(target, "block");
      
      await react("✅");
      return reply(`╭━━━━━━━━━━━━━━━╮
┃  🚫 *USER BLOCKED*
┃━━━━━━━━━━━━━━━
┃  👤 @${target.split("@")[0]}
┃  📊 Status: Blocked
╰━━━━━━━━━━━━━━━╯`);
      
    } catch (error) {
      console.error("Block error:", error);
      return reply(`❌ Error: ${error.message}`);
    }
  }
};
