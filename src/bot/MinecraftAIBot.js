const mineflayer = require('mineflayer');
const { pathfinder } = require('mineflayer-pathfinder');
const collectBlockPlugin = require('mineflayer-collectblock').plugin;
const { AIProcessor } = require('../ai/processor');
const { setupEvents } = require('./events');
const { toolDefinitions } = require('../tools/definitions');
const actions = require('../actions');

class MinecraftAIBot {
    constructor(config = {}) {
        this.config = {
            host: 'localhost',
            port: 25565,
            username: 'AIBot',
            aiModel: 'llama2',
            planningModel: 'llama2',
            ...config
        };
        
        this.bot = mineflayer.createBot(this.config);
        this.bot.loadPlugin(pathfinder);
        this.bot.loadPlugin(collectBlockPlugin);
        
        this.aiProcessor = new AIProcessor(this.bot, this.config);
        this.availableFunctions = this.setupFunctions();
        
        setupEvents(this);
    }

    setupFunctions() {
        return Object.entries(actions).reduce((acc, [name, func]) => {
            acc[name] = (args) => func({ ...args, bot: this.bot });
            return acc;
        }, {});
    }
}

module.exports = { MinecraftAIBot };