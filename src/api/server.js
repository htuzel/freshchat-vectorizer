import express from "express";
import { config } from "../config.js";
import { openaiService } from "../services/openaiService.js";

const app = express();
const port = process.env.PORT || 3000;

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
      return res.status(400).json({ error: "Question parameter is required" });
    }

    // Rate limiting check could be added here

    const result = await openaiService.answerWithRAG(question);

    res.json({
      success: true,
      answer: result.answer,
      metadata: {
        similar_conversations: result.sources.conversations.length,
        knowledge_articles: result.sources.knowledge.length,
      },
    });
  } catch (error) {
    console.error("Error processing RAG request:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while processing your request",
    });
  }
});

app.get(
  "/api/flalingo-ai/tab-completion",
  authenticateToken,
  async (req, res) => {
    try {
      const { typedKeys, lastMessage } = req.query;
      const result = await openaiService.tabCompletionWithRAG(
        typedKeys,
        lastMessage
      );
      res.json(result);
    } catch (error) {
      console.error("Error processing tab completion:", error);
      res.status(500).json({
        success: false,
        error: "An error occurred while processing your request",
      });
    }
  }
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
  });
});

app.listen(port, () => {
  console.log(`Flalingo AI API server running on port ${port}`);
});
