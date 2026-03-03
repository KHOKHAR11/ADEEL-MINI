const axios = require('axios');

module.exports = {
    name: 'fact',
    aliases: ['randomfact', 'funfact'],
    description: 'Get a random interesting fact',
    category: 'fun',
    usage: '.fact',
    
    async execute(context) {
        const { reply, react } = context;
        
        try {
            await react('🧠');
            
            const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en', {
                timeout: 10000
            });
            
            const fact = response.data;
            
            const factText = `
╭━━━━🧠 *RANDOM FACT* 🧠━━━━╮

📚 ${fact.text}

╰━━━━🧠 *ADEEL-MINI* 🧠━━━━╯`;
            
            await reply(factText);
            
        } catch (error) {
            console.error('Fact command error:', error.message);
            
            const fallbackFacts = [
                "Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still edible.",
                "Octopuses have three hearts and blue blood.",
                "A day on Venus is longer than its year.",
                "The inventor of the Pringles can is buried in one.",
                "Bananas are berries, but strawberries aren't."
            ];
            
            const randomFact = fallbackFacts[Math.floor(Math.random() * fallbackFacts.length)];
            
            await reply(`
╭━━━━🧠 *RANDOM FACT* 🧠━━━━╮

📚 ${randomFact}

╰━━━━🧠 *ADEEL-MINI* 🧠━━━━╯`);
        }
    }
};
