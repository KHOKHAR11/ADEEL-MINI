const fs = require("fs");
const path = require("path");

const antiGroupPath = path.join(__dirname, "../../data/antigroup.json");

function loadAntiGroupSettings() {
  try {
    if (fs.existsSync(antiGroupPath)) {
      return JSON.parse(fs.readFileSync(antiGroupPath, "utf8"));
    }
    return { enabled: false, whitelist: [] };
  } catch {
    return { enabled: false, whitelist: [] };
  }
}

function saveAntiGroupSettings(data) {
  fs.writeFileSync(antiGroupPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "antigroup",
  aliases: ["nogroup", "groupblock"],
  category: "owner",
  description: "Prevent bot from being added to unknown groups",
  
  async execute(context) {
    const { reply, react, args, isOwner, socket, sock, conn, client, from } = context;
    const botClient = socket || sock || conn || client;
    
    if (!isOwner) {
      return reply("❌ Only the bot owner can use this command!");
    }
    
    try {
      await react("🛡️");
      
      const settings = loadAntiGroupSettings();
      const action = args[0]?.toLowerCase();
      
      if (!action || !["on", "off", "status", "whitelist", "add", "remove"].includes(action)) {
        const currentStatus = settings.enabled ? "✅ ON" : "❌ OFF";
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  🛡️ *ANTI-GROUP*
┃━━━━━━━━━━━━━━━
┃  📊 Status: ${currentStatus}
┃  📋 Whitelist: ${settings.whitelist?.length || 0} groups
┃━━━━━━━━━━━━━━━
┃  📝 *Usage:*
┃  .antigroup on
┃  .antigroup off
┃  .antigroup status
┃  .antigroup add <jid>
┃  .antigroup remove <jid>
┃  .antigroup whitelist
╰━━━━━━━━━━━━━━━╯

> Zaynix-PRIME`);
      }
      
      if (action === "status") {
        const currentStatus = settings.enabled ? "✅ Enabled" : "❌ Disabled";
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  🛡️ *ANTI-GROUP STATUS*
┃━━━━━━━━━━━━━━━
┃  📊 ${currentStatus}
┃  📋 Whitelist: ${settings.whitelist?.length || 0}
╰━━━━━━━━━━━━━━━╯`);
      }
      
      if (action === "whitelist") {
        if (!settings.whitelist?.length) {
          return reply("📋 Whitelist is empty. Use .antigroup add <jid> to add groups.");
        }
        const list = settings.whitelist.map((jid, i) => `${i + 1}. ${jid}`).join("\n");
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  📋 *WHITELIST*
┃━━━━━━━━━━━━━━━
${list}
╰━━━━━━━━━━━━━━━╯`);
      }
      
      if (action === "add") {
        const jid = args[1] || from;
        if (!jid.endsWith("@g.us")) {
          return reply("❌ Invalid group JID format!");
        }
        if (!settings.whitelist) settings.whitelist = [];
        if (settings.whitelist.includes(jid)) {
          return reply("⚠️ This group is already in whitelist!");
        }
        settings.whitelist.push(jid);
        saveAntiGroupSettings(settings);
        await react("✅");
        return reply(`✅ Group added to whitelist!\nJID: ${jid}`);
      }
      
      if (action === "remove") {
        const jid = args[1];
        if (!jid) {
          return reply("❌ Please provide group JID to remove!");
        }
        if (!settings.whitelist?.includes(jid)) {
          return reply("⚠️ This group is not in whitelist!");
        }
        settings.whitelist = settings.whitelist.filter(g => g !== jid);
        saveAntiGroupSettings(settings);
        await react("✅");
        return reply(`✅ Group removed from whitelist!\nJID: ${jid}`);
      }
      
      if (action === "on") {
        settings.enabled = true;
        saveAntiGroupSettings(settings);
        await react("✅");
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  🛡️ *ANTI-GROUP ENABLED*
┃━━━━━━━━━━━━━━━
┃  ✅ Protection: ON
┃  ⚠️ Bot will leave unknown
┃  groups automatically
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
      if (action === "off") {
        settings.enabled = false;
        saveAntiGroupSettings(settings);
        await react("✅");
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  🛡️ *ANTI-GROUP DISABLED*
┃━━━━━━━━━━━━━━━
┃  ❌ Protection: OFF
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
    } catch (error) {
      console.error("AntiGroup error:", error);
      return reply(`❌ Error: ${error.message}`);
    }
  }
};

module.exports.checkAntiGroup = (groupId) => {
  const settings = loadAntiGroupSettings();
  if (!settings.enabled) return { leave: false };
  if (settings.whitelist?.includes(groupId)) return { leave: false };
  return { leave: true };
};
        }
        settings.whitelist = settings.whitelist.filter(g => g !== jid);
        saveAntiGroupSettings(settings);
        await react("✅");
        return reply(`✅ Group removed from whitelist!\nJID: ${jid}`);
      }
      
      if (action === "on") {
        settings.enabled = true;
        saveAntiGroupSettings(settings);
        await react("✅");
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  🛡️ *ANTI-GROUP ENABLED*
┃━━━━━━━━━━━━━━━
┃  ✅ Protection: ON
┃  ⚠️ Bot will leave unknown
┃  groups automatically
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
      if (action === "off") {
        settings.enabled = false;
        saveAntiGroupSettings(settings);
        await react("✅");
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  🛡️ *ANTI-GROUP DISABLED*
┃━━━━━━━━━━━━━━━
┃  ❌ Protection: OFF
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
    } catch (error) {
      console.error("AntiGroup error:", error);
      return reply(`❌ Error: ${error.message}`);
    }
  }
};

module.exports.checkAntiGroup = (groupId) => {
  const settings = loadAntiGroupSettings();
  if (!settings.enabled) return { leave: false };
  if (settings.whitelist?.includes(groupId)) return { leave: false };
  return { leave: true };
};
