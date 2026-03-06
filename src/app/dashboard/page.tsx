'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Users,
  Target,
  TrendingUp,
  Calendar,
  Zap,
  Award,
  BarChart3,
  Activity,
  ChevronRight,
  Flame,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  AlertCircle,
  CalendarDays,
  ListTodo,
  Loader2,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { Task } from '@/lib/types';

// Time period types
type TimePeriod = 'week' | 'month' | 'quarter' | 'year';

const TIME_PERIODS: { value: TimePeriod; label: string; shortLabel: string }[] = [
  { value: 'week', label: 'This Week', shortLabel: 'Week' },
  { value: 'month', label: 'This Month', shortLabel: 'Month' },
  { value: 'quarter', label: 'This Quarter', shortLabel: 'Quarter' },
  { value: 'year', label: 'This Year', shortLabel: 'Year' },
];

const PERIOD_LABELS: Record<TimePeriod, string> = {
  week: 'This Week',
  month: 'This Month',
  quarter: 'This Quarter',
  year: 'This Year',
};

const STORAGE_KEY = 'mission-control-time-period';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// Types for dashboard data
interface DashboardData {
  tasksByStatus: {
    inbox: number;
    'up-next': number;
    'in-progress': number;
    'in-review': number;
    done: number;
  };
  tasksByPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  tasksByAssignee: {
    Aaron: number;
    Solomon: number;
    Phil: number;
    Alex: number;
    Unassigned: number;
  };
  overdueTasks: {
    id: string;
    title: string;
    due_date: string;
    priority: string;
    assigned_agent: string | null;
    status: string;
  }[];
  tasksDueThisWeek: {
    id: string;
    title: string;
    due_date: string;
    priority: string;
    assigned_agent: string | null;
    status: string;
  }[];
  recentActivity: {
    id: number;
    type: string;
    message: string;
    agent: string | null;
    task_id: string | null;
    created_at: string;
  }[];
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
}

// Types for live metrics
interface FacebookMetrics {
  spend: number;
  leads: number;
  cpa: number;
  impressions: number;
  clicks: number;
  ctr: number;
  period: TimePeriod;
  dateRange: {
    start: string;
    end: string;
  };
  lastUpdated: string;
  error?: string;
}

interface GHLMetrics {
  contactsTotal: number;
  contactsInPeriod: number;
  opportunitiesTotal: number;
  opportunitiesWon: number;
  opportunitiesValue: number;
  period: TimePeriod;
  lastUpdated: string;
  error?: string;
}

interface StripeMetrics {
  today: {
    revenue: number;
    sales: number;
  };
  period: {
    revenue: number;
    sales: number;
    start: string;
    end: string;
    type: string;
  };
  last7Days: {
    revenue: number;
    sales: number;
  };
  balance: {
    pending: number;
    available: number;
  };
  recentSales: Array<{
    amount: number;
    name: string | null;
    email: string | null;
    created: string;
    status: string;
  }>;
  lastUpdated: string;
  requestedPeriod?: string;
  error?: string;
}

interface LeadsMetrics {
  total: number;
  thisWeek: number;
  today: number;
  periodCount: number;
  period: string;
  periodLabel: string;
  lastUpdated: string;
  error?: string;
}

interface LiveMetrics {
  facebook: FacebookMetrics | null;
  ghl: GHLMetrics | null;
  stripe: StripeMetrics | null;
  leads: LeadsMetrics | null;
  facebookLoading: boolean;
  ghlLoading: boolean;
  stripeLoading: boolean;
  leadsLoading: boolean;
  facebookError: string | null;
  ghlError: string | null;
  stripeError: string | null;
  leadsError: string | null;
}

// Default/fallback data for when APIs fail
const DEFAULT_METRICS = {
  leads: {
    thisWeek: 0,
    lastWeek: 623,
    target: 1000,
  },
  adSpend: {
    thisWeek: 0,
    budget: 7000,
    dailyTarget: 1000,
    todaySpend: 0,
  },
  cpa: {
    current: 0,
    target: 150,
    lastWeek: 167,
  },
  registrations: {
    thisWeek: 0,
    lastWeek: 298,
  },
  showRate: {
    current: 31,
    target: 25,
  },
  challengeStayers: {
    day3: 156,
    started: 412,
  },
  revenue: {
    thisWeek: 47850,  // Keep as placeholder - would come from QuickBooks/Stripe
    lastWeek: 32400,
    goal: 1000000,
    mtd: 187500,
  },
  sales: {
    thisWeek: 0,
    lastWeek: 16,
    avgTicket: 2080,
  },
  conversionRate: {
    current: 2.3,
    target: 2.5,
    targetMin: 2.0,
  },
};

