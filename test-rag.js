import { openaiService } from './src/services/openaiService.js';
import { qdrantService } from './src/services/qdrantService.js';

async function testRAG() {
    try {
        console.log("\nTesting question answering...");
        const testQuestions = [
            "Öğretmen havuzumda kaç tane öğretmen var?",
            "Ders materyalleri neler?",
            "Ders materyallerim daha önce kullanılmış.",
            "Taksit seçeneğiniz var mı?",
            "Hesabımı nasıl dondurabilirim?",
            "Derse katılamıyorum, ne yapacağım?",
            "Öğretmen derse gelmedi.",
            "Dersi iptal edebilir miyim?",
            "Flai raporum oluşmadi, ne yapacağım?",
            "21.00'da ders rezervasyonu yapmıştım acaba öğretmen mi değişiklik yaptı",
            "Flai raporum hatalı"
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