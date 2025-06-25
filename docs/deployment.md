# Deployment Guide

## GitHub Pages Deployment

### Prerequisites
1. GitHub account
2. Repository created
3. Node.js 18+ installed locally
4. Git configured

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/bni-independence-games.git
   cd bni-independence-games
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure homepage in package.json**
   ```json
   "homepage": "https://your-username.github.io/bni-independence-games"
   ```

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages**
   ```bash
   npm run deploy
   ```

### Automatic Deployment (CI/CD)

The repository includes GitHub Actions workflow for automatic deployment.

**Workflow file: `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          PUBLIC_URL: ${{ github.repository }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@v4
```

### Enabling GitHub Pages

1. Go to repository Settings
2. Navigate to Pages section
3. Select Source: "Deploy from a branch"
4. Select Branch: "gh-pages"
5. Select Folder: "/ (root)"
6. Save

### Custom Domain Setup

1. **Add CNAME file to public folder**
   ```
   yourdomain.com
   ```

2. **Configure DNS**
   - A Records:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   - CNAME Record:
     ```
     www -> your-username.github.io
     ```

### Environment Variables

Create `.env` file for local development:
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001
```

For production, set in GitHub Secrets:
- `REACT_APP_API_URL`
- `REACT_APP_WS_URL`

### Backend Deployment Options

#### Option 1: Vercel
```bash
npm i -g vercel
vercel
```

#### Option 2: Railway
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

#### Option 3: Azure App Service
```bash
az webapp up --name bni-games-api --resource-group bni-rg
```

### Database Setup (Supabase)

1. Create Supabase project
2. Run migrations:
   ```sql
   CREATE TABLE chapters (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     captain TEXT,
     coach TEXT,
     members INTEGER,
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   CREATE TABLE metrics (
     id SERIAL PRIMARY KEY,
     chapter_id TEXT REFERENCES chapters(id),
     metric_type TEXT,
     value INTEGER,
     timestamp TIMESTAMP DEFAULT NOW()
   );
   ```

3. Update environment variables with Supabase URL and keys

### Monitoring & Analytics

1. **Google Analytics**
   ```html
   <!-- Add to public/index.html -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
   ```

2. **Sentry Error Tracking**
   ```bash
   npm install @sentry/react
   ```

### Performance Optimization

1. **Enable Cloudflare**
   - Add site to Cloudflare
   - Configure caching rules
   - Enable Auto Minify

2. **Image Optimization**
   - Use WebP format
   - Implement lazy loading
   - Optimize favicon

### Troubleshooting

**404 Error on refresh**
- Add 404.html to public folder
- Copy index.html content to 404.html

**Build failures**
- Check Node version compatibility
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall

**Deployment not updating**
- Clear GitHub Pages cache
- Check gh-pages branch
- Verify workflow permissions

### Rollback Procedure

1. **Via GitHub**
   - Go to Actions tab
   - Select previous successful deployment
   - Click "Re-run all jobs"

2. **Via Git**
   ```bash
   git checkout gh-pages
   git reset --hard <previous-commit>
   git push --force
   ```

### Health Checks

- Site availability: https://your-site.com
- API health: https://api.your-site.com/health
- WebSocket: wss://ws.your-site.com/health