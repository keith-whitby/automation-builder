<template>
    <div class="automation-builder">
        <div class="main-container">
            <!-- Chat Interface -->
            <div class="chat-section">
                <ChatInterface
                    ref="chatInterface"
                    :messages="messages"
                    :is-typing="isLoading"
                    :status-message="statusMessage"
                    :status-history="currentStatusHistory"
                    @send-message="handleSendMessage"
                    @tool-call="handleToolCall"
                    @steps-updated="handleStepsUpdated"
                />
            </div>
            
            <!-- Automation Preview Panel (if needed) -->
            <div v-if="showPreview" class="preview-section">
                <AutomationPreview
                    :automation-data="currentAutomation"
                    :current-step="currentStep"
                    @start-again="handleStartAgain"
                />
            </div>
        </div>
    </div>
</template>

<script>
import ChatInterface from '../components/ChatInterface.vue';
import AutomationPreview from '../components/AutomationPreview.vue';
import openAIService from '../services/OpenAIService.js';
import optixApiService from '../services/OptixApiService.js';

export default {
    name: 'AutomationBuilder',
    components: {
        ChatInterface,
        AutomationPreview
    },
    data() {
        return {
            messages: [],
            isLoading: false,
            statusMessage: '',
            currentStatusHistory: [],
            showPreview: false,
            currentAutomation: null,
            currentStep: null,
            currentSteps: [],
            hasTrigger: false
        };
    },
    async mounted() {
        console.log('AutomationBuilder mounted');
        
        // Initialize Optix if available
        try {
            if (this.$optix) {
                // Load environment vars
                if (typeof this.$optix.env.readUrl === 'function') {
                    this.$optix.env.readUrl();
                }

                // Handle special environment configs
                if (window.optix_env) {
                    if (typeof this.$optix.env.setConf === 'function') {
                        this.$optix.env.environment = window.optix_env.env;
                        this.$optix.env.setConf(
                            window.optix_env.conf,
                            window.optix_env.env
                        );
                    }
                }

                // Set default Optix Theme (fonts, colors, etc...)
                if (typeof this.$optix.page.refreshStylesheet === 'function') {
                    this.$optix.page.refreshStylesheet();
                }
                console.log('Optix initialized successfully');
            } else {
                console.log('Optix not available, continuing without it');
            }
        } catch (error) {
            console.warn('Optix initialization failed, continuing without it:', error);
        }
        
        await this.initializeServices();
        
        // Set up status callback for OpenAI service
        openAIService.setStatusCallback((status, data = null) => {
            this.statusMessage = status;
            
            // Track status history for the current message
            if (status) {
                const statusEntry = {
                    originalText: status,
                    displayText: status,
                    data: data,
                    timestamp: new Date()
                };
                
                // Check if this status already exists (to avoid duplicates)
                const existingIndex = this.currentStatusHistory.findIndex(s => s.originalText === status);
                if (existingIndex >= 0) {
                    // Update existing entry with data if available
                    if (data) {
                        this.currentStatusHistory[existingIndex].data = data;
                        this.currentStatusHistory[existingIndex].displayText = this.convertToPastTense(status);
                    }
                } else {
                    this.currentStatusHistory.push(statusEntry);
                }
            }
        });
        
        console.log('AutomationBuilder initialization complete');
    },
    methods: {
        async initializeServices() {
            try {
                // Initialize Optix API service
                await optixApiService.initialize();
                console.log('OptixApiService initialized successfully');
                
                // Initialize OpenAI service
                if (!openAIService.apiKey) {
                    try {
                        // Try to get API key from window first
                        let apiKey = window.OPENAI_API_KEY;
                        
                        // If not available, fetch from runtime endpoint
                        if (!apiKey || apiKey === '' || apiKey === '{{OPENAI_API_KEY}}') {
                            console.log('API key not available in window, fetching from runtime endpoint...');
                            try {
                                const response = await fetch('/api/config');
                                const config = await response.json();
                                apiKey = config.OPENAI_API_KEY;
                                console.log('Runtime API key loaded:', apiKey ? '***SET***' : 'NOT SET');
                            } catch (fetchError) {
                                console.error('Failed to fetch API key from runtime endpoint:', fetchError);
                                apiKey = null;
                            }
                        }
                        
                        if (!apiKey || apiKey === '' || apiKey === '{{OPENAI_API_KEY}}') {
                            console.warn('OpenAI API key not found. OpenAI features will be disabled.');
                            this.addMessage('assistant', 'Welcome! I\'m your automation assistant. Note: OpenAI integration is not configured, so I can only help with basic automation guidance. To enable full functionality, please configure your OpenAI API key.');
                        } else {
                            openAIService.initialize(apiKey);
                            console.log('OpenAIService initialized successfully');
                        }
                    } catch (error) {
                        console.error('Failed to initialize OpenAI service:', error);
                        this.addMessage('assistant', 'OpenAI service initialization failed. I\'ll continue with basic functionality.');
                    }
                }
                
                // Welcome message will be handled by ChatInterface component
                
            } catch (error) {
                console.error('Service initialization failed:', error);
                this.addMessage('assistant', 'Initialization failed. Please refresh the page and try again.');
            }
        },
        
        handleStepsUpdated(steps) {
            // Track current steps and whether we have a trigger
            this.currentSteps = steps;
            const previousTriggerState = this.hasTrigger;
            this.hasTrigger = steps.some(step => step.__typename === 'WorkflowTrigger' || step.trigger_type);
            
            if (this.hasTrigger && !previousTriggerState) {
                console.log('🎯 Trigger added! Future LLM responses will focus on actions, delays, and conditions.');
            }
            
            console.log('Steps updated. Has trigger:', this.hasTrigger, 'Step count:', steps.length);
        },
        
        async handleSendMessage(userMessage) {
            if (!userMessage.trim() || this.isLoading) return;
            
            // Add user message
            this.addMessage('user', userMessage);
            
            // Clear previous status history
            this.currentStatusHistory = [];
            
            this.isLoading = true;
            this.statusMessage = 'Processing your request...';
            
            try {
                if (!openAIService.apiKey) {
                    this.addMessage('assistant', 'I understand you want to: "' + userMessage + '". However, I need OpenAI integration to provide full automation assistance. Please configure your OPENAI_API_KEY environment variable to enable AI-powered automation building.');
                } else {
                    // Check if user is explicitly asking for a different trigger
                    const askingForNewTrigger = userMessage.toLowerCase().includes('different trigger') || 
                                               userMessage.toLowerCase().includes('change trigger') ||
                                               userMessage.toLowerCase().includes('another trigger');
                    
                    // Pass context about current automation state
                    const response = await openAIService.sendMessage(userMessage, {
                        hasTrigger: this.hasTrigger && !askingForNewTrigger,
                        currentSteps: this.currentSteps
                    });
                    
                    // Handle structured response from OpenAI
                    if (typeof response === 'object' && response.display_text) {
                        this.addMessage('assistant', response.display_text, false, '', response.ui_suggestions);
                    } else {
                        this.addMessage('assistant', response);
                    }
                }
            } catch (error) {
                console.error('Error sending message:', error);
                this.addMessage('assistant', `Sorry, I encountered an error: ${error.message}`);
            } finally {
                this.isLoading = false;
                this.statusMessage = '';
            }
        },
        
        async handleToolCall(toolCall) {
            console.log('Tool call received:', toolCall);
            // Handle tool calls from the chat interface
            // This would typically involve calling the appropriate service method
        },
        
        handleStartAgain() {
            console.log('Starting automation over');
            this.messages = [];
            this.currentAutomation = null;
            this.currentStep = null;
            this.showPreview = false;
            this.currentStatusHistory = [];
        },
        
        addMessage(role, content, showTyping = false, typingText = '', ui_suggestions = null) {
            const message = {
                role,
                content,
                timestamp: new Date(),
                showTyping,
                typingText
            };
            
            // Add UI suggestions if provided
            if (ui_suggestions && Array.isArray(ui_suggestions)) {
                message.ui_suggestions = ui_suggestions;
            }
            
            this.messages.push(message);
        },
        
        
        convertToPastTense(text) {
            // Convert present tense status messages to past tense for history
            return text
                .replace(/Processing/gi, 'Processed')
                .replace(/Sending/gi, 'Sent')
                .replace(/Loading/gi, 'Loaded')
                .replace(/Fetching/gi, 'Fetched')
                .replace(/Creating/gi, 'Created')
                .replace(/Updating/gi, 'Updated');
        }
    }
};
</script>

<style scoped>
.automation-builder {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #f5f5f5;
    position: relative;
}

.main-container {
    display: flex;
    height: 100%;
    flex: 1;
}

.chat-section {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.preview-section {
    width: 300px;
    border-left: 1px solid #e0e0e0;
    background: white;
    display: flex;
    flex-direction: column;
}

/* Responsive design */
@media (max-width: 1024px) {
    .preview-section {
        display: none;
    }
}

@media (max-width: 768px) {
    .automation-builder {
        margin: 0;
        height: 100vh;
    }
}
</style>
