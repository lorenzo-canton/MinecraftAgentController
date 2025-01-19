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

async function collectBlock(args) {
    const { blockName, bot } = args;
    const blockType = bot.registry.blocksByName[blockName];
    if (!blockType) return { success: false, message: 'Block type not found' };

    const block = bot.findBlock({
        matching: blockType.id,
        maxDistance: 10
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

// New async functions for item management
async function craftItem(args) {
    const { itemName, amount, bot } = args;
    const qty = parseInt(amount) || 1;
    
    const item = bot.registry.itemsByName[itemName];
    if (!item) return { success: false, message: `Unknown item: ${itemName}` };
    
    const craftingTableID = bot.registry.blocksByName.crafting_table.id;
    const craftingTable = bot.findBlock({
        matching: craftingTableID
    });
    
    const recipe = bot.recipesFor(item.id, null, 1, craftingTable)[0];
    if (!recipe) return { success: false, message: `I don't know how to craft ${itemName}` };
    
    try {
        await bot.craft(recipe, qty, craftingTable);
        return { success: true, message: `Crafted ${qty} x ${itemName}` };
    } catch (err) {
        return { success: false, message: `Failed to craft: ${err.message}` };
    }
}

async function equipItem(args) {
    const { itemName, destination, bot } = args;
    const items = bot.inventory.items();
    if (bot.registry.isNewerOrEqualTo('1.9') && bot.inventory.slots[45]) {
        items.push(bot.inventory.slots[45]);
    }
    
    const item = items.filter(item => item.name === itemName)[0];
    if (!item) return { success: false, message: `I don't have ${itemName}` };
    
    try {
        await bot.equip(item, destination);
        return { success: true, message: `Equipped ${itemName} to ${destination}` };
    } catch (err) {
        return { success: false, message: `Failed to equip: ${err.message}` };
    }
}

async function tossItem(args) {
    const { itemName, amount, bot } = args;
    const qty = parseInt(amount) || null;
    
    const items = bot.inventory.items();
    if (bot.registry.isNewerOrEqualTo('1.9') && bot.inventory.slots[45]) {
        items.push(bot.inventory.slots[45]);
    }
    
    const item = items.filter(item => item.name === itemName)[0];
    if (!item) return { success: false, message: `I don't have ${itemName}` };
    
    try {
        if (qty) {
            await bot.toss(item.type, null, qty);
            return { success: true, message: `Tossed ${qty} x ${itemName}` };
        } else {
            await bot.tossStack(item);
            return { success: true, message: `Tossed all ${itemName}` };
        }
    } catch (err) {
        return { success: false, message: `Failed to toss: ${err.message}` };
    }
}

// Tool definitions
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
    },
    {
        type: 'function',
        function: {
            name: 'craftItem',
            description: 'Craft a specific item using available materials',
            parameters: {
                type: 'object',
                required: ['itemName'],
                properties: {
                    itemName: { 
                        type: 'string', 
                        description: 'Name of the item to craft (e.g., stick, wooden_planks)' 
                    },
                    amount: { 
                        type: 'string', 
                        description: 'Number of items to craft (default: 1)' 
                    }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'equipItem',
            description: 'Equip an item from inventory to a specific slot',
            parameters: {
                type: 'object',
                required: ['itemName', 'destination'],
                properties: {
                    itemName: { 
                        type: 'string', 
                        description: 'Name of the item to equip' 
                    },
                    destination: { 
                        type: 'string', 
                        description: 'Where to equip the item (hand, head, torso, legs, feet, off-hand)' 
                    }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'tossItem',
            description: 'Drop items from inventory',
            parameters: {
                type: 'object',
                required: ['itemName'],
                properties: {
                    itemName: { 
                        type: 'string', 
                        description: 'Name of the item to toss' 
                    },
                    amount: { 
                        type: 'string', 
                        description: 'Amount to toss (if not specified, tosses entire stack)' 
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
        
        this.messages = [
            { role: 'system', content: undefined }
        ];
        
        this.availableFunctions = {
            goToPlayer: (args) => goToPlayer({ ...args, bot: this.bot }),
            followPlayer: (args) => followPlayer({ ...args, bot: this.bot }),
            scanArea: (args) => scanArea({ bot: this.bot }),
            collectBlock: (args) => collectBlock({ ...args, bot: this.bot }),
            listInventory: (args) => listInventory({ bot: this.bot }),
            craftItem: (args) => craftItem({ ...args, bot: this.bot }),
            equipItem: (args) => equipItem({ ...args, bot: this.bot }),
            tossItem: (args) => tossItem({ ...args, bot: this.bot })
        };

        this.setupEvents();
    }

    async processAICommand(message) {
        const surroundings = await this.availableFunctions.scanArea({});
        const inventory = await this.availableFunctions.listInventory({});
        
        const systemMessage = {
            role: 'system',
            content: `You are a Minecraft bot assistant. You can help players by moving to them, following them, collecting blocks, crafting items, managing inventory, and equipping/dropping items. 

Current surroundings: ${JSON.stringify(surroundings.blocks)}
Current inventory: ${inventory.inventory}
                     
You should always be aware of your surroundings and inventory to make informed decisions.`};

        console.log('System message:\n', systemMessage.content)
        console.log('User message:\n', message)

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
                        
                        // Handle async function calls
                        const output = await Promise.resolve(functionToCall(tool.function.arguments));
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

                this.messages.push(finalResponse.message);
                return finalResponse.message.content;
            }

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
            this.bot.chat('AI Bot ready! I can help with movement, block collection, crafting, and inventory management!');
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