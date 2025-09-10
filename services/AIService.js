const fetch = require('node-fetch');
const appConfig = require('../config/app');
const ragService = require('./RAGService');

class AIService {
    constructor() {
        this.conversationHistory = new Map();
        console.log('🤖 AI service initialized');
    }

    // Generate AI response
    async generateResponse(message, businessData, sessionId) {
        try {
            // Get conversation history
            let history = this.conversationHistory.get(sessionId) || [];
            const isNewConversation = history.length === 0;

            // Add user message to history
            history.push({ role: 'user', content: message });

            // Get relevant context using RAG (AWAIT THE PROMISE!)
            const ragResult = await ragService.retrieveRelevantContext(message, businessData, 3, 0.05);

            let botResponse;
            let suggestions = await this.getIntelligentSuggestions(businessData, history);

            // Check for simple math
            if (this.isMathQuery(message)) {
                botResponse = this.handleMathQuery(message);
            }
            // AI-powered response
            else if (appConfig.api.groqApiKey) {
                botResponse = await this.getAIResponse(message, businessData, ragResult, history);
            }
            // Fallback response
            else {
                 botResponse = "I apologize, but I’m currently unable to provide a response. Could you please try again?";
            }

            // Add bot response to history
            history.push({ role: 'assistant', content: botResponse });
            
            // Limit history size
            if (history.length > 20) {
                history = history.slice(-20);
            }
            
            this.conversationHistory.set(sessionId, history);

            return {
                response: botResponse,
                isNewConversation,
                initialMessage: isNewConversation ? businessData.initialMessage : null,
                suggestions,
                debug: {
                    contextFound: ragResult.contexts ? ragResult.contexts.length : 0,
                    maxScore: ragResult.maxScore || 0,
                    hasAI: !!appConfig.api.groqApiKey,
                    wasTranslated: ragResult.translationInfo ? ragResult.translationInfo.wasTranslated : false,
                    originalLanguage: ragResult.translationInfo ? ragResult.translationInfo.originalLanguage : 'unknown'
                }
            };

        } catch (error) {
            console.error('❌ Error generating AI response:', error);
            return {
                response: "sorry something went wrong, try again?",
                  suggestions: ['I want to try again', 'Let me ask something else', 'I need help with a different topic'],
                error: error.message
            };
        }
    }

