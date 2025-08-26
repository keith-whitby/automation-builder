<template>
    <div class="chat-interface">
        <!-- Messages Area -->
        <div class="messages-area" ref="messagesContainer">
            <!-- Welcome Message -->
            <div v-if="messages.length === 0" class="welcome-message">
                <div class="welcome-content">
                    <v-icon large color="primary" class="mb-4">mdi-chat-outline</v-icon>
                    <h2>Welcome to the Optix Automation Builder!</h2>
                    <p>I'm here to help you create automations for your Optix organization. Just tell me what you want to automate, and I'll guide you through the process.</p>
                    
                    <div class="example-prompts">
                        <h3>Try these examples:</h3>
                        <div class="prompt-examples">
                            <div class="prompt-example" @click="sendMessage('Send a welcome email to new users when they join the organization')">
                                "Send a welcome email to new users when they join the organization"
                            </div>
                            <div class="prompt-example" @click="sendMessage('Notify admins when someone requests access to a sensitive resource')">
                                "Notify admins when someone requests access to a sensitive resource"
                            </div>
                            <div class="prompt-example" @click="sendMessage('Automatically assign users to groups based on their department')">
                                "Automatically assign users to groups based on their department"
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
                />
            </div>

            <!-- Typing Indicator -->
            <div v-if="isTyping" class="message-wrapper">
                <MessageBubble 
                    :message="{ role: 'assistant', content: '', timestamp: new Date() }"
                    :is-typing="true"
                />
            </div>
        </div>

        <!-- Input Area -->
        <div class="input-area">
            <div class="input-container">
                <v-textarea
                    v-model="userInput"
                    placeholder="Describe what you want to automate..."
                    rows="3"
                    auto-grow
                    outlined
                    dense
                    hide-details
                    @keydown.enter.prevent="handleEnterKey"
                    :disabled="isTyping"
                    class="message-input"
                ></v-textarea>
                <v-btn
                    @click="sendMessage(userInput)"
                    :disabled="!userInput.trim() || isTyping"
                    color="primary"
                    class="send-button"
                    :loading="isTyping"
                >
                    <v-icon>mdi-send</v-icon>
                </v-btn>
            </div>
            <div class="input-hint">
                Press Enter to send, Shift+Enter for new line
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
        }
    },
    data() {
        return {
            userInput: ''
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
        }
    }
};
</script>

<style scoped>
.chat-interface {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.messages-area {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
}

.welcome-message {
    text-align: center;
    padding: 40px 20px;
    color: #6c757d;
}

.welcome-content h2 {
    color: #2c3e50;
    margin-bottom: 10px;
}

.example-prompts {
    margin-top: 30px;
}

.example-prompts h3 {
    color: #2c3e50;
    margin-bottom: 15px;
}

.prompt-examples {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 500px;
    margin: 0 auto;
}

.prompt-example {
    padding: 12px 16px;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
    color: #495057;
}

.prompt-example:hover {
    background: #e9ecef;
    border-color: #adb5bd;
}

.message-wrapper {
    margin-bottom: 20px;
}

.input-area {
    border-top: 1px solid #e9ecef;
    padding-top: 20px;
}

.input-container {
    display: flex;
    gap: 10px;
    align-items: flex-end;
}

.message-input {
    flex: 1;
}

.send-button {
    height: 40px;
    min-width: 40px;
}

.input-hint {
    font-size: 12px;
    color: #6c757d;
    margin-top: 8px;
    text-align: center;
}

/* Responsive design */
@media (max-width: 768px) {
    .messages-area {
        padding: 10px;
    }
    
    .welcome-content {
        text-align: center;
    }
    
    .input-container {
        flex-direction: column;
    }
    
    .send-button {
        align-self: flex-end;
    }
}
</style>
