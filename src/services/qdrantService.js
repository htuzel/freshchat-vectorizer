import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config.js';
import { openaiService } from './openaiService.js';
import crypto from 'crypto';

class QdrantService {
    constructor() {
        this.client = new QdrantClient({
            url: config.qdrant.url,
            apiKey: config.qdrant.apiKey
        });

        this.collectionName = 'conversations_simplified';
    }

    // UUID'yi sayısal ID'ye çeviren yardımcı fonksiyon
    uuidToNumericId(uuid) {
        return parseInt(crypto.createHash('md5').update(uuid).digest('hex').slice(0, 8), 16);
    }

    async initializeCollection() {
        try {
            const collections = await this.client.getCollections();
            const collectionExists = collections.collections.some(
                collection => collection.name === this.collectionName
            );

            if (!collectionExists) {
                await this.client.createCollection(this.collectionName, {
                    vectors: {
                        size: 1536,
                        distance: 'Cosine'
                    }
                });
                console.log(`Collection "${this.collectionName}" created successfully`);
            } else {
                console.log(`Collection "${this.collectionName}" already exists`);
            }
        } catch (error) {
            console.error('Error initializing collection:', error);
            throw error;
        }
    }

    async storeConversation(conversation) {
        try {
            // UUID'yi sayısal ID'ye çevir
            const numericId = this.uuidToNumericId(conversation.id);

            // Check if conversation already exists
            const existing = await this.client.scroll(this.collectionName, {
                filter: {
                    must: [
                        { key: 'original_id', match: { value: conversation.id } }
                    ]
                },
                limit: 1
            });

            if (existing.points && existing.points.length > 0) {
                console.log(`Conversation ${conversation.id} already exists, skipping...`);
                return;
            }

            // Konuşma için embedding oluştur
            let vector;
            if (!conversation.vector) {
                vector = await openaiService.generateEmbedding(conversation.conversation);
            } else {
                vector = conversation.vector;
            }

            const payload = {
                original_id: conversation.id,
                conversation: conversation.conversation,
                user_id: conversation.user_id || null,
                assigned_agent_id: conversation.assigned_agent_id,
                summary: conversation.summary || '',
                is_resolved: conversation.is_resolved || false,
                created_at: new Date().toISOString()
            };

            await this.client.upsert(this.collectionName, {
                wait: true,
                points: [{
                    id: numericId,
                    payload,
                    vector: vector
                }]
            });
            console.log(`Conversation ${conversation.id} stored successfully with numeric ID ${numericId}`);
        } catch (error) {
            console.error('Error storing conversation:', error);
            throw error;
        }
    }

    async searchSimilarConversations(query, limit = 10) {
        try {
            const response = await this.client.search(this.collectionName, {
                limit: limit,
                vector: query.vector,
                with_payload: true,
                with_vectors: true,
                score_threshold: 0.7,
                params: {
                    exact: false,
                    hnsw_ef: 128
                }
            });

            return response.map(hit => ({
                id: hit.payload.original_id,
                conversation: hit.payload.conversation,
                user_id: hit.payload.user_id,
                assigned_agent_id: hit.payload.assigned_agent_id,
                summary: hit.payload.summary,
                is_resolved: hit.payload.is_resolved,
                score: hit.score
            }));
        } catch (error) {
            console.error('Error searching conversations:', error);
            throw error;
        }
    }
}

export const qdrantService = new QdrantService(); 