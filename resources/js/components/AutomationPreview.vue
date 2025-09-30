<template>
    <div class="automation-preview">
        <div class="preview-header">
            <h3>Automation Preview</h3>
            <button @click="handleStartAgain" class="start-again-btn">
                Start Again
            </button>
        </div>
        
        <div class="preview-content">
            <div v-if="!automationData" class="no-automation">
                <p>No automation in progress</p>
                <p class="hint">Start a conversation to begin building your automation</p>
            </div>
            
            <div v-else class="automation-structure">
                <div class="automation-step" 
                     v-for="(step, index) in automationData.steps" 
                     :key="index"
                     :class="{ 'current': index === currentStepIndex }"
                >
                    <div class="step-number">{{ index + 1 }}</div>
                    <div class="step-content">
                        <div class="step-title">{{ step.type }}</div>
                        <div class="step-description">{{ step.description }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'AutomationPreview',
    props: {
        automationData: {
            type: Object,
            default: null
        },
        currentStep: {
            type: Number,
            default: 0
        }
    },
    computed: {
        currentStepIndex() {
            return this.currentStep || 0;
        }
    },
    methods: {
        handleStartAgain() {
            this.$emit('start-again');
        }
    }
};
</script>

<style scoped>
.automation-preview {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: white;
}

.preview-header {
    padding: 16px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.preview-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
}

.start-again-btn {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.start-again-btn:hover {
    background: #e9ecef;
}

.preview-content {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
}

.no-automation {
    text-align: center;
    color: #6c757d;
    padding: 20px 0;
}

.no-automation .hint {
    font-size: 12px;
    margin-top: 8px;
}

.automation-structure {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.automation-step {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #f8f9fa;
    transition: all 0.2s;
}

.automation-step.current {
    border-color: #2196f3;
    background: #e3f2fd;
}

.step-number {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #6c757d;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
}

.automation-step.current .step-number {
    background: #2196f3;
}

.step-content {
    flex: 1;
}

.step-title {
    font-weight: 600;
    font-size: 14px;
    color: #2c3e50;
    margin-bottom: 4px;
}

.step-description {
    font-size: 12px;
    color: #6c757d;
    line-height: 1.4;
}
</style>
