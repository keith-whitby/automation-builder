/**
 * OpenAIService - Handles communication with OpenAI API
 * Provides methods for sending messages, managing conversation context,
 * and handling function calling for Optix API interactions
 */

class OpenAIService {
    constructor() {
        this.apiKey = null;
        this.baseUrl = 'https://api.openai.com/v1';
        this.model = 'gpt-4'; // Default model, can be configured
        this.maxTokens = 4000; // Default token limit
        this.temperature = 0.7; // Default temperature for creativity
        this.conversationHistory = [];
        this.functions = this.getFunctionDefinitions();
        this.tokenCount = 0; // Track token usage
        this.maxHistoryLength = 20; // Maximum conversation history length
        this.maxTokensPerRequest = 8000; // Maximum tokens per request
    }

    /**
     * Initialize the service with API key
     * @param {string} apiKey - OpenAI API key
     */
    initialize(apiKey) {
        this.apiKey = apiKey;
        console.log('OpenAI Service initialized');
    }

    /**
     * Get function definitions for Optix API interactions
     * @returns {Array} Array of function definitions for OpenAI function calling
     */
    getFunctionDefinitions() {
        return [
            {
                name: 'get_available_triggers',
                description: 'Get all available trigger types from the Optix workflow schema',
                parameters: {
                    type: 'object',
                    properties: {},
                    required: []
                }
            },
            {
                name: 'get_available_workflow_steps',
                description: 'Get available workflow steps and triggers from Optix API',
                parameters: {
                    type: 'object',
                    properties: {
                        step_type: {
                            type: 'string',
                            enum: ['trigger', 'condition', 'action', 'delay'],
                            description: 'Type of workflow step to retrieve'
                        }
                    },
                    required: ['step_type']
                }
            },
            {
                name: 'commit_workflow',
                description: 'Commit a completed workflow to Optix API',
                parameters: {
                    type: 'object',
                    properties: {
                        workflow_data: {
                            type: 'object',
                            description: 'Complete workflow data to commit'
                        }
                    },
                    required: ['workflow_data']
                }
            },
            {
                name: 'get_reference_data',
                description: 'Get reference data like admins, access templates, triggers, etc.',
                parameters: {
                    type: 'object',
                    properties: {
                        data_type: {
                            type: 'string',
                            enum: ['admins', 'access_templates', 'triggers', 'organizations'],
                            description: 'Type of reference data to retrieve'
                        }
                    },
                    required: ['data_type']
                }
            },
            {
                name: 'validate_automation_data',
                description: 'Validate automation data against Optix schema',
                parameters: {
                    type: 'object',
                    properties: {
                        automation_data: {
                            type: 'object',
                            description: 'Automation data to validate'
                        }
                    },
                    required: ['automation_data']
                }
            }
        ];
    }

    /**
     * Add a message to conversation history
     * @param {string} role - Message role (user, assistant, system, function)
     * @param {string} content - Message content
     * @param {Object} functionCall - Function call data (for assistant messages)
     * @param {string} name - Function name (for function messages)
     */
    addMessage(role, content, functionCall = null, name = null) {
        const message = {
            role,
            content,
            timestamp: new Date()
        };

        if (functionCall) {
            message.function_call = functionCall;
        }

        if (name) {
            message.name = name;
        }

        this.conversationHistory.push(message);
        
        // Manage conversation history length
        this.trimConversationHistory();
        
        // Update token count (rough estimation)
        this.updateTokenCount(content);
    }

    /**
     * Trim conversation history to stay within limits
     */
    trimConversationHistory() {
        if (this.conversationHistory.length > this.maxHistoryLength) {
            // Remove oldest messages, keeping system message and recent context
            const systemMessage = this.conversationHistory.find(msg => msg.role === 'system');
            const recentMessages = this.conversationHistory.slice(-this.maxHistoryLength + 1);
            
            this.conversationHistory = systemMessage 
                ? [systemMessage, ...recentMessages]
                : recentMessages;
        }
    }

    /**
     * Update token count (rough estimation)
     * @param {string} content - Message content
     */
    updateTokenCount(content) {
        // Rough estimation: 1 token ≈ 4 characters
        const estimatedTokens = Math.ceil(content.length / 4);
        this.tokenCount += estimatedTokens;
        
        console.log(`Token count updated: ${this.tokenCount} (estimated)`);
    }

    /**
     * Get current token usage
     * @returns {Object} Token usage information
     */
    getTokenUsage() {
        return {
            current: this.tokenCount,
            maxPerRequest: this.maxTokensPerRequest,
            remaining: this.maxTokensPerRequest - this.tokenCount
        };
    }

    /**
     * Check if conversation is approaching token limits
     * @returns {boolean} True if approaching limits
     */
    isApproachingTokenLimit() {
        return this.tokenCount > (this.maxTokensPerRequest * 0.8);
    }

    /**
     * Reset token count
     */
    resetTokenCount() {
        this.tokenCount = 0;
        console.log('Token count reset');
    }

    /**
     * Send a message to OpenAI and get response
     * @param {string} userMessage - User's message
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} OpenAI response
     */
    async sendMessage(userMessage, options = {}) {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not initialized');
        }

