'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Zap,
  RefreshCw,
  ChevronLeft,
  Loader2,
  ExternalLink,
  Eye,
  Users,
  Globe,
  TrendingUp,
  Calendar,
  BarChart3,
  DollarSign,
  Target,
  ArrowRight,
  ShoppingCart,
} from 'lucide-react';

interface PageStats {
  path: string;
  views: number;
  visitors: number;
}

interface TopReferrer {
  referrer: string;
  views: number;
}

interface Analytics {
  pageViews: number;
  uniqueVisitors: number;
  pages: PageStats[];
  topReferrers: TopReferrer[];
}

interface StripeMetrics {
  sales: number;
  revenue: number;
}

interface LeadMetrics {
  total: number;
  unique: number;
}

interface FunnelProject {
  id: string;
  name: string;
  projectId: string;
  liveUrl: string;
  analytics?: Analytics;
  leads?: LeadMetrics;
  stripe?: StripeMetrics;
  epc?: number;
  conversionRate?: number;
  error?: string;
}

interface FunnelData {
  projects: FunnelProject[];
  totals: {
    pageViews: number;
    uniqueVisitors: number;
    leads: number;
    sales: number;
    revenue: number;
  };
  stripe: StripeMetrics;
  period: string;
  from: string;
  to: string;
}

type Period = 'today' | 'week' | 'month';

const PERIOD_OPTIONS: { value: Period; label: string; icon: React.ReactNode }[] = [
  { value: 'today', label: 'Today', icon: <Calendar className="w-4 h-4" /> },
  { value: 'week', label: 'Last 7 Days', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'month', label: 'Last 30 Days', icon: <BarChart3 className="w-4 h-4" /> },
];

