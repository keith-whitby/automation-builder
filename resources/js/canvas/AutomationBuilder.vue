<template>
    <div class="automation-builder">
        <div class="main-container">
            <!-- Chat Interface -->
            <div class="chat-section">
                <ChatInterface
                    :messages="messages"
                    :is-typing="isLoading"
                    :status-message="statusMessage"
                    @send-message="handleSendMessage"
                    @tool-call="handleToolCall"
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
        
        <!-- Status History for Current Message -->
        <div v-if="currentStatusHistory.length > 0" class="status-history-overlay">
            <div class="status-history">
                <div 
                    v-for="(status, index) in currentStatusHistory" 
                    :key="index"
                    class="status-item"
                >
                    {{ status.displayText }}
                </div>
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
            currentStep: null
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
                        const apiKey = window.OPENAI_API_KEY;
                        if (!apiKey) {
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
                    const response = await openAIService.sendMessage(userMessage);
                    this.addMessage('assistant', response);
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
        
        addMessage(role, content, showTyping = false, typingText = '') {
            const message = {
                role,
                content,
                timestamp: new Date(),
                showTyping,
                typingText
            };
            
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

.status-history-overlay {
    position: absolute;
    bottom: 20px;
    left: 20px;
    right: 20px;
    z-index: 1000;
    pointer-events: none;
}

.status-history {
    background-color: rgba(255, 255, 255, 0.95);
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 12px;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    max-width: 600px;
    margin: 0 auto;
}

.status-item {
    font-size: 12px;
    color: #666;
    margin: 4px 0;
    padding: 2px 0;
}

.status-item:not(:last-child) {
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 6px;
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
    
    .status-history-overlay {
        left: 16px;
        right: 16px;
        bottom: 16px;
    }
}
</style>
