<template>
    <div class="message" :class="message.role">
        <div class="message-container">
            <div class="message-content">
                <div v-if="isTyping" class="loading-indicator">
                    <div class="pulsing-circle"></div>
                </div>
                <div v-else-if="isAssistantMessage && showTypingEffect" class="message-text typing-effect" v-html="displayedContent"></div>
                <div v-else class="message-text" v-html="formatMessage(message.content)"></div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'MessageBubble',
    props: {
        message: {
            type: Object,
            required: true,
            validator: function(value) {
                return value.role && value.content !== undefined && value.timestamp;
            }
        },
        isTyping: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            displayedContent: '',
            showTypingEffect: false,
            typingSpeed: 15, // milliseconds per character - much faster
            currentIndex: 0,
            fullText: ''
        };
    },
    computed: {
        isAssistantMessage() {
            return this.message.role === 'assistant';
        },
        formattedContent() {
            if (!this.message.content) return 'Processing...';
            
            // Simple markdown-like formatting
            return this.message.content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');
        },

    },
    watch: {
        message: {
            handler(newMessage) {
                if (this.isAssistantMessage && newMessage.content && !this.isTyping) {
                    this.startTypingEffect();
                }
            },
            immediate: true
        }
    },
    methods: {
        formatMessage(content) {
            if (this.isTyping) {
                return '<div class="typing-indicator"><span></span><span></span><span></span></div>';
            }
            
            // Handle null or undefined content
            if (!content) {
                return '<em>Processing...</em>';
            }
            
            // Simple markdown-like formatting
            return content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');
        },
        startTypingEffect() {
            this.showTypingEffect = true;
            this.displayedContent = '';
            this.currentIndex = 0;
            this.fullText = this.formattedContent;
            
            this.typeNextCharacter();
        },
        typeNextCharacter() {
            if (this.currentIndex < this.fullText.length) {
                // Simple substring approach that preserves HTML
                this.displayedContent = this.fullText.substring(0, this.currentIndex + 1);
                this.currentIndex++;
                setTimeout(() => {
                    this.typeNextCharacter();
                }, this.typingSpeed);
            } else {
                // Typing effect complete
                setTimeout(() => {
                    this.showTypingEffect = false;
                }, 100); // Reduced delay for snappier feel
            }
        }
    }
};
</script>

<style scoped>
.message {
    padding: 20px 0;
    border-bottom: 1px solid #f0f0f0;
}

.message:last-child {
    border-bottom: none;
}

.message-container {
    max-width: 768px;
    margin: 0 auto;
    display: flex;
    align-items: flex-start;
}

.message.user .message-container {
    justify-content: flex-end;
}

.message.assistant .message-container {
    justify-content: flex-start;
}

.message-content {
    max-width: 80%;
}

.message-text {
    line-height: 1.6;
    color: #374151;
    font-size: 16px;
}

.message.user .message-text {
    background: #f1f3f4;
    color: #374151;
    padding: 12px 16px;
    border-radius: 12px;
    display: inline-block;
    max-width: 100%;
}

.message.assistant .message-text {
    padding: 0;
    background: transparent;
}

.loading-indicator {
    display: flex;
    align-items: center;
    padding: 8px 0;
}

.pulsing-circle {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #000000;
    animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
    0% {
        transform: scale(0.8);
        opacity: 0.5;
    }
    50% {
        transform: scale(1.2);
        opacity: 1;
    }
    100% {
        transform: scale(0.8);
        opacity: 0.5;
    }
}

.typing-indicator {
    display: flex;
    gap: 4px;
    padding: 0;
}

.typing-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #9ca3af;
    animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
}

.typing-effect {
    animation: fadeIn 0.3s ease-out;
    opacity: 0;
    animation-fill-mode: forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(3px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}



/* Responsive design */
@media (max-width: 768px) {
    .message-container {
        padding: 0 16px;
    }
    
    .message-content {
        max-width: 90%;
    }
}
</style>
