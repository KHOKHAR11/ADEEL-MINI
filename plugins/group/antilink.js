const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../../data/antilink.json");

function loadAntilink() {
    try {
        if (fs.existsSync(dataPath)) return JSON.parse(fs.readFileSync(dataPath, "utf8"));
        return {};
    } catch {
        return {};
    }
}

function saveAntilink(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "antilink",
    aliases: ["nolinks"],
    category: "group",
    description: "Enable/disable anti-link in group",

    async execute(context) {
        const { reply, react, from, isAdmins, isBotOwner, args } = context;

        if (!from?.endsWith("@g.us")) return reply("❌ Groups only!");
        if (!isAdmins && !isBotOwner) return reply("❌ Admin required!");

        try {
            await react?.("🔗");

            const data = loadAntilink();
            const action = args[0]?.toLowerCase();

            if (action === "on") {
                data[from] = true;
                saveAntilink(data);
                await reply("✅ Anti-link *enabled*\nLinks will be auto-deleted");
            } else if (action === "off") {
                delete data[from];
                saveAntilink(data);
                await reply("✅ Anti-link *disabled*");
            } else {
                const status = data[from] ? "✅ ON" : "❌ OFF";
                await reply(`🔗 Anti-link Status: ${status}`);
            }

            await react?.("✅");
        } catch (e) {
            await reply(`❌ Error: ${e.message?.split('\n')[0]}`);
        }
    }
};

module.exports.isAntilink = (groupId) => loadAntilink()[groupId] || false;
