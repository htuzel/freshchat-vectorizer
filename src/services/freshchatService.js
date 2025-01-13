import axios from 'axios';
import { config } from '../config.js';
import { qdrantService } from './qdrantService.js';

class FreshchatService {
    constructor() {
        const baseURL = `https://${config.freshchat.domain}`;
        console.log('Initializing Freshchat service with baseURL:', baseURL);

        this.client = axios.create({
            baseURL: baseURL,
            headers: {
                'Authorization': `Bearer ${config.freshchat.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        // Add request interceptor for debugging
        this.client.interceptors.request.use(request => {
            return request;
        });

        // Add response interceptor for debugging
        this.client.interceptors.response.use(
            response => {
                return response;
            },
            error => {
                console.error('Response error:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    headers: error.response?.headers
                });
                return Promise.reject(error);
            }
        );
    }

    async getHistoricalConversations(fromDate) {
        try {
            // First, get all users
            const users = await this.getAllUsers();
            console.log(`Found ${users.length} users`);

            let totalConversations = 0;
            
            // For each user, get and store their conversations
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                try {
                    console.log(`Processing user ${i + 1}/${users.length} (ID: ${user})`);
                    const conversationsCount = await this.getUserAndStoreConversations(user, fromDate);
                    totalConversations += conversationsCount;
                    console.log(`Progress: ${i + 1}/${users.length} users processed, ${totalConversations} total conversations stored`);
                } catch (error) {
                    console.error(`Error processing user ${user}:`, error);
                }
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            return {
                processedUsers: users.length,
                totalConversations
            };
        } catch (error) {
            console.error('Error in historical conversations process:', error);
            throw error;
        }
    }

    async getUserAndStoreConversations(userId, fromDate) {
        let page = 1;
        let totalStored = 0;

        while (true) {
            try {
                const response = await this.client.get(`/v2/users/${userId}/conversations`);
                const userConversations = response.data.conversations || [];
                
                if (userConversations.length === 0) break;

                console.log(`Processing ${userConversations.length} conversations for user ${userId} (page ${page})`);

                // Process each conversation in the current page
                for (let conversation of userConversations) {
                    try {
                        //check if conversation is resolved
                        const conversationObj = await this.client.get(`/v2/conversations/${conversation.id}`);                    
                        conversation.is_resolved = conversationObj.data.status;
                        conversation.assigned_agent_id = conversationObj.data.assigned_agent_id;
                        conversation.user_id = userId;
                        await new Promise(resolve => setTimeout(resolve, 100));

                        const messages = await this.client.get(`/v2/conversations/${conversation.id}/messages`);
                        conversation.messages = messages.data.messages || [];
                        
                        // Format and store the conversation
                        const formattedConversation = this.formatConversation(conversation);
                        await qdrantService.storeConversation(formattedConversation);
                        totalStored++;
                        
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (error) {
                        console.error(`Error processing conversation ${conversation.id} for user ${userId}:`, error);
                    }
                }

                console.log(`Stored ${userConversations.length} conversations for user ${userId} (page ${page})`);

                if (!response.data.pagination?.has_next) break;
                page++;

                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`Error fetching conversations for user ${userId} page ${page}:`, error);
                throw error;
            }
        }

        return totalStored;
    }

    async getAllUsers() {
        let userIds = [];
        let page = 1;
        
        while (true) {
            try {
                const response = await this.client.get('/v2/users', {
                    params: {
                        created_from: '2024-07-01T00:00:00Z', //UTC Format From 1st October 2024, can be changed to any date
                        created_to: '2024-08-01T12:00:00Z', //UTC Format To 10th January 2025, can be changed to any date
                        page: page,
                        per_page: 1000
                    }
                });

                const users = response.data.users || [];
                if (users.length === 0) break;

                console.log('Total users fetched:', response.data);
                
                //STORE USERS'S ids
                for (const user of users) {
                    userIds.push(user.id);
                }
                
                let currentPage = response.data.pagination.current_page;
                let totalPages = response.data.pagination.total_pages;

                if (currentPage < totalPages) {
                    console.log(`current_page: ${currentPage} > total_pages: ${totalPages}`);
                    page++;
                } else {
                    console.log(`current_page: ${currentPage} <= total_pages: ${totalPages}`);
                    break;
                }

                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`Error fetching users page ${page}:`, error);
                throw error;
            }
        }

        return userIds;
    }

    formatConversation(rawConversation) {
        try {
            // Filter out system messages and format messages as a simple dialog
            const messages = (rawConversation.messages || [])
                .filter(msg => {
                    // Skip system messages
                    if (msg.message_type === 'system') return false;
                    
                    // Check if message has valid content
                    const content = msg.message_parts?.[0]?.text?.content || '';
                    return content.trim() !== '';
                })
                .sort((a, b) => new Date(a.timestamp || a.created_time) - new Date(b.timestamp || b.created_time))
                .map(msg => {
                    const role = msg.actor_type === 'agent' ? 'Agent' : 'User';
                    const content = msg.message_parts?.[0]?.text?.content || '';
                    return `${role}: ${content.trim()}`;
                });

            // Format as a clean dialog with header and newlines
            const dialog = messages.join('\n');

            return {
                id: rawConversation.id,
                conversation: dialog,
                user_id: rawConversation.user_id,
                assigned_agent_id: rawConversation.assigned_agent_id,
                summary: '',
                is_resolved: rawConversation.is_resolved || false
            };
        } catch (error) {
            console.error('Error formatting conversation:', error);
            console.error('Raw conversation:', JSON.stringify(rawConversation, null, 2));
            throw error;
        }
    }

    async testConnection() {
        try {
            // First, log the request configuration
            console.log('Testing connection with config:', {
                baseURL: this.client.defaults.baseURL,
                headers: {
                    ...this.client.defaults.headers,
                    'Authorization': `Bearer ${config.freshchat.apiKey}`
                }
            });

            const response = await this.client.get('/agents/list');  // Changed to /agents/list endpoint
            console.log('Connection test successful:', {
                status: response.status,
                data: response.data
            });
            return true;
        } catch (error) {
            console.error('Connection test failed:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                headers: error.response?.headers,
                url: error.config?.url,
                method: error.config?.method
            });

            // Throw a more detailed error
            throw new Error(`Freshchat API Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        }
    }
}

export const freshchatService = new FreshchatService(); 