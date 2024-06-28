const WebSocket = require('ws');
const axios = require('axios');

const wss = new WebSocket.Server({ /* server options */ });

const broadcastData = async () => {
  const API_KEY= process.env.COINGECKO_API_KEY
  try {
    const response = await axios.get(`wss://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true&locale=en?x_cg_demo_api_key=${API_KEY}`);
    const bitcoinData = response.data;

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(bitcoinData));
      }
    });
  } catch (error) {
    console.error('Error fetching and broadcasting data:', error);
  }
};

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Set interval to fetch and broadcast data every 10 seconds
setInterval(broadcastData, 10000);