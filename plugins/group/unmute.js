const fs = require("fs");
const path = require("path");

const mutePath = path.join(__dirname, "../../data/muted.json");

function loadMuted() {
  try {
    if (fs.existsSync(mutePath)) {
      return JSON.parse(fs.readFileSync(mutePath, "utf8"));
    }
    return {};
  } catch {
    return {};
  }
}

function saveMuted(data) {
  fs.writeFileSync(mutePath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "unmute",
  aliases: ["unsilence"],
  category: "group",
  description: "Unmute a user",
  
  async execute(context) {
    const { reply, react, socket, sock, conn, client, from, args, isAdmins, isBotOwner, m, mentionUser } = context;
    const botClient = socket || sock || conn || client;
    
    if (!from || !from.endsWith("@g.us")) {
      return reply("❌ This command only works in groups!");
    }
    
    if (!isAdmins && !isBotOwner) {
      return reply("❌ Only group admins can use this command!");
    }
    
    try {
      await react("🔊");
      
      const muted = loadMuted();
      
      const target = mentionUser?.[0] || (m?.quoted?.sender);
      if (!target) {
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  🔊 *UNMUTE USER*
┃━━━━━━━━━━━━━━━
┃  📝 *Usage:*
┃  .unmute @user
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
      if (!muted[from] || !muted[from].includes(target)) {
        return reply(`⚠️ @${target.split("@")[0]} is not muted!`);
      }
      
      muted[from] = muted[from].filter(u => u !== target);
      saveMuted(muted);
      
      await botClient.sendMessage(from, {
        text: `╭━━━━━━━━━━━━━━━╮
┃  🔊 *USER UNMUTED*
┃━━━━━━━━━━━━━━━
┃  👤 User: @${target.split("@")[0]}
┃  ⏰ Status: Unmuted
┃  ✅ Can use bot commands
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`,
        mentions: [target]
      });
      
      await react("✅");
      
    } catch (error) {
      console.error("Unmute error:", error);
      return reply(`❌ Error: ${error.message}`);
    }
  }
};
