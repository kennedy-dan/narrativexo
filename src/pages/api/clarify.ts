import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ============================================================================
// TYPES
// ============================================================================

export type MeaningRisk = 
  | 'emotion-distortion'
  | 'intent-misinterpretation'
  | 'context-assumption'
  | 'tension-overlook'
  | 'literal-vs-metaphor'
  | 'irony-missed'
  | 'positive-negative-ambiguity'
  | 'insufficient-context'
  | 'possible-gibberish'
  | 'setup-without-substance';

export interface MeaningRiskAssessment {
  risks: MeaningRisk[];
  riskLevel: 'low' | 'medium' | 'high';
  distortionLikelihood: number;
  specificDoubt: string;
  confidentInterpretation: string;
  hypothesis?: string;
}

export interface MeaningContract {
  interpretedMeaning: {
    emotionalState: 'positive' | 'negative' | 'neutral' | 'layered' | 'complex' | 'ambiguous';
    emotionalDirection: 'inward' | 'outward' | 'observational' | 'relational' | 'unknown';
    narrativeTension: string;
    intentCategory: 'share' | 'inquire' | 'emphasize' | 'reflect' | 'process' | 'express' | 'connect';
    coreTheme: string;
  };
  marketContext: {
    market: 'NG' | 'GH' | 'KE' | 'ZA' | 'UK' | 'GLOBAL';
    language: string;
    register: 'formal' | 'casual' | 'colloquial';
  };
  entryPath: 'emotion' | 'scene' | 'seed' | 'audience';
  confidence: number;
  certaintyMode: 'tentative-commit' | 'reflection-only' | 'clarification-needed';
  reversible: boolean;
  safeToNarrate: boolean;
  understandingSummary?: string;
  provenance: {
    source: 'ccn-interpretation';
    riskLevel: 'low' | 'medium' | 'high';
    distortionLikelihood: number;
    risksAcknowledged: MeaningRisk[];
  };
  seedMoment: string;
}

export interface XOInterpretation {
  coreTension: string;
  emotionalWeight: string;
  seedMoment: string;
  intentSummary: string;
  clearPoints: string[];
  doubtfulPoints: string[];
  riskAssessment: MeaningRiskAssessment;
  confidence: number;
  minimalAssumptions: {
    emotionDirection: 'positive' | 'negative' | 'neutral' | 'layered' | 'unknown';
    tensionType: 'contrast' | 'desire' | 'observation' | 'reflection' | 'unknown';
    intentCategory: 'share' | 'inquire' | 'emphasize' | 'reflect' | 'express' | 'unknown';
  };
  meaningContract?: MeaningContract;
}

export interface XOCCNResponse {
  success: boolean;
  interpretation: XOInterpretation;
  needsClarification: boolean;
  clarification?: {
    hypothesis: string;
    correctionInvitation: string;
    unclearElement: string;
  };
  understandingPreview: string;
  understandingSummary?: string;
  error?: string;
}

// ============================================================================
// CONTEXT DETECTION - CRITICAL FIX
// ============================================================================

