/**
 * All-in-One Freight Rate Tracker Server
 * 
 * This server:
 * 1. Scrapes FBX data automatically on schedule
 * 2. Serves scraped data via REST API
 * 3. Hosts the React frontend (static build)
 * 
 * Usage:
 *   npm install express cors axios cheerio node-cron
 *   node server.js
 * 
 * The server will:
 * - Scrape data every 6 hours automatically
 * - Provide API endpoints for frontend
 * - Keep 90 days of historical data
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('build')); // Serve React build folder

// File paths
const CURRENT_DATA_FILE = path.join(__dirname, 'fbx_rates.json');
const HISTORY_DATA_FILE = path.join(__dirname, 'fbx_history.json');

// ============================================================================
// SCRAPER CLASS
// ============================================================================

class FBXScraper {
  constructor() {
    this.baseUrl = 'https://www.freightos.com/enterprise/terminal';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    };
  }

  async scrapeRoute(routeCode, routeName) {
    const url = `${this.baseUrl}/${routeName}/`;
    
    try {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      let rate = null;
      
      // Look for "Current FBX" and nearby price
      $('*:contains("Current FBX")').each((i, elem) => {
        const text = $(elem).text();
        const match = text.match(/\$([0-9,]+\.?\d*)/);
        if (match && !rate) {
          rate = parseFloat(match[1].replace(/,/g, ''));
        }
      });
      
      return rate && rate > 0 && rate < 50000 ? rate : null;
      
    } catch (error) {
      console.error(`Error scraping ${routeCode}:`, error.message);
      return null;
    }
  }

  async scrapeAllRoutes() {
    console.log(`\n[${new Date().toLocaleString()}] 🚢 Starting FBX scrape...`);
    
    const routes = {
      'FBX01': 'fbx-01-china-to-north-america-west-coast',
      'FBX11': 'fbx-11-china-to-northern-europe'
    };
    
    const results = {
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      routes: {}
    };
    
    for (const [code, name] of Object.entries(routes)) {
      const rate = await this.scrapeRoute(code, name);
      if (rate) {
        results.routes[code] = {
          rate,
          description: code === 'FBX01' ? 'Shanghai → LA' : 'Shanghai → Rotterdam',
          currency: 'USD',
          unit: 'per 40ft container'
        };
        console.log(`  ✓ ${code}: $${rate.toFixed(2)}`);
      }
      await this.sleep(2000);
    }
    
    // Calculate differential
    if (results.routes.FBX01 && results.routes.FBX11) {
      const diff = results.routes.FBX01.rate - results.routes.FBX11.rate;
      results.differential = {
        amount: parseFloat(diff.toFixed(2)),
        percentage: parseFloat(((diff / results.routes.FBX11.rate) * 100).toFixed(2)),
        interpretation: diff >= 0 ? 'LA Premium' : 'Rotterdam Premium'
      };
      console.log(`  📊 Differential: $${Math.abs(diff).toFixed(2)} (${results.differential.interpretation})`);
    }
    
    return results;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// DATA STORAGE
// ============================================================================

async function saveData(data) {
  await fs.writeFile(CURRENT_DATA_FILE, JSON.stringify(data, null, 2));
  
  // Update history
  let history = [];
  try {
    const existing = await fs.readFile(HISTORY_DATA_FILE, 'utf8');
    history = JSON.parse(existing);
  } catch (e) {}
  
  history.push({
    date: data.date,
    timestamp: data.timestamp,
    fbx01: data.routes.FBX01?.rate || null,
    fbx11: data.routes.FBX11?.rate || null,
    differential: data.differential?.amount || null
  });
  
  // Keep 90 days
  if (history.length > 90) {
    history = history.slice(-90);
  }
  
  await fs.writeFile(HISTORY_DATA_FILE, JSON.stringify(history, null, 2));
  console.log(`  ✅ Data saved (${history.length} days in history)\n`);
}

async function loadCurrentData() {
  try {
    const data = await fs.readFile(CURRENT_DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

async function loadHistoryData() {
  try {
    const data = await fs.readFile(HISTORY_DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// ============================================================================
// SCHEDULED SCRAPING
// ============================================================================

const scraper = new FBXScraper();

async function runScraper() {
  try {
    const data = await scraper.scrapeAllRoutes();
    if (data && Object.keys(data.routes).length > 0) {
      await saveData(data);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Scraper error:', error);
    return false;
  }
}

// Schedule scraping every 6 hours: 0 */6 * * *
// For testing, use every 5 minutes: */5 * * * *
cron.schedule('0 */6 * * *', () => {
  console.log('\n⏰ Scheduled scrape triggered');
  runScraper();
});

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * GET /api/current
 * Returns current FBX rates
 */
app.get('/api/current', async (req, res) => {
  try {
    const data = await loadCurrentData();
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'No data available. Run initial scrape first.'
      });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/history
 * Returns historical FBX data (last 90 days)
 */
app.get('/api/history', async (req, res) => {
  try {
    const data = await loadHistoryData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/differential
 * Returns current differential calculation
 */
app.get('/api/differential', async (req, res) => {
  try {
    const data = await loadCurrentData();
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'No data available'
      });
    }
    
    const fbx01 = data.routes?.FBX01?.rate;
    const fbx11 = data.routes?.FBX11?.rate;
    
    if (!fbx01 || !fbx11) {
      throw new Error('Missing rate data');
    }
    
    res.json({
      success: true,
      data: {
        fbx01,
        fbx11,
        differential: data.differential?.amount || (fbx01 - fbx11),
        percentage: data.differential?.percentage || ((fbx01 - fbx11) / fbx11 * 100),
        interpretation: data.differential?.interpretation || (fbx01 >= fbx11 ? 'LA Premium' : 'Rotterdam Premium'),
        timestamp: data.timestamp
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/scrape
 * Trigger immediate scrape
 */
app.post('/api/scrape', async (req, res) => {
  try {
    console.log('\n🔄 Manual scrape triggered via API');
    const success = await runScraper();
    
    if (success) {
      const data = await loadCurrentData();
      res.json({
        success: true,
        message: 'Scraping completed successfully',
        data
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Scraping failed'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/health
 * Health check
 */
app.get('/api/health', async (req, res) => {
  const data = await loadCurrentData();
  const history = await loadHistoryData();
  
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dataAvailable: !!data,
    historicalPoints: history.length,
    lastUpdate: data?.timestamp || null
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, async () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🚢 Freight Rate Tracker - All-in-One Server              ║
║  Running on http://localhost:${PORT}                        ║
╚═══════════════════════════════════════════════════════════╝

📡 API Endpoints:
  GET  /api/current      - Current FBX rates
  GET  /api/history      - Historical data (90 days)
  GET  /api/differential - Current differential
  POST /api/scrape       - Trigger immediate scrape
  GET  /api/health       - Health check

⏰ Auto-scraping: Every 6 hours
🌐 Frontend: Served from /build directory

Starting initial scrape...
  `);

  // Run initial scrape on startup
  const data = await loadCurrentData();
  if (!data) {
    console.log('📥 No existing data found. Running initial scrape...');
    await runScraper();
  } else {
    console.log(`✅ Loaded existing data from ${data.timestamp}`);
    
    // Check if data is old (>6 hours)
    const lastUpdate = new Date(data.timestamp);
    const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / 1000 / 60 / 60;
    
    if (hoursSinceUpdate > 6) {
      console.log(`⚠️  Data is ${hoursSinceUpdate.toFixed(1)} hours old. Running fresh scrape...`);
      await runScraper();
    }
  }
  
  console.log('\n✨ Server ready! Press Ctrl+C to stop.\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
