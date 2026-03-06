'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Image as ImageIcon, 
  Calendar,
  Filter,
  RefreshCw,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Eye,
  Sparkles,
  MessageSquare,
  LayoutGrid,
  List,
  ArrowLeft,
  Users,
  TrendingUp,
  TrendingDown,
  Play,
  Plus,
  BarChart3,
  Tv,
  ChevronLeft,
  ChevronRight,
  Video,
  Images,
  Film,
  Pencil,
  Send,
  RotateCcw,
  Mail,
  Smartphone,
  UserCheck,
  MousePointerClick,
  Megaphone
} from 'lucide-react';

// Types
type MediaType = 'image' | 'carousel' | 'video' | 'reel';
type BroadcastType = 'email' | 'sms';
type BroadcastStatus = 'draft' | 'pending' | 'approved' | 'scheduled' | 'sent' | 'rejected';

interface Broadcast {
  id: string;
  title: string;
  subject: string | null;
  body: string;
  type: BroadcastType;
  status: BroadcastStatus;
  scheduled_for: string | null;
  sent_at: string | null;
  segment: string | null;
  campaign: string | null;
  recipient_count: number;
  open_rate: number | null;
  click_rate: number | null;
  created_by: string;
  approved_by: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface BroadcastStats {
  pendingEmails: number;
  pendingSms: number;
  scheduled: number;
  sent: number;
  total: number;
}

interface ContentItem {
  id: string;
  title: string;
  copy: string;
  image_url: string | null;
  media_type: MediaType;
  media_urls: string | null; // JSON array for carousels
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
  metadata: string | null; // JSON with revision_feedback, etc.
  created_at: string;
}

interface Channel {
  id: string;
  name: string;
  platform: string;
  handle: string | null;
  url: string | null;
}

interface ChannelSummary {
  channel: Channel;
  latest: {
    subscribers: number;
    views: number;
    posts: number;
  } | null;
  weeklyGrowth: { subscribers: number; views: number };
  monthlyGrowth: { subscribers: number; views: number };
}

interface Stats {
  pendingCount: number;
  approvedCount: number;
  scheduledCount: number;
  publishedCount: number;
  rejectedCount: number;
  total: number;
}

// Platform icons and colors
const platformConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  facebook: { icon: Facebook, color: '#1877F2', bg: 'bg-blue-600' },
  instagram: { icon: Instagram, color: '#E4405F', bg: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400' },
  twitter: { icon: Twitter, color: '#1DA1F2', bg: 'bg-sky-500' },
  linkedin: { icon: Linkedin, color: '#0A66C2', bg: 'bg-blue-700' },
  tiktok: { icon: Sparkles, color: '#000000', bg: 'bg-black' },
  youtube: { icon: Youtube, color: '#FF0000', bg: 'bg-red-600' },
};

const statusConfig: Record<string, { label: string; color: string; text: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-600', text: 'text-gray-400' },
  pending: { label: 'Pending', color: 'bg-amber-500', text: 'text-amber-400' },
  approved: { label: 'Approved', color: 'bg-emerald-500', text: 'text-emerald-400' },
  scheduled: { label: 'Scheduled', color: 'bg-cyan-500', text: 'text-cyan-400' },
  published: { label: 'Published', color: 'bg-green-600', text: 'text-green-400' },
  rejected: { label: 'Rejected', color: 'bg-red-500', text: 'text-red-400' },
};

// Format number with K/M suffix
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// Growth indicator
function GrowthIndicator({ value, label }: { value: number; label: string }) {
  const isPositive = value >= 0;
  return (
    <div className="flex items-center gap-1 text-xs">
      {isPositive ? (
        <TrendingUp className="w-3 h-3 text-emerald-400" />
      ) : (
        <TrendingDown className="w-3 h-3 text-red-400" />
      )}
      <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
        {isPositive ? '+' : ''}{formatNumber(value)}
      </span>
      <span className="text-gray-500">{label}</span>
    </div>
  );
}

// Channel Card Component
function ChannelCard({ data }: { data: ChannelSummary }) {
  const platform = platformConfig[data.channel.platform] || platformConfig.facebook;
  const PlatformIcon = platform.icon;

  return (
    <div className="bg-[#111111] rounded-xl border border-gray-800 hover:border-gray-700 transition-all overflow-hidden">
      <div className={`${platform.bg} px-4 py-3 flex items-center gap-3`}>
        <PlatformIcon className="w-5 h-5 text-white" />
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm">{data.channel.name}</h3>
          {data.channel.handle && (
            <p className="text-white/70 text-xs">@{data.channel.handle}</p>
          )}
        </div>
      </div>

      <div className="p-4">
        {data.latest ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Users className="w-3 h-3" />
                  Subscribers
                </div>
                <p className="text-2xl font-bold text-white">{formatNumber(data.latest.subscribers)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Eye className="w-3 h-3" />
                  Total Views
                </div>
                <p className="text-2xl font-bold text-white">{formatNumber(data.latest.views)}</p>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-gray-800">
              <div className="flex justify-between">
                <GrowthIndicator value={data.weeklyGrowth.subscribers} label="subs/week" />
                <GrowthIndicator value={data.weeklyGrowth.views} label="views/week" />
              </div>
              <div className="flex justify-between">
                <GrowthIndicator value={data.monthlyGrowth.subscribers} label="subs/month" />
                <GrowthIndicator value={data.monthlyGrowth.views} label="views/month" />
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <BarChart3 className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No metrics recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Add Channel Modal
function AddChannelModal({ 
  isOpen, 
  onClose, 
  onAdd 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onAdd: (data: { name: string; platform: string; handle?: string; url?: string }) => void;
}) {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('youtube');
  const [handle, setHandle] = useState('');
  const [url, setUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ name, platform, handle: handle || undefined, url: url || undefined });
    setName('');
    setHandle('');
    setUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#111111] rounded-xl border border-gray-800 p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Add Channel</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Channel Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="AI Monetizations Live"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#E91E8C]"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#E91E8C]"
            >
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="twitter">Twitter/X</option>
              <option value="linkedin">LinkedIn</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Handle (optional)</label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@aimonetizations"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#E91E8C]"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">URL (optional)</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/@aimonetizations"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#E91E8C]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#E91E8C] hover:bg-[#E91E8C]/80 text-white rounded-lg font-medium transition-colors"
            >
              Add Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Image Lightbox Component
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
        <XCircle className="w-6 h-6 text-white" />
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

// Media Preview Component (handles image, carousel, video)
function MediaPreview({ item, onImageClick }: { item: ContentItem; onImageClick?: (url: string) => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Parse carousel images - handle both string and array
  let carouselImages: string[] = [];
  if (item.media_urls) {
    try {
      const parsed = typeof item.media_urls === 'string' 
        ? JSON.parse(item.media_urls) 
        : item.media_urls;
      carouselImages = Array.isArray(parsed) ? parsed : [];
    } catch {
      carouselImages = [];
    }
  }
  
  // Fallback to single image if no carousel
  if (carouselImages.length === 0 && item.image_url) {
    carouselImages = [item.image_url];
  }
  
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
  if (isVideo && item.video_url) {
    return (
      <div className="relative aspect-video bg-gray-900">
        {isPlaying ? (
          <video 
            src={item.video_url}
            className="w-full h-full object-cover"
            controls
            autoPlay
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          <>
            <img 
              src={item.video_thumbnail || item.image_url || ''} 
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsPlaying(true);
                }}
                className="w-16 h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
              >
                <Play className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" />
              </button>
            </div>
            {/* Video badge */}
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded-md flex items-center gap-1">
              {mediaType === 'reel' ? (
                <Film className="w-3 h-3 text-[#E91E8C]" />
              ) : (
                <Video className="w-3 h-3 text-red-500" />
              )}
              <span className="text-white text-xs font-medium">
                {mediaType === 'reel' ? 'Reel' : 'Video'}
              </span>
            </div>
          </>
        )}
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
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center cursor-pointer z-10 transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-white" />
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
          <Images className="w-3 h-3 text-[#00D4FF]" />
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
      <ImageIcon className="w-12 h-12 text-gray-700" />
    </div>
  );
}

// Approve Modal Component
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
            <CheckCircle className="w-5 h-5" />
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
                    <Calendar className="w-5 h-5 text-white" />
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
                    <Clock className="w-5 h-5 text-white" />
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

// Edit Modal Component
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
            <Pencil className="w-5 h-5" />
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
                <CheckCircle className="w-4 h-4" />
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
                  <Send className="w-4 h-4" />
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
                  <RotateCcw className="w-4 h-4" />
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

// Content Card Component with Platform Preview
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
  const PlatformIcon = platform.icon;
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showFullCopy, setShowFullCopy] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Check if copy is long enough to need "more" toggle
  const copyIsLong = item.copy.length > 150 || item.copy.split('\n').length > 3;

  // Determine media type for badge
  let carouselImages: string[] = [];
  try {
    carouselImages = item.media_urls ? JSON.parse(item.media_urls) : [];
  } catch { carouselImages = []; }
  const mediaType = item.media_type || (carouselImages.length > 1 ? 'carousel' : item.video_url ? 'video' : 'image');

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
            <PlatformIcon className="w-4 h-4 text-white" />
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
                <RotateCcw className="w-3 h-3" />
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
              <Clock className="w-3 h-3" />
              {new Date(item.created_at).toLocaleDateString()}
            </span>
            {item.scheduled_for && (
              <span className="flex items-center gap-1 text-cyan-400">
                <Calendar className="w-3 h-3" />
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
                      <XCircle className="w-4 h-4" />
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
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={handleReject}
                      className="px-3 py-2 bg-gray-700 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
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
                <Calendar className="w-3 h-3" />
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

          {/* Revision Feedback Display */}
          {hasRevisionRequest && (
            <div className="p-3 bg-[#E91E8C]/10 border border-[#E91E8C]/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <RotateCcw className="w-4 h-4 text-[#E91E8C]" />
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

// Stats Card
function StatsCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-[#111111] border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-sm">{label}</span>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

// Broadcast Card Component
function BroadcastCard({
  broadcast,
  onApprove,
  onReject,
  onEdit,
}: {
  broadcast: Broadcast;
  onApprove: (id: string, scheduledFor?: string) => void;
  onReject: (id: string, reason?: string) => void;
  onEdit: (id: string, data: { subject?: string; body?: string }) => void;
}) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showFullBody, setShowFullBody] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [editSubject, setEditSubject] = useState(broadcast.subject || '');
  const [editBody, setEditBody] = useState(broadcast.body);

  const isEmail = broadcast.type === 'email';
  const bodyIsLong = broadcast.body.length > 200 || broadcast.body.split('\n').length > 4;

  const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: 'bg-gray-600' },
    pending: { label: 'Pending', color: 'bg-amber-500' },
    approved: { label: 'Approved', color: 'bg-emerald-500' },
    scheduled: { label: 'Scheduled', color: 'bg-cyan-500' },
    sent: { label: 'Sent', color: 'bg-green-600' },
    rejected: { label: 'Rejected', color: 'bg-red-500' },
  };

  const status = statusConfig[broadcast.status] || statusConfig.pending;

  const handleReject = () => {
    if (showRejectInput) {
      onReject(broadcast.id, rejectReason);
      setShowRejectInput(false);
      setRejectReason('');
    } else {
      setShowRejectInput(true);
    }
  };

  const handleSchedule = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = scheduleDate || tomorrow.toISOString().split('T')[0];
    const scheduledFor = `${defaultDate}T${scheduleTime}:00`;
    onApprove(broadcast.id, scheduledFor);
    setShowScheduleModal(false);
  };

  const handleSaveEdit = () => {
    onEdit(broadcast.id, { 
      subject: isEmail ? editSubject : undefined, 
      body: editBody 
    });
    setShowEditModal(false);
  };

  return (
    <>
      <div className="bg-[#111111] rounded-xl border border-gray-800 hover:border-gray-700 transition-all overflow-hidden">
        {/* Header */}
        <div className={`${isEmail ? 'bg-gradient-to-r from-[#E91E8C] to-[#E91E8C]/80' : 'bg-gradient-to-r from-[#00D4FF] to-[#00D4FF]/80'} px-4 py-2 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            {isEmail ? <Mail className="w-4 h-4 text-white" /> : <Smartphone className="w-4 h-4 text-white" />}
            <span className="text-white text-sm font-medium">{isEmail ? 'Email' : 'SMS'}</span>
            {broadcast.segment && (
              <span className="px-1.5 py-0.5 bg-black/30 rounded text-[10px] text-white/80">
                {broadcast.segment}
              </span>
            )}
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color} text-white`}>
            {status.label}
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-white font-semibold text-sm mb-2 line-clamp-1">{broadcast.title}</h3>
          
          {/* Email Subject */}
          {isEmail && broadcast.subject && (
            <div className="mb-3 p-2 bg-gray-900/50 rounded-lg border border-gray-800">
              <p className="text-gray-400 text-xs mb-1">Subject:</p>
              <p className="text-white text-sm">{broadcast.subject}</p>
            </div>
          )}
          
          {/* Body Preview */}
          <div className="mb-3">
            <p className={`text-gray-400 text-sm whitespace-pre-line ${!showFullBody && bodyIsLong ? 'line-clamp-4' : ''}`}>
              {broadcast.body}
            </p>
            {bodyIsLong && (
              <button
                onClick={() => setShowFullBody(!showFullBody)}
                className="text-[#00D4FF] hover:text-[#00D4FF]/80 text-xs font-medium mt-1 transition-colors"
              >
                {showFullBody ? '← Show less' : 'Read more →'}
              </button>
            )}
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(broadcast.created_at).toLocaleDateString()}
            </span>
            {broadcast.recipient_count > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {broadcast.recipient_count.toLocaleString()} recipients
              </span>
            )}
            {broadcast.scheduled_for && (
              <span className="flex items-center gap-1 text-cyan-400">
                <Calendar className="w-3 h-3" />
                {new Date(broadcast.scheduled_for).toLocaleString()}
              </span>
            )}
          </div>

          {/* Sent Stats */}
          {broadcast.status === 'sent' && (
            <div className="flex gap-4 mb-4 p-3 bg-gray-900/50 rounded-lg">
              {broadcast.open_rate !== null && (
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-white text-sm font-medium">{(broadcast.open_rate * 100).toFixed(1)}%</p>
                    <p className="text-gray-500 text-xs">Open Rate</p>
                  </div>
                </div>
              )}
              {broadcast.click_rate !== null && (
                <div className="flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-white text-sm font-medium">{(broadcast.click_rate * 100).toFixed(1)}%</p>
                    <p className="text-gray-500 text-xs">Click Rate</p>
                  </div>
                </div>
              )}
              {broadcast.sent_at && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-white text-sm font-medium">{new Date(broadcast.sent_at).toLocaleDateString()}</p>
                    <p className="text-gray-500 text-xs">Sent</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {broadcast.status === 'pending' && (
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
                      <XCircle className="w-4 h-4" />
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
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setEditSubject(broadcast.subject || '');
                      setEditBody(broadcast.body);
                      setShowEditModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-3 py-2 bg-gray-700 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Scheduled status */}
          {broadcast.status === 'scheduled' && broadcast.scheduled_for && (
            <div className="p-2 bg-cyan-900/20 border border-cyan-900/50 rounded-lg">
              <p className="text-cyan-400 text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Scheduled for {new Date(broadcast.scheduled_for).toLocaleString()}
              </p>
            </div>
          )}

          {broadcast.status === 'rejected' && broadcast.rejection_reason && (
            <div className="p-2 bg-red-900/20 border border-red-900/50 rounded-lg">
              <p className="text-red-400 text-xs">
                <span className="font-medium">Rejection reason:</span> {broadcast.rejection_reason}
              </p>
            </div>
          )}

          {broadcast.status === 'approved' && (
            <div className="p-2 bg-emerald-900/20 border border-emerald-900/50 rounded-lg">
              <p className="text-emerald-400 text-xs">
                Approved by {broadcast.approved_by || 'Unknown'} — Ready to send
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] rounded-xl border border-gray-800 w-full max-w-md overflow-hidden">
            <div className="bg-emerald-600 px-4 py-3">
              <h2 className="text-white font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Approve & Schedule
              </h2>
            </div>
            <div className="p-4">
              <div className="mb-4 p-3 bg-gray-900 rounded-lg">
                <p className="text-white text-sm font-medium line-clamp-1">{broadcast.title}</p>
                <p className="text-gray-400 text-xs mt-1">{isEmail ? 'Email' : 'SMS'} • {broadcast.recipient_count || 0} recipients</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Send Date</label>
                  <input
                    type="date"
                    value={scheduleDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Send Time</label>
                  <select
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
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
                  </select>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => onApprove(broadcast.id)}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Approve Only
                  </button>
                  <button
                    onClick={handleSchedule}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors"
                  >
                    Schedule Send
                  </button>
                </div>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] rounded-xl border border-gray-800 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#00D4FF] px-4 py-3 flex-shrink-0">
              <h2 className="text-white font-bold flex items-center gap-2">
                <Pencil className="w-5 h-5" />
                Edit {isEmail ? 'Email' : 'SMS'}
              </h2>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-4">
                {isEmail && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Subject</label>
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#00D4FF]"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Body</label>
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#00D4FF] resize-none"
                  />
                </div>
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Main Media Hub
export default function MediaHub() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [channels, setChannels] = useState<ChannelSummary[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'channels' | 'broadcasts'>('channels');
  const [contentView, setContentView] = useState<'pending' | 'approved' | 'scheduled' | 'all' | 'rejected'>('pending');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [showAddChannel, setShowAddChannel] = useState(false);
  
  // Broadcast state
  const [broadcastsList, setBroadcastsList] = useState<Broadcast[]>([]);
  const [broadcastStats, setBroadcastStats] = useState<BroadcastStats | null>(null);
  const [broadcastView, setBroadcastView] = useState<'pending' | 'scheduled' | 'sent' | 'all' | 'rejected'>('pending');
  const [broadcastTypeFilter, setBroadcastTypeFilter] = useState<'all' | 'email' | 'sms'>('all');

  // Fetch content
  const fetchContent = async () => {
    try {
      const params = new URLSearchParams();
      if (contentView !== 'all') {
        params.set('status', contentView);
      }
      if (selectedPlatform !== 'all') {
        params.set('platform', selectedPlatform);
      }
      
      const res = await fetch(`/api/content?${params}`);
      const data = await res.json();
      setContent(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch content:', error);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/content/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Fetch channels
  const fetchChannels = async () => {
    try {
      const res = await fetch('/api/channels');
      const data = await res.json();
      setChannels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    }
  };

  // Fetch broadcasts
  const fetchBroadcasts = async () => {
    try {
      const params = new URLSearchParams();
      if (broadcastView !== 'all') {
        params.set('status', broadcastView);
      }
      if (broadcastTypeFilter !== 'all') {
        params.set('type', broadcastTypeFilter);
      }
      
      const res = await fetch(`/api/broadcasts?${params}`);
      const data = await res.json();
      setBroadcastsList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch broadcasts:', error);
    }
  };

  // Fetch broadcast stats
  const fetchBroadcastStats = async () => {
    try {
      const res = await fetch('/api/broadcasts/stats');
      const data = await res.json();
      setBroadcastStats(data);
    } catch (error) {
      console.error('Failed to fetch broadcast stats:', error);
    }
  };

  useEffect(() => {
    Promise.all([fetchContent(), fetchStats(), fetchChannels(), fetchBroadcasts(), fetchBroadcastStats()]).then(() => setLoading(false));
  }, [contentView, selectedPlatform]);

  // Refetch broadcasts when filters change
  useEffect(() => {
    fetchBroadcasts();
  }, [broadcastView, broadcastTypeFilter]);

  // Approve content
  const handleApprove = async (id: string, mode: 'calendar' | 'scheduled', scheduledFor?: string) => {
    try {
      if (mode === 'calendar') {
        // Auto-schedule based on content calendar rules
        const response = await fetch(`/api/content/${id}/auto-schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approved_by: 'aaron' }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          console.error('Auto-schedule failed:', error);
          // Fallback to just approving if auto-schedule fails
          await fetch(`/api/content/${id}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approved_by: 'aaron' }),
          });
        }
      } else if (mode === 'scheduled' && scheduledFor) {
        // Manual scheduling - first approve, then set schedule
        await fetch(`/api/content/${id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approved_by: 'aaron' }),
        });
        
        await fetch(`/api/content/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'scheduled',
            scheduled_for: scheduledFor 
          }),
        });
      }

      await Promise.all([fetchContent(), fetchStats()]);
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  // Reject content
  const handleReject = async (id: string, reason?: string) => {
    try {
      await fetch(`/api/content/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejected_by: 'aaron', reason }),
      });
      await Promise.all([fetchContent(), fetchStats()]);
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  // Edit content (user made changes)
  const handleEdit = async (id: string, copy: string, hashtags: string) => {
    try {
      await fetch(`/api/content/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copy, hashtags }),
      });
      await fetchContent();
    } catch (error) {
      console.error('Failed to edit:', error);
    }
  };

  // Request revision (send feedback to Solomon)
  const handleRequestRevision = async (id: string, feedback: string) => {
    try {
      // Mark as needing revision with feedback
      await fetch(`/api/content/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'draft',
          metadata: JSON.stringify({ revision_feedback: feedback, revision_requested_at: new Date().toISOString() })
        }),
      });
      
      // Log activity for notification
      await fetch(`/api/content/${id}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revision_requested',
          actor: 'aaron',
          notes: `Revision requested: ${feedback}`
        }),
      });
      
      await Promise.all([fetchContent(), fetchStats()]);
    } catch (error) {
      console.error('Failed to request revision:', error);
    }
  };

  // Add channel
  const handleAddChannel = async (data: { name: string; platform: string; handle?: string; url?: string }) => {
    try {
      await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await fetchChannels();
    } catch (error) {
      console.error('Failed to add channel:', error);
    }
  };

  // Bulk approve all pending (follows content calendar)
  const handleApproveAll = async () => {
    const pendingItems = content.filter(c => c.status === 'pending');
    for (const item of pendingItems) {
      await handleApprove(item.id, 'calendar');
    }
  };

  // Broadcast handlers
  const handleApproveBroadcast = async (id: string, scheduledFor?: string) => {
    try {
      await fetch(`/api/broadcasts/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: 'aaron', scheduled_for: scheduledFor }),
      });
      await Promise.all([fetchBroadcasts(), fetchBroadcastStats()]);
    } catch (error) {
      console.error('Failed to approve broadcast:', error);
    }
  };

  const handleRejectBroadcast = async (id: string, reason?: string) => {
    try {
      await fetch(`/api/broadcasts/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejected_by: 'aaron', reason }),
      });
      await Promise.all([fetchBroadcasts(), fetchBroadcastStats()]);
    } catch (error) {
      console.error('Failed to reject broadcast:', error);
    }
  };

  const handleEditBroadcast = async (id: string, data: { subject?: string; body?: string }) => {
    try {
      await fetch(`/api/broadcasts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await fetchBroadcasts();
    } catch (error) {
      console.error('Failed to edit broadcast:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Tv className="w-6 h-6 text-[#E91E8C]" />
                  Media Hub
                </h1>
                <p className="text-gray-500 text-sm">Channels, content & analytics</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Main Tabs */}
              <div className="flex items-center bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('channels')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'channels' 
                      ? 'bg-[#E91E8C] text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Channels</span>
                </button>
                <button
                  onClick={() => setActiveTab('content')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'content' 
                      ? 'bg-[#E91E8C] text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Content</span>
                  {stats && stats.pendingCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                      {stats.pendingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('broadcasts')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'broadcasts' 
                      ? 'bg-[#E91E8C] text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Megaphone className="w-4 h-4" />
                  <span className="hidden sm:inline">Broadcasts</span>
                  {broadcastStats && (broadcastStats.pendingEmails + broadcastStats.pendingSms) > 0 && (
                    <span className="px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                      {broadcastStats.pendingEmails + broadcastStats.pendingSms}
                    </span>
                  )}
                </button>
              </div>

              <button
                onClick={() => {
                  fetchContent();
                  fetchStats();
                  fetchChannels();
                  fetchBroadcasts();
                  fetchBroadcastStats();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* CHANNELS TAB */}
        {activeTab === 'channels' && (
          <>
            {/* Channel Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Your Channels</h2>
                <p className="text-gray-500 text-sm">Track subscribers, views, and growth</p>
              </div>
              <button
                onClick={() => setShowAddChannel(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#E91E8C] hover:bg-[#E91E8C]/80 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Channel
              </button>
            </div>

            {/* Channels Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-[#E91E8C] animate-spin" />
              </div>
            ) : channels.length === 0 ? (
              <div className="text-center py-20 bg-[#111111] rounded-xl border border-gray-800">
                <Tv className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No channels yet</h3>
                <p className="text-gray-500 mb-6">
                  Add your YouTube, Instagram, and other social channels to track growth
                </p>
                <button
                  onClick={() => setShowAddChannel(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#E91E8C] hover:bg-[#E91E8C]/80 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Channel
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {channels.map((data) => (
                  <ChannelCard key={data.channel.id} data={data} />
                ))}
              </div>
            )}
          </>
        )}

        {/* CONTENT TAB */}
        {activeTab === 'content' && (
          <>
            {/* Stats Row */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <StatsCard label="Pending" value={stats.pendingCount} icon={Clock} color="text-amber-400" />
                <StatsCard label="Approved" value={stats.approvedCount} icon={CheckCircle} color="text-emerald-400" />
                <StatsCard label="Scheduled" value={stats.scheduledCount} icon={Calendar} color="text-cyan-400" />
                <StatsCard label="Published" value={stats.publishedCount} icon={Eye} color="text-green-400" />
                <StatsCard label="Rejected" value={stats.rejectedCount} icon={XCircle} color="text-red-400" />
              </div>
            )}

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
                    {v === 'pending' && stats && stats.pendingCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                        {stats.pendingCount}
                      </span>
                    )}
                    {v === 'scheduled' && stats && stats.scheduledCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 bg-cyan-500 text-white text-xs rounded-full">
                        {stats.scheduledCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Platform Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
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
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-[#E91E8C] text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Bulk Actions */}
              {contentView === 'pending' && content.length > 0 && (
                <button
                  onClick={handleApproveAll}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve All ({content.filter(c => c.status === 'pending').length})
                </button>
              )}
            </div>

            {/* Content Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-[#E91E8C] animate-spin" />
              </div>
            ) : content.length === 0 ? (
              <div className="text-center py-20">
                <MessageSquare className="w-16 h-16 text-gray-700 mx-auto mb-4" />
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
                {content.map((item) => (
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
          </>
        )}

        {/* BROADCASTS TAB */}
        {activeTab === 'broadcasts' && (
          <>
            {/* Stats Row */}
            {broadcastStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#111111] border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-sm">Pending Emails</span>
                    <Mail className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{broadcastStats.pendingEmails}</p>
                </div>
                <div className="bg-[#111111] border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-sm">Pending SMS</span>
                    <Smartphone className="w-5 h-5 text-[#00D4FF]" />
                  </div>
                  <p className="text-2xl font-bold text-white">{broadcastStats.pendingSms}</p>
                </div>
                <div className="bg-[#111111] border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-sm">Scheduled</span>
                    <Calendar className="w-5 h-5 text-cyan-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{broadcastStats.scheduled}</p>
                </div>
                <div className="bg-[#111111] border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-sm">Sent</span>
                    <Send className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{broadcastStats.sent}</p>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {/* Status Tabs */}
              <div className="flex items-center bg-gray-800/50 rounded-lg p-1">
                {(['pending', 'scheduled', 'sent', 'rejected', 'all'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setBroadcastView(v)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                      broadcastView === v
                        ? 'bg-[#E91E8C] text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {v}
                    {v === 'pending' && broadcastStats && (broadcastStats.pendingEmails + broadcastStats.pendingSms) > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                        {broadcastStats.pendingEmails + broadcastStats.pendingSms}
                      </span>
                    )}
                    {v === 'scheduled' && broadcastStats && broadcastStats.scheduled > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 bg-cyan-500 text-white text-xs rounded-full">
                        {broadcastStats.scheduled}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={broadcastTypeFilter}
                  onChange={(e) => setBroadcastTypeFilter(e.target.value as 'all' | 'email' | 'sms')}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E91E8C]"
                >
                  <option value="all">All Types</option>
                  <option value="email">Email Only</option>
                  <option value="sms">SMS Only</option>
                </select>
              </div>
            </div>

            {/* Broadcasts Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-[#E91E8C] animate-spin" />
              </div>
            ) : broadcastsList.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00D4FF]/20 to-[#E91E8C]/20 flex items-center justify-center mx-auto mb-6">
                  <Megaphone className="w-10 h-10 text-[#00D4FF]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No broadcasts yet</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {broadcastView === 'pending' 
                    ? "Solomon will generate email and SMS campaigns for your approval"
                    : `No ${broadcastView} broadcasts to display`
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {broadcastsList.map((broadcast) => (
                  <BroadcastCard
                    key={broadcast.id}
                    broadcast={broadcast}
                    onApprove={handleApproveBroadcast}
                    onReject={handleRejectBroadcast}
                    onEdit={handleEditBroadcast}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <p className="text-gray-500 text-sm">
            Media Hub • Part of <span className="text-[#E91E8C]">Mission Control</span>
          </p>
          <Link 
            href="/"
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </footer>

      {/* Add Channel Modal */}
      <AddChannelModal
        isOpen={showAddChannel}
        onClose={() => setShowAddChannel(false)}
        onAdd={handleAddChannel}
      />
    </div>
  );
}
