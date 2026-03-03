const fs = require("fs");
const path = require("path");

const goodbyePath = path.join(__dirname, "../../data/goodbye.json");

function loadGoodbyeSettings() {
  try {
    if (fs.existsSync(goodbyePath)) {
      return JSON.parse(fs.readFileSync(goodbyePath, "utf8"));
    }
    return {};
  } catch {
    return {};
  }
}

function saveGoodbyeSettings(data) {
  fs.writeFileSync(goodbyePath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "goodbye",
  aliases: ["setgoodbye", "bye"],
  category: "group",
  description: "Set goodbye message for leaving members",
  
  async execute(context) {
    const { reply, react, socket, sock, conn, client, from, args, q, isAdmins, isBotOwner } = context;
    const botClient = socket || sock || conn || client;
    
    if (!from || !from.endsWith("@g.us")) {
      return reply("❌ This command only works in groups!");
    }
    
    if (!isAdmins && !isBotOwner) {
      return reply("❌ Only group admins can use this command!");
    }
    
    try {
      await react("👋");
      
      const settings = loadGoodbyeSettings();
      const action = args[0]?.toLowerCase();
      
      if (!action || !["on", "off", "set", "status", "preview"].includes(action)) {
        const groupSettings = settings[from] || { enabled: false, message: null };
        const currentStatus = groupSettings.enabled ? "✅ ON" : "❌ OFF";
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  👋 *GOODBYE MESSAGE*
┃━━━━━━━━━━━━━━━
┃  📊 Status: ${currentStatus}
┃━━━━━━━━━━━━━━━
┃  📝 *Usage:*
┃  .goodbye on
┃  .goodbye off
┃  .goodbye set <message>
┃  .goodbye preview
┃━━━━━━━━━━━━━━━
┃  📌 *Variables:*
┃  {user} - User name
┃  {group} - Group name
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
      if (action === "status" || action === "preview") {
        const groupSettings = settings[from] || { enabled: false, message: null };
        if (!groupSettings.message) {
          return reply("❌ No goodbye message set. Use .goodbye set <message>");
        }
        const preview = groupSettings.message
          .replace("{user}", "User")
          .replace("{group}", "Group Name");
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  👋 *GOODBYE PREVIEW*
┃━━━━━━━━━━━━━━━
┃  Status: ${groupSettings.enabled ? "✅ ON" : "❌ OFF"}
╰━━━━━━━━━━━━━━━╯

${preview}`);
      }
      
      if (action === "set") {
        const message = args.slice(1).join(" ") || q;
        if (!message) {
          return reply("❌ Please provide a goodbye message!\n\nExample: .goodbye set Goodbye {user}! We'll miss you! 😢");
        }
        if (!settings[from]) settings[from] = { enabled: true, message: null };
        settings[from].message = message;
        settings[from].enabled = true;
        saveGoodbyeSettings(settings);
        await react("✅");
        return reply(`✅ Goodbye message set successfully!\n\nPreview:\n${message.replace("{user}", "User").replace("{group}", "Group Name")}`);
      }
      
      if (action === "on") {
        if (!settings[from]) settings[from] = { enabled: true, message: "Goodbye {user}! 👋 We'll miss you!" };
        settings[from].enabled = true;
        saveGoodbyeSettings(settings);
        await react("✅");
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  👋 *GOODBYE ENABLED*
┃━━━━━━━━━━━━━━━
┃  ✅ Status: ON
┃  📝 Leaving members will
┃  be bid farewell
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
      if (action === "off") {
        if (settings[from]) settings[from].enabled = false;
        saveGoodbyeSettings(settings);
        await react("✅");
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  👋 *GOODBYE DISABLED*
┃━━━━━━━━━━━━━━━
┃  ❌ Status: OFF
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
    } catch (error) {
      console.error("Goodbye error:", error);
      return reply(`❌ Error: ${error.message}`);
    }
  }
};

module.exports.getGoodbye = (groupId) => {
  const settings = loadGoodbyeSettings();
  return settings[groupId] || { enabled: false, message: null };
};
