// /types/index.ts
// ============================================================================
// XO NARRATIVE ENGINE TYPES
// ============================================================================

// XO Micro-Story Types
export interface MicroStoryBeat {
  lines: string[];
  type?: 'lived-moment' | 'progression' | 'meaning' | 'brand';
}

export interface MicroStory {
  beats: MicroStoryBeat[];
  market?: 'GLOBAL' | 'NG' | 'UK';
  hasBrand?: boolean;
}

// Meaning Risk Types
export type MeaningRisk = 
  | 'emotion-distortion'
  | 'intent-misinterpretation'
  | 'context-assumption'
  | 'tension-overlook'
  | 'literal-vs-metaphor'
  | 'irony-missed'
  | 'positive-negative-ambiguity'
  | 'insufficient-context'
  | 'possible-gibberish';

export interface MeaningRiskAssessment {
  risks: MeaningRisk[];
  riskLevel: 'low' | 'medium' | 'high';
  distortionLikelihood: number;
  specificDoubt: string;
  confidentInterpretation: string;
  hypothesis?: string;
}

// THE MEANING CONTRACT - Enhanced with market context
export interface MeaningContract {
  interpretedMeaning: {
    emotionalState: 'positive' | 'negative' | 'neutral' | 'layered' | 'complex' | 'ambiguous';
    emotionalDirection: 'inward' | 'outward' | 'observational' | 'relational' | 'unknown';
    narrativeTension: string;
    intentCategory: 'share' | 'inquire' | 'emphasize' | 'reflect' | 'process' | 'express' | 'connect';
    coreTheme: string;
  };
  
  // NEW: Market context for XO
  marketContext?: {
    market: 'GLOBAL' | 'NG' | 'UK';
    language: string;
    register: 'formal' | 'casual' | 'colloquial';
  };
  
  // NEW: Entry path detection
  entryPath?: 'emotion' | 'scene' | 'seed' | 'audience';
  
  confidence: number;
  certaintyMode: 'tentative-commit' | 'reflection-only' | 'clarification-needed';
  reversible: boolean;
  safeToNarrate: boolean;
  
  understandingSummary?: string;
  
  provenance: {
    source: 'ccn-interpretation';
    riskLevel: 'low' | 'medium' | 'high';
    distortionLikelihood: number;
    risksAcknowledged: MeaningRisk[];
  };
  
  seedMoment: string;
}

// XO Interpretation
export interface XOInterpretation {
  coreTension: string;
  emotionalWeight: string;
  seedMoment: string;
  intentSummary: string;
  
  clearPoints: string[];
  doubtfulPoints: string[];
  
  riskAssessment: MeaningRiskAssessment;
  confidence: number;
  
  minimalAssumptions: {
    emotionDirection: 'positive' | 'negative' | 'neutral' | 'layered' | 'unknown';
    tensionType: 'contrast' | 'desire' | 'observation' | 'reflection' | 'unknown';
    intentCategory: 'share' | 'inquire' | 'emphasize' | 'reflect' | 'unknown';
  };
  
  meaningContract?: MeaningContract;
}

// XO API Response Types
export interface XOGenerateRequest {
  userInput?: string;
  market?: 'GLOBAL' | 'NG' | 'UK';
  brand?: string;
  meaningContract?: MeaningContract;
  requestType?: 'micro-story' | 'expansion' | 'purpose-adaptation' | 'refinement';
  purpose?: string;
  currentStory?: string; // JSON stringified MicroStory or story text
  refinement?: 'expand' | 'gentler' | 'harsher';
  brandContext?: {
    name?: string;
    palette?: string[];
    fonts?: string[];
  };
  skipBrand?: boolean;
}

export interface XOGenerateResponse {
  success: boolean;
  story: string;
  beatSheet: Array<{
    beat: string;
    description: string;
    visualCues: string[];
    emotion?: string;
    characterAction?: string;
  }>;
  metadata: {
    emotionalState: string;
    narrativeTension: string;
    intentCategory: string;
    coreTheme: string;
    wordCount: number;
    isBrandStory?: boolean;
    brandName?: string;
    brandPalette?: string[];
    brandFonts?: string[];
    template: string;
    lineCount: number;
    market?: 'GLOBAL' | 'NG' | 'UK';
    totalBeats?: number;
    estimatedDuration?: string;
    title?: string;
    archetype?: string;
    tone?: string;
  };
  microStory?: MicroStory;
  error?: string;
}

export interface XOCCNResponse {
  success: boolean;
  interpretation: XOInterpretation;
  needsClarification: boolean;
  clarification?: {
    hypothesis: string;
    correctionInvitation: string;
    unclearElement: string;
  };
  understandingPreview: string;
  understandingSummary?: string;
  error?: string;
}

// ============================================================================
// LEGACY TYPES (for backward compatibility)
// ============================================================================

