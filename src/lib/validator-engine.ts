import { ValidationContext, ValidationResult, Market, EntryPath } from './types';
// Import from individual modules instead
import { findMarketLeakage, validateMarketContext } from './market-leakage';
import { validateStructure } from './structure';
import { validateTone } from './tone-heuristic';
import { validateInputPayload, validateOutputFormat } from './schema-validate';

export interface XOValidationOptions {
  // Validation flags
  validateMarketLeakage: boolean;
  validateStructure: boolean;
  validateTone: boolean;
  validateSchema: boolean;
  validateBrandPresence: boolean;
  validateLineLength: boolean;
  
  // Thresholds
  toneThreshold: number;
  maxWordsPerLine: number;
  requireStorySections: boolean;
  
  // Strictness
  failOnWarning: boolean;
  failOnMissingMarkers: boolean;
}

export const DEFAULT_VALIDATION_OPTIONS: XOValidationOptions = {
  validateMarketLeakage: true,
  validateStructure: true,
  validateTone: true,
  validateSchema: true,
  validateBrandPresence: true,
  validateLineLength: true,
  toneThreshold: 0.2,
  maxWordsPerLine: 15,
  requireStorySections: false,
  failOnWarning: false,
  failOnMissingMarkers: true
};

export class XOValidator {
  private options: XOValidationOptions;
  
  constructor(options: Partial<XOValidationOptions> = {}) {
    this.options = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  }
  
  async validateOutput(
    text: string,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const results: ValidationResult[] = [];
    
    // 1. Market leakage validation
    if (this.options.validateMarketLeakage) {
      const marketResult = validateMarketContext(text, context.market);
      results.push(marketResult);
    }
    
    // 2. Structure validation
    if (this.options.validateStructure && context.entryPath) {
      const structureResult = validateStructure(
        text, 
        context.entryPath,
        this.options.requireStorySections
      );
      results.push(structureResult);
    }
    
    // 3. Tone validation
    if (this.options.validateTone && context.tone && context.tone !== 'NEUTRAL') {
      const toneResult = validateTone(text, context.tone, this.options.toneThreshold);
      results.push(toneResult);
    }
    
    // 4. Brand presence validation (NEW)
    if (this.options.validateBrandPresence && context.brandName) {
      const brandResult = this.validateBrandPresence(text, context.brandName);
      results.push(brandResult);
    }
    
    // 5. Line length validation (NEW)
    if (this.options.validateLineLength) {
      const lineLengthResult = this.validateLineLength(text);
      results.push(lineLengthResult);
    }
    
    // 6. Combine results
    const passed = this.evaluateResults(results);
    const errors = this.collectErrors(results);
    const warnings = this.collectWarnings(results);
    const metadata = this.collectMetadata(results, context);
    
    return {
      passed,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata
    };
  }
  
  validateInput(payload: any): ValidationResult {
    if (!this.options.validateSchema) {
      return { passed: true };
    }
    
    return validateInputPayload(payload);
  }
  
  validateXOFormat(output: any): ValidationResult {
    if (!this.options.validateSchema) {
      return { passed: true };
    }
    
    return validateOutputFormat(output);
  }
  
  /**
   * Validate brand presence in text
   */
  private validateBrandPresence(text: string, brandName: string): ValidationResult {
    if (!brandName) {
      return { passed: true };
    }
    
    const lowerText = text.toLowerCase();
    const lowerBrand = brandName.toLowerCase();
    
    // Check for brand name directly
    const hasDirectBrand = lowerText.includes(lowerBrand);
    
    // Check for related keywords
    const brandKeywords = this.getBrandKeywords(brandName);
    const hasRelatedKeywords = brandKeywords.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
    
    const passed = hasDirectBrand || hasRelatedKeywords;
    
    return {
      passed,
      errors: !passed ? [`Missing brand context for: ${brandName}`] : undefined,
      warnings: undefined,
      metadata: {
        brandName,
        hasDirectBrand,
        hasRelatedKeywords,
        brandKeywords
      }
    };
  }
  
