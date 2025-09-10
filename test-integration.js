#!/usr/bin/env node

/**
 * Test script for chatbot API integration
 * This script tests both the standard chat endpoint and the new webhook endpoint
 */

const https = require('https');

// Configuration
const API_BASE = 'https://bitpack-widget.vercel.app';
const BUSINESS_ID = 'muneeb-ai'; // Change this to your business ID

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: new URL(url).hostname,
            port: 443,
            path: new URL(url).pathname + new URL(url).search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data) {
            const postData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({
                        status: res.statusCode,
                        data: parsed
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: responseData
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// Test functions
async function testHealthCheck() {
    console.log('🏥 Testing Health Check...');
    try {
        const result = await makeRequest(`${API_BASE}/api/health`);
        console.log(`✅ Health Check: ${result.status} - ${result.data.status}`);
        return result.status === 200;
    } catch (error) {
        console.log(`❌ Health Check Failed: ${error.message}`);
        return false;
    }
}

async function testStandardChat() {
    console.log('\n💬 Testing Standard Chat Endpoint...');
    try {
        const result = await makeRequest(
            `${API_BASE}/api/chat?business=${BUSINESS_ID}`,
            'POST',
            {
                message: 'Hello! This is a test message from the integration test script.'
            }
        );
        
        if (result.status === 200) {
            console.log(`✅ Standard Chat: ${result.status}`);
            console.log(`📝 Response: ${result.data.response.substring(0, 100)}...`);
            console.log(`🆔 Session ID: ${result.data.session_id}`);
        } else {
            console.log(`❌ Standard Chat Failed: ${result.status} - ${JSON.stringify(result.data)}`);
        }
        return result.status === 200;
    } catch (error) {
        console.log(`❌ Standard Chat Error: ${error.message}`);
        return false;
    }
}

async function testWebhookEndpoint() {
    console.log('\n🔗 Testing Webhook Endpoint...');
    try {
        const result = await makeRequest(
            `${API_BASE}/api/webhook/${BUSINESS_ID}`,
            'POST',
            {
                message: 'Hello from WhatsApp! This is a webhook test.',
                user_id: 'test_user_123',
                platform: 'whatsapp',
                session_id: 'test_session_456',
                metadata: {
                    phone_number: '+1234567890',
                    user_name: 'Test User',
                    test: true
                }
            }
        );
        
        if (result.status === 200 && result.data.success) {
            console.log(`✅ Webhook: ${result.status}`);
            console.log(`📝 Response: ${result.data.response.substring(0, 100)}...`);
            console.log(`🆔 Session ID: ${result.data.session_id}`);
            console.log(`👤 User ID: ${result.data.user_id}`);
            console.log(`📱 Platform: ${result.data.platform}`);
            console.log(`📊 Confidence: ${result.data.metadata.confidence}`);
        } else {
            console.log(`❌ Webhook Failed: ${result.status} - ${JSON.stringify(result.data)}`);
        }
        return result.status === 200 && result.data.success;
    } catch (error) {
        console.log(`❌ Webhook Error: ${error.message}`);
        return false;
    }
}

async function testInitialMessage() {
    console.log('\n🎯 Testing Initial Message Endpoint...');
    try {
        const result = await makeRequest(`${API_BASE}/api/initial-message?business=${BUSINESS_ID}`);
        
        if (result.status === 200) {
            console.log(`✅ Initial Message: ${result.status}`);
            console.log(`📝 Message: ${result.data.message}`);
            console.log(`💡 Suggestions: ${result.data.suggestions?.length || 0} items`);
        } else {
            console.log(`❌ Initial Message Failed: ${result.status} - ${JSON.stringify(result.data)}`);
        }
        return result.status === 200;
    } catch (error) {
        console.log(`❌ Initial Message Error: ${error.message}`);
        return false;
    }
}

async function testBusinessesList() {
    console.log('\n📋 Testing Businesses List...');
    try {
        const result = await makeRequest(`${API_BASE}/api/businesses`);
        
        if (result.status === 200) {
            console.log(`✅ Businesses List: ${result.status}`);
            console.log(`🏢 Total Businesses: ${result.data.total}`);
            if (result.data.businesses && result.data.businesses.length > 0) {
                console.log(`📝 Available: ${result.data.businesses.map(b => b.id).join(', ')}`);
            }
        } else {
            console.log(`❌ Businesses List Failed: ${result.status} - ${JSON.stringify(result.data)}`);
        }
        return result.status === 200;
    } catch (error) {
        console.log(`❌ Businesses List Error: ${error.message}`);
        return false;
    }
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting Chatbot API Integration Tests...\n');
    console.log(`📍 API Base: ${API_BASE}`);
    console.log(`🏢 Business ID: ${BUSINESS_ID}\n`);

    const tests = [
        { name: 'Health Check', fn: testHealthCheck },
        { name: 'Businesses List', fn: testBusinessesList },
        { name: 'Initial Message', fn: testInitialMessage },
        { name: 'Standard Chat', fn: testStandardChat },
        { name: 'Webhook Endpoint', fn: testWebhookEndpoint }
    ];

    const results = [];
    
    for (const test of tests) {
        const success = await test.fn();
        results.push({ name: test.name, success });
        
        // Add a small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    
    results.forEach(result => {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${result.name}`);
    });
    
    console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All tests passed! Your chatbot API is ready for n8n integration.');
        console.log('\n📖 Next steps:');
        console.log('1. Use the webhook endpoint for n8n integration');
        console.log('2. Follow the INTEGRATION_GUIDE.md for detailed setup');
        console.log('3. Test with your actual WhatsApp Business API');
    } else {
        console.log('⚠️  Some tests failed. Please check your API configuration.');
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    testHealthCheck,
    testStandardChat,
    testWebhookEndpoint,
    testInitialMessage,
    testBusinessesList,
    runTests
};
