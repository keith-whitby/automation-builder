import { getValidatedAuthToken, validateTokenFormat } from '../helpers/authHelpers.js';

class AuthService {
    constructor() {
        this.token = null;
        this.organizationId = null;
        this.isValid = false;
        this.error = null;
        this.lastValidated = null;
    }

    /**
     * Initialize the auth service - try to get token from URL or storage
     * @param {string} paramName - The parameter name to extract (default: 'token')
     * @returns {boolean} - True if authentication is successful
     */
    initialize(paramName = 'token') {
        try {
            console.log('AuthService: Initializing...');
            
            // First try to get token from URL
            const urlResult = getValidatedAuthToken(paramName);
            if (urlResult.isValid && urlResult.token) {
                console.log('AuthService: Token found in URL');
                this.token = urlResult.token;
                this.isValid = true;
                this.error = null;
                
                // Extract organization ID and subdomain from URL if available
                const urlParams = new URLSearchParams(window.location.search);
                this.organizationId = urlParams.get('organization_id');
                const subdomain = urlParams.get('subdomain');
                
                console.log('✅ AuthService: URL Parameters Received:', {
                    organization_id: this.organizationId,
                    subdomain: subdomain,
                    token: this.token ? '***SET***' : null
                });
                
                // Store in localStorage
                localStorage.setItem('optix_auth_token', urlResult.token);
                localStorage.setItem('optix_organization_id', this.organizationId || '');
                localStorage.setItem('optix_subdomain', subdomain || '');
                localStorage.setItem('optix_auth_timestamp', new Date().toISOString());
                
                this.lastValidated = new Date().toISOString();
                return true;
            }
            
            // If no token in URL, try to restore from storage
            console.log('AuthService: No token in URL, trying storage...');
            const storedToken = localStorage.getItem('optix_auth_token');
            if (storedToken && validateTokenFormat(storedToken)) {
                console.log('AuthService: Valid token found in storage');
                this.token = storedToken;
                this.isValid = true;
                this.error = null;
                this.organizationId = localStorage.getItem('optix_organization_id');
                const subdomain = localStorage.getItem('optix_subdomain');
                
                console.log('✅ AuthService: Restored from Storage:', {
                    organization_id: this.organizationId,
                    subdomain: subdomain,
                    token: '***SET***'
                });
                
                this.lastValidated = new Date().toISOString();
                return true;
            }
            
            // No valid token found
            console.log('AuthService: No valid token found');
            this.clearAuth();
            return false;
            
        } catch (error) {
            console.error('AuthService: Initialization failed', error);
            this.error = error.message || 'Initialization failed';
            this.isValid = false;
            return false;
        }
    }

    /**
     * Validate and store token from URL parameters
     * @param {string} paramName - The parameter name to extract (default: 'token')
     * @returns {object} - Result object with validation status
     */
    async validateAndStoreToken(paramName = 'token') {
        try {
            const result = getValidatedAuthToken(paramName);
            
            // Extract organization ID from URL if available
            const urlParams = new URLSearchParams(window.location.search);
            const organizationId = urlParams.get('organization_id');
            
            this.token = result.token;
            this.isValid = result.isValid;
            this.error = result.error;
            this.organizationId = organizationId;
            this.lastValidated = new Date().toISOString();
            
            // Store in localStorage for persistence
            if (result.isValid && result.token) {
                localStorage.setItem('optix_auth_token', result.token);
                localStorage.setItem('optix_organization_id', organizationId || '');
                localStorage.setItem('optix_auth_timestamp', new Date().toISOString());
            } else {
                // Clear invalid tokens from storage
                this.clearStorage();
            }
            
            return result;
            
        } catch (error) {
            this.error = error.message || 'Token validation failed';
            this.isValid = false;
            throw error;
        }
    }

    /**
     * Restore token from localStorage
     * @returns {object} - Result object with validation status
     */
    async restoreTokenFromStorage() {
        try {
            const storedToken = localStorage.getItem('optix_auth_token');
            const storedOrgId = localStorage.getItem('optix_organization_id');
            const storedTimestamp = localStorage.getItem('optix_auth_timestamp');
            
            if (!storedToken) {
                this.clearAuth();
                return { isValid: false, error: 'No stored token found' };
            }
            
            // Check if token is not too old (24 hours)
            if (storedTimestamp) {
                const tokenAge = Date.now() - new Date(storedTimestamp).getTime();
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                
                if (tokenAge > maxAge) {
                    this.clearStorage();
                    this.clearAuth();
                    return { isValid: false, error: 'Stored token has expired' };
                }
            }
            
            // Validate the stored token format
            const isValid = validateTokenFormat(storedToken);
            
            if (!isValid) {
                this.clearStorage();
                this.clearAuth();
                return { isValid: false, error: 'Stored token format is invalid' };
            }
            
            this.token = storedToken;
            this.isValid = true;
            this.error = null;
            this.organizationId = storedOrgId;
            this.lastValidated = new Date().toISOString();
            
            return { isValid: true, token: storedToken };
            
        } catch (error) {
            this.error = error.message || 'Failed to restore token from storage';
            this.isValid = false;
            throw error;
        }
    }

    /**
     * Clear authentication data
     */
    clearAuth() {
        this.token = null;
        this.isValid = false;
        this.error = null;
        this.organizationId = null;
        this.lastValidated = null;
    }

    /**
     * Clear localStorage
     */
    clearStorage() {
        localStorage.removeItem('optix_auth_token');
        localStorage.removeItem('optix_organization_id');
        localStorage.removeItem('optix_subdomain');
        localStorage.removeItem('optix_auth_timestamp');
    }

    /**
     * Clear all authentication data and storage
     */
    clearAll() {
        this.clearAuth();
        this.clearStorage();
    }

    /**
     * Get current authentication state
     * @returns {object} - Current auth state
     */
    getAuthState() {
        return {
            token: this.token,
            isValid: this.isValid,
            error: this.error,
            organizationId: this.organizationId,
            isAuthenticated: this.isValid && this.token !== null,
            lastValidated: this.lastValidated
        };
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} - True if authenticated
     */
    isAuthenticated() {
        return this.isValid && this.token !== null;
    }

    /**
     * Get the current token
     * @returns {string|null} - Current token or null
     */
    getToken() {
        return this.token;
    }

    /**
     * Get the organization ID
     * @returns {string|null} - Organization ID or null
     */
    getOrganizationId() {
        return this.organizationId;
    }

    /**
     * Set the organization ID (used when fetched from API)
     * @param {string} organizationId - The organization ID
     */
    setOrganizationId(organizationId) {
        this.organizationId = organizationId;
        if (organizationId) {
            localStorage.setItem('optix_organization_id', organizationId);
        }
    }

    /**
     * Get any authentication error
     * @returns {string|null} - Error message or null
     */
    getError() {
        return this.error;
    }

    /**
     * Get localStorage data for debugging
     * @returns {object} - localStorage contents
     */
    getStorageData() {
        const token = localStorage.getItem('optix_auth_token');
        const orgId = localStorage.getItem('optix_organization_id');
        const timestamp = localStorage.getItem('optix_auth_timestamp');
        
        return {
            token: token ? `${token.substring(0, 10)}...` : null,
            organizationId: orgId,
            timestamp: timestamp,
            hasToken: !!token
        };
    }
}

// Create a singleton instance
const authService = new AuthService();

export default authService;
