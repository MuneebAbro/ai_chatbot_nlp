const express = require('express');
const cors = require('cors');

// Import configurations and services
const appConfig = require('./config/app');
const databaseConfig = require('./config/database');
const businessService = require('./services/BusinessService');
const aiService = require('./services/AIService');
const ragService = require('./services/RAGService');

class ChatbotServer {
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
        
        console.log('🤖 ChatBot Server initialized');
    }

    setupMiddleware() {
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        // CORS: allow all origins for widget usage, with optional restrictions
        this.app.use(cors({
            origin: (origin, callback) => {
                const raw = process.env.ALLOWED_ORIGINS || '';
                const allowed = raw.split(',').map(s => s.trim()).filter(Boolean);
                
                // No Origin header (same-origin or curl) → allow
                if (!origin) return callback(null, true);
                
                // Allow file:// (browsers send Origin: null) for local testing
                if (origin === 'null') return callback(null, true);
                
                // If no specific origins configured, allow all (for widget usage)
                if (allowed.length === 0) return callback(null, true);
                
                // Check against configured allowed origins
                if (allowed.includes(origin)) return callback(null, true);
                
                // Allow all origins for widget functionality (chat and initial message endpoints)
                return callback(null, true);
            },
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id'],
            credentials: false // Set to false for widget usage across domains
        }));

        // Request logging
        if (appConfig.isDevelopment()) {
            this.app.use((req, res, next) => {
                console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
                next();
            });
        }
    }

    setupRoutes() {
        // Health check
        this.app.get('/api/health', this.healthCheck.bind(this));
        
        // Main chat endpoint
        this.app.post('/api/chat', this.handleChat.bind(this));
        
        // Initial message endpoint
        this.app.get('/api/initial-message', this.getInitialMessage.bind(this));
        
        // Business management endpoints
        this.app.get('/api/businesses', this.getAllBusinesses.bind(this));
        this.app.get('/api/business/:id', this.getBusinessDetails.bind(this));
        this.app.post('/api/business/:id/cache/clear', this.clearBusinessCache.bind(this));
        
        // Debug endpoints
        this.app.get('/api/debug/knowledge-base', this.debugKnowledgeBase.bind(this));
        this.app.post('/api/debug/test-rag', this.testRAG.bind(this));
        this.app.get('/api/debug/stats', this.getDebugStats.bind(this));
        
        // Admin endpoints
        this.app.post('/api/admin/cache/clear', this.clearAllCache.bind(this));
        this.app.get('/api/admin/sessions', this.getActiveSessions.bind(this));

        // Widget endpoints
        this.app.get('/widget/chatbot.js', this.serveWidgetScript.bind(this));
        this.app.get('/widget/embed/:businessId', this.serveEmbedScript.bind(this));

        // Webhook endpoint for external integrations (n8n, etc.)
        this.app.post('/api/webhook', this.handleWebhook.bind(this));
        this.app.post('/api/webhook/:businessId', this.handleWebhook.bind(this));
        
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({ 
                error: 'Endpoint not found',
                available_endpoints: [
                    'GET /api/health',
                    'POST /api/chat',
                    'GET /api/initial-message',
                    'GET /api/businesses',
                    'GET /widget/chatbot.js',
                    'GET /widget/embed/:businessId'
                ]
            });
        });
    }

    async serveWidgetScript(req, res) {
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Try to serve from public directory first
        const publicScriptPath = path.join(__dirname, 'public', 'chatbot-widget.js');
        
        if (fs.existsSync(publicScriptPath)) {
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.sendFile(publicScriptPath);
        } else {
            // Fallback - serve inline widget script
            const widgetScript = this.getInlineWidgetScript();
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('Cache-Control', 'no-cache');
            res.send(widgetScript);
        }
    } catch (error) {
        console.error('❌ Widget script error:', error);
        res.status(500).json({ error: 'Failed to serve widget script' });
    }
}

