import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config.js';
import { openaiService } from './openaiService.js';

class FAQService {
    constructor() {
        this.client = new QdrantClient({
            url: config.qdrant.url,
            apiKey: config.qdrant.apiKey
        });
        this.collectionName = 'faqs';
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
            console.error('Error initializing FAQ collection:', error);
            throw error;
        }
    }

    async storeFAQ(faq) {
        try {
            // Generate a unique ID for the FAQ
            const id = Math.floor(Math.random() * 1000000);
            
            // Combine question and answer for embedding
            const content = `Question: ${faq.question}\nAnswer: ${faq.answer}`;
            
            // Generate embedding for the FAQ content
            const vector = await openaiService.generateEmbedding(content);

            const payload = {
                question: faq.question,
                answer: faq.answer,
                language: faq.language,
                category: faq.category || 'general',
                created_at: new Date().toISOString()
            };

            await this.client.upsert(this.collectionName, {
                wait: true,
                points: [{
                    id,
                    payload,
                    vector
                }]
            });

            console.log(`FAQ stored successfully with ID ${id}`);
            return id;
        } catch (error) {
            console.error('Error storing FAQ:', error);
            throw error;
        }
    }

    async searchFAQs(query, limit = 4) {
        try {
            const response = await this.client.search(this.collectionName, {
                limit,
                vector: query.vector,
                with_payload: true,
                score_threshold: 0.7,
                params: {
                    exact: false,
                    hnsw_ef: 128
                }
            });

            return response.map(hit => ({
                question: hit.payload.question,
                answer: hit.payload.answer,
                language: hit.payload.language,
                category: hit.payload.category,
                score: hit.score
            }));
        } catch (error) {
            console.error('Error searching FAQs:', error);
            throw error;
        }
    }
}

export const faqService = new FAQService(); 