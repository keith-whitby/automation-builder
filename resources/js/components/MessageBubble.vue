<template>
    <div class="message" :class="message.role">
        <div class="message-container">
            <div class="message-content">
                <div class="message-text" v-html="formatMessage(message.content)"></div>
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
                .replace(/\n/g, '<br>');
        },


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