getInlineWidgetScript() {
    // Basic inline widget script as fallback
    return `
// Chatbot Widget Fallback Script
(function() {
    console.log('Loading chatbot widget...');
    
    // Create a simple fallback widget
    const widget = document.createElement('div');
    widget.innerHTML = \`
        <div style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
            <div style="background: #007bff; color: white; padding: 15px; border-radius: 50px; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.2);" onclick="alert('Chatbot widget loaded! Please add chatbot-widget.js to public/ directory for full functionality.')">
                💬 Chat
            </div>
        </div>
    \`;
    document.body.appendChild(widget);
    
    console.warn('Chatbot widget fallback loaded. Add chatbot-widget.js to public/ directory for full functionality.');
})();
    `;
}

    async serveEmbedScript(req, res) {
    try {
        const businessId = req.params.businessId;
        const color = req.query.color || req.query.theme || req.query.primary || '';
        const secondary = req.query.secondary || req.query.text || req.query.icon || '';
        const position = req.query.position || 'bottom-right';
        
        if (!businessId) {
            return res.status(400).json({ error: 'Business ID is required' });
        }

        const embedScript = this.generateEmbedScript(businessId, color, secondary, position);
        
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.send(embedScript);
        
    } catch (error) {
        console.error('❌ Embed script error:', error);
        res.status(500).json({ error: 'Failed to serve embed script' });
    }
}