        // Check token limits before sending
        if (this.isApproachingTokenLimit()) {
            console.warn('Approaching token limit, trimming conversation history');
            this.trimConversationHistory();
            this.resetTokenCount();
        }

        // Add user message to history
        this.addMessage('user', userMessage);

        // Prepare messages for OpenAI
        const messages = this.prepareMessages();

        // Prepare request payload
        const payload = {
            model: options.model || this.model,
            messages,
            max_tokens: options.maxTokens || this.maxTokens,
            temperature: options.temperature || this.temperature,
            functions: this.functions,
            function_call: 'auto', // Let OpenAI decide when to call functions
            prompt: { "id": "pmpt_68ae03fd6e6481908a8939a9e9272e130cf3d534ebfbb3d9" }
        };

        try {
            console.log('Sending message to OpenAI:', { userMessage, payload });
            
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const assistantMessage = data.choices[0].message;

            // Add assistant response to history
            this.addMessage('assistant', assistantMessage.content, assistantMessage.function_call);

            console.log('OpenAI response:', assistantMessage);
            return assistantMessage;

        } catch (error) {
            console.error('Error sending message to OpenAI:', error);
            throw error;
        }
    }

    /**
     * Prepare messages for OpenAI API
     * @returns {Array} Array of messages in OpenAI format
     */
    prepareMessages() {
        // Add system message for context
        const systemMessage = {
            role: 'system',
            content: `You are an AI assistant that helps Optix admins create automations through natural language conversation. 

Your role is to:
1. Understand the user's automation requirements
2. Guide them through the automation creation process step by step
3. Ask clarifying questions when requirements are ambiguous
4. Use function calls to interact with the Optix API when needed
5. Ensure all automations follow best practices and pass validation

Key guidelines:
- Always ask for clarification if the user's request is unclear
- Suggest best practices (e.g., adding conditions after delays)
- Break down complex automations into manageable steps
- Validate automation data before committing
- Be conversational and helpful, not technical

Available functions:
- get_available_triggers: Get all available trigger types from the schema
- get_available_workflow_steps: Get available triggers, conditions, actions, and delays
- commit_workflow: Commit a completed workflow
- get_reference_data: Get reference data like admins and access templates
- validate_automation_data: Validate automation data against schema`
        };

        // Convert conversation history to OpenAI format
        const conversationMessages = this.conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
            ...(msg.function_call && { function_call: msg.function_call })
        }));

        return [systemMessage, ...conversationMessages];
    }

    /**
     * Clear conversation history
     */
    clearHistory() {
        this.conversationHistory = [];
        this.resetTokenCount();
        console.log('Conversation history and token count cleared');
    }

    /**
     * Get current conversation history
     * @returns {Array} Conversation history
     */
    getHistory() {
        return [...this.conversationHistory];
    }

    /**
     * Set conversation history (for restoring from storage)
     * @param {Array} history - Conversation history to restore
     */
    setHistory(history) {
        this.conversationHistory = [...history];
        console.log('Conversation history restored:', this.conversationHistory.length, 'messages');
    }

    /**
     * Update model configuration
     * @param {Object} config - Configuration object
     */
    updateConfig(config) {
        if (config.model) this.model = config.model;
        if (config.maxTokens) this.maxTokens = config.maxTokens;
        if (config.temperature) this.temperature = config.temperature;
        console.log('OpenAI configuration updated:', config);
    }

    /**
     * Get current configuration
     * @returns {Object} Current configuration
     */
    getConfig() {
        return {
            model: this.model,
            maxTokens: this.maxTokens,
            temperature: this.temperature
        };
    }

    /**
     * Get conversation statistics
     * @returns {Object} Conversation statistics
     */
    getConversationStats() {
        const userMessages = this.conversationHistory.filter(msg => msg.role === 'user').length;
        const assistantMessages = this.conversationHistory.filter(msg => msg.role === 'assistant').length;
        const functionCalls = this.conversationHistory.filter(msg => msg.function_call).length;
        
        return {
            totalMessages: this.conversationHistory.length,
            userMessages,
            assistantMessages,
            functionCalls,
            tokenUsage: this.getTokenUsage(),
            isApproachingLimit: this.isApproachingTokenLimit()
        };
    }

    /**
     * Send function result back to OpenAI to get final response
     * @param {Object} functionCall - The original function call
     * @param {Object} result - The result of the function execution
     * @returns {Promise<Object>} Final OpenAI response
     */
    async sendFunctionResult(functionCall, result) {
        // Add function result to conversation history
        this.addMessage('function', JSON.stringify(result), null, functionCall.name);

        // Send to OpenAI to get final response
        const messages = this.prepareMessages();
        
        const payload = {
            model: this.model,
            messages,
            max_tokens: this.maxTokens,
            temperature: this.temperature,
            prompt: { "id": "pmpt_68ae03fd6e6481908a8939a9e9272e130cf3d534ebfbb3d9" }
        };

        try {
            console.log('Sending function result to OpenAI:', { functionCall, result });
            
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const assistantMessage = data.choices[0].message;

            // Add final assistant response to history
            this.addMessage('assistant', assistantMessage.content);

            console.log('OpenAI final response:', assistantMessage);
            return assistantMessage;

        } catch (error) {
            console.error('Error sending function result to OpenAI:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const openAIService = new OpenAIService();
export default openAIService;
