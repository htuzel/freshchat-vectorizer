import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { knowledgeService } from '../services/knowledgeService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importKnowledge() {
    try {
        // Read the knowledge base file
        const knowledgeBasePath = path.join(__dirname, '../../knowledge_base.txt');
        const content = fs.readFileSync(knowledgeBasePath, 'utf8');

        // Process and store the content
        const result = await knowledgeService.processKnowledgeBase(content);

        console.log(`Successfully processed ${result.processedArticles} articles`);
    } catch (error) {
        console.error('Error importing knowledge base:', error);
    }
}

// Run the import
importKnowledge(); 