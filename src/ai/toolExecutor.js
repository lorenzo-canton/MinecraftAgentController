const { toolDefinitions } = require('../tools/definitions');

class ToolExecutor {
    constructor(ollama, config) {
        this.ollama = ollama;
        this.config = config;
        this.workerMessages = [{ role: 'system', content: undefined }];
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

        if (!this.config.aiModel) {
            throw new Error('AI model configuration is missing');
        }
        
        console.log('Using AI model:', this.config.aiModel);
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

    updateMessages(systemMessage) {
        this.workerMessages = [
            systemMessage,
            ...this.workerMessages.slice(1)
        ];
    }
}

module.exports = { ToolExecutor };
