import { OpenAI } from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';
import { CCNResponseRevised } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ============================================================================
// INPUT VALIDATION & QUALITY ASSESSMENT
// ============================================================================

// Helper: Calculate input quality score (0-1)
function calculateInputQuality(input: string): number {
  if (!input || input.trim().length === 0) return 0;
  
  const trimmed = input.trim();
  const words = trimmed.split(/\s+/).filter(word => word.length > 0);
  
  // Very brief input (single word or short phrase)
  if (words.length <= 2) {
    // Check if it's a complete thought
    const isCompleteThought = /[.!?]$/.test(trimmed) || 
      trimmed.toLowerCase().includes('i ') ||
      trimmed.toLowerCase().includes('my ') ||
      trimmed.toLowerCase().includes('we ') ||
      trimmed.length > 20;
    
    return isCompleteThought ? 0.3 : 0.1;
  }
  
  // Base score from word count (sigmoid curve)
  const wordScore = 1 / (1 + Math.exp(-(words.length - 5) / 3));
  
  // Penalize for very short words
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  const lengthScore = Math.min(avgWordLength / 6, 1);
  
  // Check for meaningful content vs filler words
  const fillerWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were']);
  const meaningfulWords = words.filter(word => 
    !fillerWords.has(word.toLowerCase()) && 
    word.length > 2
  );
  const meaningfulScore = Math.min(meaningfulWords.length / Math.max(words.length, 1), 1);
  
  // Syntactic completeness (has subject and verb)
  const hasSubjectVerb = /(I|we|you|he|she|it|they|this|that)\s+(am|is|are|was|were|have|has|had|do|does|did|will|would|can|could|should|must)/i.test(trimmed) ||
    trimmed.includes(' ') && trimmed.length > 15;
  
  const completenessScore = hasSubjectVerb ? 1 : 0.5;
  
  // Final score (weighted average)
  const finalScore = (wordScore * 0.3) + (lengthScore * 0.2) + (meaningfulScore * 0.3) + (completenessScore * 0.2);
  
  return Math.min(Math.max(finalScore, 0.1), 0.95); // Clamp between 0.1 and 0.95
}

// Helper: Create low-confidence fallback for insufficient input
function createLowConfidenceFallback(input: string, qualityScore: number): CCNResponseRevised {
  const confidence = Math.max(0.1, qualityScore * 0.4); // Scale confidence with quality
  
  // Determine if we should ask for clarification
  const needsClarification = qualityScore < 0.4 || input.length < 10;
  
  return {
    success: true,
    interpretation: {
      pathway: "assumption-first",
      baselineStance: qualityScore < 0.3 ? 
        "insufficient context - please provide more details" : 
        "general, practical perspective",
      toneConstraints: qualityScore < 0.3 ? 
        ["neutral", "generic"] : 
        ["practical", "straightforward"],
      prohibitions: qualityScore < 0.3 ? 
        ["cannot determine without more context"] : 
        ["overly emotional language", "exaggeration"],
      audience: qualityScore < 0.3 ? 
        "cannot determine audience with current input" : 
        "general audience",
      intentSummary: qualityScore < 0.3 ? 
        "Please provide more details about what you're trying to express." : 
        `Express "${input}" in a practical way.`,
      hasBrandContext: false,
      productCategory: null,
      confidence: confidence,
      confidenceScores: {
        pathway: confidence,
        stance: confidence,
        tone: confidence,
        audience: confidence
      },
      emotion: "neutral",
      scene: qualityScore < 0.3 ? "insufficient context" : "general context",
      seedMoment: input,
      understandingPreview: qualityScore < 0.3 ? 
        "I need more information to understand your intent. Could you please elaborate?" : 
        `Based on limited input: "${input}".`,
      rawAnalysis: qualityScore < 0.3 ? 
        `Input too brief: "${input}". Please provide more context.` : 
        `Minimal input: "${input}". Keeping tone neutral and practical.`,
      inferredNeed: qualityScore < 0.3 ? "more information required" : "practical expression",
      inferredArchetype: qualityScore < 0.3 ? "Undetermined" : "Generic Narrator",
      inferredTone: "Neutral",
      inferredContext: qualityScore < 0.3 ? "Need more details" : "General communication",
      clarifications: []
    },
    requiresClarification: needsClarification,
    clarificationQuestion: needsClarification ? {
      question: "Could you tell me more about what you're trying to express?",
      field: "intent"
    } : null,
    understandingPreview: qualityScore < 0.3 ? 
      "I need more information to understand your intent. Could you please elaborate?" : 
      `Based on limited input: "${input}".`
  };
}

