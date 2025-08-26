<template>
    <o-admin-container :loading="isLoading" :breadcrumb="breadcrumb">
        <template v-slot:primary-actions>
            <o-btn @click="testAuth">
                Test Auth
            </o-btn>
        </template>

        <div>
            <h2>Auth Token Test</h2>
            
            <div class="mb-4">
                <h3>Token Extraction Results:</h3>
                <pre>{{ tokenResults }}</pre>
            </div>

            <div class="mb-4" v-if="organizationData">
                <h3>Organization Data:</h3>
                <pre>{{ organizationData }}</pre>
            </div>

            <div class="mb-4" v-if="error">
                <h3>Error:</h3>
                <pre class="error">{{ error }}</pre>
            </div>

            <div class="mb-4">
                <h3>Current URL:</h3>
                <pre>{{ currentUrl }}</pre>
            </div>
        </div>
    </o-admin-container>
</template>

<script>
import { getValidatedAuthToken } from '@/helpers/authHelpers';
import GetOrgIDandName from '@/graphql-queries/organization.graphql';

export default {
    data() {
        return {
            isLoading: false,
            tokenResults: null,
            organizationData: null,
            error: null,
            currentUrl: window.location.href
        };
    },
    async mounted() {
        await this.$optix.init();
        this.testAuth();
    },
    methods: {
        async testAuth() {
            this.isLoading = true;
            this.error = null;
            this.organizationData = null;

            try {
                // Test token extraction
                console.log('Testing auth token extraction...');
                const tokenResult = getValidatedAuthToken();
                this.tokenResults = tokenResult;
                console.log('Token extraction result:', tokenResult);

                if (!tokenResult.isValid) {
                    this.error = `Token validation failed: ${tokenResult.error}`;
                    return;
                }

                // Test GraphQL query
                console.log('Testing GraphQL query with token...');
                const response = await this.$optix.graphql.query(GetOrgIDandName);
                console.log('GraphQL response:', response);
                
                this.organizationData = response.data;
                
                if (response.data && response.data.organization) {
                    console.log('✅ Success! Organization name:', response.data.organization.name);
                    this.$optix.canvas.pushSnackbar({
                        message: `✅ Auth working! Organization: ${response.data.organization.name}`,
                        type: "success"
                    });
                } else {
                    this.error = 'GraphQL query returned no organization data';
                }

            } catch (error) {
                console.error('Auth test error:', error);
                this.error = error.message || 'Unknown error occurred';
                this.$optix.canvas.pushSnackbar({
                    message: `❌ Auth test failed: ${this.error}`,
                    type: "error"
                });
            } finally {
                this.isLoading = false;
            }
        }
    },
    computed: {
        breadcrumb() {
            return ["Auth Test"];
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
