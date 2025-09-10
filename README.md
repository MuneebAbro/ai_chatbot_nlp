# Multi-Business WhatsApp Chatbot

A scalable, AI-powered WhatsApp chatbot system that can handle multiple businesses with individual knowledge bases, configurations, and personalities.

## 🚀 Features

- **Multi-Business Support**: Run chatbots for multiple businesses from a single deployment
- **AI-Powered Responses**: Uses Groq API with Llama models for natural conversations
- **Knowledge Base Integration**: RAG (Retrieval Augmented Generation) with Supabase
- **Customizable Personalities**: Each business can have unique chatbot personalities
- **Business Hours Support**: Automatic out-of-hours responses
- **Message Filtering**: Control which chats and contacts the bot responds to
- **Session Management**: Maintains conversation context per user
- **Caching System**: Optimized performance with intelligent caching
- **Admin Dashboard**: Debug endpoints for monitoring and management

## 📁 Project Structure

```
multi-business-whatsapp-chatbot/
├── config/
│   ├── app.js              # Application configuration
│   └── database.js         # Database connection setup
├── services/
│   ├── BusinessService.js  # Business data management
│   ├── AIService.js        # AI response generation
│   └── RAGService.js       # Knowledge retrieval system
├── whatsapp-sessions/      # WhatsApp session storage
├── logs/                   # Application logs
├── server.js               # Main API server
├── WhatsAppClient.js       # WhatsApp client manager
├── package.json
├── .env.example
└── README.md
```

## 🛠️ Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Groq API key (optional, for AI responses)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd multi-business-whatsapp-chatbot
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with only the required settings for the web chatbot:

```env
# Server
PORT=3002
HOST=0.0.0.0
NODE_ENV=development
SERVER_URL=http://localhost:3002
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002

# Database (required)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# AI (optional but recommended for smart replies)
GROQ_API_KEY=your_groq_api_key
# Optional tuning
# GROQ_MODEL=llama3-70b-8192
# MAX_TOKENS=200
# TEMPERATURE=0.8
# TOP_P=0.9

# RAG (optional tuning)
# RAG_TOP_K=5
# RAG_SIMILARITY_THRESHOLD=0.2
# RAG_MAX_CONTEXT_LENGTH=2000

# Cache (optional tuning)
# CACHE_TTL=300000
# CACHE_MAX_SIZE=100
```

### 3. Database Setup

Create these tables in your Supabase database:

