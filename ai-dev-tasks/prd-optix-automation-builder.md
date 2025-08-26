# Product Requirements Document: Optix Automation Builder

## Introduction/Overview

The Optix Automation Builder is a chatbot-powered application that runs within the Optix platform as an iframe. It helps non-technical Optix admins create complex automations (workflows) through natural language conversation, guided by an AI assistant that understands automation best practices and the Optix API schema.

The app solves the problem of admins struggling to understand automation possibilities and best practices, such as adding conditions after delays to validate status before proceeding with actions. The chatbot will guide users step-by-step through automation creation, ensuring all API validation rules are satisfied before committing the workflow.

## Goals

1. **Simplify Automation Creation**: Enable non-technical admins to create complex automations without learning technical details
2. **Guide Best Practices**: Ensure automations follow proper patterns (e.g., conditions after delays)
3. **Prevent Validation Errors**: Create automations that pass all Optix API validation rules
4. **Improve User Experience**: Provide a ChatGPT-like interface that feels intuitive and conversational
5. **Maintain Progress**: Allow users to continue where they left off if they navigate away

## User Stories

1. **Primary User Story**: "As an Optix admin, I want to describe a workflow in plain English so that I can quickly create complex automations without learning the technical details"

2. **Clarification User Story**: "As an Optix admin, I want the chatbot to ask clarifying questions so that I can ensure the automation meets my exact requirements"

3. **Validation User Story**: "As an admin, I am guided through the process so the automation is created without validation errors"

4. **Progress User Story**: "As an admin, I want my progress saved automatically so I don't lose work if I refresh or navigate away"

5. **Restart User Story**: "As an admin, I want to start over if I get confused, so I can begin fresh without losing my place"

## Functional Requirements

1. **Authentication Integration**: The app must extract and use the auth token from the URL parameters to authenticate with the Optix API

2. **Chatbot Interface**: The app must provide a ChatGPT-like interface with:
   - Message history display
   - Text input for user responses
   - Real-time typing indicators
   - Message timestamps

3. **OpenAI Integration**: The app must integrate with OpenAI API using:
   - Configurable model selection (defined in OpenAI dashboard)
   - Function calling capabilities for API interactions
   - Conversation context management
   - Error handling for API failures

4. **Automation Schema Access**: The chatbot must have access to the full automation schema to understand:
   - Available trigger types
   - Valid condition operations
   - Action types and their parameters
   - Required vs optional fields

5. **Step-by-Step Guidance**: The chatbot must guide users through automation creation by:
   - Asking for the automation goal in plain English
   - Breaking down complex requirements into individual steps
   - Asking clarifying questions for ambiguous requirements
   - Suggesting best practices (e.g., conditions after delays)

6. **Real-Time Preview**: The app must display a preview of the automation being created, showing:
   - Current step being configured
   - Completed steps
   - Next steps to be configured
   - Overall automation structure

7. **API Integration Functions**: The chatbot must have access to functions for:
   - Fetching available triggers (`workflowAvailableSteps`)
   - Validating automation data against schema
   - Creating the final automation (`workflowsCommit`)
   - Fetching reference data (access templates, admins, etc.)

8. **Progress Persistence**: The app must:
   - Save conversation and automation progress locally
   - Display "Saving..." indicator periodically
   - Restore progress on page refresh/navigation
   - Provide "Start again" option to clear progress

9. **Error Handling**: The app must handle errors gracefully by:
   - Catching API validation errors
   - Asking user to clarify when requests are unclear
   - Providing helpful error messages
   - Allowing users to retry or modify their input

10. **Validation Compliance**: The app must ensure all created automations:
    - Follow the `automations-schema.graphql` structure
    - Include all required fields
    - Use valid enum values
    - Pass API validation before submission

## Non-Goals (Out of Scope)

1. **Editing Existing Automations**: This MVP will only create new automations, not edit existing ones
2. **Complex Workflow Templates**: No pre-built templates or recipe system in this version
3. **Bulk Operations**: No support for creating multiple automations simultaneously
4. **Advanced Analytics**: No reporting or analytics on automation usage
5. **Custom Function Definitions**: No ability for users to define custom functions or logic

## Design Considerations

### UI/UX Requirements
- **ChatGPT-like Interface**: Clean, modern chat interface with message bubbles
- **Responsive Design**: Must work well in iframe context with various screen sizes
- **Loading States**: Clear indicators for API calls and processing
- **Error States**: Friendly error messages with actionable next steps
- **Progress Indicators**: Visual feedback for automation building progress

### Visual Elements
- **Message History**: Scrollable chat area with user and bot messages
- **Input Area**: Text input with send button
- **Preview Panel**: Side panel or expandable section showing automation structure
- **Status Indicators**: "Saving...", "Processing...", "Validating..." states
- **Action Buttons**: "Start again", "Save progress", "Create automation"

## Technical Considerations

### Tech Stack
- **Backend**: Laravel 9 with PHP 8.1 (following boilerplate)
- **Frontend**: Vue.js with Vuetify 2.6 (following boilerplate)
- **API Integration**: Optix PHP Client 2 for GraphQL queries
- **AI Integration**: OpenAI API with function calling
- **Storage**: Local storage for progress persistence

### Key Dependencies
- Optix API authentication and GraphQL queries
- OpenAI API for chatbot intelligence
- Local storage for conversation persistence
- Iframe communication with parent Optix platform

### API Endpoints Required
- `workflowAvailableSteps` - Get available automation components
- `workflowsCommit` - Create the final automation
- Additional queries for reference data (admins, access templates, etc.)

### Security Considerations
- Secure handling of auth tokens
- Input sanitization for user messages
- API rate limiting for OpenAI calls
- Validation of all automation data before submission

## Success Metrics

1. **Creation Success Rate**: 95% of automation creation attempts result in valid automations
2. **User Satisfaction**: Users can create automations without technical assistance
3. **Error Reduction**: 80% reduction in automation validation errors
4. **Completion Rate**: 90% of started automation creations are completed
5. **Time to Create**: Average automation creation time under 10 minutes

## Open Questions

1. **Token Management**: How should we handle OpenAI API token limits and conversation context management?
2. **Schema Updates**: How will the app handle updates to the automation schema?
3. **Rate Limiting**: What are the appropriate rate limits for OpenAI API calls?
4. **Error Recovery**: What specific error scenarios should trigger different recovery flows?
5. **Preview Detail Level**: How detailed should the real-time preview be (basic structure vs. full configuration)?
6. **Function Definitions**: What specific functions should be available to the OpenAI prompt for API interactions?
7. **Conversation Persistence**: Should conversations be stored server-side or only client-side?
8. **Model Configuration**: What specific OpenAI model parameters should be used for optimal performance?

## Implementation Phases

### Phase 1: Core Infrastructure
- Basic iframe app setup with authentication
- Chatbot interface implementation
- OpenAI integration with basic function calling
- Local storage for progress persistence

### Phase 2: Automation Building
- Step-by-step automation creation flow
- Real-time preview implementation
- API integration for validation and creation
- Error handling and recovery

### Phase 3: Polish and Optimization
- Enhanced UI/UX improvements
- Performance optimization
- Advanced error handling
- User testing and refinement
