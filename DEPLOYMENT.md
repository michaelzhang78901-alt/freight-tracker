# 🌐 Deployment Guide - Always Online

This guide shows you how to deploy your freight rate tracker so it's **always online** and automatically scraping data.

## 🚀 Quick Deploy Options

### Option 1: Heroku (Easiest - Free Tier Available)

**Step 1: Prepare for Heroku**
```bash
# Create Procfile
echo "web: node server.js" > Procfile

# Initialize git
git init
git add .
git commit -m "Initial commit"
```

**Step 2: Deploy to Heroku**
```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login and create app
heroku login
heroku create freight-rate-tracker

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

**Step 3: Set up scheduler addon (for automatic scraping)**
```bash
heroku addons:create scheduler:standard
heroku addons:open scheduler
```

In the scheduler dashboard, add:
- **Command**: `node fbx_scraper.js`
- **Frequency**: Every 6 hours

Your app is now live at: `https://freight-rate-tracker.herokuapp.com`

---

### Option 2: Railway.app (Modern, Simple)

**Step 1: Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/freight-rate-tracker.git
git push -u origin main
```

**Step 2: Deploy on Railway**
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Node.js and deploys!

**Step 3: Add Cron Job**
Railway automatically runs your `node-cron` schedule, so no extra setup needed!

Your app is live with auto-generated URL or custom domain.

---

### Option 3: Render.com (Free with Auto-Deploy)

**Step 1: Push to GitHub** (same as Railway)

**Step 2: Create Web Service on Render**
1. Go to https://render.com
2. New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

**Step 3: Add Cron Job**
Render has built-in cron jobs:
1. Dashboard → Cron Jobs → New Cron Job
2. **Command**: `node fbx_scraper.js`
3. **Schedule**: `0 */6 * * *` (every 6 hours)

---

### Option 4: DigitalOcean App Platform

**Step 1: Push to GitHub** (same as above)

**Step 2: Deploy**
1. Go to https://cloud.digitalocean.com/apps
2. Create App → GitHub
3. Select repo
4. DigitalOcean auto-configures

**Step 3: Add Scheduled Job**
In your app settings:
- Add a "Job" component
- Command: `node fbx_scraper.js`
- Schedule: Every 6 hours

---

### Option 5: AWS (EC2 - More Control)

**Step 1: Launch EC2 Instance**
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your code
git clone https://github.com/yourusername/freight-rate-tracker.git
cd freight-rate-tracker
npm install
```

**Step 2: Run with PM2 (Process Manager)**
```bash
# Install PM2
sudo npm install -g pm2

# Start server
pm2 start server.js --name freight-tracker

# Save PM2 config
pm2 save

# Set up PM2 to start on boot
pm2 startup

# View logs
pm2 logs freight-tracker
```

**Step 3: Set up Nginx (Optional)**
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/freight-tracker
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/freight-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔧 Environment Variables

For production, set these environment variables:

```bash
PORT=3001
NODE_ENV=production
```

**Heroku:**
```bash
heroku config:set NODE_ENV=production
```

**Railway/Render:**
Set in dashboard under "Environment Variables"

---

## 📊 Monitoring & Alerts

### UptimeRobot (Free Monitoring)

1. Go to https://uptimerobot.com
2. Add Monitor → HTTP(s)
3. URL: `https://your-app.com/api/health`
4. Interval: 5 minutes
5. Get email alerts if down

### Better Stack (Modern Alternative)

1. Go to https://betterstack.com
2. Add uptime monitor
3. Set up Slack/email notifications

---

## 🌍 Custom Domain

### Heroku
```bash
heroku domains:add www.yourfreighttracker.com
```

### Railway/Render
Add custom domain in dashboard settings

### DigitalOcean
Add domain in App Platform settings

Then update your DNS:
- **A Record**: Point to server IP
- **CNAME**: `www` → your-app-url

---

## 🔒 HTTPS/SSL

All platforms (Heroku, Railway, Render, DigitalOcean) provide **free SSL certificates automatically** via Let's Encrypt.

For AWS/custom servers:
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 📈 Scaling

### Heroku
```bash
# Scale to multiple dynos
heroku ps:scale web=2

# Upgrade dyno type
heroku ps:type web=standard-1x
```

### Railway/Render
Upgrade plan in dashboard for more resources

---

## 💾 Database Option (Optional)

If you want to use a database instead of JSON files:

### PostgreSQL on Heroku
```bash
heroku addons:create heroku-postgresql:mini
```

### MongoDB Atlas (Free)
1. Go to https://mongodb.com/atlas
2. Create free cluster
3. Get connection string
4. Update server.js to use MongoDB instead of JSON files

---

## 🎯 Recommended: Railway or Render

**Best for beginners:**
- ✅ Free tier available
- ✅ Auto-deploy from GitHub
- ✅ Built-in HTTPS
- ✅ Easy cron jobs
- ✅ No credit card required (Render)

**Start with Railway:**
1. Push code to GitHub
2. Connect to Railway
3. Done! Auto-deploys on every push

---

## 🔍 Troubleshooting

### Server not starting?
```bash
# Check logs
heroku logs --tail  # Heroku
railway logs        # Railway
render logs         # Render (in dashboard)
pm2 logs           # EC2
```

### Scraper failing?
- Check if Freightos changed their HTML structure
- Verify internet connectivity
- Check rate limits

### Data not persisting?
- Heroku: Use add-on storage or external DB
- Others: Should work with filesystem

---

## 📞 Support

If you get stuck:
1. Check platform-specific docs
2. View deployment logs
3. Test locally first with `npm start`

---

## 🎉 You're Live!

Once deployed, your freight rate tracker will:
- ✅ Run 24/7 online
- ✅ Auto-scrape every 6 hours
- ✅ Serve API and frontend
- ✅ Keep 90 days of history
- ✅ Never go down (with proper monitoring)

Share your live URL: `https://your-app.herokuapp.com` 🚀
