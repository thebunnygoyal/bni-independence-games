# Technical Architecture

## System Overview

BNI Independence Games 2.0 is built as a modern single-page application (SPA) using React with a focus on performance, scalability, and user experience.

## Frontend Architecture

### Technology Stack
- **React 18.3.1**: Core framework for building UI components
- **Tailwind CSS 3.4.4**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography
- **Axios**: HTTP client for API requests (mocked for demo)

### Component Hierarchy

```
App
└── IndependenceGames
    ├── ErrorBoundary (Error handling wrapper)
    ├── Header (Top navigation and status)
    │   ├── Logo and Title
    │   ├── Game Timer
    │   ├── Sync Status
    │   └── Settings
    ├── Navigation (Tab-based navigation)
    │   ├── Dashboard Tab
    │   ├── Battle Arena Tab
    │   ├── Executive Summary Tab
    │   ├── Performance Tab
    │   └── Export Tab
    ├── Live Activity Feed (Real-time updates)
    └── Main Content Area
        ├── Dashboard View
        │   ├── Daily Challenge Banner
        │   ├── Top 3 Podium
        │   └── Chapter Cards Grid
        ├── Battle Arena View
        │   ├── Epic Battle Display
        │   ├── Category Champions
        │   └── Weekly Performance Grid
        ├── Executive Summary View
        │   ├── Key Metrics Cards
        │   └── Professional Leaderboard
        ├── Performance View
        │   └── Chapter Metric Forms
        └── Export View
            ├── Looker Studio Integration
            └── Export Options
```

### State Management

#### Application State (`appState`)
```javascript
{
  activeView: 'dashboard',     // Current tab view
  selectedChapter: null,       // Selected chapter details
  showDataExport: false,       // Export modal visibility
  syncStatus: 'connected',     // Sync connection status
  lastSync: '10:30:45 AM',    // Last sync timestamp
  showWildCard: false,        // Wild card modal visibility
  loading: true,              // Loading state
  currentWeek: 1,             // Current competition week
  showAchievement: null       // Achievement notification
}
```

#### Game Data (`gameData`)
```javascript
{
  metadata: {
    gameName: 'BNI Independence Games 2.0',
    startDate: '2025-06-17',
    endDate: '2025-08-01',
    currentWeek: 1,
    totalWeeks: 6,
    lastUpdated: '2025-06-25T19:00:00Z'
  },
  chapters: {
    'CHAPTER_NAME': {
      id: 'CH001',
      name: 'INCREDIBLEZ',
      captain: 'Captain Name',
      coach: 'Coach Name',
      members: 30,
      color: '#EF4444',
      avatar: '🦸',
      currentRank: 1,
      previousRank: 2,
      streak: 3,
      powerUps: ['Double Points', 'Shield'],
      performance: {
        totalCoins: 12500,
        weeklyCoins: 2800,
        dailyAverage: 400,
        growthRate: 12.5,
        efficiency: 85
      },
      metrics: {
        referrals: { current: 45, target: 60, achievement: 75 },
        visitors: { current: 28, target: 30, achievement: 93 },
        attendance: { current: 95, target: 95, achievement: 100 },
        testimonials: { current: 40, target: 60, achievement: 67 },
        trainings: { current: 55, target: 90, achievement: 61 },
        retention: { 
          score: 12,
          inductions: 5,
          renewals: 8,
          drops: 1
        }
      }
    }
  }
}
```

### WebSocket Architecture (Future)

```javascript
// WebSocket connection for real-time updates
const ws = new WebSocket(WS_URL);

// Message types
{
  type: 'ACTIVITY',           // New activity notification
  type: 'METRIC_UPDATE',      // Metric update from another user
  type: 'ACHIEVEMENT_UNLOCKED', // Achievement notification
  type: 'SYNC_STATUS'         // Sync status update
}
```

### Performance Optimizations

1. **Component Memoization**
   - Use React.memo for chapter cards
   - Memoize expensive calculations

2. **Lazy Loading**
   - Load views on demand
   - Defer non-critical resources

3. **Animation Optimization**
   - CSS-based animations where possible
   - RequestAnimationFrame for JS animations
   - GPU-accelerated transforms

### Security Considerations

1. **Input Validation**
   - Validate all metric inputs
   - Sanitize user-generated content
   - Type checking with PropTypes

2. **API Security**
   - HTTPS for all requests
   - Authentication tokens
   - Rate limiting

### Deployment Architecture

```
GitHub Repository
    ↓
GitHub Actions (CI/CD)
    ↓
Build Process (npm run build)
    ↓
GitHub Pages (Static Hosting)
    ↓
Cloudflare CDN (Optional)
    ↓
End Users
```

### API Architecture (Future)

```
Frontend (React)
    ↓ HTTPS
API Gateway
    ↓
Backend Services
    ├── Authentication Service
    ├── Game Logic Service
    ├── Metrics Service
    └── Export Service
    ↓
Database (PostgreSQL)
    ├── Users Table
    ├── Chapters Table
    ├── Metrics Table
    └── Activities Table
```

### Data Flow

1. **User Interaction**
   - User updates metric → Local state update → API call → WebSocket broadcast

2. **Real-time Updates**
   - WebSocket message → State update → UI re-render

3. **Data Export**
   - Export request → Data aggregation → Format conversion → Download

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Lighthouse Score: 90+
- Bundle Size: < 500KB (gzipped)