// Helper: Detect if input is likely a brand/product context
function detectBrandContext(input: string): { hasBrandContext: boolean; productCategory: string | null } {
  const lowerInput = input.toLowerCase();
  
  // Common brand/product indicators
  const brandIndicators = [
    'brand', 'company', 'business', 'organization', 'startup', 'enterprise',
    'product', 'service', 'offering', 'solution',
    'marketing', 'campaign', 'advert', 'commercial', 'promotion',
    'sell', 'selling', 'sales', 'promote', 'advertise',
    'customer', 'client', 'consumer', 'audience', 'target market',
    'launch', 'release', 'introduce', 'announce'
  ];
  
  const hasBrand = brandIndicators.some(indicator => lowerInput.includes(indicator));
  
  // Product categories
  const productCategories = [
    { terms: ['appliance', 'washing machine', 'refrigerator', 'oven', 'dishwasher'], category: 'home appliance' },
    { terms: ['car', 'vehicle', 'automobile', 'truck', 'suv'], category: 'automotive' },
    { terms: ['phone', 'smartphone', 'mobile', 'device'], category: 'electronics' },
    { terms: ['laptop', 'computer', 'tablet', 'tech'], category: 'computers' },
    { terms: ['software', 'app', 'application', 'platform', 'saas'], category: 'software' },
    { terms: ['shoes', 'clothing', 'apparel', 'fashion', 'wear'], category: 'fashion' },
    { terms: ['food', 'restaurant', 'meal', 'recipe', 'ingredient'], category: 'food & beverage' },
    { terms: ['service', 'consulting', 'agency', 'firm'], category: 'professional services' }
  ];
  
  let productCategory: string | null = null;
  for (const category of productCategories) {
    if (category.terms.some(term => lowerInput.includes(term))) {
      productCategory = category.category;
      break;
    }
  }
  
  return { hasBrandContext: hasBrand, productCategory };
}

// ============================================================================
// AI-POWERED TONE ANALYSIS (Only for sufficient input)
// ============================================================================

async function performToneFocusedExtraction(userInput: string, qualityScore: number) {
  // Adjust temperature based on input quality
  const temperature = qualityScore < 0.5 ? 0.7 : 0.3;
  
  const prompt = `
CRITICAL CONTEXT: Input quality score: ${qualityScore.toFixed(2)} (0=low, 1=high)

USER INPUT:
"${userInput}"

ANALYSIS INSTRUCTIONS:

1. FIRST, ASSESS INPUT SUFFICIENCY:
- If input is very brief (< 3 meaningful words) or unclear, RETURN GENERIC CONSTRAINTS
- Only provide specific constraints if input clearly indicates tone requirements
- When uncertain, err on the side of generic/neutral

2. TONE CONSTRAINT IDENTIFICATION (Only if clear from input):
- What tone MUST the story maintain?
- Base this ONLY on explicit language in the input
- Examples: "don't sound corporate" → ["casual", "authentic"], "serious topic" → ["respectful", "measured"]

3. PROHIBITION IDENTIFICATION (Only if clear from input):
- What MUST the story ABSOLUTELY AVOID?
- Only list prohibitions if explicitly mentioned or strongly implied
- Examples: "no fluff" → ["flowery language", "exaggeration"]

4. CONFIDENCE SCORING:
- Pathway confidence: How clear is the entry point?
- Stance confidence: How clear is the audience perspective?
- Tone confidence: How clear are the tone requirements?
- Audience confidence: How clear is the target audience?
- Scale: 0.1 (completely guessing) to 0.9 (very clear)

5. CRITICAL RULES:
- NO fabricating constraints from insufficient input
- If input is vague, return generic/neutral constraints
- Confidence scores MUST reflect input clarity
- When in doubt, lower all confidence scores

Return ONLY valid JSON in this structure:
{
  "pathway": "assumption-first" | "constraint-first" | "audience-first" | "function-first",
  "baselineStance": "string describing audience starting point (be realistic)",
  "toneConstraints": ["array", "of", "tone", "elements"] or ["neutral", "generic"] if unclear,
  "prohibitions": ["array", "of", "forbidden", "elements"] or ["overly emotional"] if unclear,
  "audience": "realistic audience description based on input",
  "intentSummary": "1-2 sentence summary that reflects input specificity",
  "hasBrandContext": false,
  "productCategory": null,
  "confidence": 0.XX,
  "confidenceScores": {
    "pathway": 0.XX,
    "stance": 0.XX,
    "tone": 0.XX,
    "audience": 0.XX
  }
}

IMPORTANT: If input is just "${userInput}" (${userInput.split(/\s+/).length} words), 
be EXTREMELY conservative with constraints and confidence.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are a conservative tone analysis engine. You prioritize accuracy over specificity.

RULES:
1. Only extract constraints that are CLEARLY indicated in the input
2. For brief/vague input, return generic/neutral constraints
3. Confidence scores MUST reflect input clarity (0.1-0.9)
4. Never fabricate specific constraints from insufficient input
5. When uncertain, say "generic" or "neutral"
6. Base everything ONLY on what the user actually said`
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: temperature,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No content returned from OpenAI');
    
    const parsed = JSON.parse(content);
    
    // Validate and adjust confidence based on input quality
    const maxConfidence = Math.min(0.9, qualityScore * 1.2); // Cap confidence based on quality
    parsed.confidence = Math.min(parsed.confidence || 0.5, maxConfidence);
    
    // Adjust individual scores
    if (parsed.confidenceScores) {
      Object.keys(parsed.confidenceScores).forEach(key => {
        parsed.confidenceScores[key] = Math.min(parsed.confidenceScores[key], maxConfidence);
      });
    }
    
    // Detect brand context
    const brandInfo = detectBrandContext(userInput);
    parsed.hasBrandContext = brandInfo.hasBrandContext;
    parsed.productCategory = brandInfo.productCategory;
    
    return parsed;
  } catch (error) {
    console.error('Tone extraction error:', error);
    throw error;
  }
}

