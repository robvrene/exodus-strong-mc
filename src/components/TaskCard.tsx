'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, PRIORITY_COLORS } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Clock, GripVertical, User, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onClick?: (task: Task) => void;
}

export function TaskCard({ task, onEdit, onDelete, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Normalize priority to lowercase and provide fallback for unknown priorities
  const normalizedPriority = (task.priority?.toLowerCase() || 'medium') as keyof typeof PRIORITY_COLORS;
  const priorityStyle = PRIORITY_COLORS[normalizedPriority] || PRIORITY_COLORS.medium;

  // Format relative time
  const getRelativeTime = (dateStr: string) => {
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

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger click if we're dragging
    if (isDragging) return;
    // Don't trigger if clicking on the dropdown menu
    if ((e.target as HTMLElement).closest('[data-dropdown-trigger]')) return;
    onClick?.(task);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={`
        group relative p-3 bg-[#1A1A2E] border-[#2A2A3E] hover:border-[#3A3A5E]
        transition-all duration-200 cursor-pointer
        ${isDragging ? 'opacity-50 shadow-lg shadow-[#E91E8C]/20 scale-105 cursor-grabbing' : ''}
      `}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity cursor-grab"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Actions menu */}
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              data-dropdown-trigger
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#1A1A2E] border-[#2A2A3E]" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => onEdit(task)} className="cursor-pointer">
              <Pencil className="mr-2 h-3 w-3" />
              Quick Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(task.id)} 
              className="cursor-pointer text-red-400 focus:text-red-400"
            >
              <Trash2 className="mr-2 h-3 w-3" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="pl-4 pr-6">
        {/* Title */}
        <h4 className="font-medium text-sm text-foreground mb-2 line-clamp-2">
          {task.title}
        </h4>

        {/* Description preview */}
        {task.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between gap-2">
          {/* Priority badge */}
          <Badge 
            variant="outline" 
            className={`${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border} text-[10px] uppercase tracking-wider`}
          >
            {task.priority}
          </Badge>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {/* Assigned agent */}
            {task.assigned_agent && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-[#00D9FF]" />
                <span className="text-[#00D9FF] text-[10px]">{task.assigned_agent}</span>
              </div>
            )}

            {/* Time */}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="text-[10px]">{getRelativeTime(task.updated_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
