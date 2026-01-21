// ============================================================================
// NARRATIVES.XO - TONE-CONSTRAINED TYPES
// Constraint-based approach instead of emotional interpretation
// ============================================================================

// Entry Pathways
export type EntryPathway = 'assumption' | 'audience' | 'constraints' | 'function';

// Tone Constraint Types
export interface SemanticExtraction {
  // NEW: Constraint-based fields
  pathway: "assumption-first" | "constraint-first" | "audience-first" | "function-first";
  baselineStance: string; // e.g., "skeptical of marketing promises"
  toneConstraints: string[]; // e.g., ["dry", "observational", "restrained"]
  prohibitions: string[]; // e.g., ["warmth", "comfort language", "emotional reassurance"]
  audience: string;
  intentSummary: string;
  
  // Brand context
  hasBrandContext?: boolean;
  productCategory?: string;
  
  // Confidence
  confidence?: number;
  confidenceScores?: {
    pathway: number;
    stance: number;
    tone: number;
    audience: number;
  };
  
  // Legacy fields for backward compatibility (optional)
  emotion?: string;
  scene?: string;
  seedMoment?: string;
  rawAnalysis?: string;
}

// CCN Types
export interface CCNInput {
  userInput: string;
  entryPathway?: EntryPathway;
}

export interface CharacterDescription {
  id: string;
  name?: string;
  age?: string;
  gender?: string;
  ethnicity?: string;
  keyFeatures: string[];
  appearance: {
    hair: string;
    eyes: string;
    build: string;
    distinctive: string[];
  };
  clothingStyle?: string;
  expressions?: string[];
  referenceDescription: string;
}

export interface CCNInterpretationRevised {
  // Core constraint fields
  pathway: "assumption-first" | "constraint-first" | "audience-first" | "function-first";
  baselineStance: string;
  toneConstraints: string[];
  prohibitions: string[];
  audience: string;
  intentSummary: string;
  
  // Brand context
  hasBrandContext?: boolean;
  productCategory?: string | null;
  
  // Confidence
  confidence: number;
  confidenceScores: {
    pathway: number;
    stance: number;
    tone: number;
    audience: number;
  };
  
  // UI/Display fields
  understandingPreview: string;
  rawAnalysis: string;
  
  // Legacy fields for compatibility
  emotion?: string;
  scene?: string;
  seedMoment?: string;
  inferredNeed?: string;
  inferredArchetype?: string;
  inferredTone?: string;
  inferredContext?: string;
  clarifications?: ClarificationQuestion[];
  clarificationQuestion?: {
    question: string;
    field: 'emotion' | 'scene' | 'audience' | 'intent' | 'brand-context' | 'tone';
  };
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

export interface ClarificationQuestion {
  question: string;
  options: string[];
  field: 'need' | 'archetype' | 'tone' | 'context' | 'constraints';
}

// Brand Assets
export interface BrandAssets {
  palette?: string[];
  fonts?: string[];
  brandSafe?: boolean;
}

// Scene/Beat Structure
export interface Scene {
  beat: string;
  description: string;
  visualCues: string[];
  emotion?: string;
  duration?: string;
  characterId?: string;
  characterEmotion?: string;
  characterAction?: string;
  shotType?: "close-up" | "medium-shot" | "wide-shot" | "extreme-close-up";
}

// Story Structure
export interface GeneratedStory {
  story: string;
  beatSheet: Scene[];
  metadata: {
    title: string;
    archetype: string;
    tone: string;
    totalBeats: number;
    estimatedDuration: string;
    mainCharacters?: CharacterDescription[];
    characterRelationships?: string[];
    settings?: string[];
    
    // Brand context
    isBrandStory?: boolean;
    productCategory?: string;
    
    // Constraint info for tracking
    appliedConstraints?: string[];
    enforcedProhibitions?: string[];
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
  visualCues?: string[];
  tone: string;
  brandSafe?: boolean;
  brandPalette?: string[];
  template?: string;
  beatIndex?: number;
  beat?: string;
  characterDescription?: CharacterDescription;
  previousCharacterImage?: string;
  characterConsistencySeed?: number;
  isSameCharacter?: boolean;
}

export interface GenerateImageResponse {
  success: boolean;
  imageUrl: string;
  revisedPrompt: string;
  sceneDescription: string;
  beatIndex?: number;
}

// Story Generation Request/Response - COMPLETELY UPDATED
export interface GenerateStoryRequest {
  semanticExtraction: SemanticExtraction;
  brand?: {
    name: string;
    palette?: string[];
    fonts?: string[];
  };
  requestType?: string;
  purpose?: string;
  currentStory?: string;
  originalContext?: string;
  skipBrand?: boolean;
}

export interface GenerateStoryResponse {
  success: boolean;
  story: string;
  beatSheet: Scene[];
  metadata: {
    title: string;
    archetype: string;
    tone: string;
    totalBeats: number;
    estimatedDuration: string;
    
    // Brand context
    isBrandStory?: boolean;
    productCategory?: string;
    
    // Constraint tracking
    appliedConstraints?: string[];
    enforcedProhibitions?: string[];
    originalSubject?: string;
  };
}

// Video Script Generation
export interface GenerateVideoScriptRequest {
  story: GeneratedStory;
  tone: string;
  template: string;
}

export interface GenerateVideoScriptResponse {
  success: boolean;
  videoScript: VideoScript;
}

// Mode Types
export type UserMode = 'creator' | 'agency' | 'brand';

// CCN Data for state management
export type CCNData = {
  // Constraint-based fields
  baselineStance: string;
  toneConstraints: string[];
  prohibitions: string[];
  audience: string;
  intentSummary: string;
  pathway: string;
  
  // Brand context
  hasBrandContext?: boolean;
  productCategory?: string;
  
  // Legacy fields for transition
  emotion?: string;
  scene?: string;
  seedMoment?: string;
  rawAnalysis?: string;
};