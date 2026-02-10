/**
 * XO VALIDATOR v2.1
 * Philosophy-first validation with Allowed Noun Scope enforcement
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
}

export interface InventionDetection {
  inventedNouns: string[];
  beatsNeedingRegeneration: Array<{
    beatIndex: number;
    inventions: string[];
    lines: string[];
  }>;
}

// ============================================================================
// VALIDATOR ENGINE
// ============================================================================

export class XOValidator {
  private options: ValidationOptions;
  
  constructor(options: ValidationOptions = {}) {
    this.options = {
      strictMode: false,
      failOnWarning: false,
      validateInvention: true,
      validateMarketLeakage: true,
      validateBrandPlacement: true,
      validateStructure: true,
      validateAllowedNouns: true,
      ...options,
    };
  }
  
  /**
   * Validate a complete story
   */
  async validateStory(story: MicroStory): Promise<ValidationResult> {
    const results: ValidationResult[] = [];
    const { beats, contract } = story;
    
    // 1. Validate beats structure
    if (this.options.validateStructure) {
      results.push(this.validateBeatsStructure(beats, contract));
    }
    
    // 2. Validate allowed nouns scope (NEW - Critical)
    if (this.options.validateAllowedNouns) {
      results.push(this.validateAllowedNounsScope(beats, contract));
    }
    
    // 3. Validate no invention
    if (this.options.validateInvention && contract.failOnInvention) {
      results.push(this.validateNoInvention(beats, contract));
    }
    
    // 4. Validate market leakage with NEUTRAL lock
    if (this.options.validateMarketLeakage && contract.failOnMarketLeakage) {
      results.push(this.validateMarketLeakage(beats, contract));
    }
    
    // 5. Validate brand placement
    if (this.options.validateBrandPlacement && contract.failOnBrandBeforeMeaning) {
      results.push(this.validateBrandPlacement(beats, contract));
    }
    
    // 6. Validate brand is removable
    if (contract.brandMode !== 'NONE') {
      results.push(this.validateBrandIsRemovable(beats, contract));
    }
    
    // 7. Validate market restraint
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
   * Validate all nouns are within allowed scope (CRITICAL FIX)
   */
  private validateAllowedNounsScope(beats: MicroStoryBeat[], contract: XOContract): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: Record<string, any> = {
      allowedNounsCount: contract.context.allowedNouns.length,
      inventedNouns: [],
      beatsNeedingRegeneration: [],
    };
    
    if (contract.allowInvention === 'SCENE_ONLY' && contract.entryPath === 'scene') {
      return {
        passed: true,
        metadata: {
          bypassed: true,
          reason: 'SCENE_ONLY invention allowed for scene entry path',
        },
      };
    }
    
    const allGeneratedNouns = this.extractNounsFromBeats(beats);
    const allowedNouns = contract.context.allowedNouns.map(n => n.toLowerCase());
    
    for (const generatedNoun of allGeneratedNouns) {
      if (generatedNoun.length < 3) continue;
      if (this.isCommonWord(generatedNoun)) continue;
      
      const isAllowed = allowedNouns.some(allowedNoun => 
        allowedNoun.includes(generatedNoun.toLowerCase()) ||
        generatedNoun.toLowerCase().includes(allowedNoun)
      );
      
      const isSceneNoun = this.isSceneDescriptionNoun(generatedNoun);
      const sceneAllowed = contract.allowInvention === 'SCENE_ONLY' && 
                          contract.entryPath === 'scene' && 
                          isSceneNoun;
      
      if (!isAllowed && !sceneAllowed) {
        metadata.inventedNouns.push(generatedNoun);
        
        beats.forEach((beat, beatIndex) => {
          const beatText = beat.lines.join(' ').toLowerCase();
          if (beatText.includes(generatedNoun.toLowerCase())) {
            const existingBeat = metadata.beatsNeedingRegeneration.find(
              (b: any) => b.beatIndex === beatIndex
            );
            
            if (!existingBeat) {
              metadata.beatsNeedingRegeneration.push({
                beatIndex,
                inventions: [generatedNoun],
                lines: beat.lines,
              });
            } else {
              existingBeat.inventions.push(generatedNoun);
            }
          }
        });
      }
    }
    
    if (metadata.inventedNouns.length > 0) {
      const nounList = metadata.inventedNouns.slice(0, 5).join(', ');
      warnings.push(
        `Found ${metadata.inventedNouns.length} invented nouns outside allowed scope`,
        `Examples: ${nounList}${metadata.inventedNouns.length > 5 ? '...' : ''}`,
        `Allowed nouns: ${allowedNouns.slice(0, 10).join(', ')}${allowedNouns.length > 10 ? '...' : ''}`
      );
      
      if (contract.strictMode) {
        errors.push(`Strict mode: ${metadata.inventedNouns.length} invented nouns found`);
      }
    }
    
    return {
      passed: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: metadata.inventedNouns.length > 0 ? metadata : undefined,
    };
  }
  
  /**
   * Validate no invention (legacy method, softer now)
   */
  private validateNoInvention(beats: MicroStoryBeat[], contract: XOContract): ValidationResult {
    const warnings: string[] = [];
    const metadata: Record<string, any> = {
      allowedNouns: contract.context.allowedNouns,
      inventionsFound: [],
    };
    
    beats.forEach((beat, beatIndex) => {
      for (const line of beat.lines) {
        const inventions = contract.allowInvention === 'SCENE_ONLY'
          ? this.findNonSceneInventions(line, contract.context.allowedNouns)
          : this.findAllInventions(line, contract.context.allowedNouns);
        
        if (inventions.length > 0) {
          metadata.inventionsFound.push({
            beatIndex,
            inventions,
            line: line.substring(0, 50),
          });
        }
      }
    });
    
    if (metadata.inventionsFound.length > 0) {
      warnings.push(
        `Found ${metadata.inventionsFound.length} beats with invented elements`,
        `Use only: ${contract.context.allowedNouns.join(', ') || 'elements from input'}`
      );
    }
    
    return {
      passed: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: metadata.inventionsFound.length > 0 ? metadata : undefined,
    };
  }
  
  /**
   * Validate market leakage with NEUTRAL lock
   */
  private validateMarketLeakage(beats: MicroStoryBeat[], contract: XOContract): ValidationResult {
    const errors: string[] = [];
    const metadata: Record<string, any> = {
      marketState: contract.marketState,
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
          
          if (this.containsLocationSpecific(line)) {
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
    };
    
    for (const beat of beats) {
      for (const line of beat.lines) {
        const lowerLine = line.toLowerCase();
        
        for (const [market, tokens] of Object.entries(LEAKAGE_TOKENS)) {
          if (market === contract.marketCode) continue;
          
          for (const token of tokens) {
            if (lowerLine.includes(token)) {
              errors.push(`Market leakage: ${token} (${market} in ${contract.marketCode})`);
              metadata.leakageFound.push(`${token} from ${market}`);
            }
          }
        }
      }
    }
    
    return {
      passed: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: metadata.leakageFound.length > 0 ? [
        `Found ${metadata.leakageFound.length} potential market leakage issues`
      ] : undefined,
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
    const metadata: Record<string, any> = {
      brandMode: contract.brandMode,
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
    
    if (contract.brandMode === 'EXPLICIT') {
      const lastBeat = beats[beats.length - 1];
      const hasBrand = this.beatContainsBrand(lastBeat, contract.brandName!);
      
      if (!hasBrand) {
        errors.push(`Brand not found in last beat for EXPLICIT mode`);
      } else {
        metadata.brandFoundInBeats.push(beats.length);
      }
    }
    
    return {
      passed: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      metadata,
    };
  }
  
  /**
   * Validate brand is removable
   */
  private validateBrandIsRemovable(beats: MicroStoryBeat[], contract: XOContract): ValidationResult {
    const storyWithoutBrand = beats.slice(0, -1);
    const hasMeaning = this.hasMeaningfulContent(storyWithoutBrand);
    
    return {
      passed: hasMeaning,
      errors: hasMeaning ? undefined : ['Story lacks meaning without brand beat'],
      metadata: {
        removable: hasMeaning,
        beatsWithoutBrand: storyWithoutBrand.length,
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
 * Extract nouns from beats
 */
private extractNounsFromBeats(beats: MicroStoryBeat[]): string[] {
  const nouns: string[] = [];
  const excludedWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  
  beats.forEach(beat => {
    beat.lines.forEach(line => {
      const words = line.toLowerCase().split(/\W+/).filter(word => 
        word.length > 2 && 
        !excludedWords.includes(word) &&
        !this.isCommonVerb(word)
      );
      
      words.forEach(word => {
        if (this.looksLikeNoun(word)) {
          nouns.push(word);
        }
      });
    });
  });
  
  // Remove duplicates using Set and spread properly
  const uniqueNouns = Array.from(new Set(nouns));
  return uniqueNouns;
}
  
  /**
   * Check if word looks like a noun
   */
  private looksLikeNoun(word: string): boolean {
    const nounEndings = ['tion', 'ment', 'ness', 'ity', 'ance', 'ence', 'er', 'or', 'ist'];
    return nounEndings.some(ending => word.endsWith(ending)) || word.length >= 4;
  }
  
  /**
   * Check if word is a common verb
   */
  private isCommonVerb(word: string): boolean {
    const commonVerbs = [
      'is', 'was', 'are', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'done',
      'make', 'makes', 'made', 'take', 'takes', 'took', 'taken',
      'go', 'goes', 'went', 'gone', 'see', 'saw', 'seen',
      'get', 'gets', 'got', 'gotten', 'know', 'knows', 'knew', 'known',
    ];
    return commonVerbs.includes(word);
  }
  
  /**
   * Check if word is common/abstract
   */
  private isCommonWord(word: string): boolean {
    const commonWords = [
      'thing', 'something', 'nothing', 'everything', 'anything',
      'way', 'time', 'year', 'day', 'week', 'month', 'life', 'world',
      'work', 'system', 'part', 'number', 'fact', 'point', 'area',
      'level', 'case', 'end', 'place', 'state', 'hand', 'person',
      'eye', 'woman', 'man', 'child', 'family', 'friend', 'people',
    ];
    return commonWords.includes(word);
  }
  
  /**
   * Check if noun is a scene description noun
   */
  private isSceneDescriptionNoun(noun: string): boolean {
    const sceneNouns = [
      'light', 'dark', 'shadow', 'shine', 'glow', 'bright',
      'room', 'space', 'area', 'corner', 'wall', 'floor', 'ceiling',
      'air', 'atmosphere', 'mood', 'feeling', 'sense',
      'quiet', 'silence', 'sound', 'noise', 'echo',
    ];
    return sceneNouns.includes(noun.toLowerCase());
  }
  
  /**
   * Find all inventions in a line
   */
  private findAllInventions(line: string, allowedNouns: string[]): string[] {
    const inventions: string[] = [];
    const words = line.toLowerCase().split(/\W+/);
    
    for (const word of words) {
      if (word.length < 3 || this.isCommonWord(word)) continue;
      
      const isAllowed = allowedNouns.some(noun => 
        noun.toLowerCase().includes(word) || word.includes(noun.toLowerCase())
      );
      
      if (!isAllowed) {
        inventions.push(word);
      }
    }
    
    return inventions;
  }
  
  /**
   * Find non-scene inventions
   */
  private findNonSceneInventions(line: string, allowedNouns: string[]): string[] {
    const inventions: string[] = [];
    const words = line.toLowerCase().split(/\W+/);
    const nonSceneInventions = [
      'weather', 'rain', 'sun', 'cloud', 'storm',
      'time', 'morning', 'evening', 'night',
      'character', 'person', 'man', 'woman',
    ];
    
    for (const word of words) {
      if (word.length < 3) continue;
      
      const isNonScene = nonSceneInventions.some(invention => 
        invention.includes(word) || word.includes(invention)
      );
      
      const isAllowed = allowedNouns.some(noun => 
        noun.toLowerCase().includes(word) || word.includes(noun.toLowerCase())
      );
      
      if (isNonScene && !isAllowed) {
        inventions.push(word);
      }
    }
    
    return inventions;
  }
  
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
    
    if (lowerBrand.includes('washing') || lowerBrand.includes('laundry')) {
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
    
    return Array.from(new Set(keywords));
  }
  
  /**
   * Check if story has meaningful content
   */
  private hasMeaningfulContent(beats: MicroStoryBeat[]): boolean {
    if (beats.length === 0) return false;
    
    let totalWords = 0;
    for (const beat of beats) {
      for (const line of beat.lines) {
        totalWords += line.trim().split(/\s+/).length;
      }
    }
    
    return totalWords >= 10;
  }
  
  /**
   * Check for cultural references
   */
  private containsCulturalReference(line: string): boolean {
    const culturalTerms = [
      'cultural', 'traditional', 'local', 'native', 'ethnic',
      'heritage', 'custom', 'ritual', 'ceremony',
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
      'street', 'road', 'avenue', 'boulevard',
      'mountain', 'river', 'lake', 'ocean',
    ];
    const lowerLine = line.toLowerCase();
    return locationTerms.some(term => lowerLine.includes(term));
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
        e.includes('Invention found') ||
        e.includes('Brand found in beat') && e.includes('should only be in last beat')
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
      e.includes('Invention found')
    )) {
      return false;
    }
    
    if (validationResult.errors?.some(e => e.includes('Market leakage'))) {
      return false;
    }
    
    return true;
  }
}

export default XOValidator;