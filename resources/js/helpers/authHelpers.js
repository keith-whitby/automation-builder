/**
 * Authentication helper utilities for the Optix Automation Builder
 */

/**
 * Extract authentication token from URL parameters
 * @param {string} paramName - The parameter name to extract (default: 'token')
 * @returns {string|null} - The extracted token or null if not found
 */
export function extractAuthToken(paramName = 'token') {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get(paramName);
        
        if (!token) {
            console.warn(`Auth token not found in URL parameter: ${paramName}`);
            return null;
        }
        
        return token;
    } catch (error) {
        console.error('Error extracting auth token from URL:', error);
        return null;
    }
}

/**
 * Extract authentication token from URL hash parameters
 * @param {string} paramName - The parameter name to extract (default: 'token')
 * @returns {string|null} - The extracted token or null if not found
 */
export function extractAuthTokenFromHash(paramName = 'token') {
    try {
        const hash = window.location.hash.substring(1); // Remove the '#' symbol
        const urlParams = new URLSearchParams(hash);
        const token = urlParams.get(paramName);
        
        if (!token) {
            console.warn(`Auth token not found in URL hash parameter: ${paramName}`);
            return null;
        }
        
        return token;
    } catch (error) {
        console.error('Error extracting auth token from URL hash:', error);
        return null;
    }
}

/**
 * Extract authentication token from URL, trying both search params and hash
 * @param {string} paramName - The parameter name to extract (default: 'token')
 * @returns {string|null} - The extracted token or null if not found
 */
export function extractAuthTokenFromUrl(paramName = 'token') {
    // First try search parameters
    let token = extractAuthToken(paramName);
    
    // If not found, try hash parameters
    if (!token) {
        token = extractAuthTokenFromHash(paramName);
    }
    
    return token;
}

/**
 * Validate if a token has the expected format
 * @param {string} token - The token to validate
 * @returns {boolean} - True if token appears valid, false otherwise
 */
export function validateTokenFormat(token) {
    if (!token || typeof token !== 'string') {
        return false;
    }
    
    // Basic validation - token should be a non-empty string
    if (token.trim().length === 0) {
        return false;
    }
    
    // Optional: Add more specific validation based on Optix token format
    // This can be enhanced based on actual token format requirements
    
    return true;
}

/**
 * Get authentication token with validation
 * @param {string} paramName - The parameter name to extract (default: 'token')
 * @returns {object} - Object containing token and validation status
 */
export function getValidatedAuthToken(paramName = 'token') {
    const token = extractAuthTokenFromUrl(paramName);
    
    if (!token) {
        return {
            token: null,
            isValid: false,
            error: 'Token not found in URL parameters'
        };
    }
    
    const isValid = validateTokenFormat(token);
    
    return {
        token: isValid ? token : null,
        isValid,
        error: isValid ? null : 'Token format is invalid'
    };
}
