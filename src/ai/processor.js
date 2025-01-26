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

    async logExecution(type, executionId, entry) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const filename = path.join(process.cwd(), 'logs', `${type}-executions-${today}.json`);
            
            let executions = [];
            try {
                const existingContent = await fs.readFile(filename, 'utf8');
                executions = JSON.parse(existingContent);
            } catch (err) {}

            // Trova o crea l'esecuzione corrente
            let currentExecution = executions.find(e => e.id === executionId);
            if (!currentExecution) {
                currentExecution = {
                    id: executionId,
                    startTime: new Date().toISOString(),
                    entries: []
                };
                executions.push(currentExecution);
            }

            // Aggiungi il nuovo entry
            currentExecution.entries.push({
                timestamp: new Date().toISOString(),
                ...entry
            });

            await fs.writeFile(filename, JSON.stringify(executions, null, 2));
        } catch (err) {
            console.error(`Error logging ${type} execution:`, err);
        }
    }

    async processCommand(userMessage, availableFunctions) {
        const executionId = Date.now().toString(); // ID unico per ogni esecuzione
        
        try {
            // Log dell'input iniziale
            await this.logExecution('planner', executionId, {
                type: 'input',
                message: userMessage
            });

            await this.updateGameState(availableFunctions);
            
            const plan = await this.planner.generatePlan(userMessage);
            console.log('\n\nGenerated plan:', plan);

            // Log del piano generato
            await this.logExecution('planner', executionId, {
                type: 'plan',
                plan: plan,
                messages: this.planner.plannerMessages
            });

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
                
                // Log prima di eseguire l'azione
                await this.logExecution('worker', executionId, {
                    type: 'action_start',
                    step: step,
                    prompt: workerPrompt
                });

                const response = await this.toolExecutor.getAIResponse(workerPrompt);
                
                if (response.message.tool_calls) {
                    const toolResult = await this.toolExecutor.executeToolCalls(
                        response.message.tool_calls, 
                        availableFunctions
                    );
                    
                    // Log del risultato dell'azione
                    await this.logExecution('worker', executionId, {
                        type: 'action_result',
                        tool_calls: response.message.tool_calls,
                        result: toolResult,
                        messages: this.toolExecutor.workerMessages
                    });

                    if (!toolResult.success) {
                        return toolResult.message;
                    }
                }
            }

            // Log del completamento
            await this.logExecution('worker', executionId, {
                type: 'completion',
                status: 'success',
                final_messages: this.toolExecutor.workerMessages
            });

            return 'Task completed successfully!';
            
        } catch (error) {
            console.error('AI processing error:', error);
            
            // Log dell'errore
            await this.logExecution('planner', executionId, {
                type: 'error',
                error: error.message,
                stack: error.stack,
                messages: this.planner.plannerMessages
            });

            await this.logExecution('worker', executionId, {
                type: 'error',
                error: error.message,
                stack: error.stack,
                messages: this.toolExecutor.workerMessages
            });

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
