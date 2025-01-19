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
            // Ottenere lo stato corrente usando le funzioni disponibili
            const surroundings = await availableFunctions.scanArea();
            const inventory = await availableFunctions.listInventory();
            
            const systemMessage = {
                role: 'system',
                content: `You are a Minecraft bot assistant. You can help players by moving to them, following them, collecting blocks, crafting items, managing inventory, and equipping/dropping items. 

Current surroundings: ${JSON.stringify(surroundings.blocks)}
Current inventory: ${inventory.inventory}
                         
You should always be aware of your surroundings and inventory to make informed decisions.`
            };

            console.log('System message:\n', systemMessage.content);
            console.log('User message:\n', message);

            this.messages = [
                systemMessage,
                ...this.messages.slice(1),
                { role: 'user', content: message }
            ];
            
            const response = await this.ollama.chat({
                model: this.config.aiModel,
                messages: this.messages,
                tools: toolDefinitions
            });

            if (response.message.tool_calls) {
                for (const tool of response.message.tool_calls) {
                    const functionName = tool.function.name;
                    const functionToCall = availableFunctions[functionName];
                    
                    if (functionToCall) {
                        console.log('AI calling function:', functionName);
                        console.log('Arguments:', tool.function.arguments);
                        
                        let parsedArgs;
                        try {
                            parsedArgs = typeof tool.function.arguments === 'string' 
                                ? JSON.parse(tool.function.arguments) 
                                : tool.function.arguments;
                        } catch (e) {
                            console.error('Error parsing arguments:', e);
                            continue;
                        }
                        
                        try {
                            const output = await Promise.resolve(functionToCall(parsedArgs));
                            console.log('Function output:', output);
                            
                            this.messages.push(response.message);
                            this.messages.push({
                                role: 'tool',
                                content: JSON.stringify(output)
                            });
                        } catch (e) {
                            console.error(`Error executing function ${functionName}:`, e);
                        }
                    } else {
                        console.warn(`Function ${functionName} not found in available functions`);
                    }
                }

                const finalResponse = await this.ollama.chat({
                    model: this.config.aiModel,
                    messages: this.messages
                });

                this.messages.push(finalResponse.message);
                return finalResponse.message.content;
            }

            console.log(`Assistant:\n${response.message.content}`);
            this.messages.push(response.message);
            return response.message.content;
            
        } catch (error) {
            console.error('AI processing error:', error);
            return 'Sorry, I encountered an error processing your request.';
        }
    }
}

module.exports = { AIProcessor };