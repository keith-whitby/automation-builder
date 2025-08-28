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
        this.statusCallback = null;
        
        // Function call limiting
        this.functionCallQuota = {
            maxCallsPerMessage: 5, // Maximum function calls per user message
            callsThisMessage: 0,
            lastMessageId: null
        };
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
     * Set status callback for UI updates
     * @param {Function} callback - Function to call with status updates
     */
    setStatusCallback(callback) {
        this.statusCallback = callback;
    }

    /**
     * Update status message
     * @param {string} status - Status message to display
     */
    updateStatus(status) {
        if (this.statusCallback) {
            this.statusCallback(status);
        }
    }

    /**
     * Reset function call quota for a new message
     * @param {string} messageId - Unique identifier for the message
     */
    resetFunctionCallQuota(messageId) {
        if (this.functionCallQuota.lastMessageId !== messageId) {
            this.functionCallQuota.callsThisMessage = 0;
            this.functionCallQuota.lastMessageId = messageId;
            console.log('Function call quota reset for new message:', messageId);
        }
    }

    /**
     * Check if we can make another function call
     * @returns {boolean} True if function call is allowed
     */
    canMakeFunctionCall() {
        const canCall = this.functionCallQuota.callsThisMessage < this.functionCallQuota.maxCallsPerMessage;
        if (!canCall) {
            console.log(`Function call quota exceeded: ${this.functionCallQuota.callsThisMessage}/${this.functionCallQuota.maxCallsPerMessage}`);
        }
        return canCall;
    }

    /**
     * Increment function call counter
     */
    incrementFunctionCallCount() {
        this.functionCallQuota.callsThisMessage++;
        console.log(`Function call count: ${this.functionCallQuota.callsThisMessage}/${this.functionCallQuota.maxCallsPerMessage}`);
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

        // Generate unique message ID for quota tracking
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.resetFunctionCallQuota(messageId);

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
                // System message is handled by the prompt ID, no need for redundant instructions
                ...this.getContextMessages().filter(msg => msg.role !== 'system')
            ],
            // Include tools in initial call to allow the model to request a tool
            // After executing a tool, sendFunctionResult will disable tools to force user response
            ...(this.canMakeFunctionCall() ? {
                tools: this.functions.map(func => ({
                    type: 'function',
                    name: func.name,
                    description: func.description,
                    parameters: func.parameters
                })),
                tool_choice: 'auto'
            } : {}),
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
                // Check for function calls - handle all function calls from the initial response
                const functionCalls = data.output.filter(item => item.type === 'function_call');
                if (functionCalls.length > 0) {
                    console.log(`Found ${functionCalls.length} function calls in initial response`);
                    
                    // Check if we can make function calls
                    if (!this.canMakeFunctionCall()) {
                        console.log('Function call quota exceeded, cannot provide response without OpenAI');
                        throw new Error('Function call quota exceeded. Please try again with a more specific request.');
                    } else {
                        // Execute all function calls and collect results
                        const functionResults = [];
                        for (const functionCall of functionCalls) {
                            const functionName = functionCall.name || functionCall.function?.name || functionCall.function_name;
                            const functionArgs = functionCall.arguments ? JSON.parse(functionCall.arguments) : {};
                            
                            console.log(`Executing function call: ${functionName} with args:`, functionArgs);
                            
                            // Check quota before each function call
                            if (!this.canMakeFunctionCall()) {
                                console.log('Function call quota exceeded during processing, stopping');
                                break;
                            }
                            
                            try {
                                this.incrementFunctionCallCount();
                                const functionResult = await this.executeFunctionCall(functionName, functionArgs);
                                console.log(`Function ${functionName} result:`, functionResult);
                                
                                // Add function result to conversation history
                                this.addMessage('tool', JSON.stringify(functionResult), null, functionName);
                                functionResults.push({ functionName, result: functionResult });
                            } catch (error) {
                                console.error(`Error executing function ${functionName}:`, error);
                            }
                        }
                        
                        // If we have function results, send them all together in one final call with tools disabled
                        if (functionResults.length > 0) {
                            console.log('Sending all function results together with tools disabled:', functionResults);
                            
                            // Create a combined result message
                            const combinedResult = functionResults.map(fr => 
                                `${fr.functionName}: ${JSON.stringify(fr.result)}`
                            ).join('\n');
                            
                            // Send all results back to OpenAI in one call with tools disabled
                            assistantReply = await this.sendFunctionResult(
                                functionCalls[0], // Use the first function call as reference
                                { results: combinedResult }
                            );
                            return assistantReply;
                        }
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
            
            // If no structured output found, we cannot provide a response without OpenAI
            if (!assistantReply) {
                throw new Error('No response received from OpenAI. Please try again.');
            }

            // Safety check to ensure assistantReply has the required structure
            if (!assistantReply.display_text) {
                console.error('Invalid assistant reply structure:', assistantReply);
                throw new Error('Invalid response structure received from OpenAI. Please try again.');
            }

            // Add assistant response to history
            this.addMessage('assistant', assistantReply.display_text);

            console.log('Processed assistant reply:', assistantReply);
            return assistantReply;

        } catch (error) {
            console.error('Error sending message to OpenAI:', error);
            
            // If it's a quota exceeded error, we can't provide a response without OpenAI
            if (error.message.includes('Function call quota exceeded')) {
                throw new Error('I reached my limit for function calls. Please try again with a more specific request or ask me to help you with a simpler workflow.');
            }
            
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
        
        // Update status based on function name
        const statusMessages = {
            'get_available_triggers': 'Fetching available triggers...',
            'get_available_variables': 'Getting available variables...',
            'get_available_workflow_steps': `Fetching available ${functionArgs.step_type || 'workflow'} steps...`,
            'get_reference_data': `Getting ${functionArgs.data_type || 'reference'} data...`,
            'validate_automation_data': 'Validating automation data...',
            'commit_workflow': 'Committing workflow...'
        };
        
        const statusMessage = statusMessages[functionName] || `Executing ${functionName}...`;
        this.updateStatus(statusMessage);
        
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
                .filter(step => step.trigger_type) // Only include trigger steps
                .map(step => ({
                    id: step.trigger_type,
                    name: step.trigger_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    description: `Triggered when ${step.trigger_type.replace(/_/g, ' ')} occurs`
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
                .filter(step => step.trigger_type) // Only include trigger steps
                .map(step => ({
                    trigger_type: step.trigger_type,
                    variables: step.variables || [],
                    conditions: step.variables || []
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
            
            let steps = [];
            
            if (step_type === 'action') {
                // For actions, use the enum query
                const response = await optixApiService.getWorkflowActionTypes();
                steps = response.__type.enumValues.map(enumValue => ({
                    id: enumValue.name,
                    name: enumValue.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    description: enumValue.description || `Action: ${enumValue.name.replace(/_/g, ' ')}`,
                    parameters: []
                }));
            } else {
                // For triggers, conditions, delays - use the workflowAvailableSteps query
                const response = await optixApiService.getWorkflowAvailableSteps();
                
                // Transform the response to match expected format
                steps = response.workflowAvailableSteps
                    .filter(step => {
                        // Filter by the step type based on the available fields
                        if (step_type === 'trigger') return step.trigger_type;
                        if (step_type === 'condition') return step.condition_operation;
                        if (step_type === 'delay') return step.workflow_step_id; // Delay steps have workflow_step_id
                        return true;
                    })
                    .map(step => {
                        if (step_type === 'trigger') {
                            return {
                                id: step.trigger_type,
                                name: step.trigger_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                description: `Trigger: ${step.trigger_type.replace(/_/g, ' ')}`,
                                variables: step.variables || []
                            };
                        } else if (step_type === 'condition') {
                            return {
                                id: step.condition_operation,
                                name: step.condition_operation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                description: `Condition: ${step.condition_operation.replace(/_/g, ' ')}`,
                                parameters: []
                            };
                        } else if (step_type === 'delay') {
                            return {
                                id: step.workflow_step_id,
                                name: 'Delay',
                                description: 'Delay workflow execution',
                                parameters: []
                            };
                        }
                        return null;
                    })
                    .filter(step => step !== null);
            }
            
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
     * Check if the assistant is narrating tool usage
     * @param {string} displayText - The display text to check
     * @returns {boolean} True if narrating tool usage
     */
    isNarratingToolUsage(displayText) {
        const lowerText = displayText.toLowerCase();
        
        // Check if it starts with "I called" or similar patterns
        if (lowerText.startsWith('i called') || lowerText.startsWith('i executed') || lowerText.startsWith('i ran')) {
            return true;
        }
        
        // Check if it contains tool/function names
        const toolNames = this.functions.map(func => func.name.toLowerCase());
        const hasToolName = toolNames.some(toolName => lowerText.includes(toolName));
        
        return hasToolName;
    }

    /**
     * Retry the function result call with a system nudge to prevent tool narration
     * @param {Object} functionCall - The original function call
     * @param {Object} result - The result of the function execution
     * @returns {Promise<Object>} The retry response
     */
    async retryWithSystemNudge(functionCall, result) {
        const functionName = functionCall.name || functionCall.function?.name || functionCall.function_name;
        
        console.log('Retrying with system nudge to prevent tool narration');
        
        // Prepare request payload with system nudge
        // IMPORTANT: Tools are completely disabled to force user response
        const payload = {
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: 0,
            prompt: { "id": this.promptId },
            input: [
                // Add system nudge to prevent tool narration
                {
                    role: 'system',
                    content: 'Do not narrate tool usage. Ask the user exactly one question now. You cannot use any tools - respond directly to the user.'
                },
                // Function result
                {
                    role: 'assistant',
                    content: `I called the ${functionName} function and got the result: ${JSON.stringify(result)}`
                }
            ],
            // Explicitly disable tools by setting tool_choice to none
            tool_choice: "none",
            // NO tools included - this forces the model to respond to the user
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

        // Add recent conversation context
        const recentMessages = this.conversationHistory
            .filter(msg => msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system')
            .slice(-2);

        recentMessages.forEach(message => {
            payload.input.push({
                role: message.role,
                content: message.content || ''
            });
        });

        try {
            console.log('Sending retry with system nudge');
            console.log('Retry payload (should have NO tools):', JSON.stringify(payload, null, 2));
            
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
            console.log('Retry response:', data);

            // Handle the response (same logic as sendFunctionResult)
            let assistantReply = null;
            
            if (data.output && Array.isArray(data.output)) {
                const structuredOutput = data.output.find(item => item.type === 'message');
                if (structuredOutput && structuredOutput.content && Array.isArray(structuredOutput.content)) {
                    const textContent = structuredOutput.content.find(content => content.type === 'output_text');
                    if (textContent && textContent.text) {
                        try {
                            assistantReply = JSON.parse(textContent.text);
                        } catch (parseError) {
                            assistantReply = {
                                display_text: textContent.text,
                                ui_suggestions: []
                            };
                        }
                    }
                }
            }

            // If still no response, create fallback
            if (!assistantReply) {
                assistantReply = {
                    display_text: `Based on the information I found, what would you like to do next?`,
                    ui_suggestions: []
                };
            }

            // Add final assistant response to history
            this.addMessage('assistant', assistantReply.display_text);

            return assistantReply;

        } catch (error) {
            console.error('Error in retry with system nudge:', error);
            // Fallback response if retry fails
            return {
                display_text: `I've gathered the information you requested. What would you like to do next?`,
                ui_suggestions: []
            };
        }
    }





    /**
     * Send function result back to OpenAI to get final response using Responses API with structured output
     * @param {Object} functionCall - The original function call
     * @param {Object} result - The result of the function execution
     * @param {Array} callStack - Array of function calls in this chain to detect loops
     * @returns {Promise<Object>} Final OpenAI response with display_text and ui_suggestions
     */
    async sendFunctionResult(functionCall, result, callStack = []) {
        const functionName = functionCall.name || functionCall.function?.name || 'unknown_function';
        console.log(`sendFunctionResult called for ${functionName}:`, { functionCall, result, callStack });
        
        // Check for infinite loop by detecting repeated function calls
        const currentCallStack = [...callStack, functionName];
        const functionCallCounts = {};
        currentCallStack.forEach(fn => {
            functionCallCounts[fn] = (functionCallCounts[fn] || 0) + 1;
        });
        
        // If any function has been called more than 2 times, we have a loop
        const hasLoop = Object.values(functionCallCounts).some(count => count > 2);
        if (hasLoop) {
            console.log(`Detected infinite loop in function calls:`, functionCallCounts);
            console.log('Call stack:', currentCallStack);
            
            // Cannot provide response without OpenAI
            throw new Error('Infinite loop detected in function calls. Please try again with a more specific request.');
        }
        
        // Handle function calls that don't have a name property
        // functionName is already declared above
        
        // Add function result to conversation history
        this.addMessage('tool', JSON.stringify(result), null, functionName);

        // Prepare request payload for Responses API with structured output
        // After executing a tool, we disable tools to force the model to respond to the user
        const payload = {
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: 0,
            prompt: { "id": this.promptId },
            input: [
                // System message is handled by the prompt ID, no need for redundant instructions
                {
                    role: 'assistant',
                    content: `I called the ${functionName} function and got the result: ${JSON.stringify(result)}`
                }
            ],
            // Tools are disabled after executing a function call to force user response
            // This prevents the model from making additional tool calls
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
            console.log('Payload being sent (tools should be disabled):', JSON.stringify(payload, null, 2));
            
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
                console.log('Processing response output:', data.output);
                
                const structuredOutput = data.output.find(item => item.type === 'message');
                if (structuredOutput && structuredOutput.content && Array.isArray(structuredOutput.content)) {
                    console.log('Found structured output:', structuredOutput);
                    
                    const textContent = structuredOutput.content.find(content => content.type === 'output_text');
                    if (textContent && textContent.text) {
                        console.log('Found text content:', textContent.text);
                        try {
                            assistantReply = JSON.parse(textContent.text);
                            console.log('Parsed structured function result response:', assistantReply);
                        } catch (parseError) {
                            console.error('Failed to parse structured function result response:', parseError);
                            console.log('Raw text content:', textContent.text);
                            // Fallback to plain text
                            assistantReply = {
                                display_text: textContent.text,
                                ui_suggestions: []
                            };
                        }
                    } else {
                        console.log('No text content found in structured output');
                    }
                } else {
                    console.log('No structured output found, checking for plain text response');
                    
                    // Check if there's a plain text response when structured output fails
                    const plainTextOutput = data.output.find(item => item.type === 'text');
                    if (plainTextOutput && plainTextOutput.text) {
                        console.log('Found plain text output:', plainTextOutput.text);
                        assistantReply = {
                            display_text: plainTextOutput.text,
                            ui_suggestions: []
                        };
                    } else {
                        console.log('No plain text output found either');
                    }
                }
                
                // Note: Tools are disabled after executing a function call
                // This prevents the model from making additional tool calls
                // The model must now respond to the user with the function result
            } else {
                console.log('No output array found in response');
            }
            
            // If no structured output found, create a fallback response
            if (!assistantReply) {
                console.log('Creating fallback response based on function result');
                assistantReply = {
                    display_text: `I've retrieved the information you requested. Here's what I found: ${JSON.stringify(result, null, 2)}`,
                    ui_suggestions: []
                };
            }

            // Check if the assistant is narrating tool usage and retry if needed
            if (assistantReply.display_text && this.isNarratingToolUsage(assistantReply.display_text)) {
                console.log('Assistant is narrating tool usage, retrying with system nudge');
                return await this.retryWithSystemNudge(functionCall, result);
            }

            // Safety check to ensure assistantReply has the required structure
            if (!assistantReply.display_text) {
                console.error('Invalid assistant reply structure:', assistantReply);
                throw new Error('Invalid response structure received from OpenAI. Please try again.');
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
