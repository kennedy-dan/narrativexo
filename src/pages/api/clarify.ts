// /api/clarify/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
// import { XOInterpretation, MeaningContract, MeaningRisk } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ============================================================================
// ENHANCED MEANING CONTRACT WITH MARKET CONTEXT
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
  | 'possible-gibberish';

export interface MeaningRiskAssessment {
  risks: MeaningRisk[];
  riskLevel: 'low' | 'medium' | 'high';
  distortionLikelihood: number;
  specificDoubt: string;
  confidentInterpretation: string;
  hypothesis?: string;
}

// ENHANCED MEANING CONTRACT with market context
export interface MeaningContract {
  // Interpreted meaning (when we commit)
  interpretedMeaning: {
    emotionalState: 'positive' | 'negative' | 'neutral' | 'layered' | 'complex' | 'ambiguous';
    emotionalDirection: 'inward' | 'outward' | 'observational' | 'relational' | 'unknown';
    narrativeTension: string;
    intentCategory: 'share' | 'inquire' | 'emphasize' | 'reflect' | 'process' | 'express' | 'connect';
    coreTheme: string;
  };
  
  // Market context for XO
  marketContext?: {
    market: 'GLOBAL' | 'NG' | 'UK';
    language: string;
    register: 'formal' | 'casual' | 'colloquial';
  };
  
  // Entry path detection
  entryPath?: 'emotion' | 'scene' | 'seed' | 'audience';
  
  // Confidence & commitment level
  confidence: number;
  certaintyMode: 'tentative-commit' | 'reflection-only' | 'clarification-needed';
  
  // Safety properties
  reversible: boolean;
  safeToNarrate: boolean;
  
  // Understanding summary when safeToNarrate is false
  understandingSummary?: string;
  
  // Provenance (why we believe this)
  provenance: {
    source: 'ccn-interpretation';
    riskLevel: 'low' | 'medium' | 'high';
    distortionLikelihood: number;
    risksAcknowledged: MeaningRisk[];
  };
  
  // Original seed
  seedMoment: string;
}

// XO Interpretation
export interface XOInterpretation {
  // Core meaning analysis
  coreTension: string;
  emotionalWeight: string;
  seedMoment: string;
  intentSummary: string;
  
  // Clarity assessment
  clearPoints: string[];
  doubtfulPoints: string[];
  
  // Risk assessment
  riskAssessment: MeaningRiskAssessment;
  confidence: number;
  
  // Working assumptions
  minimalAssumptions: {
    emotionDirection: 'positive' | 'negative' | 'neutral' | 'layered' | 'unknown';
    tensionType: 'contrast' | 'desire' | 'observation' | 'reflection' | 'unknown';
    intentCategory: 'share' | 'inquire' | 'emphasize' | 'reflect' | 'unknown';
  };
  
  // THE CONTRACT (when ready)
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
// HELPER FUNCTIONS
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

function isPunctuationOrQuestion(text: string): boolean {
  return /\?$/.test(text) || /!$/.test(text) || /\.\.\.$/.test(text) || /\.$/.test(text);
}

function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'am', 'is', 'are', 'was', 'were', 'be', 'been', 'the', 'a', 'an', 'and', 'but',
    'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'as', 'from', 'up',
    'down', 'out', 'off', 'over', 'under', 'yes', 'no', 'ok', 'okay', 'hi', 'hello',
    'hey', 'going', 'coming', 'doing', 'being', 'having', 'making', 'taking', 'got',
    'get', 'make', 'take', 'come', 'go', 'see', 'look', 'watch', 'hear', 'listen',
    'say', 'tell', 'talk', 'speak', 'know', 'think', 'feel', 'want', 'need', 'like',
    'love', 'hate', 'good', 'bad', 'big', 'small', 'hot', 'cold', 'happy', 'sad',
    'kennedy', 'president', 'family', 'brother', 'sister', 'mother', 'father'
  ]);
  
  return commonWords.has(word.toLowerCase());
}

