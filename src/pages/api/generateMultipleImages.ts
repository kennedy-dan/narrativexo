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
    
    // Process scenes sequentially
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      
      try {
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

        // Build character-specific prompt (if applicable)
        let characterPrompt = '';
        if (scene.characterDescription) {
          const char = scene.characterDescription;
          characterPrompt = `
UNIVERSAL CHARACTER REQUIREMENTS:
MAIN CHARACTER: Universal human figure
- Age: ${char.age || 'adult'}
- Features: Ethnically ambiguous, universal appearance
- Build: ${char.appearance?.build || 'average build'}
- Distinctive features: Minimal, universal

CHARACTER CONSISTENCY: Maintain same basic appearance across scenes.
Focus on emotional expression rather than specific features.
`;
        }

        // Build visual cues
        let visualCuesInstruction = '';
        if (scene.visualCues && scene.visualCues.length > 0) {
          visualCuesInstruction = `
UNIVERSAL VISUAL ELEMENTS:
${scene.visualCues.filter(cue => !cue.includes('specific')).map((cue, i) => `${i + 1}. ${cue}`).join('\n')}
`;
        }

        // Get shot type and composition
        const shotType = getShotType(scene.beatIndex);
        const compositionGuide = getCompositionGuide(scene.beatIndex);

        // UNIVERSAL prompt (NO cultural references)
        const prompt = `
Create a UNIVERSAL, culturally-neutral cinematic image.

CRITICAL RULES:
- NO specific cultural elements
- NO identifiable locations
- NO traditional/cultural clothing
- NO specific ethnic features
- Use UNIVERSAL, neutral setting
- Represent diverse, ambiguous features
- Focus on emotion and composition

SCENE: ${scene.beat}
DESCRIPTION: ${scene.sceneDescription}
${visualCuesInstruction}

${characterPrompt}

UNIVERSAL GUIDELINES:
- Features: Ethnically ambiguous, diverse representation
- Setting: Neutral, could be anywhere in the world
- Clothing: Modern, universal styles
- Environment: Timeless, non-specific

VISUAL STYLE: ${scene.tone}
Style: Cinematic, emotional, universal
Shot type: ${shotType}
Composition: ${compositionGuide}

TECHNICAL:
- Format: ${template} (${size})
- Lighting: Professional cinematic lighting appropriate for mood
- No text or logos in image
- Safe margins for overlays

EMOTION: Capture universal human emotion.
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

        // Small delay between requests
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
function getShotType(beatIndex: number): string {
  const shotTypes = [
    'establishing wide shot of universal setting',
    'medium shot showing emotion',
    'close-up on face showing universal emotion',
    'medium shot with symbolic action',
    'close-up detail shot of meaningful object',
    'wide concluding shot with universal perspective'
  ];
  return shotTypes[beatIndex % shotTypes.length];
}

function getCompositionGuide(beatIndex: number): string {
  if (beatIndex === 0) return 'Rule of thirds, establishing scene, show universal environment';
  if (beatIndex === 1) return 'Medium shot, character centered, focus on universal expression';
  if (beatIndex === 2) return 'Close-up, intense emotion, shallow depth of field';
  return 'Dynamic framing, appropriate for universal emotion';
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