    // Get AI response from Groq
    async getAIResponse(message, businessData, ragResult, history) {
        try {
            // Build system message with contact information
            let systemMessage = businessData.systemMessage || `You are a professional business assistant. 

📏 **RESPONSE LENGTH RULES:**
- Keep responses CONCISE: 1-3 sentences maximum
- Be direct and to the point
- Avoid long explanations or paragraphs
- If you need more info, ask ONE short question
- If you don't know, say "I don't know" and suggest contacting support
- Complete your thoughts - don't cut off mid-sentence

💬 **TONE:**
- Friendly but brief
- Professional but casual
- Helpful but concise

❌ **AVOID:**
- Long paragraphs (keep under 3 sentences)
- Multiple options in one response
- Step-by-step processes unless specifically asked
- Filler words or unnecessary details`;
            
            // Always add contact information to prevent fake number generation
            const contactInfo = this.buildContactInfoMessage(businessData);
            if (contactInfo) {
                systemMessage += "\n\n" + contactInfo;
            }
            
            let messages = [{
                role: 'system',
                content: systemMessage
            }];

            // Add context if available (BETTER ERROR HANDLING)
            if (ragResult && ragResult.contexts && Array.isArray(ragResult.contexts) && ragResult.contexts.length > 0) {
                const contextMessage = ragService.buildContextMessage(ragResult.contexts, ragResult.translationInfo);
                if (contextMessage) {
                    messages.push({ role: 'system', content: contextMessage });
                    console.log(`📝 Added ${ragResult.contexts.length} context entries to prompt`);
                    console.log(`🎯 Top context score: ${ragResult.maxScore.toFixed(3)}`);
                    
                    // Log translation info if available
                    if (ragResult.translationInfo && ragResult.translationInfo.wasTranslated) {
                        console.log(`🌐 Query was translated from ${ragResult.translationInfo.originalLanguage}: "${ragResult.translationInfo.originalText}" -> "${ragResult.translationInfo.translatedText}"`);
                    }
                }
            } else {
                console.log('⚠️ No context found, using general business tone');
            }

            // Include recent conversation history
            messages.push(...history.slice(-6));

            const requestBody = {
                model: appConfig.api.groqModel,
                messages,
                max_tokens: Math.min(appConfig.api.maxTokens, 500), // Increased to 150 tokens to prevent cut-off
                temperature: appConfig.api.temperature,
                top_p: appConfig.api.topP,
                stream: false
            };

            console.log('🤖 Sending request to Groq...', {
                model: appConfig.api.groqModel,
                messages: messages.length,
                max_tokens: requestBody.max_tokens,
                temperature: appConfig.api.temperature,
                top_p: appConfig.api.topP
            });
            const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${appConfig.api.groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!groqResponse.ok) {
                let errorBody = '';
                try {
                    errorBody = await groqResponse.text();
                } catch (e) {
                    errorBody = '[failed to read error body]';
                }
                console.error('❌ Groq API error:', groqResponse.status, groqResponse.statusText, '- Body:', errorBody);
                throw new Error(`Groq API error: ${groqResponse.status}`);
            }

            const data = await groqResponse.json();
            const response = data?.choices?.[0]?.message?.content?.trim() || "I’m sorry, I couldn’t understand that. Could you clarify?";
            
            console.log('✅ Got response from Groq:', response);
            return response;

        } catch (error) {
            console.error('❌ Groq API error:', error);
            return "I’m currently experiencing technical issues. Please try again shortly.";
        }
    }

    // Check if message is a math query
    isMathQuery(message) {
        return /^\s*\d+\s*[\+\-\*\/]\s*\d+\s*=?\s*$/.test(message);
    }

    // Handle simple math queries
    handleMathQuery(message) {
        try {
            const result = eval(message.replace('=', ''));
            return `${message.replace('=', '')} = ${result} lol quick math`;
        } catch {
            return "I couldn’t process the calculation. Please ensure the format is correct.";
        }
    }

    // Get intelligent business-specific suggestions
    async getIntelligentSuggestions(businessData = null, conversationHistory = []) {
        try {
            // If no business data, return generic suggestions
            if (!businessData) {
                return this.getGenericSuggestions();
            }

            // Generate AI-powered suggestions based on business context
            if (appConfig.api.groqApiKey) {
                return await this.generateAISuggestions(businessData, conversationHistory);
            }

            // Fallback to knowledge base analysis
            return this.getKnowledgeBaseSuggestions(businessData);
        } catch (error) {
            console.error('❌ Error generating intelligent suggestions:', error);
            return this.getGenericSuggestions();
        }
    }

