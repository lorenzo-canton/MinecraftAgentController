// src/ai/processor.js
const { Ollama } = require('ollama');
const { toolDefinitions } = require('../tools/definitions');
const fs = require('fs').promises;
const path = require('path');

// Schema for planner output
// Forces the planner to use only available tool actions
// and provide detailed instructions for each step
const planSchema = {
    type: "object",
    properties: {
        reasoning: {
            type: "object",
            properties: {
                analysis: {
                    type: "string",
                    description: "Analysis of the user's request and current game state"
                },
                strategy: {
                    type: "string",
                    description: "Explanation of the chosen approach and why it's optimal"
                },
                considerations: {
                    type: "array",
                    items: {
                        type: "string"
                    },
                    description: "Key factors considered in the planning process"
                }
            },
            required: ["analysis", "strategy", "considerations"],
            description: "Chain of thought reasoning process"
        },
        steps: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    action: {
                        type: "string",
                        enum: toolDefinitions.map(tool => tool.function.name),
                        description: "The specific tool action to execute"
                    },
                    details: {
                        type: "string",
                        description: "Detailed instructions including all necessary parameters for the tool execution"
                    },
                    rationale: {
                        type: "string",
                        description: "Explanation of why this specific step is necessary"
                    }
                },
                required: ["action", "details", "rationale"]
            },
            description: "Sequence of steps using available tools"
        }
    },
    required: ["reasoning", "steps"]
};

class AIProcessor {
    constructor(bot, config) {
        this.bot = bot;
        this.config = config;
        this.ollama = new Ollama({ host: 'http://127.0.0.1:11434' });
        this.resetMessages();
        this.setupLoggingDirectory();
    }

    async setupLoggingDirectory() {
        // Create logs directory if it doesn't exist
        const logsDir = path.join(process.cwd(), 'logs');
        try {
            await fs.mkdir(logsDir, { recursive: true });
        } catch (err) {
            console.error('Error creating logs directory:', err);
        }
    }

    async logChat(type, messages) {
        try {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const filename = path.join(process.cwd(), 'logs', `${type}-chat-${today}.json`);
            
            // Read existing logs or create new array
            let logs = [];
            try {
                const existingContent = await fs.readFile(filename, 'utf8');
                logs = JSON.parse(existingContent);
            } catch (err) {
                // File doesn't exist or is invalid JSON, start with empty array
            }

            // Add timestamp to the log entry
            const logEntry = {
                timestamp: new Date().toISOString(),
                messages: messages
            };
            logs.push(logEntry);

            // Write back to file
            await fs.writeFile(filename, JSON.stringify(logs, null, 2));
        } catch (err) {
            console.error(`Error logging ${type} chat:`, err);
        }
    }

    resetMessages() {
        // Reset both message histories with empty system messages
        this.plannerMessages = [{ role: 'system', content: undefined }];
        this.workerMessages = [{ role: 'system', content: undefined }];
    }

