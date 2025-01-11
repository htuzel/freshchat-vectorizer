import { openaiService } from './src/services/openaiService.js';
import { qdrantService } from './src/services/qdrantService.js';

async function testRAG() {
    try {
        console.log("\nTesting question answering...");
        const testQuestions = [
            "Ogretmen derse gelmedi, 5 dk.dir bekliyorum",
            "Ders haklarım eksilmiş; ben bu hakları geri istiyorum.",
            "Flai raporum oluşmadi, ne yapacağım?",
            "öğretmen havuzumu beğenmedim, yeni öğretmen istiyorum.",
        ];

        for (const question of testQuestions) {
            console.log(`\nQuestion: ${question}`);
            const result = await openaiService.answerWithRAG(question);

            console.log("\nAnswer:", result.answer);
            console.log("\nRelevant Conversations count:", result.sources.conversations.length);
            console.log("\nRelevant Knowledge Base Articles count:", result.sources.knowledge.length);

            /*
            result.sources.conversations.forEach(conv => {
                console.log(`\nScore: ${conv.score.toFixed(3)}`);
                console.log(conv.content);
            });

            console.log("\nRelevant Knowledge Base Articles:");
            result.sources.knowledge.forEach(article => {
                console.log(`\nTitle: ${article.title}`);
                console.log(`Score: ${article.score.toFixed(3)}`);
                console.log(article.content);
            });
            */

            console.log("\n----------------------------------------");
        }

    } catch (error) {
        console.error("Error in RAG test:", error);
    }
}

// Run the test
testRAG(); 