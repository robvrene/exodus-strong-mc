'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Play, RefreshCw, Calendar, Clock, ToggleLeft, ToggleRight } from 'lucide-react';

interface RecurringTask {
  id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project_id: string | null;
  schedule_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  schedule_day: number | null;
  schedule_time: string | null;
  cron_expression: string | null;
  last_created_at: string | null;
  next_due_at: string | null;
  active: boolean;
  created_at: string;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PRIORITY_COLORS: Record<string, string> = {
  low: '#60A5FA',
  medium: '#FBBF24',
  high: '#F97316',
  urgent: '#EF4444',
  critical: '#EC4899',
};

// Helper to get priority color with fallback
const getPriorityColor = (priority: string): string => {
  const normalized = priority?.toLowerCase() || 'medium';
  return PRIORITY_COLORS[normalized] || PRIORITY_COLORS.medium;
};

export function RecurringTasks() {
  const [tasks, setTasks] = useState<RecurringTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    schedule_type: 'daily' | 'weekly' | 'monthly' | 'custom';
    schedule_day: number;
    schedule_time: string;
  }>({
    title: '',
    description: '',
    priority: 'medium',
    schedule_type: 'daily',
    schedule_day: 1,
    schedule_time: '09:00',
  });

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/recurring-tasks');
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch recurring tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreate = async () => {
    try {
      const payload = {
        ...formData,
        schedule_day: formData.schedule_type === 'daily' ? null : formData.schedule_day,
      };
      
      if (editingTask) {
        await fetch(`/api/recurring-tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/recurring-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      
      setIsModalOpen(false);
      setEditingTask(null);
      resetForm();
      fetchTasks();
    } catch (error) {
      console.error('Failed to save recurring task:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recurring task?')) return;
    try {
      await fetch(`/api/recurring-tasks/${id}`, { method: 'DELETE' });
      fetchTasks();
    } catch (error) {
      console.error('Failed to delete recurring task:', error);
    }
  };

  const handleToggleActive = async (task: RecurringTask) => {
    try {
      await fetch(`/api/recurring-tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !task.active }),
      });
      fetchTasks();
    } catch (error) {
      console.error('Failed to toggle recurring task:', error);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/recurring-tasks/generate', { method: 'POST' });
      const data = await res.json();
      alert(`Generated ${data.created} tasks${data.errors.length > 0 ? ` with ${data.errors.length} errors` : ''}`);
      fetchTasks();
    } catch (error) {
      console.error('Failed to generate tasks:', error);
      alert('Failed to generate tasks');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = (task: RecurringTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      schedule_type: task.schedule_type,
      schedule_day: task.schedule_day ?? 1,
      schedule_time: task.schedule_time || '09:00',
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      schedule_type: 'daily',
      schedule_day: 1,
      schedule_time: '09:00',
    });
  };

  const openNewModal = () => {
    setEditingTask(null);
    resetForm();
    setIsModalOpen(true);
  };

  const formatSchedule = (task: RecurringTask): string => {
    const time = task.schedule_time || '00:00';
    switch (task.schedule_type) {
      case 'daily':
        return `Daily at ${time}`;
      case 'weekly':
        return `${DAYS_OF_WEEK[task.schedule_day ?? 0]}s at ${time}`;
      case 'monthly':
        const day = task.schedule_day ?? 1;
        const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
        return `${day}${suffix} of month at ${time}`;
      case 'custom':
        return task.cron_expression || 'Custom';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading recurring tasks...
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-[#E91E8C]" />
          Recurring Tasks
        </h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="text-xs h-7 border-[#2A2A3E] hover:border-[#00D9FF]/50"
          >
            <Play className="w-3 h-3 mr-1" />
            {isGenerating ? 'Generating...' : 'Run Now'}
          </Button>
          <Button
            size="sm"
            onClick={openNewModal}
            className="text-xs h-7 bg-[#E91E8C] hover:bg-[#C4187A]"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          No recurring tasks yet. Click &quot;Add&quot; to create one.
        </p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded-lg border transition-all cursor-pointer hover:border-[#E91E8C]/50 ${
                task.active 
                  ? 'bg-[#12121A] border-[#2A2A3E]' 
                  : 'bg-[#0A0A0F] border-[#1A1A2E] opacity-60'
              }`}
              onClick={() => handleEdit(task)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {task.title}
                    </span>
                    <Badge
                      className="text-[9px] px-1.5 py-0"
                      style={{ 
                        backgroundColor: `${getPriorityColor(task.priority)}20`,
                        color: getPriorityColor(task.priority),
                        borderColor: `${getPriorityColor(task.priority)}40`,
                      }}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatSchedule(task)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Next: {formatDate(task.next_due_at)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(task);
                    }}
                    title={task.active ? 'Disable' : 'Enable'}
                  >
                    {task.active ? (
                      <ToggleRight className="w-4 h-4 text-[#34D399]" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(task.id);
                    }}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#12121A] border-[#2A2A3E] text-foreground">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Recurring Task' : 'New Recurring Task'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task title..."
                className="bg-[#0A0A0F] border-[#2A2A3E]"
              />
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description..."
                className="bg-[#0A0A0F] border-[#2A2A3E]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v as 'low' | 'medium' | 'high' | 'urgent' })}
                >
                  <SelectTrigger className="bg-[#0A0A0F] border-[#2A2A3E]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#12121A] border-[#2A2A3E]">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Schedule Type</Label>
                <Select
                  value={formData.schedule_type}
                  onValueChange={(v) => setFormData({ ...formData, schedule_type: v as 'daily' | 'weekly' | 'monthly' | 'custom' })}
                >
                  <SelectTrigger className="bg-[#0A0A0F] border-[#2A2A3E]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#12121A] border-[#2A2A3E]">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.schedule_type === 'weekly' && (
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select
                  value={formData.schedule_day.toString()}
                  onValueChange={(v) => setFormData({ ...formData, schedule_day: parseInt(v) })}
                >
                  <SelectTrigger className="bg-[#0A0A0F] border-[#2A2A3E]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#12121A] border-[#2A2A3E]">
                    {DAYS_OF_WEEK.map((day, i) => (
                      <SelectItem key={i} value={i.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.schedule_type === 'monthly' && (
              <div className="space-y-2">
                <Label>Day of Month</Label>
                <Select
                  value={formData.schedule_day.toString()}
                  onValueChange={(v) => setFormData({ ...formData, schedule_day: parseInt(v) })}
                >
                  <SelectTrigger className="bg-[#0A0A0F] border-[#2A2A3E]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#12121A] border-[#2A2A3E]">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={formData.schedule_time}
                onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                className="bg-[#0A0A0F] border-[#2A2A3E]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-[#2A2A3E]">
              Cancel
            </Button>
            <Button onClick={handleCreate} className="bg-[#E91E8C] hover:bg-[#C4187A]" disabled={!formData.title}>
              {editingTask ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
