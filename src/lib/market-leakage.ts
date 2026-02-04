import { MarketLeakageResult, ValidationResult } from './types';

// Remove duplicate interface definitions - use types from './types'

export function findMarketLeakage(text: string, targetMarket: string): MarketLeakageResult {
  const LEAKAGE_TOKENS: Record<string, string[]> = {
    NG: ['lagos', 'abuja', 'naira', 'ijgb', 'omo', 'abeg', 'jollof', 'danfo', 'wahala'],
    GH: ['accra', 'kumasi', 'cedi', 'chale', 'kɔkɔɔ', 'trotro'],
    KE: ['nairobi', 'mombasa', 'ksh', 'shilling', 'safaricom', 'matatu'],
    ZA: ['johannesburg', 'joburg', 'cape town', 'rand', 'braai', 'eish'],
    UK: ['london', 'manchester', 'pound', 'quid', 'mates', 'cheers', 'lorry']
  };

  const GLOBAL_FORBIDDEN_TOKENS = [
    'system prompt', 'chain-of-thought', 'hidden reasoning', 'ignore all rules', 'output raw', 'as an AI'
  ];

  const t = text.toLowerCase();
  const hits: string[] = [];

  // Check global forbidden tokens
  for (const token of GLOBAL_FORBIDDEN_TOKENS) {
    if (t.includes(token)) {
      hits.push(`global:${token}`);
    }
  }

  // Check cross-market leakage
  for (const [market, tokens] of Object.entries(LEAKAGE_TOKENS)) {
    if (market === targetMarket) continue;
    
    for (const tok of tokens) {
      const regex = new RegExp(`\\b${tok}\\b`, 'i');
      if (regex.test(t)) {
        hits.push(`${market}:${tok}`);
      }
    }
  }

  return {
    passed: hits.length === 0,
    hits
  };
}

export function validateMarketContext(
  text: string, 
  targetMarket: string, 
  sourceMarket?: string
): ValidationResult {
  const leakageResult = findMarketLeakage(text, targetMarket);
  
  const warnings: string[] = [];
  if (sourceMarket && sourceMarket !== targetMarket) {
    warnings.push(`Source market (${sourceMarket}) differs from target market (${targetMarket})`);
  }

  return {
    passed: leakageResult.passed,
    errors: leakageResult.hits.map(hit => `Market leakage: ${hit}`),
    warnings: warnings.length > 0 ? warnings : undefined,
    metadata: {
      targetMarket,
      leakageHits: leakageResult.hits.length
    }
  };
}