function hasSubstantiveContent(text: string): boolean {
  const lower = text.toLowerCase();
  
  // Check for quoted speech
  if (/["'"].*?["'']/.test(text)) return true;
  
  // Check for complete thoughts with emotion/action
  const substantivePatterns = [
    // Emotions
    /\b(feel|felt|feeling|emotion|happy|sad|angry|excited|relief|anxiety|joy|calm|frustrated|proud|grateful|delighted|hurt|disappointed|annoyed|upset|cynical|cold|breaks|down)\b/i,
    
    // Specific requests
    /\b(create|tell|write|make|build|generate|craft)\b.*?\b(story|narrative|brand|script|video)\b/i,
    
    // Complete quotes
    /:.*?["'].*?["']|:.*?\b(the world is|it is|this is|that is)\b/i,
    
    // Specific observations
    /\b(reaction|responded|answered|said|told|asked|replied)\b.*?\b(was|were|is|are)\b/i,
    
    // Brand/creative context
    /\b(brand|company|product|marketing|campaign|advert|washing machine)\b.*?\b(story|narrative|attract|appeal)\b/i
  ];
  
  for (const pattern of substantivePatterns) {
    if (pattern.test(text)) return true;
  }
  
  return false;
}

function detectLackingContext(text: string): { 
  lacksContext: boolean; 
  reason?: string;
  wordCount: number;
  isPureSetup: boolean;
} {
  const original = text;
  const lower = text.toLowerCase().trim();
  const words = lower.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  let lacksContext = false;
  let reason = '';
  let isPureSetup = false;
  
  // PATTERN 1: Extremely short inputs (1-2 words)
  if (wordCount <= 2) {
    lacksContext = true;
    isPureSetup = true;
    reason = `too brief (${wordCount} words) - no interpretable meaning`;
    return { lacksContext, reason, wordCount, isPureSetup };
  }
  
  // PATTERN 2: Scene setup WITHOUT the actual moment
  const sceneSetupPatterns = [
    { pattern: /^overheard at (a|the)?\s*(coffee shop|cafe|bus|train|street|park|bar|restaurant)\s*$/i, weight: 1.0 },
    { pattern: /^heard at (a|the)?\s*(coffee shop|cafe|bus|train|street|park)\s*$/i, weight: 1.0 },
    { pattern: /^at (a|the)?\s*(coffee shop|cafe|bus stop|train station)\s*$/i, weight: 1.0 },
    { pattern: /^in (a|the)?\s*(coffee shop|cafe|lobby|waiting room)\s*$/i, weight: 1.0 },
    { pattern: /^the other day\s*$/i, weight: 0.9 },
    { pattern: /^yesterday\s*$/i, weight: 0.9 },
    { pattern: /^this morning\s*$/i, weight: 0.9 },
    { pattern: /^a conversation (i )?overheard\s*$/i, weight: 1.0 },
    { pattern: /^someone said\s*$/i, weight: 1.0 },
    { pattern: /^this person said\s*$/i, weight: 1.0 }
  ];
  
  for (const { pattern, weight } of sceneSetupPatterns) {
    if (pattern.test(lower)) {
      lacksContext = true;
      isPureSetup = true;
      reason = `scene setup without the actual moment: "${original}"`;
      return { lacksContext, reason, wordCount, isPureSetup };
    }
  }
  
  // PATTERN 3: Incomplete sentences (trailing off)
  const incompletePatterns = [
    /:\s*$/,
    /\-\s*$/,
    /because\s*$/,
    /so\s*$/,
    /then\s*$/,
    /and\s*$/,
    /but\s*$/,
    /when\s*$/,
    /\.\.\.$/
  ];
  
  for (const pattern of incompletePatterns) {
    if (pattern.test(lower)) {
      lacksContext = true;
      isPureSetup = true;
      reason = `incomplete sentence ending with "${original.slice(-5)}"`;
      return { lacksContext, reason, wordCount, isPureSetup };
    }
  }
  
  // PATTERN 4: Setup phrases with minimal words
  if (wordCount <= 5) {
    const pureSetupPhrases = [
      /\boverheard at\b/i,
      /\bsomeone said\b/i,
      /\ba conversation\b/i,
      /\bheard this\b/i,
      /\bthe other day\b/i,
      /\byesterday i\b/i,
      /\bthis morning\b/i,
      /\bwhen i was\b/i
    ];
    
    for (const pattern of pureSetupPhrases) {
      if (pattern.test(lower)) {
        lacksContext = true;
        isPureSetup = true;
        reason = `setup phrase without the actual content: "${original}"`;
        return { lacksContext, reason, wordCount, isPureSetup };
      }
    }
  }
  
  // PATTERN 5: Has setup framing but NO substantive content
  const hasFraming = /overheard|heard|said|told|asked|replied|conversation|yesterday|morning|afternoon|evening|today/i.test(lower);
  
  if (hasFraming && wordCount <= 8) {
    const hasContent = hasSubstantiveContent(original);
    if (!hasContent) {
      lacksContext = true;
      isPureSetup = true;
      reason = `framing without substantive content: "${original}"`;
      return { lacksContext, reason, wordCount, isPureSetup };
    }
  }
  
  // PATTERN 6: Check if this is a COMPLETE meaningful input
  // This is the positive case - what SHOULD pass
  const isCompleteThought = (
    // Has a quote
    /["'].*?["']/.test(original) ||
    // Has a colon with content after
    /:.*\S+/.test(original) ||
    // Has a specific creative request
    /\b(create|make|write|generate|build)\b.*\b(story|narrative|brand|script|video|content)\b/i.test(original) ||
    // Has emotional content
    /\b(feel|felt|emotion|happy|sad|angry|cynical|cold|breaks|down)\b/i.test(original) ||
    // Has a complete question/observation
    (wordCount >= 10 && /\b(when|why|how|what)\b.*\?/.test(original))
  );
  
  if (isCompleteThought) {
    lacksContext = false;
    isPureSetup = false;
    return { lacksContext, wordCount, isPureSetup };
  }
  
  // Default: if it's between 3-8 words and not clearly complete, flag it
  if (wordCount >= 3 && wordCount <= 8 && !isCompleteThought) {
    lacksContext = true;
    isPureSetup = true;
    reason = `brief statement (${wordCount} words) without clear narrative intent`;
    return { lacksContext, reason, wordCount, isPureSetup };
  }
  
  return { lacksContext: false, wordCount, isPureSetup: false };
}

// ============================================================================
// MARKET DETECTION
// ============================================================================

function detectMarketFromInput(input: string): 'NG' | 'GH' | 'KE' | 'ZA' | 'UK' | 'GLOBAL' {
  const lower = input.toLowerCase();
  
  const marketPatterns = [
    { pattern: /\b(nigeria|naija|nigerian|lagos|abuja|kano|port harcourt|wahala|chai|oga|na wa|omo|jollof|danfo|abeg|ijgb|naira)\b/i, market: 'NG' },
    { pattern: /\b(ghana|ghanaian|accra|kumasi|chale|cedi|trotro)\b/i, market: 'GH' },
    { pattern: /\b(kenya|kenyan|nairobi|mombasa|ksh|shilling|safaricom|matatu)\b/i, market: 'KE' },
    { pattern: /\b(south\s+africa|southafrica|south\s+african|joburg|johannesburg|cape\s+town|durban|pretoria|rand|braai|eish)\b/i, market: 'ZA' },
    { pattern: /\b(united\s+kingdom|uk|britain|british|england|english|london|manchester|birmingham|edinburgh|cardiff|pint|pub|mate|quid|lorry|cheers)\b/i, market: 'UK' }
  ];
  
  for (const { pattern, market } of marketPatterns) {
    if (pattern.test(lower)) {
      return market as any;
    }
  }
  
  return 'GLOBAL';
}

function detectEntryPathFromInput(input: string): 'emotion' | 'scene' | 'seed' | 'audience' {
  const upper = input.toUpperCase();
  
  if (upper.includes('EMOTION INPUT:')) return 'emotion';
  if (upper.includes('SCENE INPUT:')) return 'scene';
  if (upper.includes('STORY SEED:')) return 'seed';
  if (upper.includes('AUDIENCE SIGNAL:')) return 'audience';
  
  const lower = input.toLowerCase();
  
  if (/\b(feel|felt|feeling|emotion|emotional|happy|sad|angry|excited|relief|anxiety|joy|calm|frustrated|proud|grateful|delighted|hurt|disappointed|annoyed|upset|cynical|cold)\b/i.test(lower)) {
    return 'emotion';
  }
  
  if (/\b(scene|setting|place|location|room|space|environment|background|kitchen|office|street|park|laundry|flat|airport|lounge|pub|desk|workshop|fleet|call|coffee shop|cafe|bus|train)\b/i.test(lower)) {
    return 'scene';
  }
  
  if (/\b(audience|viewer|reader|people|they|them|everyone|somebody|customer|user|consumer|family|married|households|professionals|fans|stakeholders)\b/i.test(lower)) {
    return 'audience';
  }
  
  return 'seed';
}

function detectRegisterFromInput(input: string): 'formal' | 'casual' | 'colloquial' {
  const lower = input.toLowerCase();
  
  if (/(memo|formal|official|professional|business|corporate)/.test(lower)) {
    return 'formal';
  }
  
  if (/(chale|bruh|fam|mate|cheers|abeg|wahala)/.test(lower)) {
    return 'colloquial';
  }
  
  return 'casual';
}

// ============================================================================
// GIBBERISH DETECTION
// ============================================================================

function calculateGibberishScore(text: string): { score: number; isGibberish: boolean; reason: string } {
  const trimmed = text.trim();
  const words = trimmed.toLowerCase().split(/\s+/);
  
  const hasLongConsonantClusters = /([bcdfghjklmnpqrstvwxyz]{4,})/i.test(trimmed);
  const hasRepeatingNonsense = /(.)\1{3,}/i.test(trimmed);
  const hasNumbersInMiddle = /[a-z][0-9]+[a-z]/i.test(trimmed);
  const hasNoVowels = /^[^aeiouy\s]+$/i.test(trimmed.replace(/\s/g, ''));
  
  const commonWords = new Set([
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'the', 'a', 'an', 'and', 'but', 'or', 'nor', 'in', 'on',
    'at', 'to', 'for', 'of', 'with', 'by', 'as', 'from', 'up', 'down', 'out', 'off',
    'over', 'under', 'yes', 'no', 'ok', 'okay', 'hi', 'hello', 'hey', 'well', 'so',
    'then', 'now', 'just', 'very', 'too', 'also', 'only', 'not', 'can', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'going', 'coming', 'doing', 'being',
    'having', 'making', 'taking', 'got', 'get', 'gets', 'got', 'make', 'makes', 'made',
    'take', 'takes', 'took', 'come', 'comes', 'came', 'go', 'goes', 'went', 'gone'
  ]);
  
  const isLikelyEnglishWord = (word: string): boolean => {
    const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
    if (commonWords.has(cleanWord)) return true;
    if (cleanWord.length <= 1) return false;
    
    const hasVowel = /[aeiouy]/i.test(cleanWord);
    const hasConsonantVowelMix = /[bcdfghjklmnpqrstvwxyz][aeiouy]|[aeiouy][bcdfghjklmnpqrstvwxyz]/i.test(cleanWord);
    const notTooManyConsonants = !/([bcdfghjklmnpqrstvwxyz]{3,})/.test(cleanWord);
    
    return hasVowel && hasConsonantVowelMix && notTooManyConsonants;
  };
  
  let realWordCount = 0;
  for (const word of words) {
    if (isLikelyEnglishWord(word)) {
      realWordCount++;
    }
  }
  
  const realWordRatio = words.length > 0 ? realWordCount / words.length : 0;
  
  let score = 0;
  let reason = '';
  
  if (hasLongConsonantClusters) {
    score += 0.3;
    reason += 'Long consonant clusters, ';
  }
  if (hasRepeatingNonsense) {
    score += 0.3;
    reason += 'Repeating characters, ';
  }
  if (hasNumbersInMiddle) {
    score += 0.4;
    reason += 'Numbers mixed with letters, ';
  }
  if (hasNoVowels) {
    score += 0.5;
    reason += 'No vowels, ';
  }
  if (realWordRatio < 0.3 && words.length > 1) {
    score += 0.4;
    reason += `Low real-word ratio (${Math.round(realWordRatio * 100)}%), `;
  }
  
  if (words.length === 1 && !isLikelyEnglishWord(words[0]) && words[0].length > 3) {
    score += 0.4;
    reason += 'Single non-English word, ';
  }
  
  score = Math.min(score, 1);
  
  const isGibberish = score > 0.6 || (words.length === 1 && score > 0.4);
  
  if (reason) {
    reason = reason.slice(0, -2);
  }
  
  return { score, isGibberish, reason: reason || 'looks like normal text' };
}

// ============================================================================
// RISK DETECTION - COMPLETELY REWRITTEN FOR ACCURACY
// ============================================================================

function detectMeaningRisks(input: string): MeaningRiskAssessment {
  const trimmed = input.trim();
  const wordCount = trimmed.split(/\s+/).length;
  
  // FIRST: Check for lacking context - this overrides everything else
  const contextCheck = detectLackingContext(trimmed);
  
  // Initialize risks array
  const risks: MeaningRisk[] = [];
  let specificDoubt = '';
  let confidentInterpretation = '';
  let hypothesis = '';
  let distortionLikelihood = 0;
  
  // CASE 1: Gibberish
  const gibberishAnalysis = calculateGibberishScore(trimmed);
  if (gibberishAnalysis.isGibberish) {
    risks.push('possible-gibberish');
    specificDoubt = `possible gibberish: ${gibberishAnalysis.reason}`;
    hypothesis = "I'm not sure I'm reading this correctly — could you rephrase or say more about what you mean?";
    confidentInterpretation = 'unclear meaning - may be gibberish';
    distortionLikelihood = 0.9;
    
    return {
      risks,
      riskLevel: 'high',
      distortionLikelihood,
      specificDoubt,
      confidentInterpretation,
      hypothesis
    };
  }
  
  // CASE 2: Setup without substance - CRITICAL FIX
  if (contextCheck.lacksContext) {
    risks.push('insufficient-context');
    if (contextCheck.isPureSetup) {
      risks.push('setup-without-substance');
    }
    
    specificDoubt = contextCheck.reason || 'lacks narrative substance';
    
    // Generate appropriate hypothesis based on the case
    if (contextCheck.wordCount <= 2) {
      hypothesis = `"${trimmed}" — I need more context to understand what you're referring to.`;
      confidentInterpretation = 'too brief to interpret';
    } else if (contextCheck.isPureSetup) {
      hypothesis = "I hear that you're setting up a scene, but I don't yet understand the actual moment or feeling you want me to work with.";
      confidentInterpretation = 'setup without substance';
    } else {
      hypothesis = `"${trimmed}" — I might be missing the context here. Could you say more about what you mean?`;
      confidentInterpretation = 'needs additional context';
    }
    
    // Calculate distortion likelihood - HIGH for lacking context
    distortionLikelihood = 0.7 + (Math.min(contextCheck.wordCount, 10) * 0.02);
    distortionLikelihood = Math.min(distortionLikelihood, 0.85);
    
    const riskLevel = distortionLikelihood > 0.7 ? 'high' : 'medium';
    
    return {
      risks,
      riskLevel,
      distortionLikelihood: Math.round(distortionLikelihood * 100) / 100,
      specificDoubt,
      confidentInterpretation,
      hypothesis
    };
  }
  
  // CASE 3: Has substance - proceed with normal risk detection
  // But still check for specific risks
  
  // Check for insufficient context in longer but vague inputs
  if (wordCount <= 5 && !hasSubstantiveContent(trimmed)) {
    risks.push('insufficient-context');
    specificDoubt = `brief statement (${wordCount} words) without clear narrative intent`;
    hypothesis = "This is brief — I may be making assumptions about what you mean.";
    confidentInterpretation = 'needs more context';
    distortionLikelihood = 0.5;
  }
  
  // Check for emotion distortion
  const ambiguousEmotionWords = ['heavy', 'light', 'hard', 'soft', 'cold', 'warm'];
  for (const word of ambiguousEmotionWords) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(trimmed)) {
      risks.push('emotion-distortion');
      specificDoubt = `"${word}" has multiple possible readings`;
      hypothesis = `I might be reading "${word}" as a particular quality — adjust me if that's off.`;
      confidentInterpretation = 'emotional nuance possible';
      distortionLikelihood = Math.max(distortionLikelihood, 0.45);
      break;
    }
  }
  
  // Check for possible irony
  if (/(perfect|great|wonderful|amazing|fantastic)\s+(?!day|news|work|job|effort)/i.test(trimmed) && 
      wordCount <= 15) {
    risks.push('irony-missed');
    specificDoubt = 'possible irony or sarcasm';
    hypothesis = 'I might be missing a particular tone here.';
    confidentInterpretation = 'possible ironic tone';
    distortionLikelihood = Math.max(distortionLikelihood, 0.6);
  }
  
  // Check for literal vs metaphor
  const metaphorPatterns = ['heart of', 'mind of', 'wave of', 'storm of', 'weight of', 'light of'];
  for (const pattern of metaphorPatterns) {
    if (trimmed.toLowerCase().includes(pattern)) {
      risks.push('literal-vs-metaphor');
      specificDoubt = `possible figurative language: "${pattern}"`;
      hypothesis = `I might be taking "${pattern}" too literally.`;
      confidentInterpretation = 'likely metaphorical';
      distortionLikelihood = Math.max(distortionLikelihood, 0.5);
      break;
    }
  }
  
  // If no risks detected, set baseline
  if (risks.length === 0) {
    confidentInterpretation = 'clear narrative intent';
    distortionLikelihood = 0.2;
  }
  
  // Ensure distortionLikelihood is set
  if (distortionLikelihood === 0) {
    distortionLikelihood = risks.length > 0 ? 0.4 : 0.2;
  }
  
  // Calculate risk level
  const riskLevel = distortionLikelihood > 0.6 ? 'high' : 
                    distortionLikelihood > 0.35 ? 'medium' : 'low';
  
  return {
    risks,
    riskLevel,
    distortionLikelihood: Math.round(distortionLikelihood * 100) / 100,
    specificDoubt: specificDoubt || 'minimal doubt',
    confidentInterpretation: confidentInterpretation || 'proceeding with interpretation',
    hypothesis: hypothesis || undefined
  };
}

// ============================================================================
// CONFIDENCE CALCULATION - COMPLETELY REWRITTEN
// ============================================================================

function calculateConfidence(
  input: string,
  riskAssessment: MeaningRiskAssessment
): number {
  const wordCount = input.split(/\s+/).length;
  const contextCheck = detectLackingContext(input);
  const hasSubstance = hasSubstantiveContent(input);
  
  let confidence = 0.95; // Start high, then penalize
  
  // PENALTY 1: Gibberish - SEVERE
  if (riskAssessment.risks.includes('possible-gibberish')) {
    confidence *= 0.1;
    return Math.max(0.05, Math.min(confidence, 0.95));
  }
  
  // PENALTY 2: Setup without substance - SEVERE
  if (contextCheck.lacksContext && contextCheck.isPureSetup) {
    confidence *= 0.2;
    return Math.max(0.1, Math.min(confidence, 0.95));
  }
  
  // PENALTY 3: Too brief
  if (wordCount <= 2) {
    confidence *= 0.15;
    return Math.max(0.1, Math.min(confidence, 0.95));
  }
  
  // PENALTY 4: Brief without substance
  if (wordCount <= 5 && !hasSubstance) {
    confidence *= 0.25;
  } else if (wordCount <= 8 && !hasSubstance) {
    confidence *= 0.4;
  }
  
  // PENALTY 5: Framing without content
  const hasFraming = /overheard|heard|said|told|asked|replied|conversation|yesterday|morning|afternoon|evening/i.test(input);
  if (hasFraming && !hasSubstance) {
    confidence *= 0.3;
  }
  
  // PENALTY 6: Specific risks
  if (riskAssessment.risks.includes('insufficient-context')) {
    confidence *= 0.5;
  }
  
  if (riskAssessment.risks.includes('irony-missed')) {
    confidence *= 0.6;
  }
  
  if (riskAssessment.risks.includes('emotion-distortion')) {
    confidence *= 0.7;
  }
  
  if (riskAssessment.risks.includes('literal-vs-metaphor')) {
    confidence *= 0.7;
  }
  
  // BONUS: Complete thoughts with substance
  if (hasSubstance) {
    if (wordCount >= 15) confidence *= 1.1;
    if (/["'].*?["']/.test(input)) confidence *= 1.1; // Has quotes
    if (/\b(create|make|write|generate|build)\b.*\b(story|narrative|brand|script)\b/i.test(input)) confidence *= 1.1; // Has creative request
    if (/\b(brand|company|product|marketing|campaign)\b/i.test(input)) confidence *= 1.05; // Brand context
  }
  
  // Apply distortion likelihood from risk assessment
  confidence *= (1 - riskAssessment.distortionLikelihood);
  
  // Clamp to reasonable range
  return Math.max(0.05, Math.min(confidence, 0.95));
}

// ============================================================================
// CLARIFICATION DECISION - SIMPLIFIED AND STRICT
// ============================================================================

function shouldClarify(
  riskAssessment: MeaningRiskAssessment, 
  input: string
): boolean {
  const wordCount = input.split(/\s+/).length;
  const contextCheck = detectLackingContext(input);
  const hasSubstance = hasSubstantiveContent(input);
  
  // ALWAYS clarify if it's setup without substance
  if (contextCheck.lacksContext && contextCheck.isPureSetup) {
    console.log(`[CLARIFY] MUST clarify: setup without substance`);
    return true;
  }
  
  // ALWAYS clarify if it's too brief to interpret
  if (wordCount <= 2) {
    console.log(`[CLARIFY] MUST clarify: too brief (${wordCount} words)`);
    return true;
  }
  
  // ALWAYS clarify if it's gibberish
  if (riskAssessment.risks.includes('possible-gibberish')) {
    return true;
  }
  
  // ALWAYS clarify if high risk
  if (riskAssessment.riskLevel === 'high') {
    return true;
  }
  
  // Clarify if medium risk with insufficient context
  if (riskAssessment.riskLevel === 'medium') {
    if (riskAssessment.risks.includes('insufficient-context')) {
      return true;
    }
    if (riskAssessment.risks.includes('irony-missed')) {
      return true;
    }
    if (riskAssessment.distortionLikelihood > 0.5) {
      return true;
    }
  }
  
  // Clarify if low word count with ANY risk
  if (wordCount <= 8 && riskAssessment.risks.length > 0) {
    return true;
  }
  
  // Clarify if no substantive content
  if (!hasSubstance && wordCount <= 12) {
    return true;
  }
  
  return false;
}

// ============================================================================
// MINIMAL ASSUMPTIONS
// ============================================================================

function makeMinimalAssumptions(
  input: string,
  riskAssessment: MeaningRiskAssessment
): XOInterpretation['minimalAssumptions'] {
  
  // If high risk or lacking context, make no assumptions
  if (riskAssessment.riskLevel === 'high' || 
      riskAssessment.risks.includes('possible-gibberish') ||
      detectLackingContext(input).lacksContext) {
    return {
      emotionDirection: 'unknown',
      tensionType: 'unknown',
      intentCategory: 'unknown'
    };
  }
  
  const lowerInput = input.toLowerCase();
  
  // Make minimal, cautious assumptions
  let emotionDirection: XOInterpretation['minimalAssumptions']['emotionDirection'] = 'neutral';
  let tensionType: XOInterpretation['minimalAssumptions']['tensionType'] = 'observation';
  let intentCategory: XOInterpretation['minimalAssumptions']['intentCategory'] = 'share';
  
  // Emotion detection - only if clear
  if (/(happy|joy|excited|proud|love|grateful|delighted)/i.test(lowerInput)) {
    emotionDirection = 'positive';
  } else if (/(sad|hurt|disappointed|angry|frustrated|upset|cynical|cold)/i.test(lowerInput)) {
    emotionDirection = 'negative';
  } else if (/(complex|complicated|mixed|layered)/i.test(lowerInput)) {
    emotionDirection = 'layered';
  }
  
  // Tension detection
  if (/(but|however|although|yet|though)/i.test(lowerInput)) {
    tensionType = 'contrast';
  } else if (/(wish|could|should|if only|create|build|make)/i.test(lowerInput)) {
    tensionType = 'desire';
  } else if (/(remember|recall|back then|used to)/i.test(lowerInput)) {
    tensionType = 'reflection';
  }
  
  // Intent detection
  if (/\?$/.test(input)) {
    intentCategory = 'inquire';
  } else if (/!$/.test(input)) {
    intentCategory = 'emphasize';
  } else if (/^(i think|i feel|i believe|i wonder)/i.test(lowerInput)) {
    intentCategory = 'reflect';
  } else if (/(create|make|write|generate|build).*(story|narrative|brand|script)/i.test(lowerInput)) {
    intentCategory = 'express';
  }
  
  return { emotionDirection, tensionType, intentCategory };
}

// ============================================================================
// CLARIFICATION GENERATION - CONTEXT-AWARE
// ============================================================================

function generateClarification(
  input: string,
  riskAssessment: MeaningRiskAssessment
): { hypothesis: string; correctionInvitation: string; unclearElement: string } | null {
  
  // Handle lacking context cases first
  const contextCheck = detectLackingContext(input);
  if (contextCheck.lacksContext) {
    if (contextCheck.isPureSetup) {
      return {
        hypothesis: "I hear that you're setting up a scene, but I don't yet understand the actual moment or feeling you want me to work with.",
        correctionInvitation: "Could you share what was actually said, felt, or observed in that moment?",
        unclearElement: contextCheck.reason || 'setup without substance'
      };
    }
    
    if (contextCheck.wordCount <= 2) {
      return {
        hypothesis: `"${input}" — I need more context to understand what you're referring to.`,
        correctionInvitation: "Could you say more about what you mean?",
        unclearElement: `too brief (${contextCheck.wordCount} words)`
      };
    }
    
    return {
      hypothesis: `"${input}" — I might be missing the context here.`,
      correctionInvitation: "Could you say more about what you're pointing to?",
      unclearElement: contextCheck.reason || 'needs more context'
    };
  }
  
  if (riskAssessment.risks.length === 0) return null;
  
  const primaryRisk = riskAssessment.risks[0];
  let hypothesis = riskAssessment.hypothesis;
  let unclearElement = riskAssessment.specificDoubt;
  let correctionInvitation = "If that's off, adjust me.";
  
  switch (primaryRisk) {
    case 'possible-gibberish':
      hypothesis = "I'm not sure I'm reading this correctly — could you rephrase or say more about what you mean?";
      correctionInvitation = "If this wasn't what you meant, please rephrase.";
      unclearElement = 'unclear meaning - possible gibberish';
      break;
      
    case 'insufficient-context':
      hypothesis = "This is brief — I may be making assumptions about what you mean.";
      correctionInvitation = "Could you say more about what you mean?";
      unclearElement = 'needs more context';
      break;
      
    case 'setup-without-substance':
      hypothesis = "I hear you're describing where this happened, but I don't yet understand the actual moment you want to work with.";
      correctionInvitation = "Could you share what was actually said, felt, or observed?";
      unclearElement = 'setup without the actual moment';
      break;
      
    case 'irony-missed':
      hypothesis = "I might be missing a particular tone here.";
      correctionInvitation = "If that's not the tone, could you clarify?";
      unclearElement = 'possible irony';
      break;
      
    case 'emotion-distortion': {
      const wordMatch = input.match(/(heavy|light|hard|soft|cold|warm)/i);
      const word = wordMatch ? wordMatch[0] : 'this';
      hypothesis = `I might be reading "${word}" as a particular quality — adjust me if that's off.`;
      unclearElement = `ambiguous word: ${word}`;
      break;
    }
    
    case 'literal-vs-metaphor': {
      const metaphorMatch = input.match(/(heart|mind|wave|storm|weight|light)\s+(of|in|on)/i);
      const phrase = metaphorMatch ? metaphorMatch[0] : 'this language';
      hypothesis = `I might be taking "${phrase}" too literally.`;
      unclearElement = `possible metaphor: ${phrase}`;
      break;
    }
    
    case 'positive-negative-ambiguity':
      hypothesis = 'I might be misreading the overall emotional direction.';
      unclearElement = 'mixed emotional signals';
      break;
      
    case 'tension-overlook': {
      const contrastWord = input.match(/(but|however|although|yet)/i)?.[0] || 'the contrast';
      hypothesis = `I might be misreading what sits on either side of "${contrastWord}".`;
      unclearElement = `contrast without clear stance`;
      break;
    }
  }
  
  return {
    hypothesis: hypothesis || 'I might be reading this in a particular way — adjust me if needed.',
    correctionInvitation,
    unclearElement: unclearElement || riskAssessment.specificDoubt
  };
}

// ============================================================================
// AI INTERPRETATION
// ============================================================================

async function getAIIntepretation(input: string): Promise<Partial<XOInterpretation>> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Extract meaning only, no prescription. Return JSON with:
{
  "coreTension": "push/pull (be tentative)",
  "emotionalWeight": "feeling (be tentative)",
  "intentSummary": "why shared (be tentative)"
}`
        },
        { role: "user", content: input }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 150
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No content from AI');
    
    const parsed = JSON.parse(content);
    
    ['coreTension', 'emotionalWeight', 'intentSummary'].forEach(field => {
      if (parsed[field] && !parsed[field].includes('seem') && 
          !parsed[field].includes('might') && 
          !parsed[field].includes('could')) {
        parsed[field] = `seems like ${parsed[field]}`;
      }
    });
    
    return parsed;
  } catch (error) {
    console.error('AI interpretation error:', error);
    return {};
  }
}

// ============================================================================
// UNDERSTANDING SUMMARY GENERATION
// ============================================================================

async function generateUnderstandingSummary(
  input: string,
  interpretation: XOInterpretation,
  aiInterpretation: Partial<XOInterpretation>
): Promise<string> {
  try {
    if (interpretation.riskAssessment.risks.includes('insufficient-context') || 
        interpretation.riskAssessment.risks.includes('setup-without-substance') ||
        input.split(/\s+/).length <= 3) {
      
      const { confidentInterpretation, specificDoubt } = interpretation.riskAssessment;
      
      if (specificDoubt.includes('setup without substance')) {
        return "I hear you're describing a scene, but I need the actual moment or feeling to work with.";
      } else if (specificDoubt.includes('too brief')) {
        return `"${input}" — I need more context to understand.`;
      } else {
        return `I hear "${confidentInterpretation}" but I need more to understand fully.`;
      }
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You're summarizing what you understand so far. Be tentative, use "it sounds like", "seems", "might be". 
          
Here's what we have:
Input: "${input}"
Core tension: ${interpretation.coreTension}
Emotional weight: ${interpretation.emotionalWeight}
Intent: ${interpretation.intentSummary}

Generate a brief, natural-sounding summary of what you understand so far. Keep it under 2 sentences.`
        },
        { role: "user", content: "Summarize what you understand so far." }
      ],
      temperature: 0.5,
      max_tokens: 100
    });

    const summary = completion.choices[0].message.content?.trim();
    return summary || `I'm processing "${input.substring(0, 50)}..." but need to proceed carefully.`;
    
  } catch (error) {
    console.error('Error generating understanding summary:', error);
    
    const snippet = input.substring(0, Math.min(50, input.length));
    return `I hear "${snippet}..." but I'm proceeding cautiously.`;
  }
}

