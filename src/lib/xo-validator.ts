/**
 * XO VALIDATOR v2.0
 * Philosophy-first validation with contract enforcement
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
    
    // 2. Validate no invention (if enabled)
    if (this.options.validateInvention && contract.failOnInvention) {
      results.push(this.validateNoInvention(beats, contract));
    }
    
    // 3. Validate market leakage (if enabled)
    if (this.options.validateMarketLeakage && contract.failOnMarketLeakage) {
      results.push(this.validateMarketLeakage(beats, contract));
    }
    
    // 4. Validate brand placement (if enabled)
    if (this.options.validateBrandPlacement && contract.failOnBrandBeforeMeaning) {
      results.push(this.validateBrandPlacement(beats, contract));
    }
    
    // 5. Validate brand is removable
    if (contract.brandMode !== 'NONE') {
      results.push(this.validateBrandIsRemovable(beats, contract));
    }
    
    // 6. Validate market restraint
    if (contract.marketState === 'NEUTRAL') {
      results.push(this.validateMarketRestraint(beats, contract));
    }
    
    // Combine results
    return this.combineResults(results);
  }
  
  /**
   * Validate beats (for individual passes)
   */
  async validateBeats(beats: MicroStoryBeat[], contract: XOContract): Promise<ValidationResult> {
    const results: ValidationResult[] = [];
    
    // Basic structure validation
    results.push(this.validateBeatsStructure(beats, contract));
    
    // Quick invention check
    if (contract.failOnInvention) {
      results.push(this.validateNoInvention(beats, contract));
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
    };
    
    // Check beat count
    if (beats.length > contract.maxBeats) {
      errors.push(`Too many beats: ${beats.length} > ${contract.maxBeats}`);
    } else if (beats.length < Math.min(2, contract.maxBeats)) {
      warnings.push(`Few beats: ${beats.length} (minimum 2 recommended)`);
    }
    
    // Check each beat
    beats.forEach((beat, index) => {
      // Check lines per beat
      if (beat.lines.length > contract.maxLinesPerBeat) {
        errors.push(`Beat ${index + 1} has too many lines: ${beat.lines.length} > ${contract.maxLinesPerBeat}`);
      }
      
      // Check words per line
      beat.lines.forEach((line, lineIndex) => {
        const wordCount = line.trim().split(/\s+/).length;
        if (wordCount > contract.maxWordsPerLine) {
          errors.push(`Beat ${index + 1}, line ${lineIndex + 1} too long: ${wordCount} > ${contract.maxWordsPerLine} words`);
        }
        if (wordCount < 2) {
          warnings.push(`Beat ${index + 1}, line ${lineIndex + 1} very short: ${wordCount} words`);
        }
      });
      
      // Check for empty beats
      if (beat.lines.length === 0) {
        errors.push(`Beat ${index + 1} has no lines`);
      }
    });
    
    return {
      passed: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata,
    };
  }
  
  /**
   * Validate no invention (PHILOSOPHY TEST)
   */
  private validateNoInvention(beats: MicroStoryBeat[], contract: XOContract): ValidationResult {
    const errors: string[] = [];
    const metadata: Record<string, any> = {
      allowedNouns: contract.context.allowedNouns,
      inventionsFound: [],
    };
    
    // Skip if invention is allowed
    if (contract.allowInvention === 'SCENE_ONLY') {
      // Only validate non-scene invention
      for (const beat of beats) {
        for (const line of beat.lines) {
          const inventions = this.findNonSceneInventions(line, contract.context.allowedNouns);
          if (inventions.length > 0) {
            errors.push(`Non-scene invention found: ${inventions.join(', ')}`);
            metadata.inventionsFound.push(...inventions);
          }
        }
      }
    } else {
      // No invention allowed at all
      for (const beat of beats) {
        for (const line of beat.lines) {
          const inventions = this.findAllInventions(line, contract.context.allowedNouns);
          if (inventions.length > 0) {
            errors.push(`Invention found: ${inventions.join(', ')}`);
            metadata.inventionsFound.push(...inventions);
          }
        }
      }
    }
    
    return {
      passed: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      metadata,
    };
  }
  
  /**
   * Validate market leakage
   */
  private validateMarketLeakage(beats: MicroStoryBeat[], contract: XOContract): ValidationResult {
    const errors: string[] = [];
    const metadata: Record<string, any> = {
      marketState: contract.marketState,
      leakageFound: [],
    };
    
    // If market is resolved, allow cultural context
    if (contract.marketState === 'RESOLVED') {
      return {
        passed: true,
        metadata,
      };
    }
    
    // Market leakage tokens (from Starter Pack)
    const LEAKAGE_TOKENS: Record<string, string[]> = {
      NG: ['lagos', 'abuja', 'naira', 'ijgb', 'omo', 'abeg', 'jollof', 'danfo', 'wahala'],
      GH: ['accra', 'kumasi', 'cedi', 'chale', 'kɔkɔɔ', 'trotro'],
      KE: ['nairobi', 'mombasa', 'ksh', 'shilling', 'safaricom', 'matatu'],
      ZA: ['johannesburg', 'joburg', 'cape town', 'rand', 'braai', 'eish'],
      UK: ['london', 'manchester', 'pound', 'quid', 'mates', 'cheers', 'lorry'],
    };
    
    // Check each beat
    for (const beat of beats) {
      for (const line of beat.lines) {
        const lowerLine = line.toLowerCase();
        
        // Check for leakage from other markets
        for (const [market, tokens] of Object.entries(LEAKAGE_TOKENS)) {
          if (market === contract.marketCode) continue;
          
          for (const token of tokens) {
            if (lowerLine.includes(token)) {
              errors.push(`Market leakage: ${token} (${market} in ${contract.marketCode})`);
              metadata.leakageFound.push(`${token} from ${market}`);
            }
          }
        }
        
        // Check for forced localization
        if (contract.marketState === 'NEUTRAL') {
          // Look for cultural props, slang, etc.
          const culturalMarkers = [
            /(local|traditional|native|ethnic|cultural)\s+\w+/i,
            /\b(dis|dat|ting|bru|eya|sha)\b/i, // Common slang patterns
          ];
          
          for (const pattern of culturalMarkers) {
            if (pattern.test(line)) {
              errors.push(`Forced localization in neutral market: "${line.substring(0, 30)}..."`);
              metadata.leakageFound.push('forced localization');
            }
          }
        }
      }
    }
    
    return {
      passed: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      metadata,
    };
  }
  
  /**
   * Validate brand placement (PHILOSOPHY TEST)
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
    
    // Brand should only be in the last beat
    for (let i = 0; i < beats.length - 1; i++) {
      const beat = beats[i];
      const hasBrand = this.beatContainsBrand(beat, contract.brandName!);
      
      if (hasBrand) {
        errors.push(`Brand found in beat ${i + 1}, should only be in last beat`);
        metadata.brandFoundInBeats.push(i + 1);
      }
    }
    
    // Brand should be in the last beat (for EXPLICIT mode)
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
   * Validate brand is removable (PHILOSOPHY TEST)
   */
  private validateBrandIsRemovable(beats: MicroStoryBeat[], contract: XOContract): ValidationResult {
    // Test: Remove last beat and see if story still works
    const storyWithoutBrand = beats.slice(0, -1);
    
    // Check if story has meaningful content without brand
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
    };
    
    // If confidence is low, market should be neutral
    if (contract.marketConfidence < 0.75 && contract.marketState !== 'NEUTRAL') {
      warnings.push(`Market confidence low (${contract.marketConfidence}) but state is ${contract.marketState}`);
    }
    
    // Check for neutral violations
    const neutralViolations: string[] = [];
    
    for (const beat of beats) {
      for (const line of beat.lines) {
        // Check for specific cultural references
        if (this.containsCulturalReference(line)) {
          neutralViolations.push(`Cultural reference: "${line.substring(0, 30)}..."`);
        }
        
        // Check for location specifics
        if (this.containsLocationSpecific(line)) {
          neutralViolations.push(`Location specific: "${line.substring(0, 30)}..."`);
        }
      }
    }
    
    if (neutralViolations.length > 0) {
      warnings.push(`Neutral market violations: ${neutralViolations.length} found`);
      metadata.neutralViolations = neutralViolations;
    }
    
    return {
      passed: true, // Warnings only for this check
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata,
    };
  }
  
  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================
  
  /**
   * Find all inventions in a line
   */
  private findAllInventions(line: string, allowedNouns: string[]): string[] {
    const inventions: string[] = [];
    const words = line.toLowerCase().split(/\W+/);
    
    // Common invented elements to check for
    const commonInventions = [
      'weather', 'rain', 'sun', 'cloud', 'storm', // Weather
      'time', 'morning', 'evening', 'night', 'today', // Time
      'character', 'person', 'man', 'woman', 'they', // Characters
      'place', 'location', 'city', 'town', // Locations
    ];
    
    for (const word of words) {
      if (word.length < 3) continue;
      
      // Check if word is an invention
      const isAllowed = allowedNouns.some(noun => 
        noun.toLowerCase().includes(word) || word.includes(noun.toLowerCase())
      );
      
      const isCommonInvention = commonInventions.some(invention => 
        invention.includes(word) || word.includes(invention)
      );
      
      if (!isAllowed && isCommonInvention) {
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
    
    // Non-scene inventions (not allowed even in SCENE_ONLY mode)
    const nonSceneInventions = [
      'weather', 'rain', 'sun', 'cloud', 'storm', // Weather
      'time', 'morning', 'evening', 'night', // Time
      'character', 'person', 'man', 'woman', // Characters (unless in input)
    ];
    
    for (const word of words) {
      if (word.length < 3) continue;
      
      // Check if word is a non-scene invention
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
      
      // Check for brand keywords
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
    
    // Add related keywords based on brand type
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
    
    // At least 10 words total for meaningful content
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
    
    // Determine if passed
    let passed = true;
    
    // Fail on any error in strict mode
    if (this.options.strictMode && allErrors.length > 0) {
      passed = false;
    }
    
    // Fail on warnings if configured
    if (this.options.failOnWarning && allWarnings.length > 0) {
      passed = false;
    }
    
    // If not strict, only fail on critical errors
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
    
    // Check for philosophy test failures
    if (validationResult.errors?.some(e => 
      e.includes('lacks meaning without brand') ||
      e.includes('Brand found in beat') ||
      e.includes('Invention found')
    )) {
      return false;
    }
    
    // Check for market leakage in neutral mode
    if (validationResult.errors?.some(e => e.includes('Market leakage'))) {
      return false;
    }
    
    // All checks passed
    return true;
  }
}

export default XOValidator;