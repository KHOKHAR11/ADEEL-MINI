const config = require("../../config");

module.exports = {
  name: "channel",
  aliases: ["ch", "whatsappchannel", "wachannel"],
  category: "main",
  description: "Get bot WhatsApp channel link with social buttons",

  async execute(context) {
    const { reply, react, socket, sock, conn, client, from, pushName } = context;

    try {
      if (react) await react("📢");
    } catch (e) {}

    const founderName = config.FOUNDER_NAME || "ADEEL-MD";
    const botName = config.BOT_NAME || "ADEEL-MINI";
    const channelLink = config.CHANNEL_LINK || "https://whatsapp.com/channel/0029VbBmz4V5vKAIaWfYPT0C";
    const groupLink = config.GROUP_INVITE_LINK || "https://chat.whatsapp.com/Lgzkk6HHuZICvYFMigyFrZ?mode=wwt";
    const userName = pushName || "User";

    const caption = `╭━━━━━━━━━━━━━╮
┃  📢 *${botName}*
┃  ━━━━━━━━━━━━━
┃  👋 Hello, *${userName}*!
╰━━━━━━━━━━━━━━╯

╭━━ *OFFICIAL LINKS* ━━╮
┃
┃  📢 *WhatsApp Channel:*
┃  ${channelLink}
┃
┃  👥 *Support Group:*
┃  ${groupLink}
┃
╰━━━━━━━━━━━━━━━━╯

╭━━ *FOUNDER INFO* ━━╮
┃  👤 Name: *${founderName}*
┃  🤖 Bot: *${botName}*
┃  📱 Telegram: @ADEEL-MD
╰━━━━━━━━━━━━━━━━╯

> © *${founderName}* ッ
> _Join our channel for updates!_`;

    const botClient = socket || sock || conn || client || null;
    const chatId = from || (context.m && context.m.chat) || context.chat || null;

    try {
      if (botClient && typeof botClient.sendPresenceUpdate === "function" && chatId) {
        await botClient.sendPresenceUpdate("composing", chatId);
        await new Promise(res => setTimeout(res, 400));
      }
    } catch (err) {}

    try {
      if (typeof reply === "function") {
        await reply(caption);
      } else if (botClient && typeof botClient.sendMessage === "function" && chatId) {
        await botClient.sendMessage(chatId, { text: caption });
      }
    } catch (sendErr) {
      console.error("Channel command error:", sendErr.message);
    }

    try {
      if (react) await react("✅");
    } catch (e) {}

    try {
      if (botClient && typeof botClient.sendPresenceUpdate === "function" && chatId) {
        await botClient.sendPresenceUpdate("paused", chatId);
      }
    } catch (err) {}
  }
};
