const mineflayer = require('mineflayer');
const { pathfinder, goals } = require('mineflayer-pathfinder');
const collectBlockPlugin = require('mineflayer-collectblock').plugin
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

function collectBlock(args) {
    const { blockName, bot } = args;
    const blockType = bot.registry.blocksByName[blockName];
    if (!blockType) return { success: false, message: 'Block type not found' };

    const block = bot.findBlock({
        matching: blockType.id,
        maxDistance: 10
    });

    if (!block) return { success: false, message: 'Block not found nearby' };

    try {
        bot.collectBlock.collect(block);
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

// Tool definitions for the AI (removed scan and inventory as they'll be part of system message)
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
            name: 'collectBlock',
            description: 'Collect a specific type of block nearby',
            parameters: {
                type: 'object',
                required: ['blockName'],
                properties: {
                    blockName: { 
                        type: 'string', 
                        description: 'Exact name of the block to collect (e.g., oak_log, not wood)' 
                    }
                }
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
        this.bot.loadPlugin(collectBlockPlugin);
        
        this.ollama = new Ollama({ host: 'http://127.0.0.1:11434' });
        
        // Initialize conversation history
        this.messages = [
            {
                role: 'system',
                content: `You are a Minecraft bot assistant. You can help players by moving to them, following them, and collecting blocks. 
                         You should always be aware of your surroundings and inventory to make informed decisions.
                         When players ask about specific blocks, check if they are visible in your surroundings first.
                         Be helpful and friendly in your responses.`
            }
        ];
        
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
        // Get current surroundings and inventory
        const surroundings = await this.availableFunctions.scanArea({});
        const inventory = await this.availableFunctions.listInventory({});
        
        // Create system message with current state
        const systemMessage = {
            role: 'system',
            content: `Current surroundings: ${JSON.stringify(surroundings.blocks)}
Current inventory: ${inventory.inventory}
                     
You are a Minecraft bot assistant. You can help players by moving to them, following them, and collecting blocks. 
You should always be aware of your surroundings and inventory to make informed decisions.
When players ask about specific blocks, check if they are visible in your surroundings first.
Be helpful and friendly in your responses.`};

        console.log('System message:\n', systemMessage.content)
        console.log('User message:\n', message)

        // Update messages with current system state and new user message
        this.messages = [
            systemMessage,
            ...this.messages.slice(1),
            { role: 'user', content: message }
        ];
        
        try {
            const response = await this.ollama.chat({
                model: this.config.aiModel,
                messages: this.messages,
                tools: toolDefinitions
            });

            if (response.message.tool_calls) {
                for (const tool of response.message.tool_calls) {
                    const functionToCall = this.availableFunctions[tool.function.name];
                    if (functionToCall) {
                        console.log('AI calling function:', tool.function.name);
                        console.log('Arguments:', tool.function.arguments);
                        
                        const output = functionToCall(tool.function.arguments);
                        console.log('Function output:', output);
                        
                        this.messages.push(response.message);
                        this.messages.push({
                            role: 'tool',
                            content: JSON.stringify(output)
                        });
                    }
                }

                const finalResponse = await this.ollama.chat({
                    model: this.config.aiModel,
                    messages: this.messages
                });

                // Add assistant's response to message history
                this.messages.push(finalResponse.message);
                return finalResponse.message.content;
            }

            // Add assistant's response to message history
            console.log(`Assistant:\n${response.message.content}`);
            this.messages.push(response.message);
            return response.message.content;
        } catch (error) {
            console.error('AI processing error:', error);
            return 'Sorry, I encountered an error processing your request.';
        }
    }

    setupEvents() {
        this.bot.on('spawn', () => {
            console.log('Bot spawned');
            this.bot.chat('AI Bot ready! Available commands: go to player, follow player, collect blocks');
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