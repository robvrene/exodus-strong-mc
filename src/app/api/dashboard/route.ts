import { NextResponse } from 'next/server';
import { tasks, activity } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allTasks = await tasks.getAll();
    const recentActivity = await activity.getRecent(10);
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Get start and end of this week (Sunday to Saturday)
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0];
    
    // Task stats by status
    const tasksByStatus = {
      inbox: allTasks.filter(t => t.status === 'inbox').length,
      'up-next': allTasks.filter(t => t.status === 'up-next').length,
      'in-progress': allTasks.filter(t => t.status === 'in-progress').length,
      'in-review': allTasks.filter(t => t.status === 'in-review').length,
      'waiting-on-aaron': allTasks.filter(t => t.status === 'waiting-on-aaron').length,
      done: allTasks.filter(t => t.status === 'done').length,
    };
    
    // Tasks by priority
    const tasksByPriority = {
      urgent: allTasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length,
      high: allTasks.filter(t => t.priority === 'high' && t.status !== 'done').length,
      medium: allTasks.filter(t => t.priority === 'medium' && t.status !== 'done').length,
      low: allTasks.filter(t => t.priority === 'low' && t.status !== 'done').length,
    };
    
    // Tasks by assignee
    const tasksByAssignee = {
      Aaron: allTasks.filter(t => t.assigned_agent === 'Aaron' && t.status !== 'done').length,
      Solomon: allTasks.filter(t => t.assigned_agent === 'Solomon' && t.status !== 'done').length,
      Phil: allTasks.filter(t => t.assigned_agent === 'Phil' && t.status !== 'done').length,
      Alex: allTasks.filter(t => t.assigned_agent === 'Alex' && t.status !== 'done').length,
      Unassigned: allTasks.filter(t => !t.assigned_agent && t.status !== 'done').length,
    };
    
    // Overdue tasks (due_date < today and not done)
    const overdueTasks = allTasks.filter(t => {
      if (!t.due_date || t.status === 'done') return false;
      return t.due_date < today;
    }).map(t => ({
      id: t.id,
      title: t.title,
      due_date: t.due_date,
      priority: t.priority,
      assigned_agent: t.assigned_agent,
      status: t.status,
    }));
    
    // Tasks due this week (not done)
    const tasksDueThisWeek = allTasks.filter(t => {
      if (!t.due_date || t.status === 'done') return false;
      return t.due_date >= today && t.due_date <= endOfWeekStr;
    }).map(t => ({
      id: t.id,
      title: t.title,
      due_date: t.due_date,
      priority: t.priority,
      assigned_agent: t.assigned_agent,
      status: t.status,
    }));
    
    // Format activity for frontend
    const formattedActivity = recentActivity.map(a => ({
      id: a.id,
      type: a.type,
      message: a.message,
      agent: a.agent,
      task_id: a.task_id,
      created_at: a.created_at,
    }));
    
    return NextResponse.json({
      tasksByStatus,
      tasksByPriority,
      tasksByAssignee,
      overdueTasks,
      tasksDueThisWeek,
      recentActivity: formattedActivity,
      totalTasks: allTasks.length,
      completedTasks: tasksByStatus.done,
      activeTasks: allTasks.length - tasksByStatus.done,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
