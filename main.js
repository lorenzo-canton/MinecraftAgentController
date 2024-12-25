const express = require('express');
const bodyParser = require('body-parser');
const { MinecraftBot } = require('./bot');

const app = express();
app.use(bodyParser.json());

class BotController {
    constructor(config) {
        this.bot = new MinecraftBot(config);
    }

    registerRoutes(app) {
        app.post('/bot/collect', (req, res) => {
            const { blockName } = req.body;
            this.bot.commands['!collect']([blockName]);
            res.json({ status: 'ok' });
        });
        
        app.post('/bot/goto-player', (req, res) => {
            const { playerName, distance } = req.body;
            this.bot.commands['!gotoplayer']([playerName, distance]);
            res.json({ status: 'ok' });
        });

        app.post('/bot/goto-nearest', (req, res) => {
            const { distance } = req.body;
            this.bot.commands['!gotonearestplayer']([distance]);
            res.json({ status: 'ok' });
        });

        app.post('/bot/goto-coord', (req, res) => {
            const { x, y, z } = req.body;
            this.bot.commands['!gotocoord']([x, y, z]);
            res.json({ status: 'ok' });
        });

        app.post('/bot/follow', (req, res) => {
            const { playerName, distance } = req.body;
            this.bot.commands['!follow']([playerName, distance]);
            res.json({ status: 'ok' });
        });

        app.post('/bot/stop', (req, res) => {
            this.bot.commands['!stop']();
            res.json({ status: 'ok' });
        });

        app.post('/bot/look-at', (req, res) => {
            const { playerName } = req.body;
            this.bot.commands['!lookat']([playerName]);
            res.json({ status: 'ok' });
        });

        app.get('/bot/scan', (req, res) => {
            const { radius } = req.query;
            const blocks = this.bot.scanBlocks(radius || 10);
            res.json(blocks);
        });

        app.get('/bot/inventory', (req, res) => {
            const items = this.bot.bot.inventory.items().map(item => ({
                name: item.name,
                count: item.count
            }));
            res.json(items);
        });
    
        app.post('/bot/toss', (req, res) => {
            const { itemName, amount } = req.body;
            this.bot.commands['!toss']([itemName, amount]);
            res.json({ status: 'ok' });
        });
    
        app.post('/bot/equip', (req, res) => {
            const { destination, itemName } = req.body;
            this.bot.commands['!equip']([destination, itemName]);
            res.json({ status: 'ok' });
        });
    
        app.post('/bot/unequip', (req, res) => {
            const { destination } = req.body;
            this.bot.commands['!unequip']([destination]);
            res.json({ status: 'ok' });
        });
    
        app.post('/bot/use', (req, res) => {
            this.bot.commands['!use']();
            res.json({ status: 'ok' });
        });
    
        app.post('/bot/craft', (req, res) => {
            const { itemName, amount } = req.body;
            this.bot.commands['!craft']([itemName, amount]);
            res.json({ status: 'ok' });
        });

        app.get('/bot/help', (req, res) => {
            const commands = Object.keys(this.bot.commands).map(cmd => ({
                command: cmd,
                endpoint: `/bot${cmd.replace('!', '')}`
            }));
            res.json(commands);
        });
    }
}

// Avvio del server
const PORT = process.env.PORT || 3000;
const config = {
    host: process.env.MC_HOST || 'localhost',
    port: parseInt(process.env.MC_PORT) || 25565,
    username: process.env.MC_USERNAME || 'BotTest'
};

const controller = new BotController(config);
controller.registerRoutes(app);

app.listen(PORT, () => {
    console.log(`Server API avviato sulla porta ${PORT}`);
});