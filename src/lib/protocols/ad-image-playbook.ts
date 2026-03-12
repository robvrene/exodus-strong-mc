// ---------------------------------------------------------------------------
// Ad Image Generation Playbook — Protocols for fal.ai image generation
// ---------------------------------------------------------------------------
// Defines how ad images should be generated based on:
//   1. What the business is selling (PRODUCE type)
//   2. Which ad channel is being used (PROMOTE channel)
//   3. Brand colors from the mission control palette
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Brand color system — mirrors the dashboard theme
// ---------------------------------------------------------------------------

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

/** Default brand palette matching the mission control dashboard */
export const DEFAULT_BRAND_COLORS: BrandColors = {
  primary: "#2F80FF",     // Blue — leads, CTAs
  secondary: "#FF4EDB",   // Magenta — sales, urgency
  accent: "#7B61FF",      // Purple — strategy, premium
  background: "#0B0F19",  // Dark navy
  text: "#F5F7FA",        // Light text
};

// ---------------------------------------------------------------------------
// PRODUCE types — what the business is selling
// ---------------------------------------------------------------------------

export type ProduceType = "ship" | "serve" | "unlock" | "shift";

interface ProducePlaybook {
  label: string;
  description: string;
  visualStyle: string;
  subjectHints: string[];
  moodKeywords: string[];
}

export const PRODUCE_PLAYBOOKS: Record<ProduceType, ProducePlaybook> = {
  ship: {
    label: "Ship — Physical Products",
    description: "Tangible products shipped to customers",
    visualStyle: "product photography, clean studio lighting, minimal background, hero shot",
    subjectHints: [
      "product box on clean surface",
      "product in lifestyle setting",
      "product unboxing moment",
      "product with brand packaging",
    ],
    moodKeywords: ["premium", "tangible", "quality", "crafted", "delivered"],
  },
  serve: {
    label: "Serve — Services & Done-For-You",
    description: "Service-based offers, consulting, done-for-you",
    visualStyle: "professional, aspirational, results-focused, clean modern design",
    subjectHints: [
      "professional workspace with laptop and charts",
      "confident business person at modern desk",
      "before-and-after transformation concept",
      "handshake or partnership moment",
    ],
    moodKeywords: ["professional", "trusted", "expert", "results", "transformation"],
  },
  unlock: {
    label: "Unlock — Digital Products & Courses",
    description: "Digital products, online courses, memberships, templates",
    visualStyle: "digital mockup, screen display, glowing elements, tech-forward",
    subjectHints: [
      "laptop screen showing course dashboard",
      "tablet displaying digital content",
      "stack of digital resources floating",
      "phone screen with app interface",
    ],
    moodKeywords: ["instant", "access", "knowledge", "digital", "unlock", "learn"],
  },
  shift: {
    label: "Shift — High-Ticket Coaching & Programs",
    description: "High-ticket coaching, mentorship, masterminds, transformation programs",
    visualStyle: "aspirational, dramatic lighting, luxury feel, transformative",
    subjectHints: [
      "person on stage speaking to audience",
      "luxury coaching room with warm lighting",
      "mountain summit or achievement metaphor",
      "intimate mastermind group setting",
    ],
    moodKeywords: ["exclusive", "transformative", "elite", "breakthrough", "mastery"],
  },
};

// ---------------------------------------------------------------------------
// PROMOTE channels — where the ad will run
// ---------------------------------------------------------------------------

export type PromoteChannel = "paid" | "publish" | "prospect" | "partnership";

interface ChannelSpec {
  label: string;
  platforms: string[];
  aspectRatio: string;
  imageSize: { width: number; height: number };
  styleNotes: string;
  overlayGuidance: string;
}

export const CHANNEL_SPECS: Record<PromoteChannel, ChannelSpec> = {
  paid: {
    label: "Paid Ads — Facebook / Instagram / Google",
    platforms: ["Facebook", "Instagram", "Google Display"],
    aspectRatio: "1:1",
    imageSize: { width: 1024, height: 1024 },
    styleNotes: "Bold, scroll-stopping, high contrast, clear focal point, minimal text area",
    overlayGuidance: "Leave 20% space at top or bottom for headline text overlay",
  },
  publish: {
    label: "Content — YouTube / Blog / Social",
    platforms: ["YouTube Thumbnail", "Blog Header", "Social Post"],
    aspectRatio: "16:9",
    imageSize: { width: 1344, height: 768 },
    styleNotes: "Thumbnail-friendly, expressive, bright pops of color, face-forward if person",
    overlayGuidance: "Leave right third open for title text, avoid busy backgrounds",
  },
  prospect: {
    label: "Cold Outreach — Email / LinkedIn",
    platforms: ["Email Header", "LinkedIn Post"],
    aspectRatio: "2:1",
    imageSize: { width: 1200, height: 600 },
    styleNotes: "Professional, trustworthy, clean, subtle branding, corporate-friendly",
    overlayGuidance: "Centered subject with ample negative space for email rendering",
  },
  partnership: {
    label: "Partnership — Affiliate / JV Assets",
    platforms: ["Affiliate Banner", "JV Page"],
    aspectRatio: "3:2",
    imageSize: { width: 1200, height: 800 },
    styleNotes: "Co-brandable, premium feel, results-focused, social proof emphasis",
    overlayGuidance: "Leave space for partner logo placement in corner",
  },
};

