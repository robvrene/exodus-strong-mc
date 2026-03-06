'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { KanbanBoard } from '@/components/KanbanBoard';
import { LiveActivity } from '@/components/LiveActivity';
import { Header } from '@/components/Header';
import { TaskModal } from '@/components/TaskModal';
import { RecurringTasks } from '@/components/RecurringTasks';
import { Task, TaskStatus } from '@/lib/types';
import { Image, Clock, CheckCircle, Tv, BarChart3 } from 'lucide-react';

interface TaskStats {
  inProgress: number;
  inReview: number;
  completed: number;
  total: number;
}

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<TaskStats>({ inProgress: 0, inReview: 0, completed: 0, total: 0 });

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      const tasks: Task[] = await res.json();
      setStats({
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        inReview: tasks.filter(t => t.status === 'in-review').length,
        completed: tasks.filter(t => t.status === 'done').length,
        total: tasks.length,
      });
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, refreshKey]);

  const handleNewTask = () => {
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      // Trigger refresh
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
      <Header onNewTask={handleNewTask} />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Kanban Board - Main Content */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full">
            <KanbanBoard key={refreshKey} />
          </div>
        </div>

        {/* Sidebar - Live Activity */}
        <aside className="w-80 border-l border-[#2A2A3E] bg-[#0E0E14] p-4 overflow-y-auto">
          <LiveActivity />
          
          {/* Stats Summary */}
          <div className="mt-4 p-4 rounded-lg bg-[#12121A] border border-[#2A2A3E]">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="In Progress" value={stats.inProgress.toString()} color="#E91E8C" />
              <StatCard label="In Review" value={stats.inReview.toString()} color="#FBBF24" />
              <StatCard label="Completed" value={stats.completed.toString()} color="#34D399" />
              <StatCard label="Total" value={stats.total.toString()} color="#00D9FF" />
            </div>
          </div>

          {/* Media Hub Link */}
          <Link 
            href="/content"
            className="mt-4 block p-4 rounded-lg bg-gradient-to-br from-[#E91E8C]/20 to-[#00D9FF]/20 border border-[#E91E8C]/40 hover:border-[#E91E8C]/80 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E91E8C] to-[#00D9FF] flex items-center justify-center">
                <Tv className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-[#E91E8C] transition-colors">Media Hub</h3>
                <p className="text-[10px] text-muted-foreground">Channels, content & analytics</p>
              </div>
              <span className="text-[#E91E8C] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </div>
          </Link>

          {/* Recurring Tasks */}
          <div className="mt-4 rounded-lg bg-[#12121A] border border-[#2A2A3E]">
            <RecurringTasks />
          </div>

          {/* Agent Status */}
          <div className="mt-4 p-4 rounded-lg bg-[#12121A] border border-[#2A2A3E]">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Agent Status</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E91E8C] to-[#00D9FF] flex items-center justify-center text-white font-bold">
                S
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Solomon</p>
                <p className="text-[10px] text-muted-foreground">claude-opus-4-5</p>
              </div>
              <span className="ml-auto w-2 h-2 bg-[#34D399] rounded-full pulse-dot" />
            </div>
          </div>
        </aside>
      </main>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        defaultStatus="inbox"
      />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center p-2 rounded-md bg-[#1A1A2E]">
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
