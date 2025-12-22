import { OpenAI } from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';
import { CCNInput, CCNResponse, Market } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Market-specific templates
const marketTemplates: Record<Market, {
  needs: string[];
  archetypes: string[];
  tones: string[];
}> = {
  ng: {
    needs: ['Essentials for Living', 'Security & Stability', 'Community & Connection', 'Achievement & Respect', 'Growth & Purpose'],
    archetypes: ['Against All Odds', 'Heritage Hero', 'Community Builder'],
    tones: ['Cinematic', 'Playful', 'Heartfelt', 'Defiant']
  },
  uk: {
    needs: ['Essentials for Living', 'Security & Stability', 'Community & Connection', 'Achievement & Respect', 'Growth & Purpose'],
    archetypes: ['Underdog Fighter', 'Legacy Keeper', 'Modern Pioneer'],
    tones: ['Cinematic', 'Playful', 'Heartfelt', 'Defiant']
  },
  fr: {
    needs: ['Essentials for Living', 'Security & Stability', 'Community & Connection', 'Achievement & Respect', 'Growth & Purpose'],
    archetypes: ['Résilience Créative', 'Élégance Culturelle', 'Solidarité Humaniste'],
    tones: ['Cinématographique', 'Ludique', 'Sincère', 'Résilient']
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userInput, entryPathway = 'scene', market = 'ng' }: CCNInput = req.body;

    if (!userInput || userInput.trim().length < 3) {
      return res.status(400).json({ 
        success: false,
        error: 'User input too short. Please provide at least 3 characters.' 
      });
    }

    // Build prompt based on entry pathway
    const pathwayPrompts = {
      emotion: 'The user is starting with an emotional state or feeling:',
      audience: 'The user is starting with a target audience description:',
      scene: 'The user is starting with a scene or setting:',
      seed: 'The user is starting with a story seed or fragment:'
    };

    const marketTemplate = marketTemplates[market as Market] || marketTemplates.ng;

    const prompt = `
You are the Cognitive Clarifier Node (CCN) for Narratives.XO. Analyze the user's input and infer the most likely story elements.

USER INPUT (${pathwayPrompts[entryPathway]}):
"${userInput}"

MARKET CONTEXT: ${market.toUpperCase()}

AVAILABLE OPTIONS:
- Needs: ${marketTemplate.needs.join(', ')}
- Archetypes: ${marketTemplate.archetypes.join(', ')}
- Tones: ${marketTemplate.tones.join(', ')}

TASK:
1. Infer the most likely motivational need (from available needs list)
2. Infer the most fitting narrative archetype
3. Infer the appropriate tone
4. Extract any implied context from the input
5. Calculate a confidence score (0-1) for each inference
6. If confidence for any element is below 0.7, generate a clarification question

IMPORTANT RULES:
- Only use options from the AVAILABLE OPTIONS above
- For context, extract and summarize the implied scene/situation
- Confidence should be based on how clearly the input implies each element
- Lower confidence means the user should be asked to clarify

Return ONLY valid JSON in this exact structure:
{
  "inferredNeed": "selected need from list",
  "inferredArchetype": "selected archetype from list",
  "inferredTone": "selected tone from list",
  "inferredContext": "brief summary of implied scene/context",
  "confidence": 0.85,
  "clarifications": [
    {
      "question": "Clarifying question here (if confidence < 0.7)",
      "options": ["Option 1", "Option 2", "Option 3"],
      "field": "need | archetype | tone | context"
    }
  ],
  "market": "${market}",
  "rawAnalysis": "Brief explanation of your reasoning"
}
`;

    console.log(`🧠 CCN analyzing ${entryPathway} input for ${market} market`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are a cognitive inference engine for storytelling. You analyze ambiguous inputs and infer story elements with calculated confidence scores. Return only valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Low temperature for consistent inference
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    const interpretation = JSON.parse(content);
    
    // Validate confidence is a number
    interpretation.confidence = parseFloat(interpretation.confidence) || 0.5;
    
    const requiresClarification = interpretation.clarifications && interpretation.clarifications.length > 0;

    const response: CCNResponse = {
      success: true,
      interpretation,
      requiresClarification
    };

    console.log(`✅ CCN inference complete: Confidence=${interpretation.confidence}, Clarifications=${interpretation.clarifications?.length || 0}`);

    res.status(200).json(response);

  } catch (error) {
  console.error('CCN inference error:', error);
  
  // Get market from request body for fallback
  const requestMarket: Market = (req.body?.market as Market) || 'ng';
  
  // Fallback response
  const fallbackResponse: CCNResponse = {
    success: false,
    interpretation: {
      inferredNeed: 'Essentials for Living',
      inferredArchetype: requestMarket === 'ng' ? 'Against All Odds' : 
                       requestMarket === 'uk' ? 'Underdog Fighter' : 'Résilience Créative',
      inferredTone: requestMarket === 'fr' ? 'Cinématographique' : 'Cinematic',
      inferredContext: 'A compelling story about overcoming challenges',
      confidence: 0.3,
      clarifications: [
        {
          question: "What's the main motivation for your story?",
          options: marketTemplates[requestMarket].needs,
          field: 'need'
        }
      ],
      market: requestMarket,
      rawAnalysis: 'Fallback response due to inference error'
    },
    requiresClarification: true
  };

  res.status(200).json(fallbackResponse);
}
}