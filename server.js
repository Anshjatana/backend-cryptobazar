require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const axios = require('axios');

const app = express();
const port = 3000;

// Setup WebSocket server
const wss = new WebSocket.Server({ port: 3030 });

// Function to fetch data from CoinGecko
const fetchData = async (retryCount = 0) => {
  const API_KEY = process.env.COINGECKO_API_KEY;
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/markets`,
      {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          page: 1,
          sparkline: true,
          locale: 'en',
          x_cg_demo_api_key: API_KEY,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      const retryAfter =
        parseInt(error.response.headers['retry-after'], 10) ||
        (retryCount + 1);
      console.error(
        `Too many requests. Retrying after ${retryAfter} seconds.`
      );
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return fetchData(retryCount + 1);
    } else {
      console.error('Error fetching data from CoinGecko:', error);
      throw error;
    }
  }
};

// Broadcast data to all connected WebSocket clients
const broadcastData = async () => {
  try {
    const data = await fetchData();
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  } catch (error) {
    console.error('Error broadcasting data:', error);
  }
};

// Set interval to fetch and broadcast data every 2 seconds
setInterval(broadcastData, 2000);

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send initial data upon connection
  fetchData()
    .then((data) => ws.send(JSON.stringify(data)))
    .catch((error) => console.error('Error sending initial data:', error));

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Import and use API routes
const apiRoutes = require('./api');
app.use('/api', apiRoutes);

// Start HTTP server
app.listen(port, () => {
  console.log(`HTTP server listening on port ${port}`);
});