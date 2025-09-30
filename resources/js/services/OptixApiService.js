/**
 * Optix API Service for GraphQL operations
 * Handles authentication and API calls to Optix
 */
import authService from './AuthService.js';

class OptixApiService {
    constructor() {
        // Check if we're in an iframe with staging.optixdev.com in the URL
        const isStagingIframe = this.isStagingIframe();
        
        if (isStagingIframe) {
            this.baseUrl = 'https://api.catalufa.net';
            this.graphqlEndpoint = `${this.baseUrl}/graphql`;
            console.log('OptixApiService: Using staging API endpoint:', this.graphqlEndpoint);
        } else {
            this.baseUrl = window.optix_env?.conf?.optix_v2_url || 'https://api.optixapp.com';
            this.graphqlEndpoint = `${this.baseUrl}/graphql`;
            console.log('OptixApiService: Using production API endpoint:', this.graphqlEndpoint);
        }
        this.token = null;
    }

    /**
     * Check if the app is loaded in an iframe with staging.optixdev.com in the URL
     */
    isStagingIframe() {
        try {
            // Check if we're in an iframe
            const inIframe = window !== window.top;
            
            // Check if the current URL contains staging.optixdev.com
            const hasStagingUrl = window.location.href.includes('staging.optixdev.com');
            
            // Check if parent URL contains staging.optixdev.com (for cross-origin scenarios)
            let parentHasStagingUrl = false;
            try {
                if (window.parent && window.parent !== window) {
                    parentHasStagingUrl = window.parent.location.href.includes('staging.optixdev.com');
                }
            } catch (error) {
                // Cross-origin access blocked, which is expected
                console.log('OptixApiService: Cannot access parent URL (cross-origin):', error.message);
            }
            
            const isStaging = inIframe && (hasStagingUrl || parentHasStagingUrl);
            console.log('OptixApiService: Staging detection:', {
                inIframe,
                hasStagingUrl,
                parentHasStagingUrl,
                isStaging,
                currentUrl: window.location.href
            });
            
            return isStaging;
        } catch (error) {
            console.warn('OptixApiService: Error detecting staging iframe:', error);
            return false;
        }
    }

    /**
     * Initialize the API service with authentication
     */
    async initialize() {
        console.log('OptixApiService: Initializing...');
        
        try {
            // Initialize auth service first
            const authInitialized = authService.initialize();
            if (!authInitialized) {
                throw new Error('Authentication service failed to initialize');
            }
            
            // Get token from auth service
            this.token = authService.getToken();
            
            if (!this.token) {
                throw new Error('No authentication token available. Please check your Optix configuration.');
            }

            // Validate token format
            if (this.token.length < 20) {
                throw new Error('Invalid token format. Token appears to be too short.');
            }

            console.log('OptixApiService: Initialized with token');
            return true;
            
        } catch (error) {
            console.error('OptixApiService: Initialization failed', error);
            throw new Error(`API Service initialization failed: ${error.message}`);
        }
    }

    /**
     * Make a GraphQL query or mutation
     */
    async graphqlRequest(query, variables = {}) {
        try {
            // Ensure we have a valid token
            if (!this.token) {
                await this.initialize();
            }

            // Validate token before making request
            if (!this.token || this.token.length < 20) {
                throw new Error('Invalid or missing authentication token. Please check your Optix configuration.');
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

            const response = await fetch(this.graphqlEndpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });

            // Handle different HTTP status codes
            if (response.status === 401) {
                throw new Error('Authentication failed. Token may be invalid or expired. Please refresh the page.');
            } else if (response.status === 403) {
                throw new Error('Access forbidden. You may not have permission to access this resource.');
            } else if (response.status === 404) {
                throw new Error('API endpoint not found. Please check the Optix API configuration.');
            } else if (response.status >= 500) {
                throw new Error('Server error. Please try again later or contact Optix support.');
            } else if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            
            // Handle GraphQL errors
            if (data.errors) {
                console.error('OptixApiService: GraphQL errors', data.errors);
                
                // Check for authentication-related GraphQL errors
                const authErrors = data.errors.filter(error => 
                    error.message.includes('authentication') || 
                    error.message.includes('unauthorized') ||
                    error.message.includes('token')
                );
                
                if (authErrors.length > 0) {
                    throw new Error('Authentication error: ' + authErrors.map(e => e.message).join(', '));
                }
                
                throw new Error(`GraphQL errors: ${data.errors.map(e => e.message).join(', ')}`);
            }

            console.log('OptixApiService: GraphQL response received', data);
            return data.data;
            
        } catch (error) {
            console.error('OptixApiService: GraphQL request failed', error);
            
            // Provide user-friendly error messages
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Network error. Please check your internet connection and try again.');
            } else if (error.message.includes('CORS')) {
                throw new Error('Cross-origin request blocked. Please check your Optix configuration.');
            }
            
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
            query GetWorkflowAvailableSteps {
                workflowAvailableSteps {
                    ... on WorkflowTrigger {
                        workflow_step_id
                        trigger_type
                        requires_automations_plus
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

        return await this.graphqlRequest(query);
    }

    /**
     * Get existing workflows
     */
    async getWorkflows() {
        const query = `
            query GetWorkflows {
                workflows(
                    limit: 100
                    page: 1
                    order: NAME_ASC
                ) {
                    total
                    data {
                        workflow_id
                        name
                        is_paused
                        trigger_type
                        created_timestamp
                        updated_timestamp
                    }
                }
            }
        `;

        return await this.graphqlRequest(query);
    }

    /**
     * Get available trigger types
     */
    async getWorkflowTriggerTypes() {
        const query = `
            query GetAvailableTriggers {
                workflowAvailableSteps {
                    ... on WorkflowTrigger {
                        trigger_type
                        variables
                    }
                }
            }
        `;

        return await this.graphqlRequest(query);
    }

    /**
     * Get available variables (conditions) for each trigger
     */
    async getWorkflowVariables() {
        const query = `
            query GetAvailableVariables {
                workflowAvailableSteps {
                    ... on WorkflowTrigger {
                        trigger_type
                        variables
                    }
                }
            }
        `;

        return await this.graphqlRequest(query);
    }

    /**
     * Get available workflow action types from enum
     */
    async getWorkflowActionTypes() {
        const query = `
            query WorkflowActionEnumValues {
                __type(name: "WorkflowActionType") {
                    enumValues { 
                        name 
                        description 
                    }
                }
            }
        `;

        return await this.graphqlRequest(query);
    }

    /**
     * Get available workflow steps by type
     */
    async getWorkflowAvailableSteps(stepType = null) {
        const query = `
            query GetWorkflowAvailableSteps {
                workflowAvailableSteps {
                    ... on WorkflowTrigger {
                        trigger_type
                        variables
                    }
                    ... on WorkflowAction {
                        action_type
                    }
                    ... on WorkflowCondition {
                        condition_operation
                    }
                }
            }
        `;

        return await this.graphqlRequest(query);
    }

    /**
     * Get available action types
     */
    async getWorkflowActionTypes() {
        const query = `
            query WorkflowActionEnumValues {
                __type(name: "WorkflowActionType") {
                    name
                    enumValues {
                        name
                        description
                    }
                }
            }
        `;

        return await this.graphqlRequest(query);
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
