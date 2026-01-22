// /types/index.ts
// ============================================================================
// NARRATIVES.XO - MEANING-FIRST TYPES
// XO Doctrine: Interpret meaning, don't impose constraints
// ============================================================================

// Entry Pathways (observation points, not constraints)
export type EntryPathway = 'assumption' | 'audience' | 'constraints' | 'function';

// Meaning Risk Types
export type MeaningRisk = 
  | 'emotion-distortion'
  | 'intent-misinterpretation'
  | 'context-assumption'
  | 'tension-overlook'
  | 'literal-vs-metaphor'
  | 'irony-missed'
  | 'positive-negative-ambiguity';

export interface MeaningRiskAssessment {
  risks: MeaningRisk[];
  riskLevel: 'low' | 'medium' | 'high';
  distortionLikelihood: number;
  specificDoubt: string;
  confidentInterpretation: string;
  hypothesis?: string;
}

// THE MEANING CONTRACT - Explicit semantic payload
export interface MeaningContract {
  interpretedMeaning: {
    emotionalState: 'positive' | 'negative' | 'neutral' | 'layered' | 'complex' | 'ambiguous';
    emotionalDirection: 'inward' | 'outward' | 'observational' | 'relational' | 'unknown';
    narrativeTension: string;
    intentCategory: 'share' | 'inquire' | 'emphasize' | 'reflect' | 'process' | 'express' | 'connect';
    coreTheme: string;
  };
  
  confidence: number;
  certaintyMode: 'tentative-commit' | 'reflection-only' | 'clarification-needed';
  reversible: boolean;
  safeToNarrate: boolean;
  
  provenance: {
    source: 'ccn-interpretation';
    riskLevel: 'low' | 'medium' | 'high';
    distortionLikelihood: number;
    risksAcknowledged: MeaningRisk[];
  };
  
  seedMoment: string;
}

// XO Interpretation (new system)
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
  error?: string;
}

// ============================================================================
// LEGACY TYPES (for backward compatibility - mark as deprecated)
// ============================================================================

/** @deprecated Use MeaningContract instead */
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

/** @deprecated Use XOInterpretation instead */
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

/** @deprecated Use XOCCNResponse instead */
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
// SHARED TYPES (unchanged)
// ============================================================================

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

export interface ClarificationQuestion {
  question: string;
  options: string[];
  field: 'need' | 'archetype' | 'tone' | 'context' | 'constraints';
}

export interface BrandAssets {
  palette?: string[];
  fonts?: string[];
  brandSafe?: boolean;
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

// NEW: Story generation using Meaning Contract
export interface GenerateStoryRequest {
  meaningContract: MeaningContract;
  originalInput?: string;
  currentStory?: string;
  requestType?: 'micro-story' | 'expansion' | 'purpose-adaptation';
  purpose?: string;
  brandContext?: {
    name?: string;
    palette?: string[];
    fonts?: string[];
  };
  skipBrand?: boolean;
}

export interface GenerateStoryResponse {
  success: boolean;
  story: string;
  beatSheet: Scene[];
  metadata: {
    emotionalState: string;
    narrativeTension: string;
    intentCategory: string;
    coreTheme: string;
    wordCount: number;
    // Brand context - applied AFTER meaning
    isBrandStory?: boolean;
    brandName?: string;
    // Format tracking
    template?: string;
  };
}

// Legacy story generation (deprecated)
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

// CCN Data for state management (updated for new system)
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