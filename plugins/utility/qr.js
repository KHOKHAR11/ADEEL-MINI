const QRCode = require('qrcode');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'qr',
    aliases: ['qrcode', 'makeqr'],
    description: 'Generate QR code from text or URL',
    category: 'utility',
    usage: '.qr <text or url>',
    
    async execute(context) {
        const { reply, react, args, socket, from } = context;
        
        try {
            const text = args.join(' ');
            
            if (!text) {
                await react('❌');
                return await reply('Please provide text or URL to generate QR code.\nUsage: .qr https://example.com');
            }
            
            await react('⏳');
            
            const tempDir = path.join(process.cwd(), 'temp');
            await fs.ensureDir(tempDir);
            
            const qrPath = path.join(tempDir, `qr_${Date.now()}.png`);
            
            await QRCode.toFile(qrPath, text, {
                width: 500,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            
            await socket.sendMessage(from, {
                image: fs.readFileSync(qrPath),
                caption: `*QR Code Generated*\n\n📝 *Content:* ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}\n\n> *ADEEL-MINI*`
            });
            
            await react('✅');
            await fs.remove(qrPath);
            
        } catch (error) {
            console.error('QR command error:', error.message);
            await react('❌');
            await reply('Failed to generate QR code. Please try again.');
        }
    }
};
