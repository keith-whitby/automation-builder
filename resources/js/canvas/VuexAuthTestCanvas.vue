<template>
    <o-admin-container :loading="isLoading" :breadcrumb="breadcrumb">
        <template v-slot:primary-actions>
            <o-btn @click="testAuthService" :loading="isLoading">
                Test Auth Service
            </o-btn>
            <o-btn @click="clearAuth" color="error">
                Clear Auth
            </o-btn>
        </template>

        <div>
            <h2>Authentication Service Test</h2>
            
            <div class="mb-4">
                <h3>Current Auth State:</h3>
                <pre>{{ authState }}</pre>
            </div>

            <div class="mb-4">
                <h3>Local Storage:</h3>
                <pre>{{ localStorageData }}</pre>
            </div>

            <div class="mb-4" v-if="authError">
                <h3>Auth Error:</h3>
                <pre class="error">{{ authError }}</pre>
            </div>

            <div class="mb-4">
                <h3>Actions:</h3>
                <o-btn @click="validateFromURL" class="mr-2">Validate from URL</o-btn>
                <o-btn @click="restoreFromStorage" class="mr-2">Restore from Storage</o-btn>
                <o-btn @click="checkStorage" class="mr-2">Check Storage</o-btn>
            </div>

            <div class="mb-4" v-if="actionResult">
                <h3>Last Action Result:</h3>
                <pre>{{ actionResult }}</pre>
            </div>
        </div>
    </o-admin-container>
</template>

<script>
let authService;
try {
    authService = require('../services/AuthService.js').default;
} catch (error) {
    console.error('Error loading AuthService:', error);
    // Create a fallback service
    authService = {
        validateAndStoreToken: () => Promise.resolve({ isValid: false, error: 'Service not loaded' }),
        restoreTokenFromStorage: () => Promise.resolve({ isValid: false, error: 'Service not loaded' }),
        clearAll: () => {},
        getAuthState: () => ({ isValid: false, error: 'Service not loaded' }),
        isAuthenticated: () => false,
        getToken: () => null,
        getOrganizationId: () => null,
        getError: () => 'Service not loaded',
        getStorageData: () => ({ hasToken: false })
    };
}

export default {
    data() {
        return {
            isLoading: false,
            actionResult: null,
            authState: null,
            authError: null,
            authLoading: false
        };
    },
    async mounted() {
        console.log('VuexAuthTestCanvas mounted');
        try {
            await this.$optix.init();
            console.log('Optix initialized');
            this.updateAuthState();
            this.checkStorage();
        } catch (error) {
            console.error('Error in mounted:', error);
        }
    },
    methods: {
        async testAuthService() {
            this.isLoading = true;
            try {
                // First try to validate from URL
                const urlResult = await authService.validateAndStoreToken();
                this.actionResult = {
                    action: 'validateAndStoreToken',
                    result: urlResult,
                    timestamp: new Date().toISOString()
                };
                
                if (!urlResult.isValid) {
                    // If URL validation fails, try to restore from storage
                    const storageResult = await authService.restoreTokenFromStorage();
                    this.actionResult = {
                        action: 'restoreTokenFromStorage',
                        result: storageResult,
                        timestamp: new Date().toISOString()
                    };
                }
                
                this.updateAuthState();
                
                this.$optix.canvas.pushSnackbar({
                    message: `Auth test completed: ${authService.isAuthenticated() ? 'Authenticated' : 'Not authenticated'}`,
                    type: authService.isAuthenticated() ? "success" : "warning"
                });
                
            } catch (error) {
                this.actionResult = {
                    action: 'testAuthService',
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
                
                this.$optix.canvas.pushSnackbar({
                    message: `Auth test failed: ${error.message}`,
                    type: "error"
                });
            } finally {
                this.isLoading = false;
            }
        },

        async validateFromURL() {
            try {
                const result = await authService.validateAndStoreToken();
                this.actionResult = {
                    action: 'validateFromURL',
                    result: result,
                    timestamp: new Date().toISOString()
                };
                this.updateAuthState();
            } catch (error) {
                this.actionResult = {
                    action: 'validateFromURL',
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        },

        async restoreFromStorage() {
            try {
                const result = await authService.restoreTokenFromStorage();
                this.actionResult = {
                    action: 'restoreFromStorage',
                    result: result,
                    timestamp: new Date().toISOString()
                };
                this.updateAuthState();
            } catch (error) {
                this.actionResult = {
                    action: 'restoreFromStorage',
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        },

        clearAuth() {
            authService.clearAll();
            this.updateAuthState();
            this.actionResult = {
                action: 'clearAuth',
                result: 'Auth cleared',
                timestamp: new Date().toISOString()
            };
        },

        checkStorage() {
            const storageData = authService.getStorageData();
            
            this.actionResult = {
                action: 'checkStorage',
                localStorage: storageData,
                timestamp: new Date().toISOString()
            };
        },

        updateAuthState() {
            this.authState = authService.getAuthState();
            this.authError = authService.getError();
        }
    },
    computed: {
        isAuthenticated() {
            return authService.isAuthenticated();
        },

        authToken() {
            return authService.getToken();
        },

        organizationId() {
            return authService.getOrganizationId();
        },

        localStorageData() {
            return authService.getStorageData();
        },

        breadcrumb() {
            return ["Auth Service Test"];
        }
    }
};
</script>

<style scoped>
.error {
    color: red;
    background-color: #ffebee;
    padding: 10px;
    border-radius: 4px;
}

pre {
    background-color: #f5f5f5;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
}
</style>
