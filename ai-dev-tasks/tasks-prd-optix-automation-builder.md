# Task List: Optix Automation Builder

## Relevant Files

- `resources/js/helpers/authHelpers.js` - Authentication helper utilities for URL token extraction
- `resources/js/helpers/authHelpers.test.js` - Unit tests for authentication helpers
- `resources/js/services/AuthService.js` - Authentication service for token validation and storage
- `resources/js/graphql-queries/organization.graphql` - GraphQL query for organization details
- `resources/js/canvas/AuthTestCanvas.vue` - Test canvas component for auth functionality
- `resources/js/canvas/VuexAuthTestCanvas.vue` - Test canvas component for auth service functionality
- `public/auth-test.html` - Standalone HTML test page for auth token extraction
- `resources/js/canvas/AutomationBuilder.vue` - Main canvas component for the automation builder interface
- `resources/js/canvas/AutomationBuilder.test.js` - Unit tests for the main canvas component
- `resources/js/components/ChatInterface.vue` - ChatGPT-like chat interface component
- `resources/js/components/ChatInterface.test.js` - Unit tests for chat interface
- `resources/js/components/AutomationPreview.vue` - Real-time preview component for automation structure
- `resources/js/components/AutomationPreview.test.js` - Unit tests for automation preview
- `resources/js/components/MessageBubble.vue` - Individual message bubble component
- `resources/js/components/MessageBubble.test.js` - Unit tests for message bubble
- `resources/js/services/OpenAIService.js` - Service for OpenAI API integration
- `resources/js/services/OpenAIService.test.js` - Unit tests for OpenAI service
- `resources/js/services/AutomationService.js` - Service for Optix API automation operations
- `resources/js/services/AutomationService.test.js` - Unit tests for automation service
- `resources/js/services/ProgressService.js` - Service for local storage and progress management
- `resources/js/services/ProgressService.test.js` - Unit tests for progress service
- `resources/js/helpers/automationHelpers.js` - Utility functions for automation validation and formatting
- `resources/js/helpers/automationHelpers.test.js` - Unit tests for automation helpers
- `resources/js/helpers/openaiHelpers.js` - Utility functions for OpenAI function calling
- `resources/js/helpers/openaiHelpers.test.js` - Unit tests for OpenAI helpers
- `app/Http/Controllers/AutomationBuilderController.php` - Backend controller for automation operations
- `app/Http/Controllers/AutomationBuilderController.test.php` - Unit tests for controller
- `app/Services/OpenAIService.php` - PHP service for OpenAI API calls
- `app/Services/OpenAIService.test.php` - Unit tests for PHP OpenAI service
- `app/Services/AutomationValidationService.php` - Service for validating automation data
- `app/Services/AutomationValidationService.test.php` - Unit tests for validation service
- `routes/web.php` - Web routes for the automation builder
- `resources/js/router/routes.js` - Frontend routes for the automation builder
- `resources/js/graphql-queries/workflowAvailableSteps.graphql` - GraphQL query for available workflow steps
- `resources/js/graphql-queries/workflowsCommit.graphql` - GraphQL mutation for committing workflows
- `resources/js/graphql-queries/accessTemplates.graphql` - GraphQL query for access templates
- `resources/js/graphql-queries/admins.graphql` - GraphQL query for admin users
- `config/automation-builder.php` - Configuration file for automation builder settings
- `database/migrations/2024_01_01_000000_create_automation_sessions_table.php` - Migration for storing automation sessions
- `app/Models/AutomationSession.php` - Model for automation session data

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `ChatInterface.vue` and `ChatInterface.test.js` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- The existing Optix boilerplate provides UI components and authentication patterns that should be leveraged.
- GraphQL queries should follow the existing pattern in the `graphql-queries` directory.

## Tasks

- [ ] 1.0 Authentication & URL Token Handling
  - [x] 1.1 Create URL parameter extraction utility to get auth token from iframe URL
  - [x] 1.2 Implement token validation and storage in Vuex/local storage
  - [ ] 1.3 Create authentication service for Optix API calls
  - [ ] 1.4 Add error handling for invalid/missing tokens
  - [ ] 1.5 Implement token refresh mechanism if needed
  - [ ] 1.6 Add authentication state management in Vuex store

