const { goToPlayer, followPlayer } = require('./movements');
const { scanArea } = require('./scanning');
const { collectBlock, listInventory, equipItem, tossItem } = require('./inventory');
const { craftItem } = require('./crafting');

module.exports = {
    goToPlayer,
    followPlayer,
    scanArea,
    collectBlock,
    listInventory,
    equipItem,
    tossItem,
    craftItem
};