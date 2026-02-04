import { ValidationResult, ToneScore } from './types';

interface ToneMarkers {
  [key: string]: RegExp[];
}

const TONE_MARKERS: ToneMarkers = {
  PLAYFUL: [
    /\b😂\b/,
    /\bbanter\b/i,
    /\bno way\b/i,
    /\blol\b/i,
    /\bcheeky\b/i,
    /\bwink\b/i,
    /\bjoking\b/i,
    /\blighthearted\b/i
  ],
  SERIOUS: [
    /\btherefore\b/i,
    /\bhowever\b/i,
    /\bconsequently\b/i,
    /\brisk\b/i,
    /\bsignificant\b/i,
    /\bimportant\b/i,
    /\bcritical\b/i
  ],
  PREMIUM: [
    /\bcrafted\b/i,
    /\brefined\b/i,
    /\bprecision\b/i,
    /\belevate\b/i,
    /\bexclusive\b/i,
    /\bpremium\b/i,
    /\bsophisticated\b/i
  ],
  GRASSROOTS: [
    /\beveryday\b/i,
    /\bon the street\b/i,
    /\bcommunity\b/i,
    /\bpeople\b/i,
    /\bgrassroots\b/i,
    /\bordinary\b/i,
    /\breal people\b/i
  ]
};

export function calculateToneScore(text: string, expected?: string): ToneScore {
  const t = text.toLowerCase();
  const scores: Record<string, number> = {};
  
  // Count markers for each tone
  for (const [tone, patterns] of Object.entries(TONE_MARKERS)) {
    let count = 0;
    for (const pattern of patterns) {
      const matches = t.match(pattern);
      if (matches) {
        count += matches.length;
      }
    }
    scores[tone] = count;
  }
  
  // Determine observed tone
  let observed = 'NEUTRAL';
  let maxScore = 0;
  
  for (const [tone, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      observed = tone;
    }
  }
  
  // Calculate score relative to expected tone
  let score = 0;
  if (expected) {
    const expectedScore = scores[expected] || 0;
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    score = totalScore > 0 ? expectedScore / totalScore : 0;
  }
  
  return {
    observed,
    score,
    details: scores
  };
}

export function validateTone(
  text: string, 
  expected?: string,
  threshold: number = 0.2
): ValidationResult {
  const toneScore = calculateToneScore(text, expected);
  
  const passed = expected ? toneScore.score >= threshold : true;
  
  return {
    passed,
    warnings: expected && toneScore.observed !== expected 
      ? [`Expected tone "${expected}", observed "${toneScore.observed}"`] 
      : undefined,
    metadata: {
      expected,
      observed: toneScore.observed,
      score: toneScore.score,
      toneDetails: toneScore.details
    }
  };
}