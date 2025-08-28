<template>
    <div class="message" :class="message.role">
        <div class="message-container">
            <div class="message-content">
                <div v-if="isTyping" class="loading-indicator">
                    <div v-if="statusMessage" class="status-message">{{ statusMessage }}</div>
                    <div class="pulsing-circle"></div>
                </div>
                <div v-else-if="isAssistantMessage && showTypingEffect" class="message-text typing-effect" v-html="displayedContent"></div>
                <div v-else class="message-text" v-html="formatMessage(message.content)"></div>
                
                <!-- Quick Reply Buttons -->
                <div v-if="isAssistantMessage && message.ui_suggestions && message.ui_suggestions.length > 0" class="quick-replies">
                    <div class="quick-reply-buttons">
                        <button
                            v-for="(suggestion, index) in message.ui_suggestions"
                            :key="`${suggestion.id}-${index}`"
                            @click="handleQuickReply(suggestion)"
                            class="quick-reply-button secondary"
                        >
                            {{ suggestion.label }}
                        </button>
                    </div>
                </div>
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
        },
        statusMessage: {
            type: String,
            default: ''
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
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.forceSecondaryClass();
            this.startContinuousFix();
        });
    },
    beforeDestroy() {
        if (this.fixInterval) {
            clearInterval(this.fixInterval);
        }
    },
    watch: {
        message: {
            handler(newMessage) {
                if (this.isAssistantMessage && newMessage.content && !this.isTyping) {
                    this.startTypingEffect();
                }
                this.$nextTick(() => {
                    this.forceSecondaryClass();
                });
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
        },
        handleQuickReply(suggestion) {
            // Emit event to parent component
            this.$emit('quick-reply', suggestion);
        },
        forceSecondaryClass() {
            // Force all quick-reply buttons to have secondary class
            const buttons = this.$el.querySelectorAll('.quick-reply-button');
            buttons.forEach(button => {
                button.classList.remove('primary');
                button.classList.add('secondary');
            });
        },
        startContinuousFix() {
            // Set up a continuous interval to fix any buttons that get the primary class
            this.fixInterval = setInterval(() => {
                const buttons = document.querySelectorAll('.quick-reply-button.primary');
                buttons.forEach(button => {
                    button.classList.remove('primary');
                    button.classList.add('secondary');
                    // Force set inline styles with maximum priority
                    button.style.setProperty('background', '#6b7280', 'important');
                    button.style.setProperty('background-color', '#6b7280', 'important');
                    button.style.setProperty('color', '#ffffff', 'important');
                    button.style.setProperty('border-color', '#6b7280', 'important');
                    // Also set the styles directly
                    button.style.background = '#6b7280';
                    button.style.backgroundColor = '#6b7280';
                    button.style.color = '#ffffff';
                    button.style.borderColor = '#6b7280';
                    // Force remove any conflicting styles
                    button.style.removeProperty('background-image');
                    button.style.removeProperty('background-size');
                });
            }, 25); // Check every 25ms for even faster response
        }

    }
};
</script>

<style scoped>
.message {
    padding: 20px 0;
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
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 0;
}

