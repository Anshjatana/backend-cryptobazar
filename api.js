const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/market-data', async (req, res) => {

  const API_KEY = process.env.COINGECKO_API_KEY
  try {
    const response = await axios.get(
      `wss://api.coingecko.com/api/v3/coins/markets?x_cg_demo_api_key=${API_KEY}`,
      {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          page: 1,
          sparkline: true,
          locale: 'en',
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching data from CoinGecko:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

module.exports = router;