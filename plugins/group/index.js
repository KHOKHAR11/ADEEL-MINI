// Group Commands Index with Fast Execution
const { cmd } = require("../../lib/commandHandler");

// Add command
cmd({
    name: "add",
    aliases: ["adduser"],
    category: "group",
    desc: "Add a user to the group"
}, async (context) => {
    const { reply, react, socket, sock, conn, client, msg, q, from, isAdmins, isBotAdmins, isBotOwner } = context;
    const botClient = socket || sock || conn || client;

    if (!botClient) return reply("❌ Bot not available");

    try {
        await react?.("➕");
        
        if (!from?.endsWith("@g.us")) return reply("❌ Groups only!");
        if (!isAdmins && !isBotOwner) return reply("❌ Admin required!");
        if (!isBotAdmins) return reply("❌ Make bot admin!");

        const number = q?.replace(/[^0-9]/g, "");
        if (!number || number.length < 10) return reply("❌ Invalid number!");

        const jid = number + "@s.whatsapp.net";
        const [result] = await botClient.onWhatsApp(jid);
        
        if (!result?.exists) return reply(`❌ Not on WhatsApp: ${number}`);

        await botClient.groupParticipantsUpdate(from, [jid], "add");
        await reply(`✅ *Added ${number}*`);
        await react?.("✅");
    } catch (e) {
        console.error("Add error:", e.message);
        await reply(`❌ Error: ${e.message?.split('\n')[0]}`);
    }
});

// Kick command
cmd({
    name: "kick",
    aliases: ["remove", "ban"],
    category: "group",
    desc: "Kick a member from group"
}, async (context) => {
    const { reply, react, socket, sock, conn, client, msg, args, q, from, isAdmins, isBotAdmins, isBotOwner, m } = context;
    const botClient = socket || sock || conn || client;

    if (!botClient) return reply("❌ Bot not available");

    try {
        await react?.("👢");
        
        if (!from?.endsWith("@g.us")) return reply("❌ Groups only!");
        if (!isAdmins && !isBotOwner) return reply("❌ Admin required!");
        if (!isBotAdmins) return reply("❌ Make bot admin!");

        let target;
        if (msg?.quoted?.sender) {
            target = msg.quoted.sender;
        } else if (m?.quoted?.participant) {
            target = m.quoted.participant;
        } else if (q) {
            const num = q.replace(/[^0-9]/g, "");
            target = num + "@s.whatsapp.net";
        } else {
            return reply("❌ Reply to message or provide number!");
        }

        const groupMeta = await botClient.groupMetadata(from);
        const isAdmin = groupMeta.participants.find(p => p.id === target && p.admin);
        
        if (isAdmin && !isBotOwner) return reply("❌ Can't kick admins!");
        if (target === botClient.user?.id) return reply("❌ Can't kick myself!");

        await botClient.groupParticipantsUpdate(from, [target], "remove");
        await reply(`✅ *User removed*`);
        await react?.("✅");
    } catch (e) {
        console.error("Kick error:", e.message);
        await reply(`❌ Error: ${e.message?.split('\n')[0]}`);
    }
});

// Promote command
cmd({
    name: "promote",
    aliases: ["admin"],
    category: "group",
    desc: "Make user admin"
}, async (context) => {
    const { reply, react, socket, sock, conn, client, msg, q, from, isAdmins, isBotAdmins, isBotOwner, m } = context;
    const botClient = socket || sock || conn || client;

    if (!botClient) return reply("❌ Bot not available");

    try {
        await react?.("👑");
        
        if (!from?.endsWith("@g.us")) return reply("❌ Groups only!");
        if (!isAdmins && !isBotOwner) return reply("❌ Admin required!");
        if (!isBotAdmins) return reply("❌ Make bot admin!");

        let target = msg?.quoted?.sender || m?.quoted?.participant || q?.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        if (!target) return reply("❌ Reply or provide number!");

        await botClient.groupParticipantsUpdate(from, [target], "promote");
        await reply(`✅ *Promoted to admin*`);
        await react?.("✅");
    } catch (e) {
        console.error("Promote error:", e.message);
        await reply(`❌ Error: ${e.message?.split('\n')[0]}`);
    }
});

