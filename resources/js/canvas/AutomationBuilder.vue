<template>
    <div class="automation-builder">
        <div class="chat-container">
            <div class="messages-container" ref="messagesContainer">
                <div 
                    v-for="(message, index) in messages" 
                    :key="index"
                    class="message-wrapper"
                >
                    <MessageBubble 
                        :message="message"
                        :is-user="message.role === 'user'"
                        :is-assistant="message.role === 'assistant'"
                        :show-typing="message.showTyping"
                        :typing-text="message.typingText"
                    />
                </div>
                
                <!-- Status messages -->
                <div v-if="statusMessage" class="status-message">
                    {{ statusMessage }}
                </div>
                
                <!-- Status history for current message -->
                <div v-if="currentStatusHistory.length > 0" class="status-history">
                    <div 
                        v-for="(status, index) in currentStatusHistory" 
                        :key="index"
                        class="status-item"
                    >
                        {{ status.displayText }}
                    </div>
                </div>
            </div>
            
            <div class="input-container">
                <div class="input-wrapper">
                    <textarea
                        v-model="currentMessage"
                        @keydown.enter.prevent="handleEnterKey"
                        @keyup.enter="sendMessage"
                        placeholder="Describe the automation you want to create..."
                        :disabled="isLoading"
                        class="message-input"
                        rows="3"
                    ></textarea>
                    <button 
                        @click="sendMessage" 
                        :disabled="isLoading || !currentMessage.trim()"
                        class="send-button"
                    >
                        <span v-if="!isLoading">Send</span>
                        <span v-else>Sending...</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import MessageBubble from '../components/MessageBubble.vue';
import openAIService from '../services/OpenAIService.js';
import optixApiService from '../services/OptixApiService.js';

export default {
    name: 'AutomationBuilder',
    components: {
        MessageBubble
    },
    data() {
        return {
            messages: [],
            currentMessage: '',
            isLoading: false,
            statusMessage: '',
            currentStatusHistory: []
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
                        const apiKey = process.env.OPENAI_API_KEY || window.OPENAI_API_KEY;
                        if (!apiKey) {
                            throw new Error('OpenAI API key not found. Please set OPENAI_API_KEY environment variable.');
                        }
                        openAIService.initialize(apiKey);
                        console.log('OpenAIService initialized successfully');
                    } catch (error) {
                        console.error('Failed to initialize OpenAI service:', error);
                        this.addMessage('assistant', 'OpenAI service initialization failed. Please check your API key configuration.');
                    }
                }
                
                // Add welcome message
                this.addMessage('assistant', 'Hello! I\'m your automation assistant. I can help you create complex Optix automations through natural language. What would you like to automate today?');
                
            } catch (error) {
                console.error('Service initialization failed:', error);
                this.addMessage('assistant', 'Initialization failed. Please refresh the page and try again.');
            }
        },
        
        async sendMessage() {
            if (!this.currentMessage.trim() || this.isLoading) return;
            
            const userMessage = this.currentMessage.trim();
            this.currentMessage = '';
            
            // Add user message
            this.addMessage('user', userMessage);
            
            // Clear previous status history
            this.currentStatusHistory = [];
            
            this.isLoading = true;
            this.statusMessage = 'Processing your request...';
            
            try {
                const response = await openAIService.sendMessage(userMessage);
                this.addMessage('assistant', response);
            } catch (error) {
                console.error('Error sending message:', error);
                this.addMessage('assistant', `Sorry, I encountered an error: ${error.message}`);
            } finally {
                this.isLoading = false;
                this.statusMessage = '';
            }
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
            this.$nextTick(() => {
                this.scrollToBottom();
            });
        },
        
        handleEnterKey(event) {
            if (event.shiftKey) {
                // Allow new line with Shift+Enter
                return;
            }
            // Enter alone sends the message
            this.sendMessage();
        },
        
        scrollToBottom() {
            const container = this.$refs.messagesContainer;
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
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
}

.chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-width: 800px;
    margin: 0 auto;
    background: white;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.message-wrapper {
    display: flex;
    flex-direction: column;
}

.status-message {
    background-color: #e3f2fd;
    border-left: 4px solid #2196f3;
    padding: 12px 16px;
    margin: 8px 0;
    border-radius: 4px;
    font-size: 14px;
    color: #1976d2;
}

.status-history {
    background-color: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 12px;
    margin: 8px 0;
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

.input-container {
    border-top: 1px solid #e0e0e0;
    padding: 20px;
    background: white;
}

.input-wrapper {
    display: flex;
    gap: 12px;
    align-items: flex-end;
}

.message-input {
    flex: 1;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 12px;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    min-height: 50px;
    max-height: 120px;
}

.message-input:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.send-button {
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    min-width: 80px;
}

.send-button:hover:not(:disabled) {
    background-color: #1976d2;
}

.send-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

/* Responsive design */
@media (max-width: 768px) {
    .chat-container {
        margin: 0;
        height: 100vh;
    }
    
    .messages-container {
        padding: 16px;
    }
    
    .input-container {
        padding: 16px;
    }
    
    .input-wrapper {
        flex-direction: column;
        gap: 8px;
    }
    
    .send-button {
        align-self: flex-end;
    }
}
</style>
