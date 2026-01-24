module.exports = {
    name: "channelinfo",
    aliases: ["cinfo", "cstat"],
    category: "utility",
    description: "Get detailed WhatsApp channel statistics",

    async execute(context) {
        const { reply, socket, q } = context;

        if (!q) {
            return reply(
                "📊 *CHANNEL INFO BOT*\n\n" +
                "📍 *Usage:*\n" +
                ".cinfo <channel_link>\n" +
                ".cinfo <channel_id>\n\n" +
                "📋 *Examples:*\n" +
                ".cinfo https://whatsapp.com/channel/123456\n" +
                ".cinfo 1234567890\n\n" +
                "🔍 *Features:*\n" +
                "• Subscriber count\n" +
                "• Creation date\n" +
                "• Admin info\n" +
                "• Recent activity\n" +
                "• Channel type\n"
            );
        }

        try {
            let channelId = q;
            
            // Extract ID from link
            if (q.includes('whatsapp.com/channel/')) {
                channelId = q.split('/')[4];
            }

            await reply("⏳ Fetching channel info...");

            // Get channel metadata
            const metadata = await socket.newsletterMetadata("invite", channelId);
            
            // Get channel messages for activity
            const messages = await socket.newsletterMessages(metadata.id, { limit: 20 });
            
            // Calculate stats
            const now = new Date();
            const creationDate = new Date(metadata.creation * 1000);
            const daysOld = Math.floor((now - creationDate) / (1000 * 60 * 60 * 24));
            
            // Analyze recent activity
            let messagesLast24h = 0;
            let messagesLast7d = 0;
            let lastMessageTime = null;
            
            if (messages && messages.length > 0) {
                const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
                const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                
                messages.forEach(msg => {
                    const msgTime = msg.messageTimestamp * 1000;
                    
                    if (msgTime > oneDayAgo) messagesLast24h++;
                    if (msgTime > sevenDaysAgo) messagesLast7d++;
                    
                    if (!lastMessageTime || msgTime > lastMessageTime) {
                        lastMessageTime = msgTime;
                    }
                });
            }
            
            // Calculate engagement rate (if subscribers available)
            let engagementRate = "N/A";
            if (metadata.subscribers && messagesLast24h > 0) {
                const rate = (messagesLast24h / metadata.subscribers * 100).toFixed(2);
                engagementRate = `${rate}%`;
            }
            
            // Generate report
            const report = 
                `📢 *CHANNEL ANALYSIS REPORT*\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `🏷️ *Channel Name:* ${metadata.name || 'N/A'}\n` +
                `🆔 *Channel ID:* ${metadata.id}\n\n` +
                `📊 *STATISTICS*\n` +
                `├─ 👥 Subscribers: ${metadata.subscribers?.toLocaleString() || 'Hidden'}\n` +
                `├─ 📅 Created: ${creationDate.toLocaleDateString()} (${daysOld} days ago)\n` +
                `├─ 👑 Admin: ${metadata.handle || 'Unknown'}\n` +
                `├─ 🔗 Type: ${metadata.isRestricted ? 'Private 🔒' : 'Public 🌐'}\n\n` +
                `📈 *ACTIVITY ANALYSIS*\n` +
                `├─ 📨 Last 24h: ${messagesLast24h} messages\n` +
                `├─ 📊 Last 7 days: ${messagesLast7d} messages\n` +
                `├─ ⏰ Last message: ${lastMessageTime ? new Date(lastMessageTime).toLocaleString() : 'Never'}\n` +
                `└─ 🎯 Engagement: ${engagementRate}\n\n` +
                `🔍 *DESCRIPTION*\n${metadata.description || 'No description'}\n\n` +
                `📌 *TIP:* ${metadata.subscribers > 10000 ? 'Large channel' : 'Growing channel'}`;
            
            await reply(report);
            
            // Send additional insights
            if (messages.length > 0) {
                const insights = 
                    `💡 *ADDITIONAL INSIGHTS*\n\n` +
                    `📊 *Message Frequency:*\n`;
                
                let freqMsg = '';
                const avgDaily = (messagesLast7d / 7).toFixed(1);
                
                if (avgDaily > 10) freqMsg = `High (${avgDaily}/day) 📈`;
                else if (avgDaily > 3) freqMsg = `Moderate (${avgDaily}/day) 📊`;
                else freqMsg = `Low (${avgDaily}/day) 📉`;
                
                await reply(insights + freqMsg);
            }
            
        } catch (error) {
            console.error("Channel info error:", error);
            
            if (error.message.includes("not found")) {
                await reply("❌ Channel not found or may be private!");
            } else {
                await reply(`❌ Error: ${error.message}`);
            }
        }
    }
};
