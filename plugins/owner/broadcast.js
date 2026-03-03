module.exports = {
  name: "broadcast",
  aliases: ["bc", "announce"],
  category: "owner",
  description: "Broadcast message to all chats",
  
  async execute(context) {
    const { reply, react, args, q, isOwner, socket, sock, conn, client } = context;
    const botClient = socket || sock || conn || client;
    
    if (!isOwner) {
      return reply("❌ Only the bot owner can use this command!");
    }
    
    try {
      const message = q || args.join(" ");
      
      if (!message) {
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  📢 *BROADCAST*
┃━━━━━━━━━━━━━━━
┃  📝 *Usage:*
┃  .broadcast <message>
┃━━━━━━━━━━━━━━━
┃  ℹ️ Sends message to
┃  all groups
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
      await react("📢");
      
      const groups = await botClient.groupFetchAllParticipating();
      const groupIds = Object.keys(groups);
      
      if (groupIds.length === 0) {
        return reply("❌ No groups found!");
      }
      
      await reply(`📢 Broadcasting to ${groupIds.length} groups...`);
      
      let success = 0;
      let failed = 0;
      
      const broadcastMessage = `╭━━━━━━━━━━━━━━━╮
┃  📢 *BROADCAST*
┃━━━━━━━━━━━━━━━
┃  ${message}
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`;
      
      for (const groupId of groupIds) {
        try {
          await botClient.sendMessage(groupId, { text: broadcastMessage });
          success++;
          await new Promise(r => setTimeout(r, 1500));
        } catch (err) {
          failed++;
        }
      }
      
      await react("✅");
      return reply(`╭━━━━━━━━━━━━━━━╮
┃  📢 *BROADCAST DONE*
┃━━━━━━━━━━━━━━━
┃  ✅ Success: ${success}
┃  ❌ Failed: ${failed}
┃  📊 Total: ${groupIds.length}
╰━━━━━━━━━━━━━━━╯`);
      
    } catch (error) {
      console.error("Broadcast error:", error);
      return reply(`❌ Error: ${error.message}`);
    }
  }
};
