/**
 * XO VALIDATOR v3.2
 * Philosophy-first validation with strict Allowed Noun Scope enforcement
 * CRITICAL FIX: Removed dangerous SCENE_ONLY bypass and fixed all TypeScript errors
 */

import { XOContract } from './xo-contract';
import { MicroStory, MicroStoryBeat } from './xo-renderer';

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationResult {
  passed: boolean;
  errors?: string[];
  warnings?: string[];
  metadata?: Record<string, any>;
}

export interface ValidationOptions {
  strictMode?: boolean;
  failOnWarning?: boolean;
  validateInvention?: boolean;
  validateMarketLeakage?: boolean;
  validateBrandPlacement?: boolean;
  validateStructure?: boolean;
  validateAllowedNouns?: boolean;
  nounDetectionThreshold?: number;
}

export interface InventionDetection {
  inventedNouns: string[];
  inventedPhrases: Array<{
    phrase: string;
    beatIndex: number;
    lineIndex: number;
  }>;
  beatsNeedingRegeneration: Array<{
    beatIndex: number;
    inventions: string[];
    lines: string[];
  }>;
}

// Matches contract's actual type: false | 'SCENE_ONLY'
export type InventionMode = 'NONE' | 'SCENE_ONLY';

// ============================================================================
// NOUN DETECTION ENGINE
// ============================================================================

/**
 * Sophisticated noun detection with multiple strategies
 */
class NounDetector {
  private readonly nounEndings = [
    'tion', 'ment', 'ness', 'ity', 'ance', 'ence', 
    'er', 'or', 'ist', 'ism', 'ship', 'hood', 'dom'
  ];
  
  private readonly commonVerbs = new Set<string>([
    'is', 'was', 'are', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'done',
    'make', 'makes', 'made', 'take', 'takes', 'took', 'taken',
    'go', 'goes', 'went', 'gone', 'see', 'saw', 'seen',
    'get', 'gets', 'got', 'gotten', 'know', 'knows', 'knew', 'known',
    'say', 'says', 'said', 'think', 'thinks', 'thought',
    'come', 'comes', 'came', 'want', 'wants', 'wanted',
    'look', 'looks', 'looked', 'use', 'uses', 'used',
    'find', 'finds', 'found', 'tell', 'tells', 'told'
  ]);
  
  private readonly commonAdjectives = new Set<string>([
    'good', 'bad', 'new', 'old', 'great', 'small', 'large',
    'big', 'little', 'high', 'low', 'different', 'same',
    'important', 'better', 'best', 'worst', 'worse'
  ]);
  
  private readonly commonAbstractNouns = new Set<string>([
    'thing', 'something', 'nothing', 'everything', 'anything',
    'way', 'time', 'year', 'day', 'week', 'month', 'life', 'world',
    'work', 'system', 'part', 'number', 'fact', 'point', 'area',
    'level', 'case', 'end', 'place', 'state', 'hand', 'person',
    'eye', 'woman', 'man', 'child', 'family', 'friend', 'people',
    'moment', 'minute', 'hour', 'morning', 'afternoon', 'evening', 'night'
  ]);
  
  private readonly sceneDescriptiveNouns = new Set<string>([
    'light', 'dark', 'shadow', 'shine', 'glow', 'bright',
    'room', 'space', 'area', 'corner', 'wall', 'floor', 'ceiling',
    'air', 'atmosphere', 'mood', 'feeling', 'sense',
    'quiet', 'silence', 'sound', 'noise', 'echo',
    'view', 'scene', 'setting', 'environment', 'surroundings'
  ]);

  constructor(private threshold: number = 0.6) {}

  /**
   * Extract potential nouns with confidence scores
   */
  extractNouns(text: string): Array<{ word: string; confidence: number }> {
    const words = text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length >= 3);
    
    const nouns: Array<{ word: string; confidence: number }> = [];
    
    for (const word of words) {
      const confidence = this.calculateNounConfidence(word);
      if (confidence >= this.threshold) {
        nouns.push({ word, confidence });
      }
    }
    
