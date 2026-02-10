/**
 * XO CONTRACT FREEZE v1.0
 * Governance layer to prevent contract drift
 */

import { XOContract, DEFAULT_XO_CONTRACT } from './xo-contract';

// ============================================================================
// FROZEN CONTRACT INTERFACE
// ============================================================================

/**
 * FROZEN CONTRACT v1.0
 * This interface is immutable - no new fields without major version change
 */
export interface FrozenXOContract extends XOContract {
  // No additional fields - this is the point
  // Any changes require:
  // 1. Review by architecture committee
  // 2. Version bump to v2.0
  // 3. Migration path for existing stories
}

// ============================================================================
// CONTRACT GOVERNANCE
// ============================================================================

export class ContractGovernance {
  private static readonly APPROVED_FIELDS = new Set([
    // Core Configuration
    'entryPath',
    'marketCode',
    'marketState',
    'marketConfidence',
    
    // Brand Configuration
    'brandMode',
    'brandName',
    
    // Content Constraints
    'allowInvention',
    'maxBeats',
    'maxLinesPerBeat',
    'maxWordsPerLine',
    
    // Format & Structure
    'formatMode',
    'requirePathMarkers',
    'requireStorySections',
    
    // Validation Rules
    'strictMode',
    'failOnInvention',
    'failOnMarketLeakage',
    'failOnBrandBeforeMeaning',
    
    // Context
    'context',
  ]);
  
  private static readonly REQUIRED_FIELDS = new Set([
    'entryPath',
    'marketCode',
    'maxBeats',
    'maxLinesPerBeat',
    'formatMode',
  ]);
  
  /**
   * Validate contract hasn't been tampered with
   * Throws error if unauthorized changes detected
   */
static validateContractIntegrity(contract: any): FrozenXOContract {
  // Check for missing required fields
  this.REQUIRED_FIELDS.forEach(field => {
    if (!(field in contract)) {
      throw new ContractViolationError(
        `Missing required field: ${field}`,
        'REQUIRED_FIELD_MISSING'
      );
    }
  });
  
  // Check for unauthorized fields
  const contractKeys = Object.keys(contract);
  contractKeys.forEach(key => {
    if (!this.APPROVED_FIELDS.has(key)) {
      throw new ContractViolationError(
        `Unauthorized field in contract: ${key}`,
        'UNAUTHORIZED_FIELD'
      );
    }
  });
  
  // Validate field types
  this.validateFieldTypes(contract);
  
  return contract as FrozenXOContract;
}

  
  /**
   * Create a read-only proxy to prevent runtime modifications
   */
  static createImmutableContract(contract: XOContract): FrozenXOContract {
    const validated = this.validateContractIntegrity(contract);
    
    return new Proxy(validated, {
      set(target, prop, value) {
        throw new ContractViolationError(
          `Cannot modify contract field: ${String(prop)}`,
          'IMMUTABLE_CONTRACT'
        );
      },
      
      deleteProperty(target, prop) {
        throw new ContractViolationError(
          `Cannot delete contract field: ${String(prop)}`,
          'IMMUTABLE_CONTRACT'
        );
      },
      
      defineProperty(target, prop, descriptor) {
        throw new ContractViolationError(
          `Cannot define new contract property: ${String(prop)}`,
          'IMMUTABLE_CONTRACT'
        );
      },
    });
  }
  
  /**
   * Create a new contract version (major change only)
   */
  static createVersion(
    version: '2.0',
    changes: { added?: string[]; removed?: string[]; modified?: string[] }
  ): void {
    console.warn(`⚠️  MAJOR CONTRACT CHANGE: v${version}`);
    console.warn('Changes:', changes);
    console.warn('This requires:');
    console.warn('1. Architecture committee review ✓');
    console.warn('2. Migration path for existing stories ✓');
    console.warn('3. Update of all validators and tests ✓');
    
    // In real implementation, this would trigger code review workflow
    throw new ContractViolationError(
      `Contract version ${version} requires formal approval process`,
      'MAJOR_VERSION_CHANGE'
    );
  }
  
  private static validateFieldTypes(contract: any): void {
    // Type validation would go here
    // This ensures no one changes a string field to number, etc.
    
    if (typeof contract.maxBeats !== 'number') {
      throw new ContractViolationError(
        'maxBeats must be a number',
        'TYPE_VIOLATION'
      );
    }
    
    if (contract.marketConfidence < 0 || contract.marketConfidence > 1) {
      throw new ContractViolationError(
        'marketConfidence must be between 0 and 1',
        'VALUE_VIOLATION'
      );
    }
    
    // Add more type validations as needed
  }
}

// ============================================================================
// ERRORS
// ============================================================================

export class ContractViolationError extends Error {
  constructor(
    message: string,
    public readonly code: 
      | 'UNAUTHORIZED_FIELD'
      | 'REQUIRED_FIELD_MISSING'
      | 'TYPE_VIOLATION'
      | 'VALUE_VIOLATION'
      | 'IMMUTABLE_CONTRACT'
      | 'MAJOR_VERSION_CHANGE'
  ) {
    super(`CONTRACT VIOLATION [${code}]: ${message}`);
    this.name = 'ContractViolationError';
  }
}

// ============================================================================
// USAGE IN CODEBASE
// ============================================================================

/**
 * Example of how to use the frozen contract throughout the codebase:
 * 
 * 1. In narrative-engine.ts:
 * 
 * const frozenContract = ContractGovernance.createImmutableContract(contract);
 * 
 * 2. In validator.ts:
 * 
 * validateStory(story: { contract: FrozenXOContract, ... }) { ... }
 * 
 * 3. Any attempt to modify will throw:
 * 
 * frozenContract.maxBeats = 10; // ❌ Throws ContractViolationError
 * frozenContract.newField = 'value'; // ❌ Throws ContractViolationError
 */