function detectInsufficientInformation(text: string, wordCount: number, isGibberish: boolean = false): boolean {
  if (isGibberish) return false;
  
  if (wordCount <= 2 && !isPunctuationOrQuestion(text)) {
    return true;
  }
  
  if (wordCount === 1 && /^[A-Z][a-z]+$/.test(text) && !isCommonWord(text)) {
    return true;
  }
  
  if (wordCount <= 3 && /^(going to|coming from|doing|making|taking|got to|have to|make|take)/i.test(text)) {
    return true;
  }
  
  const shortPhrases = [
    'going out', 'coming in', 'getting up', 'sitting down', 'looking at', 'thinking of',
    'feeling good', 'feeling bad', 'making it', 'taking it', 'got it'
  ];
  
  if (shortPhrases.includes(text.toLowerCase())) {
    return true;
  }
  
  return false;
}

// NEW: Detect entry path from input
function detectEntryPath(input: string): 'emotion' | 'scene' | 'seed' | 'audience' {
  const lower = input.toLowerCase();
  
  if (/(feel|felt|feeling|emotion|emotional|happy|sad|angry|excited)/.test(lower)) {
    return 'emotion';
  }
  
  if (/(scene|setting|place|location|room|space|environment|background)/.test(lower)) {
    return 'scene';
  }
  
  if (/(audience|viewer|reader|people|they|them|everyone|somebody)/.test(lower)) {
    return 'audience';
  }
  
  return 'seed'; // Default
}

// NEW: Detect market from input (simple detection)
function detectMarketFromInput(input: string): 'GLOBAL' | 'NG' | 'UK' {
  const lower = input.toLowerCase();
  
  // Nigerian indicators
  if (/(nigeria|naija|lagos|abuja|kano|port harcourt|iyanya|wahala|chai|oga|na wa)/.test(lower)) {
    return 'NG';
  }
  
  // UK indicators
  if (/(uk|british|england|london|manchester|birmingham|scotland|wales|pint|pub|football|mate)/.test(lower)) {
    return 'UK';
  }
  
  return 'GLOBAL';
}

// ============================================================================
// RISK DETECTION
// ============================================================================

