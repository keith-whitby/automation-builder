<template>
    <div class="message" :class="message.role">
        <div class="message-avatar">
            <v-icon v-if="message.role === 'user'">mdi-account</v-icon>
            <v-icon v-else color="primary">mdi-robot</v-icon>
        </div>
        <div class="message-content">
            <div class="message-text" v-html="formatMessage(message.content)"></div>
            <div class="message-timestamp">{{ formatTimestamp(message.timestamp) }}</div>
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
            
            // Simple markdown-like formatting
            return content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>');
        },

        formatTimestamp(timestamp) {
            return new Date(timestamp).toLocaleTimeString();
        }
    }
};
</script>

<style scoped>
.message {
    display: flex;
    gap: 12px;
    align-items: flex-start;
}

.message.user {
    flex-direction: row-reverse;
}

.message-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.message.user .message-avatar {
    background: #007bff;
    color: white;
}

.message-content {
    flex: 1;
    max-width: 70%;
}

.message.user .message-content {
    text-align: right;
}

.message-text {
    padding: 12px 16px;
    border-radius: 12px;
    background: #f8f9fa;
    color: #2c3e50;
    line-height: 1.5;
}

.message.user .message-text {
    background: #007bff;
    color: white;
}

.message-timestamp {
    font-size: 12px;
    color: #6c757d;
    margin-top: 5px;
}

.message.user .message-timestamp {
    text-align: right;
}

.typing-indicator {
    display: flex;
    gap: 4px;
    padding: 12px 16px;
    background: #f8f9fa;
    border-radius: 12px;
}

.typing-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #6c757d;
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
    .message-content {
        max-width: 85%;
    }
}
</style>