// ============================================================================
// CONTRACT CREATION
// ============================================================================

async function createMeaningContract(
  input: string,
  interpretation: XOInterpretation,
  aiInterpretation: Partial<XOInterpretation> = {}
): Promise<MeaningContract> {
  const { riskAssessment, confidence, minimalAssumptions, seedMoment } = interpretation;
  
  const detectedMarket = detectMarketFromInput(input);
  const detectedEntryPath = detectEntryPathFromInput(input);
  const detectedRegister = detectRegisterFromInput(input);
  
  // Determine certainty mode
  let certaintyMode: MeaningContract['certaintyMode'] = 'clarification-needed';
  let safeToNarrate = false;
  
  if (riskAssessment.risks.includes('possible-gibberish') || 
      detectLackingContext(input).lacksContext) {
    certaintyMode = 'clarification-needed';
    safeToNarrate = false;
  } else if (confidence >= 0.7 && riskAssessment.riskLevel === 'low') {
    certaintyMode = 'tentative-commit';
    safeToNarrate = true;
  } else if (confidence >= 0.5) {
    certaintyMode = 'reflection-only';
    safeToNarrate = false;
  }
  
  // Map emotional state
  let emotionalState: MeaningContract['interpretedMeaning']['emotionalState'] = 'neutral';
  if (minimalAssumptions.emotionDirection !== 'unknown') {
    emotionalState = minimalAssumptions.emotionDirection;
  } else if (aiInterpretation.emotionalWeight) {
    const lowerEmotion = aiInterpretation.emotionalWeight.toLowerCase();
    if (lowerEmotion.includes('positive')) emotionalState = 'positive';
    else if (lowerEmotion.includes('negative')) emotionalState = 'negative';
    else if (lowerEmotion.includes('complex') || lowerEmotion.includes('layered')) emotionalState = 'complex';
    else if (lowerEmotion.includes('ambiguous')) emotionalState = 'ambiguous';
  }
  
  // Map emotional direction
  let emotionalDirection: MeaningContract['interpretedMeaning']['emotionalDirection'] = 'observational';
  const intent = aiInterpretation.intentSummary || interpretation.intentSummary;
  if (intent.includes('personal') || intent.includes('I feel')) emotionalDirection = 'inward';
  else if (intent.includes('shared') || intent.includes('we')) emotionalDirection = 'relational';
  else if (intent.includes('observe') || intent.includes('notice')) emotionalDirection = 'observational';
  else if (intent.includes('create') || intent.includes('build')) emotionalDirection = 'outward';
  
  // Map intent category
  let intentCategory: MeaningContract['interpretedMeaning']['intentCategory'] = 'express';
  if (minimalAssumptions.intentCategory !== 'unknown') {
    intentCategory = minimalAssumptions.intentCategory;
  } else if (aiInterpretation.intentSummary) {
    const lowerIntent = aiInterpretation.intentSummary.toLowerCase();
    if (lowerIntent.includes('inquire') || lowerIntent.includes('question')) intentCategory = 'inquire';
    else if (lowerIntent.includes('emphasize') || lowerIntent.includes('exclaim')) intentCategory = 'emphasize';
    else if (lowerIntent.includes('reflect') || lowerIntent.includes('think')) intentCategory = 'reflect';
    else if (lowerIntent.includes('process') || lowerIntent.includes('work through')) intentCategory = 'process';
    else if (lowerIntent.includes('connect') || lowerIntent.includes('share with')) intentCategory = 'connect';
    else if (lowerIntent.includes('create') || lowerIntent.includes('build')) intentCategory = 'express';
  }
  
  // Determine core theme
  const coreTheme = determineCoreTheme(
    aiInterpretation.coreTension || interpretation.coreTension,
    emotionalState
  );
  
  // Generate understanding summary if needed
  let understandingSummary: string | undefined;
  if (!safeToNarrate) {
    understandingSummary = await generateUnderstandingSummary(input, interpretation, aiInterpretation);
  }
  
  const contract: MeaningContract = {
    interpretedMeaning: {
      emotionalState,
      emotionalDirection,
      narrativeTension: aiInterpretation.coreTension || interpretation.coreTension || 'unresolved dynamic',
      intentCategory,
      coreTheme
    },
    marketContext: {
      market: detectedMarket,
      language: 'english',
      register: detectedRegister
    },
    entryPath: detectedEntryPath,
    confidence: Math.round(confidence * 100) / 100,
    certaintyMode,
    reversible: true,
    safeToNarrate,
    provenance: {
      source: 'ccn-interpretation',
      riskLevel: riskAssessment.riskLevel,
      distortionLikelihood: riskAssessment.distortionLikelihood,
      risksAcknowledged: riskAssessment.risks
    },
    seedMoment: seedMoment || input
  };
  
  if (understandingSummary) {
    contract.understandingSummary = understandingSummary;
  }
  
  return contract;
}

