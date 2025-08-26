<template>
    <div>
        <h1>Optix API Service Test</h1>
        
        <div class="status-section">
            <h2>Authentication Status</h2>
            <div :class="['status', authStatus.success ? 'success' : 'error']">
                <strong>Auth Service:</strong> {{ authStatus.message }}
            </div>
            <div v-if="authStatus.token" class="token-info">
                <strong>Token:</strong> {{ authStatus.token.substring(0, 20) }}...
            </div>
        </div>

        <div class="api-section">
            <h2>API Tests</h2>
            <div class="button-group">
                <button @click="testConnection" :disabled="loading" class="test-button">
                    🔗 Test Connection
                </button>
                <button @click="testOrganization" :disabled="loading" class="test-button">
                    🏢 Get Organization
                </button>
                <button @click="testWorkflowSteps" :disabled="loading" class="test-button">
                    ⚙️ Get Workflow Steps
                </button>
                <button @click="testReferenceData" :disabled="loading" class="test-button">
                    📊 Get Reference Data
                </button>
            </div>
        </div>

        <div v-if="loading" class="loading">
            <p>Loading...</p>
        </div>

        <div v-if="results.length > 0" class="results-section">
            <h2>Test Results</h2>
            <div v-for="(result, index) in results" :key="index" class="result-item">
                <h3>{{ result.test }}</h3>
                <div :class="['status', result.success ? 'success' : 'error']">
                    <strong>Status:</strong> {{ result.success ? 'SUCCESS' : 'FAILED' }}
                </div>
                <div v-if="result.data" class="data-preview">
                    <strong>Data:</strong>
                    <pre>{{ JSON.stringify(result.data, null, 2) }}</pre>
                </div>
                <div v-if="result.error" class="error-details">
                    <strong>Error:</strong> {{ result.error }}
                </div>
            </div>
        </div>

        <div class="debug-section">
            <h2>Debug Info</h2>
            <div class="debug-info">
                <p><strong>Base URL:</strong> {{ baseUrl }}</p>
                <p><strong>GraphQL Endpoint:</strong> {{ graphqlEndpoint }}</p>
                <p><strong>Optix Environment:</strong> {{ optixEnv }}</p>
            </div>
        </div>
    </div>
</template>

<script>
import authService from '../services/AuthService.js';
import optixApiService from '../services/OptixApiService.js';

export default {
    name: 'OptixApiTestCanvas',
    data() {
        return {
            loading: false,
            authStatus: {
                success: false,
                message: 'Not initialized',
                token: null
            },
            results: [],
            baseUrl: '',
            graphqlEndpoint: '',
            optixEnv: 'Not available'
        };
    },
    async mounted() {
        console.log('OptixApiTestCanvas: Component mounted');
        await this.initializeAuth();
        this.updateDebugInfo();
    },
    methods: {
        async initializeAuth() {
            try {
                console.log('OptixApiTestCanvas: Initializing auth...');
                const initialized = authService.initialize();
                const token = authService.getToken();
                
                this.authStatus = {
                    success: initialized,
                    message: initialized ? 'Authenticated' : 'No token found',
                    token: token
                };
                
                console.log('OptixApiTestCanvas: Auth status', this.authStatus);
            } catch (error) {
                console.error('OptixApiTestCanvas: Auth initialization failed', error);
                this.authStatus = {
                    success: false,
                    message: `Error: ${error.message}`,
                    token: null
                };
            }
        },

        updateDebugInfo() {
            this.baseUrl = window.optix_env?.conf?.optix_v2_url || 'Not set';
            this.graphqlEndpoint = `${this.baseUrl}/graphql`;
            this.optixEnv = window.optix_env ? JSON.stringify(window.optix_env, null, 2) : 'Not available';
        },

        async testConnection() {
            this.loading = true;
            try {
                console.log('OptixApiTestCanvas: Testing connection...');
                const result = await optixApiService.testConnection();
                
                this.results.push({
                    test: 'API Connection Test',
                    success: result.success,
                    data: result.organization,
                    error: result.error
                });
                
                console.log('OptixApiTestCanvas: Connection test result', result);
            } catch (error) {
                console.error('OptixApiTestCanvas: Connection test failed', error);
                this.results.push({
                    test: 'API Connection Test',
                    success: false,
                    error: error.message
                });
            } finally {
                this.loading = false;
            }
        },

        async testOrganization() {
            this.loading = true;
            try {
                console.log('OptixApiTestCanvas: Testing organization query...');
                const result = await optixApiService.getOrganization();
                
                this.results.push({
                    test: 'Get Organization',
                    success: true,
                    data: result
                });
                
                console.log('OptixApiTestCanvas: Organization result', result);
            } catch (error) {
                console.error('OptixApiTestCanvas: Organization test failed', error);
                this.results.push({
                    test: 'Get Organization',
                    success: false,
                    error: error.message
                });
            } finally {
                this.loading = false;
            }
        },

        async testWorkflowSteps() {
            this.loading = true;
            try {
                console.log('OptixApiTestCanvas: Testing workflow steps query...');
                const result = await optixApiService.getWorkflowAvailableSteps();
                
                this.results.push({
                    test: 'Get Workflow Steps',
                    success: true,
                    data: result
                });
                
                console.log('OptixApiTestCanvas: Workflow steps result', result);
            } catch (error) {
                console.error('OptixApiTestCanvas: Workflow steps test failed', error);
                this.results.push({
                    test: 'Get Workflow Steps',
                    success: false,
                    error: error.message
                });
            } finally {
                this.loading = false;
            }
        },

        async testReferenceData() {
            this.loading = true;
            try {
                console.log('OptixApiTestCanvas: Testing reference data query...');
                const result = await optixApiService.getReferenceData();
                
                this.results.push({
                    test: 'Get Reference Data',
                    success: true,
                    data: result
                });
                
                console.log('OptixApiTestCanvas: Reference data result', result);
            } catch (error) {
                console.error('OptixApiTestCanvas: Reference data test failed', error);
                this.results.push({
                    test: 'Get Reference Data',
                    success: false,
                    error: error.message
                });
            } finally {
                this.loading = false;
            }
        }
    }
};
</script>

<style scoped>
.status-section, .api-section, .results-section, .debug-section {
    margin: 20px 0;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.status {
    padding: 10px;
    border-radius: 4px;
    margin: 10px 0;
}

.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.button-group {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 15px 0;
}

.test-button {
    background-color: #007cba;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

.test-button:hover:not(:disabled) {
    background-color: #005a87;
}

.test-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.loading {
    text-align: center;
    padding: 20px;
    color: #666;
}

.result-item {
    margin: 15px 0;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.data-preview, .error-details {
    margin-top: 10px;
    padding: 10px;
    background-color: #f8f9fa;
    border-radius: 4px;
}

.data-preview pre {
    margin: 0;
    white-space: pre-wrap;
    font-size: 12px;
}

.debug-info {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
}

.debug-info pre {
    margin: 0;
    white-space: pre-wrap;
}

.token-info {
    background-color: #fff3cd;
    color: #856404;
    padding: 10px;
    border-radius: 4px;
    margin: 10px 0;
    font-family: monospace;
    font-size: 12px;
}
</style>
