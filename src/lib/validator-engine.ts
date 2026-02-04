import {
  validateMarketContext,
  validateStructure,
  validateTone,
  validateInputPayload,
  validateOutputFormat,
  ValidationContext,
  ValidationResult,
  Market,
  EntryPath
} from './index';

export interface XOValidationOptions {
  // Validation flags
  validateMarketLeakage: boolean;
  validateStructure: boolean;
  validateTone: boolean;
  validateSchema: boolean;
  
  // Thresholds
  toneThreshold: number;
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
  toneThreshold: 0.2,
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
    
    // 4. Combine results
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
    
    // All checks passed
    return true;
  }
}