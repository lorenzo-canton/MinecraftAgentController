const { toolDefinitions } = require('../tools/definitions');

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

class Planner {
    constructor(ollama, config) {
        this.ollama = ollama;
        this.config = config;
        this.plannerMessages = [{ role: 'system', content: undefined }];
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

    updateMessages(systemMessage) {
        this.plannerMessages = [
            systemMessage,
            ...this.plannerMessages.slice(1)
        ];
    }
}

module.exports = { Planner, planSchema };