generateEmbedScript(businessId, color = '', secondary = '', position = 'bottom-right') {
    const serverUrl = process.env.SERVER_URL || 'https://bitpack-widget.vercel.app';
    
    const widgetVersion = process.env.WIDGET_VERSION || '1';
    return `
// Chatbot Embed Loader for Business: ${businessId}
(function(){
  var SERVER_URL='${serverUrl}';
  var BUSINESS_ID='${businessId}';
  var COLOR='${color.replace(/[^#a-zA-Z0-9]/g, '')}';
  var SECONDARY='${secondary.replace(/[^#a-zA-Z0-9]/g, '')}';
  var POSITION='${position}';
  
  function init(){
    if (window.initChatbotWidget){
      window.initChatbotWidget({ 
        apiUrl: SERVER_URL + '/api', 
        businessId: BUSINESS_ID, 
        color: COLOR || undefined,
        secondary: SECONDARY || undefined,
        position: POSITION
      });
      return;
    }
    var s=document.createElement('script');
    s.src=SERVER_URL + '/widget/chatbot.js?v=${widgetVersion}';
    s.async=true;
    s.onload=function(){
      if (window.initChatbotWidget){
        window.initChatbotWidget({ 
          apiUrl: SERVER_URL + '/api', 
          businessId: BUSINESS_ID, 
          color: COLOR || undefined,
          secondary: SECONDARY || undefined,
          position: POSITION
        });
      }
    };
    document.head.appendChild(s);
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
    `;
}

    setupErrorHandling() {
        this.app.use((error, req, res, next) => {
            console.error('❌ Server error:', error);
            
            res.status(error.status || 500).json({
                error: appConfig.isDevelopment() ? error.message : 'Internal server error',
                timestamp: new Date().toISOString(),
                path: req.path
            });
        });
    }

    // Route handlers
    async healthCheck(req, res) {
        try {
            const dbHealth = await businessService.healthCheck();
            const aiStats = aiService.getStats();
            
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: process.env.npm_package_version || '1.0.0',
                environment: appConfig.server.nodeEnv,
                services: {
                    database: dbHealth,
                    ai: aiStats
                }
            });
        } catch (error) {
            res.status(503).json({
                status: 'error',
                error: error.message
            });
        }
    }

    async handleChat(req, res) {
        try {
            const { message } = req.body;
            const businessId = req.query.business || req.body.business_id || 'default';
            const sessionId = req.headers['x-session-id'] || `${businessId}_${Date.now()}`;

            // Validation
            if (!message || message.trim() === '') {
                return res.status(400).json({ error: 'Message is required' });
            }

            if (message.length > 1000) {
                return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
            }

            console.log(`📨 Chat request - Business: ${businessId}, Session: ${sessionId}`);
            console.log(`📝 Message: "${message}"`);

            // Get business configuration
            const businessData = await businessService.getBusinessConfig(businessId);
            if (!businessData) {
                return res.status(404).json({ 
                    error: 'Business not found',
                    business_id: businessId 
                });
            }

            // Generate AI response
            const fullSessionId = `${businessId}_${sessionId}`;
            const result = await aiService.generateResponse(message, businessData, fullSessionId);

            console.log(`✅ Response generated for ${businessId}:`, result.response.substring(0, 100));

            res.json({
                ...result,
                business_id: businessId,
                session_id: sessionId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Chat error:', error);
            res.status(500).json({
                error: 'Failed to process message',
                details: appConfig.isDevelopment() ? error.message : undefined,
                suggestions: ['hey you there?', 'can you try again?', 'what happened?']
            });
        }
    }

    async getInitialMessage(req, res) {
        try {
            const businessId = req.query.business || 'default';
            const businessData = await businessService.getBusinessConfig(businessId);

            // Generate business-specific suggestions
            const aiService = require('./services/AIService');
            const suggestions = await aiService.getIntelligentSuggestions(businessData);

            if (businessData) {
                res.json({
                    message: businessData.initialMessage,
                    business_name: businessData.config.business.name,
                    business_logo: businessData.config.business.logo,
                    suggestions: suggestions,
                    business_id: businessId
                });
            } else {
                res.json({ 
                    message: 'hey! what\'s up?', 
                    suggestions: suggestions,
                    business_id: businessId
                });
            }
        } catch (error) {
            console.error('❌ Initial message error:', error);
            res.status(500).json({ error: 'Failed to get initial message' });
        }
    }

    async getAllBusinesses(req, res) {
        try {
            const businesses = await businessService.getAllBusinesses();
            res.json({
                businesses,
                total: businesses.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Get businesses error:', error);
            res.status(500).json({ error: 'Failed to fetch businesses' });
        }
    }

    async getBusinessDetails(req, res) {
        try {
            const businessId = req.params.id;
            const businessData = await businessService.getBusinessConfig(businessId);
            
            if (!businessData) {
                return res.status(404).json({ error: 'Business not found' });
            }

            // Remove sensitive data
            const publicData = {
                config: businessData.config,
                knowledge_base_count: businessData.knowledgeBase.length,
                categories: [...new Set(businessData.knowledgeBase.map(kb => kb.category))],
                last_updated: new Date().toISOString()
            };

            res.json(publicData);
        } catch (error) {
            console.error('❌ Get business details error:', error);
            res.status(500).json({ error: 'Failed to get business details' });
        }
    }

    async clearBusinessCache(req, res) {
        try {
            const businessId = req.params.id;
            businessService.clearCache(businessId);
            
            res.json({
                message: `Cache cleared for business: ${businessId}`,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to clear cache' });
        }
    }

    async debugKnowledgeBase(req, res) {
        try {
            const businessId = req.query.business || 'default';
            const businessData = await businessService.getBusinessConfig(businessId);
            
            if (!businessData) {
                return res.status(404).json({ error: 'Business not found' });
            }

            res.json({
                business_id: businessId,
                business_name: businessData.config.business.name,
                total_entries: businessData.knowledgeBase.length,
                entries: businessData.knowledgeBase.map(entry => ({
                    question: entry.question,
                    answer: entry.answer.substring(0, 200) + '...',
                    category: entry.category,
                    priority: entry.priority
                })),
                categories: [...new Set(businessData.knowledgeBase.map(kb => kb.category))]
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async testRAG(req, res) {
        try {
            const { query } = req.body;
            const businessId = req.query.business || 'default';
            
            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }

            const businessData = await businessService.getBusinessConfig(businessId);
            if (!businessData) {
                return res.status(404).json({ error: 'Business not found' });
            }

            const result = ragService.testRag(query, businessData);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getDebugStats(req, res) {
        try {
            const aiStats = aiService.getStats();
            const dbHealth = await businessService.healthCheck();
            
            res.json({
                server: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    node_version: process.version,
                    environment: appConfig.server.nodeEnv
                },
                services: {
                    ai: aiStats,
                    database: dbHealth
                },
                config: {
                    max_tokens: appConfig.api.maxTokens,
                    temperature: appConfig.api.temperature,
                    cache_ttl: appConfig.cache.ttl
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async clearAllCache(req, res) {
        try {
            businessService.clearCache();
            aiService.clearHistory();
            
            res.json({
                message: 'All caches cleared',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to clear caches' });
        }
    }

    async getActiveSessions(req, res) {
        try {
            const aiStats = aiService.getStats();
            
            res.json({
                active_sessions: aiStats.active_sessions,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get sessions' });
        }
    }

    async handleWebhook(req, res) {
        try {
            const businessId = req.params.businessId || req.body.business_id || req.query.business || 'default';
            const { message, session_id, user_id, platform, metadata } = req.body;
            
            // Validation
            if (!message || message.trim() === '') {
                return res.status(400).json({ 
                    error: 'Message is required',
                    success: false 
                });
            }

            // Generate session ID if not provided
            const sessionId = session_id || `${platform || 'webhook'}_${user_id || Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            console.log(`🔗 Webhook request - Business: ${businessId}, Platform: ${platform || 'unknown'}, User: ${user_id || 'unknown'}`);

            // Get business configuration
            const businessData = await businessService.getBusinessConfig(businessId);
            if (!businessData) {
                return res.status(404).json({ 
                    error: 'Business not found',
                    business_id: businessId,
                    success: false
                });
            }

            // Generate AI response
            const fullSessionId = `${businessId}_${sessionId}`;
            const result = await aiService.generateResponse(message, businessData, fullSessionId);

            // Format response for external integrations
            const response = {
                success: true,
                response: result.response,
                business_id: businessId,
                session_id: sessionId,
                user_id: user_id,
                platform: platform,
                timestamp: new Date().toISOString(),
                metadata: {
                    ...metadata,
                    suggestions: result.suggestions || [],
                    confidence: result.confidence || 0.8,
                    processing_time: result.processingTime || 0
                }
            };

            console.log(`✅ Webhook response generated for ${businessId}:`, response.response.substring(0, 100));

            res.json(response);

        } catch (error) {
            console.error('❌ Webhook error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process message',
                details: appConfig.isDevelopment() ? error.message : undefined,
                suggestions: ['hey you there?', 'can you try again?', 'what happened?']
            });
        }
    }

    // Start server
    async start() {
        try {
            // Test database connection
            const dbConnected = await databaseConfig.testConnection();
            if (!dbConnected) {
                console.error('❌ Failed to connect to database');
                process.exit(1);
            }

            const server = this.app.listen(appConfig.server.port, appConfig.server.host, () => {
                console.log('🚀 Chatbot API Server Started!');
                console.log(`📍 Server: http://${appConfig.server.host}:${appConfig.server.port}`);
                console.log(`🌍 Environment: ${appConfig.server.nodeEnv}`);
                console.log(`🤖 AI Model: ${appConfig.api.groqModel}`);
                console.log('📚 Available endpoints:');
                console.log('  - POST /api/chat');
                console.log('  - GET  /api/health');
                console.log('  - GET  /api/businesses');
                console.log('  - GET  /widget/chatbot.js');
                console.log('  - GET  /widget/embed/:businessId');
            });

            // Graceful shutdown
            const gracefulShutdown = async (signal) => {
                console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
                
                server.close(() => {
                    console.log('✅ HTTP server closed');
                    process.exit(0);
                });

                // Force close after 10 seconds
                setTimeout(() => {
                    console.log('❌ Forced shutdown');
                    process.exit(1);
                }, 10000);
            };

            process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
            process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        } catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }
}

// Start server if this file is run directly
if (require.main === module) {
    const server = new ChatbotServer();
    server.start();
}

module.exports = ChatbotServer;