import express from 'express';
import { qdrantService } from './services/qdrantService.js';
import { freshchatService } from './services/freshchatService.js';
import { processingJob } from './jobs/processingJob.js';
import freshchatWebhook from './webhooks/freshchatWebhook.js';

const app = express();
app.use(express.json());

// Initialize webhook routes
app.use('/webhooks', freshchatWebhook);

// New endpoint to trigger historical data import
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

// Add this new endpoint
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

// Modify the initialize function to only set up the collection and start the job
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
    console.log(`Server is running on port ${PORT}`);
    initialize();
}); 