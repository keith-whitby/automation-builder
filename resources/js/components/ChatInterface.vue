<template>
    <div class="chat-interface">
        <!-- Messages Area -->
        <div class="messages-area" ref="messagesContainer">

            <!-- Chat Messages -->
            <div v-for="(message, index) in messages" :key="index" class="message-wrapper">
                <MessageBubble 
                    :message="message"
                    :is-typing="false"
                    :hide-buttons="clickedMessageIds.includes(message.id || index)"
                    @quick-reply="(suggestion) => handleQuickReply(suggestion, message.id || index)"
                />

            </div>

            <!-- Typing Indicator / Status Message -->
            <div v-if="isTyping || lastCompletedStatus" class="message-wrapper">
                <MessageBubble 
                    :message="{ role: 'assistant', content: '', timestamp: new Date() }"
                    :is-typing="isTyping"
                    :status-message="isTyping ? statusMessage : lastCompletedStatus"
                />
            </div>
        </div>

        <!-- Input Area -->
        <div class="input-area">
            <!-- Example Prompts (shown when no messages) -->
            <div v-if="messages.length === 0" class="example-prompts">
                <h3>Try these examples:</h3>
                <div class="prompt-examples">
                    <div class="prompt-example" @click="sendMessage('Send a welcome email to new users when they join the organization')">
                        Send a welcome email to new users when they join the organization
                    </div>
                    <div class="prompt-example" @click="sendMessage('Create a task when users raise an issue, wait 5 days then send a message')">
                        Create a task when users raise an issue, wait 5 days then send a message
                    </div>
                    <div class="prompt-example" @click="sendMessage('Send an email to users 5 days after their invoice becomes due')">
                        Send an email to users 5 days after their invoice becomes due
                    </div>
                </div>
            </div>

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
        },
        statusHistory: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            userInput: '',
            clickedMessageIds: [],
            currentSteps: [], // Track the current automation steps
            lastCompletedStatus: '' // Track the last completed status message
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
        isTyping(newValue, oldValue) {
            // When typing stops, save the last status message (converted to past tense)
            if (oldValue && !newValue && this.statusMessage) {
                this.lastCompletedStatus = this.convertToPastTense(this.statusMessage);
                
                // Clear after the next message comes in
                setTimeout(() => {
                    if (this.messages.length > 0) {
                        this.lastCompletedStatus = '';
                    }
                }, 100);
            }
            
            this.$nextTick(() => {
                this.scrollToBottom();
            });
        },
        statusHistory: {
            handler(newHistory) {
                // When status history is updated and we're not typing, show the last status
                if (!this.isTyping && newHistory.length > 0) {
                    const lastStatus = newHistory[newHistory.length - 1];
                    this.lastCompletedStatus = lastStatus.displayText;
                }
            },
            deep: true
        }
    },
    methods: {
        sendMessage(content) {
            if (!content.trim()) return;
            
            // Clear the last completed status when sending a new message
            this.lastCompletedStatus = '';
            
            this.$emit('send-message', content);
            this.userInput = '';
        },
        
        convertToPastTense(text) {
            // Convert present tense status messages to past tense
            return text
                .replace(/Processing/gi, 'Processed')
                .replace(/Sending/gi, 'Sent')
                .replace(/Loading/gi, 'Loaded')
                .replace(/Fetching/gi, 'Fetched')
                .replace(/Creating/gi, 'Created')
                .replace(/Updating/gi, 'Updated')
                .replace(/\.\.\.$/, ''); // Remove trailing ellipsis
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
                // Check if this is an instruction to add a step
                if (this.isAutomationInstruction(suggestion.payload, suggestion.label, suggestion.id)) {
                    this.handleAutomationInstruction(suggestion.id, suggestion.payload, suggestion.label);
                }
                // Always send payload as user message
                this.sendMessage(suggestion.payload);
            }
        },

        isAutomationInstruction(payload, label = '', id = '') {
            // Check if the payload or label is an instruction to add a step
            const lowerPayload = (payload || '').toLowerCase();
            const lowerLabel = (label || '').toLowerCase();
            const lowerId = (id || '').toLowerCase();
            const combined = lowerPayload + ' ' + lowerLabel;
            
            // Check for add/use keywords with step types
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
            
            // Check for "use" + trigger pattern (e.g., "Yes, use New Active User")
            const hasUseTrigger = combined.includes('use') && combined.includes('trigger');
            
            // Check for delay patterns (e.g., "wait 5 days")
            const hasDelay = combined.match(/\d+\s*(day|hour|minute|week)s?/);
            
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
        },

        handleAutomationInstruction(id, payload, label = '') {
            console.log('🔍 Handling automation instruction:', { id, payload, label });
            
            // Parse the instruction and add the appropriate step
            const lowerPayload = (payload || '').toLowerCase();
            const lowerLabel = (label || '').toLowerCase();
            const lowerId = (id || '').toLowerCase();
            const combined = lowerPayload + ' ' + lowerLabel;
            
            // List of known action IDs from Optix API
            const knownActions = [
                'send_email', 'send_message', 'create_task', 'post_to_feed',
                'send_doc_to_sign', 'add_allowance', 'add_invoice_item',
                'add_to_group_conversation', 'change_account_type', 'change_user_status'
            ];
            
            console.log('🔍 Checking detection:', {
                lowerId,
                isKnownAction: knownActions.includes(lowerId),
                hasTriggerKeyword: combined.includes('trigger') || combined.includes('use'),
                hasEmailKeyword: combined.includes('email'),
                hasMessageKeyword: combined.includes('message'),
                hasTaskKeyword: combined.includes('task')
            });
            
            // Check what type of step this is
            if (combined.includes('trigger') || (combined.includes('use') && !knownActions.includes(lowerId))) {
                // Convert id to Optix format: "new_active_user" -> "NEW_ACTIVE_USER"
                const triggerType = id.toUpperCase();
                console.log(`✅ Detected trigger instruction. ID: "${id}" -> Trigger Type: "${triggerType}"`);
                this.addTriggerByType(triggerType);
            } else if (knownActions.includes(lowerId)) {
                // ID matches a known action type
                const actionType = id.toUpperCase();
                console.log(`✅ Detected action by ID match. ID: "${id}" -> Action Type: "${actionType}"`);
                this.addActionByType(actionType, combined);
            } else if (combined.includes('delay') || combined.includes('wait')) {
                console.log('✅ Detected delay instruction');
                this.addDelay(id, combined);
            } else if (combined.includes('condition')) {
                console.log('✅ Detected condition instruction');
                this.addCondition(id, combined);
            } else if (combined.includes('email') || combined.includes('message') || combined.includes('task')) {
                // Try to infer action type from text
                let actionType = id.toUpperCase();
                if (combined.includes('send') && combined.includes('email')) {
                    actionType = 'SEND_EMAIL';
                } else if (combined.includes('send') && combined.includes('message')) {
                    actionType = 'SEND_MESSAGE';
                } else if (combined.includes('create') && combined.includes('task')) {
                    actionType = 'CREATE_TASK';
                }
                console.log(`✅ Detected action by keyword. Inferred Action Type: "${actionType}"`);
                this.addActionByType(actionType, combined);
            } else {
                console.log('❌ No matching automation instruction found for:', { id, payload, label, combined });
            }
        },

        setRandomName() {
            const randomTitles = [
                "Fall seven times, stand up eight",
                "Adventure awaits",
                "Magic happens here",
                "Dream big, achieve bigger",
                "Today's special automation",
                "The automation formerly known as...",
                "Ctrl+Alt+Delight",
                "Automation McAutomationface",
                "This is the way",
                "May the flows be with you",
                "To infinity and beyond!",
                "Never gonna give you up",
                "Hello there, General Kenobi",
                "One automation to rule them all",
                "With great power comes great automation"
            ];
            
            const randomTitle = randomTitles[Math.floor(Math.random() * randomTitles.length)];
            
            // Send message to parent window
            window.parent.postMessage({ 
                command: "AssistantSetAutomationName", 
                payload: { name: randomTitle } 
            }, '*');
            
            console.log('Sent AssistantSetAutomationName message:', { command: "AssistantSetAutomationName", payload: { name: randomTitle } });
        },

        testOpenStep() {
            // Send message to parent window to open automation step
            window.parent.postMessage({ 
                command: "AssistantOpenAutomationStep", 
                payload: { position: 2 } 
            }, '*');
            
            console.log('Sent AssistantOpenAutomationStep message:', { command: "AssistantOpenAutomationStep", payload: { position: 2 } });
        },

        createUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        addTrigger(triggerId) {
            // Map trigger IDs to trigger types
            const triggerMap = {
                'issue_raised': 'NEW_ISSUE',
                'user_raised_issue': 'NEW_ISSUE',
                'new_issue': 'NEW_ISSUE',
                'invoice_due': 'INVOICE_DUE',
                'user_joined': 'USER_JOINED',
                'new_user': 'USER_JOINED'
            };

            const triggerType = triggerMap[triggerId.toLowerCase()] || 'NEW_ISSUE';
            
            console.log('addTrigger called:', { triggerId, triggerType });

            const trigger = {
                workflow_step_id: "UI_" + this.createUUID(),
                ui_new: true,
                __typename: "WorkflowTrigger",
                trigger_type: triggerType,
                variables: [],
                default_condition: null
            };

            this.currentSteps.push(trigger);
            this.updateAutomationSteps();
            
            console.log('✅ Added trigger:', { triggerType, trigger });
        },

        addTriggerByType(triggerType) {
            // Add a trigger with a specific trigger type
            console.log('addTriggerByType called with:', triggerType);
            
            if (!triggerType) {
                console.error('❌ Error: triggerType is undefined!');
                return;
            }
            
            const trigger = {
                workflow_step_id: "UI_" + this.createUUID(),
                ui_new: true,
                __typename: "WorkflowTrigger",
                trigger_type: triggerType,
                variables: [],
                default_condition: null
            };

            this.currentSteps.push(trigger);
            this.updateAutomationSteps();
            
            console.log('✅ Added trigger:', { triggerType, trigger });
        },

        addDelay(id, payload) {
            // Extract delay value and unit from payload if possible
            const delayMatch = payload.match(/(\d+)\s*(day|hour|minute|week)s?/i);
            const value = delayMatch ? delayMatch[1] : "3";
            const unit = delayMatch ? delayMatch[2].toUpperCase() : "DAY";

            const delay = {
                workflow_step_id: "UI_" + this.createUUID(),
                ui_new: true,
                delay_for: { value, unit }
            };

            this.currentSteps.push(delay);
            this.updateAutomationSteps();
        },

        addCondition(id, payload) {
            // Default condition - can be customized based on payload
            const condition = {
                workflow_step_id: "UI_" + this.createUUID(),
                ui_new: true,
                condition_operation: "IN",
                condition_parameters: [
                    {
                        value: null,
                        property_id: null,
                        variable: "INVOICE_STATUS"
                    },
                    { value: "Due" },
                    { value: "Overdue" }
                ]
            };

            this.currentSteps.push(condition);
            this.updateAutomationSteps();
        },

        addActionByType(actionType, textContent = '') {
            // Add an action with a specific action type
            console.log('addActionByType called with:', { actionType, textContent });
            
            if (!actionType) {
                console.error('❌ Error: actionType is undefined!');
                return;
            }
            
            const action = {
                workflow_step_id: "UI_" + this.createUUID(),
                ui_new: true,
                action_type: actionType
            };
            
            // Add specific action properties based on type
            if (actionType === 'SEND_MESSAGE' || actionType.includes('MESSAGE')) {
                const messageMatch = textContent.match(/["'](.+?)["']/);
                const message = messageMatch ? `<p>${messageMatch[1]}</p>` : "<p>Message content here</p>";
                action.send_message = {
                    message: message,
                    from_admin_user_id: null,
                    target_admin_user_id: null,
                    target_group_conversation_id: null,
                    target_team_admins: true
                };
            } else if (actionType === 'CREATE_TASK' || actionType.includes('TASK')) {
                action.create_task = {
                    name: "<p>New task</p>",
                    description: "<p>Task description</p>",
                    assignee_user_id: null,
                    set_assignee_primary_location_admin: true,
                    set_no_due_timestamp: false,
                    to_due: { value: 0, unit: "DAY" }
                };
            } else if (actionType === 'SEND_EMAIL' || actionType.includes('EMAIL')) {
                action.send_email = {
                    subject: "Email subject",
                    body: "<p>Email body</p>",
                    target_admin_user_id: null,
                    target_team_admins: true,
                    notification_type: null,
                    mail_provider_credentials_id: null
                };
            }
            
            this.currentSteps.push(action);
            this.updateAutomationSteps();
            
            console.log('✅ Added action:', { actionType, action });
        },

        addSendMessageAction(id, payload) {
            // Legacy method - use addActionByType instead
            this.addActionByType('SEND_MESSAGE', payload);
        },

        addCreateTaskAction(id, payload) {
            // Legacy method - use addActionByType instead
            this.addActionByType('CREATE_TASK', payload);
        },

        updateAutomationSteps() {
            // Create a plain copy without Vue reactivity to avoid infinite loops
            const plainSteps = JSON.parse(JSON.stringify(this.currentSteps));
            
            // Send the complete updated steps array to parent window
            window.parent.postMessage({ 
                command: "AssistantSetAutomationSteps", 
                payload: { steps: plainSteps } 
            }, '*');
            
            console.log('✅ Updated automation steps (count: ' + plainSteps.length + '):', plainSteps);
        },

        testSetSteps() {
            const steps = [
                {
                    workflow_step_id: "UI_" + this.createUUID(),
                    ui_new: true,
                    __typename: "WorkflowTrigger",
                    trigger_type: "INVOICE_DUE",
                    variables: [],
                    default_condition: null
                },
                {
                    workflow_step_id: "UI_" + this.createUUID(),
                    ui_new: true,
                    delay_for: { value: "3", unit: "DAY" }
                },
                {
                    workflow_step_id: "UI_" + this.createUUID(),
                    ui_new: true,
                    condition_operation: "IN",
                    condition_parameters: [
                        {
                            value: null,
                            property_id: null,
                            variable: "INVOICE_STATUS"
                        },
                        { value: "Due" },
                        { value: "Overdue" }
                    ]
                },
                {
                    workflow_step_id: "UI_" + this.createUUID(),
                    ui_new: true,
                    action_type: "SEND_MESSAGE",
                    send_message: {
                        message: "<p>Where's the money, Lebowski?</p>",
                        from_admin_user_id: null,
                        target_admin_user_id: null,
                        target_group_conversation_id: null,
                        target_team_admins: true
                    }
                },
                {
                    workflow_step_id: "UI_" + this.createUUID(),
                    ui_new: true,
                    action_type: "CREATE_TASK",
                    create_task: {
                        name: "<p>Sample task title</p>",
                        description: "<p>Sample task description</p>",
                        assignee_user_id: null,
                        set_assignee_primary_location_admin: true,
                        set_no_due_timestamp: false,
                        to_due: { value: 0, unit: "DAY" }
                    }
                }
            ];

            // Update internal state and send to parent
            this.currentSteps = steps;
            window.parent.postMessage({ 
                command: "AssistantSetAutomationSteps", 
                payload: { steps } 
            }, '*');
            
            console.log('Sent AssistantSetAutomationSteps message:', { command: "AssistantSetAutomationSteps", payload: { steps } });
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

.example-prompts {
    max-width: 768px;
    margin: 0 auto 16px auto;
    padding: 0 20px;
}

.example-prompts h3 {
    color: #6c757d;
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 500;
    text-align: left;
}

.prompt-examples {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.prompt-example {
    padding: 12px 16px;
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
    .example-prompts {
        padding: 0 16px;
    }
    
    .input-area {
        padding: 16px 16px 32px 16px;
    }
}

/* Additional responsive breakpoints to ensure consistent bottom padding */
@media (max-width: 480px) {
    .example-prompts {
        padding: 0 12px;
    }
    
    .input-area {
        padding: 12px 12px 32px 12px;
    }
}

@media (max-width: 320px) {
    .example-prompts {
        padding: 0 8px;
    }
    
    .input-area {
        padding: 8px 8px 32px 8px;
    }
}
</style>
