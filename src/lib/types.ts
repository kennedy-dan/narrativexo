// ============================================================================
// CORE TYPES
// ============================================================================

export type Market = 'NG' | 'GH' | 'KE' | 'ZA' | 'UK' | 'GLOBAL';
export type EntryPath = 'EMOTION' | 'SCENE' | 'STORY_SEED' | 'AUDIENCE_SIGNAL';
export type Tone = 'PLAYFUL' | 'SERIOUS' | 'PREMIUM' | 'GRASSROOTS' | 'NEUTRAL';

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationResult {
  passed: boolean;
  errors?: string[];
  warnings?: string[];
  metadata?: Record<string, any>;
}

export interface ValidationContext {
  market: Market;
  entryPath?: EntryPath;
  tone?: Tone;
  format?: 'MICROSTORY' | 'SHORT' | 'SOCIAL' | 'SCRIPT' | 'MEMO';
  brandName?: string;
}

export interface XOOutput {
  text: string;
  metadata?: {
    market?: Market;
    entryPath?: EntryPath;
    tone?: Tone;
    hasPathMarkers?: boolean;
    validationResults?: Record<string, ValidationResult>;
  };
}

// ============================================================================
// VALIDATOR-SPECIFIC RESULT TYPES
// ============================================================================

export interface MarketLeakageResult {
  passed: boolean;
  hits: string[];
}

export interface StructureResult {
  passed: boolean;
  missing: string[];
  present: string[];
}

export interface ToneScore {
  observed: string;
  score: number;
  details: Record<string, number>;
}