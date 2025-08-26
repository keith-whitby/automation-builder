/**
 * Optix API Service for GraphQL operations
 * Handles authentication and API calls to Optix
 */
import authService from './AuthService.js';

class OptixApiService {
    constructor() {
        this.baseUrl = window.optix_env?.conf?.optix_v2_url || 'https://api.optixapp.com';
        this.graphqlEndpoint = `${this.baseUrl}/graphql`;
        this.token = null;
    }

    /**
     * Initialize the API service with authentication
     */
    async initialize() {
        console.log('OptixApiService: Initializing...');
        
        // Get token from auth service
        this.token = authService.getToken();
        
        if (!this.token) {
            throw new Error('No authentication token available');
        }

        console.log('OptixApiService: Initialized with token');
        return true;
    }

    /**
     * Make a GraphQL query or mutation
     */
    async graphqlRequest(query, variables = {}) {
        if (!this.token) {
            await this.initialize();
        }

        const headers = {
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Content-Type': 'application/json',
            'Origin': window.location.origin,
            'Referer': window.location.href,
            'User-Agent': navigator.userAgent,
            'authorization': `Bearer ${this.token}`
        };

        const body = {
            query: query,
            variables: variables
        };

        console.log('OptixApiService: Making GraphQL request', { query: query.substring(0, 100) + '...', variables });

        try {
            const response = await fetch(this.graphqlEndpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.errors) {
                console.error('OptixApiService: GraphQL errors', data.errors);
                throw new Error(`GraphQL errors: ${data.errors.map(e => e.message).join(', ')}`);
            }

            console.log('OptixApiService: GraphQL response received', data);
            return data.data;
        } catch (error) {
            console.error('OptixApiService: GraphQL request failed', error);
            throw error;
        }
    }

    /**
     * Get organization information
     */
    async getOrganization() {
        const query = `
            query GetOrgIDandName {
                organization {
                    organization_id
                    name
                    square_logo {
                        url
                    }
                }
            }
        `;

        return await this.graphqlRequest(query);
    }

    /**
     * Get available workflow steps
     */
    async getWorkflowAvailableSteps() {
        const query = `
            query GetWorkflowAvailableSteps($organization_id: ID!) {
                workflowAvailableSteps(organization_id: $organization_id) {
                    ... on WorkflowTrigger {
                        workflow_step_id
                        trigger_type
                        requires_automations_plus
                        variables {
                            name
                        }
                    }
                    ... on WorkflowCondition {
                        workflow_step_id
                        requires_automations_plus
                        condition_operation
                    }
                    ... on WorkflowDelay {
                        workflow_step_id
                        requires_automations_plus
                    }
                    ... on WorkflowAction {
                        workflow_step_id
                        action_type
                        requires_automations_plus
                    }
                }
            }
        `;

        const organizationId = authService.getOrganizationId();
        return await this.graphqlRequest(query, { organization_id: organizationId });
    }

    /**
     * Create a workflow (automation)
     */
    async createWorkflow(workflowData) {
        const mutation = `
            mutation CreateWorkflow($organization_id: ID!, $input: WorkflowInput!) {
                workflowsCommit(
                    organization_id: $organization_id
                    input: $input
                ) {
                    success
                    message
                    data {
                        workflow_id
                    }
                }
            }
        `;

        const organizationId = authService.getOrganizationId();
        return await this.graphqlRequest(mutation, { 
            organization_id: organizationId,
            input: workflowData 
        });
    }

    /**
     * Get reference data for automation building
     */
    async getReferenceData() {
        const query = `
            query GetReferenceData {
                admins {
                    id
                    name
                    email
                }
                accessTemplates {
                    id
                    name
                    description
                }
                locations {
                    id
                    name
                    address
                }
            }
        `;

        return await this.graphqlRequest(query);
    }

    /**
     * Test the API connection
     */
    async testConnection() {
        try {
            const orgData = await this.getOrganization();
            console.log('OptixApiService: Connection test successful', orgData);
            return {
                success: true,
                organization: orgData.organization
            };
        } catch (error) {
            console.error('OptixApiService: Connection test failed', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Create singleton instance
const optixApiService = new OptixApiService();
export default optixApiService;
