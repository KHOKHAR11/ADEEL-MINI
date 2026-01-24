const axios = require('axios');

module.exports = {
    name: 'joke',
    aliases: ['mazak', 'funny'],
    description: 'Get a random joke',
    category: 'fun',
    usage: '.joke',
    
    async execute(context) {
        const { reply, react } = context;
        
        try {
            await react('😂');
            
            const response = await axios.get('https://official-joke-api.appspot.com/random_joke', {
                timeout: 10000
            });
            
            const joke = response.data;
            
            const jokeText = `
╭━━━━😂 *RANDOM JOKE* 😂━━━━╮

❓ ${joke.setup}

😂 ${joke.punchline}

╰━━━━😂 *ADEEL-MINI* 😂━━━━╯`;
            
            await reply(jokeText);
            
        } catch (error) {
            console.error('Joke command error:', error.message);
            await react('❌');
            await reply('Failed to fetch joke. Please try again later.');
        }
    }
};
