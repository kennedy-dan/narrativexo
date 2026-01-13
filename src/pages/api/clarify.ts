import { OpenAI } from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';
import { CCNResponseRevised, Market } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CCNResponseRevised | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      userInput, 
      market = 'ng',
      isClarificationResponse = false, // NEW: Whether this is a response to a clarification question
      previousClarification,
      previousAnswer 
    } = req.body;

    if (!userInput || userInput.trim().length < 3) {
      return res.status(400).json({
        success: false,
        interpretation: createFallbackInterpretation(market as Market, "Input too short"),
        requiresClarification: false, // Don't ask for clarification on short input
        understandingPreview: "Please describe your moment with more detail."
      });
    }

    // Combine input with clarification answer if provided
    const combinedInput = previousClarification && previousAnswer 
      ? `${userInput} (Regarding ${previousClarification}: ${previousAnswer})`
      : userInput;

    // Perform semantic extraction
    const interpretation = await performSemanticExtraction(combinedInput, market as Market);
    
    // Calculate overall confidence
    const confidenceScores = Object.values(interpretation.confidenceScores || {}) as number[];
    const overallConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
      : 0.5;
    
    interpretation.confidence = overallConfidence;
    
    // KEY LOGIC: Only ask for clarification ONCE, and only on the initial input
    // If this is a clarification response (user answered our question), we MUST show understanding preview
    const requiresClarification = !isClarificationResponse && overallConfidence < 0.7;
    
    // ALWAYS generate understanding preview
    let understandingPreview = generateUnderstandingPreview(interpretation, overallConfidence);
    
    const response: CCNResponseRevised = {
      success: true,
      interpretation: {
        ...interpretation,
        confidence: overallConfidence,
        market: market as Market,
        understandingPreview,
        // Backward compatibility
        inferredNeed: interpretation.emotion || "Personal Experience",
        inferredArchetype: determineArchetypeFromPathway(interpretation.pathway),
        inferredTone: determineToneFromEmotion(interpretation.emotion),
        inferredContext: interpretation.intentSummary,
        clarifications: requiresClarification ? [{
          question: interpretation.clarificationQuestion?.question || "Could you tell me more?",
          options: getOptionsForField(interpretation.clarificationQuestion?.field || "emotion"),
          field: mapFieldToLegacy(interpretation.clarificationQuestion?.field || "emotion")
        }] : []
      },
      requiresClarification,
      clarificationQuestion: requiresClarification ? interpretation.clarificationQuestion || {
        question: "Could you tell me more about what you're feeling or experiencing?",
        field: "emotion"
      } : null,
      understandingPreview
    };

    console.log(`✅ CCN analysis: Confidence=${overallConfidence.toFixed(2)}, Clarification=${requiresClarification}, IsClarificationResponse=${isClarificationResponse}`);

    res.status(200).json(response);

  } catch (error) {
    console.error('CCN analysis error:', error);
    
    const requestMarket: Market = req.body?.market as Market || 'ng';
    res.status(200).json(createFallbackResponse(requestMarket));
  }
}

