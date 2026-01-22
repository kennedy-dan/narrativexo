// /api/clarify/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ============================================================================
// EXPLICIT MEANING CONTRACT TYPES
// ============================================================================

export type MeaningRisk = 
  | 'emotion-distortion'
  | 'intent-misinterpretation'
  | 'context-assumption'
  | 'tension-overlook'
  | 'literal-vs-metaphor'
  | 'irony-missed'
  | 'positive-negative-ambiguity'
  | 'insufficient-context';

export interface MeaningRiskAssessment {
  risks: MeaningRisk[];
  riskLevel: 'low' | 'medium' | 'high';
  distortionLikelihood: number;
  specificDoubt: string;
  confidentInterpretation: string;
  hypothesis?: string;
}

// THE MEANING CONTRACT - Explicit semantic payload
export interface MeaningContract {
  // Interpreted meaning (when we commit)
  interpretedMeaning: {
    emotionalState: 'positive' | 'negative' | 'neutral' | 'layered' | 'complex' | 'ambiguous';
    emotionalDirection: 'inward' | 'outward' | 'observational' | 'relational' | 'unknown';
    narrativeTension: string;
    intentCategory: 'share' | 'inquire' | 'emphasize' | 'reflect' | 'process' | 'express' | 'connect';
    coreTheme: string;
  };
  
  // Confidence & commitment level
  confidence: number;
  certaintyMode: 'tentative-commit' | 'reflection-only' | 'clarification-needed';
  
  // Safety properties
  reversible: boolean;
  safeToNarrate: boolean;
  
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
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS FOR AMBIGUITY DETECTION
// ============================================================================

function calculateGibberishScore(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  
  // Check for obvious gibberish patterns
  const hasConsonantClusters = /([bcdfghjklmnpqrstvwxyz]{4,})/i.test(text);
  const hasRepeatingNonsense = /(.)\1{3,}/.test(text);
  
  // Common words dictionary
  const commonWords = new Set([
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'the', 'a', 'an', 'and', 'but', 'or', 'nor', 'in', 'on',
    'at', 'to', 'for', 'of', 'with', 'by', 'as', 'from', 'up', 'down', 'out', 'off',
    'over', 'under', 'yes', 'no', 'ok', 'okay', 'hi', 'hello', 'hey', 'well', 'so',
    'then', 'now', 'just', 'very', 'too', 'also', 'only', 'not', 'can', 'will', 'would',
    'could', 'should', 'may', 'might', 'must'
  ]);
  
  let realWordCount = 0;
  for (const word of words) {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (commonWords.has(cleanWord) || /^[a-z]{2,}$/.test(cleanWord)) {
      realWordCount++;
    }
  }
  
  const realWordRatio = words.length > 0 ? realWordCount / words.length : 0;
  
  let score = 0;
  if (hasConsonantClusters) score += 0.3;
  if (hasRepeatingNonsense) score += 0.3;
  if (realWordRatio < 0.3 && words.length > 1) score += 0.4;
  
  return Math.min(score, 1);
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
    'hey', 'going', 'coming', 'doing', 'being', 'having', 'making', 'taking', 'got'
  ]);
  
  return commonWords.has(word.toLowerCase());
}

function detectInsufficientInformation(text: string, wordCount: number): boolean {
  if (wordCount <= 2 && !isPunctuationOrQuestion(text)) {
    return true;
  }
  
  // Just a name or single noun
  if (wordCount === 1 && /^[A-Z][a-z]+$/.test(text) && !isCommonWord(text)) {
    return true;
  }
  
  // Just an action without context
  if (wordCount <= 3 && /^(going to|coming from|doing|making|taking|got to|have to)/i.test(text)) {
    return true;
  }
  
  return false;
}

// ============================================================================
// RISK DETECTION
// ============================================================================

