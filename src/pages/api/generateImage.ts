import { OpenAI } from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';
import type { GenerateImageRequest, GenerateImageResponse, CharacterDescription } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Store character seeds for consistency
const characterSeeds = new Map<string, number>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      sceneDescription, 
      visualCues = [],
      tone, 
      brandSafe = true, 
      brandPalette = [],
      template = 'instagram-story',
      beatIndex = 0,
      beat = 'Scene',
      characterDescription,
      previousCharacterImage,
      isSameCharacter = false
    }: GenerateImageRequest = req.body;

    if (!sceneDescription) {
      return res.status(400).json({ error: 'Scene description is required' });
    }

    // Load market tones
    const marketTones = require('@/lib/marketTone.json');
    const marketData = marketTones.ng;
    const toneConfig = marketData.tones.find((t: any) => t.name === tone);

    // ✅ CRITICAL: Generate consistent seed for character
    let characterSeed: number | undefined;
    if (characterDescription?.id) {
      if (!characterSeeds.has(characterDescription.id)) {
        // Generate a seed based on character ID (deterministic)
        characterSeed = hashStringToNumber(characterDescription.id);
        characterSeeds.set(characterDescription.id, characterSeed);
      } else {
        characterSeed = characterSeeds.get(characterDescription.id);
      }
    }

    // ✅ Build character-specific prompt
    let characterPrompt = '';
    if (characterDescription) {
      characterPrompt = `
CHARACTER CONSISTENCY REQUIREMENTS:
MAIN CHARACTER: ${characterDescription.name || 'Primary character'}
- Age: ${characterDescription.age || 'adult'}
- Gender: ${characterDescription.gender || 'person'}
- Ethnicity: ${characterDescription.ethnicity || 'appropriate to ' }
- Hair: ${characterDescription.appearance?.hair || 'natural hair appropriate to ethnicity'}
- Eyes: ${characterDescription.appearance?.eyes || 'expressive eyes'}
- Build: ${characterDescription.appearance?.build || 'average build'}
- Distinctive features: ${characterDescription.appearance?.distinctive?.join(', ') || 'none'}
- Clothing style: ${characterDescription.clothingStyle || 'context-appropriate clothing'}

CHARACTER REFERENCE IMAGE: Use the exact same facial structure, features, and appearance as previous scenes.
Maintain identical: face shape, eye shape, nose, mouth, and distinctive features.
Only change: expression, angle, lighting, and clothing as appropriate for this scene.

CRITICAL: This must be the SAME PERSON as in previous images. Do not change their fundamental appearance.
`;
    }

    // Build visual cues
    let visualCuesInstruction = '';
    if (visualCues.length > 0) {
      visualCuesInstruction = `
REQUIRED VISUAL ELEMENTS:
${visualCues.map((cue, i) => `${i + 1}. ${cue}`).join('\n')}
`;
    }

    // Template dimensions
    const templateDimensions: { [key: string]: "1024x1024" | "1792x1024" | "1024x1792" } = {
      'instagram-story': '1024x1792',
      'instagram-reel': '1024x1792',
      'youtube-short': '1024x1792',
      'youtube-standard': '1792x1024',
      'facebook-feed': '1024x1024',
      'linkedin-video': '1792x1024'
    };

    const size = templateDimensions[template] || '1024x1024';

    // ✅ Enhanced prompt with character consistency
    const prompt = `
Create a cinematic image for: ${beat}

SCENE: ${sceneDescription}
${visualCuesInstruction}

${characterPrompt}

÷

VISUAL STYLE: ${tone}
Style descriptors: ${toneConfig?.visualDescriptors?.join(', ') || 'cinematic, authentic, emotional'}
Shot type: ${getShotType(beatIndex)}

TECHNICAL:
- Format: ${template} (${size})
- Lighting: Professional cinematic lighting appropriate for mood
- Composition: ${getCompositionGuide(beatIndex)}
- Facial consistency: IDENTICAL character appearance across all scenes
- No text or logos in image
- Safe margins for overlays

EMOTION: Capture the emotional essence while maintaining character consistency.
`.trim();

    console.log(`🎨 Generating image for ${beat} with ${characterDescription ? 'character: ' + characterDescription.id : 'no character'}`);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: size,
      quality: "hd",
      style: "natural",
      // ✅ Note: DALL-E 3 doesn't support seed parameter directly
      // We rely on detailed prompt engineering instead
    });

    const imageData = response.data[0];

    if (!imageData.url) {
      throw new Error('No image URL returned from OpenAI');
    }

    const result: GenerateImageResponse = {
      success: true,
      imageUrl: imageData.url,
      revisedPrompt: imageData.revised_prompt || prompt,
      sceneDescription,
      beatIndex
    };

    console.log(`✅ Image generated for beat ${beatIndex + 1}`);

    res.status(200).json(result);

  } catch (error) {
    console.error('Image generation error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('content_policy')) {
        return res.status(400).json({ 
          success: false,
          error: 'Content policy violation. Adjust scene description.',
          details: error.message
        });
      }
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate image.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Helper functions
function getMarketStyle(market: string): string {
  const styles: { [key: string]: string } = {
    'ng': 'Nigerian features, warm skin tones, authentic African clothing and hairstyles',
    'uk': 'British features, diverse ethnicities, urban UK fashion and settings',
    'fr': 'European features, French elegance, sophisticated style and settings'
  };
  return styles[market] || 'authentic local features';
}

function getShotType(beatIndex: number): string {
  const shotTypes = [
    'establishing wide shot',
    'medium shot showing character',
    'close-up on face showing emotion',
    'medium shot with action',
    'close-up detail shot',
    'wide concluding shot'
  ];
  return shotTypes[beatIndex % shotTypes.length];
}

function getCompositionGuide(beatIndex: number): string {
  if (beatIndex === 0) return 'Rule of thirds, establishing scene, show environment';
  if (beatIndex === 1) return 'Medium shot, character centered, focus on expression';
  return 'Dynamic framing, appropriate for scene emotion';
}

function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 1000000;
}