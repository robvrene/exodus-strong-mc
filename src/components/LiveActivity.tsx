'use client';

import { useState, useEffect, useCallback } from 'react';
import { Activity } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity as ActivityIcon, 
  ChevronDown, 
  ChevronUp,
  Bot,
  User,
  MessageSquare,
  Zap,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  task_created: { icon: Zap, color: '#34D399', label: 'Created' },
  task_updated: { icon: RefreshCw, color: '#00D9FF', label: 'Updated' },
  task_moved: { icon: ActivityIcon, color: '#E91E8C', label: 'Moved' },
  agent_action: { icon: Bot, color: '#A78BFA', label: 'Agent' },
  comment: { icon: MessageSquare, color: '#FBBF24', label: 'Comment' },
  system: { icon: AlertCircle, color: '#94A3B8', label: 'System' },
};

export function LiveActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/activity?limit=20');
      const data = await res.json();
      setActivities(data);
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    // Poll for updates every 15 seconds
    const interval = setInterval(fetchActivity, 15000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <Card className="bg-[#12121A] border-[#2A2A3E] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#1A1A2E] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <ActivityIcon className="h-4 w-4 text-[#E91E8C]" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#34D399] rounded-full pulse-dot" />
          </div>
          <span className="font-semibold text-sm">Live Activity</span>
          <Badge variant="outline" className="text-[10px] bg-[#1E1E2A] border-[#2A2A3E]">
            {activities.length}
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-[#2A2A3E]">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-5 h-5 border-2 border-[#E91E8C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
              <ActivityIcon className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No activity yet</p>
              <p className="text-xs">Create a task to see activity here</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {activities.map((activity) => {
                const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.system;
                const Icon = config.icon;

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 hover:bg-[#1A1A2E]/50 transition-colors border-b border-[#2A2A3E]/50 last:border-0"
                  >
                    {/* Icon */}
                    <div
                      className="mt-0.5 p-1.5 rounded-md"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      <Icon className="h-3 w-3" style={{ color: config.color }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-2">
                        {activity.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {activity.agent && (
                          <div className="flex items-center gap-1">
                            <Bot className="h-3 w-3 text-[#00D9FF]" />
                            <span className="text-[10px] text-[#00D9FF]">{activity.agent}</span>
                          </div>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(activity.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Refresh button */}
          <div className="p-2 border-t border-[#2A2A3E]">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchActivity}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
