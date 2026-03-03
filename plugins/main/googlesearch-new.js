const axios = require('axios');

module.exports = {
    name: 'googlesearch',
    aliases: ['google', 'search', 'gs'],
    category: 'main',
    description: 'Search on Google',

    async execute(context) {
        const { reply, react, args, text } = context;

        try {
            if (react) await react('🔍');

            const query = args.join(' ');
            if (!query) {
                return reply('❌ *Usage:* `.googlesearch <query>`\n\nExample: `.googlesearch ADEEL`');
            }

            if (query.length > 100) {
                return reply('❌ Query too long! Maximum 100 characters.');
            }

            reply('🔍 *Searching Google...* Please wait');

            const response = await axios.get('https://zaynixapi12.vercel.app/api/googlesearch', {
                params: {
                    query: query,
                    apiKey: 'zaynixapi'
                },
                timeout: 30000
            });

            if (!response.data.success || !response.data.results) {
                return reply(`❌ No results found for "${query}"`);
            }

            let resultText = `🔍 *Google Search Results for: ${query}*\n\n`;
            const results = response.data.results.slice(0, 5);

            results.forEach((result, index) => {
                resultText += `${index + 1}. *${result.title || 'No title'}*\n`;
                resultText += `📎 ${result.url || 'No URL'}\n`;
                resultText += `📝 ${(result.description || 'No description').substring(0, 100)}\n\n`;
            });

            resultText += '> © ADEEL-MINI';
            reply(resultText);

        } catch (error) {
            console.error('[GOOGLESEARCH] Error:', error.message);
            reply(`❌ *Error:* ${error.message || 'Failed to search'}\n\nTry again later.`);
        }
    }
};
