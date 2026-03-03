const fs = require("fs");
const path = require("path");

const warnPath = path.join(__dirname, "../../data/warnings.json");

function loadWarnings() {
  try {
    if (fs.existsSync(warnPath)) {
      return JSON.parse(fs.readFileSync(warnPath, "utf8"));
    }
    return {};
  } catch {
    return {};
  }
}

function saveWarnings(data) {
  fs.writeFileSync(warnPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "warn",
  aliases: ["warning", "strike"],
  category: "group",
  description: "Warn a user in the group",
  
  async execute(context) {
    const { reply, react, socket, sock, conn, client, from, args, q, isAdmins, isBotOwner, m, mentionUser } = context;
    const botClient = socket || sock || conn || client;
    
    if (!from || !from.endsWith("@g.us")) {
      return reply("❌ This command only works in groups!");
    }
    
    if (!isAdmins && !isBotOwner) {
      return reply("❌ Only group admins can use this command!");
    }
    
    try {
      await react("⚠️");
      
      const warnings = loadWarnings();
      const action = args[0]?.toLowerCase();
      
      if (action === "list") {
        if (!warnings[from]) {
          return reply("✅ No warnings in this group!");
        }
        const warnedUsers = Object.entries(warnings[from]);
        if (warnedUsers.length === 0) {
          return reply("✅ No warnings in this group!");
        }
        const list = warnedUsers.map(([user, data], i) => 
          `${i + 1}. @${user.split("@")[0]} - ${data.count} warns`
        ).join("\n");
        const mentions = warnedUsers.map(([user]) => user);
        
        await botClient.sendMessage(from, {
          text: `╭━━━━━━━━━━━━━━━╮
┃  ⚠️ *WARNINGS LIST*
┃━━━━━━━━━━━━━━━
${list}
╰━━━━━━━━━━━━━━━╯`,
          mentions
        });
        return;
      }
      
      if (action === "reset") {
        const target = mentionUser?.[0] || args[1];
        if (!target) {
          return reply("❌ Please mention a user to reset warnings!");
        }
        if (warnings[from] && warnings[from][target]) {
          delete warnings[from][target];
          saveWarnings(warnings);
          return reply(`✅ Warnings reset for @${target.split("@")[0]}!`);
        }
        return reply("⚠️ User has no warnings!");
      }
      
      if (action === "clear") {
        if (warnings[from]) {
          delete warnings[from];
          saveWarnings(warnings);
        }
        return reply("✅ All warnings cleared for this group!");
      }
      
      const target = mentionUser?.[0] || (m?.quoted?.sender);
      if (!target) {
        return reply(`╭━━━━━━━━━━━━━━━╮
┃  ⚠️ *WARN SYSTEM*
┃━━━━━━━━━━━━━━━
┃  📝 *Usage:*
┃  .warn @user <reason>
┃  .warn list
┃  .warn reset @user
┃  .warn clear
┃━━━━━━━━━━━━━━━
┃  ℹ️ 3 warnings = kick
╰━━━━━━━━━━━━━━━╯

> ADEEL-MINI`);
      }
      
      const reason = q || args.slice(1).join(" ") || "No reason provided";
      
      if (!warnings[from]) warnings[from] = {};
      if (!warnings[from][target]) warnings[from][target] = { count: 0, reasons: [] };
      
      warnings[from][target].count++;
      warnings[from][target].reasons.push({
        reason,
        date: new Date().toISOString(),
        by: m?.sender
      });
      
      saveWarnings(warnings);
      
      const warnCount = warnings[from][target].count;
      const maxWarns = 3;
      
      await botClient.sendMessage(from, {
        text: `╭━━━━━━━━━━━━━━━╮
┃  ⚠️ *USER WARNED*
┃━━━━━━━━━━━━━━━
┃  👤 User: @${target.split("@")[0]}
┃  📝 Reason: ${reason}
┃  🔢 Warnings: ${warnCount}/${maxWarns}
╰━━━━━━━━━━━━━━━╯

${warnCount >= maxWarns ? "❌ Max warnings reached! User should be removed." : "⚠️ Be careful!"}`,
        mentions: [target]
      });
      
      await react("✅");
      
    } catch (error) {
      console.error("Warn error:", error);
      return reply(`❌ Error: ${error.message}`);
    }
  }
};

module.exports.getWarnings = (groupId, userId) => {
  const warnings = loadWarnings();
  return warnings[groupId]?.[userId] || { count: 0, reasons: [] };
};
