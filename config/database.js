const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class DatabaseConfig {
    constructor() {
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.supabaseKey = process.env.SUPABASE_ANON_KEY;
        
        if (!this.supabaseUrl || !this.supabaseKey) {
            console.warn('⚠️ SUPABASE_URL or SUPABASE_ANON_KEY not set. Running without database.');
            this.client = null;
        } else {
            this.client = createClient(this.supabaseUrl, this.supabaseKey);
            console.log('✅ Database client initialized');
        }
    }

    getClient() {
        return this.client;
    }

    // Test database connection
    async testConnection() {
        try {
            if (!this.client) return false;
            const { data, error } = await this.client
                .from('businesses')
                .select('count')
                .limit(1);
            if (error) throw error;
            console.log('✅ Database connection successful');
            return true;
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            return false;
        }
    }
}

module.exports = new DatabaseConfig();