- [ ] 2.0 Chatbot Interface Implementation
  - [ ] 2.1 Create main AutomationBuilder canvas component with o-admin-container
  - [ ] 2.2 Implement ChatInterface component with message history display
  - [ ] 2.3 Create MessageBubble component for individual chat messages
  - [ ] 2.4 Add text input area with send button and enter key handling
  - [ ] 2.5 Implement real-time typing indicators and message timestamps
  - [ ] 2.6 Add scroll-to-bottom functionality for new messages
  - [ ] 2.7 Create responsive design for iframe context
  - [ ] 2.8 Add loading states and error message display
  - [ ] 2.9 Implement message formatting for code blocks and automation previews

- [ ] 3.0 OpenAI Integration & Function Calling
  - [ ] 3.1 Create OpenAIService for API communication
  - [ ] 3.2 Implement conversation context management and token tracking
  - [ ] 3.3 Create function definitions for Optix API interactions
  - [ ] 3.4 Implement function calling for workflowAvailableSteps query
  - [ ] 3.5 Add function calling for workflowsCommit mutation
  - [ ] 3.6 Create function calling for reference data queries (admins, access templates)
  - [ ] 3.7 Implement error handling for OpenAI API failures
  - [ ] 3.8 Add rate limiting and retry logic for API calls
  - [ ] 3.9 Create configuration system for OpenAI model parameters

- [ ] 4.0 Automation Building & Preview System
  - [ ] 4.1 Create AutomationPreview component for real-time automation display
  - [ ] 4.2 Implement step-by-step automation building logic
  - [ ] 4.3 Add automation schema validation using automations-schema.graphql
  - [ ] 4.4 Create automation structure visualization (triggers, conditions, delays, actions)
  - [ ] 4.5 Implement current step highlighting and progress indication
  - [ ] 4.6 Add automation data validation before API submission
  - [ ] 4.7 Create "Start again" functionality to clear current automation
  - [ ] 4.8 Implement automation creation confirmation and success handling
  - [ ] 4.9 Add preview of automation parameters and configuration

- [ ] 5.0 Progress Persistence & Error Handling
  - [ ] 5.1 Create ProgressService for local storage management
  - [ ] 5.2 Implement automatic saving of conversation and automation progress
  - [ ] 5.3 Add "Saving..." indicator with periodic updates
  - [ ] 5.4 Create progress restoration on page refresh/navigation
  - [ ] 5.5 Implement graceful error handling for API validation failures
  - [ ] 5.6 Add user-friendly error messages with actionable next steps
  - [ ] 5.7 Create retry mechanisms for failed operations
  - [ ] 5.8 Implement conversation context truncation for token management
  - [ ] 5.9 Add session timeout handling and cleanup

- [ ] 6.0 Backend Integration & API Routes
  - [ ] 6.1 Create AutomationBuilderController for backend operations
  - [ ] 6.2 Implement web routes for the automation builder canvas
  - [ ] 6.3 Add GraphQL queries for workflowAvailableSteps
  - [ ] 6.4 Create GraphQL mutation for workflowsCommit
  - [ ] 6.5 Implement reference data queries (access templates, admins)
  - [ ] 6.6 Add PHP OpenAI service for server-side AI operations
  - [ ] 6.7 Create automation validation service
  - [ ] 6.8 Implement session storage for automation progress
  - [ ] 6.9 Add API rate limiting and security measures

- [ ] 7.0 Testing & Quality Assurance
  - [ ] 7.1 Write unit tests for all Vue components
  - [ ] 7.2 Create integration tests for OpenAI API interactions
  - [ ] 7.3 Add tests for automation validation logic
  - [ ] 7.4 Implement end-to-end tests for complete automation creation flow
  - [ ] 7.5 Add tests for progress persistence and restoration
  - [ ] 7.6 Create tests for error handling scenarios
  - [ ] 7.7 Add performance tests for large conversation contexts
  - [ ] 7.8 Implement accessibility testing for the chat interface

- [ ] 8.0 Documentation & Configuration
  - [ ] 8.1 Create configuration file for automation builder settings
  - [ ] 8.2 Document OpenAI integration and function calling setup
  - [ ] 8.3 Add inline code documentation for complex logic
  - [ ] 8.4 Create user guide for the automation builder interface
  - [ ] 8.5 Document API endpoints and GraphQL queries
  - [ ] 8.6 Add deployment and environment setup instructions
  - [ ] 8.7 Create troubleshooting guide for common issues
