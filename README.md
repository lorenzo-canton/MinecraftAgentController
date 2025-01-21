# Minecraft AI Bot

An intelligent Minecraft bot powered by AI that can assist players with various in-game tasks. The bot uses natural language processing to understand player commands and can perform actions like resource gathering, crafting, and following players.

## Features

- **Natural Language Understanding**: Communicate with the bot using natural language commands
- **Intelligent Planning**: Uses AI to break down complex tasks into manageable steps
- **Dual AI Architecture**: Separate planning and execution models for optimal performance
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

## Technical Architecture

The bot is built with a modular architecture:

- `MinecraftAIBot.js`: Main bot class and initialization
- `processor.js`: AI command processing and execution
- `definitions.js`: Available tool definitions
- `inventory.js`: Inventory management functions
- `movements.js`: Player following and navigation
- `crafting.js`: Item crafting functionality
- `scanning.js`: Environmental scanning

## Development

The bot uses several key dependencies:
- `mineflayer`: Core Minecraft bot functionality
- `mineflayer-pathfinder`: Navigation and movement
- `mineflayer-collectblock`: Block collection
- `ollama`: Local AI model integration

## Error Handling

The bot includes comprehensive error handling:
- Connection issues
- Invalid commands
- Resource unavailability
- Inventory constraints
- Navigation obstacles

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## License

[Add your chosen license here]

## Acknowledgments

- Mineflayer team for the excellent bot framework
- Ollama team for local AI model support