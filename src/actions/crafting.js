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

module.exports = { craftItem };