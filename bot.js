const mineflayer = require('mineflayer');
const { pathfinder, goals } = require('mineflayer-pathfinder');

const bot = mineflayer.createBot({
	host: 'localhost',
	port: 25565,
	username: 'BotTest'
});

bot.loadPlugin(pathfinder);

function findPlayer(username) {
	return bot.players[username]?.entity;
}

function findNearestPlayer() {
	let nearestPlayer = null;
	let nearestDistance = Infinity;

	for (let playerName in bot.players) {
		const player = bot.players[playerName];
		if (playerName === bot.username || !player.entity) continue;
		const distance = bot.entity.position.distanceTo(player.entity.position);
		if (distance < nearestDistance) {
			nearestDistance = distance;
			nearestPlayer = player;
		}
	}
	return nearestPlayer;
}

function scanBlocks(radius) {
	const blocks = {};
	const pos = bot.entity.position;

	for (let x = -radius; x <= radius; x++) {
		for (let y = -radius; y <= radius; y++) {
			for (let z = -radius; z <= radius; z++) {
				const block = bot.blockAt(pos.offset(x, y, z));
				if (block && block.name !== 'air') {
					blocks[block.name] = (blocks[block.name] || 0) + 1;
				}
			}
		}
	}

	return blocks;
}

function processCommand(username, message) {
	console.log(username, message)
	const args = message.split(' ');
	const command = args[0].toLowerCase();

	switch (command) {
		case '!gotoplayer':
			if (args.length === 3) {
				const playerName = args[1];
				const distance = parseInt(args[2]);
				const player = findPlayer(playerName);
				if (player) {
					const goal = new goals.GoalNear(player.position.x, player.position.y, player.position.z, distance);
					bot.pathfinder.setGoal(goal);
					bot.chat(`Иду к игроку ${playerName}`);
					bot.chat(`Vado dal giocatore ${playerName}`);
				} else {
					bot.chat('Игрок не найден');
					bot.chat('Giocatore non trovato');
				}
			}
			break;

		case '!gotonearestplayer':
			if (args.length === 2) {
				const distance = parseInt(args[1]);
				const player = findNearestPlayer();
				if (player) {
					const goal = new goals.GoalNear(player.entity.position.x, player.entity.position.y, player.entity.position.z, distance);
					bot.pathfinder.setGoal(goal);
					bot.chat(`Иду к ближайшему игроку: ${player.username}`);
					bot.chat(`Vado dal giocatore più vicino: ${player.username}`);
				} else {
					bot.chat('Игроки не найдены');
					bot.chat('Giocatori non trovati');
				}
			}
			break;

		case '!gotocoord':
			if (args.length === 4) {
				const x = parseInt(args[1]);
				const y = parseInt(args[2]);
				const z = parseInt(args[3]);
				const goal = new goals.GoalBlock(x, y, z);
				bot.pathfinder.setGoal(goal);
				bot.chat(`Иду к координатам ${x} ${y} ${z}`);
				bot.chat(`Vado alle coordinate ${x} ${y} ${z}`);
			}
			break;

		case '!follow':
			if (args.length === 3) {
				const playerName = args[1];
				const distance = parseInt(args[2]);
				const player = findPlayer(playerName);
				if (player) {
					bot.pathfinder.setGoal(new goals.GoalFollow(player, distance), true);
					bot.chat(`Следую за игроком ${playerName}`);
					bot.chat(`Seguo il giocatore ${playerName}`);
				} else {
					bot.chat('Игрок не найден');
					bot.chat('Giocatore non trovato');
				}
			}
			break;

		case '!stop':
			bot.pathfinder.setGoal(null);
			bot.chat('Остановлен');
			bot.chat('Fermato');
			break;

		case '!lookat':
			if (args.length === 2) {
				const playerName = args[1];
				const player = findPlayer(playerName);
				if (player) {
					bot.lookAt(player.position);
					bot.chat(`Смотрю на игрока ${playerName}`);
					bot.chat(`Guardo il giocatore ${playerName}`);
				} else {
					bot.chat('Игрок не найден');
					bot.chat('Giocatore non trovato');
				}
			}
			break;

		case '!scan':
			const radius = args[1] ? parseInt(args[1]) : 10;
			if (radius > 0 && radius <= 10) {
				const blocks = scanBlocks(radius);
				bot.chat('Результаты сканирования:');
				bot.chat('Risultati della scansione:');
				for (const [blockName, count] of Object.entries(blocks)) {
					bot.chat(`${blockName}: ${count}`);
				}
			} else {
				bot.chat('Укажите радиус от 1 до 10 блоков');
			}
			break;

		case '!help':
			bot.chat('Доступные команды:');
			bot.chat('!gotoplayer <имя> <расстояние> - идти к игроку');
			bot.chat('!gotonearestplayer <расстояние> - идти к ближайшему игроку');
			bot.chat('!gotocoord <x> <y> <z> - идти к координатам');
			bot.chat('!follow <имя> <расстояние> - следовать за игроком');
			bot.chat('!stop - остановиться');
			bot.chat('!lookat <имя> - посмотреть на игрока');
			bot.chat('!scan [радиус] - сканировать блоки (макс. радиус 10)');
			bot.chat('--------------------');
			bot.chat('Comandi disponibili:');
			bot.chat('!gotoplayer <nome> <distanza> - vai dal giocatore');
			bot.chat('!gotonearestplayer <distanza> - vai dal giocatore più vicino');
			bot.chat('!gotocoord <x> <y> <z> - vai alle coordinate');
			bot.chat('!follow <nome> <distanza> - segui il giocatore');
			bot.chat('!stop - fermati');
			bot.chat('!lookat <nome> - guarda il giocatore');
			bot.chat('!scan [raggio] - scansiona i blocchi (raggio max 10)');
			break;
	}
}

bot.on('chat', (username, message) => {
	if (username === bot.username) return;
	if (message.startsWith('!')) {
		processCommand(username, message);
	}
});

bot.once('spawn', () => {
	bot.chat('Бот готов к работе. Напишите !help для списка команд');
	bot.chat('Bot pronto per lavorare. Scrivi !help per un elenco di comandi');
});

bot.on('error', (err) => {
	console.log('Ошибка:', err);
	console.log('Errore:', err);
});

bot.on('end', () => {
	console.log('Соединение завершено');
	console.log('Connessione terminata');
});