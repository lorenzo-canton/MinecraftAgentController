# Minecraft Bot Controller

[Русский](#minecraft-bot-controller-ru) | [Italiano](#minecraft-bot-controller-it)

## Minecraft Bot Controller (IT)

### Installazione
```bash
npm install
```

### Configurazione
Configura il bot nel file `.env`:
```
MC_HOST=localhost
MC_PORT=25565
MC_USERNAME=BotTest
PORT=3000
```

### Avvio
```bash
node main.js
```

### Comandi del Bot
#### Movimento
- `!gotoplayer <nome> <distanza>` - Va verso un giocatore
- `!gotonearestplayer <distanza>` - Va verso il giocatore più vicino
- `!gotocoord <x> <y> <z>` - Va alle coordinate specificate
- `!follow <nome> <distanza>` - Segue un giocatore
- `!stop` - Si ferma
- `!lookat <nome>` - Guarda un giocatore
- `!scan [raggio]` - Scansiona i blocchi nel raggio (max 10)

#### Inventario
- `!list` - Mostra l'inventario
- `!toss <oggetto> [quantità]` - Getta oggetti
- `!equip <slot> <oggetto>` - Equipaggia un oggetto
- `!unequip <slot>` - Rimuove un oggetto equipaggiato
- `!use` - Usa l'oggetto in mano
- `!craft <oggetto> <quantità>` - Crafta un oggetto
- `!collect <blocco>` - Raccoglie il blocco più vicino

### API REST
- GET `/bot/scan?radius=10` - Scansiona i blocchi
- GET `/bot/inventory` - Mostra l'inventario
- POST `/bot/goto-player` - Va verso un giocatore
- POST `/bot/goto-nearest` - Va verso il giocatore più vicino
- POST `/bot/goto-coord` - Va alle coordinate
- POST `/bot/follow` - Segue un giocatore
- POST `/bot/stop` - Si ferma
- POST `/bot/look-at` - Guarda un giocatore
- POST `/bot/toss` - Getta oggetti
- POST `/bot/equip` - Equipaggia un oggetto
- POST `/bot/unequip` - Rimuove un oggetto
- POST `/bot/use` - Usa l'oggetto in mano
- POST `/bot/craft` - Crafta un oggetto
- POST `/bot/collect` - Raccoglie un blocco

## Minecraft Bot Controller (RU)

### Установка
```bash
npm install
```

### Конфигурация
Настройте бота в файле `.env`:
```
MC_HOST=localhost
MC_PORT=25565
MC_USERNAME=BotTest
PORT=3000
```

### Запуск
```bash
node main.js
```

### Команды бота
#### Перемещение
- `!gotoplayer <имя> <расстояние>` - Идти к игроку
- `!gotonearestplayer <расстояние>` - Идти к ближайшему игроку
- `!gotocoord <x> <y> <z>` - Идти к координатам
- `!follow <имя> <расстояние>` - Следовать за игроком
- `!stop` - Остановиться
- `!lookat <имя>` - Посмотреть на игрока
- `!scan [радиус]` - Сканировать блоки (макс. радиус 10)

#### Инвентарь
- `!list` - Показать инвентарь
- `!toss <предмет> [количество]` - Выбросить предметы
- `!equip <слот> <предмет>` - Экипировать предмет
- `!unequip <слот>` - Снять предмет
- `!use` - Использовать предмет в руке
- `!craft <предмет> <количество>` - Создать предмет
- `!collect <блок>` - Собрать ближайший блок

### API REST
- GET `/bot/scan?radius=10` - Сканировать блоки
- GET `/bot/inventory` - Показать инвентарь
- POST `/bot/goto-player` - Идти к игроку
- POST `/bot/goto-nearest` - Идти к ближайшему игроку
- POST `/bot/goto-coord` - Идти к координатам
- POST `/bot/follow` - Следовать за игроком
- POST `/bot/stop` - Остановиться
- POST `/bot/look-at` - Посмотреть на игрока
- POST `/bot/toss` - Выбросить предметы
- POST `/bot/equip` - Экипировать предмет
- POST `/bot/unequip` - Снять предмет
- POST `/bot/use` - Использовать предмет
- POST `/bot/craft` - Создать предмет
- POST `/bot/collect` - Собрать блок