/**
 * OpenAIService - Handles communication with OpenAI API
 * Provides methods for sending messages, managing conversation context,
 * and handling function calling for Optix API interactions
 */

class OpenAIService {
    constructor() {
        this.apiKey = null;
        this.baseUrl = 'https://api.openai.com/v1';
        this.temperature = 0; // Default temperature for Responses API
        this.conversationHistory = [];
        this.functions = this.getFunctionDefinitions();
        this.tokenCount = 0; // Track token usage
        this.maxHistoryLength = 20; // Maximum conversation history length
        this.maxTokensPerRequest = 8000; // Maximum tokens per request
        this.promptId = 'pmpt_68ae03fd6e6481908a8939a9e9272e130cf3d534ebfbb3d9'; // Your specific prompt ID

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
                name: 'get_available_variables',
                description: 'Get available variables (conditions) for each trigger type from the Optix workflow schema',
                parameters: {
                    type: 'object',
                    properties: {},
                    required: []
                }
            },
            {
                name: 'get_conditions_for_trigger',
                description: 'Get available conditions/variables for a specific trigger type',
                parameters: {
                    type: 'object',
                    properties: {
                        trigger_type: {
                            type: 'string',
                            description: 'The specific trigger type to get conditions for (e.g., CHECKIN, BOOKING_CREATED)'
                        }
                    },
                    required: ['trigger_type']
                }
            },
            {
                name: 'get_available_actions',
                description: 'Get all available action types from the Optix workflow schema',
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
            content: content || '', // Ensure content is never null
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
        // Handle null/undefined content (e.g., function call responses)
        if (!content) {
            console.log('Token count updated: 0 (no content)');
            return;
        }
        
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
     * Get smart context messages for efficient token usage
     * @returns {Array} Optimized conversation context
     */
    getContextMessages() {
        const messages = [...this.conversationHistory];
        
        // Always include system message
        const systemMessage = messages.find(msg => msg.role === 'system');
        const nonSystemMessages = messages.filter(msg => msg.role !== 'system');
        
        // Smart context strategy:
        // 1. Keep the last 6 messages (3 user + 3 assistant pairs)
        // 2. If conversation is short, keep all messages
        // 3. If approaching token limit, keep only the last 4 messages
        
        let contextMessages = [];
        
        if (systemMessage) {
            contextMessages.push({
                role: systemMessage.role,
                content: systemMessage.content
            });
        }
        
        if (nonSystemMessages.length <= 6) {
            // Short conversation - keep all messages
            contextMessages.push(...nonSystemMessages.map(msg => ({
                role: msg.role,
                content: msg.content
            })));
        } else if (this.isApproachingTokenLimit()) {
            // Approaching limit - keep only last 4 messages
            contextMessages.push(...nonSystemMessages.slice(-4).map(msg => ({
                role: msg.role,
                content: msg.content
            })));
        } else {
            // Normal case - keep last 6 messages
            contextMessages.push(...nonSystemMessages.slice(-6).map(msg => ({
                role: msg.role,
                content: msg.content
            })));
        }
        
        console.log(`Smart context: ${contextMessages.length} messages (${nonSystemMessages.length} total in history)`);
        return contextMessages;
    }

    /**
     * Send a message to OpenAI and get response using Responses API with structured output
     * @param {string} userMessage - User's message
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} OpenAI response with display_text and ui_suggestions
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

        // Prepare request payload for Responses API with structured output
        const payload = {
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: 0,
            prompt: { "id": this.promptId },
            input: [
                {
                    role: 'system',
                    content: 'You are Optix\'s Automation Assistant. Always call capability tools first and only use returned values. If a request is unsupported, say so and suggest the closest supported alternative.'
                },
                ...this.getContextMessages().filter(msg => msg.role !== 'system')
            ],
            tools: this.functions.map(func => ({
                type: 'function',
                function: {
                    name: func.name,
                    description: func.description,
                    parameters: func.parameters
                }
            })),
            tool_choice: 'auto',
            text: {
                format: {
                    type: 'json_schema',
                    json_schema: {
                        name: 'assistant_reply',
                        strict: true,
                        schema: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                display_text: { type: 'string' },
                                ui_suggestions: {
                                    type: 'array',
                                    maxItems: 3,
                                    items: {
                                        type: 'object',
                                        additionalProperties: false,
                                        properties: {
                                            id: { type: 'string' },
                                            label: { type: 'string' },
                                            payload: { type: 'string' },
                                            variant: { type: 'string', enum: ['primary', 'secondary', 'danger'] },
                                            tool_call: {
                                                type: 'object',
                                                additionalProperties: false,
                                                properties: {
                                                    name: { type: 'string' },
                                                    arguments: { type: 'object' }
                                                },
                                                required: ['name', 'arguments']
                                            }
                                        },
                                        required: ['id', 'label', 'payload']
                                    }
                                }
                            },
                            required: ['display_text', 'ui_suggestions']
                        }
                    }
                }
            }
        };

        console.log('Sending message to OpenAI Responses API with structured output:', { userMessage, payload });

        try {
            const response = await fetch(`${this.baseUrl}/responses`, {
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
            console.log('OpenAI Responses API response:', data);

            // Handle the structured response format
            let assistantReply = null;
            
            // Check for structured output in the response
            if (data.output && Array.isArray(data.output)) {
                const structuredOutput = data.output.find(item => item.type === 'text');
                if (structuredOutput && structuredOutput.text) {
                    try {
                        assistantReply = JSON.parse(structuredOutput.text);
                        console.log('Parsed structured response:', assistantReply);
                    } catch (parseError) {
                        console.error('Failed to parse structured response:', parseError);
                        // Fallback to plain text
                        assistantReply = {
                            display_text: structuredOutput.text,
                            ui_suggestions: []
                        };
                    }
                }
            }
            
            // If no structured output found, create fallback
            if (!assistantReply) {
                assistantReply = {
                    display_text: 'I received your message but encountered an issue processing the response.',
                    ui_suggestions: []
                };
            }

            // Add assistant response to history
            this.addMessage('assistant', assistantReply.display_text);

            console.log('Processed assistant reply:', assistantReply);
            return assistantReply;

        } catch (error) {
            console.error('Error sending message to OpenAI:', error);
            throw error;
        }
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
     * Update configuration
     * @param {Object} config - Configuration object
     */
    updateConfig(config) {
        if (config.temperature) this.temperature = config.temperature;
        console.log('OpenAI configuration updated:', config);
    }

    /**
     * Get current configuration
     * @returns {Object} Current configuration
     */
    getConfig() {
        return {
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
     * Send function result back to OpenAI to get final response using Responses API with structured output
     * @param {Object} functionCall - The original function call
     * @param {Object} result - The result of the function execution
     * @returns {Promise<Object>} Final OpenAI response with display_text and ui_suggestions
     */
    async sendFunctionResult(functionCall, result) {
        // Add function result to conversation history
        this.addMessage('tool', JSON.stringify(result), null, functionCall.function.name);

        // Prepare request payload for Responses API with structured output
        const payload = {
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: 0,
            prompt: { "id": this.promptId },
            input: [
                {
                    role: 'system',
                    content: 'You are Optix\'s Automation Assistant. Always call capability tools first and only use returned values. If a request is unsupported, say so and suggest the closest supported alternative.'
                },
                {
                    role: 'assistant',
                    content: `I called the ${functionCall.function.name} function and got the result: ${JSON.stringify(result)}`
                }
            ],
            tools: this.functions.map(func => ({
                type: 'function',
                function: {
                    name: func.name,
                    description: func.description,
                    parameters: func.parameters
                }
            })),
            tool_choice: 'auto',
            text: {
                format: {
                    type: 'json_schema',
                    json_schema: {
                        name: 'assistant_reply',
                        strict: true,
                        schema: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                display_text: { type: 'string' },
                                ui_suggestions: {
                                    type: 'array',
                                    maxItems: 3,
                                    items: {
                                        type: 'object',
                                        additionalProperties: false,
                                        properties: {
                                            id: { type: 'string' },
                                            label: { type: 'string' },
                                            payload: { type: 'string' },
                                            variant: { type: 'string', enum: ['primary', 'secondary', 'danger'] },
                                            tool_call: {
                                                type: 'object',
                                                additionalProperties: false,
                                                properties: {
                                                    name: { type: 'string' },
                                                    arguments: { type: 'object' }
                                                },
                                                required: ['name', 'arguments']
                                            }
                                        },
                                        required: ['id', 'label', 'payload']
                                    }
                                }
                            },
                            required: ['display_text', 'ui_suggestions']
                        }
                    }
                }
            }
        };

        // Add recent conversation context for function results
        const recentMessages = this.conversationHistory
            .filter(msg => msg.role === 'user' || msg.role === 'assistant')
            .slice(-2); // Keep only last 2 messages for function results

        recentMessages.forEach(message => {
            payload.input.push({
                role: message.role,
                content: message.content || ''
            });
        });

        console.log(`Using ${recentMessages.length} recent messages for function result context`);

        try {
            console.log('Sending function result to OpenAI Responses API with structured output:', { functionCall, result });
            
            const response = await fetch(`${this.baseUrl}/responses`, {
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
            console.log('OpenAI Responses API function result response:', data);

            // Handle the structured response format
            let assistantReply = null;
            
            // Check for structured output in the response
            if (data.output && Array.isArray(data.output)) {
                const structuredOutput = data.output.find(item => item.type === 'text');
                if (structuredOutput && structuredOutput.text) {
                    try {
                        assistantReply = JSON.parse(structuredOutput.text);
                        console.log('Parsed structured function result response:', assistantReply);
                    } catch (parseError) {
                        console.error('Failed to parse structured function result response:', parseError);
                        // Fallback to plain text
                        assistantReply = {
                            display_text: structuredOutput.text,
                            ui_suggestions: []
                        };
                    }
                }
            }
            
            // If no structured output found, create fallback
            if (!assistantReply) {
                assistantReply = {
                    display_text: `I've processed the ${functionCall.function.name} function result. Here's what I found: ${JSON.stringify(result)}`,
                    ui_suggestions: []
                };
            }

            // Add final assistant response to history
            this.addMessage('assistant', assistantReply.display_text);

            console.log('OpenAI final structured response:', assistantReply);
            return assistantReply;

        } catch (error) {
            console.error('Error sending function result to OpenAI:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const openAIService = new OpenAIService();
export default openAIService;
