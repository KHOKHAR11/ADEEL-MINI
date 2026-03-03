const fs = require("fs");
const path = require("path");

const allvarPath = path.join(__dirname, "../../data/allvar.json");

function loadAllvar() {
  try {
    if (fs.existsSync(allvarPath)) {
      return JSON.parse(fs.readFileSync(allvarPath, "utf8"));
    }
    return { commands: {}, categories: {} };
  } catch {
    return { commands: {}, categories: {} };
  }
}

function saveAllvar(data) {
  fs.writeFileSync(allvarPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "allvar",
  aliases: ["cmdtoggle", "togglecmd", "cmdon", "cmdoff"],
  category: "owner",
  description: "Enable/disable specific commands or categories",
  
  async execute(context) {
    const { reply, react, args, isOwner } = context;
    
    if (!isOwner) {
      return reply("❌ Only the bot owner can use this command!");
    }
    
    try {
      await react("⚙️");
      
      const allvar = loadAllvar();
      const action = args[0]?.toLowerCase();
      const target = args[1]?.toLowerCase();
      
      if (!action || !["on", "off", "status", "list", "cat", "category"].includes(action)) {
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  ⚙️ *ALLVAR SYSTEM*
┃━━━━━━━━━━━━━━━
┃  📝 *Usage:*
┃  .allvar on <cmd>
┃  .allvar off <cmd>
┃  .allvar status <cmd>
┃  .allvar list
┃  .allvar cat on/off <category>
┃━━━━━━━━━━━━━━━
┃  📌 *Categories:*
┃  ai, download, utility
┃  fun, group, main, owner
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
      if (action === "list") {
        const disabledCmds = Object.entries(allvar.commands || {})
          .filter(([_, v]) => v === false)
          .map(([k]) => k);
        const disabledCats = Object.entries(allvar.categories || {})
          .filter(([_, v]) => v === false)
          .map(([k]) => k);
        
        if (disabledCmds.length === 0 && disabledCats.length === 0) {
          return reply("✅ All commands and categories are enabled!");
        }
        
        let text = `╭━━━━━━━━━━━━━━━╮
┃  ⚙️ *DISABLED ITEMS*
┃━━━━━━━━━━━━━━━`;
        
        if (disabledCmds.length > 0) {
          text += `
┃  📝 *Commands:*
┃  ${disabledCmds.join(", ")}`;
        }
        
        if (disabledCats.length > 0) {
          text += `
┃  📁 *Categories:*
┃  ${disabledCats.join(", ")}`;
        }
        
        text += `
╰━━━━━━━━━━━━━━━╯`;
        
        return reply(text);
      }
      
      if (action === "status") {
        if (!target) {
          return reply("❌ Please specify a command to check!");
        }
        const isEnabled = allvar.commands?.[target] !== false;
        return reply(`📊 Command *${target}*: ${isEnabled ? "✅ Enabled" : "❌ Disabled"}`);
      }
      
      if (action === "cat" || action === "category") {
        const catAction = args[1]?.toLowerCase();
        const catName = args[2]?.toLowerCase();
        
        if (!catAction || !catName || !["on", "off"].includes(catAction)) {
          return reply("❌ Usage: .allvar cat on/off <category>");
        }
        
        if (!allvar.categories) allvar.categories = {};
        allvar.categories[catName] = catAction === "on";
        saveAllvar(allvar);
        
        await react("✅");
        return reply(`✅ Category *${catName}* is now ${catAction === "on" ? "enabled" : "disabled"}!`);
      }
      
      if (!target) {
        return reply("❌ Please specify a command to toggle!");
      }
      
      if (action === "on") {
        if (!allvar.commands) allvar.commands = {};
        allvar.commands[target] = true;
        saveAllvar(allvar);
        await react("✅");
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  ✅ *COMMAND ENABLED*
┃━━━━━━━━━━━━━━━
┃  📝 Command: ${target}
┃  📊 Status: ON
╰━━━━━━━━━━━━━━━╯`);
      }
      
      if (action === "off") {
        if (!allvar.commands) allvar.commands = {};
        allvar.commands[target] = false;
        saveAllvar(allvar);
        await react("✅");
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  ❌ *COMMAND DISABLED*
┃━━━━━━━━━━━━━━━
┃  📝 Command: ${target}
┃  📊 Status: OFF
╰━━━━━━━━━━━━━━━╯`);
      }
      
    } catch (error) {
      console.error("Allvar error:", error);
      return reply(`❌ Error: ${error.message}`);
    }
  }
};

module.exports.isCommandEnabled = (cmdName, category) => {
  const allvar = loadAllvar();
  if (allvar.categories?.[category] === false) return false;
  if (allvar.commands?.[cmdName] === false) return false;
  return true;
};
