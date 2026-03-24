"use client";

import { useState, useMemo, useEffect } from "react";
import { MEDIA_CHANNELS, CONTENT_QUEUE } from "@/config/exodus-data";

// Types
interface ChannelStats {
  id: string;
  name: string;
  platform: string;
  icon: string;
  color: string;
  metrics: {
    [key: string]: {
      primary: { label: string; value: string };
      secondary: { label: string; value: string };
      tertiary: { label: string; value: string };
      growth: number;
    };
  };
}

type MediaType = 'image' | 'carousel' | 'video' | 'reel';
type TimePeriod = 'today' | '7d' | '30d' | '90d' | 'ytd';

interface ContentItem {
  id: string;
  title: string;
  copy: string;
  image_url: string | null;
  media_type: MediaType;
  media_urls: string[] | null;
  video_url: string | null;
  video_thumbnail: string | null;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube';
  status: 'draft' | 'pending' | 'approved' | 'scheduled' | 'published' | 'rejected';
  scheduled_for: string | null;
  campaign: string | null;
  hashtags: string | null;
  created_by: string;
  approved_by: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  metadata: string | null;
  created_at: string;
}

// Sample channel data with time-based metrics
const channelData: ChannelStats[] = MEDIA_CHANNELS as ChannelStats[];

const contentData: ContentItem[] = CONTENT_QUEUE as ContentItem[];


