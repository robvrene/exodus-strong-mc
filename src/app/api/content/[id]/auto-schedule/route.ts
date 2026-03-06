import { NextRequest, NextResponse } from 'next/server';
import { content, ContentItem } from '@/lib/content-db';
import * as fs from 'fs';
import * as path from 'path';

// Content calendar configuration types
interface DailySlot {
  time: string;
  type: string;
  platform: string;
  label: string;
  frequency: 'daily' | 'every_other_day';
}

interface WeeklySlot {
  day: string;
  time: string;
  type: string;
  platform: string;
  label: string;
}

interface ContentCalendar {
  name: string;
  timezone: string;
  dailySchedule: DailySlot[];
  weeklySchedule: WeeklySlot[];
  contentTypes: Record<string, { platforms: string[]; maxLength?: number; maxSlides?: number; minLength?: number; requiresManual?: boolean; tool?: string }>;
}

// Day name to number mapping
const DAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

// Load content calendar config
function loadContentCalendar(): ContentCalendar {
  const calendarPath = path.join(process.cwd(), 'content-calendar.json');
  const raw = fs.readFileSync(calendarPath, 'utf-8');
  return JSON.parse(raw);
}

// Map content media_type to calendar content type
function mapMediaTypeToCalendarType(item: ContentItem): string {
  // Map Mission Control media types to calendar types
  switch (item.media_type) {
    case 'reel':
      return 'reel';
    case 'carousel':
      return 'carousel';
    case 'video':
      // Check if it's a short video (reel) or long video
      return item.platform === 'youtube' ? 'video' : 'reel';
    case 'image':
    default:
      // Single images could be stories or carousels depending on platform
      return item.platform === 'instagram' ? 'carousel' : 'image';
  }
}

// Get all potential slots for a platform/type combination
function getSlotsForContent(calendar: ContentCalendar, platform: string, contentType: string): Array<{ isDaily: boolean; slot: DailySlot | WeeklySlot }> {
  const slots: Array<{ isDaily: boolean; slot: DailySlot | WeeklySlot }> = [];
  
  // Check daily schedule - match by platform, and optionally by type
  for (const slot of calendar.dailySchedule) {
    if (slot.platform === platform) {
      // Match by type, or accept any if types are compatible
      if (slot.type === contentType || 
          (contentType === 'image' && slot.type === 'carousel') ||
          (contentType === 'carousel' && slot.type === 'carousel') ||
          (contentType === 'reel' && slot.type === 'reel')) {
        slots.push({ isDaily: true, slot });
      }
    }
  }
  
  // Check weekly schedule
  for (const slot of calendar.weeklySchedule) {
    if (slot.platform === platform) {
      if (slot.type === contentType ||
          (contentType === 'video' && slot.type === 'video') ||
          (contentType === 'live' && slot.type === 'live')) {
        slots.push({ isDaily: false, slot });
      }
    }
  }
  
  return slots;
}

// Check if a datetime is already booked
async function isSlotBooked(dateTime: string): Promise<boolean> {
  // Get all scheduled content for the same hour
  const startOfHour = dateTime.substring(0, 13) + ':00:00';
  const endOfHour = dateTime.substring(0, 13) + ':59:59';
  
  const scheduled = await content.getCalendar(startOfHour, endOfHour);
  return scheduled.length > 0;
}

// Find next available slot
async function findNextAvailableSlot(
  calendar: ContentCalendar,
  platform: string,
  contentType: string,
  startFrom: Date
): Promise<string | null> {
  const slots = getSlotsForContent(calendar, platform, contentType);
  
  if (slots.length === 0) {
    // No slots defined for this platform/type - fall back to a sensible default
    // Use 10:00 AM on the next day
    const tomorrow = new Date(startFrom);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString();
  }
  
  // Search up to 30 days ahead
  const maxDays = 30;
  const now = new Date(startFrom);
  
  for (let dayOffset = 0; dayOffset < maxDays; dayOffset++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + dayOffset);
    const dayOfWeek = checkDate.getDay();
    const dayName = Object.keys(DAY_MAP).find(d => DAY_MAP[d] === dayOfWeek)!;
    const dateStr = checkDate.toISOString().split('T')[0];
    
    // Collect all candidate times for this day
    const candidateTimes: string[] = [];
    
    for (const { isDaily, slot } of slots) {
      if (isDaily) {
        const dailySlot = slot as DailySlot;
        // Check frequency
        if (dailySlot.frequency === 'every_other_day') {
          // Simple odd/even day check based on day of year
          const dayOfYear = Math.floor((checkDate.getTime() - new Date(checkDate.getFullYear(), 0, 0).getTime()) / 86400000);
          if (dayOfYear % 2 !== 0) continue;
        }
        candidateTimes.push(dailySlot.time);
      } else {
        const weeklySlot = slot as WeeklySlot;
        if (weeklySlot.day.toLowerCase() === dayName) {
          candidateTimes.push(weeklySlot.time);
        }
      }
    }
    
    // Sort times chronologically
    candidateTimes.sort();
    
    for (const time of candidateTimes) {
      const [hours, minutes] = time.split(':').map(Number);
      const slotDateTime = new Date(checkDate);
      slotDateTime.setHours(hours, minutes, 0, 0);
      
      // Skip if this time is in the past (for today)
      if (slotDateTime <= now) continue;
      
      const slotISOString = slotDateTime.toISOString();
      
      // Check if already booked
      const booked = await isSlotBooked(slotISOString);
      if (!booked) {
        return slotISOString;
      }
    }
  }
  
  // No slot found in 30 days - shouldn't happen normally
  return null;
}

// POST /api/content/[id]/auto-schedule - Auto-schedule based on content calendar
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const approvedBy = body.approved_by || 'aaron';
    
    // Get the content item
    const item = await content.getById(id);
    if (!item) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }
    
    // Load content calendar
    let calendar: ContentCalendar;
    try {
      calendar = loadContentCalendar();
    } catch (err) {
      console.error('Failed to load content calendar:', err);
      return NextResponse.json({ error: 'Content calendar not found' }, { status: 500 });
    }
    
    // Map the content to a calendar type
    const contentType = mapMediaTypeToCalendarType(item);
    
    // Find next available slot
    const now = new Date();
    const nextSlot = await findNextAvailableSlot(calendar, item.platform, contentType, now);
    
    if (!nextSlot) {
      return NextResponse.json({ 
        error: 'No available slot found in the next 30 days',
        suggestion: 'Try scheduling manually or add more slots to the content calendar'
      }, { status: 409 });
    }
    
    // First approve the content
    await content.approve(id, approvedBy);
    
    // Then schedule it
    const updatedItem = await content.schedule(id, nextSlot);
    
    return NextResponse.json({
      ...updatedItem,
      _scheduling: {
        slot: nextSlot,
        contentType,
        platform: item.platform,
        message: `Scheduled for ${new Date(nextSlot).toLocaleString('en-US', { 
          weekday: 'long',
          month: 'short', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        })}`
      }
    });
  } catch (error) {
    console.error('Failed to auto-schedule content:', error);
    return NextResponse.json({ error: 'Failed to auto-schedule content' }, { status: 500 });
  }
}
