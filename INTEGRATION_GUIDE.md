# Chatbot API Integration Guide

This guide shows how to integrate your chatbot API with external automation tools like n8n for WhatsApp automation.

## API Endpoints

### 1. Chat Endpoint (Standard)
```
POST /api/chat?business={businessId}
```

**Request:**
```json
{
  "message": "Hello, how can you help me?"
}
```

**Response:**
```json
{
  "response": "Hi! I'm here to help you with any questions about our services.",
  "business_id": "your_business_id",
  "session_id": "session_123",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. Webhook Endpoint (Recommended for External Tools)
```
POST /api/webhook/{businessId}
```

**Request:**
```json
{
  "message": "Hello from WhatsApp!",
  "user_id": "whatsapp_123456789",
  "platform": "whatsapp",
  "session_id": "whatsapp_123456789_session_1",
  "metadata": {
    "phone_number": "+1234567890",
    "user_name": "John Doe"
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "Hi John! Thanks for reaching out on WhatsApp. How can I assist you today?",
  "business_id": "your_business_id",
  "session_id": "whatsapp_123456789_session_1",
  "user_id": "whatsapp_123456789",
  "platform": "whatsapp",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "metadata": {
    "phone_number": "+1234567890",
    "user_name": "John Doe",
    "suggestions": ["Tell me about your services", "What are your prices?", "Contact support"],
    "confidence": 0.95,
    "processing_time": 1.2
  }
}
```

## n8n Integration for WhatsApp Automation

### Step 1: Set up WhatsApp Trigger
1. Add a **WhatsApp Trigger** node in n8n
2. Configure your WhatsApp Business API credentials
3. Set up webhook URL for incoming messages

### Step 2: Extract Message Data
Add a **Set** node to prepare the data:

```json
{
  "whatsapp_message": "{{ $json.message }}",
  "user_id": "whatsapp_{{ $json.from }}",
  "phone_number": "{{ $json.from }}",
  "user_name": "{{ $json.sender?.name || 'Unknown' }}",
  "session_id": "whatsapp_{{ $json.from }}_{{ $now }}"
}
```

### Step 3: Call Chatbot API
Add an **HTTP Request** node:

**Configuration:**
- **Method:** POST
- **URL:** `https://bitpack-widget.vercel.app/api/webhook/your_business_id`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (JSON):**
  ```json
  {
    "message": "{{ $json.whatsapp_message }}",
    "user_id": "{{ $json.user_id }}",
    "platform": "whatsapp",
    "session_id": "{{ $json.session_id }}",
    "metadata": {
      "phone_number": "{{ $json.phone_number }}",
      "user_name": "{{ $json.user_name }}"
    }
  }
  ```

### Step 4: Send Response Back to WhatsApp
Add a **WhatsApp Send** node:

**Configuration:**
- **To:** `{{ $('WhatsApp Trigger').item.json.from }}`
- **Message:** `{{ $('HTTP Request').item.json.response }}`

## Complete n8n Workflow Example

```
WhatsApp Trigger → Set (Extract Data) → HTTP Request (Chatbot) → WhatsApp Send
```

### Workflow JSON Export:
```json
{
  "name": "WhatsApp Chatbot Automation",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "webhook",
        "responseMode": "responseNode"
      },
      "id": "whatsapp-trigger",
      "name": "WhatsApp Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "values": {
          "string": [
            {
              "name": "whatsapp_message",
              "value": "={{ $json.message }}"
            },
            {
              "name": "user_id",
              "value": "=whatsapp_{{ $json.from }}"
            },
            {
              "name": "phone_number",
              "value": "={{ $json.from }}"
            },
            {
              "name": "session_id",
              "value": "=whatsapp_{{ $json.from }}_{{ $now }}"
            }
          ]
        }
      },
      "id": "extract-data",
      "name": "Extract Data",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "url": "https://bitpack-widget.vercel.app/api/webhook/your_business_id",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "message",
              "value": "={{ $json.whatsapp_message }}"
            },
            {
              "name": "user_id",
              "value": "={{ $json.user_id }}"
            },
            {
              "name": "platform",
              "value": "whatsapp"
            },
            {
              "name": "session_id",
              "value": "={{ $json.session_id }}"
            }
          ]
        }
      },
      "id": "chatbot-api",
      "name": "Call Chatbot API",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [680, 300]
    },
    {
      "parameters": {
        "to": "={{ $('WhatsApp Trigger').item.json.from }}",
        "message": "={{ $('Call Chatbot API').item.json.response }}"
      },
      "id": "whatsapp-send",
      "name": "Send WhatsApp Response",
      "type": "n8n-nodes-base.whatsApp",
      "typeVersion": 1,
      "position": [900, 300]
    }
  ],
  "connections": {
    "WhatsApp Trigger": {
      "main": [
        [
          {
            "node": "Extract Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Extract Data": {
      "main": [
        [
          {
            "node": "Call Chatbot API",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Call Chatbot API": {
      "main": [
        [
          {
            "node": "Send WhatsApp Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## Advanced Features

### 1. Session Management
The API automatically manages conversation context using session IDs. For WhatsApp, you can create persistent sessions:

```javascript
// Generate session ID based on phone number
const sessionId = `whatsapp_${phoneNumber}_${Date.now()}`;
```

### 2. Error Handling
Add error handling in n8n:

```json
{
  "parameters": {
    "conditions": {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "strict"
      },
      "conditions": [
        {
          "id": "condition1",
          "leftValue": "={{ $json.success }}",
          "rightValue": false,
          "operator": {
            "type": "boolean",
            "operation": "equal"
          }
        }
      ],
      "combinator": "and"
    }
  }
}
```

### 3. Rate Limiting
The API includes built-in rate limiting. For high-volume usage, consider:
- Implementing request queuing
- Using multiple business IDs for load distribution
- Adding retry logic with exponential backoff

### 4. Analytics and Monitoring
Track usage with the metadata field:

```json
{
  "metadata": {
    "campaign": "whatsapp_automation",
    "source": "n8n_workflow",
    "user_segment": "premium",
    "conversation_start": "2024-01-01T12:00:00.000Z"
  }
}
```

## Testing Your Integration

### 1. Test with curl
```bash
curl -X POST https://bitpack-widget.vercel.app/api/webhook/your_business_id \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, this is a test message",
    "user_id": "test_user_123",
    "platform": "test",
    "metadata": {
      "test": true
    }
  }'
```

### 2. Test in n8n
1. Use the **Manual Trigger** node for testing
2. Set up test data similar to WhatsApp webhook format
3. Verify the response format matches your expectations

## Security Considerations

1. **API Key Protection**: Consider adding API key authentication for production use
2. **Input Validation**: The API validates message length and content
3. **Rate Limiting**: Implement appropriate rate limiting for your use case
4. **Session Security**: Use secure session ID generation for sensitive applications

## Troubleshooting

### Common Issues:

1. **404 Business Not Found**: Check your business ID is correct
2. **500 Internal Server Error**: Check API logs for detailed error messages
3. **CORS Issues**: The API supports CORS for web applications
4. **Session Issues**: Ensure session IDs are consistent for conversation continuity

### Debug Endpoints:
- `GET /api/health` - Check API status
- `GET /api/debug/stats` - View system statistics
- `GET /api/businesses` - List available businesses

## Support

For integration support:
1. Check the API health endpoint first
2. Review the debug endpoints for system status
3. Check server logs for detailed error information
4. Test with simple curl commands before complex integrations