function detectMeaningRisks(input: string): MeaningRiskAssessment {
  const trimmed = input.trim();
  const lowerInput = trimmed.toLowerCase();
  const words = lowerInput.split(/\s+/);
  const wordCount = words.length;
  
  const risks: MeaningRisk[] = [];
  let specificDoubt = '';
  let confidentInterpretation = '';
  let hypothesis: string | undefined;
  
  const gibberishAnalysis = calculateGibberishScore(trimmed);
  
  if (gibberishAnalysis.isGibberish) {
    risks.push('possible-gibberish', 'intent-misinterpretation');
    specificDoubt = `possible gibberish: ${gibberishAnalysis.reason}`;
    hypothesis = 'I\'m not sure I\'m reading this correctly — could you clarify what you mean?';
    confidentInterpretation = 'unclear meaning - may be gibberish or mistyped';
    
    const assessment: MeaningRiskAssessment = {
      risks,
      riskLevel: 'high',
      distortionLikelihood: Math.max(0.8, gibberishAnalysis.score),
      specificDoubt,
      confidentInterpretation,
      hypothesis
    };
    
    return assessment;
  }
  
  const isInsufficient = detectInsufficientInformation(trimmed, wordCount, false);
  
  if (isInsufficient) {
    risks.push('insufficient-context');
    
    if (wordCount === 1) {
      const word = words[0];
      
      if (isCommonWord(word)) {
        specificDoubt = `single common word "${word}" without context`;
        hypothesis = `"${word}" could mean many different things depending on context.`;
        confidentInterpretation = 'single word - needs context';
      } else if (/^[A-Z][a-z]+$/.test(word)) {
        specificDoubt = `name or proper noun "${word}" without context`;
        hypothesis = `"${word}" might refer to a person, place, or concept — could you say more about what you mean?`;
        confidentInterpretation = 'proper noun - context needed';
      } else {
        specificDoubt = `single word "${word}" without clear intent`;
        hypothesis = `"${word}" could mean many things — could you say more about what you're pointing to?`;
        confidentInterpretation = 'single word - multiple possible meanings';
      }
    } else if (wordCount === 2) {
      specificDoubt = `short phrase "${trimmed}" without context`;
      
      if (trimmed.toLowerCase() === 'going out') {
        hypothesis = '"Going out" could mean physically leaving, socially going out, or something else entirely.';
      } else if (trimmed.toLowerCase() === 'make sense') {
        hypothesis = '"Make sense" could refer to understanding, logical coherence, or creating meaning.';
      } else {
        hypothesis = `"${trimmed}" is brief — I may be missing what you're referring to.`;
      }
      
      confidentInterpretation = 'short phrase - needs context';
    } else {
      specificDoubt = 'insufficient context for clear interpretation';
      hypothesis = 'This needs some clarification to understand fully.';
      confidentInterpretation = 'brief statement - context needed';
    }
  }
  
  if (risks.length === 0 && wordCount > 2) {
    const ambiguousWords = [
      { word: 'heavy', hypothesis: 'I might be reading "heavy" as burden rather than seriousness.' },
      { word: 'light', hypothesis: 'I might be reading "light" as trivial rather than gentle.' },
      { word: 'hard', hypothesis: 'I might be reading "hard" as difficult rather than unyielding.' },
      { word: 'cold', hypothesis: 'I might be reading "cold" as unfeeling rather than chilly.' },
      { word: 'warm', hypothesis: 'I might be reading "warm" as kind rather than heated.' }
    ];
    
    for (const { word, hypothesis: wordHypothesis } of ambiguousWords) {
      if (words.includes(word)) {
        risks.push('emotion-distortion');
        specificDoubt = `"${word}" has multiple possible readings`;
        hypothesis = wordHypothesis;
        break;
      }
    }
    
    if (/(perfect|great|wonderful)\s+(?!day|news|work|job|effort)/i.test(trimmed)) {
      const match = trimmed.match(/(perfect|great|wonderful)\s+\w+/i);
      if (match) {
        risks.push('irony-missed');
        specificDoubt = 'possible irony or sarcasm';
        hypothesis = `I might be missing irony in "${match[0]}".`;
      }
    }
    
    const hasPositive = /(good|great|nice|positive|better)/i.test(trimmed);
    const hasNegative = /(bad|hard|difficult|negative|worse)/i.test(trimmed);
    const hasBut = /\s+but\s+/i.test(trimmed);
    
    if (hasPositive && hasNegative && !hasBut && trimmed.length > 10) {
      risks.push('positive-negative-ambiguity');
      specificDoubt = 'mixed positive and negative signals';
      hypothesis = 'I might be misreading the overall emotional direction.';
    }
    
    const metaphorMatch = trimmed.match(/(heart|mind|wave|storm|weight|light)\s+(of|in|on|for)/i);
    if (metaphorMatch && trimmed.length < 40) {
      risks.push('literal-vs-metaphor');
      specificDoubt = 'possible figurative language';
      hypothesis = `I might be taking "${metaphorMatch[0]}" too literally.`;
    }
    
    const contrastMatch = trimmed.match(/(but|however|although|yet|though)\s+/i);
    if (contrastMatch && !confidentInterpretation.includes('positive') && !confidentInterpretation.includes('negative')) {
      risks.push('tension-overlook');
      specificDoubt = 'contrast without clear emotional stance';
      hypothesis = `I might be misreading what sits on either side of "${contrastMatch[0]}".`;
    }
  }
  
  if (!confidentInterpretation) {
    if (/(happy|joy|excited|proud|love|grateful|delighted)/i.test(trimmed)) {
      confidentInterpretation = 'positive emotional tone';
    } else if (/(sad|hurt|disappointed|angry|frustrated|annoyed|upset)/i.test(trimmed)) {
      confidentInterpretation = 'negative emotional tone';
    } else if (/\?$/.test(trimmed)) {
      confidentInterpretation = 'inquiry intent';
    } else if (/!$/.test(trimmed)) {
      confidentInterpretation = 'emphatic expression';
    } else {
      if (wordCount <= 3) {
        confidentInterpretation = 'brief statement - some context needed';
      } else {
        confidentInterpretation = 'neutral observation or sharing';
      }
    }
  }
  
  let distortionLikelihood = 0;
  
  if (risks.length > 0) {
    distortionLikelihood = Math.min(0.3 + (risks.length * 0.12), 0.85);
    
    if (risks.includes('possible-gibberish')) {
      distortionLikelihood = Math.max(distortionLikelihood, 0.8);
    }
    
    if (risks.includes('insufficient-context')) {
      if (wordCount === 1) {
        distortionLikelihood += 0.25;
      } else if (wordCount <= 3) {
        distortionLikelihood += 0.15;
      }
    }
    
    if (risks.includes('irony-missed')) {
      distortionLikelihood = Math.max(distortionLikelihood, 0.7);
    }
    
    if (wordCount <= 3 && !isPunctuationOrQuestion(trimmed)) {
      distortionLikelihood += 0.1;
    }
  } else {
    if (wordCount <= 2 && !isPunctuationOrQuestion(trimmed)) {
      distortionLikelihood = 0.3;
      risks.push('insufficient-context');
      specificDoubt = 'brief statement - may need more context';
      hypothesis = 'This is brief — I may be making assumptions about what you mean.';
      confidentInterpretation = 'brief statement - some context needed';
    }
  }
  
  distortionLikelihood = Math.min(Math.max(distortionLikelihood, 0), 0.95);
  
  const riskLevel = distortionLikelihood > 0.7 ? 'high' : 
                    distortionLikelihood > 0.4 ? 'medium' : 'low';
  
  const assessment: MeaningRiskAssessment = {
    risks,
    riskLevel,
    distortionLikelihood: Math.round(distortionLikelihood * 100) / 100,
    specificDoubt: specificDoubt || 'minimal doubt',
    confidentInterpretation
  };
  
  if (hypothesis) assessment.hypothesis = hypothesis;
  return assessment;
}

