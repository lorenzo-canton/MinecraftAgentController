const mineflayer = require('mineflayer');
const { pathfinder, goals } = require('mineflayer-pathfinder');
const { Ollama } = require('ollama');

// Minecraft bot functions that can be called by the AI
function goToPlayer(args) {
    const { playerName, bot } = args;
    const target = bot.players[playerName]?.entity;
    if (!target) return { success: false, message: 'Player not found' };
    bot.pathfinder.setGoal(new goals.GoalNear(target.position.x, target.position.y, target.position.z, 2));
    return { success: true, message: `Moving to player ${playerName}` };
}

function followPlayer(args) {
    const { playerName, bot } = args;
    const target = bot.players[playerName]?.entity;
    if (!target) return { success: false, message: 'Player not found' };
    bot.pathfinder.setGoal(new goals.GoalFollow(target, 2), true);
    return { success: true, message: `Following player ${playerName}` };
}

function scanArea(args) {
    const { bot } = args;
    const blocks = {};
    const pos = bot.entity.position;
    const radius = 10;
    
    for (let x = -radius; x <= radius; x++) {
        for (let y = -radius; y <= radius; y++) {
            for (let z = -radius; z <= radius; z++) {
                const block = bot.blockAt(pos.offset(x, y, z));
                if (block?.name !== 'air') {
                    blocks[block.name] = (blocks[block.name] || 0) + 1;
                }
            }
        }
    }
    return { success: true, blocks };
}

async function collectBlock(args) {
    const { blockName, bot } = args;
    const blockType = bot.registry.blocksByName[blockName];
    if (!blockType) return { success: false, message: 'Block type not found' };

    const block = bot.findBlock({
        matching: blockType.id,
        maxDistance: 64
    });

    if (!block) return { success: false, message: 'Block not found nearby' };

    try {
        await bot.collectBlock.collect(block);
        return { success: true, message: `Collected ${blockName}` };
    } catch (err) {
        return { success: false, message: `Failed to collect: ${err.message}` };
    }
}

function listInventory(args) {
    const { bot } = args;
    const items = bot.inventory.items();
    if (bot.registry.isNewerOrEqualTo('1.9') && bot.inventory.slots[45]) {
        items.push(bot.inventory.slots[45]);
    }
    const itemList = items.map(i => `${i.name} x ${i.count}`).join(', ');
    return { success: true, inventory: itemList || 'Empty inventory' };
}

// Tool definitions for the AI
const toolDefinitions = [
    {
        type: 'function',
        function: {
            name: 'goToPlayer',
            description: 'Move the bot to a specific player with 2 block distance',
            parameters: {
                type: 'object',
                required: ['playerName'],
                properties: {
                    playerName: { type: 'string', description: 'Name of the player to move to' }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'followPlayer',
            description: 'Make the bot follow a specific player with 2 block distance',
            parameters: {
                type: 'object',
                required: ['playerName'],
                properties: {
                    playerName: { type: 'string', description: 'Name of the player to follow' }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'scanArea',
            description: 'Scan blocks in a 10 block radius around the bot',
            parameters: {
                type: 'object',
                properties: {}
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'collectBlock',
            description: 'Collect a specific type of block nearby',
            parameters: {
                type: 'object',
                required: ['blockName'],
                properties: {
                    blockName: { type: 'string', description: 'Name of the block to collect' }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'listInventory',
            description: 'List all items in the bot inventory',
            parameters: {
                type: 'object',
                properties: {}
            }
        }
    }
];

class MinecraftAIBot {
    constructor(config = {}) {
        this.config = {
            host: 'localhost',
            port: 25565,
            username: 'AIBot',
            aiModel: 'llama2',
            ...config
        };
        
        this.bot = mineflayer.createBot(this.config);
        this.bot.loadPlugin(pathfinder);
        this.bot.loadPlugin(require('mineflayer-collectblock').plugin);
        
        this.ollama = new Ollama({ host: 'http://127.0.0.1:11434' });
        
        this.availableFunctions = {
            goToPlayer: (args) => goToPlayer({ ...args, bot: this.bot }),
            followPlayer: (args) => followPlayer({ ...args, bot: this.bot }),
            scanArea: (args) => scanArea({ bot: this.bot }),
            collectBlock: (args) => collectBlock({ ...args, bot: this.bot }),
            listInventory: (args) => listInventory({ bot: this.bot })
        };

        this.setupEvents();
    }

    async processAICommand(message) {
        const messages = [{ role: 'user', content: message }];
        
        try {
            const response = await this.ollama.chat({
                model: this.config.aiModel,
                messages: messages,
                tools: toolDefinitions
            });

            if (response.message.tool_calls) {
                for (const tool of response.message.tool_calls) {
                    const functionToCall = this.availableFunctions[tool.function.name];
                    if (functionToCall) {
                        console.log('AI calling function:', tool.function.name);
                        console.log('Arguments:', tool.function.arguments);
                        
                        const output = await Promise.resolve(functionToCall(tool.function.arguments));
                        console.log('Function output:', output);
                        
                        messages.push(response.message);
                        messages.push({
                            role: 'tool',
                            content: JSON.stringify(output)
                        });
                    }
                }

                const finalResponse = await this.ollama.chat({
                    model: this.config.aiModel,
                    messages: messages
                });

                return finalResponse.message.content;
            }

            return response.message.content;
        } catch (error) {
            console.error('AI processing error:', error);
            return 'Sorry, I encountered an error processing your request.';
        }
    }

    setupEvents() {
        this.bot.on('spawn', () => {
            console.log('Bot spawned');
            this.bot.chat('AI Bot ready! Available commands: go to player, follow player, scan area, collect blocks, list inventory');
        });

        this.bot.on('chat', async (username, message) => {
            if (username === this.bot.username) return;
            const response = await this.processAICommand(`${username}: ${message}`);
            this.bot.chat(response);
        });

        this.bot.on('error', (err) => {
            console.error('Bot error:', err);
        });
    }
}

module.exports = { MinecraftAIBot };