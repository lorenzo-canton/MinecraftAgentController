// src/ai/processor.js
const { Ollama } = require('ollama');
const fs = require('fs').promises;
const path = require('path');
const { Planner } = require('./planning');
const { ToolExecutor } = require('./toolExecutor');

class AIProcessor {
    constructor(bot, config) {
        this.bot = bot;
        this.config = config;
        this.ollama = new Ollama({ host: 'http://127.0.0.1:11434' });
        this.planner = new Planner(this.ollama, config);
        this.toolExecutor = new ToolExecutor(this.ollama, config);
        this.setupLoggingDirectory();
    }

    async setupLoggingDirectory() {
        const logsDir = path.join(process.cwd(), 'logs');
        try {
            await fs.mkdir(logsDir, { recursive: true });
        } catch (err) {
            console.error('Error creating logs directory:', err);
        }
    }

    async logChat(type, messages) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const filename = path.join(process.cwd(), 'logs', `${type}-chat-${today}.json`);
            
            let logs = [];
            try {
                const existingContent = await fs.readFile(filename, 'utf8');
                logs = JSON.parse(existingContent);
            } catch (err) {}

            const logEntry = {
                timestamp: new Date().toISOString(),
                messages: messages
            };
            logs.push(logEntry);

            await fs.writeFile(filename, JSON.stringify(logs, null, 2));
        } catch (err) {
            console.error(`Error logging ${type} chat:`, err);
        }
    }

    async processCommand(userMessage, availableFunctions) {
        try {
            await this.updateGameState(availableFunctions);
            
            const plan = await this.planner.generatePlan(userMessage);
            console.log('\n\nGenerated plan:', plan);

            await this.logChat('planner', this.planner.plannerMessages);

            for (const step of plan.steps) {
                console.log(`\n\nExecuting action: ${step.action}`);
                console.log(`Details: ${step.details}`);
                console.log(`Rationale: ${step.rationale}`);
                
                const workerPrompt = {
                    userQuery: userMessage,
                    action: step.action,
                    details: step.details,
                    rationale: step.rationale
                };
                
                const response = await this.toolExecutor.getAIResponse(workerPrompt);
                
                if (response.message.tool_calls) {
                    const toolResult = await this.toolExecutor.executeToolCalls(
                        response.message.tool_calls, 
                        availableFunctions
                    );
                    
                    if (!toolResult.success) {
                        await this.logChat('worker', this.toolExecutor.workerMessages);
                        return toolResult.message;
                    }
                }
            }

            await this.logChat('worker', this.toolExecutor.workerMessages);
            return 'Task completed successfully!';
            
        } catch (error) {
            console.error('AI processing error:', error);
            await this.logChat('planner', this.planner.plannerMessages);
            await this.logChat('worker', this.toolExecutor.workerMessages);
            return 'Sorry, I encountered an error processing your request.';
        }
    }

    async updateGameState(availableFunctions) {
        const surroundings = await availableFunctions.scanArea();
        const inventory = await availableFunctions.listInventory();
        
        const systemMessage = {
            role: 'system',
            content: this.createSystemPrompt(surroundings, inventory)
        };

        this.planner.updateMessages(systemMessage);
        this.toolExecutor.updateMessages(systemMessage);
    }

    createSystemPrompt(surroundings, inventory) {
        const surroundingsList = Object.entries(surroundings.blocks)
            .map(([block, count]) => `- ${block}: ${count}`)
            .join('\n');
        
        const inventoryList = inventory.inventory
            .split(', ')
            .map(item => `- ${item}`)
            .join('\n') || '- Inventario vuoto';

        return `# Minecraft Bot Status

## Surroundings (10 block radius):
${surroundingsList}

## Inventory:
${inventoryList}

You are a Minecraft bot assistant. You can help players by:
- Moving towards them
- Following them
- Collecting blocks
- Crafting items
- Managing inventory
- Equipping/dropping items

You should always be aware of your surroundings and inventory to make informed decisions.`;
    }
}

module.exports = { AIProcessor };