// ============================================================================
// MINIMAL ASSUMPTIONS
// ============================================================================

function makeMinimalAssumptions(
  input: string, 
  riskAssessment: MeaningRiskAssessment
): XOInterpretation['minimalAssumptions'] {
  
  const wordCount = input.split(/\s+/).length;
  
  if (riskAssessment.risks.includes('possible-gibberish')) {
    return {
      emotionDirection: 'unknown',
      tensionType: 'unknown',
      intentCategory: 'unknown'
    };
  }
  
  if (riskAssessment.risks.length > 0 || wordCount <= 2) {
    const lowerInput = input.toLowerCase();
    
    let emotionDirection: XOInterpretation['minimalAssumptions']['emotionDirection'] = 'unknown';
    let tensionType: XOInterpretation['minimalAssumptions']['tensionType'] = 'unknown';
    let intentCategory: XOInterpretation['minimalAssumptions']['intentCategory'] = 'unknown';
    
    if (/\?$/.test(input)) {
      intentCategory = 'inquire';
    } else if (/!$/.test(input)) {
      intentCategory = 'emphasize';
    } else if (lowerInput.includes('going') || lowerInput.includes('coming') || lowerInput.includes('doing')) {
      intentCategory = 'share';
      tensionType = 'observation';
    } else if (/(kennedy|president|family|brother|sister)/i.test(input)) {
      intentCategory = 'share';
      tensionType = 'reflection';
    } else if (lowerInput.includes('make')) {
      tensionType = 'desire';
    }
    
    return { emotionDirection, tensionType, intentCategory };
  }
  
  let emotionDirection: XOInterpretation['minimalAssumptions']['emotionDirection'] = 'neutral';
  if (/(happy|joy|excited|proud|love|grateful)/i.test(input)) emotionDirection = 'positive';
  else if (/(sad|hurt|disappointed|angry|frustrated)/i.test(input)) emotionDirection = 'negative';
  else if (/(heavy|hard|burden|weight)/i.test(input)) emotionDirection = 'negative';
  else if (/(light|soft|gentle)/i.test(input)) emotionDirection = 'positive';
  else if (/(complex|complicated|mixed)/i.test(input)) emotionDirection = 'layered';
  
  let tensionType: XOInterpretation['minimalAssumptions']['tensionType'] = 'observation';
  if (/(but|however|although|yet)/i.test(input)) tensionType = 'contrast';
  else if (/(wish|could|should|if only)/i.test(input)) tensionType = 'desire';
  else if (/(remember|recall|back then)/i.test(input)) tensionType = 'reflection';
  
  let intentCategory: XOInterpretation['minimalAssumptions']['intentCategory'] = 'share';
  if (/\?$/.test(input)) intentCategory = 'inquire';
  else if (/!$/.test(input)) intentCategory = 'emphasize';
  else if (/^I( think| feel| believe)/i.test(input)) intentCategory = 'reflect';
  
  return { emotionDirection, tensionType, intentCategory };
}

