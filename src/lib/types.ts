export type TaskStatus = 'inbox' | 'up-next' | 'in-progress' | 'waiting-on-aaron' | 'in-review' | 'done' | 'backlog';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_agent: string | null;
  mission_id: string | null;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  tags: string | null;
  metadata: string | null;
}

export interface Activity {
  id: number;
  type: 'task_created' | 'task_updated' | 'task_moved' | 'agent_action' | 'comment' | 'system';
  message: string;
  agent: string | null;
  task_id: string | null;
  metadata: string | null;
  created_at: string;
}

export interface Subtask {
  id: number;
  task_id: string;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
}

export interface Link {
  id: number;
  task_id: string;
  url: string;
  title: string | null;
  created_at: string;
}

export interface Comment {
  id: number;
  task_id: string;
  content: string;
  author: string;
  created_at: string;
}

export const AGENTS = ['Aaron', 'Solomon', 'Phil', 'Alex'] as const;
export type Agent = typeof AGENTS[number];

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  color: string;
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'inbox', title: 'Inbox', color: '#94A3B8' },
  { id: 'up-next', title: 'Up Next', color: '#00D9FF' },
  { id: 'in-progress', title: 'In Progress', color: '#E91E8C' },
  { id: 'waiting-on-aaron', title: '⏳ Waiting on Aaron', color: '#FBBF24' },
  { id: 'in-review', title: 'In Review', color: '#A855F7' },
  { id: 'done', title: 'Done', color: '#34D399' },
  { id: 'backlog', title: '📦 Backlog', color: '#64748B' },
];

export const PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
  medium: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  urgent: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  critical: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
};
