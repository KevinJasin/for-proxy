import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = 3000; // You can change the port if needed

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Enable JSON parsing for POST requests

// Set your Hugging Face API Key here
const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;

// Function to analyze sentiment using Hugging Face API
async function analyzeSentiment(text) {
    const url = 'https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: [text] }) // Send text as an array
        });

        console.log("Hugging Face Response Status:", response.status); // Log response status

        if (!response.ok) {
            throw new Error(`Hugging Face API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Hugging Face Response Data:", data); // Log response data

        // Check if data has valid sentiment label
        if (!data[0] || !data[0].label) {
            throw new Error("Invalid response format from Hugging Face API");
        }

        const score = data[0].label; // Get the sentiment label

        // Convert the sentiment label to a score (1-10)
        let positivityScore;
        switch (score) {
            case 'POSITIVE':
                positivityScore = 10;
                break;
            case 'NEGATIVE':
                positivityScore = 1;
                break;
            case 'NEUTRAL':
                positivityScore = 5;
                break;
            default:
                positivityScore = null; // Fallback for unknown labels
        }

        return positivityScore;

    } catch (error) {
        console.error("Error analyzing sentiment:", error);
        return null; // Return null for failed analysis
    }
}

// News API endpoint
app.get('/news', async (req, res) => {
    const topic = req.query.topic;
    const NEWS_API_KEY = process.env.NEWS_API_KEY; // Use .env for your API keys
    const url = `https://newsapi.org/v2/everything?q=${topic}&apiKey=${NEWS_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data); // Send the data back to the client
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Sentiment analysis endpoint
app.post('/analyze-sentiment', async (req, res) => {
    const { text } = req.body; // Extract text from request body

    if (!text) {
        return res.status(400).json({ error: 'Text is required for sentiment analysis.' });
    }

    try {
        const score = await analyzeSentiment(text);
        if (score === null) {
            return res.status(500).json({ error: 'Could not analyze sentiment.' });
        }
        res.json({ sentimentScore: score });
    } catch (error) {
        console.error('Error processing sentiment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});
