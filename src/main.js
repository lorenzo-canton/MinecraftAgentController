const { MinecraftAIBot } = require('./bot/MinecraftAIBot');

const config = {
    host: 'localhost',
    port: 25565,
    username: 'AIBot',
    aiModel: 'mistral-small:latest',
    version: '1.20.4',
    maxToolIterations: 5,
    apiKey: "none",
    baseURL: 'http://127.0.0.1:11434/v1'
};

try {
    console.log('Starting AI-enabled Minecraft bot...');
    const bot = new MinecraftAIBot(config);
    
    process.on('SIGINT', () => {
        console.log('Shutting down bot...');
        if (bot.bot) {
            bot.bot.end();
        }
        process.exit();
    });
} catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
}