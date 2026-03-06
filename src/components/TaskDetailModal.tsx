'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus, TaskPriority, KANBAN_COLUMNS, PRIORITY_COLORS, Subtask, Link, Comment, Activity, AGENTS } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  CheckSquare,
  Square,
  Link2,
  MessageSquare,
  Tag,
  User,
  Clock,
  Plus,
  Trash2,
  ExternalLink,
  AlertCircle,
  History,
  X,
  Save,
} from 'lucide-react';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onUpdate: (task: Task) => void;
}

export function TaskDetailModal({ isOpen, onClose, task, onUpdate }: TaskDetailModalProps) {
  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('inbox');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedAgent, setAssignedAgent] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  // Related data
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Input states
  const [newSubtask, setNewSubtask] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  
  // UI states
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load task data
  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setAssignedAgent(task.assigned_agent);
      setDueDate(task.due_date || '');
      setTags(task.tags ? task.tags.split(',').filter(t => t.trim()) : []);
      setHasChanges(false);
      
      // Fetch related data
      fetchSubtasks();
      fetchLinks();
      fetchComments();
      fetchActivity();
    }
  }, [task, isOpen]);

  const fetchSubtasks = async () => {
    if (!task) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`);
      if (res.ok) setSubtasks(await res.json());
    } catch (e) { console.error('Failed to fetch subtasks:', e); }
  };

  const fetchLinks = async () => {
    if (!task) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/links`);
      if (res.ok) setLinks(await res.json());
    } catch (e) { console.error('Failed to fetch links:', e); }
  };

  const fetchComments = async () => {
    if (!task) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`);
      if (res.ok) setComments(await res.json());
    } catch (e) { console.error('Failed to fetch comments:', e); }
  };

  const fetchActivity = async () => {
    if (!task) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/activity`);
      if (res.ok) setActivities(await res.json());
    } catch (e) { console.error('Failed to fetch activity:', e); }
  };

  // Save task changes
  const handleSave = async () => {
    if (!task) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          status,
          priority,
          assigned_agent: assignedAgent || null,
          due_date: dueDate || null,
          tags: tags.length > 0 ? tags.join(',') : null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        setHasChanges(false);
        fetchActivity();
      }
    } catch (e) {
      console.error('Failed to save task:', e);
    }
    setSaving(false);
  };

  // Mark that we have unsaved changes
  const markChanged = () => setHasChanges(true);

  // Subtask handlers
  const addSubtask = async () => {
    if (!task || !newSubtask.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtask.trim() }),
      });
      if (res.ok) {
        const subtask = await res.json();
        setSubtasks([...subtasks, subtask]);
        setNewSubtask('');
      }
    } catch (e) { console.error('Failed to add subtask:', e); }
  };

  const toggleSubtask = async (id: number, completed: boolean) => {
    try {
      const res = await fetch(`/api/subtasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });
      if (res.ok) {
        setSubtasks(subtasks.map(s => s.id === id ? { ...s, completed: !completed } : s));
      }
    } catch (e) { console.error('Failed to toggle subtask:', e); }
  };

  const deleteSubtask = async (id: number) => {
    try {
      const res = await fetch(`/api/subtasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSubtasks(subtasks.filter(s => s.id !== id));
      }
    } catch (e) { console.error('Failed to delete subtask:', e); }
  };

  // Link handlers
  const addLink = async () => {
    if (!task || !newLinkUrl.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newLinkUrl.trim(), title: newLinkTitle.trim() || null }),
      });
      if (res.ok) {
        const link = await res.json();
        setLinks([link, ...links]);
        setNewLinkUrl('');
        setNewLinkTitle('');
      }
    } catch (e) { console.error('Failed to add link:', e); }
  };

  const deleteLink = async (id: number) => {
    try {
      const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLinks(links.filter(l => l.id !== id));
      }
    } catch (e) { console.error('Failed to delete link:', e); }
  };

  // Comment handlers
  const addComment = async () => {
    if (!task || !newComment.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim(), author: 'User' }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments([...comments, comment]);
        setNewComment('');
      }
    } catch (e) { console.error('Failed to add comment:', e); }
  };

  const deleteComment = async (id: number) => {
    try {
      const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setComments(comments.filter(c => c.id !== id));
      }
    } catch (e) { console.error('Failed to delete comment:', e); }
  };

  // Tag handlers
  const addTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    setTags([...tags, newTag.trim()]);
    setNewTag('');
    markChanged();
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
    markChanged();
  };

  // Format helpers
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

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
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  };

  const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== 'done';

  if (!task) return null;

  const completedSubtasks = subtasks.filter(s => s.completed).length;
  // Normalize priority to lowercase and provide fallback
  const normalizedPriority = (priority?.toLowerCase() || 'medium') as TaskPriority;
  const priorityStyle = PRIORITY_COLORS[normalizedPriority] || PRIORITY_COLORS.medium;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#12121A] border-[#2A2A3E] max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">{task?.title || 'Task Details'}</DialogTitle>
        
        <div className="flex-shrink-0 border-b border-[#2A2A3E] pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Input
                value={title}
                onChange={(e) => { setTitle(e.target.value); markChanged(); }}
                placeholder="Task title"
                className="text-xl font-semibold bg-transparent border-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#E91E8C] hover:bg-[#C4187A] text-white"
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
          </div>
          
          {/* Status bar */}
          <div className="flex items-center gap-3 mt-3 text-sm">
            <Select value={status} onValueChange={(v) => { setStatus(v as TaskStatus); markChanged(); }}>
              <SelectTrigger className="w-36 h-8 bg-[#1A1A2E] border-[#2A2A3E]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A2E] border-[#2A2A3E]">
                {KANBAN_COLUMNS.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                      {col.title}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priority} onValueChange={(v) => { setPriority(v as TaskPriority); markChanged(); }}>
              <SelectTrigger className="w-28 h-8 bg-[#1A1A2E] border-[#2A2A3E]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A2E] border-[#2A2A3E]">
                {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                  <SelectItem key={p} value={p}>
                    <span className="capitalize">{p}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Updated {formatRelativeTime(task.updated_at)}
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-2 py-2 border-b border-[#2A2A3E] flex-shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              activeTab === 'details' 
                ? 'bg-[#E91E8C]/20 text-[#E91E8C]' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
              activeTab === 'activity' 
                ? 'bg-[#00D9FF]/20 text-[#00D9FF]' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="h-3 w-3" />
            Activity
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {activeTab === 'details' ? (
            <>
              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); markChanged(); }}
                  placeholder="Add a description... (supports markdown)"
                  rows={4}
                  className="bg-[#1A1A2E] border-[#2A2A3E] focus:border-[#E91E8C] resize-none"
                />
              </div>

              {/* Meta row: Agent, Due Date */}
              <div className="grid grid-cols-2 gap-4">
                {/* Assigned Agent */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Assigned Agent
                  </label>
                  <Select 
                    value={assignedAgent || 'unassigned'} 
                    onValueChange={(v) => { setAssignedAgent(v === 'unassigned' ? null : v); markChanged(); }}
                  >
                    <SelectTrigger className="bg-[#1A1A2E] border-[#2A2A3E]">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A2E] border-[#2A2A3E]">
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {AGENTS.map((agent) => (
                        <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Due Date
                    {isOverdue && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </label>
                  <Input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => { setDueDate(e.target.value); markChanged(); }}
                    className={`bg-[#1A1A2E] border-[#2A2A3E] ${isOverdue ? 'border-red-500 text-red-400' : ''}`}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="bg-[#00D9FF]/10 text-[#00D9FF] border-[#00D9FF]/30 flex items-center gap-1"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-400 ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <div className="flex items-center gap-1">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add tag..."
                      className="h-7 w-24 text-xs bg-[#1A1A2E] border-[#2A2A3E]"
                    />
                    <Button size="sm" variant="ghost" onClick={addTag} className="h-7 w-7 p-0">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Subtasks */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Subtasks
                  {subtasks.length > 0 && (
                    <span className="text-xs text-[#00D9FF]">
                      ({completedSubtasks}/{subtasks.length})
                    </span>
                  )}
                </label>
                
                {/* Progress bar */}
                {subtasks.length > 0 && (
                  <div className="w-full h-1.5 bg-[#1A1A2E] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#00D9FF] transition-all duration-300"
                      style={{ width: `${(completedSubtasks / subtasks.length) * 100}%` }}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-2 p-2 rounded bg-[#1A1A2E] group"
                    >
                      <button
                        onClick={() => toggleSubtask(subtask.id, subtask.completed)}
                        className="flex-shrink-0"
                      >
                        {subtask.completed ? (
                          <CheckSquare className="h-4 w-4 text-[#00D9FF]" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground hover:text-[#00D9FF]" />
                        )}
                      </button>
                      <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {subtask.title}
                      </span>
                      <button
                        onClick={() => deleteSubtask(subtask.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Add subtask */}
                <div className="flex items-center gap-2">
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                    placeholder="Add a subtask..."
                    className="bg-[#1A1A2E] border-[#2A2A3E] text-sm"
                  />
                  <Button size="sm" onClick={addSubtask} className="bg-[#00D9FF] hover:bg-[#00C4E5] text-black">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Links */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Links
                </label>
                <div className="space-y-1">
                  {links.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center gap-2 p-2 rounded bg-[#1A1A2E] group"
                    >
                      <ExternalLink className="h-4 w-4 text-[#00D9FF] flex-shrink-0" />
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-sm text-[#00D9FF] hover:underline truncate"
                      >
                        {link.title || link.url}
                      </a>
                      <button
                        onClick={() => deleteLink(link.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Add link */}
                <div className="flex items-center gap-2">
                  <Input
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    placeholder="Title (optional)"
                    className="w-32 bg-[#1A1A2E] border-[#2A2A3E] text-sm"
                  />
                  <Input
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                    placeholder="https://..."
                    className="flex-1 bg-[#1A1A2E] border-[#2A2A3E] text-sm"
                  />
                  <Button size="sm" onClick={addLink} className="bg-[#00D9FF] hover:bg-[#00C4E5] text-black">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Comments/Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Notes
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3 rounded bg-[#1A1A2E] group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-[#E91E8C]">{comment.author}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.created_at)}
                          </span>
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                </div>
                
                {/* Add comment */}
                <div className="flex items-start gap-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a note..."
                    rows={2}
                    className="bg-[#1A1A2E] border-[#2A2A3E] text-sm resize-none"
                  />
                  <Button size="sm" onClick={addComment} className="bg-[#E91E8C] hover:bg-[#C4187A] text-white h-auto py-2">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Activity Log */
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Activity Log</h3>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No activity yet</p>
              ) : (
                <div className="space-y-2">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-[#1A1A2E]/50"
                    >
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-[#00D9FF]" />
                      <div className="flex-1">
                        <p className="text-sm">{activity.message}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          {activity.agent && <span className="text-[#E91E8C]">{activity.agent}</span>}
                          <span>{formatDate(activity.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
