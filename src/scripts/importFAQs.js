import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { faqService } from '../services/faqService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importFAQs() {
    try {
        // Initialize the FAQ collection
        await faqService.initializeCollection();

        // Read the FAQs JSON file
        const faqsPath = path.join(__dirname, '../../faqs.json');
        const faqsContent = fs.readFileSync(faqsPath, 'utf8');
        const faqs = JSON.parse(faqsContent);

        let processedCount = 0;

        // Process each FAQ
        for (const faq of faqs) {
            // Parse the JSON strings for question and answer
            const questions = JSON.parse(faq.question);
            const answers = JSON.parse(faq.answer);

            // Process each language version
            for (const lang of Object.keys(questions)) {
                if (questions[lang] && answers[lang]) {
                    const faqEntry = {
                        question: questions[lang],
                        answer: answers[lang],
                        language: lang,
                        category: faq.category_id?.toString() || 'general',
                        original_id: faq.id
                    };

                    await faqService.storeFAQ(faqEntry);
                    processedCount++;
                }
            }
        }

        console.log(`Successfully processed ${processedCount} FAQ entries`);
    } catch (error) {
        console.error('Error importing FAQs:', error);
        process.exit(1);
    }
}

// Run the import
importFAQs(); 