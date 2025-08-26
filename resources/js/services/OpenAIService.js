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
     * Send a message to OpenAI and get response using Responses API
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

        // Prepare request payload for Responses API
        const payload = {
            temperature: options.temperature || this.temperature,
            prompt: { "id": this.promptId },
            input: [
                {
                    role: 'system',
                    content: 'You are Optix\'s Automation Assistant. Always call capability tools first and only use returned values. If a request is unsupported, say so and suggest the closest supported alternative.'
                },
                {
                    role: 'user',
                    content: userMessage
                }
            ],
            tools: this.functions.map(func => {
                console.log('Mapping function to tool:', func);
                return {
                    type: 'function',
                    name: func.name,
                    description: func.description,
                    parameters: func.parameters
                };
            }),
            tool_choice: 'auto' // Let OpenAI decide when to call tools
        };

        try {
            console.log('Sending message to OpenAI Responses API:', { userMessage, payload });
            console.log('Final payload JSON:', JSON.stringify(payload, null, 2));
            
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

            // Handle the response format from Responses API
            console.log('Full response data:', JSON.stringify(data, null, 2));
            
            // The Responses API returns function calls in the output array
            let content = null;
            let tool_calls = null;
            
            // Check for function calls in the output array
            if (data.output && Array.isArray(data.output)) {
                const functionCalls = data.output.filter(item => item.type === 'function_call');
                if (functionCalls.length > 0) {
                    tool_calls = functionCalls.map(call => ({
                        id: call.id,
                        type: 'function',
                        function: {
                            name: call.name,
                            arguments: call.arguments
                        }
                    }));
                }
            }
            
            // Check for text content in various possible locations
            if (data.content && Array.isArray(data.content) && data.content.length > 0) {
                content = data.content[0].text || null;
            } else if (data.content && typeof data.content === 'string') {
                content = data.content;
            } else if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
                content = data.choices[0].message?.content || null;
                if (!tool_calls) {
                    tool_calls = data.choices[0].message?.tool_calls || null;
                }
            }
            
            const assistantMessage = {
                content: content,
                tool_calls: tool_calls
            };

            // Add assistant response to history
            this.addMessage('assistant', assistantMessage.content, assistantMessage.tool_calls);

            console.log('Processed assistant message:', assistantMessage);
            return assistantMessage;

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
     * Send function result back to OpenAI to get final response using Responses API
     * @param {Object} functionCall - The original function call
     * @param {Object} result - The result of the function execution
     * @returns {Promise<Object>} Final OpenAI response
     */
    async sendFunctionResult(functionCall, result) {
        // Add function result to conversation history
        this.addMessage('tool', JSON.stringify(result), null, functionCall.name);

        // Prepare request payload for Responses API
        const payload = {
            temperature: this.temperature,
            prompt: { "id": this.promptId },
            input: [
                {
                    role: 'system',
                    content: 'You are Optix\'s Automation Assistant. Always call capability tools first and only use returned values. If a request is unsupported, say so and suggest the closest supported alternative.'
                },
                {
                    role: 'user',
                    content: this.conversationHistory.find(msg => msg.role === 'user')?.content || ''
                },
                {
                    role: 'assistant',
                    content: `I called the ${functionCall.function.name} function and got the result: ${JSON.stringify(result)}`
                }
            ]
        };

        try {
            console.log('Sending function result to OpenAI Responses API:', { functionCall, result });
            
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
            console.log('Response structure analysis:');
            console.log('- data.content:', data.content);
            console.log('- data.output:', data.output);
            console.log('- data.output[0]:', data.output?.[0]);
            console.log('- data.output[0].type:', data.output?.[0]?.type);
            console.log('- data.choices:', data.choices);

            // Handle the response format from Responses API for final response
            let content = null;
            
            // Check for content in various possible locations
            if (data.content && Array.isArray(data.content) && data.content.length > 0) {
                content = data.content[0].text || null;
                console.log('Found content in data.content[0].text:', content);
            } else if (data.content && typeof data.content === 'string') {
                content = data.content;
                console.log('Found content in data.content (string):', content);
            } else if (data.output && Array.isArray(data.output)) {
                // Check if there's text output
                const textOutput = data.output.find(item => item.type === 'text');
                if (textOutput) {
                    content = textOutput.text || null;
                    console.log('Found content in data.output (text):', content);
                } else {
                    // If no text type found, check if the first output item has content
                    const firstOutput = data.output[0];
                    if (firstOutput && firstOutput.content) {
                        // Handle content as array or string
                        if (Array.isArray(firstOutput.content) && firstOutput.content.length > 0) {
                            // Extract text from the first content item
                            const firstContentItem = firstOutput.content[0];
                            if (firstContentItem && firstContentItem.text) {
                                content = firstContentItem.text;
                                console.log('Found content in data.output[0].content[0].text:', content);
                            } else if (firstContentItem && typeof firstContentItem === 'string') {
                                content = firstContentItem;
                                console.log('Found content in data.output[0].content[0] (string):', content);
                            }
                        } else if (typeof firstOutput.content === 'string') {
                            content = firstOutput.content;
                            console.log('Found content in data.output[0].content (string):', content);
                        }
                    } else if (firstOutput && firstOutput.text) {
                        content = firstOutput.text;
                        console.log('Found content in data.output[0].text:', content);
                    }
                }
            } else if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
                content = data.choices[0].message?.content || null;
                console.log('Found content in data.choices[0].message.content:', content);
            }
            
            console.log('Final content value:', content);
            
            // If still no content, create a fallback message
            if (!content) {
                content = `I've retrieved the available triggers for you. Here are the ${result.triggers?.length || 0} trigger types available in your Optix system.`;
                console.log('Using fallback message:', content);
            }

            const assistantMessage = {
                content: content
            };

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
