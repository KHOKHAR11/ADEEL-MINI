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
  name: "mute",
  aliases: ["silence", "shutup"],
  category: "group",
  description: "Mute a user (bot will ignore their commands)",
  
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
      await react("🔇");
      
      const muted = loadMuted();
      const action = args[0]?.toLowerCase();
      
      if (action === "list") {
        if (!muted[from] || muted[from].length === 0) {
          return reply("✅ No muted users in this group!");
        }
        const list = muted[from].map((user, i) => `${i + 1}. @${user.split("@")[0]}`).join("\n");
        
        await botClient.sendMessage(from, {
          text: `╭━━━━━━━━━━━━━━━╮
┃  🔇 *MUTED USERS*
┃━━━━━━━━━━━━━━━
${list}
╰━━━━━━━━━━━━━━━╯`,
          mentions: muted[from]
        });
        return;
      }
      
      const target = mentionUser?.[0] || (m?.quoted?.sender);
      if (!target) {
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  🔇 *MUTE SYSTEM*
┃━━━━━━━━━━━━━━━
┃  📝 *Usage:*
┃  .mute @user
┃  .mute list
┃━━━━━━━━━━━━━━━
┃  ℹ️ Muted users can't
┃  use bot commands
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
      if (!muted[from]) muted[from] = [];
      
      if (muted[from].includes(target)) {
        return reply(`⚠️ @${target.split("@")[0]} is already muted!`);
      }
      
      muted[from].push(target);
      saveMuted(muted);
      
      await botClient.sendMessage(from, {
        text: `╭━━━━━━━━━━━━━━━╮
┃  🔇 *USER MUTED*
┃━━━━━━━━━━━━━━━
┃  👤 User: @${target.split("@")[0]}
┃  ⏰ Status: Muted
┃  ℹ️ Bot will ignore their
┃  commands
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`,
        mentions: [target]
      });
      
      await react("✅");
      
    } catch (error) {
      console.error("Mute error:", error);
      return reply(`❌ Error: ${error.message}`);
    }
  }
};

module.exports.isMuted = (groupId, userId) => {
  const muted = loadMuted();
  return muted[groupId]?.includes(userId) || false;
};