export default function FunnelsPage() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch(`/api/metrics/vercel?period=${selectedPeriod}`);
      if (!response.ok) {
        throw new Error('Failed to fetch funnel data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period);
    setIsLoading(true);
  };

  const handleRefresh = () => {
    fetchData(true);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-foreground">
      {/* Header */}
      <header className="border-b border-[#2A2A3E] bg-[#0E0E14]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link 
                href="/"
                className="p-2 rounded-lg hover:bg-[#1A1A2E] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E91E8C] to-[#00D9FF] flex items-center justify-center shadow-lg shadow-[#E91E8C]/20">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-[#E91E8C] to-[#00D9FF] bg-clip-text text-transparent">
                    Funnel Analytics
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Marketing metrics & conversion tracking
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 rounded-lg bg-[#1A1A2E] border border-[#2A2A3E] hover:border-[#00D9FF]/50 hover:bg-[#00D9FF]/10 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-6">
        {/* Period Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 p-1 rounded-xl bg-[#12121A]/80 border border-[#2A2A3E] w-fit">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handlePeriodChange(option.value)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                selectedPeriod === option.value
                  ? 'bg-[#E91E8C] text-white shadow-lg shadow-[#E91E8C]/30'
                  : 'text-muted-foreground hover:text-white hover:bg-[#1A1A2E]'
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-[#E91E8C] animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Failed to Load</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => fetchData()}
              className="px-4 py-2 rounded-lg bg-[#E91E8C] hover:bg-[#C4187A] text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : data ? (
          <>
            {/* Key Metrics Summary - Funnel Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <MetricCard
                title="Visitors"
                value={data.totals.uniqueVisitors.toLocaleString()}
                icon={<Users className="w-5 h-5" />}
                color="#00D9FF"
                subtitle="Landing page hits"
              />
              <MetricCard
                title="Leads"
                value={data.totals.leads.toLocaleString()}
                icon={<Target className="w-5 h-5" />}
                color="#E91E8C"
                subtitle="Form submissions"
              />
              <MetricCard
                title="Sales"
                value={data.stripe.sales.toString()}
                icon={<ShoppingCart className="w-5 h-5" />}
                color="#34D399"
              />
              <MetricCard
                title="Revenue"
                value={formatCurrency(data.stripe.revenue)}
                icon={<DollarSign className="w-5 h-5" />}
                color="#FBBF24"
              />
              <MetricCard
                title="EPC"
                value={data.totals.uniqueVisitors > 0 
                  ? `$${(data.stripe.revenue / data.totals.uniqueVisitors).toFixed(2)}`
                  : '$0.00'
                }
                icon={<Target className="w-5 h-5" />}
                color="#8B5CF6"
                subtitle="Earnings per visitor"
              />
            </div>

            {/* Funnel Cards */}
            <h2 className="text-lg font-semibold mb-4">Active Funnels</h2>
            <div className="space-y-6">
              {data.projects.map((project) => (
                <FunnelCard key={project.id} project={project} />
              ))}
            </div>
            
            {data.projects.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No active funnels configured. Add funnels in the API configuration.
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-[#12121A]/80 border border-[#2A2A3E] hover:border-[#3A3A5E] transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">{title}</span>
          {subtitle && <p className="text-[10px] text-muted-foreground/70">{subtitle}</p>}
        </div>
      </div>
      <p className="text-3xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function FunnelCard({ project }: { project: FunnelProject }) {
  const hasAnalytics = project.analytics && !project.error;

  return (
    <div className="p-6 rounded-2xl bg-[#12121A]/80 border border-[#2A2A3E] hover:border-[#E91E8C]/50 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E91E8C]/20 to-[#00D9FF]/20 border border-[#E91E8C]/30 flex items-center justify-center">
            <Zap className="w-6 h-6 text-[#E91E8C]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{project.name}</h3>
            <p className="text-sm text-muted-foreground">{project.liveUrl}</p>
          </div>
        </div>
        <a
          href={project.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-[#1A1A2E] border border-[#2A2A3E] hover:border-[#00D9FF]/50 hover:bg-[#00D9FF]/10 transition-all flex items-center gap-2 text-sm"
        >
          <Globe className="w-4 h-4 text-[#00D9FF]" />
          View Live
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {project.error ? (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {project.error}
        </div>
      ) : hasAnalytics ? (
        <>
          {/* Funnel Flow: Visitors → Leads → Sales */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-[#1A1A2E] relative">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-[#00D9FF]" />
                <span className="text-xs text-muted-foreground">Visitors</span>
              </div>
              <p className="text-2xl font-bold text-[#00D9FF]">
                {project.analytics!.uniqueVisitors.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Landing page</p>
              <ArrowRight className="absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3A3A5E] z-10" />
            </div>
            <div className="p-4 rounded-xl bg-[#1A1A2E] relative">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-[#E91E8C]" />
                <span className="text-xs text-muted-foreground">Leads</span>
              </div>
              <p className="text-2xl font-bold text-[#E91E8C]">
                {(project.leads?.unique || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Form submissions</p>
              <ArrowRight className="absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3A3A5E] z-10" />
            </div>
            <div className="p-4 rounded-xl bg-[#1A1A2E]">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="w-4 h-4 text-[#34D399]" />
                <span className="text-xs text-muted-foreground">Sales</span>
              </div>
              <p className="text-2xl font-bold text-[#34D399]">
                {project.stripe?.sales || 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Purchases</p>
            </div>
            <div className="p-4 rounded-xl bg-[#1A1A2E]">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-[#FBBF24]" />
                <span className="text-xs text-muted-foreground">Revenue</span>
              </div>
              <p className="text-2xl font-bold text-[#FBBF24]">
                ${(project.stripe?.revenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#1A1A2E]">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-[#8B5CF6]" />
                <span className="text-xs text-muted-foreground">EPC</span>
              </div>
              <p className="text-2xl font-bold text-[#8B5CF6]">
                ${project.epc?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>

          {/* Page-by-Page Funnel Flow */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Funnel Stage Breakdown
            </h4>
            {project.analytics!.pages.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {project.analytics!.pages.slice(0, 5).map((page, i, arr) => {
                  const prevViews = i > 0 ? arr[0].views : page.views;
                  const convRate = prevViews > 0 ? ((page.views / prevViews) * 100).toFixed(0) : 100;
                  
                  // Funnel stage labels
                  const stageLabel = i === 0 ? 'Visitors' : i === 1 ? 'Leads' : `Stage ${i + 1}`;
                  const stageColor = i === 0 ? '#00D9FF' : i === 1 ? '#E91E8C' : '#8B5CF6';
                  
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className="p-4 rounded-xl bg-[#1A1A2E] min-w-[160px]">
                        <div className="flex items-center gap-2 mb-2">
                          <span 
                            className="text-xs font-semibold px-2 py-0.5 rounded"
                            style={{ backgroundColor: `${stageColor}20`, color: stageColor }}
                          >
                            {stageLabel}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate mb-1" title={page.path}>
                          {page.path || '/'}
                        </p>
                        <p className="text-xl font-bold text-white mb-1">
                          {page.views.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {page.visitors.toLocaleString()} unique
                        </p>
                        {i > 0 && (
                          <div className="mt-2 pt-2 border-t border-[#2A2A3E]">
                            <span className={`text-xs ${Number(convRate) >= 50 ? 'text-[#34D399]' : 'text-[#FBBF24]'}`}>
                              {convRate}% conversion
                            </span>
                          </div>
                        )}
                      </div>
                      {i < arr.slice(0, 5).length - 1 && (
                        <ArrowRight className="w-5 h-5 text-[#3A3A5E] flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-4 bg-[#1A1A2E] rounded-lg">
                No page data yet - analytics are collecting
              </p>
            )}
          </div>

          {/* Top Referrers */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Traffic Sources
            </h4>
            <div className="flex flex-wrap gap-2">
              {project.analytics!.topReferrers.length > 0 ? (
                project.analytics!.topReferrers.slice(0, 5).map((ref, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 rounded-lg bg-[#1A1A2E] flex items-center gap-2"
                  >
                    <Globe className="w-3 h-3 text-[#00D9FF]" />
                    <span className="text-sm truncate max-w-[150px]" title={ref.referrer}>
                      {ref.referrer || 'Direct'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({ref.views.toLocaleString()})
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No referrer data yet</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="p-4 rounded-lg bg-[#1A1A2E] text-center">
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      )}
    </div>
  );
}
