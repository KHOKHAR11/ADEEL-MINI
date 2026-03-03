const fs = require("fs");
const path = require("path");

const welcomePath = path.join(__dirname, "../../data/welcome.json");

function loadWelcomeSettings() {
  try {
    if (fs.existsSync(welcomePath)) {
      return JSON.parse(fs.readFileSync(welcomePath, "utf8"));
    }
    return {};
  } catch {
    return {};
  }
}

function saveWelcomeSettings(data) {
  fs.writeFileSync(welcomePath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "welcome",
  aliases: ["setwelcome", "greet"],
  category: "group",
  description: "Set welcome message for new members",
  
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
      
      const settings = loadWelcomeSettings();
      const action = args[0]?.toLowerCase();
      
      if (!action || !["on", "off", "set", "status", "preview"].includes(action)) {
        const groupSettings = settings[from] || { enabled: false, message: null };
        const currentStatus = groupSettings.enabled ? "✅ ON" : "❌ OFF";
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  👋 *WELCOME MESSAGE*
┃━━━━━━━━━━━━━━━
┃  📊 Status: ${currentStatus}
┃━━━━━━━━━━━━━━━
┃  📝 *Usage:*
┃  .welcome on
┃  .welcome off
┃  .welcome set <message>
┃  .welcome preview
┃━━━━━━━━━━━━━━━
┃  📌 *Variables:*
┃  {user} - User mention
┃  {group} - Group name
┃  {desc} - Group description
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
      if (action === "status" || action === "preview") {
        const groupSettings = settings[from] || { enabled: false, message: null };
        if (!groupSettings.message) {
          return reply("❌ No welcome message set. Use .welcome set <message>");
        }
        const preview = groupSettings.message
          .replace("{user}", "@User")
          .replace("{group}", "Group Name")
          .replace("{desc}", "Group Description");
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  👋 *WELCOME PREVIEW*
┃━━━━━━━━━━━━━━━
┃  Status: ${groupSettings.enabled ? "✅ ON" : "❌ OFF"}
╰━━━━━━━━━━━━━━━╯

${preview}`);
      }
      
      if (action === "set") {
        const message = args.slice(1).join(" ") || q;
        if (!message) {
          return reply("❌ Please provide a welcome message!\n\nExample: .welcome set Welcome {user} to {group}!");
        }
        if (!settings[from]) settings[from] = { enabled: true, message: null };
        settings[from].message = message;
        settings[from].enabled = true;
        saveWelcomeSettings(settings);
        await react("✅");
        return reply(`✅ Welcome message set successfully!\n\nPreview:\n${message.replace("{user}", "@User").replace("{group}", "Group Name")}`);
      }
      
      if (action === "on") {
        if (!settings[from]) settings[from] = { enabled: true, message: "Welcome {user} to {group}! 👋" };
        settings[from].enabled = true;
        saveWelcomeSettings(settings);
        await react("✅");
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  👋 *WELCOME ENABLED*
┃━━━━━━━━━━━━━━━
┃  ✅ Status: ON
┃  📝 New members will be
┃  greeted automatically
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
      if (action === "off") {
        if (settings[from]) settings[from].enabled = false;
        saveWelcomeSettings(settings);
        await react("✅");
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  👋 *WELCOME DISABLED*
┃━━━━━━━━━━━━━━━
┃  ❌ Status: OFF
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
    } catch (error) {
      console.error("Welcome error:", error);
      return reply(`❌ Error: ${error.message}`);
    }
  }
};

module.exports.getWelcome = (groupId) => {
  const settings = loadWelcomeSettings();
  return settings[groupId] || { enabled: false, message: null };
};