function determineCoreTheme(tension: string, emotion: string): string {
  const lowerTension = tension.toLowerCase();
  
  if (lowerTension.includes('desire') || lowerTension.includes('wish')) {
    return 'aspiration versus reality';
  } else if (lowerTension.includes('contrast') || lowerTension.includes('but')) {
    return 'tension between states';
  } else if (lowerTension.includes('past') || lowerTension.includes('memory')) {
    return 'time and memory';
  } else if (lowerTension.includes('change') || lowerTension.includes('transition')) {
    return 'transformation';
  } else if (emotion === 'positive') {
    return 'acknowledgment or appreciation';
  } else if (emotion === 'negative') {
    return 'difficulty or challenge';
  } else if (emotion === 'complex' || emotion === 'layered') {
    return 'multifaceted experience';
  }
  
  return 'human experience';
}

// ============================================================================
// PREVIEW GENERATION
// ============================================================================

function generatePreview(
  interpretation: XOInterpretation,
  needsClarification: boolean
): string {
  if (needsClarification) {
    if (interpretation.riskAssessment.hypothesis) {
      return interpretation.riskAssessment.hypothesis;
    }
    
    const primaryRisk = interpretation.riskAssessment.risks[0];
    
    if (primaryRisk === 'possible-gibberish') {
      return 'I\'m not sure I\'m reading this correctly — could you clarify?';
    } else if (primaryRisk === 'setup-without-substance') {
      return 'I hear you\'re setting up a scene, but I need the actual moment to work with.';
    } else if (primaryRisk === 'insufficient-context') {
      const wordCount = interpretation.seedMoment.split(/\s+/).length;
      if (wordCount <= 2) {
        return `"${interpretation.seedMoment}" — I need more context.`;
      } else {
        return `"${interpretation.seedMoment}" — I might be missing the context.`;
      }
    }
    
    return "I might be reading this in a particular way.";
  }
  
  if (interpretation.meaningContract) {
    const contract = interpretation.meaningContract;
    if (!contract.safeToNarrate && contract.understandingSummary) {
      return contract.understandingSummary;
    } else if (contract.certaintyMode === 'reflection-only') {
      return `Reflecting on ${contract.interpretedMeaning.coreTheme.toLowerCase()}.`;
    }
    return `Proceeding with a sense of ${contract.interpretedMeaning.emotionalState}.`;
  }
  
  return `Proceeding tentatively.`;
}

