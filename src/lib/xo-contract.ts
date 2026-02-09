/**
 * XO CONTRACT v1.0
 * Single Source of Truth for XO Narrative System
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type MarketCode = 'NG' | 'GH' | 'KE' | 'ZA' | 'UK' | 'GLOBAL';
export type EntryPath = 'emotion' | 'scene' | 'audience' | 'seed' | 'full';
export type MarketState = 'NEUTRAL' | 'RESOLVED' | 'BROAD';
export type BrandMode = 'NONE' | 'IMPLICIT' | 'EXPLICIT';
export type FormatMode = 'MICROSTORY' | 'FULLSTORY';
export type RefinementType = 'expand' | 'gentler' | 'harsher' | 'brandify' | 'deblandify';

// ============================================================================
// CONTRACT INTERFACE
// ============================================================================

export interface XOContract {
  // Core Configuration
  entryPath: EntryPath;
  marketCode: MarketCode;
  marketState: MarketState;
  marketConfidence: number; // 0-1 scale
  
  // Brand Configuration
  brandMode: BrandMode;
  brandName?: string;
  
  // Content Constraints
  allowInvention: false | 'SCENE_ONLY';
  maxBeats: number;
  maxLinesPerBeat: number;
  maxWordsPerLine: number;
  
  // Format & Structure
  formatMode: FormatMode;
  requirePathMarkers: boolean;
  requireStorySections: boolean;
  
  // Validation Rules
  strictMode: boolean;
  failOnInvention: boolean;
  failOnMarketLeakage: boolean;
  failOnBrandBeforeMeaning: boolean;
  
  // Context (for validation)
  context: {
    userInputTokens: string[];
    allowedNouns: string[];
    seedMoment: string;
    timestamp: string;
  };
}

// ============================================================================
// DEFAULT CONTRACT
// ============================================================================

export const DEFAULT_XO_CONTRACT: XOContract = {
  // Core Configuration
  entryPath: 'scene',
  marketCode: 'GLOBAL',
  marketState: 'NEUTRAL',
  marketConfidence: 0.5,
  
  // Brand Configuration
  brandMode: 'NONE',
  
  // Content Constraints
  allowInvention: false,
  maxBeats: 3, // 3 for micro, 5 for full
  maxLinesPerBeat: 2,
  maxWordsPerLine: 15,
  
  // Format & Structure
  formatMode: 'MICROSTORY',
  requirePathMarkers: true,
  requireStorySections: false,
  
  // Validation Rules
  strictMode: false,
  failOnInvention: true,
  failOnMarketLeakage: true,
  failOnBrandBeforeMeaning: true,
  
  // Context
  context: {
    userInputTokens: [],
    allowedNouns: [],
    seedMoment: '',
    timestamp: new Date().toISOString(),
  },
};

// ============================================================================
// CONTRACT BUILDER
// ============================================================================

export class XOContractBuilder {
  private contract: XOContract;
  
  constructor(baseContract: Partial<XOContract> = {}) {
    this.contract = { ...DEFAULT_XO_CONTRACT, ...baseContract };
  }
  
  // Core Configuration
  withEntryPath(entryPath: EntryPath): this {
    this.contract.entryPath = entryPath;
    return this;
  }
  
  withMarket(marketCode: MarketCode, confidence?: number): this {
    this.contract.marketCode = marketCode;
    
    // Auto-determine market state based on confidence
    if (confidence !== undefined) {
      this.contract.marketConfidence = confidence;
      this.contract.marketState = confidence >= 0.75 ? 'RESOLVED' : 'NEUTRAL';
    }
    
    return this;
  }
  
  // Brand Configuration
  withBrand(brandName: string, mode: BrandMode = 'EXPLICIT'): this {
    this.contract.brandName = brandName;
    this.contract.brandMode = mode;
    return this;
  }
  
  withoutBrand(): this {
    this.contract.brandName = undefined;
    this.contract.brandMode = 'NONE';
    return this;
  }
  
  // Content Constraints
  withInvention(allowed: false | 'SCENE_ONLY'): this {
    this.contract.allowInvention = allowed;
    return this;
  }
  
  withMaxBeats(maxBeats: number): this {
    this.contract.maxBeats = maxBeats;
    return this;
  }
  
  // Format
  withFormatMode(formatMode: FormatMode): this {
    this.contract.formatMode = formatMode;
    
    // Auto-set beats based on format
    this.contract.maxBeats = formatMode === 'FULLSTORY' ? 5 : 3;
    this.contract.requireStorySections = formatMode === 'FULLSTORY';
    
    return this;
  }
  
  // Validation Rules
  withStrictMode(enabled: boolean): this {
    this.contract.strictMode = enabled;
    this.contract.failOnInvention = enabled;
    this.contract.failOnMarketLeakage = enabled;
    this.contract.failOnBrandBeforeMeaning = enabled;
    return this;
  }
  
  // Context
  withUserInput(input: string): this {
    // Extract tokens and nouns from input
    const tokens = input.toLowerCase().split(/\W+/).filter(t => t.length > 2);
    
    // Extract nouns (simple heuristic)
    const allowedNouns = tokens.filter(token => 
      // Common nouns or specific mentions
      token.length > 3 || 
      ['car', 'sun', 'day', 'man', 'room', 'door', 'key'].includes(token)
    );
    
    this.contract.context = {
      userInputTokens: tokens,
      allowedNouns,
      seedMoment: input,
      timestamp: new Date().toISOString(),
    };
    
    return this;
  }
  
  // Build
  build(): XOContract {
    // Validate contract
    this.validateContract();
    return { ...this.contract };
  }
  
  private validateContract(): void {
    // Validate market confidence
    if (this.contract.marketConfidence < 0 || this.contract.marketConfidence > 1) {
      throw new Error('Market confidence must be between 0 and 1');
    }
    
    // Validate beats
    if (this.contract.maxBeats < 1 || this.contract.maxBeats > 10) {
      throw new Error('Max beats must be between 1 and 10');
    }
    
    // Validate brand mode consistency
    if (this.contract.brandMode !== 'NONE' && !this.contract.brandName) {
      throw new Error('Brand name required when brand mode is not NONE');
    }
    
    // Auto-correct market state if confidence is low
    if (this.contract.marketConfidence < 0.75) {
      this.contract.marketState = 'NEUTRAL';
    }
  }
}

// ============================================================================
// CONTRACT UTILITIES
// ============================================================================

export function createContractFromMeaningContract(meaningContract: any): XOContract {
  const builder = new XOContractBuilder();
  
  // Map from meaning contract
  if (meaningContract?.marketContext?.market) {
    builder.withMarket(
      meaningContract.marketContext.market as MarketCode,
      meaningContract.marketContext.confidence || 0.5
    );
  }
  
  if (meaningContract?.entryPath) {
    builder.withEntryPath(meaningContract.entryPath.toLowerCase() as EntryPath);
  }
  
  if (meaningContract?.interpretedMeaning?.emotionalState) {
    // Could map to strict mode or other settings
    if (meaningContract.interpretedMeaning.emotionalState === 'SERIOUS') {
      builder.withStrictMode(true);
    }
  }
  
  if (meaningContract?.seedMoment) {
    builder.withUserInput(meaningContract.seedMoment);
  }
  
  return builder.build();
}

export function isContractValid(contract: XOContract): boolean {
  try {
    new XOContractBuilder(contract).build();
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// PATH MARKER CONSTANTS (From Starter Pack v0.2)
// ============================================================================

export const PATH_MARKERS = {
  emotion: ['EMOTION_INPUT:', 'INSIGHT:', 'STORY:'],
  scene: ['SCENE_INPUT:', 'DETAILS_NOTICED:', 'STORY:'],
  audience: ['AUDIENCE_SIGNAL:', 'WHY_IT_MATTERS:', 'STORY:'],
  seed: ['SEED:', 'ARC:', 'STORY:'],
  full: ['HOOK:', 'CONFLICT:', 'TURN:', 'BRAND_ROLE:', 'CLOSE:'],
} as const;

// ============================================================================
// MARKET GUIDANCE (From Starter Pack v0.2)
// ============================================================================

export const MARKET_GUIDANCE: Record<MarketCode, string> = {
  NG: `NEUTRAL MODE: No Nigerian-specific references, slang, or cultural props.`,
  GH: `NEUTRAL MODE: No Ghanaian-specific references, slang, or cultural props.`,
  KE: `NEUTRAL MODE: No Kenyan-specific references, slang, or cultural props.`,
  ZA: `NEUTRAL MODE: No South African-specific references, slang, or cultural props.`,
  UK: `NEUTRAL MODE: No UK-specific references, slang, or cultural props.`,
  GLOBAL: `Universal human experiences only. No regional specifics.`,
};

export const MARKET_GUIDANCE_RESOLVED: Record<MarketCode, string> = {
  NG: `RESOLVED MODE: Authentic Nigerian context. Use relatable Nigerian experiences naturally. Avoid stereotypes.`,
  GH: `RESOLVED MODE: Authentic Ghanaian context. Use relatable Ghanaian experiences naturally. Avoid stereotypes.`,
  KE: `RESOLVED MODE: Authentic Kenyan context. Use relatable Kenyan experiences naturally. Avoid stereotypes.`,
  ZA: `RESOLVED MODE: Authentic South African context. Use relatable South African experiences naturally. Avoid stereotypes.`,
  UK: `RESOLVED MODE: Authentic UK context. Use British English spelling and phrasing naturally.`,
  GLOBAL: `Global context. Universally relatable experiences only.`,
};

// ============================================================================
// EXPORTS
// ============================================================================

export default XOContract;