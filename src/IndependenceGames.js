import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Trophy, Users, TrendingUp, Award, Calendar, Target, Medal,
  BarChart3, PieChart, Activity, Download, ExternalLink,
  Database, RefreshCw, Settings, Bell, ChevronDown,
  Zap, Shield, Crown, Flame, Star, ArrowUp, ArrowDown,
  LineChart, FileSpreadsheet, Cloud, CheckCircle, AlertCircle,
  Swords, Clock, Gift, Sparkles, Coins, GamepadIcon, Play
} from 'lucide-react';
// Mock axios for browser environments
const axios = {
  get: (url) => Promise.resolve({ data: {} }),
  post: (url, data) => Promise.resolve({ data: {} }),
  put: (url, data) => Promise.resolve({ data: {} })
};

// API Configuration - FIXED: Proper React env vars
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';

// API Service
const api = {
  // Authentication
  login: (credentials) => axios.post(`${API_BASE_URL}/auth/login`, credentials),
  
  // Game Data
  getGameData: () => axios.get(`${API_BASE_URL}/game/data`),
  updateMetrics: (chapterId, metrics) => axios.put(`${API_BASE_URL}/game/chapters/${chapterId}/metrics`, metrics),
  
  // Live Activities
  getActivities: () => axios.get(`${API_BASE_URL}/game/activities`),
  createActivity: (activity) => axios.post(`${API_BASE_URL}/game/activities`, activity),
  
  // Achievements
  getAchievements: () => axios.get(`${API_BASE_URL}/game/achievements`),
  unlockAchievement: (achievementId) => axios.post(`${API_BASE_URL}/game/achievements/${achievementId}/unlock`),
  
  // Export & Analytics
  exportData: (format) => axios.get(`${API_BASE_URL}/export/${format}`, { responseType: 'blob' }),
  syncLookerStudio: () => axios.post(`${API_BASE_URL}/sync/looker-studio`),
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Trophy className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const IndependenceGames = () => {
  // CONSOLIDATED STATE - Lightning Principle: Minimal State
  const [appState, setAppState] = useState({
    activeView: 'dashboard',
    selectedChapter: null,
    showDataExport: false,
    syncStatus: 'connected',
    lastSync: new Date().toLocaleTimeString(),
    showWildCard: false,
    loading: true,
    currentWeek: 1,
    showAchievement: null
  });

  const [gameData, setGameData] = useState({
    metadata: {
      gameName: 'BNI Independence Games 2.0',
      startDate: '2025-06-17',
      endDate: '2025-08-01',
      currentWeek: 1,
      totalWeeks: 6,
      lastUpdated: new Date().toISOString()
    },
    chapters: {}
  });

  const [liveActivities, setLiveActivities] = useState([]);
  const [animatingCoins, setAnimatingCoins] = useState({});
  const [timeRemaining, setTimeRemaining] = useState({ days: 45, hours: 12, minutes: 30 });

  // WebSocket ref to prevent memory leaks
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Daily Challenge State
  const dailyChallenge = {
    title: "Visitor Frenzy",
    description: "Bring 3 visitors to today's meeting",
    reward: 150,
    progress: 0,
    target: 3
  };

  // Team Profiles Configuration
  const teamProfiles = {
    'INCREDIBLEZ': { avatar: '🦸', ability: 'Double Referral Bonus', motto: 'Incredible Results, Every Time' },
    'KNIGHTZ': { avatar: '⚔️', ability: 'Attendance Shield', motto: 'Honor in Business' },
    'ETERNAL': { avatar: '♾️', ability: 'Retention Master', motto: 'Connections That Last Forever' },
    'CELEBRATIONS': { avatar: '🎉', ability: 'Visitor Magnet', motto: 'Every Win is a Celebration' },
    'OPULANCE': { avatar: '💎', ability: 'Premium Testimonials', motto: 'Excellence in Every Detail' },
    'EPIC': { avatar: '🏛️', ability: 'Training Champion', motto: 'Epic Growth, Epic Success' },
    'VICTORY': { avatar: '🏆', ability: 'Induction Expert', motto: 'Victory Through Unity' },
    'ACHIEVERZ': { avatar: '🎯', ability: 'All-Rounder Bonus', motto: 'Achieving Beyond Limits' }
  };

  // FIXED: Proper WebSocket management with cleanup
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setAppState(prev => ({ ...prev, syncStatus: 'connected' }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleRealtimeUpdate(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setAppState(prev => ({ ...prev, syncStatus: 'error' }));
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setAppState(prev => ({ ...prev, syncStatus: 'disconnected' }));
      
      // Reconnect after 5 seconds
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 5000);
    };
    
    wsRef.current = ws;
  }, []);

  // Initialize WebSocket Connection
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  // Handle real-time updates
  const handleRealtimeUpdate = (data) => {
    switch (data.type) {
      case 'ACTIVITY':
        setLiveActivities(prev => [data.activity, ...prev.slice(0, 9)]);
        break;
      case 'METRIC_UPDATE':
        updateChapterMetrics(data.chapterId, data.metrics);
        break;
      case 'ACHIEVEMENT_UNLOCKED':
        showAchievementNotification(data.achievement);
        break;
      case 'SYNC_STATUS':
        setAppState(prev => ({ 
          ...prev, 
          syncStatus: data.status,
          lastSync: new Date().toLocaleTimeString()
        }));
        break;
      default:
        break;
    }
  };

  // Load initial game data
  useEffect(() => {
    loadGameData();
    loadLiveActivities();
  }, []);

  const loadGameData = async () => {
    try {
      setAppState(prev => ({ ...prev, loading: true }));
      const response = await api.getGameData();

      // Check if the API returned the expected data structure
      if (response.data && response.data.metadata) {
        setGameData(response.data);
        setAppState(prev => ({
          ...prev,
          loading: false,
          currentWeek: response.data.metadata.currentWeek
        }));
      } else {
        // If the data is not in the expected format, trigger the fallback
        throw new Error("Invalid data format from API");
      }
    } catch (error) {
      console.error('Failed to load game data:', error);
      // Use fallback data for demo
      const fallbackData = generateFallbackData();
      setGameData(fallbackData);
      setAppState(prev => ({ 
        ...prev, 
        loading: false,
        // Ensure currentWeek is set from the fallback data
        currentWeek: fallbackData.metadata.currentWeek 
      }));
    }
  };

  const loadLiveActivities = async () => {
    try {
      const response = await api.getActivities();
      setLiveActivities(response.data);
    } catch (error) {
      console.error('Failed to load activities:', error);
      // Generate fallback activities
      setLiveActivities([
        { id: 1, chapter: 'INCREDIBLEZ', action: 'gained 500 coins', icon: '💰', timestamp: 'just now' },
        { id: 2, chapter: 'VICTORY', action: 'achieved 100% attendance', icon: '✅', timestamp: '2m ago' },
        { id: 3, chapter: 'EPIC', action: 'completed training milestone', icon: '🎯', timestamp: '5m ago' }
      ]);
    }
  };

  // Generate fallback data for demo
  const generateFallbackData = () => {
    const chapters = {};
    const chapterNames = Object.keys(teamProfiles);
    
    chapterNames.forEach((name, index) => {
      chapters[name] = {
        id: `CH00${index + 1}`,
        name: name,
        captain: `Captain ${index + 1}`,
        coach: `Coach ${index + 1}`,
        members: 25 + Math.floor(Math.random() * 10),
        color: ['#EF4444', '#8B5CF6', '#3B82F6', '#10B981', '#EC4899', '#F59E0B', '#EF4444', '#14B8A6'][index],
        avatar: teamProfiles[name].avatar,
        currentRank: index + 1,
        previousRank: index + 1,
        streak: Math.floor(Math.random() * 5) + 1,
        powerUps: ['Power Up 1', 'Power Up 2'],
        performance: {
          totalCoins: 8000 + Math.floor(Math.random() * 7000),
          weeklyCoins: 1400 + Math.floor(Math.random() * 1400),
          dailyAverage: 200 + Math.floor(Math.random() * 200),
          growthRate: 5 + Math.random() * 13,
          efficiency: 70 + Math.floor(Math.random() * 24)
        },
        metrics: {
          referrals: { current: 30 + Math.floor(Math.random() * 25), target: 60, achievement: 50 + Math.floor(Math.random() * 50) },
          visitors: { current: 18 + Math.floor(Math.random() * 12), target: 30, achievement: 60 + Math.floor(Math.random() * 40) },
          attendance: { current: 92 + Math.floor(Math.random() * 6), target: 95, achievement: 97 + Math.floor(Math.random() * 3) },
          testimonials: { current: 28 + Math.floor(Math.random() * 17), target: 60, achievement: 47 + Math.floor(Math.random() * 53) },
          trainings: { current: 40 + Math.floor(Math.random() * 22), target: 90, achievement: 44 + Math.floor(Math.random() * 56) },
          retention: { 
            score: 6 + Math.floor(Math.random() * 10), 
            inductions: 3 + Math.floor(Math.random() * 4), 
            renewals: 5 + Math.floor(Math.random() * 6), 
            drops: 1 + Math.floor(Math.random() * 2) 
          }
        }
      };
    });
    
    return {
      metadata: {
        gameName: 'BNI Independence Games 2.0',
        startDate: '2025-06-17',
        endDate: '2025-08-01',
        currentWeek: 1,
        totalWeeks: 6,
        lastUpdated: new Date().toISOString()
      },
      chapters
    };
  };

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59 };
        }
        return prev;
      });
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate derived metrics
  const calculateDerivedMetrics = () => {
    const chapters = Object.values(gameData.chapters);
    if (chapters.length === 0) return {
      totalParticipants: 0,
      totalCoinsGenerated: 0,
      averageEfficiency: 0,
      topPerformer: 'N/A',
      weeklyGrowth: 0
    };
    
    return {
      totalParticipants: chapters.reduce((sum, ch) => sum + ch.members, 0),
      totalCoinsGenerated: chapters.reduce((sum, ch) => sum + ch.performance.totalCoins, 0),
      averageEfficiency: Math.round(chapters.reduce((sum, ch) => sum + ch.performance.efficiency, 0) / chapters.length),
      topPerformer: chapters.sort((a, b) => b.performance.totalCoins - a.performance.totalCoins)[0].name,
      weeklyGrowth: Math.round(chapters.reduce((sum, ch) => sum + ch.performance.growthRate, 0) / chapters.length * 10) / 10
    };
  };

  // Handle metric updates
  const handleMetricUpdate = async (chapterName, metric, value) => {
    const chapter = gameData.chapters[chapterName];
    const oldValue = metric === 'retention' ? 0 : chapter.metrics[metric].current;
    const newValue = parseInt(value) || 0;
    const difference = newValue - oldValue;

    if (difference > 0) {
      // Trigger animations
      setAnimatingCoins({ [chapterName]: true });
      setTimeout(() => setAnimatingCoins({}), 1000);

      // Create activity
      const activity = {
        chapter: chapterName,
        action: `updated ${metric} (+${difference})`,
        icon: '💰',
        color: chapter.color,
        timestamp: new Date().toISOString()
      };

      // Send to backend
      try {
        await api.createActivity(activity);
        await api.updateMetrics(chapter.id, { [metric]: newValue });
      } catch (error) {
        console.error('Failed to update metrics:', error);
      }
    }

    // Update local state
    updateChapterMetrics(chapterName, { [metric]: newValue });
  };

  const updateChapterMetrics = (chapterName, updates) => {
    setGameData(prevData => {
      const newData = { ...prevData };
      const chapter = newData.chapters[chapterName];
      
      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'retention') {
          chapter.metrics.retention = value;
        } else if (chapter.metrics[key]) {
          chapter.metrics[key].current = value;
        }
      });
      
      // Recalculate performance
      chapter.performance.totalCoins = calculateTotalCoins(chapter);
      
      return newData;
    });
  };

  const calculateTotalCoins = (chapter) => {
    const metrics = chapter.metrics;
    const individualCoins = 
      (metrics.referrals?.current || 0) * 1 +
      (metrics.visitors?.current || 0) * 50 +
      (100 - (metrics.attendance?.current || 100)) * -10 +
      Math.min(metrics.testimonials?.current || 0, chapter.members * 2) * 5 +
      Math.min(metrics.trainings?.current || 0, chapter.members * 3) * 25;
    
    const chapterCoins = 
      ((metrics.referrals?.current || 0) / chapter.members) * 500 +
      ((metrics.visitors?.current || 0) / chapter.members) * 10000 +
      ((metrics.attendance?.current || 100) < 95 ? -1000 : 0) +
      (Math.min(metrics.testimonials?.current || 0, chapter.members * 2) / chapter.members) * 1000 +
      (Math.min(metrics.trainings?.current || 0, chapter.members * 3) / chapter.members) * 5000;
    
    return Math.round(individualCoins + chapterCoins);
  };

  // Achievement notification
  const showAchievementNotification = (achievement) => {
    setAppState(prev => ({ ...prev, showAchievement: achievement }));
    setTimeout(() => setAppState(prev => ({ ...prev, showAchievement: null })), 3000);
  };

  // Export functions
  const exportToCSV = async () => {
    try {
      const response = await api.exportData('csv');
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bni_independence_games_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const syncWithLookerStudio = async () => {
    try {
      setAppState(prev => ({ ...prev, syncStatus: 'syncing' }));
      await api.syncLookerStudio();
      setAppState(prev => ({ 
        ...prev, 
        syncStatus: 'connected',
        lastSync: new Date().toLocaleTimeString()
      }));
    } catch (error) {
      console.error('Sync failed:', error);
      setAppState(prev => ({ ...prev, syncStatus: 'error' }));
    }
  };

  const derivedMetrics = calculateDerivedMetrics();
  const sortedChapters = Object.values(gameData.chapters).sort((a, b) => a.currentRank - b.currentRank);

  if (appState.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-red-600 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600">Loading Independence Games...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 relative">
        {/* Animated Background for Gaming Feel */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
          <div className="absolute -inset-10">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`
                }}
              >
                <Sparkles className="w-8 h-8 text-red-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Achievement Popup */}
        {appState.showAchievement && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
              <span className="text-3xl">{appState.showAchievement.icon}</span>
              <div>
                <p className="font-bold">{appState.showAchievement.chapter} Unlocked:</p>
                <p className="text-xl">{appState.showAchievement.title}! +{appState.showAchievement.points} Bonus</p>
              </div>
            </div>
          </div>
        )}

        {/* Professional Header with Gaming Elements */}
        <header className="bg-white shadow-sm border-b border-gray-200 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Trophy className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">BNI Independence Games 2.0</h1>
                  <p className="text-sm text-gray-500">Executive Gaming Dashboard</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Game Timer */}
                <div className="flex items-center space-x-2 text-sm bg-red-50 px-3 py-1 rounded-full">
                  <Clock className="w-4 h-4 text-red-600 animate-pulse" />
                  <span className="font-medium text-red-900">
                    {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
                  </span>
                </div>
                
                {/* Sync Status */}
                <div className="flex items-center space-x-2 text-sm">
                  <Cloud className={`w-4 h-4 ${appState.syncStatus === 'connected' ? 'text-green-500' : appState.syncStatus === 'syncing' ? 'text-yellow-500 animate-pulse' : 'text-red-500'}`} />
                  <span className="text-gray-600">Looker Studio</span>
                  <span className={`font-medium ${appState.syncStatus === 'connected' ? 'text-green-600' : appState.syncStatus === 'syncing' ? 'text-yellow-600' : 'text-red-600'}`}>
                    {appState.syncStatus === 'connected' ? 'Connected' : appState.syncStatus === 'syncing' ? 'Syncing...' : 'Error'}
                  </span>
                </div>
                
                {/* Sync Button */}
                <button
                  onClick={syncWithLookerStudio}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <RefreshCw className={`w-5 h-5 ${appState.syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                </button>
                
                {/* Settings */}
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {['dashboard', 'battle', 'executive', 'performance', 'export'].map((view) => (
                <button
                  key={view}
                  onClick={() => setAppState(prev => ({ ...prev, activeView: view }))}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    appState.activeView === view
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } transition-colors flex items-center`}
                >
                  {view === 'dashboard' && <GamepadIcon className="w-4 h-4 mr-2" />}
                  {view === 'battle' && <Swords className="w-4 h-4 mr-2" />}
                  {view === 'executive' && <BarChart3 className="w-4 h-4 mr-2" />}
                  {view === 'performance' && <TrendingUp className="w-4 h-4 mr-2" />}
                  {view === 'export' && <Database className="w-4 h-4 mr-2" />}
                  {view === 'dashboard' ? 'Live Dashboard' : 
                   view === 'battle' ? 'Battle Arena' :
                   view === 'executive' ? 'Executive Summary' :
                   view === 'performance' ? 'Performance' : 'Export'}
                </button>
              ))}
              
              {/* Wild Cards Button */}
              <button
                onClick={() => setAppState(prev => ({ ...prev, showWildCard: !prev.showWildCard }))}
                className="ml-auto py-2 px-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md animate-pulse flex items-center"
              >
                <Zap className="w-4 h-4 mr-2" />
                Wild Cards
              </button>
            </nav>
          </div>
        </div>

        {/* Live Activity Feed Strip */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-2 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4 overflow-hidden">
              <Bell className="w-4 h-4 animate-pulse flex-shrink-0" />
              <div className="flex space-x-8 animate-marquee">
                {liveActivities.map((activity, index) => (
                  <div key={`${activity.id}-${index}`} className="flex items-center space-x-2 text-sm whitespace-nowrap">
                    <span className="text-lg">{activity.icon}</span>
                    <span className="font-semibold">{activity.chapter}</span>
                    <span>{activity.action}</span>
                    <span className="text-xs opacity-75">{activity.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          {/* Live Gaming Dashboard */}
          {appState.activeView === 'dashboard' && (
            <div className="space-y-6">
              {/* Daily Challenge Banner */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Daily Challenge: {dailyChallenge.title}</h2>
                    <p className="text-purple-100">{dailyChallenge.description}</p>
                    <div className="mt-4 flex items-center space-x-4">
                      <div className="bg-white/20 rounded-full px-4 py-2">
                        <span className="font-semibold">Reward: {dailyChallenge.reward} coins</span>
                      </div>
                      <div className="flex-1 bg-white/20 rounded-full h-8 relative overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-white/40 flex items-center justify-center text-sm font-semibold"
                          style={{ width: `${(dailyChallenge.progress / dailyChallenge.target) * 100}%` }}
                        >
                          {dailyChallenge.progress}/{dailyChallenge.target}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Gift className="w-16 h-16 text-white/50" />
                </div>
              </div>

              {/* Top 3 Podium */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  🏆 Current Leaders 🏆
                </h2>
                <div className="flex justify-center items-end gap-8">
                  {sortedChapters.slice(0, 3).map((chapter, index) => (
                    <div
                      key={chapter.name}
                      className={`text-center transform transition-all hover:scale-110 ${
                        index === 0 ? 'order-2' : index === 1 ? 'order-1' : 'order-3'
                      }`}
                    >
                      <div className={`relative ${index === 0 ? 'mb-8' : index === 1 ? 'mb-4' : 'mb-2'}`}>
                        <div className="text-6xl mb-4 animate-bounce">{chapter.avatar}</div>
                        <div
                          className={`bg-gradient-to-t ${
                            index === 0 ? 'from-yellow-600 to-yellow-400 h-48' :
                            index === 1 ? 'from-gray-600 to-gray-400 h-36' :
                            'from-orange-700 to-orange-500 h-28'
                          } rounded-t-lg p-6 shadow-2xl text-white`}
                        >
                          <Crown className={`w-10 h-10 mx-auto mb-2 ${
                            index === 0 ? 'text-yellow-200' : 
                            index === 1 ? 'text-gray-200' : 
                            'text-orange-200'
                          }`} />
                          <p className="font-bold text-lg">{chapter.name}</p>
                          <p className="text-3xl font-bold">{chapter.performance.totalCoins.toLocaleString()}</p>
                          <p className="text-sm">coins</p>
                        </div>
                      </div>
                      <div className="text-4xl font-bold mt-4">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chapter Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {sortedChapters.map((chapter, index) => (
                  <div
                    key={chapter.name}
                    className="bg-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all cursor-pointer relative overflow-hidden"
                    onClick={() => setAppState(prev => ({ ...prev, selectedChapter: chapter }))}
                    style={{ borderTop: `4px solid ${chapter.color}` }}
                  >
                    {/* Rank Badge */}
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-lg">
                      {chapter.currentRank}
                    </div>
                    
                    <div className="p-6">
                      {/* Chapter Header */}
                      <div className="flex items-center mb-4">
                        <span className="text-4xl mr-3">{chapter.avatar}</span>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg" style={{ color: chapter.color }}>{chapter.name}</h3>
                          <p className="text-xs text-gray-500 italic">{teamProfiles[chapter.name]?.motto}</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Total Coins:</span>
                          <span className={`font-bold text-xl ${animatingCoins[chapter.name] ? 'animate-pulse text-yellow-500' : 'text-gray-900'}`}>
                            {chapter.performance.totalCoins.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Growth:</span>
                          <span className={`font-semibold ${chapter.performance.growthRate > 10 ? 'text-green-600' : 'text-gray-900'}`}>
                            +{chapter.performance.growthRate.toFixed(1)}%
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Streak:</span>
                          <div className="flex">
                            {[...Array(Math.min(chapter.streak || 0, 5))].map((_, i) => (
                              <Flame key={i} className="w-4 h-4 text-orange-500" />
                            ))}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-1000"
                              style={{ width: `${chapter.performance.efficiency}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1 text-right">{chapter.performance.efficiency}% efficiency</p>
                        </div>

                        {/* Power Ups */}
                        {chapter.powerUps && chapter.powerUps.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {chapter.powerUps.slice(0, 2).map((powerUp, i) => (
                              <span key={i} className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                                {powerUp}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Battle Arena View */}
          {appState.activeView === 'battle' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  ⚔️ Battle Arena ⚔️
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Epic Battle */}
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6 border-2 border-yellow-400">
                    <h3 className="text-xl font-bold text-center mb-6 text-yellow-800">Epic Battle for 1st Place</h3>
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1">
                        <div className="text-6xl mb-2">{sortedChapters[0]?.avatar}</div>
                        <p className="font-bold text-lg">{sortedChapters[0]?.name}</p>
                        <p className="text-3xl font-bold text-yellow-600">{sortedChapters[0]?.performance.totalCoins.toLocaleString()}</p>
                      </div>
                      <div className="text-4xl animate-pulse mx-4">⚡VS⚡</div>
                      <div className="text-center flex-1">
                        <div className="text-6xl mb-2">{sortedChapters[1]?.avatar}</div>
                        <p className="font-bold text-lg">{sortedChapters[1]?.name}</p>
                        <p className="text-3xl font-bold text-gray-600">{sortedChapters[1]?.performance.totalCoins.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="mt-6 text-center">
                      <p className="text-lg text-gray-700">
                        Gap: <span className="font-bold text-orange-600">
                          {((sortedChapters[0]?.performance.totalCoins || 0) - (sortedChapters[1]?.performance.totalCoins || 0)).toLocaleString()} coins
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Category Champions */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-400">
                    <h3 className="text-xl font-bold text-center mb-6 text-purple-800">Category Champions</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-700 font-medium">Most Referrals</span>
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">🤝</span>
                          <span className="font-bold">{
                            Object.values(gameData.chapters)
                              .sort((a, b) => (b.metrics.referrals?.current || 0) - (a.metrics.referrals?.current || 0))[0]?.name
                          }</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-700 font-medium">Most Visitors</span>
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">👥</span>
                          <span className="font-bold">{
                            Object.values(gameData.chapters)
                              .sort((a, b) => (b.metrics.visitors?.current || 0) - (a.metrics.visitors?.current || 0))[0]?.name
                          }</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-700 font-medium">Best Attendance</span>
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">✅</span>
                          <span className="font-bold">{
                            Object.values(gameData.chapters)
                              .sort((a, b) => (b.metrics.attendance?.current || 0) - (a.metrics.attendance?.current || 0))[0]?.name
                          }</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-700 font-medium">Most Inductions</span>
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">🎯</span>
                          <span className="font-bold">{
                            Object.values(gameData.chapters)
                              .sort((a, b) => (b.metrics.retention?.inductions || 0) - (a.metrics.retention?.inductions || 0))[0]?.name
                          }</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Performance Grid */}
                  <div className="lg:col-span-2 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 border-2 border-green-400">
                    <h3 className="text-xl font-bold text-center mb-6 text-green-800">
                      Week {appState.currentWeek} Performance Leaders
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {sortedChapters.slice(0, 8).map(chapter => (
                        <div key={chapter.name} className="bg-white rounded-lg p-4 text-center shadow-md">
                          <div className="text-4xl mb-2">{chapter.avatar}</div>
                          <p className="font-semibold text-sm">{chapter.name}</p>
                          <div className="mt-2 flex items-center justify-center">
                            <TrendingUp className={`w-4 h-4 mr-1 ${
                              chapter.performance.growthRate > 10 ? 'text-green-600' : 'text-gray-600'
                            }`} />
                            <span className="text-sm font-medium">
                              +{chapter.performance.growthRate.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Executive Summary View */}
          {appState.activeView === 'executive' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Participants</p>
                      <p className="text-2xl font-semibold text-gray-900">{derivedMetrics.totalParticipants}</p>
                    </div>
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Coins</p>
                      <p className="text-2xl font-semibold text-gray-900">{derivedMetrics.totalCoinsGenerated.toLocaleString()}</p>
                    </div>
                    <Trophy className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Efficiency</p>
                      <p className="text-2xl font-semibold text-gray-900">{derivedMetrics.averageEfficiency}%</p>
                    </div>
                    <Activity className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Weekly Growth</p>
                      <p className="text-2xl font-semibold text-gray-900">+{derivedMetrics.weeklyGrowth}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Current Leader</p>
                      <p className="text-2xl font-semibold text-gray-900">{derivedMetrics.topPerformer}</p>
                    </div>
                    <Crown className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Professional Leaderboard */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Competition Leaderboard</h2>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chapter</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Captain</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Coins</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedChapters.map((chapter) => (
                          <tr key={chapter.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-lg font-medium text-gray-900">{chapter.currentRank}</span>
                                {chapter.currentRank < chapter.previousRank && (
                                  <ArrowUp className="w-4 h-4 text-green-500 ml-2" />
                                )}
                                {chapter.currentRank > chapter.previousRank && (
                                  <ArrowDown className="w-4 h-4 text-red-500 ml-2" />
                                )}
                                {chapter.currentRank <= 3 && (
                                  <Medal className={`w-5 h-5 ml-2 ${
                                    chapter.currentRank === 1 ? 'text-yellow-500' :
                                    chapter.currentRank === 2 ? 'text-gray-400' :
                                    'text-orange-600'
                                  }`} />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-2xl mr-3">{chapter.avatar}</span>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{chapter.name}</div>
                                  <div className="text-sm text-gray-500">{chapter.members} members</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{chapter.captain}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-lg font-semibold text-gray-900">{chapter.performance.totalCoins.toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              +{chapter.performance.weeklyCoins.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className={`text-sm font-medium ${
                                  chapter.performance.growthRate > 10 ? 'text-green-600' : 'text-gray-900'
                                }`}>
                                  +{chapter.performance.growthRate.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${chapter.performance.efficiency}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-900">{chapter.performance.efficiency}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {chapter.performance.growthRate > 15 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <Flame className="w-3 h-3 mr-1" />
                                  On Fire
                                </span>
                              )}
                              {chapter.performance.growthRate > 10 && chapter.performance.growthRate <= 15 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  Rising
                                </span>
                              )}
                              {chapter.performance.growthRate <= 10 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  <Activity className="w-3 h-3 mr-1" />
                                  Steady
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance View */}
          {appState.activeView === 'performance' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Update Chapter Metrics</h2>
                  <button
                    onClick={() => loadGameData()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sortedChapters.map((chapter) => (
                  <div key={chapter.id} className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200" style={{ borderLeftWidth: '4px', borderLeftColor: chapter.color }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-3xl mr-3">{chapter.avatar}</span>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{chapter.name}</h3>
                            <p className="text-sm text-gray-500">Rank #{chapter.currentRank} • {chapter.members} members</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-semibold text-gray-900">{chapter.performance.totalCoins.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">Total Coins</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(chapter.metrics).filter(([key]) => key !== 'retention').map(([key, value]) => (
                          <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                              {key}
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={value.current}
                                onChange={(e) => handleMetricUpdate(chapter.name, key, e.target.value)}
                                className="flex-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                min="0"
                                max={key === 'attendance' ? '100' : undefined}
                              />
                              <span className="text-sm text-gray-500">/ {value.target}</span>
                            </div>
                            <div className="mt-1">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    value.achievement >= 100 ? 'bg-green-600' :
                                    value.achievement >= 75 ? 'bg-blue-600' :
                                    value.achievement >= 50 ? 'bg-yellow-600' :
                                    'bg-red-600'
                                  }`}
                                  style={{ width: `${Math.min(value.achievement, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Retention Box */}
                      <div className="mt-6 bg-blue-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-3">Net Retention Score</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-blue-700">Inductions</label>
                            <input
                              type="number"
                              value={chapter.metrics.retention.inductions}
                              onChange={(e) => handleMetricUpdate(chapter.name, 'retention', {
                                ...chapter.metrics.retention,
                                inductions: parseInt(e.target.value) || 0
                              })}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-blue-700">Renewals</label>
                            <input
                              type="number"
                              value={chapter.metrics.retention.renewals}
                              onChange={(e) => handleMetricUpdate(chapter.name, 'retention', {
                                ...chapter.metrics.retention,
                                renewals: parseInt(e.target.value) || 0
                              })}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-blue-700">Drops</label>
                            <input
                              type="number"
                              value={chapter.metrics.retention.drops}
                              onChange={(e) => handleMetricUpdate(chapter.name, 'retention', {
                                ...chapter.metrics.retention,
                                drops: parseInt(e.target.value) || 0
                              })}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                              min="0"
                            />
                          </div>
                        </div>
                        <div className="mt-3 text-center">
                          <span className="text-2xl font-bold text-blue-900">
                            Score: {chapter.metrics.retention.inductions + chapter.metrics.retention.renewals - chapter.metrics.retention.drops}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export View */}
          {appState.activeView === 'export' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Data Export & Integration</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Looker Studio Integration */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <Cloud className="w-8 h-8 text-blue-600 mr-3" />
                        <h3 className="text-lg font-medium text-gray-900">Google Looker Studio</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Connect your BNI Independence Games data directly to Looker Studio for advanced analytics and custom dashboards.
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-600">Connection Status</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            appState.syncStatus === 'connected' ? 'bg-green-100 text-green-800' :
                            appState.syncStatus === 'syncing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {appState.syncStatus === 'connected' ? 'Connected' : appState.syncStatus === 'syncing' ? 'Syncing' : 'Error'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-600">Last Sync</span>
                          <span className="text-sm font-medium text-gray-900">{appState.lastSync}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-600">Auto-sync</span>
                          <span className="text-sm font-medium text-gray-900">Every 5 minutes</span>
                        </div>
                      </div>
                      <button
                        onClick={syncWithLookerStudio}
                        className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Sync Now
                      </button>
                    </div>
                    
                    {/* Export Options */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <FileSpreadsheet className="w-8 h-8 text-green-600 mr-3" />
                        <h3 className="text-lg font-medium text-gray-900">Export Options</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Download game data in various formats for offline analysis or import into other tools.
                      </p>
                      <div className="space-y-3">
                        <button
                          onClick={exportToCSV}
                          className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export as CSV
                        </button>
                        <button className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center">
                          <Download className="w-4 h-4 mr-2" />
                          Export as Excel
                        </button>
                        <button className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center">
                          <Download className="w-4 h-4 mr-2" />
                          Export as JSON
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Integration Instructions */}
                  <div className="mt-6 bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-blue-900 mb-3">How to Connect to Looker Studio</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                      <li>Export your data as CSV using the button above</li>
                      <li>Open Google Looker Studio and create a new data source</li>
                      <li>Select "File Upload" and upload the CSV file</li>
                      <li>Configure your dimensions and metrics</li>
                      <li>Create custom dashboards with your BNI Games data</li>
                    </ol>
                    <div className="mt-4">
                      <a
                        href="https://lookerstudio.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Open Looker Studio
                        <ExternalLink className="w-4 h-4 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Wild Cards Modal */}
        {appState.showWildCard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full shadow-2xl">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-t-lg">
                <h2 className="text-3xl font-bold text-center">🎰 Wild Cards 🎰</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-300 transform hover:scale-105 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="w-10 h-10 text-purple-600" />
                      <h3 className="font-bold text-xl text-purple-900">Team Strategy Meeting</h3>
                    </div>
                    <p className="text-gray-700 mb-4">Unite your chapter before June 16th!</p>
                    <div className="space-y-2">
                      <div className="flex justify-between bg-white rounded px-3 py-2">
                        <span>100% Attendance:</span>
                        <span className="font-bold text-purple-600">+1000 Coins</span>
                      </div>
                      <div className="flex justify-between bg-white rounded px-3 py-2">
                        <span>95-99% Attendance:</span>
                        <span className="font-bold text-purple-600">+750 Coins</span>
                      </div>
                      <div className="flex justify-between bg-white rounded px-3 py-2">
                        <span>90-95% Attendance:</span>
                        <span className="font-bold text-purple-600">+500 Coins</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-300 transform hover:scale-105 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <Target className="w-10 h-10 text-green-600" />
                      <h3 className="font-bold text-xl text-green-900">Hot Categories</h3>
                    </div>
                    <p className="text-gray-700 mb-4">Share 15 hot open categories!</p>
                    <div className="text-center bg-white rounded-lg p-4">
                      <p className="text-5xl font-bold text-green-600 mb-2">+250</p>
                      <p className="text-lg text-gray-600">Extra Coins</p>
                      <p className="text-sm text-red-600 mt-2">Deadline: June 16th</p>
                    </div>
                  </div>

                  <div className="md:col-span-2 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-300">
                    <div className="flex items-center gap-3 mb-3">
                      <Gift className="w-10 h-10 text-orange-600" />
                      <h3 className="font-bold text-xl text-orange-900">Mystery Bonus Round</h3>
                    </div>
                    <p className="text-gray-700 text-center text-lg">
                      🎲 Coming Soon: Week 3 Special Challenge 🎲
                    </p>
                    <p className="text-center text-gray-600 mt-2">
                      Stay tuned for a game-changing opportunity!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAppState(prev => ({ ...prev, showWildCard: false }))}
                  className="mt-6 w-full bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-orange-700 transition-all font-bold text-lg"
                >
                  Close & Return to Game
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chapter Detail Modal */}
        {appState.selectedChapter && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-4xl mr-3">{appState.selectedChapter.avatar}</span>
                  <div>
                    <h2 className="text-2xl font-semibold">{appState.selectedChapter.name}</h2>
                    <p className="text-sm text-gray-300">{teamProfiles[appState.selectedChapter.name]?.motto}</p>
                  </div>
                </div>
                <button
                  onClick={() => setAppState(prev => ({ ...prev, selectedChapter: null }))}
                  className="text-gray-300 hover:text-white"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Chapter Overview */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Team Information</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Captain</dt>
                        <dd className="text-sm font-medium text-gray-900">{appState.selectedChapter.captain}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Coach</dt>
                        <dd className="text-sm font-medium text-gray-900">{appState.selectedChapter.coach}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Members</dt>
                        <dd className="text-sm font-medium text-gray-900">{appState.selectedChapter.members}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Current Rank</dt>
                        <dd className="text-sm font-medium text-gray-900">#{appState.selectedChapter.currentRank}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Summary</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Total Coins</dt>
                        <dd className="text-sm font-medium text-gray-900">{appState.selectedChapter.performance.totalCoins.toLocaleString()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Weekly Coins</dt>
                        <dd className="text-sm font-medium text-gray-900">+{appState.selectedChapter.performance.weeklyCoins.toLocaleString()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Growth Rate</dt>
                        <dd className="text-sm font-medium text-gray-900">+{appState.selectedChapter.performance.growthRate.toFixed(1)}%</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Efficiency</dt>
                        <dd className="text-sm font-medium text-gray-900">{appState.selectedChapter.performance.efficiency}%</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                
                {/* Detailed Metrics */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Metrics</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                      {Object.entries(appState.selectedChapter.metrics).filter(([key]) => key !== 'retention').map(([key, value]) => (
                        <div key={key}>
                          <h4 className="text-sm font-medium text-gray-700 capitalize mb-2">{key}</h4>
                          <div className="bg-white rounded-lg p-4">
                            <div className="text-2xl font-semibold text-gray-900">{value.current}</div>
                            <div className="text-sm text-gray-500 mt-1">Target: {value.target}</div>
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Achievement</span>
                                <span className="font-medium">{value.achievement}%</span>
                              </div>
                              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    value.achievement >= 100 ? 'bg-green-600' :
                                    value.achievement >= 75 ? 'bg-blue-600' :
                                    value.achievement >= 50 ? 'bg-yellow-600' :
                                    'bg-red-600'
                                  }`}
                                  style={{ width: `${Math.min(value.achievement, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Retention Score */}
                    <div className="mt-6 bg-blue-100 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-blue-900 mb-4">Net Retention Score</h4>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-3xl font-bold text-blue-900">{appState.selectedChapter.metrics.retention.score}</div>
                          <div className="text-sm text-blue-700 mt-1">Total Score</div>
                        </div>
                        <div>
                          <div className="text-2xl font-semibold text-green-700">+{appState.selectedChapter.metrics.retention.inductions}</div>
                          <div className="text-sm text-green-600 mt-1">Inductions</div>
                        </div>
                        <div>
                          <div className="text-2xl font-semibold text-green-700">+{appState.selectedChapter.metrics.retention.renewals}</div>
                          <div className="text-sm text-green-600 mt-1">Renewals</div>
                        </div>
                        <div>
                          <div className="text-2xl font-semibold text-red-700">-{appState.selectedChapter.metrics.retention.drops}</div>
                          <div className="text-sm text-red-600 mt-1">Drops</div>
                        </div>
                      </div>
                    </div>

                    {/* Power-Ups */}
                    {appState.selectedChapter.powerUps && appState.selectedChapter.powerUps.length > 0 && (
                      <div className="mt-6 bg-purple-100 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-purple-900 mb-4">Active Power-Ups & Abilities</h4>
                        <div className="flex flex-wrap gap-3">
                          <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                            {teamProfiles[appState.selectedChapter.name]?.ability}
                          </span>
                          {appState.selectedChapter.powerUps.map((powerUp, i) => (
                            <span key={i} className="bg-purple-200 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                              {powerUp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom CSS for animations */}
        <style jsx>{`
          @keyframes marquee {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-100%);
            }
          }
          
          .animate-marquee {
            animation: marquee 30s linear infinite;
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
};

export default IndependenceGames;