// ---------------------------------------------------------------------------
// Prompt builder — assembles the fal.ai prompt from playbook + context
// ---------------------------------------------------------------------------

export interface AdImageRequest {
  businessName: string;
  businessDescription?: string;
  produceType: ProduceType;
  channel: PromoteChannel;
  brandColors?: Partial<BrandColors>;
  customSubject?: string;
  adHeadline?: string;
}

export interface GeneratedPrompt {
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  channel: PromoteChannel;
  produceType: ProduceType;
}

/**
 * Build an image generation prompt from playbook rules.
 *
 * The prompt encodes:
 *   - Visual style from the PRODUCE playbook (what they're selling)
 *   - Channel dimensions and style from the PROMOTE spec (where the ad runs)
 *   - Brand color palette for tonal consistency
 */
export function buildAdImagePrompt(request: AdImageRequest): GeneratedPrompt {
  const produce = PRODUCE_PLAYBOOKS[request.produceType];
  const channel = CHANNEL_SPECS[request.channel];
  const colors = { ...DEFAULT_BRAND_COLORS, ...(request.brandColors ?? {}) };

  // Pick a subject hint — use custom if provided, otherwise cycle through defaults
  const subject =
    request.customSubject ||
    produce.subjectHints[Math.floor(Math.random() * produce.subjectHints.length)];

  // Build the color palette instruction
  const colorInstruction = `Color palette: dominant ${colors.primary} blue tones, accent ${colors.secondary} magenta highlights, with ${colors.accent} purple undertones. Background trending toward deep dark navy ${colors.background}`;

  // Assemble prompt parts
  const parts = [
    // Core subject
    `Professional advertising image for "${request.businessName}"`,
    subject,
    // Visual style from produce type
    produce.visualStyle,
    // Mood
    `Mood: ${produce.moodKeywords.join(", ")}`,
    // Channel-specific style
    channel.styleNotes,
    // Brand colors
    colorInstruction,
    // Composition
    channel.overlayGuidance,
    // Quality boosters
    "high resolution, commercial quality, professional advertising photography",
    "perfect lighting, sharp focus, 8k detail",
  ];

  // Add headline context if provided
  if (request.adHeadline) {
    parts.push(`Visual should complement the headline: "${request.adHeadline}"`);
  }

  const prompt = parts.join(". ");

  const negativePrompt = [
    "text", "words", "letters", "watermark", "signature",
    "low quality", "blurry", "distorted", "deformed",
    "ugly", "duplicate", "morbid", "mutilated",
    "poorly drawn", "bad anatomy", "bad proportions",
    "amateur", "stock photo watermark",
  ].join(", ");

  return {
    prompt,
    negativePrompt,
    width: channel.imageSize.width,
    height: channel.imageSize.height,
    channel: request.channel,
    produceType: request.produceType,
  };
}

// ---------------------------------------------------------------------------
// Variant helpers — generate multiple ad variants for A/B testing
// ---------------------------------------------------------------------------

/**
 * Generate prompt variants for a full ad creative pack.
 * Returns one prompt per active PROMOTE channel, tailored to that channel's specs.
 */
export function buildAdCreativePack(
  businessName: string,
  produceTypes: ProduceType[],
  channels: PromoteChannel[],
  options?: {
    businessDescription?: string;
    brandColors?: Partial<BrandColors>;
    adHeadline?: string;
  }
): GeneratedPrompt[] {
  const prompts: GeneratedPrompt[] = [];

  for (const channel of channels) {
    // Use the first produce type as the primary visual style
    const primaryProduce = produceTypes[0] || "serve";
    prompts.push(
      buildAdImagePrompt({
        businessName,
        businessDescription: options?.businessDescription,
        produceType: primaryProduce,
        channel,
        brandColors: options?.brandColors,
        adHeadline: options?.adHeadline,
      })
    );
  }

  return prompts;
}