export interface SemanticExtraction {
  pathway: "assumption-first" | "constraint-first" | "audience-first" | "function-first";
  baselineStance: string;
  toneConstraints: string[];
  prohibitions: string[];
  audience: string;
  intentSummary: string;
  hasBrandContext?: boolean;
  productCategory?: string;
  confidence?: number;
  confidenceScores?: {
    pathway: number;
    stance: number;
    tone: number;
    audience: number;
  };
  emotion?: string;
  scene?: string;
  seedMoment?: string;
  rawAnalysis?: string;
}

export interface CCNInterpretationRevised {
  pathway: "assumption-first" | "constraint-first" | "audience-first" | "function-first";
  baselineStance: string;
  toneConstraints: string[];
  prohibitions: string[];
  audience: string;
  intentSummary: string;
  hasBrandContext?: boolean;
  productCategory?: string | null;
  confidence: number;
  confidenceScores: {
    pathway: number;
    stance: number;
    tone: number;
    audience: number;
  };
  understandingPreview: string;
  rawAnalysis: string;
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

// ============================================================================
// SHARED TYPES
// ============================================================================

export interface CCNInput {
  userInput: string;
  entryPathway?: 'emotion' | 'scene' | 'seed' | 'audience';
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

export interface ClarificationQuestion {
  question: string;
  options: string[];
  field: 'need' | 'archetype' | 'tone' | 'context' | 'constraints';
}

export interface BrandAssets {
  palette?: string[];
  fonts?: string[];
  brandSafe?: boolean;
  logoUrls?: string[];
  logoPositions?: Array<{x: number, y: number, width: number, height: number}>;
  brandKeywords?: string[];
  documentType?: string;
  extractedText?: string;
}

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
    isBrandStory?: boolean;
    productCategory?: string;
    appliedConstraints?: string[];
    enforcedProhibitions?: string[];
    // XO Enhanced metadata
    emotionalState?: string;
    narrativeTension?: string;
    intentCategory?: string;
    coreTheme?: string;
    wordCount?: number;
    brandName?: string;
    brandPalette?: string[];
    brandFonts?: string[];
    template?: string;
    lineCount?: number;
    market?: 'GLOBAL' | 'NG' | 'UK';
  };
}

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

export interface GenerateImageRequest {
  sceneDescription: string;
  visualCues?: string[];
  tone: string;
  brandAssets?: BrandAssets; // New field
  brandSafe?: boolean;
  template?: string;
  beatIndex?: number;
  beat?: string;
  characterDescription?: CharacterDescription;
  previousCharacterImage?: string;
  isSameCharacter?: boolean;
  microStoryBeat?: MicroStoryBeat;
  market?: 'GLOBAL' | 'NG' | 'UK';
}


export interface GenerateImageResponse {
  success: boolean;
  imageUrl: string;
  revisedPrompt: string;
  sceneDescription: string;
  beatIndex?: number;
  brandAssetsUsed?: {
    palette?: string[];
    fonts?: string[];
    keywords?: string[];
  };
}


// Legacy story generation (kept for compatibility)
export interface LegacyGenerateStoryRequest {
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

export interface LegacyGenerateStoryResponse {
  success: boolean;
  story: string;
  beatSheet: Scene[];
  metadata: {
    title: string;
    archetype: string;
    tone: string;
    totalBeats: number;
    estimatedDuration: string;
    isBrandStory?: boolean;
    productCategory?: string;
    appliedConstraints?: string[];
    enforcedProhibitions?: string[];
    originalSubject?: string;
  };
}

export interface GenerateVideoScriptRequest {
  story: GeneratedStory;
  tone: string;
  template: string;
}

export interface GenerateVideoScriptResponse {
  success: boolean;
  videoScript: VideoScript;
}

export type UserMode = 'creator' | 'agency' | 'brand';

// CCN Data for state management
export type CCNData = {
  // Meaning-based fields
  emotionalWeight: string;
  coreTension: string;
  seedMoment: string;
  intentSummary: string;
  // Minimal assumptions
  emotionDirection?: 'positive' | 'negative' | 'neutral' | 'layered' | 'unknown';
  tensionType?: 'contrast' | 'desire' | 'observation' | 'reflection' | 'unknown';
  intentCategory?: 'share' | 'inquire' | 'emphasize' | 'reflect' | 'unknown';
  // Meaning contract when available
  meaningContract?: MeaningContract;
  
  // Legacy fields (temporary)
  pathway?: string;
  baselineStance?: string;
  toneConstraints?: string[];
  prohibitions?: string[];
  hasBrandContext?: boolean;
  productCategory?: string;
  emotion?: string;
  scene?: string;
  rawAnalysis?: string;
};

// ============================================================================
// XO REFERENCE MICRO-STORY TYPES
// ============================================================================

export interface ReferenceMicroStory {
  id: string;
  market: 'GLOBAL' | 'NG' | 'UK';
  hasBrand: boolean;
  entryPath: 'emotion' | 'scene' | 'seed' | 'audience';
  description: string;
  beats: string[];
  whyItPasses: string[];
  commonFailureItAvoids: string[];
  tags: string[];
}

export interface ReferenceMicroStoryPack {
  version: string;
  stories: ReferenceMicroStory[];
}