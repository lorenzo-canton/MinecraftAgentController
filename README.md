# Minecraft AI Bot

An intelligent Minecraft bot powered by LLM (Large Language Model) that can interact with players and perform various tasks in the game. The bot uses mineflayer for game interactions and Ollama for natural language processing.

## Features

- Natural language interaction with players
- Pathfinding and navigation capabilities
- Block collection and inventory management
- Environment scanning and awareness
- Player following and assistance

## Prerequisites

Before running the bot, make sure you have:

- Node.js (v14 or higher)
- Minecraft Java Edition (version 1.20.4)
- Ollama installed and running locally
- A running Minecraft server

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd minecraft-ai-bot
```

2. Install dependencies:
```bash
npm install
```

3. Make sure Ollama is running with the required model:
```bash
ollama run hermes3:8b-llama3.1-q4_K_M
```

## Configuration

Edit the configuration in `main.js` to match your setup:

```javascript
const config = {
    host: 'localhost',
    port: 25565,
    username: 'AIBot',
    aiModel: 'hermes3:8b-llama3.1-q4_K_M',
    version: '1.20.4'
};
```

## Usage

1. Start your Minecraft server
2. Run the bot:
```bash
node main.js
```

The bot will connect to the server and announce its presence. Players can interact with it using natural language commands in the game chat.

### Available Commands

Players can use natural language to request the following actions:

- Go to a specific player
- Follow a player
- Collect specific blocks
- Check inventory
- Scan the surrounding area

Examples:
- "Come to me"
- "Follow player123"
- "Collect some oak logs"
- "What's in your inventory?"
- "What blocks are around you?"

## Project Structure

- `main.js` - Entry point and configuration
- `bot.js` - Main bot implementation with AI integration
  - MinecraftAIBot class
  - Event handling
  - Command processing
  - Tool definitions

## Dependencies

- `mineflayer` - Minecraft bot client
- `mineflayer-pathfinder` - Navigation and pathfinding
- `mineflayer-collectblock` - Block collection functionality
- `ollama` - LLM integration

## Error Handling

The bot includes basic error handling for:
- Connection issues
- AI processing errors
- Invalid commands
- Missing blocks/players

## Contributing

Feel free to submit issues and enhancement requests!

## License

[Add your chosen license here]

## Acknowledgments

- Mineflayer team for the excellent Minecraft bot framework
- Ollama team for the local LLM capabilities