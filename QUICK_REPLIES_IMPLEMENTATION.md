# Quick Reply Buttons Implementation

## Overview

This implementation adds quick reply buttons to the Optix Automation Builder chat interface. The buttons are defined by the OpenAI prompt and appear underneath assistant messages to provide users with suggested next actions.

## Key Features

### 1. Structured Response Format
- Uses OpenAI's Responses API with strict JSON schema
- Response includes `display_text` and `ui_suggestions` array
- Each suggestion has `id`, `label`, `payload`, `variant`, and optional `tool_call`

### 2. Button Variants
- **Primary**: Black background, white text (default)
- **Secondary**: Light gray background, dark text
- **Danger**: Red background, white text

### 3. Two Types of Quick Replies
- **Payload-based**: Sends the payload as a user message
- **Tool call-based**: Executes a specific function call

## Implementation Details

### Files Modified

#### 1. `resources/js/services/OpenAIService.js`
- Updated `sendMessage()` method to use structured JSON schema
- Updated `sendFunctionResult()` method to use structured format
- Added `response_format` with `assistant_reply` schema
- Handles parsing of structured responses from OpenAI

#### 2. `resources/js/components/MessageBubble.vue`
- Added quick reply buttons section
- Added `handleQuickReply()` method to emit events
- Added `getButtonVariant()` method for styling
- Added CSS styles for button variants

#### 3. `resources/js/components/ChatInterface.vue`
- Added `@quick-reply` event handler
- Added `handleQuickReply()` method to route events
- Routes tool calls to `@tool-call` event
- Routes payloads to `sendMessage()`

#### 4. `resources/js/canvas/AutomationBuilder.vue`
- Updated `addMessage()` to accept `ui_suggestions`
- Added `@tool-call` event handler
- Added `handleToolCall()` method
- Updated message handling to use structured format

### JSON Schema

The OpenAI prompt uses this strict schema with the Responses API format:

```json
{
  "text": {
    "format": {
      "type": "json_schema",
      "json_schema": {
        "name": "assistant_reply",
        "strict": true,
        "schema": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "display_text": { "type": "string" },
            "ui_suggestions": {
              "type": "array",
              "maxItems": 3,
              "items": {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                  "id": { "type": "string" },
                  "label": { "type": "string" },
                  "payload": { "type": "string" },
                  "variant": { "type": "string", "enum": ["primary","secondary","danger"] },
                  "tool_call": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                      "name": { "type": "string" },
                      "arguments": { "type": "object" }
                    },
                    "required": ["name","arguments"]
                  }
                },
                "required": ["id","label","payload"]
              }
            }
          },
          "required": ["display_text","ui_suggestions"]
        }
      }
    }
  }
}
```

## Usage

### For Users
1. Send a message to the AI assistant
2. The assistant responds with text and optional quick reply buttons
3. Click a button to either:
   - Send a predefined message (payload-based)
   - Execute a specific action (tool call-based)

### For Developers
The system automatically handles:
- Button rendering based on `ui_suggestions`
- Event routing for different button types
- Tool call execution and response handling
- Styling based on button variants

## Testing

A test file is available at `public/test-quick-replies.html` that demonstrates:
- Button styling and variants
- Event handling
- Tool call simulation

## OpenAI Prompt Requirements

The OpenAI prompt must be configured to:
1. Use the `assistant_reply` schema
2. Return `display_text` for the main message
3. Return `ui_suggestions` array with up to 3 buttons
4. Include appropriate `variant` values
5. Include `tool_call` when function execution is needed

## Example Response

```json
{
  "display_text": "I can help you create automations! What would you like to do?",
  "ui_suggestions": [
    {
      "id": "show_triggers",
      "label": "Show available triggers",
      "payload": "What triggers are available?",
      "variant": "primary"
    },
    {
      "id": "get_triggers",
      "label": "Get triggers",
      "payload": "",
      "variant": "secondary",
      "tool_call": {
        "name": "get_available_triggers",
        "arguments": {}
      }
    },
    {
      "id": "start_over",
      "label": "Start over",
      "payload": "Let's start over",
      "variant": "danger"
    }
  ]
}
```

## Future Enhancements

1. **Button Animations**: Add hover and click animations
2. **Custom Variants**: Support for more button styles
3. **Button Groups**: Support for grouped buttons
4. **Dynamic Loading**: Show loading state during tool calls
5. **Accessibility**: Add ARIA labels and keyboard navigation
