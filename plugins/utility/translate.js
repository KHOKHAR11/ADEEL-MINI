const axios = require('axios');

module.exports = {
    name: 'translate',
    aliases: ['tr', 'terjemah'],
    description: 'Translate text to another language',
    category: 'utility',
    usage: '.translate <lang> <text>',
    
    async execute(context) {
        const { reply, react, args, m } = context;
        
        try {
            let targetLang = args[0];
            let textToTranslate = '';
            
            if (m?.quoted?.msg) {
                textToTranslate = m.quoted.body || m.quoted.msg?.text || '';
                if (!targetLang) targetLang = 'en';
            } else {
                textToTranslate = args.slice(1).join(' ');
            }
            
            if (!textToTranslate) {
                await react('❌');
                return await reply('Please provide text to translate.\nUsage: .translate en Hello world\nOr reply to a message with .translate <lang>');
            }
            
            await react('🔄');
            
            const response = await axios.get(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=auto|${targetLang}`,
                { timeout: 10000 }
            );
            
            const translated = response.data.responseData.translatedText;
            const detectedLang = response.data.responseData.detectedLanguage || 'auto';
            
            const result = `
╭━━━━🌐 *TRANSLATION* 🌐━━━━╮

📥 *Original:* ${textToTranslate}
🔤 *Detected:* ${detectedLang}
📤 *Translated (${targetLang}):*
${translated}

╰━━━━🌐 *ADEEL-MINI* 🌐━━━━╯`;
            
            await react('✅');
            await reply(result);
            
        } catch (error) {
            console.error('Translate command error:', error.message);
            await react('❌');
            await reply('Translation failed. Please try again later.');
        }
    }
};
