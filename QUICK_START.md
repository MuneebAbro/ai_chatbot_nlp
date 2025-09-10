# Quick Start: Chatbot API Integration

## 🚀 Current Working Endpoints

Your chatbot API is already deployed and ready for integration! Here are the endpoints you can use right now:

### 1. Standard Chat Endpoint (Ready Now)
```
POST https://bitpack-widget.vercel.app/api/chat?business=muneeb-ai
```

**Request:**
```json
{
  "message": "Hello from WhatsApp!"
}
```

**Response:**
```json
{
  "response": "Hi! I'm the Muneeb AI assistant. How can I help?",
  "business_id": "muneeb-ai",
  "session_id": "muneeb-ai_1234567890",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. Initial Message Endpoint
```
GET https://bitpack-widget.vercel.app/api/initial-message?business=muneeb-ai
```

## 🔧 n8n Integration (Current Setup)

### Step 1: WhatsApp Trigger
Set up your WhatsApp webhook in n8n to receive incoming messages.

### Step 2: Extract Data
Add a **Set** node:
```json
{
  "whatsapp_message": "{{ $json.message }}",
  "user_id": "whatsapp_{{ $json.from }}",
  "phone_number": "{{ $json.from }}",
  "session_id": "whatsapp_{{ $json.from }}_{{ $now }}"
}
```

### Step 3: Call Chatbot API
Add an **HTTP Request** node:

**Configuration:**
- **Method:** POST
- **URL:** `https://bitpack-widget.vercel.app/api/chat?business=muneeb-ai`
- **Headers:**
  ```
  Content-Type: application/json
  X-Session-Id: {{ $json.session_id }}
  ```
- **Body (JSON):**
  ```json
  {
    "message": "{{ $json.whatsapp_message }}"
  }
  ```

### Step 4: Send Response Back
Add a **WhatsApp Send** node:
- **To:** `{{ $('WhatsApp Trigger').item.json.from }}`
- **Message:** `{{ $('HTTP Request').item.json.response }}`

## 🧪 Test Your Integration

### Test with curl:
```bash
curl -X POST https://bitpack-widget.vercel.app/api/chat?business=muneeb-ai \
  -H "Content-Type: application/json" \
  -H "X-Session-Id: test_session_123" \
  -d '{
    "message": "Hello from WhatsApp! This is a test message."
  }'
```

### Test with Node.js:
```javascript
const response = await fetch('https://bitpack-widget.vercel.app/api/chat?business=muneeb-ai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Session-Id': 'test_session_123'
  },
  body: JSON.stringify({
    message: 'Hello from WhatsApp! This is a test message.'
  })
});

const data = await response.json();
console.log('Response:', data.response);
```

## 📊 Session Management

For better conversation flow, use consistent session IDs:

```javascript
// Generate session ID based on phone number
const sessionId = `whatsapp_${phoneNumber}_${Date.now()}`;

// Or use a persistent session ID for ongoing conversations
const sessionId = `whatsapp_${phoneNumber}_session_1`;
```

## 🔄 Coming Soon: Enhanced Webhook Endpoint

The enhanced webhook endpoint (`/api/webhook/{businessId}`) will be available after the next deployment. It will include:

- Better error handling
- Enhanced metadata support
- Platform-specific formatting
- Success/failure indicators

## 🎯 Next Steps

1. **Test the current API** with the curl command above
2. **Set up n8n workflow** using the standard chat endpoint
3. **Deploy your changes** to get the enhanced webhook endpoint
4. **Follow the full guide** in `INTEGRATION_GUIDE.md` for advanced features

## 🆘 Support

- **API Health Check:** `GET https://bitpack-widget.vercel.app/api/health`
- **Business Info:** `GET https://bitpack-widget.vercel.app/api/businesses`
- **Test Script:** Run `node test-integration.js` to verify all endpoints

---

**Your chatbot is ready for WhatsApp automation! 🚀**