    // Generate AI-powered suggestions
    async generateAISuggestions(businessData, conversationHistory = []) {
        try {
            const businessType = businessData.config?.business?.type || 'business';
            const businessName = businessData.config?.business?.name || 'our business';
            const specialization = businessData.config?.business?.specialization || '';
            
            // Get top knowledge base categories
            const categories = this.extractTopCategories(businessData.knowledgeBase);
            
            // Build context for AI
            const contextInfo = {
                businessType,
                businessName,
                specialization,
                categories: categories.slice(0, 5), // Top 5 categories
                hasRecentConversation: conversationHistory.length > 0
            };

            const prompt = this.buildSuggestionPrompt(contextInfo);
            
            const messages = [
                {
                    role: 'system',
                    content: 'You are an expert at generating helpful, relevant suggestion questions for customer service chatbots. Generate exactly 3 short, natural questions that customers would actually ask about the business services. the suggestions should not be more than 5 or 6 words.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ];

            const requestBody = {
                model: appConfig.api.groqModel,
                messages,
                max_tokens: 150,
                temperature: 0.7,
                top_p: 0.9,
                stream: false
            };

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${appConfig.api.groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`AI API error: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data?.choices?.[0]?.message?.content?.trim() || '';
            
            // Parse AI response to extract suggestions
            const suggestions = this.parseAISuggestions(aiResponse);
            
            if (suggestions.length >= 3) {
                console.log(`🤖 AI generated suggestions:`, suggestions);
                return suggestions;
            }

            // Fallback if AI didn't generate enough suggestions
            return this.getKnowledgeBaseSuggestions(businessData);

        } catch (error) {
            console.error('❌ AI suggestion generation failed:', error);
            return this.getKnowledgeBaseSuggestions(businessData);
        }
    }

    // Build prompt for AI suggestion generation
    buildSuggestionPrompt(contextInfo) {
        const { businessType, businessName, specialization, categories } = contextInfo;
        
        let prompt = `Generate 3 helpful customer service suggestion questions for a ${businessType} business called "${businessName}".`;
        
        if (specialization) {
            prompt += ` They specialize in ${specialization}.`;
        }
        
        if (categories.length > 0) {
            prompt += ` Common customer topics include: ${categories.join(', ')}.`;
        }
        
        prompt += `\n\nGenerate 3 short, natural questions that customers would likely ask. Make them specific to this type of business. Format each question on a new line starting with "- ".`;
        
        return prompt;
    }

    // Parse AI response to extract suggestions
    parseAISuggestions(aiResponse) {
        const lines = aiResponse.split('\n').filter(line => line.trim());
        const suggestions = [];
        
        for (const line of lines) {
            // Remove bullet points, numbers, or dashes
            let suggestion = line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
            
            // Remove quotes if present
            suggestion = suggestion.replace(/^["']|["']$/g, '');
            
            if (suggestion && suggestion.length > 10 && suggestion.length < 100) {
                suggestions.push(suggestion);
            }
        }
        
        return suggestions.slice(0, 3);
    }

    // Extract top categories from knowledge base
    extractTopCategories(knowledgeBase) {
        if (!knowledgeBase || knowledgeBase.length === 0) return [];
        
        const categoryCount = {};
        knowledgeBase.forEach(kb => {
            if (kb.category) {
                categoryCount[kb.category] = (categoryCount[kb.category] || 0) + 1;
            }
        });
        
        return Object.entries(categoryCount)
            .sort(([,a], [,b]) => b - a)
            .map(([category]) => category);
    }

    // Generate suggestions based on knowledge base analysis
    getKnowledgeBaseSuggestions(businessData) {
        const suggestions = [];
        const businessType = businessData.config?.business?.type || 'business';
        const businessName = businessData.config?.business?.name || 'our business';
        
        // Business-type specific suggestions
        const businessTypeSuggestions = this.getBusinessTypeSuggestions(businessType, businessName);
        suggestions.push(...businessTypeSuggestions);
        
        // Knowledge base based suggestions
        if (businessData.knowledgeBase && businessData.knowledgeBase.length > 0) {
            const kbSuggestions = this.getKBBasedSuggestions(businessData.knowledgeBase);
            suggestions.push(...kbSuggestions);
        }
        
        // Remove duplicates and return 3 random suggestions
        const uniqueSuggestions = [...new Set(suggestions)];
        const finalSuggestions = uniqueSuggestions.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        console.log(`💡 Knowledge base suggestions:`, finalSuggestions);
        return finalSuggestions;
    }

    // Get business-type specific suggestions
    getBusinessTypeSuggestions(businessType, businessName) {
        const typeMap = {
            'restaurant': [
                'What\'s on your menu today?',
                'Do you have vegetarian options?',
                'What are your delivery hours?',
                'Can I make a reservation?',
                'What are your specials?'
            ],
            'retail': [
                'What products do you sell?',
                'Do you have this in stock?',
                'What are your return policies?',
                'Do you offer discounts?',
                'What are your store hours?'
            ],
            'real_estate': [
                'What properties are available?',
                'What are your rental prices?',
                'Do you offer property management?',
                'What areas do you cover?',
                'How do I schedule a viewing?'
            ],
            'healthcare': [
                'How do I book an appointment?',
                'What services do you offer?',
                'Do you accept my insurance?',
                'What are your office hours?',
                'How do I get my test results?'
            ],
            'automotive': [
                'What services do you offer?',
                'How much does a service cost?',
                'Do you have parts in stock?',
                'Can I schedule an appointment?',
                'What are your warranty policies?'
            ],
            'beauty': [
                'What services do you offer?',
                'How do I book an appointment?',
                'What are your prices?',
                'Do you have any specials?',
                'What are your salon hours?'
            ],
            'fitness': [
                'What classes do you offer?',
                'What are your membership rates?',
                'Do you have personal training?',
                'What are your gym hours?',
                'Do you offer trial memberships?'
            ],
            'education': [
                'What courses do you offer?',
                'How do I enroll?',
                'What are your tuition rates?',
                'Do you offer financial aid?',
                'What are your class schedules?'
            ]
        };
        
        return typeMap[businessType] || [
            'What services do you offer?',
            'How can I contact you?',
            'What are your business hours?'
        ];
    }

    // Get suggestions based on knowledge base content
    getKBBasedSuggestions(knowledgeBase) {
        const suggestions = [];
        const categories = this.extractTopCategories(knowledgeBase);
        
        categories.slice(0, 3).forEach(category => {
            const categoryQuestions = knowledgeBase
                .filter(kb => kb.category === category)
                .map(kb => kb.question)
                .filter(q => q && q.length < 80); // Keep questions under 80 chars
            
            if (categoryQuestions.length > 0) {
                // Pick a representative question from this category
                const randomQuestion = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
                suggestions.push(randomQuestion);
            }
        });
        
        return suggestions;
    }

    // Generic fallback suggestions
    getGenericSuggestions() {
        return [
            'How can I help you today?',
            'What would you like to know?',
            'Tell me what you need help with'
        ];
    }

    // Build contact information message for AI
    buildContactInfoMessage(businessData) {
        if (!businessData || !businessData.config) return null;
        
        const contact = businessData.config.contact;
        if (!contact) return null;
        
        const contactDetails = [];
        if (contact.phone) contactDetails.push(`Phone: ${contact.phone}`);
        if (contact.email) contactDetails.push(`Email: ${contact.email}`);
        if (contact.address) contactDetails.push(`Address: ${contact.address}`);
        if (contact.hours) contactDetails.push(`Hours: ${contact.hours}`);
        if (contact.website) contactDetails.push(`Website: ${contact.website}`);
        
        if (contactDetails.length === 0) return null;
        
        return `📞 **Contact Information (Use these exact details, never make up fake numbers):**
${contactDetails.join('\n')}

**CRITICAL**: Always use the exact contact information above. Never generate, make up, or hallucinate phone numbers, emails, or addresses. If asked for contact details not listed above, say you don't have that information.`;
    }

    // Legacy method for backward compatibility
    getCasualSuggestions(businessData = null) {
        // Use the new intelligent system
        return this.getIntelligentSuggestions(businessData);
    }

    // Get conversation history for a session
    getConversationHistory(sessionId) {
        return this.conversationHistory.get(sessionId) || [];
    }

    // Clear conversation history
    clearHistory(sessionId = null) {
        if (sessionId) {
            this.conversationHistory.delete(sessionId);
            console.log(`🗑️ Cleared history for session: ${sessionId}`);
        } else {
            this.conversationHistory.clear();
            console.log('🗑️ Cleared all conversation history');
        }
    }

    // Get service stats
    getStats() {
        return {
            active_sessions: this.conversationHistory.size,
            groq_api_available: !!appConfig.api.groqApiKey,
            model: appConfig.api.groqModel,
            max_tokens: appConfig.api.maxTokens
        };
    }
}

module.exports = new AIService();