// Demote command
cmd({
    name: "demote",
    aliases: ["unadmin"],
    category: "group",
    desc: "Remove admin status"
}, async (context) => {
    const { reply, react, socket, sock, conn, client, msg, q, from, isAdmins, isBotAdmins, isBotOwner, m } = context;
    const botClient = socket || sock || conn || client;

    if (!botClient) return reply("❌ Bot not available");

    try {
        await react?.("📛");
        
        if (!from?.endsWith("@g.us")) return reply("❌ Groups only!");
        if (!isAdmins && !isBotOwner) return reply("❌ Admin required!");
        if (!isBotAdmins) return reply("❌ Make bot admin!");

        let target = msg?.quoted?.sender || m?.quoted?.participant || q?.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        if (!target) return reply("❌ Reply or provide number!");

        await botClient.groupParticipantsUpdate(from, [target], "demote");
        await reply(`✅ *Removed admin status*`);
        await react?.("✅");
    } catch (e) {
        console.error("Demote error:", e.message);
        await reply(`❌ Error: ${e.message?.split('\n')[0]}`);
    }
});

// Group Info
cmd({
    name: "ginfo",
    aliases: ["groupinfo", "info"],
    category: "group",
    desc: "Get group information"
}, async (context) => {
    const { reply, react, socket, sock, conn, client, from } = context;
    const botClient = socket || sock || conn || client;

    if (!botClient) return reply("❌ Bot not available");

    try {
        if (!from?.endsWith("@g.us")) return reply("❌ Groups only!");
        
        const meta = await botClient.groupMetadata(from);
        const admin = meta.participants.filter(p => p.admin).length;
        
        await reply(`*📊 Group Info*
        
Name: ${meta.subject}
Members: ${meta.participants.length}
Admins: ${admin}
Created: ${new Date(meta.creation * 1000).toLocaleDateString()}
Desc: ${meta.desc || 'No description'}`);
    } catch (e) {
        await reply(`❌ Error: ${e.message?.split('\n')[0]}`);
    }
});

// Close group
cmd({
    name: "close",
    aliases: ["closegroup"],
    category: "group",
    desc: "Close group (admins only)"
}, async (context) => {
    const { reply, react, socket, sock, conn, client, from, isAdmins, isBotAdmins, isBotOwner } = context;
    const botClient = socket || sock || conn || client;

    if (!botClient) return reply("❌ Bot not available");

    try {
        if (!from?.endsWith("@g.us")) return reply("❌ Groups only!");
        if (!isAdmins && !isBotOwner) return reply("❌ Admin required!");
        if (!isBotAdmins) return reply("❌ Make bot admin!");

        await botClient.groupSettingUpdate(from, "announcement");
        await reply(`✅ *Group closed (admins can send)*`);
        await react?.("✅");
    } catch (e) {
        await reply(`❌ Error: ${e.message?.split('\n')[0]}`);
    }
});

// Open group
cmd({
    name: "open",
    aliases: ["opengroup"],
    category: "group",
    desc: "Open group (anyone can send)"
}, async (context) => {
    const { reply, react, socket, sock, conn, client, from, isAdmins, isBotAdmins, isBotOwner } = context;
    const botClient = socket || sock || conn || client;

    if (!botClient) return reply("❌ Bot not available");

    try {
        if (!from?.endsWith("@g.us")) return reply("❌ Groups only!");
        if (!isAdmins && !isBotOwner) return reply("❌ Admin required!");
        if (!isBotAdmins) return reply("❌ Make bot admin!");

        await botClient.groupSettingUpdate(from, "not_announcement");
        await reply(`✅ *Group opened (anyone can send)*`);
        await react?.("✅");
    } catch (e) {
        await reply(`❌ Error: ${e.message?.split('\n')[0]}`);
    }
});

module.exports = { commands: require("../../lib/commandHandler").commands };