function detectMeaningRisks(input: string): MeaningRiskAssessment {
  const risks: MeaningRisk[] = [];
  let specificDoubt = '';
  let confidentInterpretation = '';
  let hypothesis: string | undefined;
  
  const trimmed = input.trim();
  const lowerInput = trimmed.toLowerCase();
  const words = lowerInput.split(/\s+/);
  const wordCount = words.length;
  
  // === INHERENT AMBIGUITY DETECTION ===
  
  // 1. Detect nonsense/gibberish
  const gibberishScore = calculateGibberishScore(trimmed);
  if (gibberishScore > 0.7) {
    risks.push('intent-misinterpretation');
    specificDoubt = 'possible gibberish or unclear meaning';
    hypothesis = 'This needs some clarification';
    confidentInterpretation = 'unclear meaning - may be gibberish';
  }
  
  // 2. Detect insufficient information
  const isInsufficient = detectInsufficientInformation(trimmed, wordCount);
  if (isInsufficient && !specificDoubt) {
    risks.push('insufficient-context');
    specificDoubt = 'insufficient context for clear interpretation';
    hypothesis = 'This needs some clarification';
    confidentInterpretation = 'brief statement - context needed';
  }
  
  // 3. Single word/phrase with no clear intent
  if (wordCount <= 3 && !isPunctuationOrQuestion(trimmed) && risks.length === 0) {
    const isActionWord = /^(going|coming|doing|being|having|making|taking|got)/i.test(trimmed);
    const isName = /^[A-Z][a-z]+$/.test(trimmed) && !isCommonWord(trimmed);
    
    if (isActionWord || isName) {
      risks.push('intent-misinterpretation');
      specificDoubt = 'single word/phrase with unclear intent';
      hypothesis = `"${trimmed}" could mean many things — I may be missing what you're pointing to.`;
      confidentInterpretation = 'minimal content - hard to interpret';
    }
  }
  
  // === PATTERN-BASED DETECTION ===
  
  if (risks.length === 0) {
    // Emotion ambiguity
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
    
    // Irony detection
    if (/(perfect|great|wonderful)\s+(?!day|news|work|job|effort)/i.test(input)) {
      const match = input.match(/(perfect|great|wonderful)\s+\w+/i);
      if (match) {
        risks.push('irony-missed');
        specificDoubt = 'possible irony or sarcasm';
        hypothesis = `I might be missing irony in "${match[0]}".`;
      }
    }
    
    // Positive-negative ambiguity
    const hasPositive = /(good|great|nice|positive|better)/i.test(input);
    const hasNegative = /(bad|hard|difficult|negative|worse)/i.test(input);
    const hasBut = /\s+but\s+/i.test(input);
    
    if (hasPositive && hasNegative && !hasBut && input.length > 10) {
      risks.push('positive-negative-ambiguity');
      specificDoubt = 'mixed positive and negative signals';
      hypothesis = 'I might be misreading the overall emotional direction.';
    }
    
    // Metaphor detection
    const metaphorMatch = input.match(/(heart|mind|wave|storm|weight|light)\s+(of|in|on|for)/i);
    if (metaphorMatch && input.length < 40) {
      risks.push('literal-vs-metaphor');
      specificDoubt = 'possible figurative language';
      hypothesis = `I might be taking "${metaphorMatch[0]}" too literally.`;
    }
    
    // Tension detection
    const contrastMatch = input.match(/(but|however|although|yet|though)\s+/i);
    if (contrastMatch && !confidentInterpretation.includes('positive') && !confidentInterpretation.includes('negative')) {
      risks.push('tension-overlook');
      specificDoubt = 'contrast without clear emotional stance';
      hypothesis = `I might be misreading what sits on either side of "${contrastMatch[0]}".`;
    }
  }
  
  // === CONFIDENT INTERPRETATION ===
  if (!confidentInterpretation) {
    if (/(happy|joy|excited|proud|love|grateful|delighted)/i.test(input)) {
      confidentInterpretation = 'positive emotional tone';
    } else if (/(sad|hurt|disappointed|angry|frustrated|annoyed|upset)/i.test(input)) {
      confidentInterpretation = 'negative emotional tone';
    } else if (/\?$/.test(input)) {
      confidentInterpretation = 'inquiry intent';
    } else if (/!$/.test(input)) {
      confidentInterpretation = 'emphatic expression';
    } else {
      if (wordCount <= 3) {
        confidentInterpretation = 'brief statement - context needed';
      } else {
        confidentInterpretation = 'neutral observation';
      }
    }
  }
  
  // === DISTORTION LIKELIHOOD CALCULATION ===
  let distortionLikelihood = 0;
  
  if (risks.length > 0) {
    distortionLikelihood = Math.min(0.3 + (risks.length * 0.15), 0.85);
    
    // Penalty for short/ambiguous inputs
    if (wordCount <= 3 && !isPunctuationOrQuestion(trimmed)) {
      distortionLikelihood += 0.2;
    }
    
    // High penalty for potential gibberish
    if (gibberishScore > 0.7) {
      distortionLikelihood = Math.max(distortionLikelihood, 0.8);
    }
    
    if (risks.includes('irony-missed')) {
      distortionLikelihood = Math.max(distortionLikelihood, 0.7);
    }
  } else {
    // NO DETECTED RISKS - but still might be ambiguous
    if (wordCount <= 2 && !isPunctuationOrQuestion(trimmed)) {
      distortionLikelihood = 0.4;
      risks.push('insufficient-context');
      specificDoubt = 'brief statement - may need more context';
      hypothesis = 'This is brief — I may be making assumptions about what you mean.';
      confidentInterpretation = 'brief statement - context needed';
    }
  }
  
  // Ensure distortion likelihood has a floor for very short inputs
  if (wordCount === 1 && !isPunctuationOrQuestion(trimmed)) {
    distortionLikelihood = Math.max(distortionLikelihood, 0.5);
  }
  
  distortionLikelihood = Math.min(distortionLikelihood, 0.95);
  
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
  
  // Default to unknown if there are ANY risks or if input is very short
  if (riskAssessment.risks.length > 0 || wordCount <= 2) {
    return {
      emotionDirection: 'unknown',
      tensionType: 'unknown',
      intentCategory: 'unknown'
    };
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
// CLARIFICATION DECISION
// ============================================================================

function shouldClarify(riskAssessment: MeaningRiskAssessment): boolean {
  const { riskLevel, risks, distortionLikelihood } = riskAssessment;
  
  if (riskLevel === 'high') return true;
  
  if (riskLevel === 'medium') {
    if (risks.includes('irony-missed')) return true;
    if (risks.includes('intent-misinterpretation') && distortionLikelihood > 0.6) return true;
    if (risks.includes('insufficient-context') && distortionLikelihood > 0.5) return true;
    if (risks.includes('positive-negative-ambiguity')) return true;
  }
  
  // Always clarify for gibberish
  if (riskAssessment.confidentInterpretation.includes('gibberish')) {
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
      case 'insufficient-context':
      case 'intent-misinterpretation': {
        if (riskAssessment.confidentInterpretation.includes('gibberish')) {
          hypothesis = 'I might not be reading this correctly — could you rephrase or say more?';
          unclearElement = 'unclear meaning';
        } else {
          hypothesis = `"${input}" could mean many things — could you say more about what you mean?`;
          unclearElement = 'multiple possible meanings';
        }
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
  
  return {
    hypothesis,
    correctionInvitation: "If that's off, adjust me.",
    unclearElement
  };
}

// ============================================================================
// CONTRACT CREATION ENGINE
// ============================================================================

function createMeaningContract(
  interpretation: XOInterpretation,
  aiInterpretation: Partial<XOInterpretation> = {}
): MeaningContract {
  const { riskAssessment, confidence, minimalAssumptions, seedMoment } = interpretation;
  
  // Determine certainty mode based on confidence and risks
  let certaintyMode: MeaningContract['certaintyMode'] = 'clarification-needed';
  let safeToNarrate = false;
  
  if (confidence >= 0.7 && riskAssessment.riskLevel === 'low') {
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
  
  // Build the contract
  const contract: MeaningContract = {
    interpretedMeaning: {
      emotionalState,
      emotionalDirection,
      narrativeTension: aiInterpretation.coreTension || interpretation.coreTension || 'unresolved dynamic',
      intentCategory,
      coreTheme
    },
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
    seedMoment
  };
  
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
    return "I might be reading this in a particular way.";
  }
  
  if (interpretation.meaningContract) {
    const contract = interpretation.meaningContract;
    if (contract.certaintyMode === 'reflection-only') {
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
    
    // Ensure tentativeness
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
    
    // 4. Calculate confidence (with penalties for short/ambiguous inputs)
    let baseConfidence = 1 - riskAssessment.distortionLikelihood;
    const wordCount = trimmedInput.split(/\s+/).length;
    
    if (wordCount <= 2 && !isPunctuationOrQuestion(trimmedInput)) {
      baseConfidence *= 0.7; // Reduce confidence by 30% for very short inputs
    }
    
    if (riskAssessment.confidentInterpretation.includes('brief') || 
        riskAssessment.confidentInterpretation.includes('context needed')) {
      baseConfidence *= 0.8;
    }
    
    const confidence = Math.max(0.1, Math.min(baseConfidence, 0.95));
    
    // 5. Build interpretation
    let interpretation: XOInterpretation;
    
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
      
      // CREATE THE MEANING CONTRACT
      interpretation.meaningContract = createMeaningContract(interpretation, aiInterpretation);
    }
    
    // 6. Generate clarification if needed
    const clarification = needsClarification 
      ? generateClarification(trimmedInput, riskAssessment)
      : undefined;
    
    // 7. Generate preview
    const understandingPreview = generatePreview(interpretation, needsClarification);
    
    // 8. Return response
    const response: XOCCNResponse = {
      success: true,
      interpretation,
      needsClarification,
      clarification,
      understandingPreview
    };
    
    console.log(`[CLARIFY] ${needsClarification ? 'NEEDS clarification' : 'PROCEEDING with contract'}`);
    console.log(`[CLARIFY] Confidence: ${confidence}, Risk: ${riskAssessment.riskLevel}`);
    
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

// ============================================================================
// TYPE EXPORTS FOR DOWNSTREAM SYSTEMS
// ============================================================================

export { createMeaningContract };