#### Businesses Table
```sql
CREATE TABLE businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  specialization TEXT,
  location TEXT,
  description TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  hours TEXT,
  website TEXT,
  keywords TEXT[],
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Knowledge Base Table
```sql
CREATE TABLE knowledge_base (
  id SERIAL PRIMARY KEY,
  business_id TEXT REFERENCES businesses(id),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Usage

### Start the API Server

```bash
npm start
```

The server will run on `http://localhost:3002`

### Start WhatsApp Clients

```bash
npm run whatsapp
```

Scan the QR codes for each business to authenticate.

### Development Mode

```bash
# API Server with auto-reload
npm run dev

# WhatsApp clients with auto-reload
npm run whatsapp:dev
```

## 📊 API Endpoints

### Core Endpoints

- `POST /api/chat` - Send message to chatbot
- `POST /api/webhook/{businessId}` - **NEW**: Webhook endpoint for external integrations (n8n, etc.)
- `GET /api/health` - Health check and system status
- `GET /api/initial-message` - Get welcome message for business
- `GET /api/businesses` - List all active businesses

### Admin Endpoints

- `GET /api/debug/knowledge-base` - View knowledge base entries
- `POST /api/debug/test-rag` - Test knowledge retrieval
- `GET /api/debug/stats` - System statistics
- `POST /api/admin/cache/clear` - Clear all caches

### Example Usage

```javascript
// Send message to chatbot
const response = await fetch('http://localhost:3002/api/chat?business=your-business-id', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello!' })
});

const data = await response.json();
console.log(data.response); // AI response
```

### External Integration (n8n, Zapier, etc.)

```javascript
// Webhook endpoint for external tools
const response = await fetch('https://bitpack-widget.vercel.app/api/webhook/your-business-id', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Hello from WhatsApp!',
    user_id: 'whatsapp_123456789',
    platform: 'whatsapp',
    session_id: 'whatsapp_123456789_session_1',
    metadata: {
      phone_number: '+1234567890',
      user_name: 'John Doe'
    }
  })
});

const data = await response.json();
console.log(data.response); // AI response with enhanced metadata
```

## 🏢 Multi-Business Configuration

### Adding a New Business

1. **Insert business data into database:**

```sql
INSERT INTO businesses (id, name, type, location, config) VALUES (
  'coffee-shop',
  'Amazing Coffee Shop',
  'restaurant',
  'Downtown',
  '{
    "initial_message": "hey! welcome to amazing coffee ☕",
    "system_prompt": "you run a cool coffee shop...",
    "theme_color": "#8B4513"
  }'
);
```

2. **Add knowledge base entries:**

```sql
INSERT INTO knowledge_base (business_id, question, answer, category, priority) VALUES 
('coffee-shop', 'What are your hours?', 'We''re open 7am-9pm Monday to Sunday!', 'hours', 10),
('coffee-shop', 'What coffee do you serve?', 'We serve amazing artisan coffee, espresso, cappuccino, and more!', 'menu', 8);
```

3. **Update environment variables:**

```env
BUSINESS_IDS=existing-business,coffee-shop
```

4. **Restart the application**

### Business Configuration Options

Each business can have unique settings in the `config` JSONB field:

```json
{
  "initial_message": "Custom welcome message",
  "system_prompt": "Custom AI personality instructions",
  "theme_color": "#25d366",
  "show_suggestions": true,
  "max_response_length": 200
}
```

## 🎨 Customization

### AI Personality

Customize the chatbot personality for each business by updating the `system_prompt` in the business config:

```json
{
  "system_prompt": "You are a friendly barista at a hipster coffee shop. Use coffee puns and be enthusiastic about coffee. Keep responses short and casual."
}
```

### WhatsApp Behavior

Configure WhatsApp client behavior in your `.env`:

```env
# Only reply to saved contacts
ONLY_SAVED_CONTACTS=true

# Enable group chats
ENABLE_GROUPS=true

# Business hours
BUSINESS_HOURS_ENABLED=true
BUSINESS_START_HOUR=09:00
BUSINESS_END_HOUR=17:00
```

## 🔧 Troubleshooting

### Common Issues

1. **WhatsApp QR Code Not Scanning**
   - Ensure Puppeteer is properly installed
   - Try running in non-headless mode: `PUPPETEER_HEADLESS=false`

2. **Database Connection Errors**
   - Verify Supabase URL and key in `.env`
   - Check if tables exist and have correct structure

3. **AI Responses Not Working**
   - Verify Groq API key is valid
   - Check API rate limits

4. **Cache Issues**
   - Clear cache: `curl -X POST http://localhost:3002/api/admin/cache/clear`

### Debug Mode

Enable detailed logging:

```bash
LOG_LEVEL=debug npm start
```

### Test Connections

```bash
npm run test
```

## 🔗 External Integrations

### n8n WhatsApp Automation

This chatbot can be easily integrated with n8n for WhatsApp automation. See the complete guide in `INTEGRATION_GUIDE.md`.

**Quick Setup:**
1. Use the webhook endpoint: `POST /api/webhook/{businessId}`
2. Configure n8n HTTP Request node to call the chatbot
3. Send responses back to WhatsApp

**Test your integration:**
```bash
node test-integration.js
```

### Supported Platforms

- **n8n**: Full workflow automation
- **Zapier**: Connect with 5000+ apps
- **Make.com**: Visual automation platform
- **Custom Webhooks**: Any HTTP-capable system

## 🚢 Deployment

### Railway

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3002
CMD ["npm", "start"]
```

### Heroku

```bash
heroku create your-app-name
heroku config:set SUPABASE_URL=your-url
heroku config:set SUPABASE_ANON_KEY=your-key
heroku config:set GROQ_API_KEY=your-key
git push heroku main
```

## 📈 Monitoring

### Health Check

```bash
curl http://localhost:3002/api/health
```

### System Stats

```bash
curl http://localhost:3002/api/debug/stats
```

### Active Sessions

```bash
curl http://localhost:3002/api/admin/sessions
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

---

**Built with ❤️ for multi-business automation**