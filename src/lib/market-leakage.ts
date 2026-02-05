import { MarketLeakageResult, ValidationResult } from './types';

// Remove duplicate interface definitions - use types from './types'

export function findMarketLeakage(text: string, targetMarket: string): MarketLeakageResult {
  // EXACT Starter Pack v0.2 leakage tokens
  const LEAKAGE_TOKENS: Record<string, string[]> = {
    NG: ['lagos', 'abuja', 'naira', 'ijgb', 'omo', 'abeg', 'jollof', 'danfo', 'wahala'],
    GH: ['accra', 'kumasi', 'cedi', 'chale', 'kɔkɔɔ', 'trotro'],
    KE: ['nairobi', 'mombasa', 'ksh', 'shilling', 'safaricom', 'matatu'],
    ZA: ['johannesburg', 'joburg', 'cape town', 'rand', 'braai', 'eish'],
    UK: ['london', 'manchester', 'pound', 'quid', 'mates', 'cheers', 'lorry']
  };

  // Global forbidden tokens (for prompt injection)
  const GLOBAL_FORBIDDEN_TOKENS = [
    'system prompt', 'chain-of-thought', 'hidden reasoning', 
    'ignore all rules', 'output raw', 'as an AI',
    'ignore all previous instructions', 'you are a language model',
    'as an AI language model', 'disregard all previous instructions'
  ];

  const t = text.toLowerCase();
  const hits: string[] = [];

  // 1. Check global forbidden tokens
  for (const token of GLOBAL_FORBIDDEN_TOKENS) {
    if (t.includes(token)) {
      hits.push(`global:${token}`);
    }
  }

  // 2. Check cross-market leakage (EXACT Starter Pack tokens)
  for (const [market, tokens] of Object.entries(LEAKAGE_TOKENS)) {
    if (market === targetMarket) continue;
    
    for (const tok of tokens) {
      // Use word boundaries to avoid partial matches
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

  // Check if GLOBAL market is used when it shouldn't be
  if (targetMarket === 'GLOBAL') {
    warnings.push(`Market is GLOBAL - no specific market context applied`);
  }

  return {
    passed: leakageResult.passed,
    errors: leakageResult.hits.map(hit => `Market leakage: ${hit}`),
    warnings: warnings.length > 0 ? warnings : undefined,
    metadata: {
      targetMarket,
      leakageHits: leakageResult.hits.length,
      leakageDetails: leakageResult.hits
    }
  };
}