// ============================================================================
// CONFIDENCE CALCULATION
// ============================================================================

function calculateConfidence(
  input: string,
  riskAssessment: MeaningRiskAssessment
): number {
  const wordCount = input.split(/\s+/).length;
  let baseConfidence = 1 - riskAssessment.distortionLikelihood;
  
  if (riskAssessment.risks.includes('possible-gibberish')) {
    baseConfidence *= 0.3;
  } else if (riskAssessment.risks.includes('insufficient-context')) {
    if (wordCount === 1) {
      baseConfidence *= 0.6;
    } else if (wordCount === 2) {
      baseConfidence *= 0.7;
    } else if (wordCount === 3) {
      baseConfidence *= 0.8;
    }
  }
  
  if (isPunctuationOrQuestion(input)) {
    baseConfidence *= 1.1;
  }
  
  return Math.max(0.1, Math.min(baseConfidence, 0.95));
}

// ============================================================================
// CLARIFICATION DECISION
// ============================================================================

function shouldClarify(riskAssessment: MeaningRiskAssessment): boolean {
  const { riskLevel, risks, distortionLikelihood } = riskAssessment;
  
  if (risks.includes('possible-gibberish')) {
    return true;
  }
  
  if (riskLevel === 'high') return true;
  
  if (riskLevel === 'medium') {
    if (risks.includes('irony-missed')) return true;
    if (risks.includes('intent-misinterpretation') && distortionLikelihood > 0.6) return true;
    if (risks.includes('insufficient-context') && distortionLikelihood > 0.5) return true;
    if (risks.includes('positive-negative-ambiguity')) return true;
  }
  
  if (risks.includes('insufficient-context') && distortionLikelihood > 0.4) {
    return true;
  }
  
  return false;
}

// ============================================================================
// CLARIFICATION GENERATION
// ============================================================================

