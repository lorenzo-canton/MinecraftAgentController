const { goals } = require('mineflayer-pathfinder');

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

module.exports = { goToPlayer, followPlayer };