// ============================================================================
// FALLBACK INTERPRETATION
// ============================================================================

function createFallbackInterpretation(input: string): XOInterpretation {
  const riskAssessment: MeaningRiskAssessment = {
    risks: ['intent-misinterpretation'],
    riskLevel: 'high',
    distortionLikelihood: 0.9,
    specificDoubt: 'system error',
    confidentInterpretation: 'minimal confidence'
  };
  
  return {
    coreTension: 'system difficulty',
    emotionalWeight: 'neutral',
    seedMoment: input.substring(0, Math.min(100, input.length)),
    intentSummary: 'to express',
    clearPoints: ['system encountered difficulty'],
    doubtfulPoints: ['system reliability'],
    riskAssessment,
    confidence: 0.1,
    minimalAssumptions: {
      emotionDirection: 'unknown',
      tensionType: 'unknown',
      intentCategory: 'unknown'
    }
  };
}

// ============================================================================
// MAIN API HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<XOCCNResponse>
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      interpretation: createFallbackInterpretation('Method not allowed'),
      needsClarification: false,
      understandingPreview: 'Method not allowed',
      error: 'Method not allowed'
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { userInput, isClarificationResponse, previousAnswer, isRewriteAttempt } = body;
    
    if (!userInput || typeof userInput !== 'string') {
      return res.status(400).json({
        success: false,
        interpretation: createFallbackInterpretation('No input'),
        needsClarification: false,
        understandingPreview: 'No input provided',
        error: 'userInput required'
      });
    }
    
    const trimmedInput = userInput.trim();
    if (trimmedInput.length === 0) {
      return res.status(400).json({
        success: false,
        interpretation: createFallbackInterpretation('Empty'),
        needsClarification: false,
        understandingPreview: 'Input empty',
        error: 'Input empty'
      });
    }

    console.log(`[CLARIFY] Processing: "${trimmedInput}"`);
    console.log(`[CLARIFY] Word count: ${trimmedInput.split(/\s+/).length}`);
    
    // 1. Detect risks - completely rewritten
    const riskAssessment = detectMeaningRisks(trimmedInput);
    
    // 2. Check for lacking context - critical for the "overheard at a coffee shop" case
    const contextCheck = detectLackingContext(trimmedInput);
    console.log(`[CLARIFY] Lacks context: ${contextCheck.lacksContext}${contextCheck.reason ? ` (${contextCheck.reason})` : ''}`);
    
    // 3. Decide if clarification is needed
    const needsClarification = shouldClarify(riskAssessment, trimmedInput);
    
    // 4. Make minimal assumptions
    const minimalAssumptions = makeMinimalAssumptions(trimmedInput, riskAssessment);
    
    // 5. Calculate confidence - completely rewritten
    const confidence = calculateConfidence(trimmedInput, riskAssessment);
    console.log(`[CLARIFY] Confidence: ${confidence}`);
    
    // 6. Build interpretation
    let interpretation: XOInterpretation;
    let understandingSummary: string | undefined;
    
    if (needsClarification) {
      interpretation = {
        coreTension: 'clarification needed',
        emotionalWeight: 'clarification needed',
        seedMoment: trimmedInput,
        intentSummary: 'clarification needed',
        clearPoints: [riskAssessment.confidentInterpretation].filter(Boolean),
        doubtfulPoints: [riskAssessment.specificDoubt].filter(Boolean),
        riskAssessment,
        confidence,
        minimalAssumptions
      };
    } else {
      const aiInterpretation = await getAIIntepretation(trimmedInput);
      
      interpretation = {
        coreTension: aiInterpretation.coreTension || minimalAssumptions.tensionType,
        emotionalWeight: aiInterpretation.emotionalWeight || minimalAssumptions.emotionDirection,
        seedMoment: trimmedInput,
        intentSummary: aiInterpretation.intentSummary || minimalAssumptions.intentCategory,
        clearPoints: [riskAssessment.confidentInterpretation, 'proceeding without clarification'].filter(Boolean),
        doubtfulPoints: [],
        riskAssessment,
        confidence,
        minimalAssumptions
      };
      
      // CREATE THE CONTRACT
      if (!riskAssessment.risks.includes('possible-gibberish')) {
        interpretation.meaningContract = await createMeaningContract(trimmedInput, interpretation, aiInterpretation);
        
        if (interpretation.meaningContract?.understandingSummary) {
          understandingSummary = interpretation.meaningContract.understandingSummary;
        }
      }
    }
    
    // 7. Generate clarification if needed
    const clarification = needsClarification 
      ? generateClarification(trimmedInput, riskAssessment)
      : undefined;
    
    // 8. Generate preview
    const understandingPreview = generatePreview(interpretation, needsClarification);
    
    // 9. Build response
    const response: XOCCNResponse = {
      success: true,
      interpretation,
      needsClarification,
      clarification,
      understandingPreview
    };
    
    if (understandingSummary) {
      response.understandingSummary = understandingSummary;
    }
    
    console.log(`[CLARIFY] ${needsClarification ? 'NEEDS clarification' : 'PROCEEDING with contract'}`);
    console.log(`[CLARIFY] Market: ${interpretation.meaningContract?.marketContext?.market || 'not set'}`);
    console.log(`[CLARIFY] Entry path: ${interpretation.meaningContract?.entryPath || 'not set'}`);
    console.log(`[CLARIFY] Safe to narrate: ${interpretation.meaningContract?.safeToNarrate ?? false}`);
    
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('[CLARIFY] Error:', error);
    
    return res.status(500).json({
      success: false,
      interpretation: createFallbackInterpretation('System error'),
      needsClarification: true,
      clarification: {
        hypothesis: 'I encountered difficulty reading this.',
        correctionInvitation: 'Could you rephrase or say more?',
        unclearElement: 'system difficulty'
      },
      understandingPreview: 'I need to start fresh with your words.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}