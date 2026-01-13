// ============================================================================
// NARRATIVES.XO PROTOTYPE 2 - TYPE DEFINITIONS
// Updated to match P2 documentation structure
// ============================================================================

// Market Types
export type Market = 'ng' | 'uk' | 'fr';

// Entry Pathways
export type EntryPathway = 'emotion' | 'audience' | 'scene' | 'seed';

// CCN Types
export interface CCNInput {
  userInput: string;
  entryPathway?: EntryPathway;
  market?: Market;
}
export interface CCNInterpretationRevised {
  pathway: "emotion-first" | "scene-first" | "story-seed" | "audience-led";
  emotion: string;
  scene: string;
  seedMoment: string;
  audience: string;
  intentSummary: string;
  confidence: number; // 0-1
  confidenceScores: {
    pathway: number;
    emotion: number;
    scene: number;
    audience: number;
  };
  clarificationQuestion?: {
    question: string;
    field: 'emotion' | 'scene' | 'audience' | 'intent';
  };
  market: Market;
  understandingPreview: string;
  rawAnalysis: string;
  // Legacy fields for backward compatibility
  inferredNeed?: string;
  inferredArchetype?: string;
  inferredTone?: string;
  inferredContext?: string;
  clarifications?: ClarificationQuestion[];
}

export interface CCNResponseRevised {
  success: boolean;
  interpretation: CCNInterpretationRevised;
  requiresClarification: boolean;
  clarificationQuestion?: {
    question: string;
    field: string;
  } | null;
  understandingPreview?: string;
}


export interface CCNInterpretation {
  inferredNeed: string;
  inferredArchetype: string;
  inferredTone: string;
  inferredContext: string;
  confidence: number; // 0-1
  clarifications: ClarificationQuestion[];
  market: Market;
  rawAnalysis: string;
}

export interface ClarificationQuestion {
  question: string;
  options: string[];
  field: 'need' | 'archetype' | 'tone' | 'context';
}

export interface CCNResponse {
  success: boolean;
  interpretation: CCNInterpretation;
  requiresClarification: boolean;
}

export interface ClarificationResponse {
  clarificationType: 'need' | 'archetype' | 'tone' | 'context';
  selectedOption: string;
  previousInterpretation: CCNInterpretation;
}

// Market & Tone Configuration
export interface MarketTone {
  name: string;
  keywords: string[];
  archetypeLinks: string[];
  visualDescriptors: string[];
}

export interface MarketData {
  market: string;
  tones: MarketTone[];
  compliance: {
    wcag: string;
    strap: boolean;
  };
}

// Brand Assets
export interface BrandAssets {
  palette?: string[];
  fonts?: string[];
  brandSafe?: boolean;
}

// Scene/Beat Structure (P2 Standard)
export interface Scene {
  beat: string;              // "Opening Image", "Setup", "Catalyst", etc.
  description: string;       // Scene narrative (2-3 sentences)
  visualCues: string[];      // Specific visual elements for image generation
  emotion?: string;          // Primary emotion of this beat
  duration?: string;         // Estimated duration (e.g., "5s")
}

// Story Structure (P2 Format)
export interface GeneratedStory {
  story: string;             // Full narrative as prose (150-200 words)
  beatSheet: Scene[];        // Structured scene breakdown (3-6 beats)
  metadata: {
    title: string;           // Story title
    market: Market;          // "ng" | "uk" | "fr"
    archetype: string;       // Story archetype
    tone: string;            // Tone name
    totalBeats: number;      // Number of scenes
    estimatedDuration: string; // Total duration (e.g., "30s")
  };
}

// Video Script Structure
export interface VideoScript {
  voiceOver: Array<{
    text: string;
    startTime: number;
    endTime: number;
  }>;
  shots: Array<{
    description: string;
    duration: number;
    visualDetails: string;
  }>;
  musicCues?: Array<{
    emotion: string;
    startTime: number;
    endTime: number;
  }>;
  totalDuration: number;
}

// Image Generation Types
export interface GenerateImageRequest {
  sceneDescription: string;
  visualCues?: string[];     // NEW: From beat.visualCues
  tone: string;
  market: Market;
  brandSafe?: boolean;
  brandPalette?: string[];
  template?: string;
  beatIndex?: number;        // NEW: Position in beatSheet
  beat?: string;             // NEW: Beat name (e.g., "Opening Image")
}

export interface GenerateImageResponse {
  success: boolean;
  imageUrl: string;
  revisedPrompt: string;
  sceneDescription: string;
  beatIndex?: number;
}

export interface ImageGenerationOptions {
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
}

// Story Generation Request/Response
export interface GenerateStoryRequest {
  market: Market;
  need: string;
  archetype: string;
  tone: string;
  context: string;
  brand?: {
    name: string;
    palette?: string[];
    fonts?: string[];
  };
}

export interface GenerateStoryResponse {
  success: boolean;
  story: string;             // Full narrative prose
  beatSheet: Scene[];        // Structured beats
  metadata: {
    title: string;
    market: Market;
    archetype: string;
    tone: string;
    totalBeats: number;
    estimatedDuration: string;
  };
  toneConfig?: MarketTone;   // Optional: tone configuration used
}

// Video Script Generation
export interface GenerateVideoScriptRequest {
  story: GeneratedStory;
  market: Market;
  tone: string;
  template: string;
}

export interface GenerateVideoScriptResponse {
  success: boolean;
  videoScript: VideoScript;
}

// Export Audit Data
export interface ExportAuditData {
  narrative: {
    market: Market;
    need: string;
    archetype: string;
    tone: string;
    context: string;
    brand: {
      name: string;
      palette?: string[];
      fonts?: string[];
      brandSafe?: boolean;
    } | null;
    story: GeneratedStory | null;
    videoScript: VideoScript | null;
    template: string;
    generatedImages: { [key: string]: string };
    timestamp: string;
  };
}

// Mode Types (Creator, Agency, Brand)
export type UserMode = 'creator' | 'agency' | 'brand';

// Legacy/Compatibility Types (can be removed if not used elsewhere)
export interface NarrativeMap {
  need: string;
  archetype: string;
  tone: string;
  locale: string;
  brandApplied: boolean;
  promptFragments: string[];
}

// DEPRECATED: Use Scene instead
export interface StoryScene {
  beat: string;
  description: string;
  visualCues: string[];
}

