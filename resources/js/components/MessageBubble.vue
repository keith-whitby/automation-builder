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
                
                <!-- Feedback Icons for Assistant Messages -->
                <div v-if="isAssistantMessage && !isTyping" class="feedback-icons">
                    <button class="feedback-button thumbs-up" @click="handleFeedback('positive')" title="Good response">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 10V20H5V10H7ZM20 10C20 9.45 19.55 9 19 9H13.5L14.5 4H11L10.5 6H9L9.5 4H6L7 9H5C4.45 9 4 9.45 4 10V18C4 18.55 4.45 19 5 19H15L20 14V10Z" fill="currentColor"/>
                        </svg>
                    </button>
                    <button class="feedback-button thumbs-down" @click="handleFeedback('negative')" title="Not helpful">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 14V4H19V14H17ZM4 14C4 14.55 4.45 15 5 15H10.5L9.5 20H13L13.5 18H15L14.5 20H18L17 15H19C19.55 15 20 14.55 20 14V6C20 5.45 19.55 5 19 5H9L4 10V14Z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>

                
                <!-- Quick Reply Buttons -->
                <div v-if="shouldShowQuickReplies" class="quick-replies">
                    <div class="quick-reply-buttons">
                        <button
                            v-for="(suggestion, index) in message.ui_suggestions"
                            :key="`${suggestion.id}-${index}`"
                            @click="handleQuickReply(suggestion)"
                            class="quick-reply-button secondary"
                            :class="{ 'has-step': suggestion.step || isStepModifyingInstruction(suggestion.payload, suggestion.label, suggestion.id) }"
                        >
                            <span v-if="suggestion.step || isStepModifyingInstruction(suggestion.payload, suggestion.label, suggestion.id)" class="step-icon">+</span>
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
        },
        hideButtons: {
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
            fullText: '',
        };
    },
    computed: {
        isAssistantMessage() {
            return this.message.role === 'assistant';
        },
        formattedContent() {
            if (!this.message.content) return 'Processing...';
            
            // Ensure content is a string
            const content = typeof this.message.content === 'string' 
                ? this.message.content 
                : JSON.stringify(this.message.content);
            
            // Simple markdown-like formatting
            return content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');
        },
        shouldShowQuickReplies() {
            return this.isAssistantMessage && 
                   this.message.ui_suggestions && 
                   this.message.ui_suggestions.length > 0 &&
                   !this.hideButtons;
        },
        
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
            
            // Ensure content is a string
            const contentStr = typeof content === 'string' 
                ? content 
                : JSON.stringify(content);
            
            // Simple markdown-like formatting
            return contentStr
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
            console.log('MessageBubble: Emitting quick-reply event:', suggestion);
            if (suggestion.step) {
                console.log('MessageBubble: Step action:', suggestion.step);
            }
            // Emit event to parent component
            this.$emit('quick-reply', suggestion);
        },
        handleFeedback(type) {
            console.log(`Feedback received: ${type} for message:`, this.message);
            // For now, just log the feedback - this could be extended to send to an API
            // You could emit an event to the parent component to handle the feedback
            this.$emit('feedback', { type, message: this.message });
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
        },
        
        isStepModifyingInstruction(payload, label = '', id = '') {
            // Check if the payload, label, or id is an instruction to add/modify automation steps
            if (!payload && !label && !id) return false;
            
            const lowerPayload = (payload || '').toLowerCase();
            const lowerLabel = (label || '').toLowerCase();
            const lowerId = (id || '').toLowerCase();
            const combined = lowerPayload + ' ' + lowerLabel;
            
            // Check for delay in ID or text
            const hasDelayInId = lowerId.includes('delay') || lowerId.includes('wait');
            const hasDelayPattern = combined.match(/\d+\s*(day|hour|minute|week)s?/);
            const hasDelay = hasDelayInId || hasDelayPattern || combined.includes('delay') || combined.includes('wait');
            
            // Check for add/modify keywords with step types
            const hasAddKeyword = combined.includes('add') && (
                combined.includes('trigger') ||
                combined.includes('delay') ||
                combined.includes('wait') ||
                combined.includes('condition') ||
                combined.includes('action') ||
                combined.includes('message') ||
                combined.includes('task') ||
                combined.includes('email')
            );
            
            // Check for "use" + trigger/action pattern (e.g., "Yes, use New Active User")
            const hasUseTrigger = combined.includes('use') && (combined.includes('trigger') || combined.includes('action'));
            
            // Check if ID matches known action types
            const knownActions = [
                'send_email', 'send_message', 'create_task', 'post_to_feed',
                'send_doc_to_sign', 'add_allowance', 'add_invoice_item',
                'add_to_group_conversation', 'change_account_type', 'change_user_status'
            ];
            const isKnownAction = knownActions.includes(lowerId);
            
            // Check if label/payload indicates an action
            const actionKeywords = ['send email', 'send message', 'create task', 'send a message', 'send an email'];
            const hasActionKeyword = actionKeywords.some(keyword => combined.includes(keyword));
            
            return hasAddKeyword || hasUseTrigger || hasDelay || isKnownAction || hasActionKeyword;
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
    white-space: normal;
    word-wrap: break-word;
    line-height: 1.4;
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
    white-space: normal !important;
    word-wrap: break-word !important;
    line-height: 1.4 !important;
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
    white-space: normal !important;
    word-wrap: break-word !important;
    line-height: 1.4 !important;
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
    white-space: normal !important;
    word-wrap: break-word !important;
    line-height: 1.4 !important;
    -webkit-appearance: none !important;
    appearance: none !important;
    box-sizing: border-box !important;
    font-family: inherit !important;
    text-transform: none !important;
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

.message .quick-reply-buttons button.quick-reply-button:hover {
    background: #e5e7eb !important;
    background-color: #e5e7eb !important;
    border-color: #9ca3af !important;
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

/* Feedback Icons Styles */
.feedback-icons {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    align-items: center;
}

.feedback-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;
}

.feedback-button:hover {
    background: #f9fafb;
    border-color: #9ca3af;
    color: #374151;
}

.feedback-button.thumbs-up:hover {
    background: #f0fdf4;
    border-color: #22c55e;
    color: #16a34a;
}

.feedback-button.thumbs-down:hover {
    background: #fef2f2;
    border-color: #ef4444;
    color: #dc2626;
}

.feedback-button svg {
    width: 16px;
    height: 16px;
}

/* Override any button with primary class to look like secondary */

/* Force override for any button with primary class */
.quick-reply-button.primary {
    background: #f3f4f6 !important;
    background-color: #f3f4f6 !important;
    color: #374151 !important;
    border-color: #d1d5db !important;
}

.quick-reply-button.primary:hover {
    background: #e5e7eb !important;
    background-color: #e5e7eb !important;
    border-color: #9ca3af !important;
}

/* Override any global button styles */
button.quick-reply-button {
    background: #f3f4f6 !important;
    background-color: #f3f4f6 !important;
    color: #374151 !important;
    border-color: #d1d5db !important;
}

button.quick-reply-button:hover {
    background: #e5e7eb !important;
    background-color: #e5e7eb !important;
    border-color: #9ca3af !important;
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

/* Step icon styling */
.step-icon {
    display: inline-block;
    font-size: 16px;
    margin-right: 6px;
    flex-shrink: 0;
    opacity: 0.7;
    font-weight: bold;
}

.quick-reply-button.has-step {
    display: flex;
    align-items: center;
    justify-content: flex-start;
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
