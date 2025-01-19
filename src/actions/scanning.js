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

module.exports = { scanArea };