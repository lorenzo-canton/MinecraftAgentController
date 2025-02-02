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
            let response = await this.getAIResponse(message);
            let iterationCount = 0;
    
            while (response.message.tool_calls && iterationCount < this.config.maxToolIterations) {
                await this.executeToolCalls(response.message.tool_calls, availableFunctions);
                response = await this.getAIResponse(); // Chiamata successiva senza nuovo messaggio utente
                iterationCount++;
                
                if (iterationCount === this.config.maxToolIterations) {
                    console.warn('Raggiunto il massimo numero di iterazioni per tool call');
                }
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
        const formatAsMarkdownList = (dict) => {
            if (typeof dict === 'string') return dict; // Gestione inventario vuoto
            return Object.entries(dict)
                .map(([item, count]) => `- ${item}: ${count}`)
                .join('\n');
        };
    
        const surroundingsList = formatAsMarkdownList(surroundings.blocks);
        const inventoryList = formatAsMarkdownList(inventory.inventory);
    
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

    updateMessages(systemMessage) {
        this.messages = [
            systemMessage,
            ...this.messages.slice(1)
        ];
    }

    async getAIResponse(message) {
        if (message) {
            this.messages.push({ role: 'user', content: message });
            console.log('User message:\n', message);
        }
        
        return await this.ollama.chat({
            model: this.config.aiModel,
            messages: this.messages,
            tools: toolDefinitions // Manteniamo gli strumenti per tutte le chiamate
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
    
        try {
            console.log('AI calling function:', functionName);
            const parsedArgs = this.parseToolArguments(tool.function.arguments);
            if (!parsedArgs) return;
    
            const output = await Promise.resolve(functionToCall(parsedArgs));
            console.log('Function output:', output);
    
            // Aggiungiamo la risposta dello strumento con ID della chiamata
            this.messages.push({
                role: 'tool',
                content: output.message,
                tool_call_id: tool.id,
                name: functionName
            });
    
        } catch (e) {
            console.error(`Error executing function ${functionName}:`, e);
            // Aggiungiamo un messaggio di errore per l'AI
            this.messages.push({
                role: 'tool',
                content: JSON.stringify({ error: e.message }),
                tool_call_id: tool.id,
                name: functionName
            });
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