// src/ai/processor.js
const { Ollama } = require('ollama');
const { toolDefinitions } = require('../tools/definitions');

// Schema for planner output
// Forces the planner to use only available tool actions
// and provide detailed instructions for each step
const planSchema = {
    type: "object",
    properties: {
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
                    }
                },
                required: ["action", "details"]
            },
            description: "Sequence of steps using available tools"
        }
    },
    required: ["steps"]
};

class AIProcessor {
    constructor(bot, config) {
        this.bot = bot;
        this.config = config;
        this.ollama = new Ollama({ host: 'http://127.0.0.1:11434' });
        this.resetMessages();
    }

    resetMessages() {
        // Reset both message histories with empty system messages
        this.plannerMessages = [{ role: 'system', content: undefined }];
        this.workerMessages = [{ role: 'system', content: undefined }];
    }

    async processCommand(userMessage, availableFunctions) {
        try {
            // Reset messages at the start of each command
            this.resetMessages();

            // Update game state for both planner and worker
            await this.updateGameState(availableFunctions);
            
            // Get the action plan from the planning model
            const plan = await this.generatePlan(userMessage);
            console.log('\n\nGenerated plan:', plan);

            // Execute each step in the plan
            for (const step of plan.steps) {
                console.log(`\n\nExecuting action: ${step.action}`);
                console.log(`Details: ${step.details}`);
                
                // Create a compound message that includes both the original request
                // and the current step details
                const workerPrompt = {
                    userQuery: userMessage,
                    action: step.action,
                    details: step.details
                };
                
                // Get AI response for this specific step
                const response = await this.getAIResponse(workerPrompt);
                
                // Execute any tool calls from the response
                if (response.message.tool_calls) {
                    const toolResult = await this.executeToolCalls(response.message.tool_calls, availableFunctions);
                    // Return early if any tool execution failed
                    if (!toolResult.success) {
                        return toolResult.message;
                    }
                }
                
                // Add the response to worker message history
                this.workerMessages.push(response.message);
            }

            // Return a standard success message
            return 'Task completed successfully!';
            
        } catch (error) {
            console.error('AI processing error:', error);
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
1. Break down user requests into a sequence of specific tool actions
2. Only use these available actions: ${toolDefinitions.map(tool => tool.function.name).join(', ')}
3. For each step provide:
   - action: the tool name to use
   - details: clear instructions with all necessary parameters for the action

Available actions and their parameters:
${actionDescriptions}

Provide output in JSON format with steps array containing:
- action: one of the available tool names
- details: string with clear instructions including all needed parameters`
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
        return `You are a Minecraft bot assistant. You can help players by moving to them, following them, collecting blocks, crafting items, managing inventory, and equipping/dropping items. 

Current surroundings: ${JSON.stringify(surroundings.blocks)}
Current inventory: ${inventory.inventory}
                     
You should always be aware of your surroundings and inventory to make informed decisions.`;
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