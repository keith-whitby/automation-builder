<template>
    <div class="chat-interface">
        <!-- Messages Area -->
        <div class="messages-area" ref="messagesContainer">
            <!-- Welcome Message -->
            <div v-if="messages.length === 0" class="welcome-message">
                <div class="welcome-content">
                    <h1>Optix Automation Builder</h1>
                    <p>I'm here to help you create automations for your Optix organization. Just tell me what you want to automate, and I'll guide you through the process.</p>
                    
                    <div class="example-prompts">
                        <h3>Try these examples:</h3>
                        <div class="prompt-examples">
                            <div class="prompt-example" @click="sendMessage('Send a welcome email to new users when they join the organization')">
                                "Send a welcome email to new users when they join the organization"
                            </div>
                            <div class="prompt-example" @click="sendMessage('Create a task when users raise an issue, wait 5 days then send a message')">
                                "Create a task when users raise an issue, wait 5 days then send a message"
                            </div>
                            <div class="prompt-example" @click="sendMessage('Send an email to users 5 days after their invoice becomes due')">
                                "Send an email to users 5 days after their invoice becomes due"
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Chat Messages -->
            <div v-for="(message, index) in messages" :key="index" class="message-wrapper">
                <MessageBubble 
                    :message="message"
                    :is-typing="false"
                    :hide-buttons="clickedMessageIds.includes(message.id || index)"
                    @quick-reply="(suggestion) => handleQuickReply(suggestion, message.id || index)"
                />

            </div>

            <!-- Typing Indicator -->
            <div v-if="isTyping" class="message-wrapper">
                <MessageBubble 
                    :message="{ role: 'assistant', content: '', timestamp: new Date() }"
                    :is-typing="true"
                    :status-message="statusMessage"
                />
            </div>
        </div>

        <!-- Input Area -->
        <div class="input-area">
            <div class="input-container">
                <div class="input-wrapper">
                    <textarea
                        v-model="userInput"
                        placeholder="Message Optix Automation Builder..."
                        @keydown.enter.prevent="handleEnterKey"
                        :disabled="isTyping"
                        class="message-input"
                        rows="2"
                        ref="messageInput"
                    ></textarea>
                    <button
                        @click="sendMessage(userInput)"
                        :disabled="!userInput.trim() || isTyping"
                        class="send-button"
                        :class="{ 'disabled': !userInput.trim() || isTyping }"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import MessageBubble from './MessageBubble.vue';

export default {
    name: 'ChatInterface',
    components: {
        MessageBubble
    },
    props: {
        messages: {
            type: Array,
            default: () => []
        },
        isTyping: {
            type: Boolean,
            default: false
        },
        statusMessage: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            userInput: '',
            clickedMessageIds: []
        };
    },
    watch: {
        messages: {
            handler() {
                this.$nextTick(() => {
                    this.scrollToBottom();
                });
            },
            deep: true
        },
        isTyping() {
            this.$nextTick(() => {
                this.scrollToBottom();
            });
        }
    },
    methods: {
        sendMessage(content) {
            if (!content.trim()) return;
            
            this.$emit('send-message', content);
            this.userInput = '';
        },

        handleEnterKey(event) {
            if (event.shiftKey) {
                // Allow new line
                return;
            }
            this.sendMessage(this.userInput);
        },

        scrollToBottom() {
            if (this.$refs.messagesContainer) {
                this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight;
            }
        },

        handleQuickReply(suggestion, messageId) {
            // Track that this message's buttons have been clicked
            if (!this.clickedMessageIds.includes(messageId)) {
                // Force Vue reactivity by creating a new array reference
                this.clickedMessageIds = [...this.clickedMessageIds, messageId];
            }
            
            if (suggestion.tool_call) {
                // Handle tool call
                this.$emit('tool-call', suggestion.tool_call);
            } else {
                // Send payload as user message
                this.sendMessage(suggestion.payload);
            }
        }
    }
};
</script>

<style scoped>
.chat-interface {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: white;
    overflow: hidden;
}

.messages-area {
    flex: 1;
    overflow-y: auto;
    padding: 0;
    min-height: 0;
}

.welcome-message {
    text-align: center;
    padding: 80px 20px;
    color: #6c757d;
    max-width: 600px;
    margin: 0 auto;
}

.welcome-content h1 {
    color: #2c3e50;
    margin-bottom: 16px;
    font-size: 32px;
    font-weight: 600;
}

.welcome-content p {
    font-size: 16px;
    line-height: 1.6;
    margin-bottom: 32px;
}

.example-prompts {
    margin-top: 40px;
}

.example-prompts h3 {
    color: #2c3e50;
    margin-bottom: 16px;
    font-size: 18px;
    font-weight: 600;
}

.prompt-examples {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 500px;
    margin: 0 auto;
}

.prompt-example {
    padding: 16px 20px;
    background: white;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
    color: #374151;
    text-align: left;
}

.prompt-example:hover {
    background: #f9fafb;
    border-color: #d1d5db;
}

.message-wrapper {
    margin-bottom: 0;
}

.input-area {
    background: white;
    padding: 20px 20px 32px 20px;
    border-top: none !important;
}

.input-container {
    max-width: 768px;
    margin: 0 auto;
}

.input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 12px;
    padding: 8px 12px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.message-input {
    flex: 1;
    border: none;
    outline: none;
    resize: none;
    font-size: 16px;
    line-height: 1.5;
    padding: 8px 0;
    background: transparent;
    font-family: inherit;
}

.message-input:focus {
    outline: none;
}

.message-input::placeholder {
    color: #9ca3af;
}

.send-button {
    background: #000000;
    color: white;
    border: none;
    border-radius: 8px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s ease;
    flex-shrink: 0;
}

.send-button:hover:not(.disabled) {
    background: #333333;
}

.send-button.disabled {
    background: #d1d5db;
    cursor: not-allowed;
}

.send-button svg {
    transform: rotate(0deg);
}

/* Responsive design */
@media (max-width: 768px) {
    .welcome-message {
        padding: 40px 20px;
    }
    
    .welcome-content h1 {
        font-size: 24px;
    }
    
    .input-area {
        padding: 16px 16px 32px 16px;
    }
}

/* Additional responsive breakpoints to ensure consistent bottom padding */
@media (max-width: 480px) {
    .input-area {
        padding: 12px 12px 32px 12px;
    }
}

@media (max-width: 320px) {
    .input-area {
        padding: 8px 8px 32px 8px;
    }
}
</style>
