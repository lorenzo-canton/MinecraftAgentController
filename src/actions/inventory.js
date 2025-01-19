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