    return nouns;
  }

  /**
   * Calculate confidence that a word is a noun (0-1)
   */
  private calculateNounConfidence(word: string): number {
    let confidence = 0.5;
    
    if (this.commonVerbs.has(word)) {
      confidence -= 0.4;
    }
    
    if (this.commonAdjectives.has(word)) {
      confidence -= 0.3;
    }
    
    if (this.nounEndings.some(ending => word.endsWith(ending))) {
      confidence += 0.3;
    }
    
    if (this.commonAbstractNouns.has(word)) {
      confidence += 0.2;
    }
    
    if (this.sceneDescriptiveNouns.has(word)) {
      confidence += 0.1;
    }
    
    if (word.length >= 6) confidence += 0.1;
    if (word.length >= 8) confidence += 0.1;
    
    if (word.endsWith('s') && word.length > 3) {
      const singular = word.slice(0, -1);
      if (!this.commonVerbs.has(singular)) {
        confidence += 0.1;
      }
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Check if a word is a scene-descriptive noun (allowed in SCENE_ONLY mode)
   */
  isSceneDescriptive(word: string): boolean {
    return this.sceneDescriptiveNouns.has(word.toLowerCase());
  }

  /**
   * Get all scene-descriptive nouns
   */
  getSceneDescriptiveNouns(): string[] {
    return Array.from(this.sceneDescriptiveNouns);
  }
}

// ============================================================================
// INVENTION DETECTION ENGINE
// ============================================================================

class InventionDetector {
  constructor(
    private nounDetector: NounDetector,
    private allowedNouns: string[],
    private allowInvention: InventionMode = 'NONE'
  ) {}

  /**
   * Detect inventions in a beat
   */
  detectInventions(beat: MicroStoryBeat, beatIndex: number): InventionDetection {
    const inventedNouns: string[] = [];
    const inventedPhrases: Array<{ phrase: string; beatIndex: number; lineIndex: number }> = [];
    const beatsNeedingRegeneration: Array<{
      beatIndex: number;
      inventions: string[];
      lines: string[];
    }> = [];
    
    const beatInventions: string[] = [];
    
    beat.lines.forEach((line, lineIndex) => {
      const lineInventions = this.detectInventionsInLine(line);
      
      if (lineInventions.length > 0) {
        inventedNouns.push(...lineInventions);
        
        lineInventions.forEach(invention => {
          inventedPhrases.push({
            phrase: invention,
            beatIndex,
            lineIndex
          });
        });
        
        beatInventions.push(...lineInventions);
      }
    });
    
    if (beatInventions.length > 0) {
      const uniqueInventions = Array.from(new Set(beatInventions));
      beatsNeedingRegeneration.push({
        beatIndex,
        inventions: uniqueInventions,
        lines: beat.lines
      });
    }
    
    return {
      inventedNouns: Array.from(new Set(inventedNouns)),
      inventedPhrases,
      beatsNeedingRegeneration
    };
  }

  /**
   * Detect inventions in a single line
   */
  private detectInventionsInLine(line: string): string[] {
    const inventions: string[] = [];
    const potentialNouns = this.nounDetector.extractNouns(line);
    
    const allowedList = this.allowedNouns.map(n => n.toLowerCase());
    
    for (const { word } of potentialNouns) {
      if (this.allowInvention === 'SCENE_ONLY' && this.nounDetector.isSceneDescriptive(word)) {
        continue;
      }
      
      if (!this.isNounAllowed(word, allowedList)) {
        inventions.push(word);
      }
    }
    
    return inventions;
  }

  /**
   * Check if a noun is in the allowed set (with fuzzy matching)
   */
  private isNounAllowed(noun: string, allowedList: string[]): boolean {
    if (allowedList.includes(noun)) {
      return true;
    }
    
    for (const allowed of allowedList) {
      if (allowed.includes(noun) || noun.includes(allowed)) {
        return true;
      }
    }
    
    if (noun.endsWith('s')) {
      const singular = noun.slice(0, -1);
      if (allowedList.includes(singular)) {
        return true;
      }
    }
    
    return false;
  }
}

// ============================================================================
// VALIDATOR ENGINE
// ============================================================================

export class XOValidator {
  private options: ValidationOptions;
  private nounDetector: NounDetector;
  
  constructor(options: ValidationOptions = {}) {
    this.options = {
      strictMode: false,
      failOnWarning: false,
      validateInvention: true,
      validateMarketLeakage: true,
      validateBrandPlacement: true,
      validateStructure: true,
      validateAllowedNouns: true,
      nounDetectionThreshold: 0.6,
      ...options,
    };
    
    this.nounDetector = new NounDetector(this.options.nounDetectionThreshold);
  }
  
  /**
   * Validate a complete story
   */
  async validateStory(story: MicroStory): Promise<ValidationResult> {
    const results: ValidationResult[] = [];
    const { beats, contract } = story;
    
    if (this.options.validateStructure) {
      results.push(this.validateBeatsStructure(beats, contract));
    }
    
    if (this.options.validateAllowedNouns) {
      results.push(this.validateAllowedNounsScope(beats, contract));
    }
    
    if (this.options.validateInvention && contract.failOnInvention) {
      results.push(this.validateNoInvention(beats, contract));
    }
    
    if (this.options.validateMarketLeakage && contract.failOnMarketLeakage) {
      results.push(this.validateMarketLeakage(beats, contract));
    }
    
    if (this.options.validateBrandPlacement && contract.failOnBrandBeforeMeaning) {
      results.push(this.validateBrandPlacement(beats, contract));
    }
    
    if (contract.brandMode !== 'NONE') {
      results.push(this.validateBrandIsRemovable(beats, contract));
    }
    
    if (contract.marketState === 'NEUTRAL') {
      results.push(this.validateMarketRestraint(beats, contract));
    }
    
    return this.combineResults(results);
  }
  
  /**
   * Validate beats (for individual passes)
   */
  async validateBeats(beats: MicroStoryBeat[], contract: XOContract): Promise<ValidationResult> {
    const results: ValidationResult[] = [];
    
    results.push(this.validateBeatsStructure(beats, contract));
    
    if (contract.failOnInvention) {
      results.push(this.validateAllowedNounsScope(beats, contract));
    }
    
    return this.combineResults(results);
  }
  
  // ==========================================================================
  // CORE VALIDATORS
  // ==========================================================================
  
  /**
   * Validate beats structure
   */
  private validateBeatsStructure(beats: MicroStoryBeat[], contract: XOContract): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: Record<string, any> = {
      beatCount: beats.length,
      maxAllowed: contract.maxBeats,
      beatsWithIssues: [],
    };
    
    if (beats.length > contract.maxBeats) {
      errors.push(`Too many beats: ${beats.length} > ${contract.maxBeats}`);
    } else if (beats.length < Math.min(2, contract.maxBeats)) {
      warnings.push(`Few beats: ${beats.length} (minimum 2 recommended)`);
    }
    
    beats.forEach((beat, index) => {
      if (beat.lines.length > contract.maxLinesPerBeat) {
        errors.push(`Beat ${index + 1} has too many lines: ${beat.lines.length} > ${contract.maxLinesPerBeat}`);
        metadata.beatsWithIssues.push(index);
      }
      
      beat.lines.forEach((line, lineIndex) => {
        const wordCount = line.trim().split(/\s+/).length;
        if (wordCount > contract.maxWordsPerLine) {
          errors.push(`Beat ${index + 1}, line ${lineIndex + 1} too long: ${wordCount} > ${contract.maxWordsPerLine} words`);
          metadata.beatsWithIssues.push(index);
        }
        if (wordCount < 2) {
          warnings.push(`Beat ${index + 1}, line ${lineIndex + 1} very short: ${wordCount} words`);
        }
      });
      
      if (beat.lines.length === 0) {
        errors.push(`Beat ${index + 1} has no lines`);
        metadata.beatsWithIssues.push(index);
      }
    });
    
    return {
      passed: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };
  }
  
  /**
   * Validate all nouns are within allowed scope
   * FIXED: No more dangerous bypass, proper SCENE_ONLY handling
   */
  private validateAllowedNounsScope(beats: MicroStoryBeat[], contract: XOContract): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const inventionMode: InventionMode = contract.allowInvention === 'SCENE_ONLY' 
      ? 'SCENE_ONLY' 
      : 'NONE';
    
    const inventionDetector = new InventionDetector(
      this.nounDetector,
      contract.context.allowedNouns,
      inventionMode
    );
    
    const allInventions: string[] = [];
    const beatsNeedingRegeneration: Array<{
      beatIndex: number;
      inventions: string[];
      lines: string[];
    }> = [];
    
    beats.forEach((beat, beatIndex) => {
      const detection = inventionDetector.detectInventions(beat, beatIndex);
      
      if (detection.inventedNouns.length > 0) {
        allInventions.push(...detection.inventedNouns);
        
        if (detection.beatsNeedingRegeneration.length > 0) {
          beatsNeedingRegeneration.push(...detection.beatsNeedingRegeneration);
        }
      }
    });
    
    const uniqueInventions = Array.from(new Set(allInventions));
    
    const metadata: Record<string, any> = {
      allowedNounsCount: contract.context.allowedNouns.length,
      allowedNouns: contract.context.allowedNouns.slice(0, 20),
      inventedNouns: uniqueInventions,
      beatsNeedingRegeneration,
      allowInventionMode: inventionMode,
      sceneDescriptiveNouns: this.nounDetector.getSceneDescriptiveNouns(),
    };
    
    if (uniqueInventions.length > 0) {
      const nounList = uniqueInventions.slice(0, 5).join(', ');
      
      if (inventionMode === 'SCENE_ONLY') {
        const nonSceneInventions = uniqueInventions.filter(
          inv => !this.nounDetector.isSceneDescriptive(inv)
        );
        
        if (nonSceneInventions.length > 0) {
          const nonSceneList = nonSceneInventions.slice(0, 5).join(', ');
          warnings.push(
            `Found ${nonSceneInventions.length} non-scene inventions in SCENE_ONLY mode`,
            `Examples: ${nonSceneList}${nonSceneInventions.length > 5 ? '...' : ''}`,
            `Scene-descriptive nouns allowed: ${this.nounDetector.getSceneDescriptiveNouns().slice(0, 10).join(', ')}...`
          );
          
          if (contract.strictMode) {
            errors.push(`Strict mode: ${nonSceneInventions.length} non-scene inventions found`);
          }
        } else {
          warnings.push(
            `Found ${uniqueInventions.length} scene-descriptive inventions (allowed in SCENE_ONLY mode)`,
            `Examples: ${nounList}${uniqueInventions.length > 5 ? '...' : ''}`
          );
        }
      } else {
        const message = `Found ${uniqueInventions.length} inventions (not allowed in NONE mode)`;
        
        if (contract.strictMode) {
          errors.push(
            message,
            `Examples: ${nounList}${uniqueInventions.length > 5 ? '...' : ''}`,
            `Allowed nouns: ${contract.context.allowedNouns.slice(0, 10).join(', ')}${contract.context.allowedNouns.length > 10 ? '...' : ''}`
          );
        } else {
          warnings.push(
            message,
            `Examples: ${nounList}${uniqueInventions.length > 5 ? '...' : ''}`,
            `Allowed nouns: ${contract.context.allowedNouns.slice(0, 10).join(', ')}${contract.context.allowedNouns.length > 10 ? '...' : ''}`
          );
        }
      }
    }
    
    if (contract.context.allowedNouns.length === 0) {
      if (inventionMode === 'SCENE_ONLY') {
        warnings.push(
          'Allowed nouns list is empty. In SCENE_ONLY mode, only scene-descriptive nouns are allowed.',
          `Scene-descriptive nouns: ${this.nounDetector.getSceneDescriptiveNouns().slice(0, 10).join(', ')}...`
        );
      } else {
        errors.push(
          'Allowed nouns list is empty and allowInvention=NONE - no nouns are permitted!',
          'This will likely cause validation failures.'
        );
      }
    }
    
    return {
      passed: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };
  }
  
  /**
   * Validate no invention (delegates to allowed nouns scope)
   */
  private validateNoInvention(beats: MicroStoryBeat[], contract: XOContract): ValidationResult {
    return this.validateAllowedNounsScope(beats, contract);
  }
  
  /**
   * Validate market leakage with NEUTRAL lock
   */
  private validateMarketLeakage(beats: MicroStoryBeat[], contract: XOContract): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: Record<string, any> = {
      marketState: contract.marketState,
      marketCode: contract.marketCode,
      leakageFound: [],
      culturalTextureFound: [],
    };
    
    if (contract.marketState === 'RESOLVED') {
      return {
        passed: true,
        metadata,
      };
    }
    
    if (contract.marketState === 'NEUTRAL') {
      for (const beat of beats) {
        for (const line of beat.lines) {
          const lowerLine = line.toLowerCase();
          
          if (this.containsCulturalTexture(lowerLine)) {
            errors.push(`Cultural texture in NEUTRAL market: "${line.substring(0, 40)}..."`);
            metadata.culturalTextureFound.push({
              line: line.substring(0, 50),
              textureType: this.detectTextureType(lowerLine),
            });
          }
          
          if (this.containsLocationSpecific(lowerLine)) {
            errors.push(`Location specific in NEUTRAL market: "${line.substring(0, 40)}..."`);
            metadata.leakageFound.push('location specific');
          }
        }
      }
    }
    
    const LEAKAGE_TOKENS: Record<string, string[]> = {
      NG: ['lagos', 'abuja', 'naira', 'ijgb', 'omo', 'abeg', 'jollof', 'danfo', 'wahala'],
      GH: ['accra', 'kumasi', 'cedi', 'chale', 'kɔkɔɔ', 'trotro'],
      KE: ['nairobi', 'mombasa', 'ksh', 'shilling', 'safaricom', 'matatu'],
      ZA: ['johannesburg', 'joburg', 'cape town', 'rand', 'braai', 'eish'],
      UK: ['london', 'manchester', 'pound', 'quid', 'mates', 'cheers', 'lorry'],
      US: ['dollar', 'bucks', 'y\'all', 'sidewalk', 'elevator', 'apartment']
    };
    
    for (const beat of beats) {
      for (const line of beat.lines) {
        const lowerLine = line.toLowerCase();
        
        for (const [market, tokens] of Object.entries(LEAKAGE_TOKENS)) {
          if (market === contract.marketCode) continue;
          
          for (const token of tokens) {
            if (lowerLine.includes(token)) {
              const message = `Market leakage: "${token}" (${market} token in ${contract.marketCode} market)`;
              
              if (contract.marketState === 'NEUTRAL') {
                errors.push(message);
              } else {
                warnings.push(message);
              }
              
              metadata.leakageFound.push(`${token} from ${market}`);
            }
          }
        }
      }
    }
    
    return {
      passed: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata,
    };
  }
  
  /**
   * Validate brand placement
   */
  private validateBrandPlacement(beats: MicroStoryBeat[], contract: XOContract): ValidationResult {
    if (contract.brandMode === 'NONE') {
      return { passed: true };
    }
    
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: Record<string, any> = {
      brandMode: contract.brandMode,
      brandName: contract.brandName,
      brandFoundInBeats: [],
    };
    
    for (let i = 0; i < beats.length - 1; i++) {
      const beat = beats[i];
      const hasBrand = this.beatContainsBrand(beat, contract.brandName!);
      
      if (hasBrand) {
        errors.push(`Brand found in beat ${i + 1}, should only be in last beat`);
        metadata.brandFoundInBeats.push(i + 1);
      }
    }
    
    if (beats.length > 0) {
      const lastBeat = beats[beats.length - 1];
      const hasBrand = this.beatContainsBrand(lastBeat, contract.brandName!);
      
      if (contract.brandMode === 'EXPLICIT' && !hasBrand) {
        errors.push(`Brand not found in last beat for EXPLICIT mode`);
      } else if (contract.brandMode === 'IMPLICIT' && hasBrand) {
        warnings.push(`Explicit brand found in IMPLICIT mode (last beat)`);
        metadata.brandFoundInBeats.push(beats.length);
      } else if (hasBrand) {
        metadata.brandFoundInBeats.push(beats.length);
      }
    }
    
    return {
      passed: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata,
    };
  }
  
  /**
   * Validate brand is removable
   */
  private validateBrandIsRemovable(beats: MicroStoryBeat[], contract: XOContract): ValidationResult {
    const storyWithoutBrand = beats.slice(0, -1);
    const hasMeaning = this.hasMeaningfulContent(storyWithoutBrand);
    const hasEmotionalArc = this.hasEmotionalArc(storyWithoutBrand);
    
    return {
      passed: hasMeaning && hasEmotionalArc,
      errors: (hasMeaning && hasEmotionalArc) ? undefined : 
        ['Story lacks meaning or emotional arc without brand beat'],
      metadata: {
        removable: hasMeaning && hasEmotionalArc,
        beatsWithoutBrand: storyWithoutBrand.length,
        hasMeaning,
        hasEmotionalArc
      },
    };
  }
  
  /**
   * Validate market restraint
   */
  private validateMarketRestraint(beats: MicroStoryBeat[], contract: XOContract): ValidationResult {
    const warnings: string[] = [];
    const metadata: Record<string, any> = {
      marketState: contract.marketState,
      confidence: contract.marketConfidence,
      neutralViolations: [],
    };
    
    if (contract.marketConfidence < 0.75 && contract.marketState !== 'NEUTRAL') {
      warnings.push(`Market confidence low (${contract.marketConfidence}) but state is ${contract.marketState}`);
    }
    
    for (const beat of beats) {
      for (const line of beat.lines) {
        if (this.containsCulturalReference(line)) {
          metadata.neutralViolations.push(`Cultural reference: "${line.substring(0, 30)}..."`);
        }
        
        if (this.containsLocationSpecific(line)) {
          metadata.neutralViolations.push(`Location specific: "${line.substring(0, 30)}..."`);
        }
        
        if (this.containsTimeSpecific(line)) {
          metadata.neutralViolations.push(`Time specific: "${line.substring(0, 30)}..."`);
        }
      }
    }
    
    if (metadata.neutralViolations.length > 0) {
      warnings.push(`Neutral market violations: ${metadata.neutralViolations.length} found`);
    }
    
    return {
      passed: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata,
    };
  }
  
  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================
  
  /**
   * Check if beat contains brand
   */
  private beatContainsBrand(beat: MicroStoryBeat, brandName: string): boolean {
    const lowerBrand = brandName.toLowerCase();
    
    for (const line of beat.lines) {
      if (line.toLowerCase().includes(lowerBrand)) {
        return true;
      }
      
      const brandKeywords = this.getBrandKeywords(brandName);
      for (const keyword of brandKeywords) {
        if (line.toLowerCase().includes(keyword.toLowerCase())) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Get brand keywords
   */
  private getBrandKeywords(brandName: string): string[] {
    const lowerBrand = brandName.toLowerCase();
    const keywords = [brandName];
    
    if (lowerBrand.includes('wash') || lowerBrand.includes('laundry')) {
      keywords.push('machine', 'wash', 'clean', 'fabric', 'clothes', 'load', 'cycle');
    }
    if (lowerBrand.includes('detergent') || lowerBrand.includes('clean')) {
      keywords.push('clean', 'fresh', 'stain', 'suds', 'rinse');
    }
    if (lowerBrand.includes('car') || lowerBrand.includes('auto')) {
      keywords.push('drive', 'road', 'engine', 'wheel', 'journey');
    }
    if (lowerBrand.includes('bank') || lowerBrand.includes('financial')) {
      keywords.push('money', 'secure', 'account', 'save', 'transaction');
    }
    if (lowerBrand.includes('food') || lowerBrand.includes('meal')) {
      keywords.push('eat', 'meal', 'taste', 'flavor', 'dish');
    }
    if (lowerBrand.includes('tech') || lowerBrand.includes('digital')) {
      keywords.push('device', 'screen', 'app', 'digital', 'connect');
    }
    
    return Array.from(new Set(keywords));
  }
  
  /**
   * Check if story has meaningful content
   */
  private hasMeaningfulContent(beats: MicroStoryBeat[]): boolean {
    if (beats.length === 0) return false;
    
    let totalWords = 0;
    const uniqueConcepts = new Set<string>();
    
    for (const beat of beats) {
      for (const line of beat.lines) {
        const words = line.trim().split(/\s+/);
        totalWords += words.length;
        
        const potentialNouns = this.nounDetector.extractNouns(line);
        potentialNouns.forEach(({ word }) => uniqueConcepts.add(word));
      }
    }
    
    return totalWords >= 10 && uniqueConcepts.size >= 3;
  }
  
  /**
   * Check if story has emotional arc
   */
  private hasEmotionalArc(beats: MicroStoryBeat[]): boolean {
    if (beats.length < 2) return false;
    
    const emotionalTerms = [
      'happy', 'sad', 'joy', 'fear', 'love', 'hate',
      'excited', 'nervous', 'calm', 'angry', 'peaceful',
      'hopeful', 'worried', 'surprised', 'grateful'
    ];
    
    let emotionalMentions = 0;
    
    for (const beat of beats) {
      for (const line of beat.lines) {
        const lowerLine = line.toLowerCase();
        for (const term of emotionalTerms) {
          if (lowerLine.includes(term)) {
            emotionalMentions++;
            break;
          }
        }
      }
    }
    
    return emotionalMentions >= 2;
  }
  
  /**
   * Check for cultural references
   */
  private containsCulturalReference(line: string): boolean {
    const culturalTerms = [
      'cultural', 'traditional', 'local', 'native', 'ethnic',
      'heritage', 'custom', 'ritual', 'ceremony', 'festival',
      'celebration', 'gathering', 'community'
    ];
    const lowerLine = line.toLowerCase();
    return culturalTerms.some(term => lowerLine.includes(term));
  }
  
  /**
   * Check for location specifics
   */
  private containsLocationSpecific(line: string): boolean {
    const locationTerms = [
      'city', 'town', 'village', 'country', 'region',
      'street', 'road', 'avenue', 'boulevard', 'square',
      'mountain', 'river', 'lake', 'ocean', 'beach',
      'downtown', 'suburb', 'neighborhood'
    ];
    const lowerLine = line.toLowerCase();
    return locationTerms.some(term => lowerLine.includes(term));
  }
  
  /**
   * Check for time specifics
   */
  private containsTimeSpecific(line: string): boolean {
    const timeTerms = [
      'morning', 'afternoon', 'evening', 'night',
      'today', 'tomorrow', 'yesterday',
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      '2020', '2021', '2022', '2023', '2024', '2025'
    ];
    const lowerLine = line.toLowerCase();
    return timeTerms.some(term => lowerLine.includes(term));
  }
  
  /**
   * Check for cultural texture
   */
  private containsCulturalTexture(line: string): boolean {
    const texturePatterns = [
      /\b(community|tradition|custom|ritual|heritage)\b/i,
      /\b(extended\s+family|elders|ancestors)\b/i,
      /\b(celebrat|festiv|ceremon|gathering)\b/i,
      /\b(marketplace|street\s+vendor|informal\s+economy)\b/i,
      /\b(savings|loan|informal\s+banking)\b/i,
      /\b(communal|shared|collective)\b/i,
      /\b(home\s+cooked|local\s+cuisine|street\s+food)\b/i,
      /\b(public\s+transport|shared\s+ride)\b/i,
      /\b(proverb|saying|expression)\b/i,
      /\b(mother\s+tongue|local\s+language)\b/i,
    ];
    return texturePatterns.some(pattern => pattern.test(line));
  }
  
  /**
   * Detect type of cultural texture
   */
  private detectTextureType(line: string): string {
    if (/\b(community|tradition|custom|ritual)\b/i.test(line)) return 'social';
    if (/\b(marketplace|vendor|economy)\b/i.test(line)) return 'economic';
    if (/\b(communal|shared|collective)\b/i.test(line)) return 'lifestyle';
    if (/\b(food|cuisine|cooked)\b/i.test(line)) return 'culinary';
    if (/\b(proverb|saying|expression)\b/i.test(line)) return 'linguistic';
    return 'general';
  }
  
  /**
   * Combine multiple validation results
   */
  private combineResults(results: ValidationResult[]): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    const allMetadata: Record<string, any> = {};
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      
      if (result.errors) {
        allErrors.push(...result.errors);
      }
      
      if (result.warnings) {
        allWarnings.push(...result.warnings);
      }
      
      if (result.metadata) {
        allMetadata[`validation_${i}`] = result.metadata;
      }
    }
    
    let passed = true;
    
    if (this.options.strictMode && allErrors.length > 0) {
      passed = false;
    }
    
    if (this.options.failOnWarning && allWarnings.length > 0) {
      passed = false;
    }
    
    if (!this.options.strictMode) {
      const criticalErrors = allErrors.filter(e => 
        e.includes('Market leakage') || 
        e.includes('non-scene inventions') ||
        (e.includes('Brand found in beat') && e.includes('should only be in last beat')) ||
        e.includes('allowed nouns list is empty') ||
        e.includes('lacks meaning without brand')
      );
      
      if (criticalErrors.length > 0) {
        passed = false;
      }
    }
    
    return {
      passed,
      errors: allErrors.length > 0 ? allErrors : undefined,
      warnings: allWarnings.length > 0 ? allWarnings : undefined,
      metadata: Object.keys(allMetadata).length > 0 ? allMetadata : undefined,
    };
  }
  
  /**
   * CI/CD gate check
   */
  shouldShip(validationResult: ValidationResult): boolean {
    if (!validationResult.passed) return false;
    
    if (validationResult.errors?.some(e => 
      e.includes('lacks meaning without brand') ||
      e.includes('Brand found in beat') ||
      e.includes('non-scene inventions') ||
      e.includes('Market leakage')
    )) {
      return false;
    }
    
    return true;
  }
}

export default XOValidator;