const { goals, Movements } = require('mineflayer-pathfinder');

async function goToPlayer(args) {
    const { playerName, bot } = args;
    const target = bot.players[playerName]?.entity;
    
    if (!target) {
        return { success: false, message: `Player ${playerName} not found` };
    }

    try {
        // Create custom movements configuration
        const movements = new Movements(bot);
        bot.pathfinder.setMovements(movements);

        // Set goal with a default distance of 3 blocks
        await bot.pathfinder.goto(new goals.GoalNear(target.position.x, target.position.y, target.position.z, 3));
        
        return { 
            success: true, 
            message: `Successfully reached player ${playerName}`
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to reach ${playerName}: ${error.message}`
        };
    }
}

async function followPlayer(args) {
    const { playerName, bot } = args;
    const target = bot.players[playerName]?.entity;
    
    if (!target) {
        return { success: false, message: `Player ${playerName} not found` };
    }

    try {
        // Create custom movements configuration
        const movements = new Movements(bot);
        bot.pathfinder.setMovements(movements);

        // Set up continuous following with a 4 block distance
        bot.pathfinder.setGoal(new goals.GoalFollow(target, 4), true);

        // Set up position check interval
        const checkInterval = setInterval(() => {
            if (!bot.players[playerName]?.entity) {
                clearInterval(checkInterval);
                bot.pathfinder.stop();
                bot.chat(`Lost track of ${playerName}`);
                return;
            }

            const distance = bot.entity.position.distanceTo(target.position);
            if (distance > 20) {
                // If distance is too great, reset pathfinding
                bot.pathfinder.setGoal(new goals.GoalFollow(target, 4), true);
            }
        }, 1000);

        // Clean up interval when pathfinding stops
        bot.once('stopPathfinding', () => {
            clearInterval(checkInterval);
        });
        
        return { 
            success: true, 
            message: `Now following player ${playerName}`
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to follow ${playerName}: ${error.message}`
        };
    }
}

module.exports = { goToPlayer, followPlayer };