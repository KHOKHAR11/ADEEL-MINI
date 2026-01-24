module.exports = {
  name: "jid",
  aliases: ["getjid", "chatid"],
  category: "owner",
  description: "Get JID of current chat or mentioned user",
  
  async execute(context) {
    const { reply, react, from, m, mentionUser, isOwner } = context;
    
    if (!isOwner) {
      return reply("❌ Only the bot owner can use this command!");
    }
    
    try {
      await react("🔍");
      
      let targetJid = from;
      let targetType = from.endsWith("@g.us") ? "Group" : "Personal Chat";
      
      if (mentionUser?.[0]) {
        targetJid = mentionUser[0];
        targetType = "User";
      } else if (m?.quoted?.sender) {
        targetJid = m.quoted.sender;
        targetType = "Quoted User";
      }
      
      await react("✅");
      return reply(`╭━━━━━━━━━━━━━━━╮
┃  🔍 *JID INFO*
┃━━━━━━━━━━━━━━━
┃  📋 Type: ${targetType}
┃  🆔 JID:
┃  \`${targetJid}\`
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      
    } catch (error) {
      console.error("JID error:", error);
      return reply(`❌ Error: ${error.message}`);
    }
  }
};
