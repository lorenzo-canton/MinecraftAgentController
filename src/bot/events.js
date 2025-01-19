function setupEvents(botInstance) {
    const { bot, aiProcessor, availableFunctions } = botInstance;

    bot.on('spawn', () => {
        console.log('Bot spawned');
        bot.chat('AI Bot ready! I can help with movement, block collection, crafting, and inventory management!');
    });

    bot.on('chat', async (username, message) => {
        if (username === bot.username) return;
        const response = await aiProcessor.processCommand(`${username}: ${message}`, availableFunctions);
        bot.chat(response);
    });

    bot.on('error', (err) => {
        console.error('Bot error:', err);
    });
}

module.exports = { setupEvents };