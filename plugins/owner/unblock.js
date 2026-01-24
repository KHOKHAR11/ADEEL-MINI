module.exports = {
  name: "unblock",
  aliases: ["unblockuser"],
  category: "owner",
  description: "Unblock a user on WhatsApp",
  
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
┃  ✅ *UNBLOCK USER*
┃━━━━━━━━━━━━━━━
┃  📝 *Usage:*
┃  .unblock @user
┃  .unblock <number>
┃  Reply to message
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
      await react("✅");
      
      await botClient.updateBlockStatus(target, "unblock");
      
      return reply(`╭━━━━━━━━━━━━━━━╮
┃  ✅ *USER UNBLOCKED*
┃━━━━━━━━━━━━━━━
┃  👤 @${target.split("@")[0]}
┃  📊 Status: Unblocked
╰━━━━━━━━━━━━━━━╯`);
      
    } catch (error) {
      console.error("Unblock error:", error);
      return reply(`❌ Error: ${error.message}`);
    }
  }
};
