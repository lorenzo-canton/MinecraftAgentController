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

module.exports = { toolDefinitions };