// Helper function for semantic extraction
async function performSemanticExtraction(userInput: string, market: Market) {
  const marketTemplates = {
    ng: { archetypes: ['Against All Odds', 'Heritage Hero', 'Community Builder'] },
    uk: { archetypes: ['Underdog Fighter', 'Legacy Keeper', 'Modern Pioneer'] },
    fr: { archetypes: ['Résilience Créative', 'Élégance Culturelle', 'Solidarité Humaniste'] }
  };
  
  const marketTemplate = marketTemplates[market] || marketTemplates.ng;

  const prompt = `
Analyze this user input and extract semantic understanding:
"${userInput}"

Extract:
1. pathway (emotion-first, scene-first, story-seed, or audience-led)
2. emotion (primary emotion(s))
3. scene (setting or implied scene)
4. seedMoment (core story seed/fragment)
5. audience (explicit or inferred audience)
6. intentSummary (1-2 sentence summary)

For each, provide a confidence score 0-1.
If any confidence < 0.7, suggest ONE clarifying question.

Return JSON with this structure:
{
  "pathway": "...",
  "emotion": "...",
  "scene": "...", 
  "seedMoment": "...",
  "audience": "...",
  "intentSummary": "...",
  "confidenceScores": {
    "pathway": 0.x,
    "emotion": 0.x,
    "scene": 0.x,
    "audience": 0.x
  },
  "clarificationQuestion": {
    "question": "... (if any confidence < 0.7)",
    "field": "emotion | scene | audience | intent"
  },
  "rawAnalysis": "brief reasoning"
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "Extract semantic meaning from user input. Return only valid JSON." 
      },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error('No content returned');
  
  return JSON.parse(content);
}

// Generate understanding preview regardless of confidence
function generateUnderstandingPreview(interpretation: any, overallConfidence: number): string {
  const emotion = interpretation.emotion?.toLowerCase() || 
    (overallConfidence < 0.5 ? "a meaningful" : "an emotional");
  const scene = interpretation.scene?.toLowerCase() || 
    (overallConfidence < 0.5 ? "a situation" : "a moment");
  const seed = interpretation.seedMoment?.toLowerCase() || "personal experience";
  const audience = interpretation.audience?.toLowerCase() || "those who need to hear it";
  
  // Adjust language based on confidence
  if (overallConfidence < 0.5) {
    return `This seems to be ${emotion} ${scene} about ${seed}.`;
  } else if (overallConfidence < 0.7) {
    return `A ${emotion} moment in ${scene} about ${seed} for ${audience}.`;
  } else {
    return `A ${emotion} moment in ${scene} about ${seed} for ${audience}.`;
  }
}

// Create fallback response
function createFallbackResponse(market: Market): CCNResponseRevised {
  return {
    success: false,
    interpretation: {
      pathway: "emotion-first",
      emotion: "meaningful",
      scene: "a personal moment",
      seedMoment: "something important to you",
      audience: "people who care",
      intentSummary: "You're sharing something meaningful from your experience.",
      confidence: 0.5,
      confidenceScores: {
        pathway: 0.5,
        emotion: 0.5,
        scene: 0.5,
        audience: 0.5
      },
      market,
      understandingPreview: "A meaningful moment about personal experience.",
      rawAnalysis: "Fallback response due to error"
    },
    requiresClarification: false, // Never ask for clarification on fallback
    understandingPreview: "A meaningful moment about personal experience."
  };
}

// Create fallback interpretation
function createFallbackInterpretation(market: Market, reason: string): any {
  return {
    pathway: "emotion-first" as "emotion-first" | "scene-first" | "story-seed" | "audience-led",
    emotion: "uncertain",
    scene: "unclear setting",
    seedMoment: "ambiguous moment",
    audience: "general audience",
    intentSummary: reason,
    confidence: 0.1,
    confidenceScores: {
      pathway: 0.1,
      emotion: 0.1,
      scene: 0.1,
      audience: 0.1
    },
    market,
    understandingPreview: "",
    rawAnalysis: reason
  };
}

// Existing helper functions (keep these as before):
function determineArchetypeFromPathway(pathway: string): string {
  const archetypeMap: Record<string, string> = {
    'emotion-first': 'Against All Odds',
    'scene-first': 'Community Builder',
    'story-seed': 'Heritage Hero',
    'audience-led': 'Modern Pioneer'
  };
  return archetypeMap[pathway] || 'Against All Odds';
}

function determineToneFromEmotion(emotion: string): string {
  const emotionToneMap: Record<string, string> = {
    'hopeful': 'Cinematic',
    'uncertain': 'Heartfelt',
    'inspired': 'Playful',
    'anxious': 'Defiant',
    'joyful': 'Playful',
    'melancholy': 'Heartfelt'
  };
  
  const emotionLower = emotion.toLowerCase();
  for (const [key, tone] of Object.entries(emotionToneMap)) {
    if (emotionLower.includes(key)) {
      return tone;
    }
  }
  return 'Cinematic';
}

function getOptionsForField(field: string): string[] {
  const optionsMap: Record<string, string[]> = {
    'emotion': ['hopeful', 'uncertain', 'inspired', 'anxious', 'joyful', 'melancholy'],
    'scene': ['urban setting', 'natural environment', 'indoor space', 'public place', 'private moment'],
    'audience': ['individuals facing change', 'community members', 'young professionals', 'creative thinkers'],
    'intent': ['to inspire', 'to comfort', 'to challenge', 'to connect', 'to celebrate']
  };
  return optionsMap[field] || ['Please clarify'];
}

function mapFieldToLegacy(field: string): 'need' | 'archetype' | 'tone' | 'context' {
  const mapping: Record<string, 'need' | 'archetype' | 'tone' | 'context'> = {
    'emotion': 'need',
    'scene': 'context',
    'audience': 'context',
    'intent': 'context'
  };
  return mapping[field] || 'context';
}