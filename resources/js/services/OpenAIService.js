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

        // Don't add 'tool' messages to conversation history as OpenAI Responses API doesn't support them
        if (role !== 'tool') {
            this.conversationHistory.push(message);
            
            // Manage conversation history length
            this.trimConversationHistory();
            
            // Update token count (rough estimation)
            this.updateTokenCount(content);
        }
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
                name: func.name,
                description: func.description,
                parameters: func.parameters
            })),
            tool_choice: 'auto',
            text: {
                format: {
                    type: 'json_schema',
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
                                        variant: { type: 'string', enum: ['primary', 'secondary', 'danger'] }
                                    },
                                    required: ['id', 'label', 'payload', 'variant']
                                }
                            }
                        },
                        required: ['display_text', 'ui_suggestions']
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
            console.log('Response output structure:', data.output);
            if (data.output && Array.isArray(data.output)) {
                console.log('Output array length:', data.output.length);
                data.output.forEach((item, index) => {
                    console.log(`Output item ${index}:`, item);
                    if (item.content && Array.isArray(item.content)) {
                        console.log(`Item ${index} content:`, item.content);
                    }
                });
            }

            // Handle the structured response format
            let assistantReply = null;
            
            // Check for structured output in the response
            if (data.output && Array.isArray(data.output)) {
                // First, check for function calls
                const functionCall = data.output.find(item => item.type === 'function_call');
                if (functionCall) {
                    console.log('Function call detected:', functionCall);
                    // Handle function call - this should trigger the tool calling flow
                    const functionName = functionCall.name || functionCall.function?.name || functionCall.function_name;
                    const functionArgs = functionCall.arguments ? JSON.parse(functionCall.arguments) : {};
                    
                    console.log(`Function call: ${functionName} with args:`, functionArgs);
                    
                    // For now, return a message indicating the function call
                    assistantReply = {
                        display_text: `I'm checking available options for you... (calling ${functionName})`,
                        ui_suggestions: []
                    };
                    
                    // Execute the function call and get the result
                    try {
                        const functionResult = await this.executeFunctionCall(functionName, functionArgs);
                        console.log(`Function ${functionName} result:`, functionResult);
                        
                        // Send the function result back to get the final structured response
                        assistantReply = await this.sendFunctionResult(functionCall, functionResult);
                        return assistantReply; // Return early since sendFunctionResult handles the response
                    } catch (functionError) {
                        console.error(`Error executing function ${functionName}:`, functionError);
                        assistantReply = {
                            display_text: `Sorry, I encountered an error while checking available options: ${functionError.message}`,
                            ui_suggestions: []
                        };
                    }
                } else {
                    // Check for regular message response
                    const structuredOutput = data.output.find(item => item.type === 'message');
                    if (structuredOutput && structuredOutput.content && Array.isArray(structuredOutput.content)) {
                        const textContent = structuredOutput.content.find(content => content.type === 'output_text');
                        if (textContent && textContent.text) {
                            try {
                                assistantReply = JSON.parse(textContent.text);
                                console.log('Parsed structured response:', assistantReply);
                            } catch (parseError) {
                                console.error('Failed to parse structured response:', parseError);
                                // Fallback to plain text
                                assistantReply = {
                                    display_text: textContent.text,
                                    ui_suggestions: []
                                };
                            }
                        }
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
     * Execute a function call locally
     * @param {string} functionName - Name of the function to execute
     * @param {Object} functionArgs - Arguments for the function
     * @returns {Promise<Object>} Function result
     */
    async executeFunctionCall(functionName, functionArgs) {
        console.log(`Executing function: ${functionName} with args:`, functionArgs);
        
        // Map function names to actual implementations
        const functionMap = {
            'get_available_triggers': this.getAvailableTriggers.bind(this),
            'get_available_variables': this.getAvailableVariables.bind(this),
            'get_available_workflow_steps': this.getAvailableWorkflowSteps.bind(this),
            'get_reference_data': this.getReferenceData.bind(this),
            'validate_automation_data': this.validateAutomationData.bind(this),
            'commit_workflow': this.commitWorkflow.bind(this)
        };
        
        const functionToExecute = functionMap[functionName];
        if (!functionToExecute) {
            throw new Error(`Unknown function: ${functionName}`);
        }
        
        try {
            const result = await functionToExecute(functionArgs);
            console.log(`Function ${functionName} executed successfully:`, result);
            return result;
        } catch (error) {
            console.error(`Error executing function ${functionName}:`, error);
            throw error;
        }
    }

    /**
     * Get available triggers (mock implementation)
     * @param {Object} args - Function arguments
     * @returns {Promise<Object>} Available triggers
     */
    async getAvailableTriggers(args) {
        try {
            // Import and use the real Optix API service
            const optixApiService = (await import('./OptixApiService.js')).default;
            
            // Initialize the API service if needed
            await optixApiService.initialize();
            
            // Get available trigger types from Optix API
            const response = await optixApiService.getWorkflowTriggerTypes();
            
            // Transform the response to match expected format
            const triggers = response.workflowAvailableSteps
                .filter(step => step.type === 'trigger') // Only include trigger steps
                .map(step => ({
                    id: step.id || step.name,
                    name: step.name || step.id,
                    description: step.description || `Triggered when ${step.name} occurs`
                }));
            
            console.log('OptixApiService: Retrieved triggers from API:', triggers);
            
            return {
                triggers
            };
        } catch (error) {
            console.error('Error getting available triggers from Optix API:', error);
            
            // Fallback to mock data if API call fails
            const triggers = [
                { id: 'user_joined', name: 'User Joined Organization', description: 'Triggered when a new user joins the organization' },
                { id: 'access_requested', name: 'Access Requested', description: 'Triggered when someone requests access to a resource' },
                { id: 'booking_created', name: 'Booking Created', description: 'Triggered when a new booking is created' }
            ];
            
            return {
                triggers,
                error: error.message
            };
        }
    }

    /**
     * Get available variables (conditions) for each trigger type
     * @param {Object} args - Function arguments
     * @returns {Promise<Object>} Available variables
     */
    async getAvailableVariables(args) {
        try {
            // Import and use the real Optix API service
            const optixApiService = (await import('./OptixApiService.js')).default;
            
            // Initialize the API service if needed
            await optixApiService.initialize();
            
            // Get available workflow steps from Optix API
            const response = await optixApiService.getWorkflowAvailableSteps();
            
            // Transform the response to extract variables/conditions
            const variables = response.workflowAvailableSteps
                .filter(step => step.type === 'trigger') // Only include trigger steps
                .map(step => ({
                    trigger_type: step.id || step.name,
                    variables: step.parameters || [],
                    conditions: step.parameters?.filter(p => p.type === 'condition') || []
                }));
            
            console.log('OptixApiService: Retrieved variables from API:', variables);
            
            return {
                variables
            };
        } catch (error) {
            console.error('Error getting available variables from Optix API:', error);
            
            // Fallback to mock data if API call fails
            const variables = [
                {
                    trigger_type: 'NEW_ACTIVE_USER',
                    variables: ['user_id', 'user_email', 'organization_id'],
                    conditions: ['user_role', 'user_department']
                },
                {
                    trigger_type: 'ACCESS_REQUESTED',
                    variables: ['request_id', 'user_id', 'resource_id'],
                    conditions: ['request_type', 'priority_level']
                }
            ];
            
            return {
                variables,
                error: error.message
            };
        }
    }

    /**
     * Get available workflow steps (mock implementation)
     * @param {Object} args - Function arguments
     * @returns {Promise<Object>} Available workflow steps
     */
    async getAvailableWorkflowSteps(args) {
        const { step_type } = args;
        
        try {
            // Import and use the real Optix API service
            const optixApiService = (await import('./OptixApiService.js')).default;
            
            // Initialize the API service if needed
            await optixApiService.initialize();
            
            // Get available workflow steps from Optix API
            const response = await optixApiService.getWorkflowAvailableSteps();
            
            // Transform the response to match expected format
            const steps = response.workflowAvailableSteps
                .filter(step => {
                    // Filter by the step type based on the 'type' field from GraphQL
                    return step.type === step_type;
                })
                .map(step => {
                    return {
                        id: step.id || step.name,
                        name: step.name || step.id,
                        description: step.description || `Step: ${step.name}`,
                        parameters: step.parameters || [],
                        category: step.category,
                        icon: step.icon,
                        isEnabled: step.isEnabled
                    };
                });
            
            console.log('OptixApiService: Retrieved workflow steps from API:', steps);
            
            return {
                step_type,
                steps
            };
        } catch (error) {
            console.error('Error getting available workflow steps from Optix API:', error);
            
            // Fallback to mock data if API call fails
            const steps = {
                trigger: [
                    { id: 'user_joined', name: 'User Joined', description: 'User joins the organization' },
                    { id: 'access_requested', name: 'Access Requested', description: 'User requests access to a resource' }
                ],
                action: [
                    { id: 'send_email', name: 'Send Email', description: 'Send an email notification' },
                    { id: 'assign_role', name: 'Assign Role', description: 'Assign a role to the user' }
                ],
                condition: [
                    { id: 'user_department', name: 'User Department', description: 'Check user department' },
                    { id: 'access_level', name: 'Access Level', description: 'Check user access level' }
                ],
                delay: [
                    { id: 'wait_days', name: 'Wait Days', description: 'Wait for specified number of days' },
                    { id: 'wait_hours', name: 'Wait Hours', description: 'Wait for specified number of hours' }
                ]
            };
            
            return {
                step_type,
                steps: steps[step_type] || [],
                error: error.message
            };
        }
    }

    /**
     * Get reference data (mock implementation)
     * @param {Object} args - Function arguments
     * @returns {Promise<Object>} Reference data
     */
    async getReferenceData(args) {
        const { data_type } = args;
        
        try {
            // Import and use the real Optix API service
            const optixApiService = (await import('./OptixApiService.js')).default;
            
            // Initialize the API service if needed
            await optixApiService.initialize();
            
            // Get reference data from Optix API
            const response = await optixApiService.getReferenceData();
            
            // Transform the response to match expected format
            const data = {
                admins: response.admins || [],
                access_templates: response.accessTemplates || [],
                triggers: [], // Will be populated by getAvailableTriggers
                organizations: [response.organization] || []
            };
            
            console.log('OptixApiService: Retrieved reference data from API:', data);
            
            return {
                data_type,
                data: data[data_type] || []
            };
        } catch (error) {
            console.error('Error getting reference data from Optix API:', error);
            
            // Fallback to mock data if API call fails
            const data = {
                admins: [
                    { id: 'admin1', name: 'John Admin', email: 'john@example.com' },
                    { id: 'admin2', name: 'Jane Admin', email: 'jane@example.com' }
                ],
                access_templates: [
                    { id: 'template1', name: 'Basic Access', description: 'Basic access template' },
                    { id: 'template2', name: 'Admin Access', description: 'Administrative access template' }
                ],
                triggers: [
                    { id: 'user_joined', name: 'User Joined', description: 'User joins organization' },
                    { id: 'access_requested', name: 'Access Requested', description: 'User requests access' }
                ],
                organizations: [
                    { id: 'org1', name: 'Example Corp', description: 'Example organization' }
                ]
            };
            
            return {
                data_type,
                data: data[data_type] || [],
                error: error.message
            };
        }
    }

    /**
     * Validate automation data (mock implementation)
     * @param {Object} args - Function arguments
     * @returns {Promise<Object>} Validation result
     */
    async validateAutomationData(args) {
        const { automation_data } = args;
        // Mock implementation - replace with actual validation
        return {
            valid: true,
            errors: [],
            warnings: []
        };
    }

    /**
     * Commit workflow (mock implementation)
     * @param {Object} args - Function arguments
     * @returns {Promise<Object>} Commit result
     */
    async commitWorkflow(args) {
        const { workflow_data } = args;
        
        try {
            // Import and use the real Optix API service
            const optixApiService = (await import('./OptixApiService.js')).default;
            
            // Initialize the API service if needed
            await optixApiService.initialize();
            
            // Create workflow using Optix API
            const response = await optixApiService.createWorkflow(workflow_data);
            
            console.log('OptixApiService: Workflow committed via API:', response);
            
            return {
                success: response.workflowsCommit.success,
                workflow_id: response.workflowsCommit.data?.workflow_id || 'workflow_' + Date.now(),
                message: response.workflowsCommit.message || 'Workflow committed successfully'
            };
        } catch (error) {
            console.error('Error committing workflow to Optix API:', error);
            
            // Fallback to mock response if API call fails
            return {
                success: false,
                workflow_id: 'workflow_' + Date.now(),
                message: `Failed to commit workflow: ${error.message}`
            };
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
    async sendFunctionResult(functionCall, result, callDepth = 0) {
        console.log(`sendFunctionResult called with depth ${callDepth}:`, { functionCall, result });
        console.log('functionCall.name:', functionCall.name);
        console.log('functionCall object keys:', Object.keys(functionCall));
        
        // Check for infinite loop - if we've made too many recursive calls, break the loop
        if (callDepth >= 3) {
            console.log(`Reached maximum call depth (${callDepth}), creating fallback response to break infinite loop`);
            const fallbackResponse = {
                display_text: "I've gathered the available automation options. Let me help you create this automation step by step. What specific trigger would you like to use for when a new user is added?",
                ui_suggestions: [
                    {
                        id: 'use_new_active_user',
                        label: 'Use NEW_ACTIVE_USER',
                        payload: 'Use the NEW_ACTIVE_USER trigger',
                        variant: 'primary'
                    },
                    {
                        id: 'show_all_triggers',
                        label: 'Show all triggers',
                        payload: 'Show me all available triggers',
                        variant: 'secondary'
                    }
                ]
            };
            
            // Add final assistant response to history
            this.addMessage('assistant', fallbackResponse.display_text);
            
            console.log('Fallback response to break loop:', fallbackResponse);
            return fallbackResponse;
        }
        
        // Handle function calls that don't have a name property
        const functionName = functionCall.name || 'unknown_function';
        
        // Add function result to conversation history
        this.addMessage('tool', JSON.stringify(result), null, functionName);

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
                    content: `I called the ${functionName} function and got the result: ${JSON.stringify(result)}`
                }
            ],
            tools: this.functions.map(func => ({
                type: 'function',
                name: func.name,
                description: func.description,
                parameters: func.parameters
            })),
            tool_choice: 'auto',
            text: {
                format: {
                    type: 'json_schema',
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
                                        variant: { type: 'string', enum: ['primary', 'secondary', 'danger'] }
                                    },
                                    required: ['id', 'label', 'payload', 'variant']
                                }
                            }
                        },
                        required: ['display_text', 'ui_suggestions']
                    }
                }
            }
        };

        // Add recent conversation context for function results
        const recentMessages = this.conversationHistory
            .filter(msg => msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system')
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
            console.log('Function result response output structure:', data.output);
            if (data.output && Array.isArray(data.output)) {
                console.log('Function result output array length:', data.output.length);
                data.output.forEach((item, index) => {
                    console.log(`Function result output item ${index}:`, item);
                    if (item.content && Array.isArray(item.content)) {
                        console.log(`Function result item ${index} content:`, item.content);
                    }
                });
            }

            // Handle the structured response format
            let assistantReply = null;
            
            // Check for structured output in the response
            if (data.output && Array.isArray(data.output)) {
                const structuredOutput = data.output.find(item => item.type === 'message');
                if (structuredOutput && structuredOutput.content && Array.isArray(structuredOutput.content)) {
                    const textContent = structuredOutput.content.find(content => content.type === 'output_text');
                    if (textContent && textContent.text) {
                        try {
                            assistantReply = JSON.parse(textContent.text);
                            console.log('Parsed structured function result response:', assistantReply);
                        } catch (parseError) {
                            console.error('Failed to parse structured function result response:', parseError);
                            // Fallback to plain text
                            assistantReply = {
                                display_text: textContent.text,
                                ui_suggestions: []
                            };
                        }
                    }
                }
                
                // Check if there are more function calls to process
                const functionCalls = data.output.filter(item => item.type === 'function_call');
                if (functionCalls.length > 0) {
                    console.log(`Found ${functionCalls.length} additional function calls to process`);
                    
                    // Process each function call (loop detection is now handled by callDepth parameter)
                    for (const functionCall of functionCalls) {
                        const functionName = functionCall.name || functionCall.function?.name || 'unknown_function';
                        const functionArgs = functionCall.arguments ? JSON.parse(functionCall.arguments) : {};
                        
                        console.log(`Processing additional function call: ${functionName} with args:`, functionArgs);
                        
                        try {
                            const functionResult = await this.executeFunctionCall(functionName, functionArgs);
                            console.log(`Additional function ${functionName} result:`, functionResult);
                            
                            // Send the result back to OpenAI
                            const finalResponse = await this.sendFunctionResult(functionCall, functionResult, callDepth + 1);
                            return finalResponse;
                        } catch (error) {
                            console.error(`Error executing additional function ${functionName}:`, error);
                        }
                    }
                }
            }
            
            // If no structured output found, create fallback
            if (!assistantReply) {
                const functionName = functionCall.name || functionCall.function?.name || 'unknown_function';
                assistantReply = {
                    display_text: `I've gathered the available automation options. Let me help you create this automation step by step. What specific trigger would you like to use for when a new user is added?`,
                    ui_suggestions: [
                        {
                            id: 'use_new_active_user',
                            label: 'Use NEW_ACTIVE_USER',
                            payload: 'Use the NEW_ACTIVE_USER trigger',
                            variant: 'primary'
                        },
                        {
                            id: 'show_all_triggers',
                            label: 'Show all triggers',
                            payload: 'Show me all available triggers',
                            variant: 'secondary'
                        }
                    ]
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
