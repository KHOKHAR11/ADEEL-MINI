module.exports = {
    name: 'calc',
    aliases: ['calculate', 'math', 'hisab'],
    description: 'Calculate mathematical expressions',
    category: 'utility',
    usage: '.calc <expression>',
    
    async execute(context) {
        const { reply, react, args } = context;
        
        try {
            const expression = args.join(' ');
            
            if (!expression) {
                await react('❌');
                return await reply('Please provide a math expression.\nUsage: .calc 5 + 10 * 2');
            }
            
            const sanitized = expression.replace(/[^0-9+\-*/().%\s^]/g, '');
            
            if (sanitized !== expression.replace(/\s/g, '').replace(/x/gi, '*')) {
                await react('❌');
                return await reply('Invalid characters in expression. Only numbers and +, -, *, /, (), %, ^ are allowed.');
            }
            
            const safeExpression = expression
                .replace(/x/gi, '*')
                .replace(/\^/g, '**')
                .replace(/÷/g, '/')
                .replace(/×/g, '*');
            
            const result = Function(`'use strict'; return (${safeExpression})`)();
            
            if (isNaN(result) || !isFinite(result)) {
                await react('❌');
                return await reply('Invalid calculation result.');
            }
            
            const formattedResult = Number.isInteger(result) ? result : result.toFixed(6).replace(/\.?0+$/, '');
            
            const response = `
╭━━━━🔢 *CALCULATOR* 🔢━━━━╮

📝 *Expression:* ${expression}
✅ *Result:* ${formattedResult}

╰━━━━🔢 *ADEEL-MINI* 🔢━━━━╯`;
            
            await react('✅');
            await reply(response);
            
        } catch (error) {
            console.error('Calc command error:', error.message);
            await react('❌');
            await reply('Failed to calculate. Please check your expression.');
        }
    }
};
