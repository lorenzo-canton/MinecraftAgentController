# MinecraftAgentController

A sophisticated AI-powered Minecraft bot that can assist players with various in-game tasks using natural language commands. The bot leverages the Mineflayer library for Minecraft interaction and integrates with AI models for natural language understanding and decision-making.

## Features

- **Natural Language Interaction**: Communicate with the bot using natural language commands
- **Movement Controls**: 
  - Navigate to specific players
  - Follow players around the game world
- **Block Manipulation**:
  - Collect specific types and quantities of blocks
  - Place blocks in the world
- **Inventory Management**:
  - List inventory contents
  - Equip items to different slots
  - Drop/toss items
- **Crafting System**:
  - Craft items using available materials
  - Supports crafting table recipes
- **Environment Awareness**:
  - Scan surrounding blocks in a 10-block radius
  - Track available resources and inventory

## Prerequisites

- Node.js (Latest LTS version recommended)
- Minecraft Java Edition (Version 1.20.4)
- A running Minecraft server

## Configuration

The bot can be configured using the following options in `src/main.js`:

```javascript
const config = {
    host: 'localhost',      // Minecraft server host
    port: 25565,           // Minecraft server port
    username: 'AIBot',     // Bot's username
    aiModel: 'mistral-small:latest', // AI model to use
    version: '1.20.4',     // Minecraft version
    maxToolIterations: 5,  // Maximum number of consecutive tool operations
    apiKey: "none",        // AI API key
    baseURL: 'http://127.0.0.1:11434/v1' // AI API base URL
};
```

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd MinecraftAgentController
```

2. Install dependencies:
```bash
npm install
```

3. Configure the bot in `src/main.js`

4. Start the bot:
```bash
node src/main.js
```

## Usage

Once the bot joins the server, you can interact with it using chat commands. The bot understands natural language instructions related to its capabilities. Here are some example commands:

- "Come to me"
- "Follow player Steve"
- "Collect 10 oak logs"
- "Craft 4 wooden planks"
- "What's in your inventory?"
- "Place a torch"
- "Drop all cobblestone"

## Architecture

The project is organized into several key components:

- `src/main.js`: Entry point and configuration
- `src/bot/`: Core bot functionality and event handling
- `src/actions/`: Individual action implementations
- `src/ai/`: AI processing and command interpretation
- `src/tools/`: Tool definitions and configurations

## Dependencies

- `mineflayer`: Core Minecraft bot functionality
- `mineflayer-pathfinder`: Navigation and movement
- `mineflayer-collectblock`: Block collection capabilities
- `openai`: AI model integration
- Other standard Node.js libraries
