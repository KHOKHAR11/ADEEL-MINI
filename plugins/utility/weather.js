const axios = require('axios');

module.exports = {
    name: 'weather',
    aliases: ['mausam', 'w'],
    description: 'Get weather information for any city',
    category: 'utility',
    usage: '.weather <city name>',
    
    async execute(context) {
        const { reply, react, args } = context;
        
        try {
            if (!args || args.length === 0) {
                await react('❌');
                return await reply('Please provide a city name.\nUsage: .weather London');
            }
            
            const city = args.join(' ');
            await react('🌤️');
            
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=060a6bcfa19809c2cd4d97a212b19273&units=metric`,
                { timeout: 10000 }
            );
            
            const data = response.data;
            const weatherInfo = `
╭━━━━⏳ *WEATHER INFO* ⏳━━━━╮

🌍 *Location:* ${data.name}, ${data.sys.country}
🌡️ *Temperature:* ${data.main.temp}°C
🤒 *Feels Like:* ${data.main.feels_like}°C
💧 *Humidity:* ${data.main.humidity}%
🌬️ *Wind Speed:* ${data.wind.speed} m/s
☁️ *Clouds:* ${data.clouds.all}%
🌅 *Condition:* ${data.weather[0].description}
👁️ *Visibility:* ${(data.visibility / 1000).toFixed(1)} km

╰━━━━⏳ *ADEEL-MINI* ⏳━━━━╯`;
            
            await reply(weatherInfo);
            
        } catch (error) {
            console.error('Weather command error:', error.message);
            await react('❌');
            
            if (error.response?.status === 404) {
                await reply('City not found. Please check the spelling and try again.');
            } else {
                await reply('Failed to fetch weather data. Please try again later.');
            }
        }
    }
};
