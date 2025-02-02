async function collectBlock(args) {
    const { blockName, amount, bot } = args;
    
    // Validate input
    if (!Number.isInteger(amount) || amount < 1) {
        return { success: false, message: 'Amount must be a positive integer' };
    }

    // Handle related block types
    const blockTypes = [blockName];
    if (['coal', 'diamond', 'emerald', 'iron', 'gold', 'lapis_lazuli', 'redstone'].includes(blockName)) {
        blockTypes.push(`${blockName}_ore`);
        blockTypes.push(`deepslate_${blockName}_ore`);
    } else if (blockName.endsWith('_ore')) {
        blockTypes.push(`deepslate_${blockName}`);
    } else if (blockName === 'dirt') {
        blockTypes.push('grass_block');
    }

    // Validate block types exist
    const validBlockTypes = blockTypes.filter(type => bot.registry.blocksByName[type]);
    if (validBlockTypes.length === 0) {
        return { success: false, message: `Block type not found: ${blockName}` };
    }

    let collected = 0;
    const failures = [];

    for (let i = 0; i < amount; i++) {
        // Find nearest block of any valid type
        let block = null;
        for (const blockType of validBlockTypes) {
            const foundBlock = bot.findBlock({
                matching: bot.registry.blocksByName[blockType].id,
                maxDistance: 64
            });
            if (foundBlock) {
                block = foundBlock;
                break;
            }
        }

        if (!block) {
            return {
                success: collected > 0,
                message: collected > 0 
                    ? `Collected ${collected} blocks. No more ${blockName} blocks found nearby.`
                    : `No ${blockName} blocks found nearby.`
            };
        }

        try {
            // Equip appropriate tool for the block
            await bot.tool.equipForBlock(block);
            
            // Check if we can harvest with current tool
            const itemId = bot.heldItem ? bot.heldItem.type : null;
            if (!block.canHarvest(itemId)) {
                return {
                    success: false,
                    message: `Don't have right tools to harvest ${blockName}.`
                };
            }

            // Attempt to collect the block
            await bot.collectBlock.collect(block);
            collected++;

        } catch (err) {
            failures.push(err.message);
            
            // Handle inventory full error specifically
            if (err.name === 'NoChests') {
                return {
                    success: collected > 0,
                    message: `Inventory full after collecting ${collected} blocks.`
                };
            }
            
            // If we've failed too many times consecutively, stop trying
            if (failures.length >= 3) {
                return {
                    success: collected > 0,
                    message: `Collection stopped after ${collected} blocks due to repeated failures: ${failures.join(', ')}`
                };
            }
            continue;
        }
    }

    return {
        success: true,
        message: `Successfully collected ${collected} ${blockName} blocks`
    };
}

function listInventory(args) {
    const { bot } = args;
    const items = bot.inventory.items();
    if (bot.registry.isNewerOrEqualTo('1.9') && bot.inventory.slots[45]) {
        items.push(bot.inventory.slots[45]);
    }
    
    // Creiamo un dizionario "oggetto: quantità"
    const inventoryDict = {};
    items.forEach(item => {
        inventoryDict[item.name] = (inventoryDict[item.name] || 0) + item.count;
    });
    
    return { 
        success: true, 
        inventory: Object.keys(inventoryDict).length > 0 ? inventoryDict : 'Empty inventory'
    };
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

module.exports = { collectBlock, listInventory, equipItem, tossItem };