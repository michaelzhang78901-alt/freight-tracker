# Shanghai Freight Rate Differential Tracker

Real-time tracking and visualization of container shipping rate differences between Shanghai-LA and Shanghai-Rotterdam routes using live data from Freightos Baltic Index (FBX).

**🎯 100% JavaScript - No Python Required**

## 📊 Features

- **Live Data Scraping** from Freightos FBX (FBX01 & FBX11)
- **Real-time Differential Calculation** between routes
- **90-Day Historical Tracking** with daily data points
- **Beautiful Interactive Dashboard** with charts and tables
- **Automatic Updates** every 6 hours via node-cron
- **All-in-One Server** - scraping, API, and frontend hosting

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────┐      ┌─────────────┐
│  Freightos FBX  │ ───▶ │   Node.js    │ ───▶ │   JSON      │
│  Website        │      │   Scraper    │      │   Files     │
└─────────────────┘      └──────────────┘      └─────────────┘
                                                       │
                                                       ▼
                         ┌──────────────┐      ┌─────────────┐
                         │   React      │ ◀─── │  Express    │
                         │  Frontend    │      │  API Server │
                         └──────────────┘      └─────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 14+ (that's it!)

### Installation

```bash
# Install dependencies
npm install

# Run the all-in-one server
npm start
```

The server will:
1. Start on `http://localhost:3001`
2. Run an initial scrape of FBX data
3. Schedule automatic scrapes every 6 hours
4. Serve the API and frontend

### Manual Scraping

```bash
# Run scraper manually
npm run scrape
```

## 📅 How It Works

### Automatic Scraping
The server uses `node-cron` to automatically scrape FBX data every 6 hours. No external cron setup needed!

### Data Storage
- `fbx_rates.json` - Current rates
- `fbx_history.json` - Last 90 days of data

## 🔌 API Endpoints

### GET `/api/current`
Returns current FBX rates

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2026-02-06T10:30:00.000Z",
    "routes": {
      "FBX01": {
        "rate": 2668.40,
        "description": "Shanghai → LA"
      },
      "FBX11": {
        "rate": 2778.80,
        "description": "Shanghai → Rotterdam"
      }
    },
    "differential": {
      "amount": -110.40,
      "percentage": -3.97,
      "interpretation": "Rotterdam Premium"
    }
  }
}
```

### GET `/api/history`
Returns 90 days of historical data

### GET `/api/differential`
Returns current differential calculation

### POST `/api/scrape`
Triggers immediate scrape (manual override)

### GET `/api/health`
Health check with data status

## 📁 File Structure

```
project/
├── server.js                    # All-in-one server (scraper + API + cron)
├── fbx_scraper.js              # Standalone scraper (optional)
├── freight-rate-comparison.jsx # React component
├── package.json                # Dependencies
├── fbx_rates.json             # Current rates (auto-generated)
├── fbx_history.json           # Historical data (auto-generated)
├── README.md                  # This file
└── DEPLOYMENT.md              # How to deploy online
```

## 🌐 Deploy Online (Always Running)

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on deploying to:
- **Heroku** (easiest)
- **Railway.app** (modern)
- **Render.com** (free)
- **DigitalOcean**
- **AWS EC2**

### Quick Deploy to Railway:

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git push

# Deploy on Railway
# 1. Go to railway.app
# 2. New Project → Deploy from GitHub
# 3. Done! Auto-deploys and runs 24/7
```

## 🎨 React Component Usage

```jsx
import FreightRateComparison from './freight-rate-comparison';

function App() {
  return (
    <div className="App">
      <FreightRateComparison />
    </div>
  );
}
```

Include fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
```

## 🔍 Current Data (Feb 6, 2026)

- **Shanghai → LA (FBX01)**: $2,668.40 per 40ft container
- **Shanghai → Rotterdam (FBX11)**: $2,778.80 per 40ft container
- **Differential**: Rotterdam is **$110.40 MORE expensive**
- **Percentage**: 3.97% Rotterdam Premium

## 🛠️ Configuration

### Change Scraping Frequency

Edit `server.js`:
```javascript
// Current: every 6 hours
cron.schedule('0 */6 * * *', runScraper);

// Every hour:
cron.schedule('0 * * * *', runScraper);

// Every day at midnight:
cron.schedule('0 0 * * *', runScraper);
```

### Cron Schedule Format
```
 ┌────────── minute (0-59)
 │ ┌──────── hour (0-23)
 │ │ ┌────── day of month (1-31)
 │ │ │ ┌──── month (1-12)
 │ │ │ │ ┌── day of week (0-7)
 │ │ │ │ │
 * * * * *
```

## ⚠️ Important Notes

1. **Rate Limits**: Scraper includes 2-second delays between requests
2. **Data Accuracy**: Scraped from public FBX pages
3. **Legal**: Ensure compliance with Freightos' terms of service
4. **Error Handling**: Server continues running even if scraping fails

## 🚢 Understanding the Routes

### FBX01 - Shanghai to LA/West Coast
- Shanghai (CNSHA), Ningbo (CNNGB) → Los Angeles (USLAX), Oakland (USOAK)

### FBX11 - Shanghai to Rotterdam/Northern Europe  
- Shanghai (CNSHA), Ningbo (CNNGB) → Rotterdam (NLRTM), Hamburg (DEHAM)

## 📈 What the Differential Means

- **Positive (LA Premium)**: Higher demand for US shipping
- **Negative (Rotterdam Premium)**: Higher demand for European shipping

Factors: seasonal demand, fuel costs, port congestion, supply chain issues

## 🛠️ Troubleshooting

### Server won't start
```bash
# Check Node version
node --version  # Should be 14+

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Scraper returns null
- Freightos may have changed their HTML structure
- Check internet connection
- Verify URLs are still valid

### Data not saving
- Check file permissions in directory
- Ensure disk space available

## 📊 npm Scripts

```bash
npm start         # Start server (scrape + API + cron)
npm run scrape    # Run scraper once
npm run dev       # Development mode with auto-restart
```

## 📜 License

Educational and personal use. Respect Freightos' terms of service.

## 🎉 Ready to Deploy?

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions to get your tracker online 24/7!

---

**Built with:** Node.js • Express • Cheerio • node-cron • React • Recharts  
**Data Source:** Freightos Baltic Index (FBX)
