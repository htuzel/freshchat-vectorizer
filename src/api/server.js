import express from 'express';
import { config } from '../config.js';
import { openaiService } from '../services/openaiService.js';
import { qdrantService } from '../services/qdrantService.js';
import { freshchatService } from '../services/freshchatService.js';
import { processingJob } from '../jobs/processingJob.js';
import freshchatWebhook from '../webhooks/freshchatWebhook.js';

const app = express();
app.use(express.json());

// Initialize webhook routes
app.use('/webhooks', freshchatWebhook);

// Middleware to check API token
const authenticateToken = (req, res, next) => {
  const token = req.query.token;

  if (!token) {
    return res.status(401).json({ error: "API token is required" });
  }

  if (token !== config.api.token) {
    return res.status(403).json({ error: "Invalid API token" });
  }

  next();
};

// RAG endpoint
app.get("/api/flalingo-ai", authenticateToken, async (req, res) => {
  try {
    const { question } = req.query;

        if (!question) {
            return res.status(400).json({ error: 'Question parameter is required' });
        }

        const result = await openaiService.answerWithRAG(question);
        
        res.json({
            success: true,
            answer: result.answer,
            metadata: {
                similar_conversations: result.sources.conversations.length,
                knowledge_articles: result.sources.knowledge.length
            }
        });
    } catch (error) {
        console.error('Error processing RAG request:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while processing your request'
        });
    }
});

app.get(
  "/api/flalingo-ai/tab-completion",
  authenticateToken,
  async (req, res) => {
    try {
      const { typedKeys, lastMessage } = req.query;

      if (!typedKeys) {
        return res
          .status(400)
          .json({ error: "typedKeys parameter is required" });
      }

      const result = await openaiService.tabCompletionWithRAG(
        typedKeys,
        lastMessage
      );
      res.json({
        success: true,
        completion: result,
      });
    } catch (error) {
      console.error("Error processing tab completion:", error);
      res.status(500).json({
        success: false,
        error: "An error occurred while processing your request",
      });
    }
  }
);
// Historical data import endpoint
app.get('/api/import-historical', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        
        // Initialize Qdrant collection if it doesn't exist
        await qdrantService.initializeCollection();

        // Fetch and store historical conversations
        const result = await freshchatService.getHistoricalConversations(
            new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        );

        res.json({
            success: true,
            message: `Successfully processed ${result.processedUsers} users with ${result.totalConversations} total conversations`,
            details: result
        });
    } catch (error) {
        console.error('Import failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Freshchat connection test endpoint
app.get('/api/test-freshchat', async (req, res) => {
    try {
        const result = await freshchatService.testConnection();
        res.json({ 
            success: result,
            message: 'Successfully connected to Freshchat API'
        });
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            }
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
  });
});

// Initialize function
async function initialize() {
    try {
        await qdrantService.initializeCollection();
        processingJob.start();
        console.log('Server initialization completed successfully');
    } catch (error) {
        console.error('Server initialization failed:', error);
        process.exit(1);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Flalingo AI API server running on port ${PORT}`);
    initialize();
}); 
