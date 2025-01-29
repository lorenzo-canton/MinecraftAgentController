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

    async logConversation(type, executionId, data) {
        try {
            const filename = path.join(process.cwd(), 'logs', `${type}-messages.json`);
            
            let executions = [];
            try {
                const existingContent = await fs.readFile(filename, 'utf8');
                executions = JSON.parse(existingContent);
            } catch (err) {
                // File doesn't exist yet, start with empty array
            }

            // Find or create execution entry
            let executionEntry = executions.find(e => e.id === executionId);
            if (!executionEntry) {
                executionEntry = {
                    id: executionId,
                    timestamp: new Date().toISOString(),
                    conversation: []
                };
                executions.push(executionEntry);
            }

            // Add new message to conversation
            executionEntry.conversation.push({
                timestamp: new Date().toISOString(),
                ...data
            });

            // Keep only the last 1000 executions to manage file size
            if (executions.length > 1000) {
                executions = executions.slice(-1000);
            }

            await fs.writeFile(filename, JSON.stringify(executions, null, 2));
        } catch (err) {
            console.error(`Error logging ${type} messages:`, err);
        }
    }

    async processCommand(userMessage, availableFunctions) {
        const executionId = Date.now().toString();
        
        try {
            // Log user message
            await this.logConversation('planner', executionId, {
                type: 'user_message',
                content: userMessage
            });

            await this.updateGameState(availableFunctions);
            
            // Generate plan
            const plan = await this.planner.generatePlan(userMessage);
            console.log('\nGenerated plan:', plan);

            // Log generated plan
            await this.logConversation('planner', executionId, {
                type: 'generated_plan',
                content: plan
            });

            // Execute each step
            for (const step of plan.steps) {
                console.log(`\nExecuting action: ${step.action}`);
                
                // Log step start
                await this.logConversation('worker', executionId, {
                    type: 'step_start',
                    action: step.action,
                    details: step.details,
                    rationale: step.rationale
                });
                
                const workerPrompt = {
                    userQuery: userMessage,
                    action: step.action,
                    details: step.details,
                    rationale: step.rationale
                };
                
                const response = await this.toolExecutor.getAIResponse(workerPrompt);
                
                // Log AI response
                await this.logConversation('worker', executionId, {
                    type: 'ai_response',
                    content: response.message
                });
                
                if (response.message.tool_calls) {
                    const toolResult = await this.toolExecutor.executeToolCalls(
                        response.message.tool_calls, 
                        availableFunctions
                    );
                    
                    // Log tool result
                    await this.logConversation('worker', executionId, {
                        type: 'tool_result',
                        tool_calls: response.message.tool_calls,
                        result: toolResult
                    });

                    if (!toolResult.success) {
                        await this.logConversation('worker', executionId, {
                            type: 'execution_error',
                            error: toolResult.message
                        });
                        return toolResult.message;
                    }
                }
            }

            // Log successful completion
            await this.logConversation('worker', executionId, {
                type: 'completion',
                status: 'success'
            });

            return 'Task completed successfully!';
            
        } catch (error) {
            console.error('AI processing error:', error);
            
            // Log error state
            await this.logConversation('planner', executionId, {
                type: 'error',
                error: error.message,
                stack: error.stack
            });

            await this.logConversation('worker', executionId, {
                type: 'error',
                error: error.message,
                stack: error.stack
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
            .join('\n') || '- Empty inventory';

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