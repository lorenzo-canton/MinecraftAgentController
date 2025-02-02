async function placeBlock(args) {
    const { blockName, bot } = args;
    
    // Validate block type exists
    const block = bot.registry.blocksByName[blockName];
    if (!block) {
        return { 
            success: false, 
            message: `Invalid block type: ${blockName}` 
        };
    }

    // Check inventory for block
    const item = bot.inventory.items().find(item => item.name === blockName);
    if (!item) {
        return { 
            success: false, 
            message: `Don't have any ${blockName} to place` 
        };
    }

    try {
        // Get position in front of bot
        const targetPos = bot.entity.position.offset(
            Math.sin(bot.entity.yaw) * 2,
            0,
            Math.cos(bot.entity.yaw) * 2
        );
        
        const targetBlock = bot.blockAt(targetPos);

        // Check if target location is already occupied
        if (targetBlock.name !== 'air') {
            return { 
                success: false, 
                message: `Cannot place block: location occupied by ${targetBlock.name}` 
            };
        }

        // Find adjacent block to build off of (prioritize bottom)
        const directions = [
            [0, -1, 0],  // bottom
            [0, 0, -1],  // north
            [0, 0, 1],   // south 
            [1, 0, 0],   // east
            [-1, 0, 0],  // west
            [0, 1, 0]    // top
        ];

        let referenceBlock = null;
        let placementVector = null;

        for (const [dx, dy, dz] of directions) {
            const possibleRef = bot.blockAt(targetPos.offset(dx, dy, dz));
            if (possibleRef.name !== 'air') {
                referenceBlock = possibleRef;
                placementVector = { x: -dx, y: -dy, z: -dz };
                break;
            }
        }

        if (!referenceBlock) {
            return { 
                success: false, 
                message: 'No adjacent block found to place against' 
            };
        }

        // Equip the block
        await bot.equip(item, 'hand');
        
        // Look at placement location
        await bot.lookAt(targetPos);

        // Place the block
        await bot.placeBlock(referenceBlock, placementVector);

        return { 
            success: true, 
            message: `Successfully placed ${blockName} in front of me` 
        };

    } catch (error) {
        return { 
            success: false, 
            message: `Failed to place block: ${error.message}` 
        };
    }
}

module.exports = { placeBlock };