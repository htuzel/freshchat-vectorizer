import dotenv from 'dotenv';
dotenv.config();

export const config = {
    openai: {
        apiKey: process.env.OPENAI_API_KEY
    },
    qdrant: {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY
    },
    freshchat: {
        apiKey: process.env.FRESHCHAT_API_KEY,
        domain: process.env.FRESHCHAT_DOMAIN
    },
    api: {
        token: process.env.API_TOKEN || 'flalingo_ai_default_token_change_this'
    }
}; 