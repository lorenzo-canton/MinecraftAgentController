// src/ai/processor.js
const { Ollama } = require('ollama');
const { toolDefinitions } = require('../tools/definitions');

class AIProcessor {
    constructor(bot, config) {
        this.bot = bot;
        this.config = config;
        this.ollama = new Ollama({ host: 'http://127.0.0.1:11434' });
        this.messages = [{ role: 'system', content: undefined }];
    }

    async processCommand(message, availableFunctions) {
        try {
            await this.updateGameState(availableFunctions);
            const response = await this.getAIResponse(message);
            
            if (response.message.tool_calls) {
                await this.executeToolCalls(response.message.tool_calls, availableFunctions);
                return await this.getFinalResponse();
            }

            this.messages.push(response.message);
            return response.message.content;
            
        } catch (error) {
            console.error('AI processing error:', error);
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

        console.log('System message:\n', systemMessage.content);
        this.updateMessages(systemMessage);
    }

    createSystemPrompt(surroundings, inventory) {
        return `You are a Minecraft bot assistant. You can help players by moving to them, following them, collecting blocks, crafting items, managing inventory, and equipping/dropping items. 

Current surroundings: ${JSON.stringify(surroundings.blocks)}
Current inventory: ${inventory.inventory}
                     
You should always be aware of your surroundings and inventory to make informed decisions.`;
    }

    updateMessages(systemMessage) {
        this.messages = [
            systemMessage,
            ...this.messages.slice(1)
        ];
    }

    async getAIResponse(message) {
        this.messages.push({ role: 'user', content: message });
        console.log('User message:\n', message);

        return await this.ollama.chat({
            model: this.config.aiModel,
            messages: this.messages,
            tools: toolDefinitions
        });
    }

    async executeToolCalls(toolCalls, availableFunctions) {
        for (const tool of toolCalls) {
            await this.executeSingleTool(tool, availableFunctions);
        }
    }

    async executeSingleTool(tool, availableFunctions) {
        const functionName = tool.function.name;
        const functionToCall = availableFunctions[functionName];
        
        if (!functionToCall) {
            console.warn(`Function ${functionName} not found in available functions`);
            return;
        }

        console.log('AI calling function:', functionName);
        console.log('Arguments:', tool.function.arguments);
        
        const parsedArgs = this.parseToolArguments(tool.function.arguments);
        if (!parsedArgs) return;

        try {
            const output = await Promise.resolve(functionToCall(parsedArgs));
            console.log('Function output:', output);
            
            this.messages.push({
                role: 'tool',
                content: JSON.stringify(output)
            });
        } catch (e) {
            console.error(`Error executing function ${functionName}:`, e);
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

    async getFinalResponse() {
        const finalResponse = await this.ollama.chat({
            model: this.config.aiModel,
            messages: this.messages
        });

        console.log(`Assistant:\n${finalResponse.message.content}`);
        this.messages.push(finalResponse.message);
        return finalResponse.message.content;
    }
}

module.exports = { AIProcessor };