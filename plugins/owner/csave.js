module.exports = {
    name: "channelsave",
    aliases: ["csave", "carchive"],
    category: "utility",
    description: "Save/archive WhatsApp channel messages",

    async execute(context) {
        const { reply, socket, q, isOwner } = context;

        if (!isOwner) return reply("❌ Owner only command.");

        if (!q) {
            return reply(
                "💾 *CHANNEL ARCHIVER*\n\n" +
                "📍 *Usage:*\n" +
                ".csave <link> <count>\n" +
                ".csave <link> all\n\n" +
                "📋 *Examples:*\n" +
                ".csave https://whatsapp.com/channel/123 50\n" +
                ".csave https://whatsapp.com/channel/456 all\n\n" +
                "📂 *Output:*\n" +
                "• Saves as JSON file\n" +
                "• Includes text & media\n" +
                "• Timestamps included\n" +
                "• Exports to TXT also"
            );
        }

        try {
            const args = q.split(" ");
            const link = args[0];
            const count = args[1] === "all" ? 1000 : parseInt(args[1]) || 50;
            
            if (!link.includes('whatsapp.com/channel/')) {
                return reply("❌ Invalid channel link!");
            }
            
            if (count > 1000) {
                return reply("❌ Maximum 1000 messages at once!");
            }
            
            const channelId = link.split('/')[4];
            
            const status = await reply(
                `📥 *Downloading Messages*\n\n` +
                `🔗 Channel: ${link}\n` +
                `📊 Messages: ${count}\n` +
                `⏳ Please wait...`
            );
            
            // Get channel metadata
            const metadata = await socket.newsletterMetadata("invite", channelId);
            
            // Fetch messages
            const allMessages = [];
            let cursor = null;
            let fetched = 0;
            
            while (fetched < count) {
                const batchSize = Math.min(50, count - fetched);
                const options = { limit: batchSize };
                if (cursor) options.before = cursor;
                
                const messages = await socket.newsletterMessages(metadata.id, options);
                
                if (!messages || messages.length === 0) break;
                
                allMessages.push(...messages);
                fetched += messages.length;
                cursor = messages[messages.length - 1]?.id;
                
                // Update status
                await socket.sendMessage(
                    status.key.remoteJid,
                    { text: `⏳ Fetched ${fetched}/${count} messages...` },
                    { edit: status.key }
                );
                
                if (messages.length < batchSize) break;
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Process messages
            const processed = allMessages.map(msg => ({
                id: msg.id,
                timestamp: new Date(msg.messageTimestamp * 1000).toISOString(),
                text: msg.message?.conversation || 
                      msg.message?.extendedTextMessage?.text || 
                      '[Media/System Message]',
                sender: msg.sender || 'System',
                type: Object.keys(msg.message || {})[0] || 'unknown',
                reactions: msg.reactions || []
            }));
            
            // Save to JSON file
            const fs = require('fs');
            const path = require('path');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `channel_${channelId}_${timestamp}.json`;
            const filepath = path.join(__dirname, '../../saved_channels', filename);
            
            // Create directory if not exists
            if (!fs.existsSync(path.dirname(filepath))) {
                fs.mkdirSync(path.dirname(filepath), { recursive: true });
            }
            
            // Save JSON
            fs.writeFileSync(
                filepath,
                JSON.stringify({
                    channel_info: metadata,
                    total_messages: processed.length,
                    export_date: new Date().toISOString(),
                    messages: processed
                }, null, 2)
            );
            
            // Also save as readable TXT
            const txtFile = filepath.replace('.json', '.txt');
            let txtContent = `CHANNEL ARCHIVE\n`;
            txtContent += `====================\n\n`;
            txtContent += `Channel: ${metadata.name || 'N/A'}\n`;
            txtContent += `ID: ${metadata.id}\n`;
            txtContent += `Export Date: ${new Date().toLocaleString()}\n`;
            txtContent += `Total Messages: ${processed.length}\n\n`;
            txtContent += `MESSAGES:\n`;
            txtContent += `====================\n\n`;
            
            processed.forEach((msg, index) => {
                txtContent += `[${index + 1}] ${msg.timestamp}\n`;
                txtContent += `📝 ${msg.text.substring(0, 200)}\n\n`;
            });
            
            fs.writeFileSync(txtFile, txtContent);
            
            // Send summary
            const summary = 
                `✅ *Archive Complete!*\n\n` +
                `📁 Files Saved:\n` +
                `• ${filename} (JSON)\n` +
                `• ${filename.replace('.json', '.txt')} (TXT)\n\n` +
                `📊 Statistics:\n` +
                `• Channel: ${metadata.name || 'N/A'}\n` +
                `• Messages: ${processed.length}\n` +
                `• Time Range: ${processed.length > 0 ? 
                    `${processed[processed.length-1].timestamp} to ${processed[0].timestamp}` : 
                    'N/A'}\n\n` +
                `💡 *Sample Messages:*\n`;
            
            // Show first 3 messages as preview
            const preview = processed.slice(0, 3).map((msg, i) => 
                `${i+1}. ${msg.text.substring(0, 50)}...`
            ).join('\n');
            
            await reply(summary + preview);
            
            // Delete status message
            try {
                await socket.sendMessage(status.key.remoteJid, { delete: status.key });
            } catch (e) {
                // Ignore
            }
            
        } catch (error) {
            console.error("Save error:", error);
            await reply(`❌ Error: ${error.message}`);
        }
    }
};