function generateClarification(
  input: string,
  riskAssessment: MeaningRiskAssessment
): { hypothesis: string; correctionInvitation: string; unclearElement: string } | null {
  
  if (riskAssessment.risks.length === 0) return null;
  
  const primaryRisk = riskAssessment.risks[0];
  let hypothesis = riskAssessment.hypothesis;
  let unclearElement = riskAssessment.specificDoubt;
  
  if (!hypothesis) {
    switch (primaryRisk) {
      case 'possible-gibberish': {
        hypothesis = 'I\'m not sure I\'m reading this correctly — could you rephrase or say more about what you mean?';
        unclearElement = 'unclear meaning - possible gibberish';
        break;
      }
      case 'insufficient-context': {
        const wordCount = input.split(/\s+/).length;
        
        if (wordCount === 1) {
          const word = input.trim();
          if (isCommonWord(word.toLowerCase())) {
            hypothesis = `"${word}" could mean many different things — could you say more about what you're referring to?`;
          } else if (/^[A-Z][a-z]+$/.test(word)) {
            hypothesis = `"${word}" might refer to a person, place, or specific concept — could you provide more context?`;
          } else {
            hypothesis = `"${word}" — could you say more about what you mean by this?`;
          }
        } else if (wordCount === 2) {
          hypothesis = `"${input}" — I might be missing what you're pointing to. Could you say more?`;
        } else {
          hypothesis = 'This is brief — I may be making assumptions about what you mean.';
        }
        unclearElement = 'needs more context';
        break;
      }
      case 'intent-misinterpretation': {
        hypothesis = `"${input}" could be interpreted in different ways — could you clarify your intent?`;
        unclearElement = 'unclear intent';
        break;
      }
      case 'emotion-distortion': {
        const wordMatch = input.match(/(heavy|light|hard|soft|cold|warm)/i);
        const word = wordMatch ? wordMatch[0] : 'this';
        hypothesis = `I might be reading "${word}" as a particular quality — adjust me if that's off.`;
        break;
      }
      case 'irony-missed': {
        const snippet = input.substring(0, Math.min(40, input.length));
        hypothesis = `I might be missing a particular tone in "${snippet}...".`;
        unclearElement = 'possible irony';
        break;
      }
      case 'positive-negative-ambiguity': {
        hypothesis = 'I might be misreading the overall emotional direction.';
        unclearElement = 'mixed emotional signals';
        break;
      }
      case 'literal-vs-metaphor': {
        const metaphorMatch = input.match(/(heart|mind|wave|storm)\s+(of|in|on)/i);
        const phrase = metaphorMatch ? metaphorMatch[0] : 'this language';
        hypothesis = `I might be taking "${phrase}" too literally.`;
        break;
      }
      case 'tension-overlook': {
        const contrastWord = input.match(/(but|however|although|yet)/i)?.[0] || 'the contrast';
        hypothesis = `I might be misreading what sits on either side of "${contrastWord}".`;
        break;
      }
      default: {
        hypothesis = 'I might be reading this in a particular way — adjust me if needed.';
      }
    }
  }
  
  let correctionInvitation = "If that's off, adjust me.";
  
  if (primaryRisk === 'possible-gibberish') {
    correctionInvitation = "If this wasn't what you meant, please rephrase.";
  } else if (primaryRisk === 'insufficient-context') {
    correctionInvitation = "Could you say more about what you mean?";
  }
  
  return {
    hypothesis,
    correctionInvitation,
    unclearElement: unclearElement || riskAssessment.specificDoubt
  };
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
        input.split(/\s+/).length <= 3) {
      
      const { confidentInterpretation, specificDoubt } = interpretation.riskAssessment;
      
      if (specificDoubt.includes('single word')) {
        const word = input.trim();
        return `I hear "${word}" but I'm not sure what you're pointing to.`;
      } else if (specificDoubt.includes('short phrase')) {
        return `I hear "${input}" but I might be missing the context.`;
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

Generate a brief, natural-sounding summary of what you understand so far. Example: "It sounds like you're reacting with humor and cynicism to product reviews, and you're curious how a washing machine brand might tell stories that feel warm, reliable, and grounded—appealing to someone who feels the world can be harsh but still values comfort and partnership."

Keep it under 2 sentences.`
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
    
    const { confidentInterpretation } = interpretation.riskAssessment;
    const snippet = input.substring(0, Math.min(50, input.length));
    
    if (snippet.length < input.length) {
      return `I hear "${confidentInterpretation}" in "${snippet}..." but I'm proceeding cautiously.`;
    } else {
      return `I hear "${confidentInterpretation}" in "${snippet}" but I'm proceeding cautiously.`;
    }
  }
}

// ============================================================================
// CONTRACT CREATION ENGINE
// ============================================================================

