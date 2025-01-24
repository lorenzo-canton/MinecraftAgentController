# Minecraft AI Bot

An intelligent Minecraft bot powered by AI that can assist players with various in-game tasks. The bot uses natural language processing to understand player commands and can perform actions like resource gathering, crafting, and following players.

## Features

- **Natural Language Understanding**: Communicate with the bot using natural language commands
- **Intelligent Planning**: Uses AI to break down complex tasks into manageable steps
- **Dual AI Architecture**: Separate planning and execution models for optimal performance
- **Automated Logging**: Comprehensive logging of all AI interactions in daily JSON files
- **Core Capabilities**:
  - Player following and navigation
  - Resource collection and block mining
  - Item crafting and inventory management
  - Equipment handling

## Prerequisites

- Node.js (v14 or higher)
- Minecraft Java Edition (v1.20.4)
- Ollama for running local AI models

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd minecraft-ai-bot
```

2. Install dependencies:
```bash
npm install
```

3. Configure the bot:
Edit `config` in `main.js` to set your desired:
- Server address and port
- Bot username
- AI models
- Minecraft version

## Configuration

The bot uses two AI models:
- Planning Model (`deepseek-r1:14b`): Handles task analysis and planning
- Worker Model (`hermes3:8b-llama3.1-q4_K_M`): Executes individual actions

You can modify these in the configuration to use different models available in Ollama.

## Available Commands

The bot understands various commands through natural language. Here are some examples:

- **Movement**:
  - "Come to me"
  - "Follow [player name]"

- **Resource Collection**:
  - "Collect 10 oak logs"
  - "Mine some iron ore"

- **Crafting**:
  - "Craft wooden planks"
  - "Make sticks"

- **Inventory Management**:
  - "Equip the diamond sword"
  - "Drop 5 cobblestone"

## Technical Architecture 🏗️

The bot is built with a modular architecture:

### Core Modules
- `MinecraftAIBot.js`: Main bot class and initialization
- `processor.js`: AI command processing and execution with logging
- `definitions.js`: Available tool definitions and API schema
- `planning.js`: Task planning and strategy generation

### Action Modules
- **Inventory Management** (`inventory.js`):
  - Collect blocks
  - List inventory
  - Equip items
  - Toss items
  - Auto-sort inventory

- **Movement** (`movements.js`):
  - Pathfinding to players
  - Following players
  - Obstacle avoidance
  - Auto-jump and swimming

- **Crafting** (`crafting.js`):
  - Basic crafting
  - Recipe discovery
  - Material checking
  - Crafting table detection

- **Scanning** (`scanning.js`):
  - 10-block radius scan
  - Block type detection
  - Threat assessment
  - Resource mapping

### AI System
- **Dual-Model Architecture**:
  - Planner: Breaks down tasks into steps
  - Executor: Handles individual actions
- **Real-time State Tracking**:
  - Environment scanning
  - Inventory monitoring
  - Player position tracking

### Logging System

The bot includes a comprehensive logging system that tracks all AI interactions:

- **Location**: Logs are stored in the `logs` directory
- **File Structure**:
  - `planner-chat-YYYY-MM-DD.json`: Planning model interactions
  - `worker-chat-YYYY-MM-DD.json`: Worker model interactions
- **Log Format**:
  ```json
  [
    {
      "timestamp": "ISO-8601 timestamp",
      "messages": [
        {"role": "system", "content": "..."},
        {"role": "user", "content": "..."},
        {"role": "assistant", "content": "..."}
      ]
    }
  ]
  ```
- **Features**:
  - Daily rotation of log files
  - Automatic creation of missing directories
  - Timestamped entries
  - Separate files for planner and worker interactions
  - JSON format for easy parsing and analysis

## Development 🧑‍💻

### Key Dependencies
| Package                  | Version | Description                          |
|--------------------------|---------|--------------------------------------|
| `mineflayer`             | ^4.8.0  | Core Minecraft bot functionality     |
| `mineflayer-pathfinder`  | ^2.4.0  | Navigation and movement              |
| `mineflayer-collectblock`| ^1.2.0  | Block collection                     |
| `ollama`                 | ^0.1.15 | Local AI model integration           |
| `dotenv`                 | ^16.3.1 | Environment configuration            |
| `winston`                | ^3.10.0 | Advanced logging system              |

### Development Setup
1. Clone the repository:
```bash
git clone https://github.com/yourusername/minecraft-ai-bot.git
cd minecraft-ai-bot
```

2. Install dependencies:
```bash
npm install
```

3. Set up development environment:
```bash
cp .env.example .env
npm run dev
```

4. Run tests:
```bash
npm test
```

5. Start development server:
```bash
npm run start:dev
```

6. Monitor logs:
```bash
tail -f logs/*.log
```

7. Run linter:
```bash
npm run lint
```

8. Build production version:
```bash
npm run build
```

### Contribution Guidelines
- Follow the existing code style
- Write tests for new features
- Document all public APIs
- Use meaningful commit messages
- Create pull requests with clear descriptions

## Error Handling

The bot includes comprehensive error handling:
- Connection issues
- Invalid commands
- Resource unavailability
- Inventory constraints
- Navigation obstacles
- Logging errors with fallback mechanisms

## Debugging

To analyze bot behavior and troubleshoot issues:

1. Check the logs in the `logs` directory
2. Review daily interaction logs for both planner and worker
3. Use timestamps to correlate events between different log files
4. Monitor the console for real-time execution logs

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## License

[Add your chosen license here]

## Acknowledgments

- Mineflayer team for the excellent bot framework
- Ollama team for local AI model support
