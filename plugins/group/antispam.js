const fs = require("fs");
const path = require("path");

const antiSpamPath = path.join(__dirname, "../../data/antispam.json");
const spamTracker = new Map();

function loadAntiSpamSettings() {
  try {
    if (fs.existsSync(antiSpamPath)) {
      return JSON.parse(fs.readFileSync(antiSpamPath, "utf8"));
    }
    return {};
  } catch {
    return {};
  }
}

function saveAntiSpamSettings(data) {
  fs.writeFileSync(antiSpamPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "antispam",
  aliases: ["nospam", "spamblock"],
  category: "group",
  description: "Enable/disable anti-spam protection in groups",
  
  async execute(context) {
    const { reply, react, socket, sock, conn, client, from, args, isAdmins, isBotOwner, isBotAdmins } = context;
    const botClient = socket || sock || conn || client;
    
    if (!from || !from.endsWith("@g.us")) {
      return reply("❌ This command only works in groups!");
    }
    
    if (!isAdmins && !isBotOwner) {
      return reply("❌ Only group admins can use this command!");
    }
    
    try {
      await react("🛡️");
      
      const settings = loadAntiSpamSettings();
      const action = args[0]?.toLowerCase();
      const limit = parseInt(args[1]) || 5;
      
      if (!action || !["on", "off", "status", "set"].includes(action)) {
        const groupSettings = settings[from] || { enabled: false, limit: 5, action: "warn" };
        const currentStatus = groupSettings.enabled ? "✅ ON" : "❌ OFF";
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  🛡️ *ANTI-SPAM*
┃━━━━━━━━━━━━━━━
┃  📊 Status: ${currentStatus}
┃  📨 Limit: ${groupSettings.limit} msgs/10s
┃  ⚡ Action: ${groupSettings.action}
┃━━━━━━━━━━━━━━━
┃  📝 *Usage:*
┃  .antispam on
┃  .antispam off
┃  .antispam set <limit>
┃  .antispam status
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
      if (action === "status") {
        const groupSettings = settings[from] || { enabled: false, limit: 5 };
        const currentStatus = groupSettings.enabled ? "✅ Enabled" : "❌ Disabled";
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  🛡️ *ANTI-SPAM STATUS*
┃━━━━━━━━━━━━━━━
┃  📊 ${currentStatus}
┃  📨 Limit: ${groupSettings.limit} msgs/10s
╰━━━━━━━━━━━━━━━╯`);
      }
      
      if (action === "set") {
        if (limit < 3 || limit > 20) {
          return reply("❌ Limit must be between 3 and 20 messages!");
        }
        if (!settings[from]) settings[from] = { enabled: false, limit: 5, action: "warn" };
        settings[from].limit = limit;
        saveAntiSpamSettings(settings);
        await react("✅");
        return reply(`✅ Anti-spam limit set to ${limit} messages per 10 seconds!`);
      }
      
      if (action === "on") {
        settings[from] = { enabled: true, limit: settings[from]?.limit || 5, action: "warn" };
        saveAntiSpamSettings(settings);
        await react("✅");
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  🛡️ *ANTI-SPAM ENABLED*
┃━━━━━━━━━━━━━━━
┃  ✅ Protection: ON
┃  📨 Limit: ${settings[from].limit} msgs/10s
┃  ⚡ Spammers will be warned
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
      if (action === "off") {
        if (settings[from]) settings[from].enabled = false;
        saveAntiSpamSettings(settings);
        await react("✅");
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  🛡️ *ANTI-SPAM DISABLED*
┃━━━━━━━━━━━━━━━
┃  ❌ Protection: OFF
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
    } catch (error) {
      console.error("AntiSpam error:", error);
      return reply(`❌ Error: ${error.message}`);
    }
  }
};

module.exports.checkSpam = (groupId, sender) => {
  const settings = loadAntiSpamSettings();
  const groupSettings = settings[groupId];
  if (!groupSettings?.enabled) return { spam: false };
  
  const key = `${groupId}:${sender}`;
  const now = Date.now();
  const tracker = spamTracker.get(key) || { count: 0, lastReset: now };
  
  if (now - tracker.lastReset > 10000) {
    tracker.count = 0;
    tracker.lastReset = now;
  }
  
  tracker.count++;
  spamTracker.set(key, tracker);
  
  if (tracker.count > groupSettings.limit) {
    return { spam: true, action: groupSettings.action };
  }
  
  return { spam: false };
};
