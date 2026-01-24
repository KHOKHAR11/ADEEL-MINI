const axios = require('axios');

module.exports = {
    name: 'quote',
    aliases: ['motivate', 'inspire', 'aqwal'],
    description: 'Get a random motivational quote',
    category: 'fun',
    usage: '.quote',
    
    async execute(context) {
        const { reply, react } = context;
        
        try {
            await react('💭');
            
            const response = await axios.get('https://api.quotable.io/random', {
                timeout: 10000
            });
            
            const quote = response.data;
            
            const quoteText = `
╭━━━━💭 *INSPIRATIONAL QUOTE* 💭━━━━╮

📜 "${quote.content}"

✍️ *— ${quote.author}*

🏷️ *Tags:* ${quote.tags.join(', ')}

╰━━━━💭 *ADEEL-MINI* 💭━━━━╯`;
            
            await reply(quoteText);
            
        } catch (error) {
            console.error('Quote command error:', error.message);
            
            const fallbackQuotes = [
                { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
                { content: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
                { content: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
                { content: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" }
            ];
            
            const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
            
            await reply(`
╭━━━━💭 *INSPIRATIONAL QUOTE* 💭━━━━╮

📜 "${randomQuote.content}"

✍️ *— ${randomQuote.author}*

╰━━━━💭 *ADEEL-MINI* 💭━━━━╯`);
        }
    }
};
