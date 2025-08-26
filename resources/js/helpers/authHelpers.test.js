import {
    extractAuthToken,
    extractAuthTokenFromHash,
    extractAuthTokenFromUrl,
    validateTokenFormat,
    getValidatedAuthToken
} from './authHelpers';

// Mock window.location
const mockLocation = (search, hash = '') => {
    delete window.location;
    window.location = {
        search,
        hash,
        protocol: 'https:',
        host: 'example.com',
        port: '443'
    };
};

describe('authHelpers', () => {
    beforeEach(() => {
        // Clear any console warnings/errors before each test
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('extractAuthToken', () => {
        it('should extract token from search parameters', () => {
            mockLocation('?token=abc123&other=value');
            const token = extractAuthToken();
            expect(token).toBe('abc123');
        });

        it('should extract token with custom parameter name', () => {
            mockLocation('?auth_token=xyz789&other=value');
            const token = extractAuthToken('auth_token');
            expect(token).toBe('xyz789');
        });

        it('should return null when token not found', () => {
            mockLocation('?other=value&another=param');
            const token = extractAuthToken();
            expect(token).toBeNull();
            expect(console.warn).toHaveBeenCalledWith('Auth token not found in URL parameter: token');
        });

        it('should handle empty search parameters', () => {
            mockLocation('');
            const token = extractAuthToken();
            expect(token).toBeNull();
        });

        it('should handle malformed URL parameters gracefully', () => {
            mockLocation('?invalid=param&token=');
            const token = extractAuthToken();
            expect(token).toBe('');
        });
    });

    describe('extractAuthTokenFromHash', () => {
        it('should extract token from hash parameters', () => {
            mockLocation('', '#token=abc123&other=value');
            const token = extractAuthTokenFromHash();
            expect(token).toBe('abc123');
        });

        it('should extract token with custom parameter name from hash', () => {
            mockLocation('', '#auth_token=xyz789&other=value');
            const token = extractAuthTokenFromHash('auth_token');
            expect(token).toBe('xyz789');
        });

        it('should return null when token not found in hash', () => {
            mockLocation('', '#other=value&another=param');
            const token = extractAuthTokenFromHash();
            expect(token).toBeNull();
            expect(console.warn).toHaveBeenCalledWith('Auth token not found in URL hash parameter: token');
        });

        it('should handle empty hash', () => {
            mockLocation('', '');
            const token = extractAuthTokenFromHash();
            expect(token).toBeNull();
        });
    });

    describe('extractAuthTokenFromUrl', () => {
        it('should extract token from search parameters first', () => {
            mockLocation('?token=search123', '#token=hash456');
            const token = extractAuthTokenFromUrl();
            expect(token).toBe('search123');
        });

        it('should fall back to hash parameters when not in search', () => {
            mockLocation('?other=value', '#token=hash456');
            const token = extractAuthTokenFromUrl();
            expect(token).toBe('hash456');
        });

        it('should return null when token not found in either location', () => {
            mockLocation('?other=value', '#other=hash');
            const token = extractAuthTokenFromUrl();
            expect(token).toBeNull();
        });
    });

    describe('validateTokenFormat', () => {
        it('should validate a proper token', () => {
            expect(validateTokenFormat('abc123')).toBe(true);
            expect(validateTokenFormat('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')).toBe(true);
        });

        it('should reject null or undefined tokens', () => {
            expect(validateTokenFormat(null)).toBe(false);
            expect(validateTokenFormat(undefined)).toBe(false);
        });

        it('should reject empty strings', () => {
            expect(validateTokenFormat('')).toBe(false);
            expect(validateTokenFormat('   ')).toBe(false);
        });

        it('should reject non-string values', () => {
            expect(validateTokenFormat(123)).toBe(false);
            expect(validateTokenFormat({})).toBe(false);
            expect(validateTokenFormat([])).toBe(false);
        });
    });

    describe('getValidatedAuthToken', () => {
        it('should return valid token with success status', () => {
            mockLocation('?token=abc123');
            const result = getValidatedAuthToken();
            expect(result).toEqual({
                token: 'abc123',
                isValid: true,
                error: null
            });
        });

        it('should return error when token not found', () => {
            mockLocation('?other=value');
            const result = getValidatedAuthToken();
            expect(result).toEqual({
                token: null,
                isValid: false,
                error: 'Token not found in URL parameters'
            });
        });

        it('should return error when token format is invalid', () => {
            mockLocation('?token=');
            const result = getValidatedAuthToken();
            expect(result).toEqual({
                token: null,
                isValid: false,
                error: 'Token format is invalid'
            });
        });

        it('should work with custom parameter name', () => {
            mockLocation('?auth_token=xyz789');
            const result = getValidatedAuthToken('auth_token');
            expect(result).toEqual({
                token: 'xyz789',
                isValid: true,
                error: null
            });
        });
    });
});
