import { OpenAI } from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';
import { CCNResponseRevised, Market } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Market detection function
async function detectMarketFromText(text: string): Promise<Market> {
  const prompt = `
Analyze this text and determine if there's a clear cultural or geographical market context.

TEXT TO ANALYZE:
"${text}"

INSTRUCTIONS:
1. Look for clear cultural markers: language patterns, slang, local references, place names, cultural context
2. If there are NO clear cultural markers, return "ng" (default)
3. If there are ambiguous or mixed signals, return "ng" (default)
4. Only return a specific market code if the text clearly belongs to one of these cultures:

MARKET CODES:
- "ng": Nigerian culture (Nigerian Pidgin, Yoruba/Igbo words, Naija slang, Lagos/Abuja references, jollof, suya, "wetin", "abi", "chai", "wahala")
- "uk": British culture (British slang, UK place names, British cultural references, "mate", "bloody", "pub", "queue", "football")
- "fr": French culture (French language, French cultural references, "bonjour", "merci", "paris", "baguette", "café", "voilà")

EXAMPLES:
- "Wetin dey happen for Lagos this morning?" → "ng"
- "I was at the pub in London yesterday" → "uk"
- "Le café était délicieux à Paris" → "fr"
- "I woke up feeling inspired today" → "ng" (default)
- "Everything is changing in my life" → "ng" (default)

RETURN ONLY ONE OF: "ng", "uk", OR "fr"
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using mini for cost efficiency
      messages: [
        { 
          role: "system", 
          content: "You are a cultural analyzer. You detect clear cultural markers in text. Return only the market code." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 5,
    });

    const marketCode = completion.choices[0].message.content?.trim().toLowerCase() as Market;
    
    // Validate the response
    const validMarkets: Market[] = ['ng', 'uk', 'fr'];
    if (validMarkets.includes(marketCode)) {
      return marketCode;
    }
    
    return 'ng'; // Default fallback
  } catch (error) {
    console.error('Market detection error:', error);
    return 'ng'; // Default fallback on error
  }
}

// Semantic extraction function
async function performSemanticExtraction(userInput: string, market: Market) {
  const marketTemplates = {
    ng: { archetypes: ['Against All Odds', 'Heritage Hero', 'Community Builder'] },
    uk: { archetypes: ['Underdog Fighter', 'Legacy Keeper', 'Modern Pioneer'] },
    fr: { archetypes: ['Résilience Créative', 'Élégance Culturelle', 'Solidarité Humaniste'] }
  };
  
  const marketTemplate = marketTemplates[market] || marketTemplates.ng;

  const prompt = `
You are the Cognitive Clarifier Node (CCN) for Narratives.XO. Analyze this user input with empathy and intuition.

USER INPUT:
"${userInput}"

TASK:
1. Analyze the emotional tone and pathway
2. Extract key semantic elements
3. Write a brief raw analysis in first-person conversational tone

SEMANTIC EXTRACTION:
- pathway: emotion-first, scene-first, story-seed, or audience-led
- emotion: primary emotion(s)
- scene: setting or implied scene  
- seedMoment: core story seed/fragment
- audience: explicit or inferred audience
- intentSummary: 1-2 sentence summary

For each extraction, provide a confidence score 0-1 based on clarity.
If ANY confidence score is below 0.7, suggest ONE clarifying question.

RAW ANALYSIS (in first person, conversational):
Write a brief analysis starting with phrases like:
- "This feels like it's about..."
- "It sounds like..."
- "I'm hearing..."
- "This gives me the sense of..."
- "What I'm picking up is..."

Keep it conversational, empathetic, and human-like.

Return ONLY valid JSON in this structure:
{
  "pathway": "emotion-first | scene-first | story-seed | audience-led",
  "emotion": "extracted emotion(s)",
  "scene": "extracted setting/scene",
  "seedMoment": "core story seed/fragment",
  "audience": "explicit or inferred audience",
  "intentSummary": "1-2 sentence summary",
  "confidenceScores": {
    "pathway": 0.85,
    "emotion": 0.85,
    "scene": 0.85,
    "audience": 0.85
  },
  "clarificationQuestion": {
    "question": "Clarifying question (if any confidence < 0.7)",
    "field": "emotion | scene | audience | intent"
  },
  "rawAnalysis": "Your conversational first-person analysis here..."
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are an empathetic, intuitive story analyst. You understand human emotions and moments. Write in a warm, conversational, first-person tone. Return only valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No content returned from OpenAI');
    
    const parsed = JSON.parse(content);
    
    // Ensure pathway is valid
    const validPathways = ["emotion-first", "scene-first", "story-seed", "audience-led"] as const;
    if (!validPathways.includes(parsed.pathway as any)) {
      parsed.pathway = "emotion-first";
    }
    
    return parsed;
  } catch (error) {
    console.error('Semantic extraction error:', error);
    throw error;
  }
}

// Validate pathway
function validatePathway(pathway: string): "emotion-first" | "scene-first" | "story-seed" | "audience-led" {
  const validPathways = ["emotion-first", "scene-first", "story-seed", "audience-led"] as const;
  if (validPathways.includes(pathway as any)) {
    return pathway as "emotion-first" | "scene-first" | "story-seed" | "audience-led";
  }
  return "emotion-first";
}

