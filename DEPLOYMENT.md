# Deployment Guide

This guide covers deploying the Fleet Management Platform to various hosting providers.

## 📋 Pre-Deployment Checklist

- [x] All tests passing
- [x] Build succeeds (`npm run build`)
- [x] Lint passes (`npm run lint`)
- [x] TypeScript compiles (`npx tsc --noEmit`)
- [x] Environment variables documented
- [x] Database migrations ready

## 🚀 Deployment Options

### Option 1: Vercel (Recommended - Easiest)

Vercel is the easiest option as it's made by the Next.js team.

#### Steps:

1. **Push code to GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/fleet-management.git
git push -u origin main
```

2. **Deploy to Vercel**
   - Visit https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - Framework: Next.js (auto-detected)
     - Build Command: `npm run build`
     - Output Directory: `.next`
3. **Set Environment Variables**

   - Go to Project Settings → Environment Variables
   - Add `DATABASE_URL`:
     ```
     postgresql://user:password@host:5432/dbname
     ```
   - Use a PostgreSQL provider (see below)

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app is live! 🎉

#### Database Options for Vercel:

**Neon (Recommended)**

- Free tier available
- Serverless PostgreSQL
- Visit https://neon.tech
- Create database
- Copy connection string to `DATABASE_URL`

**Supabase**

- Free tier with 500MB
- Visit https://supabase.com
- Create project
- Get connection string from Settings → Database
- Copy to `DATABASE_URL`

**Railway**

- Free tier: $5 credit/month
- Visit https://railway.app
- Create PostgreSQL database
- Copy connection string

### Option 2: Netlify

1. **Build configuration**

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

2. **Deploy**
   - Push to GitHub
   - Visit https://netlify.com
   - Import repository
   - Set environment variables
   - Deploy

### Option 3: Railway

Railway is great for full-stack apps with databases.

1. **Deploy via GitHub**

   - Visit https://railway.app
   - Connect GitHub repository
   - Add PostgreSQL database (automatic)
   - Environment variables are set automatically

2. **Configure**

   - Add build command: `npm run build`
   - Add start command: `npm start`
   - Set PORT: 3000

3. **Migrate database**

```bash
railway run npx prisma migrate deploy
```

### Option 4: DigitalOcean App Platform

1. **Create App**

   - Visit https://cloud.digitalocean.com/apps
   - Create new app from GitHub
   - Select repository

2. **Configure**

   - Build command: `npm run build`
   - Run command: `npm start`
   - HTTP Port: 3000

3. **Add Database**
   - Create Managed PostgreSQL database
   - Link to app
   - Set `DATABASE_URL` automatically

### Option 5: Self-Hosted (VPS)

For AWS EC2, DigitalOcean Droplet, Linode, etc.

#### Steps:

1. **Set up server**

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2
```

2. **Clone and build**

```bash
git clone https://github.com/yourusername/fleet-management.git
cd fleet-management
npm install
npm run build
```

3. **Set up database**

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb fleetdb
sudo -u postgres createuser fleetuser -P

# Set DATABASE_URL in .env
echo 'DATABASE_URL="postgresql://fleetuser:password@localhost:5432/fleetdb"' > .env

# Run migrations
npx prisma migrate deploy
```

4. **Start with PM2**

```bash
pm2 start npm --name "fleet-management" -- start
pm2 save
pm2 startup
```

5. **Set up Nginx reverse proxy**

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

6. **SSL with Let's Encrypt**

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 🗄️ Database Migration

### From SQLite to PostgreSQL

1. **Export data from SQLite**

```bash
# Install sqlite3
npm install -D sqlite3

# Create export script
node -e "
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./dev.db');

db.serialize(() => {
  db.all('SELECT * FROM Participant', (err, rows) => {
    console.log(JSON.stringify(rows));
  });
});
"
```

2. **Update schema for PostgreSQL**

In `prisma/schema.prisma`, change:

```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