// Platform config (EXACT match to Mission Control)
const platformConfig: Record<string, { icon: string; color: string; bg: string }> = {
  facebook: { icon: "👥", color: "#1877F2", bg: "bg-blue-600" },
  instagram: { icon: "📸", color: "#E4405F", bg: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400" },
  twitter: { icon: "𝕏", color: "#1DA1F2", bg: "bg-sky-500" },
  linkedin: { icon: "💼", color: "#0A66C2", bg: "bg-blue-700" },
  tiktok: { icon: "🎵", color: "#000000", bg: "bg-black" },
  youtube: { icon: "▶️", color: "#FF0000", bg: "bg-red-600" },
};

// Status config (EXACT match to Mission Control)
const statusConfig: Record<string, { label: string; color: string; text: string }> = {
  draft: { label: "Draft", color: "bg-gray-600", text: "text-gray-400" },
  pending: { label: "Pending", color: "bg-amber-500", text: "text-amber-400" },
  approved: { label: "Approved", color: "bg-emerald-500", text: "text-emerald-400" },
  scheduled: { label: "Scheduled", color: "bg-cyan-500", text: "text-cyan-400" },
  published: { label: "Published", color: "bg-green-600", text: "text-green-400" },
  rejected: { label: "Rejected", color: "bg-red-500", text: "text-red-400" },
};

// Channel Card Component with time period support
const ChannelCard = ({ channel, timePeriod }: { channel: ChannelStats; timePeriod: TimePeriod }) => {
  const metrics = channel.metrics[timePeriod];
  return (
    <div style={{
      background: `linear-gradient(135deg, ${channel.color}15, ${channel.color}08)`,
      borderRadius: 12,
      border: `1px solid ${channel.color}30`,
      padding: 16,
      minWidth: 180,
      flex: "1 0 auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>{channel.icon}</span>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#F5F7FA",
          fontFamily: "'Space Grotesk', sans-serif",
        }}>{channel.name}</span>
        <span style={{
          marginLeft: "auto",
          fontSize: 10,
          fontWeight: 600,
          color: metrics.growth >= 0 ? "#10B981" : "#EF4444",
          background: metrics.growth >= 0 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
          padding: "2px 6px",
          borderRadius: 4,
        }}>
          {metrics.growth >= 0 ? "↑" : "↓"} {Math.abs(metrics.growth)}%
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <div style={{ fontSize: 9, color: "#6B7186", fontFamily: "'Orbitron', monospace", letterSpacing: 0.5 }}>
            {metrics.primary.label}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif" }}>
            {metrics.primary.value}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <div>
            <div style={{ fontSize: 8, color: "#6B7186", fontFamily: "'Orbitron', monospace", letterSpacing: 0.3 }}>
              {metrics.secondary.label}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#8A8F98" }}>
              {metrics.secondary.value}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 8, color: "#6B7186", fontFamily: "'Orbitron', monospace", letterSpacing: 0.3 }}>
              {metrics.tertiary.label}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#8A8F98" }}>
              {metrics.tertiary.value}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Media Preview Component (EXACT match to Mission Control)
function MediaPreview({ item, onImageClick }: { item: ContentItem; onImageClick?: (url: string) => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const carouselImages = item.media_urls || (item.image_url ? [item.image_url] : []);
  const mediaType = item.media_type || 'image';
  const isCarousel = mediaType === 'carousel' || carouselImages.length > 1;
  const isVideo = mediaType === 'video' || mediaType === 'reel' || !!item.video_url;
  
  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };
  
  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const goToSlide = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide(idx);
  };

  // Video content
  if (isVideo && (item.video_url || item.video_thumbnail || item.image_url)) {
    return (
      <div className="relative aspect-video bg-gray-900">
        <img 
          src={item.video_thumbnail || item.image_url || ''} 
          alt={item.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-16 h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer">
            <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        {/* Video badge */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded-md flex items-center gap-1">
          {mediaType === 'reel' ? (
            <svg className="w-3 h-3 text-[#E91E8C]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 4v1h-2V4c0-.55-.45-1-1-1H9c-.55 0-1 .45-1 1v1H6V4c0-.55-.45-1-1-1s-1 .45-1 1v16c0 .55.45 1 1 1s1-.45 1-1v-1h2v1c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-1h2v1c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1s-1 .45-1 1zm-8 14H6v-4h4v4zm0-6H6V8h4v4zm6 6h-4v-4h4v4zm0-6h-4V8h4v4z"/>
            </svg>
          ) : (
            <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
          )}
          <span className="text-white text-xs font-medium">
            {mediaType === 'reel' ? 'Reel' : 'Video'}
          </span>
        </div>
      </div>
    );
  }

  // Carousel content
  if (isCarousel && carouselImages.length > 1) {
    return (
      <div className="relative aspect-video bg-gray-900 overflow-hidden group">
        {/* Current slide image - clickable for full view */}
        <img 
          src={carouselImages[currentSlide]} 
          alt={`${item.title} - Slide ${currentSlide + 1}`}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => onImageClick?.(carouselImages[currentSlide])}
        />
        {/* Click to expand indicator */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all pointer-events-none" />
        
        {/* Navigation arrows - ALWAYS VISIBLE */}
        <button
          type="button"
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center cursor-pointer z-10 transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center cursor-pointer z-10 transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {/* Carousel dots - ALWAYS VISIBLE */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {carouselImages.map((_, idx) => (
            <button
              type="button"
              key={idx}
              onClick={(e) => goToSlide(idx, e)}
              className={`rounded-full transition-all cursor-pointer ${
                idx === currentSlide 
                  ? 'bg-white w-6 h-2' 
                  : 'bg-white/50 hover:bg-white/80 w-2 h-2'
              }`}
            />
          ))}
        </div>
        
        {/* Carousel badge */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded-md flex items-center gap-1 z-10">
          <svg className="w-3 h-3 text-[#00D4FF]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"/>
          </svg>
          <span className="text-white text-xs font-medium">
            {currentSlide + 1}/{carouselImages.length}
          </span>
        </div>
      </div>
    );
  }

  // Single image
  if (item.image_url || carouselImages.length === 1) {
    const imgUrl = carouselImages[0] || item.image_url || '';
    return (
      <div className="relative aspect-video bg-gray-900 group cursor-pointer" onClick={() => onImageClick?.(imgUrl)}>
        <img 
          src={imgUrl} 
          alt={item.title}
          className="w-full h-full object-cover"
        />
        {/* Click to expand indicator */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="px-3 py-1.5 bg-black/60 rounded-lg text-white text-xs font-medium">
            Click to view full
          </div>
        </div>
      </div>
    );
  }

  // No media
  return (
    <div className="aspect-video bg-gray-900/50 flex items-center justify-center">
      <svg className="w-12 h-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

// Image Lightbox Component (EXACT match to Mission Control)
function ImageLightbox({ 
  isOpen, 
  onClose, 
  imageUrl, 
  title 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  imageUrl: string; 
  title: string 
}) {
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 cursor-pointer"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <img 
        src={imageUrl} 
        alt={title}
        className="max-w-full max-h-[90vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// Approve Modal Component (EXACT match to Mission Control)
function ApproveModal({
  isOpen,
  onClose,
  onSchedule,
  onFollowCalendar,
  item,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: string, time: string) => void;
  onFollowCalendar: () => void;
  item: ContentItem;
}) {
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [mode, setMode] = useState<'choose' | 'schedule'>('choose');

  if (!isOpen) return null;

  // Get tomorrow's date as default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] rounded-xl border border-gray-800 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-600 px-4 py-3">
          <h2 className="text-white font-bold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Approve Content
          </h2>
        </div>

        <div className="p-4">
          {/* Content Preview */}
          <div className="mb-4 p-3 bg-gray-900 rounded-lg">
            <p className="text-white text-sm font-medium line-clamp-1">{item.title}</p>
            <p className="text-gray-400 text-xs mt-1 capitalize">{item.platform}</p>
          </div>

          {mode === 'choose' ? (
            <>
              <p className="text-gray-400 text-sm mb-4">How do you want to schedule this?</p>
              
              {/* Option 1: Follow Content Calendar */}
              <button
                onClick={onFollowCalendar}
                className="w-full p-4 mb-3 bg-gradient-to-r from-[#E91E8C]/20 to-[#00D4FF]/20 border border-[#E91E8C]/40 hover:border-[#E91E8C] rounded-xl text-left transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#E91E8C] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold group-hover:text-[#E91E8C] transition-colors">
                      Follow Content Calendar
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">
                      Auto-schedule based on playbook. Next available slot.
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 2: Schedule Manually */}
              <button
                onClick={() => setMode('schedule')}
                className="w-full p-4 bg-gray-800/50 border border-gray-700 hover:border-[#00D4FF] rounded-xl text-left transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#00D4FF] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold group-hover:text-[#00D4FF] transition-colors">
                      Schedule Manually
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">
                      Pick a specific date and time to post.
                    </p>
                  </div>
                </div>
              </button>
            </>
          ) : (
            <>
              {/* Manual Schedule Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={scheduleDate || defaultDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00D4FF]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Time</label>
                  <select
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00D4FF]"
                  >
                    <option value="06:00">6:00 AM</option>
                    <option value="07:00">7:00 AM</option>
                    <option value="08:00">8:00 AM</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="17:00">5:00 PM</option>
                    <option value="18:00">6:00 PM</option>
                    <option value="19:00">7:00 PM</option>
                    <option value="20:00">8:00 PM</option>
                    <option value="21:00">9:00 PM</option>
                  </select>
                </div>
                <button
                  onClick={() => onSchedule(scheduleDate || defaultDate, scheduleTime)}
                  className="w-full py-3 bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-white rounded-lg font-semibold transition-colors"
                >
                  Schedule Post
                </button>
                <button
                  onClick={() => setMode('choose')}
                  className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors"
                >
                  ← Back to options
                </button>
              </div>
            </>
          )}

          {mode === 'choose' && (
            <button
              onClick={onClose}
              className="w-full mt-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Edit Modal Component (EXACT match to Mission Control)
function EditModal({
  isOpen,
  onClose,
  onSave,
  onRequestRevision,
  item,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (copy: string, hashtags: string) => void;
  onRequestRevision: (feedback: string) => void;
  item: ContentItem;
}) {
  const [copy, setCopy] = useState(item.copy);
  const [hashtags, setHashtags] = useState(item.hashtags || '');
  const [feedback, setFeedback] = useState('');
  const [mode, setMode] = useState<'edit' | 'feedback'>('edit');

  useEffect(() => {
    setCopy(item.copy);
    setHashtags(item.hashtags || '');
  }, [item]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] rounded-xl border border-gray-800 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#00D4FF] px-4 py-3 flex-shrink-0">
          <h2 className="text-white font-bold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Content
          </h2>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('edit')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                mode === 'edit'
                  ? 'bg-[#00D4FF] text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Edit Myself
            </button>
            <button
              onClick={() => setMode('feedback')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                mode === 'feedback'
                  ? 'bg-[#E91E8C] text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Request Revision
            </button>
          </div>

          {mode === 'edit' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Copy</label>
                <textarea
                  value={copy}
                  onChange={(e) => setCopy(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#00D4FF] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Hashtags</label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#AI #Business #Automation"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#00D4FF]"
                />
              </div>
              <button
                onClick={() => {
                  onSave(copy, hashtags);
                  onClose();
                }}
                className="w-full py-3 bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Save Changes
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Tell Solomon what to change. Be specific for best results.
              </p>
              <div>
                <label className="block text-sm text-gray-400 mb-1">What should change?</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  placeholder="e.g., Make it punchier, different image style, shorter copy, add urgency..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#E91E8C] resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onRequestRevision(feedback);
                    onClose();
                  }}
                  disabled={!feedback.trim()}
                  className="flex-1 py-3 bg-[#E91E8C] hover:bg-[#E91E8C]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send to Solomon
                </button>
                <button
                  onClick={() => {
                    onRequestRevision('Regenerate with fresh approach');
                    onClose();
                  }}
                  className="py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  title="Regenerate completely"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Content Card Component (EXACT match to Mission Control)
function ContentCard({ 
  item, 
  onApprove, 
  onReject,
  onEdit,
  onRequestRevision,
}: { 
  item: ContentItem;
  onApprove: (id: string, mode: 'calendar' | 'scheduled', scheduledFor?: string) => void;
  onReject: (id: string, reason?: string) => void;
  onEdit: (id: string, copy: string, hashtags: string) => void;
  onRequestRevision: (id: string, feedback: string) => void;
}) {
  const platform = platformConfig[item.platform] || platformConfig.facebook;
  const status = statusConfig[item.status] || statusConfig.pending;
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showFullCopy, setShowFullCopy] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Check if copy is long enough to need "more" toggle
  const copyIsLong = item.copy.length > 150 || item.copy.split('\n').length > 3;

  // Determine media type for badge
  const mediaType = item.media_type || (item.media_urls && item.media_urls.length > 1 ? 'carousel' : item.video_url ? 'video' : 'image');

  // Parse revision feedback from metadata
  let revisionFeedback: string | null = null;
  let revisionRequestedAt: string | null = null;
  if (item.metadata) {
    try {
      const meta = JSON.parse(item.metadata);
      revisionFeedback = meta.revision_feedback || null;
      revisionRequestedAt = meta.revision_requested_at || null;
    } catch { /* ignore parse errors */ }
  }
  const hasRevisionRequest = item.status === 'draft' && revisionFeedback;

  const handleReject = () => {
    if (showRejectInput) {
      onReject(item.id, rejectReason);
      setShowRejectInput(false);
      setRejectReason('');
    } else {
      setShowRejectInput(true);
    }
  };

  const handleSchedule = (date: string, time: string) => {
    const scheduledFor = `${date}T${time}:00`;
    onApprove(item.id, 'scheduled', scheduledFor);
    setShowApproveModal(false);
  };

  const handleFollowCalendar = () => {
    onApprove(item.id, 'calendar');
    setShowApproveModal(false);
  };

  return (
    <>
      <div className="bg-[#111111] rounded-xl border border-gray-800 hover:border-gray-700 transition-all overflow-hidden">
        {/* Platform Header */}
        <div className={`${platform.bg} px-4 py-2 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className="text-white">{platform.icon}</span>
            <span className="text-white text-sm font-medium capitalize">{item.platform}</span>
            {/* Media type indicator */}
            {mediaType !== 'image' && (
              <span className="px-1.5 py-0.5 bg-black/30 rounded text-[10px] text-white/80 uppercase">
                {mediaType}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasRevisionRequest && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#E91E8C] text-white flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Revision
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color} text-white`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Media Preview (handles image, carousel, video) */}
        <MediaPreview item={item} onImageClick={(url) => setLightboxImage(url)} />

        {/* Copy Preview */}
        <div className="p-4">
          <h3 className="text-white font-semibold text-sm mb-2 line-clamp-1">{item.title}</h3>
          
          {/* Expandable copy with more/less toggle */}
          <div className="mb-3">
            <p className={`text-gray-400 text-sm whitespace-pre-line ${!showFullCopy && copyIsLong ? 'line-clamp-3' : ''}`}>
              {item.copy}
            </p>
            {copyIsLong && (
              <button
                onClick={() => setShowFullCopy(!showFullCopy)}
                className="text-[#E91E8C] hover:text-[#E91E8C]/80 text-xs font-medium mt-1 transition-colors"
              >
                {showFullCopy ? '← Show less' : 'More →'}
              </button>
            )}
          </div>
          
          {item.hashtags && (
            <p className="text-[#00D4FF] text-xs mb-3 line-clamp-1">{item.hashtags}</p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {new Date(item.created_at).toLocaleDateString()}
            </span>
            {item.scheduled_for && (
              <span className="flex items-center gap-1 text-cyan-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(item.scheduled_for).toLocaleString()}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          {item.status === 'pending' && (
            <div className="space-y-2">
              {showRejectInput ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Reason for rejection (optional)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#E91E8C]"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleReject}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Confirm
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectInput(false);
                        setRejectReason('');
                      }}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowApproveModal(true)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Approve
                    </button>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={handleReject}
                      className="px-3 py-2 bg-gray-700 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scheduled status */}
          {item.status === 'scheduled' && item.scheduled_for && (
            <div className="p-2 bg-cyan-900/20 border border-cyan-900/50 rounded-lg">
              <p className="text-cyan-400 text-xs flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Scheduled for {new Date(item.scheduled_for).toLocaleString()}
              </p>
            </div>
          )}

          {item.status === 'rejected' && item.rejection_reason && (
            <div className="p-2 bg-red-900/20 border border-red-900/50 rounded-lg">
              <p className="text-red-400 text-xs">
                <span className="font-medium">Rejection reason:</span> {item.rejection_reason}
              </p>
            </div>
          )}

          {item.status === 'approved' && (
            <div className="p-2 bg-emerald-900/20 border border-emerald-900/50 rounded-lg">
              <p className="text-emerald-400 text-xs">
                Approved by {item.approved_by || 'Unknown'} — Added to content calendar
              </p>
            </div>
          )}

          {item.status === 'published' && (
            <div className="p-2 bg-green-900/20 border border-green-900/50 rounded-lg">
              <p className="text-green-400 text-xs flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Published
              </p>
            </div>
          )}

          {/* Revision Feedback Display */}
          {hasRevisionRequest && (
            <div className="p-3 bg-[#E91E8C]/10 border border-[#E91E8C]/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-[#E91E8C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-[#E91E8C] text-xs font-semibold">Revision Requested</span>
                {revisionRequestedAt && (
                  <span className="text-gray-500 text-xs">
                    • {new Date(revisionRequestedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-gray-300 text-sm">{revisionFeedback}</p>
            </div>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      <ApproveModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onSchedule={handleSchedule}
        onFollowCalendar={handleFollowCalendar}
        item={item}
      />

      {/* Edit Modal */}
      <EditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={(copy, hashtags) => onEdit(item.id, copy, hashtags)}
        onRequestRevision={(feedback) => onRequestRevision(item.id, feedback)}
        item={item}
      />

      {/* Image Lightbox for full-size view */}
      <ImageLightbox
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        imageUrl={lightboxImage || ''}
        title={item.title}
      />
    </>
  );
}

// Stats Card (EXACT match to Mission Control)
function StatsCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-[#111111] border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-sm">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

// Main MediaHub Component
export default function MediaHub() {
  const [content, setContent] = useState<ContentItem[]>(contentData);
  const [contentView, setContentView] = useState<'pending' | 'approved' | 'scheduled' | 'all' | 'rejected'>('pending');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Calculate stats
  const stats = useMemo(() => ({
    pendingCount: content.filter(c => c.status === 'pending').length,
    approvedCount: content.filter(c => c.status === 'approved').length,
    scheduledCount: content.filter(c => c.status === 'scheduled').length,
    publishedCount: content.filter(c => c.status === 'published').length,
    rejectedCount: content.filter(c => c.status === 'rejected').length,
    total: content.length,
  }), [content]);

  // Filter content
  const filteredContent = useMemo(() => {
    return content.filter(item => {
      const statusMatch = contentView === 'all' || item.status === contentView;
      const platformMatch = selectedPlatform === 'all' || item.platform === selectedPlatform;
      return statusMatch && platformMatch;
    });
  }, [content, contentView, selectedPlatform]);

  // Handlers
  const handleApprove = (id: string, mode: 'calendar' | 'scheduled', scheduledFor?: string) => {
    setContent(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      if (mode === 'calendar') {
        // Auto-schedule based on content calendar - just approve for demo
        return { ...item, status: 'approved' as const, approved_by: 'aaron' };
      } else if (mode === 'scheduled' && scheduledFor) {
        // Manual scheduling
        return { 
          ...item, 
          status: 'scheduled' as const, 
          approved_by: 'aaron',
          scheduled_for: scheduledFor 
        };
      }
      return item;
    }));
  };

  const handleReject = (id: string, reason?: string) => {
    setContent(prev => prev.map(item => 
      item.id === id 
        ? { ...item, status: 'rejected' as const, rejected_by: 'aaron', rejection_reason: reason || null }
        : item
    ));
  };

  const handleEdit = (id: string, copy: string, hashtags: string) => {
    setContent(prev => prev.map(item => 
      item.id === id 
        ? { ...item, copy, hashtags }
        : item
    ));
  };

  const handleRequestRevision = (id: string, feedback: string) => {
    setContent(prev => prev.map(item => 
      item.id === id 
        ? { 
            ...item, 
            status: 'draft' as const,
            metadata: JSON.stringify({ 
              revision_feedback: feedback, 
              revision_requested_at: new Date().toISOString() 
            })
          }
        : item
    ));
  };

  const handleApproveAll = () => {
    const pendingItems = content.filter(c => c.status === 'pending');
    pendingItems.forEach(item => handleApprove(item.id, 'calendar'));
  };

  const timePeriodLabels: Record<TimePeriod, string> = {
    today: 'Today',
    '7d': '7D',
    '30d': '30D',
    '90d': '90D',
    ytd: 'YTD',
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <svg className="w-6 h-6 text-[#E91E8C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Media Hub
                </h1>
                <p className="text-gray-500 text-sm">Channels, content & analytics</p>
              </div>
            </div>
            
            <button
              onClick={() => setContent(contentData)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Channel Stats Bar with Time Toggle */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] tracking-[2px] text-gray-500 font-mono">
              CHANNEL PERFORMANCE
            </div>
            {/* Time Period Toggle */}
            <div className="flex items-center bg-gray-800/50 rounded-lg p-1">
              {(['today', '7d', '30d', '90d', 'ytd'] as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    timePeriod === period
                      ? 'bg-[#E91E8C] text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {timePeriodLabels[period]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {channelData.map(channel => (
              <ChannelCard key={channel.id} channel={channel} timePeriod={timePeriod} />
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatsCard 
            label="Pending" 
            value={stats.pendingCount} 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
            color="text-amber-400" 
          />
          <StatsCard 
            label="Approved" 
            value={stats.approvedCount} 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
            color="text-emerald-400" 
          />
          <StatsCard 
            label="Scheduled" 
            value={stats.scheduledCount} 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} 
            color="text-cyan-400" 
          />
          <StatsCard 
            label="Published" 
            value={stats.publishedCount} 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>} 
            color="text-green-400" 
          />
          <StatsCard 
            label="Rejected" 
            value={stats.rejectedCount} 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
            color="text-red-400" 
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Status Tabs */}
          <div className="flex items-center bg-gray-800/50 rounded-lg p-1">
            {(['pending', 'scheduled', 'approved', 'rejected', 'all'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setContentView(v)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                  contentView === v
                    ? 'bg-[#E91E8C] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {v}
                {v === 'pending' && stats.pendingCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                    {stats.pendingCount}
                  </span>
                )}
                {v === 'scheduled' && stats.scheduledCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-cyan-500 text-white text-xs rounded-full">
                    {stats.scheduledCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Platform Filter */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E91E8C]"
            >
              <option value="all">All Platforms</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter/X</option>
              <option value="linkedin">LinkedIn</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="flex items-center bg-gray-800 rounded-lg p-1 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-[#E91E8C] text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-[#E91E8C] text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Bulk Actions */}
          {contentView === 'pending' && stats.pendingCount > 0 && (
            <button
              onClick={handleApproveAll}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Approve All ({stats.pendingCount})
            </button>
          )}
        </div>

        {/* Content Grid */}
        {filteredContent.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">No content yet</h3>
            <p className="text-gray-500">
              {contentView === 'pending' 
                ? "Solomon will generate content for your approval"
                : `No ${contentView} content to display`
              }
            </p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {filteredContent.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                onApprove={handleApprove}
                onReject={handleReject}
                onEdit={handleEdit}
                onRequestRevision={handleRequestRevision}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <p className="text-gray-500 text-sm">
            Media Hub • Part of <span className="text-[#E91E8C]">Mission Control</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
