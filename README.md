# Flalingo AI Assistant

A powerful AI assistant that uses Retrieval Augmented Generation (RAG) to provide accurate responses based on historical conversations, knowledge base documents, and FAQs.

## Features

- Two-dimensional RAG system combining conversations and knowledge base
- Automatic vectorization of customer service conversations
- Knowledge base document processing and storage
- Multilingual FAQ support
- Real-time question answering with context
- Tab completion for quick responses
- Secure API endpoints with token authentication

## System Architecture

The system consists of several key services:

- **FreshchatService**: Handles interaction with Freshchat API for conversation management
- **QdrantService**: Manages vector storage for conversations
- **KnowledgeService**: Handles knowledge base document storage and retrieval
- **FAQService**: Manages multilingual FAQs with vector search capabilities
- **OpenAIService**: Provides embeddings and RAG-based responses

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Set up environment variables in `.env`:
```
OPENAI_API_KEY=your_openai_api_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
FRESHCHAT_API_TOKEN=your_freshchat_token
FRESHCHAT_API_URL=your_freshchat_url
API_TOKEN=your_api_token
```

## Usage

### Knowledge Base Management

The system supports storing and retrieving knowledge base articles. Articles are stored in a text file with a specific format:

```text
Title of Article 1
Content of article 1 goes here.
This can be multiple lines.
-----
Title of Article 2
Content of article 2 goes here.
Each article is separated by five dashes.
-----
```

To import knowledge base articles:
1. Place your articles in `knowledge_base.txt` at the root directory
2. Run the import script:
```bash
node src/scripts/importKnowledge.js
```

The system will:
- Split the content into separate articles using the "-----" separator
- Extract the first line as the title
- Generate embeddings for each article
- Store them in the 'knowledge' collection in Qdrant

### Importing FAQs

The system supports multilingual FAQs stored in a JSON format. Each FAQ entry should follow this structure:

```json
{
  "question": {
    "en": "English question",
    "tr": "Turkish question",
    "ru": "Russian question"
  },
  "answer": {
    "en": "English answer",
    "tr": "Turkish answer",
    "ru": "Russian answer"
  },
  "id": 1,
  "category_id": 5
}
```

To import FAQs:
1. Place your FAQ data in `faqs.json` at the root directory
2. Run the import script:
```bash
node src/scripts/importFAQs.js
```

### Using the API

The system provides several API endpoints:

1. Question Answering:
```
GET /api/flalingo-ai?question=xxx&token=yyyy
```
Returns an answer based on relevant conversations, knowledge base articles, and FAQs.

2. Tab Completion:
```
GET /api/flalingo-ai/tab-completion?typedKeys=xxx&token=yyyy
```
Provides smart completion suggestions for customer service responses.

### Vector Search

The system uses Qdrant for vector storage and similarity search:
- Conversations collection: Stores historical customer interactions
- Knowledge base collection: Stores documentation and articles
  - Each article has a title, content, and vector embedding
  - Search threshold: 0.7 (adjustable in knowledgeService.js)
  - Returns up to 3 most relevant articles
- FAQs collection: Stores multilingual FAQs with vector embeddings

## Debugging

Common issues and solutions:

1. Knowledge Base Import Issues:
   - Ensure articles are properly separated with "-----"
   - First line of each article must be the title
   - Articles should have meaningful content for better embeddings
   - Check file encoding is UTF-8

2. FAQ Import Issues:
   - Ensure FAQ JSON is properly formatted with language codes
   - Check that both question and answer fields contain valid JSON strings
   - Verify category_id is present or will default to 'general'

3. Search Results:
   - Knowledge base search threshold is set to 0.7 (adjustable in knowledgeService.js)
   - FAQ search threshold is set to 0.7 (adjustable in faqService.js)
   - Each search returns up to 4 most relevant FAQ entries
   - Knowledge base returns up to 3 most relevant articles

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 