// Helper: Generate appropriate preview
function generateTonePreview(interpretation: any, input: string): string {
  const wordCount = input.split(/\s+/).length;
  
  if (wordCount <= 2) {
    return `Based on brief input: "${input}". More details would help.`;
  }
  
  if (interpretation.confidence < 0.4) {
    return `I'm not entirely sure about your intent with "${input}". Could you elaborate?`;
  }
  
  const constraints = interpretation.toneConstraints?.join(', ') || 'neutral';
  const prohibitions = interpretation.prohibitions?.[0] || 'overly emotional language';
  
  return `Using ${constraints} tone. Avoiding ${prohibitions}.`;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CCNResponseRevised | { error: string }>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      userInput, 
      isClarificationResponse = false,
      previousClarification,
      previousAnswer 
    } = req.body;

    // Validate request body
    if (!userInput || typeof userInput !== 'string') {
      return res.status(400).json({ 
        error: 'Valid user input is required' 
      });
    }

    const trimmedInput = userInput.trim();
    
    // Reject empty input
    if (trimmedInput.length === 0) {
      return res.status(400).json({ 
        error: 'Input cannot be empty' 
      });
    }

    // Calculate input quality
    const qualityScore = calculateInputQuality(trimmedInput);
    
    console.log(`Input: "${trimmedInput}" (${trimmedInput.length} chars, ${trimmedInput.split(/\s+/).length} words) - Quality: ${qualityScore.toFixed(2)}`);

    // For very low quality input, return immediate fallback
    if (qualityScore < 0.2) {
      console.log('Very low quality input, returning generic fallback');
      return res.status(200).json(createLowConfidenceFallback(trimmedInput, qualityScore));
    }

    // Combine with clarification if provided
    const combinedInput = previousClarification && previousAnswer 
      ? `${trimmedInput} (Regarding ${previousClarification}: ${previousAnswer})`
      : trimmedInput;

    // For moderate quality input (0.2-0.5), consider using AI but with caution
    let interpretation;
    if (qualityScore >= 0.3) {
      try {
        interpretation = await performToneFocusedExtraction(combinedInput, qualityScore);
      } catch (aiError) {
        console.error('AI analysis failed, using fallback:', aiError);
        interpretation = createLowConfidenceFallback(trimmedInput, qualityScore).interpretation;
      }
    } else {
      // For low quality but not terrible input, use conservative analysis
      interpretation = createLowConfidenceFallback(trimmedInput, qualityScore).interpretation;
    }

    // Generate preview
    const understandingPreview = generateTonePreview(interpretation, trimmedInput);
    
    // Determine if clarification is needed
    const needsClarification = qualityScore < 0.4 || interpretation.confidence < 0.5;
    
    // Prepare response
    const response: CCNResponseRevised = {
      success: true,
      interpretation: {
        ...interpretation,
        // Ensure legacy fields are populated
        emotion: interpretation.toneConstraints?.join(', ') || 'neutral',
        scene: interpretation.scene || 'general context',
        seedMoment: trimmedInput,
        audience: interpretation.audience,
        intentSummary: interpretation.intentSummary,
        confidence: interpretation.confidence,
        confidenceScores: interpretation.confidenceScores || {
          pathway: interpretation.confidence,
          stance: interpretation.confidence,
          tone: interpretation.confidence,
          audience: interpretation.confidence
        },
        understandingPreview,
        rawAnalysis: interpretation.rawAnalysis || `Analysis based on: "${trimmedInput}"`,
        inferredNeed: 'tone-appropriate expression',
        inferredArchetype: interpretation.toneConstraints?.includes('generic') ? 'Generic Narrator' : 'Practical Narrator',
        inferredTone: interpretation.toneConstraints?.[0] || 'Neutral',
        inferredContext: interpretation.intentSummary,
        clarifications: []
      },
      requiresClarification: needsClarification,
      clarificationQuestion: needsClarification ? {
        question: "Could you tell me more about what you're trying to express?",
        field: "intent"
      } : null,
      understandingPreview
    };

    console.log(`Analysis complete - Confidence: ${interpretation.confidence}, Clarification needed: ${needsClarification}`);

    return res.status(200).json(response);

  } catch (error) {
    console.error('CCN analysis error:', error);
    
    // Return a safe, low-confidence fallback for any unexpected errors
    const safeFallback = createLowConfidenceFallback(
      req.body?.userInput?.substring(0, 50) || 'unknown input', 
      0.1
    );
    
    return res.status(200).json(safeFallback);
  }
}