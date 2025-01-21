const { MinecraftAIBot } = require('./bot/MinecraftAIBot');

const config = {
    host: 'localhost',
    port: 25565,
    username: 'AIBot',
    aiModel: 'command-r7b:latest',
    planningModel: 'deepseek-r1:14b',
    version: '1.20.4'
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