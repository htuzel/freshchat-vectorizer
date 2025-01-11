import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config.js';
import { openaiService } from './openaiService.js';

class KnowledgeService {
    constructor() {
        this.client = new QdrantClient({
            url: config.qdrant.url,
            apiKey: config.qdrant.apiKey
        });

        this.collectionName = 'knowledge';
    }

    async initializeCollection() {
        try {
            // First check if collection exists
            const collections = await this.client.getCollections();
            const collectionExists = collections.collections.some(
                collection => collection.name === this.collectionName
            );

            if (!collectionExists) {
                await this.client.createCollection(this.collectionName, {
                    vectors: {
                        size: 1536, // OpenAI embedding dimension
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

    async storeArticle(article) {
        try {
            // Generate embedding for the article content
            const vector = await openaiService.generateEmbedding(article.content);

            const payload = {
                article_id: article.id, // Store original ID in payload
                title: article.title,
                content: article.content,
                created_at: new Date().toISOString()
            };

            // Convert string ID to numeric ID
            const numericId = parseInt(article.id.replace('article_', ''));

            await this.client.upsert(this.collectionName, {
                wait: true,
                points: [{
                    id: numericId,
                    payload,
                    vector
                }]
            });
            console.log(`Article ${article.id} stored successfully`);
        } catch (error) {
            console.error('Error storing article:', error);
            throw error;
        }
    }

    async searchKnowledge(query, limit = 5) {
        try {
            const response = await this.client.search(this.collectionName, {
                limit: limit,
                vector: query.vector,
                with_payload: true,
                score_threshold: 0.70
            });

            return response.map(hit => ({
                id: hit.payload.article_id, // Use the original ID from payload
                ...hit.payload,
                score: hit.score
            }));
        } catch (error) {
            console.error('Error searching knowledge base:', error);
            throw error;
        }
    }

    async processKnowledgeBase(content) {
        try {
            // Split content by the separator
            const articles = content.split('-----').filter(article => article.trim());
            
            // Initialize collection
            await this.initializeCollection();

            // Process each article
            for (let i = 0; i < articles.length; i++) {
                const article = articles[i].trim();
                
                // Extract title (first line) and content
                const lines = article.split('\n').filter(line => line.trim());
                const title = lines[0];
                const content = lines.slice(1).join('\n').trim();

                // Store the article
                await this.storeArticle({
                    id: `article_${i + 1}`,
                    title,
                    content
                });
            }

            return {
                success: true,
                processedArticles: articles.length
            };
        } catch (error) {
            console.error('Error processing knowledge base:', error);
            throw error;
        }
    }
}

export const knowledgeService = new KnowledgeService(); 