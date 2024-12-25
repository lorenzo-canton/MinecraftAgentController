const mineflayer = require('mineflayer');
const { pathfinder, goals } = require('mineflayer-pathfinder');

class MinecraftBot {
    constructor(config = {}) {
        const defaultConfig = {
            host: 'localhost',
            port: 25565,
            username: 'BotTest'
        };
        
        this.config = { ...defaultConfig, ...config };
        this.bot = mineflayer.createBot(this.config);
        
        this.bot.loadPlugin(pathfinder);
        this.setupEventHandlers();
        this.commands = {
            '!gotoplayer': this.handleGotoPlayer.bind(this),
            '!gotonearestplayer': this.handleGotoNearestPlayer.bind(this),
            '!gotocoord': this.handleGotoCoord.bind(this),
            '!follow': this.handleFollow.bind(this),
            '!stop': this.handleStop.bind(this),
            '!lookat': this.handleLookAt.bind(this),
            '!scan': this.handleScan.bind(this),
            '!help': this.handleHelp.bind(this)
        };
    }

    findPlayer(username) {
        return this.bot.players[username]?.entity;
    }

    findNearestPlayer() {
        let nearestPlayer = null;
        let nearestDistance = Infinity;

        for (let playerName in this.bot.players) {
            const player = this.bot.players[playerName];
            if (playerName === this.bot.username || !player.entity) continue;
            const distance = this.bot.entity.position.distanceTo(player.entity.position);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestPlayer = player;
            }
        }
        return nearestPlayer;
    }

    scanBlocks(radius) {
        const blocks = {};
        const pos = this.bot.entity.position;

        for (let x = -radius; x <= radius; x++) {
            for (let y = -radius; y <= radius; y++) {
                for (let z = -radius; z <= radius; z++) {
                    const block = this.bot.blockAt(pos.offset(x, y, z));
                    if (block && block.name !== 'air') {
                        blocks[block.name] = (blocks[block.name] || 0) + 1;
                    }
                }
            }
        }
        return blocks;
    }

    handleGotoPlayer(args) {
        if (args.length !== 2) return;
        const [playerName, distance] = args;
        const player = this.findPlayer(playerName);
        
        if (player) {
            const goal = new goals.GoalNear(player.position.x, player.position.y, player.position.z, parseInt(distance));
            this.bot.pathfinder.setGoal(goal);
            this.sendMessage(`Иду к игроку ${playerName}`, `Vado dal giocatore ${playerName}`);
        } else {
            this.sendMessage('Игрок не найден', 'Giocatore non trovato');
        }
    }

    handleGotoNearestPlayer(args) {
        if (args.length !== 1) return;
        const distance = parseInt(args[0]);
        const player = this.findNearestPlayer();
        
        if (player) {
            const goal = new goals.GoalNear(player.entity.position.x, player.entity.position.y, player.entity.position.z, distance);
            this.bot.pathfinder.setGoal(goal);
            this.sendMessage(
                `Иду к ближайшему игроку: ${player.username}`,
                `Vado dal giocatore più vicino: ${player.username}`
            );
        } else {
            this.sendMessage('Игроки не найдены', 'Giocatori non trovati');
        }
    }

    handleGotoCoord(args) {
        if (args.length !== 3) return;
        const [x, y, z] = args.map(Number);
        const goal = new goals.GoalBlock(x, y, z);
        this.bot.pathfinder.setGoal(goal);
        this.sendMessage(
            `Иду к координатам ${x} ${y} ${z}`,
            `Vado alle coordinate ${x} ${y} ${z}`
        );
    }

    handleFollow(args) {
        if (args.length !== 2) return;
        const [playerName, distance] = args;
        const player = this.findPlayer(playerName);
        
        if (player) {
            this.bot.pathfinder.setGoal(new goals.GoalFollow(player, parseInt(distance)), true);
            this.sendMessage(
                `Следую за игроком ${playerName}`,
                `Seguo il giocatore ${playerName}`
            );
        } else {
            this.sendMessage('Игрок не найден', 'Giocatore non trovato');
        }
    }

    handleStop() {
        this.bot.pathfinder.setGoal(null);
        this.sendMessage('Остановлен', 'Fermato');
    }

    handleLookAt(args) {
        if (args.length !== 1) return;
        const playerName = args[0];
        const player = this.findPlayer(playerName);
        
        if (player) {
            this.bot.lookAt(player.position);
            this.sendMessage(
                `Смотрю на игрока ${playerName}`,
                `Guardo il giocatore ${playerName}`
            );
        } else {
            this.sendMessage('Игрок не найден', 'Giocatore non trovato');
        }
    }

    handleScan(args) {
        const radius = args[0] ? parseInt(args[0]) : 10;
        if (radius > 0 && radius <= 10) {
            const blocks = this.scanBlocks(radius);
            this.sendMessage('Результаты сканирования:', 'Risultati della scansione:');
            for (const [blockName, count] of Object.entries(blocks)) {
                this.bot.chat(`${blockName}: ${count}`);
            }
        } else {
            this.bot.chat('Укажите радиус от 1 до 10 блоков');
        }
    }

    handleHelp() {
        const commands = [
            ['!gotoplayer <имя> <расстояние> - идти к игроку', '!gotoplayer <nome> <distanza> - vai dal giocatore'],
            ['!gotonearestplayer <расстояние> - идти к ближайшему игроку', '!gotonearestplayer <distanza> - vai dal giocatore più vicino'],
            ['!gotocoord <x> <y> <z> - идти к координатам', '!gotocoord <x> <y> <z> - vai alle coordinate'],
            ['!follow <имя> <расстояние> - следовать за игроком', '!follow <nome> <distanza> - segui il giocatore'],
            ['!stop - остановиться', '!stop - fermati'],
            ['!lookat <имя> - посмотреть на игрока', '!lookat <nome> - guarda il giocatore'],
            ['!scan [радиус] - сканировать блоки (макс. радиус 10)', '!scan [raggio] - scansiona i blocchi (raggio max 10)']
        ];

        this.bot.chat('Доступные команды:');
        commands.forEach(([ru]) => this.bot.chat(ru));
        this.bot.chat('--------------------');
        this.bot.chat('Comandi disponibili:');
        commands.forEach(([, it]) => this.bot.chat(it));
    }

    sendMessage(ruMessage, itMessage) {
        this.bot.chat(ruMessage);
        this.bot.chat(itMessage);
    }

    processCommand(username, message) {
        if (username === this.bot.username) return;
        
        const [command, ...args] = message.split(' ');
        const handler = this.commands[command.toLowerCase()];
        
        if (handler) {
            handler(args);
        }
    }

    setupEventHandlers() {
        this.bot.on('chat', (username, message) => {
            if (message.startsWith('!')) {
                this.processCommand(username, message);
            }
        });

        this.bot.once('spawn', () => {
            this.sendMessage(
                'Бот готов к работе. Напишите !help для списка команд',
                'Bot pronto per lavorare. Scrivi !help per un elenco di comandi'
            );
        });

        this.bot.on('error', (err) => {
            console.log('Ошибка:', err);
            console.log('Errore:', err);
        });

        this.bot.on('end', () => {
            console.log('Соединение завершено');
            console.log('Connessione terminata');
        });
    }
}

module.exports = { MinecraftBot };

/*
// Esempio di utilizzo:
const config = {
    host: 'localhost',    // Il tuo server
    port: 25565,                 // La porta del server
    username: 'MyBot'            // Nome del bot
};

// Avvio del bot con configurazione personalizzata
const minecraftBot = new MinecraftBot(config);
*/