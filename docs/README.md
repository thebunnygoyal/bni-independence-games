# BNI Independence Games 2.0 Documentation

## Overview
BNI Independence Games 2.0 is a gamified performance tracking dashboard designed for BNI chapters to compete and track their metrics during regional competitions.

## Features

### MVP Core Features
1. **Live Leaderboard System**
   - Real-time chapter rankings
   - Coin-based scoring system
   - Visual podium for top 3 chapters
   - Chapter cards with performance metrics

2. **Metric Input Dashboard**
   - Track 6 key BNI metrics:
     - Referrals
     - Visitors
     - Attendance
     - Testimonials
     - Trainings
     - Net Retention (Inductions + Renewals - Drops)
   - Real-time metric updates
   - Progress bars for each metric
   - Achievement tracking

3. **Data Export**
   - CSV export functionality
   - Google Looker Studio integration
   - Excel and JSON export options

## Technical Stack
- **Frontend**: React + Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: GitHub Pages
- **State Management**: React Hooks
- **Data**: Demo data with fallback support

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Git installed
- GitHub account

### Installation
```bash
git clone https://github.com/your-username/bni-independence-games.git
cd bni-independence-games
npm install
```

### Development
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) to view in browser.

### Deployment
```bash
npm run deploy
```
The app will be deployed to GitHub Pages.

## Usage Guide

### Dashboard View
- View live leaderboard with all chapters
- See daily challenges and rewards
- Monitor real-time activities
- Access chapter details by clicking cards

### Battle Arena
- Epic battle display for top positions
- Category champions showcase
- Weekly performance grid

### Executive Summary
- Key metrics overview
- Professional leaderboard table
- Growth tracking
- Efficiency monitoring

### Performance Management
- Update chapter metrics
- Track retention scores
- Monitor achievement progress

### Export & Integration
- Connect to Google Looker Studio
- Export data in multiple formats
- Set up automated syncing

## Architecture

### Component Structure
```
IndependenceGames (Main Component)
├── ErrorBoundary
├── Header
├── Navigation Tabs
├── Live Activity Feed
└── Main Content
    ├── Dashboard View
    ├── Battle Arena View
    ├── Executive Summary View
    ├── Performance View
    └── Export View
```

### State Management
- `appState`: UI state (active view, modals, sync status)
- `gameData`: Chapter data and metrics
- `liveActivities`: Real-time activity feed
- `animatingCoins`: Animation states
- `timeRemaining`: Game countdown timer

## Scoring System

### Individual Coins
- Referrals: 1 coin each
- Visitors: 50 coins each
- Attendance: -10 coins per % below 100
- Testimonials: 5 coins each (capped at 2x members)
- Trainings: 25 coins each (capped at 3x members)

### Chapter Coins
- Referrals: 500 coins per member ratio
- Visitors: 10,000 coins per member ratio
- Attendance: -1000 coins if below 95%
- Testimonials: 1000 coins per member ratio
- Trainings: 5000 coins per member ratio

## Customization

### Team Profiles
Edit the `teamProfiles` object in `IndependenceGames.js` to customize:
- Avatar emojis
- Special abilities
- Team mottos

### Colors
Update `tailwind.config.js` for custom colors:
- `bni-red`: #EF4444
- `bni-orange`: #F97316

### Game Duration
Modify `timeRemaining` state for different competition lengths.

## Future Enhancements
- Mobile app version
- Advanced analytics
- Custom achievement badges
- Email notifications
- Historical trending
- Multi-region support
- Real-time WebSocket integration
- Backend API implementation

## Support
For issues or feature requests, please create an issue on GitHub.

## License
Proprietary - BNI Independence Games 2.0