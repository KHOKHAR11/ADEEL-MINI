const fs = require("fs");
const path = require("path");

const antiBotPath = path.join(__dirname, "../../data/antibot.json");

function loadAntiBotSettings() {
  try {
    if (fs.existsSync(antiBotPath)) {
      return JSON.parse(fs.readFileSync(antiBotPath, "utf8"));
    }
    return {};
  } catch {
    return {};
  }
}

function saveAntiBotSettings(data) {
  fs.writeFileSync(antiBotPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "antibot",
  aliases: ["nobot"],
  category: "group",
  description: "Enable/disable anti-bot protection in groups",
  
  async execute(context) {
    const { reply, react, socket, sock, conn, client, from, args, isAdmins, isBotOwner, isBotAdmins } = context;
    const botClient = socket || sock || conn || client;
    
    if (!from || !from.endsWith("@g.us")) {
      return reply("❌ This command only works in groups!");
    }
    
    if (!isAdmins && !isBotOwner) {
      return reply("❌ Only group admins can use this command!");
    }
    
    if (!isBotAdmins) {
      return reply("❌ Bot needs admin rights to use this feature!");
    }
    
    try {
      await react("🤖");
      
      const settings = loadAntiBotSettings();
      const action = args[0]?.toLowerCase();
      
      if (!action || !["on", "off", "status"].includes(action)) {
        const currentStatus = settings[from] ? "✅ ON" : "❌ OFF";
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  🤖 *ANTI-BOT*
┃━━━━━━━━━━━━━━━
┃  📊 Status: ${currentStatus}
┃━━━━━━━━━━━━━━━
┃  📝 *Usage:*
┃  .antibot on
┃  .antibot off
┃  .antibot status
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
      if (action === "status") {
        const currentStatus = settings[from] ? "✅ Enabled" : "❌ Disabled";
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  🤖 *ANTI-BOT STATUS*
┃━━━━━━━━━━━━━━━
┃  📊 ${currentStatus}
┃━━━━━━━━━━━━━━━
┃  ℹ️ When enabled, bots
┃  joining will be removed
╰━━━━━━━━━━━━━━━╯`);
      }
      
      if (action === "on") {
        settings[from] = true;
        saveAntiBotSettings(settings);
        await react("✅");
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  🤖 *ANTI-BOT ENABLED*
┃━━━━━━━━━━━━━━━
┃  ✅ Protection: ON
┃  🛡️ Bots will be removed
┃  automatically when joining
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
      if (action === "off") {
        settings[from] = false;
        saveAntiBotSettings(settings);
        await react("✅");
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  🤖 *ANTI-BOT DISABLED*
┃━━━━━━━━━━━━━━━
┃  ❌ Protection: OFF
┃  ⚠️ Bots can join freely
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
    } catch (error) {
      console.error("AntiBot error:", error);
      return reply(`❌ Error: ${error.message}`);
    }
  }
};

module.exports.isAntiBot = (groupId) => {
  const settings = loadAntiBotSettings();
  return settings[groupId] === true;
};
