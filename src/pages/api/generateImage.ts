import { OpenAI } from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';
import type { GenerateImageRequest, GenerateImageResponse } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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
      visualCues = [],        // ✅ NEW: Array of specific visual elements
      tone, 
      market, 
      brandSafe = true, 
      brandPalette = [],
      template = 'instagram-story',
      beatIndex = 0,          // ✅ NEW: Position in beatSheet
      beat = 'Scene'          // ✅ NEW: Beat name (e.g., "Opening Image")
    }: GenerateImageRequest = req.body;

    if (!sceneDescription) {
      return res.status(400).json({ error: 'Scene description is required' });
    }

    // Load market-specific tone data for visual descriptors
    const marketTones = require('@/lib/marketTone.json');
    const marketData = marketTones[market] || marketTones.ng;
    const toneConfig = marketData.tones.find((t: any) => t.name === tone);

    // ✅ NEW: Build visual cues instruction
    let visualCuesInstruction = '';
    if (visualCues && visualCues.length > 0) {
      visualCuesInstruction = `
REQUIRED VISUAL ELEMENTS (must include all):
${visualCues.map((cue, i) => `${i + 1}. ${cue}`).join('\n')}
`;
    }

    // Build safety instructions
    let safetyInstructions = '';
    if (brandSafe) {
      safetyInstructions = `
BRAND SAFETY REQUIREMENTS:
- NO violence, nudity, controversial symbols, or recognizable faces
- NO political content or divisive imagery
- Focus on positive, inclusive, brand-appropriate content
- Ensure cultural sensitivity for ${market.toUpperCase()} market
`;
    }

    // Build palette instructions
    let paletteInstructions = '';
    if (brandPalette && brandPalette.length > 0) {
      paletteInstructions = `
COLOR PALETTE (incorporate naturally):
${brandPalette.join(', ')}
`;
    }

    // ✅ UPDATED: Map dimensions correctly for DALL-E
    const templateDimensions: { [key: string]: "1024x1024" | "1792x1024" | "1024x1792" } = {
      'instagram-story': '1024x1792',    // Vertical
      'instagram-reel': '1024x1792',     // Vertical
      'youtube-short': '1024x1792',      // Vertical
      'youtube-standard': '1792x1024',   // Horizontal
      'facebook-feed': '1024x1024',      // Square
      'linkedin-video': '1792x1024'      // Horizontal
    };

    const size = templateDimensions[template] || '1024x1024';

    // ✅ IMPROVED: Enhanced prompt structure
    const prompt = `
Create a cinematic, emotionally compelling visual for: ${beat}

SCENE DESCRIPTION:
${sceneDescription}
${visualCuesInstruction}

MARKET CONTEXT:
- Target: ${market.toUpperCase()} audience
- Cultural style: ${getMarketStyle(market)}
- Ensure authentic, locally resonant imagery

VISUAL TONE: ${tone}
Style descriptors: ${toneConfig?.visualDescriptors?.join(', ') || 'authentic, engaging, cinematic'}
${paletteInstructions}
${safetyInstructions}

TECHNICAL SPECIFICATIONS:
- Format: ${template} (${size})
- Lighting: Cinematic, dramatic, professional
- Composition: Dynamic framing, rule of thirds
- Quality: High-resolution, social media optimized
- Safe zones: Leave 15% margins top/bottom for text overlays and compliance strap
- No text or logos in image

EMOTIONAL GOAL:
Create an image that immediately captures attention and tells this story moment visually. 
The image should feel authentic to ${market} culture and resonate emotionally with the target audience.
`.trim();

    console.log(`🎨 Generating image for beat ${beatIndex + 1}/${beat} (${market}/${tone})`);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: size,
      quality: "hd",  // ✅ CHANGED: Use HD for better quality
      style: "natural"  // ✅ ADDED: More vibrant, engaging images
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
      beatIndex  // ✅ NEW: Include beat index in response
    };

    console.log(`✅ Image generated successfully for beat ${beatIndex + 1}`);

    res.status(200).json(result);

  } catch (error) {
    console.error('Image generation error:', error);
    
    if (error instanceof Error) {
      // Handle specific OpenAI API errors
      if (error.message.includes('safety') || error.message.includes('content_policy')) {
        return res.status(400).json({ 
          success: false,
          error: 'Content policy violation. Please adjust your scene description to be more brand-safe.',
          details: error.message
        });
      }
      
      if (error.message.includes('billing') || error.message.includes('insufficient_quota')) {
        return res.status(402).json({ 
          success: false,
          error: 'API quota exceeded. Please check your OpenAI account status.',
          details: error.message
        });
      }

      if (error.message.includes('rate_limit')) {
        return res.status(429).json({ 
          success: false,
          error: 'Rate limit exceeded. Please wait a moment and try again.',
          details: error.message
        });
      }
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate image. Please try again with a different scene description.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// ✅ NEW: Helper function for market-specific styling
function getMarketStyle(market: string): string {
  const styles: { [key: string]: string } = {
    'ng': 'Lagos street energy, vibrant colors, dynamic urban life, Nigerian cultural elements, warm lighting',
    'uk': 'British urban aesthetic, gritty authenticity, working-class roots, cooler tones, overcast natural light',
    'fr': 'French elegance, refined composition, measured restraint, sophisticated color palette, natural European light'
  };
  
  return styles[market] || styles['ng'];
}