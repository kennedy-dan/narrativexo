// pages/api/generateMultipleImages.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Store character seeds for consistency
const characterSeeds = new Map<string, number>();

interface SceneRequest {
  sceneDescription: string;
  visualCues: string[];
  tone: string;
  market: string;
  brandSafe: boolean;
  brandPalette: string[];
  beatIndex: number;
  beat: string;
  characterEmotion?: string;
  characterAction?: string;
  shotType?: string;
  characterDescription?: any;
  previousCharacterImage?: string;
  isSameCharacter?: boolean;
}

interface GenerateMultipleImagesRequest {
  scenes: SceneRequest[];
  template: string;
  storyMetadata: {
    title: string;
    tone: string;
    market: string;
    mainCharacters?: any[];
  };
}

interface ImageResult {
  success: boolean;
  imageUrl?: string;
  revisedPrompt?: string;
  sceneDescription?: string;
  beatIndex: number;
  beat?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { scenes, template, storyMetadata }: GenerateMultipleImagesRequest = req.body;

    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Scenes array is required and must not be empty' 
      });
    }

    console.log(`🎨 Starting batch generation for ${scenes.length} scenes`);

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

    const results: ImageResult[] = [];
    
    // Process scenes sequentially to avoid rate limiting
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      
      try {
        // Load market tones
        const marketTones = require('@/lib/marketTone.json');
        const marketData = marketTones[scene.market] || marketTones.ng;
        const toneConfig = marketData.tones.find((t: any) => t.name === scene.tone);

        // Generate consistent seed for character
        let characterSeed: number | undefined;
        if (scene.characterDescription?.id) {
          if (!characterSeeds.has(scene.characterDescription.id)) {
            characterSeed = hashStringToNumber(scene.characterDescription.id);
            characterSeeds.set(scene.characterDescription.id, characterSeed);
          } else {
            characterSeed = characterSeeds.get(scene.characterDescription.id);
          }
        }

        // Build character-specific prompt
        let characterPrompt = '';
        if (scene.characterDescription) {
          const char = scene.characterDescription;
          characterPrompt = `
CHARACTER CONSISTENCY REQUIREMENTS:
MAIN CHARACTER: ${char.name || 'Primary character'}
- Age: ${char.age || 'adult'}
- Gender: ${char.gender || 'person'}
- Ethnicity: ${char.ethnicity || 'appropriate to ' + scene.market}
- Hair: ${char.appearance?.hair || 'natural hair appropriate to ethnicity'}
- Eyes: ${char.appearance?.eyes || 'expressive eyes'}
- Build: ${char.appearance?.build || 'average build'}
- Distinctive features: ${char.appearance?.distinctive?.join(', ') || 'none'}
- Clothing style: ${char.clothingStyle || 'context-appropriate clothing'}

CHARACTER REFERENCE IMAGE: Use the exact same facial structure, features, and appearance as previous scenes.
Maintain identical: face shape, eye shape, nose, mouth, and distinctive features.
Only change: expression, angle, lighting, and clothing as appropriate for this scene.

CRITICAL: This must be the SAME PERSON as in previous images. Do not change their fundamental appearance.
`;
        }

        // Build visual cues
        let visualCuesInstruction = '';
        if (scene.visualCues && scene.visualCues.length > 0) {
          visualCuesInstruction = `
REQUIRED VISUAL ELEMENTS:
${scene.visualCues.map((cue, i) => `${i + 1}. ${cue}`).join('\n')}
`;
        }

        // Build market-specific style
        const marketStyle = getMarketStyle(scene.market);
        const shotType = getShotType(scene.beatIndex);
        const compositionGuide = getCompositionGuide(scene.beatIndex);

        // Enhanced prompt with character consistency
        const prompt = `
Create a cinematic image for: ${scene.beat}

SCENE: ${scene.sceneDescription}
${visualCuesInstruction}

${characterPrompt}

MARKET & CULTURE: ${scene.market.toUpperCase()}
Cultural authenticity: ${marketStyle}
Ensure facial features are ethnically/culturally appropriate for ${scene.market}.

VISUAL STYLE: ${scene.tone}
Style descriptors: ${toneConfig?.visualDescriptors?.join(', ') || 'cinematic, authentic, emotional'}
Shot type: ${shotType}

TECHNICAL:
- Format: ${template} (${size})
- Lighting: Professional cinematic lighting appropriate for mood
- Composition: ${compositionGuide}
- Facial consistency: IDENTICAL character appearance across all scenes
- No text or logos in image
- Safe margins for overlays

EMOTION: Capture the emotional essence while maintaining character consistency.
`.trim();

        console.log(`🖼️ Generating image ${i + 1}/${scenes.length}: "${scene.beat}"`);

        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: size,
          quality: "hd",
          style: "natural",
        });

        const imageData = response.data[0];

        if (!imageData.url) {
          throw new Error('No image URL returned from OpenAI');
        }

        results.push({
          success: true,
          imageUrl: imageData.url,
          revisedPrompt: imageData.revised_prompt || prompt,
          sceneDescription: scene.sceneDescription,
          beatIndex: scene.beatIndex,
          beat: scene.beat
        });

        console.log(`✅ Generated image ${i + 1}/${scenes.length}`);

        // Small delay between requests to avoid rate limiting (500ms)
        if (i < scenes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error) {
        console.error(`❌ Failed to generate image for scene ${i + 1}:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          beatIndex: scene.beatIndex,
          beat: scene.beat
        });
        
        // Continue with next scene even if one fails
      }
    }

    // Calculate success rate
    const successfulResults = results.filter(r => r.success);
    const successRate = Math.round((successfulResults.length / scenes.length) * 100);

    console.log(`🎉 Batch complete: ${successfulResults.length}/${scenes.length} images generated (${successRate}%)`);

    res.status(200).json({
      success: true,
      results: results,
      summary: {
        totalScenes: scenes.length,
        successful: successfulResults.length,
        failed: results.filter(r => !r.success).length,
        successRate: successRate
      }
    });

  } catch (error) {
    console.error('Batch image generation error:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate images in batch.',
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
    hash = hash & hash;
  }
  return Math.abs(hash) % 1000000;
}