import OpenAI from 'openai';
import { config } from '../config.js';
import { qdrantService } from './qdrantService.js';
import { knowledgeService } from './knowledgeService.js';

class OpenAIService {
    constructor() {
        this.client = new OpenAI({
            apiKey: config.openai.apiKey
        });
    }

    async generateEmbedding(text) {
        try {
            const response = await this.client.embeddings.create({
                model: 'text-embedding-ada-002',
                input: text
            });
            return response.data[0].embedding;
        } catch (error) {
            console.error('Error generating embedding:', error);
            throw error;
        }
    }

    async answerWithRAG(question) {
        try {
            // Generate embedding for the question to find similar content
            const questionEmbedding = await this.generateEmbedding(question);
            
            // Search both collections in parallel
            const [conversationResults, knowledgeResults] = await Promise.all([
                qdrantService.searchSimilarConversations({
                    vector: questionEmbedding
                }),
                knowledgeService.searchKnowledge({
                    vector: questionEmbedding
                })
            ]);
            
            // Prepare context from conversations
            const conversationContext = conversationResults
                .map(conv => `--- Conversation Example ---\n${conv.conversation}`)
                .join('\n\n');
            
            // Prepare context from knowledge base
            const knowledgeContext = knowledgeResults
                .map(article => `--- ${article.title} ---\n${article.content}`)
                .join('\n\n');

            // Generate answer using GPT-4 with combined context
            const response = await this.client.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful customer service agent for online english company platform Flalingo.
                        You are directly talking to the customer.
                        Use both the official documentation and real conversation examples to provide accurate and helpful answers. When answering, try to combine insights from both sources to give the most comprehensive and practical response. Give me the natural, not so formal and short, clear answers. All answers should be in Turkish. Prevent expressions like you may contact with Flalingo Support Team because you are already customer service agent. If it is a technical question, you should answer it in a technical way. If it is a non-technical question, you should answer it in a non-technical way.
                        If the question is not clear, you should ask for clarification.
                        If the question is not related to Flalingo, you should say that you are not sure about the answer and you will ask the relevant team to get back to the customer.
                        If you need some technical detail, you can ask more information if it is happening on the browser, app which mobile or desktop. If it is happening on the website, you can ask more information about the page or the section etc. and try to collect more information
                        `
                    },
                    {
                        role: 'user',
                        content: `
Official Documentation:
${knowledgeContext}

Real Conversation Examples:
${conversationContext}

Question: ${question}`
                    }
                ],
                temperature: 0.7,
            });

            return {
                answer: response.choices[0].message.content,
                sources: {
                    conversations: conversationResults.map(conv => ({
                        id: conv.id,
                        content: conv.conversation,
                        score: conv.score
                    })),
                    knowledge: knowledgeResults.map(article => ({
                        id: article.id,
                        title: article.title,
                        content: article.content,
                        score: article.score
                    }))
                }
            };
        } catch (error) {
            console.error('Error in RAG process:', error);
            throw error;
        }
    }

    async processConversation(conversation) {
        try {
            const response = await this.client.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'Analyze the following customer service conversation and provide: 1) A brief summary 2) Whether the issue was resolved (true/false)'
                    },
                    {
                        role: 'user',
                        content: JSON.stringify(conversation.content)
                    }
                ]
            });

            const analysis = JSON.parse(response.choices[0].message.content);
            return {
                summary: analysis.summary,
                is_resolved: analysis.is_resolved
            };
        } catch (error) {
            console.error('Error processing conversation with OpenAI:', error);
            throw error;
        }
    }
}

export const openaiService = new OpenAIService(); 