    async processCommand(userMessage, availableFunctions) {
        try {
            this.resetMessages();
            await this.updateGameState(availableFunctions);
            
            // Get the action plan from the planning model
            const plan = await this.generatePlan(userMessage);
            console.log('\n\nGenerated plan:', plan);

            // Log planner chat after plan generation
            await this.logChat('planner', this.plannerMessages);

            // Execute each step in the plan
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
                
                const response = await this.getAIResponse(workerPrompt);
                
                if (response.message.tool_calls) {
                    const toolResult = await this.executeToolCalls(response.message.tool_calls, availableFunctions);
                    if (!toolResult.success) {
                        // Log worker chat before returning error
                        await this.logChat('worker', this.workerMessages);
                        return toolResult.message;
                    }
                }
                
                this.workerMessages.push(response.message);
            }

            // Log worker chat after successful completion
            await this.logChat('worker', this.workerMessages);
            return 'Task completed successfully!';
            
        } catch (error) {
            console.error('AI processing error:', error);
            // Log both chats in case of error
            await this.logChat('planner', this.plannerMessages);
            await this.logChat('worker', this.workerMessages);
            return 'Sorry, I encountered an error processing your request.';
        }
    }

    async generatePlan(message) {
        // Create a description of available actions from tool definitions
        const actionDescriptions = toolDefinitions.map(tool => {
            return `${tool.function.name}: ${tool.function.description}
                   Parameters: ${JSON.stringify(tool.function.parameters.properties)}`;
        }).join('\n\n');

        // Add planning-specific system message
        const planningSystemMessage = {
            role: 'system',
            content: `You are a planning assistant for a Minecraft bot. Your job is to:
1. Analyze the user's request and current game state
2. Develop a strategy considering available resources and constraints
3. Break down user requests into a sequence of specific tool actions
4. Only use these available actions: ${toolDefinitions.map(tool => tool.function.name).join(', ')}
5. For each step provide:
   - action: the tool name to use
   - details: clear instructions with all necessary parameters
   - rationale: explanation of why this step is necessary

Available actions and their parameters:
${actionDescriptions}

Provide output in JSON format with:
- reasoning: object containing analysis, strategy, and considerations
- steps: array of actions with details and rationale`
        };

        this.plannerMessages = [
            planningSystemMessage,
            ...this.plannerMessages.slice(1),
            { role: 'user', content: message }
        ];

        const plannerResponse = await this.ollama.chat({
            model: this.config.planningModel,
            messages: this.plannerMessages,
            format: planSchema
        });

        // Parse and validate the plan
        const plan = JSON.parse(plannerResponse.message.content);
        return plan;
    }

    async updateGameState(availableFunctions) {
        const surroundings = await availableFunctions.scanArea();
        const inventory = await availableFunctions.listInventory();
        
        const systemMessage = {
            role: 'system',
            content: this.createSystemPrompt(surroundings, inventory)
        };

        // Update both message histories
        this.updateMessages(systemMessage);
    }

    createSystemPrompt(surroundings, inventory) {
        // Format surroundings as markdown list
        const surroundingsList = Object.entries(surroundings.blocks)
            .map(([block, count]) => `- ${block}: ${count}`)
            .join('\n');
        
        // Format inventory as markdown list
        const inventoryList = inventory.inventory
            .split(', ')
            .map(item => `- ${item}`)
            .join('\n') || '- Inventario vuoto';

        return `# Stato del Bot Minecraft

## Dintorni (raggio 10 blocchi):
${surroundingsList}

## Inventario:
${inventoryList}

Sei un assistente bot per Minecraft. Puoi aiutare i giocatori:
- Muovendoti verso di loro
- Seguendoli
- Raccogliendo blocchi
- Creando oggetti
- Gestendo l'inventario
- Equipaggiando/gettando oggetti

Dovresti sempre essere consapevole dei dintorni e dell'inventario per prendere decisioni informate.`;
    }

    updateMessages(systemMessage) {
        // Update both planner and worker message histories
        this.plannerMessages = [
            systemMessage,
            ...this.plannerMessages.slice(1)
        ];
        
        this.workerMessages = [
            systemMessage,
            ...this.workerMessages.slice(1)
        ];
    }

    async getAIResponse(message) {
        // Format the compound message for the worker
        const formattedMessage = `User's original request: "${message.userQuery}"
Current action: ${message.action}
Instructions: ${message.details}
Rationale: ${message.rationale}

Please execute this action according to the provided instructions while keeping the original request in context.`;

        this.workerMessages.push({ role: 'user', content: formattedMessage });
        console.log('Worker processing message:\n', formattedMessage);

        return await this.ollama.chat({
            model: this.config.aiModel,
            messages: this.workerMessages,
            tools: toolDefinitions
        });
    }

    async executeToolCalls(toolCalls, availableFunctions) {
        for (const tool of toolCalls) {
            const result = await this.executeSingleTool(tool, availableFunctions);
            // Return early if any tool execution failed
            if (!result.success) {
                return result;
            }
        }
        return { success: true };
    }

    async executeSingleTool(tool, availableFunctions) {
        const functionName = tool.function.name;
        const functionToCall = availableFunctions[functionName];
        
        if (!functionToCall) {
            console.warn(`Function ${functionName} not found in available functions`);
            return { success: false, message: `Function ${functionName} not available` };
        }

        console.log('Executing function:', functionName);
        console.log('Arguments:', tool.function.arguments);
        
        const parsedArgs = this.parseToolArguments(tool.function.arguments);
        if (!parsedArgs) {
            return { success: false, message: 'Failed to parse tool arguments' };
        }

        try {
            const output = await Promise.resolve(functionToCall(parsedArgs));
            console.log('Function output:', output);
            
            this.workerMessages.push({
                role: 'tool',
                content: JSON.stringify(output)
            });

            return { 
                success: output.success, 
                message: output.message || 'Tool execution failed'
            };
        } catch (e) {
            console.error(`Error executing function ${functionName}:`, e);
            return { 
                success: false, 
                message: `Error executing ${functionName}: ${e.message}` 
            };
        }
    }

    parseToolArguments(args) {
        try {
            return typeof args === 'string' ? JSON.parse(args) : args;
        } catch (e) {
            console.error('Error parsing arguments:', e);
            return null;
        }
    }
}

module.exports = { AIProcessor };