// Weekly trend data for charts
const weeklyRevenueData = [
  { day: 'Mon', revenue: 8500, leads: 120 },
  { day: 'Tue', revenue: 12300, leads: 145 },
  { day: 'Wed', revenue: 6800, leads: 98 },
  { day: 'Thu', revenue: 9200, leads: 132 },
  { day: 'Fri', revenue: 11050, leads: 156 },
  { day: 'Sat', revenue: 0, leads: 112 },
  { day: 'Sun', revenue: 0, leads: 84 },
];

// Funnel data - will be computed with live metrics in the component

// Colors for charts
const STATUS_COLORS: Record<string, string> = {
  inbox: '#94A3B8',
  'up-next': '#00D9FF',
  'in-progress': '#E91E8C',
  'in-review': '#FBBF24',
  done: '#34D399',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#EF4444',
  high: '#F97316',
  medium: '#3B82F6',
  low: '#6B7280',
};

const ASSIGNEE_COLORS: Record<string, string> = {
  Aaron: '#E91E8C',
  Solomon: '#00D9FF',
  Phil: '#8B5CF6',
  Alex: '#34D399',
  Unassigned: '#6B7280',
};

export default function CEODashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({
    facebook: null,
    ghl: null,
    stripe: null,
    leads: null,
    facebookLoading: true,
    ghlLoading: true,
    stripeLoading: true,
    leadsLoading: true,
    facebookError: null,
    ghlError: null,
    stripeError: null,
    leadsError: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');

  // Load saved time period from localStorage on mount
  useEffect(() => {
    const savedPeriod = localStorage.getItem(STORAGE_KEY) as TimePeriod | null;
    if (savedPeriod && TIME_PERIODS.some(p => p.value === savedPeriod)) {
      setTimePeriod(savedPeriod);
    }
  }, []);

  // Save time period to localStorage when it changes
  const handlePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
    localStorage.setItem(STORAGE_KEY, period);
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFacebookMetrics = useCallback(async (period: TimePeriod) => {
    setLiveMetrics(prev => ({ ...prev, facebookLoading: true, facebookError: null }));
    try {
      const res = await fetch(`/api/metrics/facebook?period=${period}`);
      const data = await res.json();
      if (data.error && !data.spend) {
        setLiveMetrics(prev => ({ ...prev, facebookError: data.error, facebookLoading: false }));
      } else {
        setLiveMetrics(prev => ({ 
          ...prev, 
          facebook: data, 
          facebookLoading: false,
          facebookError: data.error || null,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch Facebook metrics:', error);
      setLiveMetrics(prev => ({ 
        ...prev, 
        facebookError: 'Failed to connect', 
        facebookLoading: false 
      }));
    }
  }, []);

  const fetchGHLMetrics = useCallback(async (period: TimePeriod) => {
    setLiveMetrics(prev => ({ ...prev, ghlLoading: true, ghlError: null }));
    try {
      const res = await fetch(`/api/metrics/ghl?period=${period}`);
      const data = await res.json();
      if (data.error && !data.contactsTotal) {
        setLiveMetrics(prev => ({ ...prev, ghlError: data.error, ghlLoading: false }));
      } else {
        setLiveMetrics(prev => ({ 
          ...prev, 
          ghl: data, 
          ghlLoading: false,
          ghlError: data.error || null,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch GHL metrics:', error);
      setLiveMetrics(prev => ({ 
        ...prev, 
        ghlError: 'Failed to connect', 
        ghlLoading: false 
      }));
    }
  }, []);

  const fetchStripeMetrics = useCallback(async (period: TimePeriod = 'week') => {
    setLiveMetrics(prev => ({ ...prev, stripeLoading: true, stripeError: null }));
    try {
      const res = await fetch(`/api/metrics/stripe?period=${period}`);
      const data = await res.json();
      if (data.error && !data.today) {
        setLiveMetrics(prev => ({ ...prev, stripeError: data.error, stripeLoading: false }));
      } else {
        setLiveMetrics(prev => ({ 
          ...prev, 
          stripe: data, 
          stripeLoading: false,
          stripeError: data.error || null,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch Stripe metrics:', error);
      setLiveMetrics(prev => ({ 
        ...prev, 
        stripeError: 'Failed to connect', 
        stripeLoading: false 
      }));
    }
  }, []);

  const fetchLeadsMetrics = useCallback(async (period: TimePeriod = 'week') => {
    setLiveMetrics(prev => ({ ...prev, leadsLoading: true, leadsError: null }));
    try {
      const res = await fetch(`/api/metrics/leads?period=${period}`);
      const data = await res.json();
      if (data.error && !data.total && data.total !== 0) {
        setLiveMetrics(prev => ({ ...prev, leadsError: data.error, leadsLoading: false }));
      } else {
        setLiveMetrics(prev => ({ 
          ...prev, 
          leads: data, 
          leadsLoading: false,
          leadsError: data.error || null,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch Leads metrics:', error);
      setLiveMetrics(prev => ({ 
        ...prev, 
        leadsError: 'Failed to connect', 
        leadsLoading: false 
      }));
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      fetchFacebookMetrics(timePeriod),
      fetchGHLMetrics(timePeriod),
      fetchStripeMetrics(timePeriod),
      fetchLeadsMetrics(timePeriod),
    ]);
    setIsRefreshing(false);
  }, [fetchDashboardData, fetchFacebookMetrics, fetchGHLMetrics, fetchStripeMetrics, fetchLeadsMetrics, timePeriod]);

  // Fetch metrics when time period changes
  useEffect(() => {
    fetchFacebookMetrics(timePeriod);
    fetchGHLMetrics(timePeriod);
    fetchStripeMetrics(timePeriod);
    fetchLeadsMetrics(timePeriod);
  }, [timePeriod, fetchFacebookMetrics, fetchGHLMetrics, fetchStripeMetrics, fetchLeadsMetrics]);

  useEffect(() => {
    fetchDashboardData();
    fetchFacebookMetrics(timePeriod);
    fetchGHLMetrics(timePeriod);
    fetchStripeMetrics(timePeriod);
    fetchLeadsMetrics(timePeriod);
    
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    const dataRefresh = setInterval(fetchDashboardData, 30000);
    const metricsRefresh = setInterval(() => {
      fetchFacebookMetrics(timePeriod);
      fetchGHLMetrics(timePeriod);
      fetchStripeMetrics(timePeriod);
      fetchLeadsMetrics(timePeriod);
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => {
      clearInterval(timer);
      clearInterval(dataRefresh);
      clearInterval(metricsRefresh);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchDashboardData]);

  // Refetch Facebook metrics when time period changes
  useEffect(() => {
    fetchFacebookMetrics(timePeriod);
  }, [timePeriod, fetchFacebookMetrics]);

  // Get the period label for display
  const periodLabel = PERIOD_LABELS[timePeriod];

  // Compute live metrics with fallbacks
  // Leads now come from Turso (source of truth), not FB
  const computedMetrics = {
    leads: {
      current: liveMetrics.leads?.periodCount ?? DEFAULT_METRICS.leads.thisWeek,
      total: liveMetrics.leads?.total ?? 0,
      today: liveMetrics.leads?.today ?? 0,
      thisWeek: liveMetrics.leads?.thisWeek ?? 0,
      previous: DEFAULT_METRICS.leads.lastWeek,
      target: DEFAULT_METRICS.leads.target,
    },
    adSpend: {
      current: liveMetrics.facebook?.spend ?? DEFAULT_METRICS.adSpend.thisWeek,
      budget: DEFAULT_METRICS.adSpend.budget,
      dailyTarget: DEFAULT_METRICS.adSpend.dailyTarget,
      todaySpend: DEFAULT_METRICS.adSpend.todaySpend,
    },
    cpa: {
      current: liveMetrics.facebook?.cpa ?? DEFAULT_METRICS.cpa.current,
      target: DEFAULT_METRICS.cpa.target,
      previous: DEFAULT_METRICS.cpa.lastWeek,
    },
    registrations: {
      // Registrations also from Turso leads (same source as leads)
      current: liveMetrics.leads?.periodCount ?? DEFAULT_METRICS.registrations.thisWeek,
      previous: DEFAULT_METRICS.registrations.lastWeek,
    },
    showRate: DEFAULT_METRICS.showRate,
    challengeStayers: DEFAULT_METRICS.challengeStayers,
    revenue: {
      current: liveMetrics.stripe?.period?.revenue ?? liveMetrics.stripe?.last7Days?.revenue ?? DEFAULT_METRICS.revenue.thisWeek,
      today: liveMetrics.stripe?.today.revenue ?? 0,
      previous: DEFAULT_METRICS.revenue.lastWeek,
      goal: DEFAULT_METRICS.revenue.goal,
      mtd: liveMetrics.stripe?.period?.revenue ?? liveMetrics.stripe?.last7Days?.revenue ?? DEFAULT_METRICS.revenue.mtd,
      pending: liveMetrics.stripe?.balance.pending ?? 0,
    },
    sales: {
      current: liveMetrics.stripe?.period?.sales ?? liveMetrics.stripe?.last7Days?.sales ?? liveMetrics.ghl?.opportunitiesWon ?? DEFAULT_METRICS.sales.thisWeek,
      today: liveMetrics.stripe?.today.sales ?? 0,
      previous: DEFAULT_METRICS.sales.lastWeek,
      avgTicket: DEFAULT_METRICS.sales.avgTicket,
    },
    conversionRate: DEFAULT_METRICS.conversionRate,
  };

  // Handle clicking on a task to open detail modal
  const handleTaskClick = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const task = await res.json();
        setSelectedTask(task);
        setIsDetailOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch task:', error);
    }
  };

  // Handle updating a task from the detail modal
  const handleTaskUpdate = (updatedTask: Task) => {
    setSelectedTask(updatedTask);
    // Refresh dashboard data to reflect changes
    fetchDashboardData();
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toLocaleString()}`;
  };

  const getChangePercent = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };

  const isOnTarget = (current: number, target: number, higher = true) => {
    return higher ? current >= target : current <= target;
  };

  // Calculate key metrics using live data
  const revenueChange = getChangePercent(computedMetrics.revenue.current, computedMetrics.revenue.previous);
  const leadsChange = computedMetrics.leads.previous > 0 
    ? getChangePercent(computedMetrics.leads.current, computedMetrics.leads.previous) 
    : 0;
  const salesChange = computedMetrics.sales.previous > 0 
    ? getChangePercent(computedMetrics.sales.current, computedMetrics.sales.previous) 
    : 0;
  const cpaOnTarget = computedMetrics.cpa.current > 0 
    ? isOnTarget(computedMetrics.cpa.current, computedMetrics.cpa.target, false) 
    : true;
  const showRateOnTarget = isOnTarget(computedMetrics.showRate.current, computedMetrics.showRate.target, true);
  const conversionOnTarget = computedMetrics.conversionRate.current >= computedMetrics.conversionRate.targetMin;
  
  const progressToGoal = (computedMetrics.revenue.mtd / computedMetrics.revenue.goal) * 100;
  
  // Data source status indicators
  const fbLive = liveMetrics.facebook && !liveMetrics.facebookError;
  const ghlLive = liveMetrics.ghl && !liveMetrics.ghlError;
  const stripeLive = liveMetrics.stripe && !liveMetrics.stripeError;
  const leadsLive = liveMetrics.leads && !liveMetrics.leadsError;
  const anyLoading = liveMetrics.facebookLoading || liveMetrics.ghlLoading || liveMetrics.stripeLoading || liveMetrics.leadsLoading;

  // Funnel data using live metrics
  const funnelData = [
    { name: 'Leads', value: computedMetrics.leads.current, fill: '#00D9FF' },
    { name: 'Registered', value: computedMetrics.registrations.current, fill: '#E91E8C' },
    { name: 'Showed Up', value: Math.round(computedMetrics.registrations.current * 0.31), fill: '#FBBF24' }, // Using show rate
    { name: 'Day 3', value: Math.round(computedMetrics.registrations.current * 0.38), fill: '#34D399' }, // Placeholder
    { name: 'Purchased', value: computedMetrics.sales.current, fill: '#8B5CF6' },
  ];

  // Prepare chart data from real dashboard data
  const taskStatusChartData = dashboardData ? [
    { name: 'Inbox', value: dashboardData.tasksByStatus.inbox, fill: STATUS_COLORS.inbox },
    { name: 'Up Next', value: dashboardData.tasksByStatus['up-next'], fill: STATUS_COLORS['up-next'] },
    { name: 'In Progress', value: dashboardData.tasksByStatus['in-progress'], fill: STATUS_COLORS['in-progress'] },
    { name: 'In Review', value: dashboardData.tasksByStatus['in-review'], fill: STATUS_COLORS['in-review'] },
    { name: 'Done', value: dashboardData.tasksByStatus.done, fill: STATUS_COLORS.done },
  ].filter(d => d.value > 0) : [];

  const priorityChartData = dashboardData ? [
    { name: 'Urgent', value: dashboardData.tasksByPriority.urgent, fill: PRIORITY_COLORS.urgent },
    { name: 'High', value: dashboardData.tasksByPriority.high, fill: PRIORITY_COLORS.high },
    { name: 'Medium', value: dashboardData.tasksByPriority.medium, fill: PRIORITY_COLORS.medium },
    { name: 'Low', value: dashboardData.tasksByPriority.low, fill: PRIORITY_COLORS.low },
  ].filter(d => d.value > 0) : [];

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_created': return <ListTodo className="w-4 h-4 text-[#34D399]" />;
      case 'task_moved': return <ArrowUpRight className="w-4 h-4 text-[#00D9FF]" />;
      case 'task_updated': return <Activity className="w-4 h-4 text-[#FBBF24]" />;
      case 'comment': return <Users className="w-4 h-4 text-[#8B5CF6]" />;
      default: return <Zap className="w-4 h-4 text-[#E91E8C]" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
      critical: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    const normalized = priority?.toLowerCase() || 'medium';
    return colors[normalized] || colors.medium;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-foreground">
      {/* Header */}
      <header className="border-b border-[#2A2A3E] bg-[#0E0E14]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E91E8C] to-[#00D9FF] flex items-center justify-center shadow-lg shadow-[#E91E8C]/20">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-[#E91E8C] to-[#00D9FF] bg-clip-text text-transparent">
                    AIM Blitz Command Center
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    {' • '}
                    {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              
              {/* Time Period Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#1A1A2E] border border-[#2A2A3E]">
                {TIME_PERIODS.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => handlePeriodChange(period.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      timePeriod === period.value
                        ? 'bg-[#E91E8C] text-white shadow-lg shadow-[#E91E8C]/30'
                        : 'text-muted-foreground hover:text-white hover:bg-[#2A2A3E]'
                    }`}
                  >
                    {period.shortLabel}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="px-4 py-2 rounded-lg bg-[#1A1A2E] border border-[#2A2A3E] hover:border-[#E91E8C]/50 hover:bg-[#E91E8C]/10 transition-all duration-200 flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Task Board
              </Link>
              <Link 
                href="/finances"
                className="px-4 py-2 rounded-lg bg-[#1A1A2E] border border-[#2A2A3E] hover:border-[#00D9FF]/50 hover:bg-[#00D9FF]/10 transition-all duration-200 flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                Finances
              </Link>
              
              {/* Data Source Status */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1A1A2E]/50 backdrop-blur border border-[#2A2A3E]">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${leadsLive ? 'bg-[#34D399]' : liveMetrics.leadsLoading ? 'bg-[#FBBF24] animate-pulse' : 'bg-red-400'}`} />
                  <span className="text-[10px] text-muted-foreground">Leads</span>
                </div>
                <div className="w-px h-3 bg-[#2A2A3E]" />
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${fbLive ? 'bg-[#34D399]' : liveMetrics.facebookLoading ? 'bg-[#FBBF24] animate-pulse' : 'bg-red-400'}`} />
                  <span className="text-[10px] text-muted-foreground">FB</span>
                </div>
                <div className="w-px h-3 bg-[#2A2A3E]" />
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${stripeLive ? 'bg-[#34D399]' : liveMetrics.stripeLoading ? 'bg-[#FBBF24] animate-pulse' : 'bg-red-400'}`} />
                  <span className="text-[10px] text-muted-foreground">Stripe</span>
                </div>
              </div>

              <button
                onClick={refreshAllData}
                disabled={isRefreshing}
                className="px-3 py-2 rounded-lg bg-[#1A1A2E] border border-[#2A2A3E] hover:border-[#00D9FF]/50 hover:bg-[#00D9FF]/10 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A1A2E]/50 backdrop-blur border border-[#34D399]/30">
                <div className={`w-2 h-2 rounded-full ${anyLoading ? 'bg-[#FBBF24] animate-pulse' : (leadsLive || fbLive || stripeLive) ? 'bg-[#34D399] animate-pulse' : 'bg-orange-400'}`} />
                <span className={`text-sm ${anyLoading ? 'text-[#FBBF24]' : (leadsLive || fbLive || stripeLive) ? 'text-[#34D399]' : 'text-orange-400'}`}>
                  {anyLoading ? 'Loading...' : (leadsLive || fbLive || stripeLive) ? 'Live Data' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-6 space-y-6">
        {/* Hero Metrics Row */}
        <div className="grid grid-cols-6 gap-4">
          {/* Revenue */}
          <MetricCard
            icon={<DollarSign className="w-5 h-5" />}
            label={`Revenue ${PERIOD_LABELS[timePeriod]}`}
            value={liveMetrics.stripeLoading ? '...' : formatCurrency(computedMetrics.revenue.current)}
            subtext={computedMetrics.revenue.today > 0 ? `$${computedMetrics.revenue.today.toLocaleString()} today` : undefined}
            color="#E91E8C"
            progress={(computedMetrics.revenue.mtd / computedMetrics.revenue.goal) * 100}
            progressLabel={`${progressToGoal.toFixed(1)}% to $1M`}
            isLoading={liveMetrics.stripeLoading}
            badge={stripeLive ? 'Stripe Live' : liveMetrics.stripeError ? 'Error' : undefined}
            badgeColor={stripeLive ? '#34D399' : '#EF4444'}
          />

          {/* Leads - from Turso (source of truth) */}
          <MetricCard
            icon={<Users className="w-5 h-5" />}
            label={`Leads ${PERIOD_LABELS[timePeriod]}`}
            value={liveMetrics.leadsLoading ? '...' : computedMetrics.leads.current.toLocaleString()}
            subtext={computedMetrics.leads.today > 0 ? `${computedMetrics.leads.today} today` : undefined}
            change={computedMetrics.leads.current > 0 ? leadsChange : undefined}
            color="#00D9FF"
            isLoading={liveMetrics.leadsLoading}
            badge={leadsLive ? 'Turso Live' : liveMetrics.leadsError ? 'Error' : undefined}
            badgeColor={leadsLive ? '#34D399' : '#EF4444'}
          />

          {/* Ad Spend */}
          <MetricCard
            icon={<DollarSign className="w-5 h-5" />}
            label={`Ad Spend ${PERIOD_LABELS[timePeriod]}`}
            value={liveMetrics.facebookLoading ? '...' : formatCurrency(computedMetrics.adSpend.current)}
            subtext={`of $${computedMetrics.adSpend.budget.toLocaleString()} budget`}
            color="#8B5CF6"
            isLoading={liveMetrics.facebookLoading}
            badge={fbLive ? 'FB Live' : liveMetrics.facebookError ? 'Error' : undefined}
            badgeColor={fbLive ? '#34D399' : '#EF4444'}
          />

          {/* CPA */}
          <MetricCard
            icon={<Target className="w-5 h-5" />}
            label="CPA"
            value={liveMetrics.facebookLoading ? '...' : computedMetrics.cpa.current > 0 ? `$${Math.round(computedMetrics.cpa.current)}` : 'N/A'}
            target={`≤$${computedMetrics.cpa.target}`}
            subtext={PERIOD_LABELS[timePeriod]}
            isGood={cpaOnTarget}
            color={computedMetrics.cpa.current === 0 ? '#6B7280' : cpaOnTarget ? '#34D399' : '#EF4444'}
            isLoading={liveMetrics.facebookLoading}
            badge={fbLive ? 'FB Live' : undefined}
            badgeColor="#34D399"
          />

          {/* Registrations (from Turso - same as leads) */}
          <MetricCard
            icon={<Users className="w-5 h-5" />}
            label={`Registrations ${PERIOD_LABELS[timePeriod]}`}
            value={liveMetrics.leadsLoading ? '...' : computedMetrics.registrations.current.toLocaleString()}
            color="#34D399"
            isLoading={liveMetrics.leadsLoading}
            badge={leadsLive ? 'Turso Live' : liveMetrics.leadsError ? 'Error' : undefined}
            badgeColor={leadsLive ? '#34D399' : '#EF4444'}
          />

          {/* Sales/Opportunities Won */}
          <MetricCard
            icon={<TrendingUp className="w-5 h-5" />}
            label={`Sales Won ${PERIOD_LABELS[timePeriod]}`}
            value={liveMetrics.ghlLoading ? '...' : computedMetrics.sales.current.toLocaleString()}
            change={computedMetrics.sales.current > 0 ? salesChange : undefined}
            color="#FBBF24"
            isLoading={liveMetrics.ghlLoading}
            badge={ghlLive ? 'GHL Live' : liveMetrics.ghlError ? 'Error' : undefined}
            badgeColor={ghlLive ? '#34D399' : '#EF4444'}
          />
        </div>

        {/* February 2026 Review Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#E91E8C]/20 via-[#8B5CF6]/20 to-[#00D9FF]/20 border border-[#E91E8C]/30 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#E91E8C]/20 border border-[#E91E8C]/30">
                <Award className="w-6 h-6 text-[#E91E8C]" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-[#E91E8C] to-[#00D9FF] bg-clip-text text-transparent">
                  February 2026 Review
                </h2>
                <p className="text-sm text-muted-foreground">Webinar model is working. 2.65x ROAS.</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#34D399]">$26,500</div>
                <div className="text-xs text-muted-foreground">Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#00D9FF]">17</div>
                <div className="text-xs text-muted-foreground">Sales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#8B5CF6]">~$10K</div>
                <div className="text-xs text-muted-foreground">Ad Spend</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#E91E8C]">2.65x</div>
                <div className="text-xs text-muted-foreground">ROAS</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#FBBF24]">$26</div>
                <div className="text-xs text-muted-foreground">CPA</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Charts */}
          <div className="col-span-8 space-y-6">
            {/* Revenue & Leads Chart */}
            <div className="p-6 rounded-2xl bg-[#12121A]/80 backdrop-blur border border-[#2A2A3E] shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">Revenue & Leads Trend</h2>
                  <p className="text-sm text-muted-foreground">This week's performance</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#E91E8C]" />
                    Revenue
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#00D9FF]" />
                    Leads
                  </div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyRevenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E91E8C" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#E91E8C" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D9FF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00D9FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3E" />
                    <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
                    <YAxis yAxisId="left" stroke="#6B7280" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#6B7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1A1A2E', 
                        border: '1px solid #2A2A3E',
                        borderRadius: '8px',
                      }}
                      formatter={(value, name) => [
                        name === 'revenue' ? `$${Number(value).toLocaleString()}` : value,
                        name === 'revenue' ? 'Revenue' : 'Leads'
                      ]}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#E91E8C" strokeWidth={2} fill="url(#revenueGradient)" />
                    <Area yAxisId="right" type="monotone" dataKey="leads" stroke="#00D9FF" strokeWidth={2} fill="url(#leadsGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Funnel Visualization */}
            <div className="p-6 rounded-2xl bg-[#12121A]/80 backdrop-blur border border-[#2A2A3E] shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">Conversion Funnel</h2>
                  <p className="text-sm text-muted-foreground">Lead to sale journey</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {funnelData.map((stage, idx) => {
                  const prevValue = idx > 0 ? funnelData[idx - 1].value : stage.value;
                  const convRate = idx > 0 ? ((stage.value / prevValue) * 100).toFixed(1) : '100';
                  return (
                    <div key={stage.name} className="flex-1 relative group">
                      <div 
                        className="rounded-xl p-4 text-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg"
                        style={{ 
                          backgroundColor: `${stage.fill}15`, 
                          borderColor: `${stage.fill}40`, 
                          borderWidth: 1,
                          boxShadow: `0 0 20px ${stage.fill}10`
                        }}
                      >
                        <div className="text-2xl font-bold" style={{ color: stage.fill }}>
                          {stage.value.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{stage.name}</div>
                        {idx > 0 && (
                          <div className="text-xs mt-2 px-2 py-0.5 rounded-full bg-[#1A1A2E] inline-block">
                            {convRate}% conv
                          </div>
                        )}
                      </div>
                      {idx < funnelData.length - 1 && (
                        <ChevronRight className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3A3A5E]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tasks Charts Row */}
            <div className="grid grid-cols-2 gap-6">
              {/* Tasks by Status Donut */}
              <div className="p-6 rounded-2xl bg-[#12121A]/80 backdrop-blur border border-[#2A2A3E] shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">Tasks by Status</h2>
                    <p className="text-sm text-muted-foreground">
                      {dashboardData?.totalTasks || 0} total tasks
                    </p>
                  </div>
                </div>
                <div className="h-64">
                  {taskStatusChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taskStatusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          animationBegin={0}
                          animationDuration={800}
                        >
                          {taskStatusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1A1A2E', 
                            border: '1px solid #2A2A3E',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No tasks yet
                    </div>
                  )}
                </div>
              </div>

              {/* Tasks by Priority */}
              <div className="p-6 rounded-2xl bg-[#12121A]/80 backdrop-blur border border-[#2A2A3E] shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">Tasks by Priority</h2>
                    <p className="text-sm text-muted-foreground">Active tasks breakdown</p>
                  </div>
                </div>
                <div className="h-64">
                  {priorityChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={priorityChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          animationBegin={0}
                          animationDuration={800}
                        >
                          {priorityChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1A1A2E', 
                            border: '1px solid #2A2A3E',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No active tasks
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Action Items & Activity */}
          <div className="col-span-4 space-y-6">
            {/* Overdue Tasks Alert */}
            {dashboardData && dashboardData.overdueTasks.length > 0 && (
              <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 shadow-xl shadow-red-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-400">Overdue Tasks</h3>
                    <p className="text-xs text-red-400/70">{dashboardData.overdueTasks.length} tasks need attention</p>
                  </div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {dashboardData.overdueTasks.map(task => (
                    <button 
                      key={task.id} 
                      onClick={() => handleTaskClick(task.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0A0A0F]/50 hover:bg-[#1A1A2E] transition-colors group text-left"
                    >
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-red-400/70">Due {formatDueDate(task.due_date)}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] rounded-full border ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks Due This Week */}
            <div className="p-5 rounded-2xl bg-[#12121A]/80 backdrop-blur border border-[#2A2A3E] shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#00D9FF]/20">
                  <CalendarDays className="w-5 h-5 text-[#00D9FF]" />
                </div>
                <div>
                  <h3 className="font-semibold">Due This Week</h3>
                  <p className="text-xs text-muted-foreground">{dashboardData?.tasksDueThisWeek.length || 0} tasks</p>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {dashboardData?.tasksDueThisWeek.length ? (
                  dashboardData.tasksDueThisWeek.map(task => (
                    <button 
                      key={task.id} 
                      onClick={() => handleTaskClick(task.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#1A1A2E]/50 hover:bg-[#1A1A2E] transition-colors group text-left"
                    >
                      <Calendar className="w-4 h-4 text-[#00D9FF] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">Due {formatDueDate(task.due_date)}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] rounded-full border ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No tasks due this week
                  </div>
                )}
              </div>
            </div>

            {/* Task Counts by Assignee */}
            <div className="p-5 rounded-2xl bg-[#12121A]/80 backdrop-blur border border-[#2A2A3E] shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#E91E8C]/20">
                  <Users className="w-5 h-5 text-[#E91E8C]" />
                </div>
                <div>
                  <h3 className="font-semibold">Tasks by Assignee</h3>
                  <p className="text-xs text-muted-foreground">Active task distribution</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {dashboardData && Object.entries(dashboardData.tasksByAssignee).map(([name, count]) => (
                  <div 
                    key={name} 
                    className="p-3 rounded-lg bg-[#1A1A2E]/50 flex items-center gap-3"
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: ASSIGNEE_COLORS[name] || '#6B7280' }}
                    >
                      {name[0]}
                    </div>
                    <div>
                      <p className="text-lg font-bold" style={{ color: ASSIGNEE_COLORS[name] || '#6B7280' }}>
                        {count}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="p-5 rounded-2xl bg-[#12121A]/80 backdrop-blur border border-[#2A2A3E] shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#FBBF24]/20">
                    <Activity className="w-5 h-5 text-[#FBBF24]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Recent Activity</h3>
                    <p className="text-xs text-muted-foreground">Last 10 actions</p>
                  </div>
                </div>
                <Link href="/" className="text-xs text-[#00D9FF] hover:underline flex items-center gap-1">
                  View All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {dashboardData?.recentActivity.length ? (
                  dashboardData.recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#1A1A2E]/30 transition-colors">
                      <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground/90 leading-tight">{activity.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {activity.agent && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1A1A2E] text-muted-foreground">
                              {activity.agent}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {formatRelativeTime(activity.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No recent activity
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#E91E8C]/10 to-[#00D9FF]/10 border border-[#2A2A3E] shadow-xl">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/" className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A2E]/80 hover:bg-[#2A2A3E] transition-all hover:translate-x-1">
                  <BarChart3 className="w-5 h-5 text-[#00D9FF]" />
                  <span className="flex-1">View Task Board</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#1A1A2E]/80 hover:bg-[#2A2A3E] transition-all hover:translate-x-1 text-left">
                  <Calendar className="w-5 h-5 text-[#E91E8C]" />
                  <span className="flex-1">Schedule Review</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#1A1A2E]/80 hover:bg-[#2A2A3E] transition-all hover:translate-x-1 text-left">
                  <Award className="w-5 h-5 text-[#34D399]" />
                  <span className="flex-1">Export Report</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        task={selectedTask}
        onUpdate={handleTaskUpdate}
      />
    </div>
  );
}

// Metric Card Component
function MetricCard({
  icon,
  label,
  value,
  change,
  subtext,
  target,
  isGood,
  color,
  progress,
  progressLabel,
  isLoading,
  badge,
  badgeColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: number;
  subtext?: string;
  target?: string;
  isGood?: boolean;
  color: string;
  progress?: number;
  progressLabel?: string;
  isLoading?: boolean;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div 
      className="p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
      style={{ 
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}30`,
        boxShadow: `0 4px 24px ${color}10`
      }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl" style={{ backgroundColor: `${color}10` }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2" style={{ color }}>
            {icon}
            <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
          </div>
          {badge && (
            <span 
              className="text-[8px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ 
                backgroundColor: `${badgeColor || color}20`,
                color: badgeColor || color,
                border: `1px solid ${badgeColor || color}40`
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="text-2xl font-bold mb-1 flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            value
          )}
        </div>
        {change !== undefined && !isLoading && (
          <div className={`flex items-center gap-1 text-xs ${change >= 0 ? 'text-[#34D399]' : 'text-red-400'}`}>
            {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}% vs last week
          </div>
        )}
        {target && (
          <div className="flex items-center gap-2 text-xs mt-1">
            <div className={`w-2 h-2 rounded-full ${isGood ? 'bg-[#34D399]' : 'bg-red-400'}`} />
            <span className="text-muted-foreground">Target: {target}</span>
          </div>
        )}
        {subtext && <div className="text-xs text-muted-foreground mt-1">{subtext}</div>}
        {progress !== undefined && (
          <div className="mt-2">
            <div className="h-1.5 bg-[#1A1A2E] rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }}
              />
            </div>
            {progressLabel && <div className="text-[10px] text-muted-foreground mt-1">{progressLabel}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