.status-message {
    color: #6b7280;
    font-size: 14px;
    font-weight: 400;
    margin-bottom: 4px;
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

/* Quick Reply Buttons */
.quick-replies {
    margin-top: 16px;
}

.quick-reply-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.quick-reply-button {
    padding: 8px 16px;
    border: 1px solid #d1d5db;
    border-radius: 20px;
    background: #f3f4f6;
    color: #374151;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
}

.quick-reply-button:hover {
    background: #e5e7eb;
    border-color: #9ca3af;
}

.message .quick-reply-button.primary {
    background: #f3f4f6 !important;
    color: #374151 !important;
    border-color: #d1d5db !important;
}

.message .quick-reply-button.primary:hover {
    background: #e5e7eb !important;
    border-color: #9ca3af !important;
}

/* Override any global .btn-primary styles that might be applied */
.message .quick-reply-button.primary.btn-primary {
    background: #f3f4f6 !important;
    color: #374151 !important;
    border-color: #d1d5db !important;
}

.message .quick-reply-button.primary.btn-primary:hover {
    background: #e5e7eb !important;
    border-color: #9ca3af !important;
}

/* Additional specificity to override any global button styles */
.message .quick-reply-buttons .quick-reply-button.primary {
    background: #f3f4f6 !important;
    color: #374151 !important;
    border-color: #d1d5db !important;
}

.message .quick-reply-buttons .quick-reply-button.primary:hover {
    background: #e5e7eb !important;
    border-color: #9ca3af !important;
}

/* Override global Optix UI Kit button styles */
.message .quick-reply-buttons .quick-reply-button.primary,
.message .quick-reply-buttons .quick-reply-button.primary:focus,
.message .quick-reply-buttons .quick-reply-button.primary:active,
.message .quick-reply-buttons .quick-reply-button.primary:visited {
    background: #f3f4f6 !important;
    color: #374151 !important;
    border-color: #d1d5db !important;
    -webkit-appearance: none !important;
    appearance: none !important;
}

/* Maximum specificity override for any global button styles */
.message .quick-reply-buttons .quick-reply-button.primary[class*="primary"] {
    background: #f3f4f6 !important;
    color: #374151 !important;
    border-color: #d1d5db !important;
}

/* Override any CSS custom properties that might be setting colors */
.message .quick-reply-buttons .quick-reply-button.primary {
    --optix-theme-defaultFontColor: #374151 !important;
    --optix-theme-accentColor: #f3f4f6 !important;
    background: #f3f4f6 !important;
    color: #374151 !important;
    border-color: #d1d5db !important;
}

/* Nuclear option - override everything with maximum specificity */
.message .quick-reply-buttons .quick-reply-button.primary,
.message .quick-reply-buttons .quick-reply-button.primary * {
    background: #f3f4f6 !important;
    color: #374151 !important;
    border-color: #d1d5db !important;
}

/* Override any inline styles or computed styles */
.message .quick-reply-buttons .quick-reply-button.primary {
    background-color: #f3f4f6 !important;
    background-image: none !important;
    color: #374151 !important;
    border-color: #d1d5db !important;
    border-style: solid !important;
    border-width: 1px !important;
}

/* Override all possible global button styles */
.message .quick-reply-buttons .quick-reply-button.primary,
.message .quick-reply-buttons .quick-reply-button.primary:not([disabled]),
.message .quick-reply-buttons .quick-reply-button.primary:not(.disabled) {
    background: #f3f4f6 !important;
    background-color: #f3f4f6 !important;
    color: #374151 !important;
    border-color: #d1d5db !important;
    --optix-theme-defaultFontColor: #374151 !important;
    --optix-theme-accentColor: #f3f4f6 !important;
    --optix-theme-accentTextColor: #374151 !important;
}

/* Force override for any global button styles */
.message .quick-reply-buttons .quick-reply-button.primary {
    all: unset !important;
    display: inline-block !important;
    padding: 8px 16px !important;
    border: 1px solid #d1d5db !important;
    border-radius: 20px !important;
    background: #f3f4f6 !important;
    color: #374151 !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    white-space: nowrap !important;
    max-width: 200px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
}

/* Target the button element directly with maximum specificity */
.message .quick-reply-buttons button.quick-reply-button.primary,
.message .quick-reply-buttons .quick-reply-button.primary[type="button"],
.message .quick-reply-buttons .quick-reply-button.primary[type="submit"] {
    all: unset !important;
    display: inline-block !important;
    padding: 8px 16px !important;
    border: 1px solid #d1d5db !important;
    border-radius: 20px !important;
    background: #f3f4f6 !important;
    background-color: #f3f4f6 !important;
    color: #374151 !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    white-space: nowrap !important;
    max-width: 200px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    -webkit-appearance: none !important;
    appearance: none !important;
    box-sizing: border-box !important;
}

/* Override any global button styles with maximum specificity */
.message .quick-reply-buttons .quick-reply-button.primary,
.message .quick-reply-buttons .quick-reply-button.primary:hover,
.message .quick-reply-buttons .quick-reply-button.primary:focus,
.message .quick-reply-buttons .quick-reply-button.primary:active,
.message .quick-reply-buttons .quick-reply-button.primary:visited {
    background: #f3f4f6 !important;
    background-color: #f3f4f6 !important;
    background-image: none !important;
    color: #374151 !important;
    border-color: #d1d5db !important;
    border-style: solid !important;
    border-width: 1px !important;
    --optix-theme-defaultFontColor: #374151 !important;
    --optix-theme-accentColor: #f3f4f6 !important;
    --optix-theme-accentTextColor: #374151 !important;
    --optix-theme-defaultFontRGBColor: 55, 65, 81 !important;
    --optix-theme-accentRGBColor: 243, 244, 246 !important;
}

/* Nuclear option - override everything */
.message .quick-reply-buttons .quick-reply-button.primary {
    all: unset !important;
    display: inline-block !important;
    padding: 8px 16px !important;
    border: 1px solid #d1d5db !important;
    border-radius: 20px !important;
    background: #f3f4f6 !important;
    background-color: #f3f4f6 !important;
    background-image: none !important;
    color: #374151 !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    white-space: nowrap !important;
    max-width: 200px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    -webkit-appearance: none !important;
    appearance: none !important;
    box-sizing: border-box !important;
    font-family: inherit !important;
    text-transform: none !important;
    line-height: 1.5 !important;
    margin: 0 !important;
}

/* Force override for any button with primary class */
.message .quick-reply-buttons button[class*="primary"] {
    background: #f3f4f6 !important;
    background-color: #f3f4f6 !important;
    color: #374151 !important;
    border-color: #d1d5db !important;
}

/* Override any global button styles that might be applied */
.message .quick-reply-buttons button.quick-reply-button {
    background: #f3f4f6 !important;
    background-color: #f3f4f6 !important;
    color: #374151 !important;
    border-color: #d1d5db !important;
}



.quick-reply-button.secondary {
    background: #6b7280;
    background-color: #6b7280;
    color: #ffffff;
    border-color: #6b7280;
}

.quick-reply-button.secondary:hover {
    background: #4b5563;
    background-color: #4b5563;
    border-color: #4b5563;
}

/* Override any button with primary class to look like secondary */

/* Force override for any button with primary class */
.quick-reply-button.primary {
    background: #6b7280 !important;
    background-color: #6b7280 !important;
    color: #ffffff !important;
    border-color: #6b7280 !important;
}

/* Override any global button styles */
button.quick-reply-button {
    background: #6b7280 !important;
    background-color: #6b7280 !important;
    color: #ffffff !important;
    border-color: #6b7280 !important;
}

.quick-reply-button.danger {
    background: #ef4444;
    color: white;
    border-color: #ef4444;
}

.quick-reply-button.danger:hover {
    background: #dc2626;
    border-color: #dc2626;
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