3. **Run migrations**

```bash
npx prisma migrate dev --name switch_to_postgresql
```

4. **Import data** (use Prisma scripts or SQL)

## 🔐 Environment Variables

### Required Variables

```bash
# Production database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Optional: Node environment
NODE_ENV="production"
```

### Security Best Practices

1. **Never commit `.env` files**

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo "dev.db" >> .gitignore
```

2. **Use strong database passwords**

```bash
# Generate random password
openssl rand -base64 32
```

3. **Restrict database access**
   - Use firewall rules
   - Whitelist only your app's IP
   - Use SSL for database connections

## 📊 Performance Optimization

### 1. Database Indexes (Already implemented)

```prisma
@@index([vehicleId, timestamp])
@@index([timestamp])
```

### 2. Connection Pooling

For production PostgreSQL:

```
DATABASE_URL="postgresql://user:password@host:5432/dbname?pgbouncer=true&connection_limit=20"
```

### 3. CDN for Static Assets

Vercel includes CDN by default. For others:

- Use Cloudflare
- Or AWS CloudFront
- Serves assets from edge locations

### 4. Caching

Add caching headers in `next.config.ts`:

```typescript
module.exports = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=60" }],
      },
    ];
  },
};
```

## 🔍 Monitoring & Logging

### Error Tracking

**Sentry Integration**

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### Uptime Monitoring

Free options:

- UptimeRobot (https://uptimerobot.com)
- StatusCake (https://statuscake.com)
- Pingdom (https://pingdom.com)

### Analytics

**Vercel Analytics** (if using Vercel)

```bash
npm install @vercel/analytics
```

In `app/layout.tsx`:

```typescript
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## 🧪 Staging Environment

Best practice: Set up staging before production.

### Vercel Staging

- Each git branch gets a preview URL
- `main` branch = production
- Other branches = staging

### Manual Staging

```bash
# Create staging environment variable
STAGING_DATABASE_URL="postgresql://user:password@staging-host:5432/staging-db"

# Deploy to staging subdomain
# staging.yourdomain.com
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 🚨 Troubleshooting

### Build Failures

**Issue**: Out of memory

```bash
# Solution: Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

**Issue**: Prisma client not found

```bash
# Solution: Generate before build
npx prisma generate
npm run build
```

### Database Connection Issues

**Issue**: Connection timeout

```bash
# Check database is accessible
pg_isready -h host -p 5432

# Test connection
psql postgresql://user:password@host:5432/dbname
```

**Issue**: SSL required

```
# Add SSL to connection string
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

### Performance Issues

**Issue**: Slow queries

```bash
# Enable query logging
# In prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["tracing"]
}
```

## 📈 Post-Deployment

### 1. Smoke Tests

- [ ] Visit homepage
- [ ] Test CSV imports
- [ ] Check dashboard loads
- [ ] Verify theme toggle
- [ ] Test on mobile

### 2. Load Testing

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test 1000 requests, 10 concurrent
ab -n 1000 -c 10 https://yourdomain.com/
```

### 3. SEO Setup

- Add sitemap.xml
- Configure robots.txt
- Set up Google Analytics
- Submit to Google Search Console

### 4. Backup Strategy

- Automated daily database backups
- Keep last 7 days
- Store in separate location

## ✅ Deployment Checklist

Before going live:

- [ ] All tests passing
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] SSL certificate installed
- [ ] Domain name configured
- [ ] Error tracking set up
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Performance tested
- [ ] Security headers configured
- [ ] CORS properly set (if needed)
- [ ] Rate limiting added (if public API)

## 🎉 Success!

Your Fleet Management Platform is now live!

Share your deployment:

- Tweet about it
- Post on LinkedIn
- Add to your portfolio
- Show it in your pitch deck

---

**Need help?** Check the Next.js deployment docs: https://nextjs.org/docs/deployment