// Generate conversational understanding preview
function generateConversationalPreview(interpretation: any, overallConfidence: number, isClarificationResponse: boolean): string {
  const emotion = interpretation.emotion?.toLowerCase() || "something meaningful";
  const scene = interpretation.scene?.toLowerCase() || "a moment";
  const seed = interpretation.seedMoment?.toLowerCase() || "personal experience";
  const audience = interpretation.audience?.toLowerCase() || "those who need to hear this";
  
  const startingPhrases = [
    "I feel like...",
    "It sounds like...",
    "I'm hearing...",
    "What I'm picking up is...",
    "This gives me the sense that...",
    "From what you're saying...",
    "What stands out to me is...",
    "I sense that..."
  ];
  
  const phrase = startingPhrases[Math.floor(Math.random() * startingPhrases.length)];
  
  if (overallConfidence < 0.5) {
    return `${phrase} this might be about ${emotion} in ${scene}.`;
  } else if (overallConfidence < 0.7) {
    return `${phrase} a ${emotion} moment in ${scene} about ${seed}.`;
  } else {
    if (isClarificationResponse) {
      return `${phrase} ${emotion} is at the heart of this moment in ${scene}. It's about ${seed} for ${audience}.`;
    } else {
      return `${phrase} this is a ${emotion} moment in ${scene}, centered around ${seed} for ${audience}.`;
    }
  }
}

// Helper functions
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
  const emotionLower = emotion.toLowerCase();
  
  if (emotionLower.includes('hopeful') || emotionLower.includes('inspired') || emotionLower.includes('uplifting')) 
    return 'Cinematic';
  if (emotionLower.includes('uncertain') || emotionLower.includes('vulnerable') || emotionLower.includes('tender')) 
    return 'Heartfelt';
  if (emotionLower.includes('joyful') || emotionLower.includes('playful') || emotionLower.includes('lighthearted')) 
    return 'Playful';
  if (emotionLower.includes('anxious') || emotionLower.includes('defiant') || emotionLower.includes('intense')) 
    return 'Defiant';
  if (emotionLower.includes('melancholy') || emotionLower.includes('nostalgic') || emotionLower.includes('reflective')) 
    return 'Heartfelt';
  if (emotionLower.includes('energetic') || emotionLower.includes('dynamic') || emotionLower.includes('vibrant')) 
    return 'Cinematic';
  
  return 'Cinematic';
}

function getOptionsForField(field: string): string[] {
  const optionsMap: Record<string, string[]> = {
    'emotion': ['hopeful', 'uncertain', 'inspired', 'anxious', 'joyful', 'melancholy', 'vulnerable', 'defiant'],
    'scene': ['urban setting', 'natural environment', 'indoor space', 'public place', 'private moment', 'transitional space'],
    'audience': ['individuals facing change', 'community members', 'young professionals', 'creative thinkers', 'people at crossroads'],
    'intent': ['to inspire', 'to comfort', 'to challenge', 'to connect', 'to celebrate', 'to reflect']
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

// Create fallback response
function createFallbackResponse(market: Market): CCNResponseRevised {
  return {
    success: true,
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
      understandingPreview: "I feel you're describing something meaningful that matters to you.",
      rawAnalysis: "I sense there's something important here, but I need to understand it better.",
      inferredNeed: "Personal Experience",
      inferredArchetype: determineArchetypeFromPathway("emotion-first"),
      inferredTone: "Cinematic",
      inferredContext: "A personal moment to be shared",
      clarifications: []
    },
    requiresClarification: false,
    clarificationQuestion: null,
    understandingPreview: "I feel you're describing something meaningful that matters to you."
  };
}

// Main handler
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
      isClarificationResponse = false,
      previousClarification,
      previousAnswer 
    } = req.body;

    if (!userInput || typeof userInput !== 'string') {
      return res.status(400).json({ 
        error: 'Valid user input is required' 
      });
    }

    const trimmedInput = userInput.trim();
    if (trimmedInput.length < 3) {
      return res.status(200).json(createFallbackResponse('ng'));
    }

    // Detect market from user input
    const detectedMarket = await detectMarketFromText(trimmedInput);
    console.log(`Detected market from text: ${detectedMarket}`);

    // Combine input with clarification answer if provided
    const combinedInput = previousClarification && previousAnswer 
      ? `${trimmedInput} (Regarding ${previousClarification}: ${previousAnswer})`
      : trimmedInput;

    // Perform semantic extraction
    const interpretation = await performSemanticExtraction(combinedInput, detectedMarket);
    
    // Calculate overall confidence
    const confidenceScores = Object.values(interpretation.confidenceScores || {}) as number[];
    const overallConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
      : 0.5;
    
    interpretation.confidence = overallConfidence;
    
    // Determine if clarification is needed
    const requiresClarification = !isClarificationResponse && overallConfidence < 0.7;
    
    // Generate conversational understanding preview
    const understandingPreview = generateConversationalPreview(interpretation, overallConfidence, isClarificationResponse);
    
    // Prepare response
    const response: CCNResponseRevised = {
      success: true,
      interpretation: {
        ...interpretation,
        confidence: overallConfidence,
        market: detectedMarket,
        understandingPreview,
        inferredNeed: interpretation.emotion || "Personal Experience",
        inferredArchetype: determineArchetypeFromPathway(interpretation.pathway),
        inferredTone: determineToneFromEmotion(interpretation.emotion),
        inferredContext: interpretation.intentSummary,
        clarifications: requiresClarification ? [{
          question: interpretation.clarificationQuestion?.question || "Could you tell me more about what you're feeling?",
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

    console.log(`✅ CCN analysis complete: Market=${detectedMarket}, Confidence=${overallConfidence.toFixed(2)}, Clarification=${requiresClarification}`);

    return res.status(200).json(response);

  } catch (error) {
    console.error('CCN analysis error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Return a fallback response instead of error
    return res.status(200).json(createFallbackResponse('ng'));
  }
}