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

            const completion = response.choices[0]?.message?.content;
            if (!completion) {
                throw new Error("No completion found");
            }
            
            return {
                answer: completion,
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

    async tabCompletionWithRAG(typedText, lastAnswer) {
      try {
        if (!typedText?.trim()) {
          throw new Error("Typed text is required");
        }

        // Generate embedding for the typed text to find similar content
        const textEmbedding = await this.generateEmbedding(typedText);
  
        // Search both collections in parallel
        const [conversationResults, knowledgeResults] = await Promise.all([
          qdrantService.searchSimilarConversations({
            vector: textEmbedding,
          }),
          knowledgeService.searchKnowledge({
            vector: textEmbedding,
          }),
        ]);
  
        // Prepare context from conversations
        const conversationContext = conversationResults
          .map((conv) => `--- Conversation Example ---\n${conv.conversation}`)
          .join("\n\n");
  
        // Prepare context from knowledge base
        const knowledgeContext = knowledgeResults
          .map((article) => `--- ${article.title} ---\n${article.content}`)
          .join("\n\n");
  
        // Generate completion using GPT-4 with context
        const response = await this.client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a helpful customer service agent for Flalingo, an online English learning platform.
                        Your task is to provide text completions for customer service responses.
  
                        CRITICAL RULES:
                        1. ONLY return the completion part that should follow the typed text
                        2. DO NOT return the typed text itself
                        3. Keep completions natural, short and contextual
                        4. Handle spaces intelligently:
                           - For word completions (e.g., "Mer" -> "haba"), no space at start
                           - For new phrases (e.g., "Ders" -> " başlayacak"), add space at start
                        5. You are directly talking to the customer in Turkish
                        6. Use both documentation and conversation history for accurate completions
                        7. Keep responses short and chat-friendly
  
                        Examples:
                        If typed "Mer" -> return "haba! Nasıl yardımcı olabilirim?"
                        If typed "Ders" -> return " saatiniz için sistem kontrolü yapıyorum"
                        If typed "Nas" -> return "ıl yardımcı olabilirim?"
                        If typed "Par" -> return "ola ile ilgili sorununuzu anlayabilir miyim?"
                        If typed "Öde" -> return "me işleminizi kontrol ediyorum"
                        If typed "Siz" -> return "in için uygun bir çözüm bulacağım"
                        If typed "Yar" -> return "dımcı olabildiğim için memnun oldum"
                        
                        Note: Focus on natural Turkish chat responses while maintaining proper spacing.`,
            },
            {
              role: "user",
              content: `Official Documentation:
                        ${knowledgeContext}
  
                        Real Conversation Examples:
                        ${conversationContext}
  
                        Last Answer: "${lastAnswer || ""}"
                        Typed Text: "${typedText}"`,
            },
          ],
          temperature: 0.9,
        });
  
        const completion = response.choices[0]?.message?.content;
        if (!completion) {
            throw new Error("No completion found");
        }

        return completion;
      } catch (error) {
        console.error("Error in tab completion:", error);
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