const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Proxy endpoint for dati.gov.it API
app.get('/api/prezziari/search', async (req, res) => {
    try {
        const query = req.query.q || 'prezzario';
        const rows = req.query.rows || 50;

        const url = `https://dati.gov.it/opendata/api/3/action/package_search?q=${encodeURIComponent(query)}&rows=${rows}`;

        console.log(`Fetching from: ${url}`);

        const response = await fetch(url);
        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error('Error fetching from dati.gov.it:', error);
        res.status(500).json({
            error: 'Failed to fetch price lists',
            message: error.message
        });
    }
});

// Proxy endpoint for specific dataset details
app.get('/api/prezziari/dataset/:id', async (req, res) => {
    try {
        const datasetId = req.params.id;
        const url = `https://dati.gov.it/opendata/api/3/action/package_show?id=${encodeURIComponent(datasetId)}`;

        console.log(`Fetching dataset: ${url}`);

        const response = await fetch(url);
        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error('Error fetching dataset:', error);
        res.status(500).json({
            error: 'Failed to fetch dataset',
            message: error.message
        });
    }
});

// Proxy endpoint for downloading CSV files
app.get('/api/prezziari/download', async (req, res) => {
    try {
        const fileUrl = req.query.url;

        if (!fileUrl) {
            return res.status(400).json({ error: 'URL parameter is required' });
        }

        console.log(`Downloading file from: ${fileUrl}`);

        const response = await fetch(fileUrl);
        const text = await response.text();

        res.set('Content-Type', 'text/csv');
        res.send(text);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({
            error: 'Failed to download file',
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Proxy server is running' });
});

app.listen(PORT, () => {
    console.log(`🚀 EdilSmart Proxy Server running on http://localhost:${PORT}`);
    console.log(`📡 Ready to proxy requests to dati.gov.it`);
});