async function createMeaningContract(
  input: string,
  interpretation: XOInterpretation,
  aiInterpretation: Partial<XOInterpretation> = {}
): Promise<MeaningContract> {
  const { riskAssessment, confidence, minimalAssumptions, seedMoment } = interpretation;
  
  // Detect market and entry path
  const detectedMarket = detectMarketFromInput(input);
  const detectedEntryPath = detectEntryPath(input);
  
  // Determine certainty mode based on confidence and risks
  let certaintyMode: MeaningContract['certaintyMode'] = 'clarification-needed';
  let safeToNarrate = false;
  
  if (riskAssessment.risks.includes('possible-gibberish')) {
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
  }
  
  // Determine core theme
  const coreTheme = determineCoreTheme(
    aiInterpretation.coreTension || interpretation.coreTension,
    emotionalState
  );
  
  // Generate understanding summary if safeToNarrate is false
  let understandingSummary: string | undefined;
  if (!safeToNarrate) {
    understandingSummary = await generateUnderstandingSummary(input, interpretation, aiInterpretation);
  }
  
  // Build the contract
  const contract: MeaningContract = {
    interpretedMeaning: {
      emotionalState,
      emotionalDirection,
      narrativeTension: aiInterpretation.coreTension || interpretation.coreTension || 'unresolved dynamic',
      intentCategory,
      coreTheme
    },
    // NEW: Add market context and entry path
    marketContext: {
      market: detectedMarket,
      language: 'english',
      register: 'casual' as const
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
  
  // Add understanding summary if we have one
  if (understandingSummary) {
    contract.understandingSummary = understandingSummary;
  }
  
  return contract;
}

// Helper: Derive core theme from tension and emotion
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
    } else if (primaryRisk === 'insufficient-context') {
      const wordCount = interpretation.seedMoment.split(/\s+/).length;
      if (wordCount === 1) {
        return `"${interpretation.seedMoment}" — could you say more about what you mean?`;
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
// AI INTERPRETATION
// ============================================================================

async function getAIIntepretation(input: string): Promise<Partial<XOInterpretation>> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Extract meaning only, no prescription.

Return JSON:
{
  "coreTension": "push/pull (be tentative)",
  "emotionalWeight": "feeling (be tentative)",
  "intentSummary": "why shared (be tentative)"
}

Use "seems like", "might be", "could be".`
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
    const { userInput } = body;
    
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
    
    // 1. Detect risks
    const riskAssessment = detectMeaningRisks(trimmedInput);
    
    // 2. Decide if clarification is needed
    const needsClarification = shouldClarify(riskAssessment);
    
    // 3. Make minimal assumptions
    const minimalAssumptions = makeMinimalAssumptions(trimmedInput, riskAssessment);
    
    // 4. Calculate confidence
    const confidence = calculateConfidence(trimmedInput, riskAssessment);
    
    // 5. Build interpretation
    let interpretation: XOInterpretation;
    let understandingSummary: string | undefined;
    
    if (needsClarification) {
      // Defer full interpretation
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
      // Get AI interpretation when safe
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
      
      // CREATE THE ENHANCED MEANING CONTRACT
      if (!riskAssessment.risks.includes('possible-gibberish')) {
        interpretation.meaningContract = await createMeaningContract(trimmedInput, interpretation, aiInterpretation);
        
        // Extract understanding summary from contract if available
        if (interpretation.meaningContract?.understandingSummary) {
          understandingSummary = interpretation.meaningContract.understandingSummary;
        }
      }
    }
    
    // 6. Generate clarification if needed
    const clarification = needsClarification 
      ? generateClarification(trimmedInput, riskAssessment)
      : undefined;
    
    // 7. Generate preview
    const understandingPreview = generatePreview(interpretation, needsClarification);
    
    // 8. Build response
    const response: XOCCNResponse = {
      success: true,
      interpretation,
      needsClarification,
      clarification,
      understandingPreview
    };
    
    // Add understanding summary to response if available
    if (understandingSummary) {
      response.understandingSummary = understandingSummary;
    }
    
    console.log(`[CLARIFY] ${needsClarification ? 'NEEDS clarification' : 'PROCEEDING with contract'}`);
    console.log(`[CLARIFY] Confidence: ${confidence}, Risk: ${riskAssessment.riskLevel}`);
    console.log(`[CLARIFY] Risks: ${riskAssessment.risks.join(', ')}`);
    console.log(`[CLARIFY] Market: ${interpretation.meaningContract?.marketContext?.market || 'not detected'}`);
    console.log(`[CLARIFY] Entry path: ${interpretation.meaningContract?.entryPath || 'seed'}`);
    console.log(`[CLARIFY] Safe to narrate: ${interpretation.meaningContract?.safeToNarrate ?? 'no contract'}`);
    
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

// ============================================================================
// HELPER FUNCTIONS
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