  /**
   * Get relevant keywords for a brand
   */
  private getBrandKeywords(brandName: string): string[] {
    const lowerBrand = brandName.toLowerCase();
    const keywords = [brandName];
    
    // Add related keywords based on brand type
    if (lowerBrand.includes('washing') || lowerBrand.includes('laundry')) {
      keywords.push('machine', 'wash', 'clean', 'fabric', 'clothes', 'load', 'cycle', 'rinse', 'spin', 'detergent');
    }
    if (lowerBrand.includes('detergent') || lowerBrand.includes('clean')) {
      keywords.push('clean', 'fresh', 'stain', 'suds', 'rinse', 'wash', 'clothes');
    }
    if (lowerBrand.includes('car') || lowerBrand.includes('auto')) {
      keywords.push('drive', 'road', 'engine', 'wheel', 'journey', 'travel', 'vehicle');
    }
    if (lowerBrand.includes('bank') || lowerBrand.includes('financial')) {
      keywords.push('money', 'secure', 'account', 'save', 'transaction', 'financial', 'wealth');
    }
    if (lowerBrand.includes('phone') || lowerBrand.includes('mobile')) {
      keywords.push('call', 'connect', 'battery', 'screen', 'app', 'message');
    }
    
    // Remove duplicates using a Set but convert back to array properly
    const uniqueKeywords: string[] = [];
    const seen = new Set<string>();
    
    keywords.forEach(keyword => {
      if (!seen.has(keyword.toLowerCase())) {
        seen.add(keyword.toLowerCase());
        uniqueKeywords.push(keyword);
      }
    });
    
    return uniqueKeywords;
  }
  
  /**
   * Validate line length in text
   */
  private validateLineLength(text: string): ValidationResult {
    const lines = text.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.endsWith(':'); // Exclude marker lines
    });
    
    const tooLongLines: { line: string; wordCount: number }[] = [];
    
    lines.forEach(line => {
      const wordCount = line.trim().split(/\s+/).length;
      if (wordCount > this.options.maxWordsPerLine) {
        tooLongLines.push({
          line: line.length > 50 ? line.substring(0, 50) + '...' : line,
          wordCount
        });
      }
    });
    
    const passed = tooLongLines.length === 0;
    
    return {
      passed,
      errors: !passed ? [
        `Lines exceed maximum length (${this.options.maxWordsPerLine} words max):`,
        ...tooLongLines.map(tl => `- ${tl.wordCount} words: "${tl.line}"`)
      ] : undefined,
      warnings: undefined,
      metadata: {
        totalLines: lines.length,
        tooLongLines: tooLongLines.length,
        maxWordsPerLine: this.options.maxWordsPerLine
      }
    };
  }
  
  private evaluateResults(results: ValidationResult[]): boolean {
    // Check for failures
    const hasFailures = results.some(r => !r.passed);
    if (hasFailures) return false;
    
    // Check for warnings if we're strict
    if (this.options.failOnWarning) {
      const hasWarnings = results.some(r => r.warnings && r.warnings.length > 0);
      if (hasWarnings) return false;
    }
    
    return true;
  }
  
  private collectErrors(results: ValidationResult[]): string[] {
    return results.flatMap(r => r.errors || []);
  }
  
  private collectWarnings(results: ValidationResult[]): string[] {
    return results.flatMap(r => r.warnings || []);
  }
  
  private collectMetadata(results: ValidationResult[], context: ValidationContext): Record<string, any> {
    const metadata: Record<string, any> = {
      context,
      timestamp: new Date().toISOString(),
      validationCount: results.length
    };
    
    // Collect metadata from each result
    results.forEach((result, index) => {
      if (result.metadata) {
        metadata[`validation_${index}`] = result.metadata;
      }
    });
    
    return metadata;
  }
  
  // CI/CD gate check
  shouldShip(validationResult: ValidationResult): boolean {
    if (!validationResult.passed) return false;
    
    // Additional CI checks
    if (this.options.failOnWarning && validationResult.warnings && validationResult.warnings.length > 0) {
      return false;
    }
    
    // Ensure market context is present
    const market = validationResult.metadata?.context?.market;
    if (!market || market === 'GLOBAL') {
      // Global is allowed, but we might want stricter checks
      return true;
    }
    
    // Check brand presence if required
    const brandName = validationResult.metadata?.context?.brandName;
    if (brandName && this.options.validateBrandPresence) {
      const brandValidation = validationResult.metadata?.validation_3; // Brand validation is 4th
      if (brandValidation && !brandValidation.hasDirectBrand && !brandValidation.hasRelatedKeywords) {
        return false;
      }
    }
    
    // All checks passed
    return true;
  }
}