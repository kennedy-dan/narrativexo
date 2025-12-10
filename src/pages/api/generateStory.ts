import { OpenAI } from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface GenerateStoryRequest {
  market: string;
  need: string;
  archetype: string;
  tone: string;
  context: string;
  brand?: {
    name: string;
    palette?: string[];
    fonts?: string[];
  };
}

interface Scene {
  beat: string;
  description: string;
  visualCues: string[];
  emotion?: string;
  duration?: string;
}

// NEW: Match P2 documentation structure
interface GeneratedStory {
  story: string;           // Full narrative as prose
  beatSheet: Scene[];      // Structured scenes
  metadata: {
    title: string;
    market: string;
    archetype: string;
    tone: string;
    totalBeats: number;
    estimatedDuration: string;
  };
}

interface MarketTone {
  name: string;
  keywords: string[];
  archetypeLinks: string[];
  visualDescriptors: string[];
}

interface MarketData {
  market: string;
  tones: MarketTone[];
  compliance: {
    wcag: string;
    strap: boolean;
  };
}

interface MarketTonesData {
  [key: string]: MarketData;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { market, need, archetype, tone, context, brand }: GenerateStoryRequest = req.body;

    // Validate required fields
    if (!market || !need || !archetype || !tone || !context) {
      return res.status(400).json({ 
        error: 'Missing required fields: market, need, archetype, tone, context' 
      });
    }

    // Load market-specific tone data
    const marketTonesModule = await import('@/lib/marketTone.json');
    const marketTones = marketTonesModule.default as MarketTonesData;
    
    const marketData = marketTones[market] || marketTones.ng;
    const toneConfig = marketData.tones.find((t: MarketTone) => t.name === tone);
    
    if (!toneConfig) {
      return res.status(400).json({ 
        error: `Tone '${tone}' not found for market '${market}'` 
      });
    }

    // Build culturally-aware prompt
    const marketContext = {
      ng: 'Use Nigerian English, street energy, "No wahala" spirit, vibrant Lagos culture',
      uk: 'Use British English, working-class authenticity, pub culture references',
      fr: 'Use formal French style, measured restraint, cultural elegance'
    };

    const prompt = `
You are an expert storyteller creating culturally grounded narratives for ${market.toUpperCase()} market.

INPUTS:
- Market: ${market.toUpperCase()} (${marketContext[market as keyof typeof marketContext]})
- Motivational Need (Maslow): ${need}
- Story Archetype: ${archetype}
- Tone: ${tone} (Keywords: ${toneConfig.keywords.join(', ')})
- Visual Style: ${toneConfig.visualDescriptors.join(', ')}
- Context/Scene: ${context}
${brand ? `- Brand: ${brand.name}` : ''}

TASK:
Create a compelling 30-second narrative with these TWO components:

1. **story** (string): A flowing narrative paragraph (150-200 words) that tells the complete story in prose format. Use culturally appropriate language, idioms, and references for the ${market} market.

2. **beatSheet** (array): Break the story into 4-6 cinematic scenes using standard beat sheet structure:
   - Opening Image
   - Setup
   - Catalyst
   - Midpoint
   - Climax
   - Final Image

Each scene object must include:
{
  "beat": "Opening Image",
  "description": "Detailed scene description (2-3 sentences)",
  "visualCues": ["Specific visual element 1", "Specific visual element 2", "Specific visual element 3"],
  "emotion": "Primary emotion of this beat",
  "duration": "5s" (estimate in seconds)
}

3. **metadata** object with: title (catchy, market-appropriate), totalBeats, estimatedDuration

Return ONLY valid JSON in this EXACT structure:
{
  "story": "Full narrative paragraph here...",
  "beatSheet": [...array of scene objects...],
  "metadata": {
    "title": "Story Title",
    "market": "${market}",
    "archetype": "${archetype}",
    "tone": "${tone}",
    "totalBeats": 5,
    "estimatedDuration": "30s"
  }
}

CRITICAL: Make visual cues specific and actionable for image generation. Include cultural details appropriate for ${market} market.
`;

    console.log('Generating story for market:', market, 'with tone:', tone);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are an expert storyteller specializing in culturally grounded narratives. You create stories that resonate authentically with specific markets while maintaining universal emotional appeal. Always return valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8, // Slightly creative
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    const generated: GeneratedStory = JSON.parse(content);
    
    // Validate structure
    if (!generated.story || !generated.beatSheet || !generated.metadata) {
      throw new Error('Invalid story structure returned from GPT');
    }

    console.log(`✓ Story generated: "${generated.metadata.title}" with ${generated.beatSheet.length} beats`);

    res.status(200).json({
      success: true,
      ...generated, // story, beatSheet, metadata
      toneConfig   // Include for reference
    });

  } catch (error) {
    console.error('Story generation error:', error);
    
    if (error instanceof Error) {
      return res.status(500).json({ 
        error: 'Failed to generate story',
        details: error.message 
      });
    }
    
    res.status(500).json({ error: 'Failed to generate story' });
  }
}