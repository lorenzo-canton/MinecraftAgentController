# Minecraft Bot Controller

[Русский](#minecraft-bot-controller-ru) | [Italiano](#minecraft-bot-controller-it)

## Minecraft Bot Controller (IT)

Bot Minecraft controllabile tramite API REST e comandi in chat.

### Installazione
```bash
npm install
```

### Configurazione
Variabili d'ambiente:
- `MC_HOST`: Server Minecraft (default: localhost)
- `MC_PORT`: Porta server (default: 25565)
- `MC_USERNAME`: Nome del bot (default: BotTest)
- `PORT`: Porta API (default: 3000)

### Avvio
```bash
node server.js
```

### Comandi Chat
- `!gotoplayer <nome> <distanza>`: Vai dal giocatore
- `!gotonearestplayer <distanza>`: Vai dal giocatore più vicino
- `!gotocoord <x> <y> <z>`: Vai alle coordinate
- `!follow <nome> <distanza>`: Segui il giocatore
- `!stop`: Fermati
- `!lookat <nome>`: Guarda il giocatore
- `!scan [raggio]`: Scansiona i blocchi (raggio max 10)

### API Endpoints
- `POST /bot/goto-player`: { playerName, distance }
- `POST /bot/goto-nearest`: { distance }
- `POST /bot/goto-coord`: { x, y, z }
- `POST /bot/follow`: { playerName, distance }
- `POST /bot/stop`
- `POST /bot/look-at`: { playerName }
- `GET /bot/scan?radius=10`
- `GET /bot/help`

---

## Minecraft Bot Controller (RU)

Бот Minecraft, управляемый через REST API и команды чата.

### Установка
```bash
npm install
```

### Конфигурация
Переменные окружения:
- `MC_HOST`: Сервер Minecraft (по умолчанию: localhost)
- `MC_PORT`: Порт сервера (по умолчанию: 25565)
- `MC_USERNAME`: Имя бота (по умолчанию: BotTest)
- `PORT`: Порт API (по умолчанию: 3000)

### Запуск
```bash
node server.js
```

### Команды чата
- `!gotoplayer <имя> <расстояние>`: Идти к игроку
- `!gotonearestplayer <расстояние>`: Идти к ближайшему игроку
- `!gotocoord <x> <y> <z>`: Идти к координатам
- `!follow <имя> <расстояние>`: Следовать за игроком
- `!stop`: Остановиться
- `!lookat <имя>`: Посмотреть на игрока
- `!scan [радиус]`: Сканировать блоки (макс. радиус 10)

### API Endpoints
- `POST /bot/goto-player`: { playerName, distance }
- `POST /bot/goto-nearest`: { distance }
- `POST /bot/goto-coord`: { x, y, z }
- `POST /bot/follow`: { playerName, distance }
- `POST /bot/stop`
- `POST /bot/look-at`: { playerName }
- `GET /bot/scan?radius=10`
- `GET /bot/help`