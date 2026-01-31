import { NextApiRequest, NextApiResponse } from 'next';
import { XONarrativeEngine, generateXOStory, MicroStory } from '@/lib/xo-narrative-engine';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { 
      userInput, 
      market = 'GLOBAL',
      brand,
      meaningContract,
      requestType = 'micro-story',
      purpose,
      currentStory,
      refinement,
      brandContext,
      skipBrand = false
    } = body;

    // Frontend brand takes priority
    const effectiveBrand = (brand && brand.trim() !== '') ? brand.trim() : undefined;
    const effectiveMarket = meaningContract?.marketContext?.market || market;
    
    console.log('[XO Generate] Request:', {
      requestType,
      frontendBrand: brand,
      effectiveBrand,
      effectiveMarket,
      refinement,
      skipBrand
    });

    // Validate input
    if (!userInput && !meaningContract && !currentStory) {
      return res.status(400).json({ 
        success: false, 
        error: 'Either userInput, meaningContract, or currentStory is required' 
      });
    }

    let result: any;
    let microStory: MicroStory | null = null;

    if (requestType === 'refinement' && currentStory && refinement) {
      // Refinement
      const parsedStory: MicroStory = JSON.parse(currentStory);
      microStory = await XONarrativeEngine.refine(parsedStory, refinement);
      const storyText = microStory.beats.map(beat => beat.lines.join('\n')).join('\n\n');
      
      result = await generateXOStory(
        storyText,
        effectiveMarket,
        effectiveBrand,
        meaningContract
      );
      
    } else if (requestType === 'purpose-adaptation' && meaningContract && currentStory) {
      // Purpose adaptation
      microStory = await XONarrativeEngine.generate(
        currentStory + (purpose ? `\n\nPurpose: ${purpose}` : ''),
        effectiveMarket,
        skipBrand ? undefined : effectiveBrand
      );
      
      result = await generateXOStory(currentStory, effectiveMarket, effectiveBrand, meaningContract);
      
    } else if (meaningContract) {
      // Use meaning contract
      const inputText = meaningContract.seedMoment || userInput;
      
      microStory = await XONarrativeEngine.generate(
        inputText,
        effectiveMarket,
        skipBrand ? undefined : effectiveBrand
      );
      
      result = await generateXOStory(inputText, effectiveMarket, effectiveBrand, meaningContract);
      
    } else {
      // Standard generation
      microStory = await XONarrativeEngine.generate(
        userInput,
        effectiveMarket,
        effectiveBrand
      );
      
      result = await generateXOStory(userInput, effectiveMarket, effectiveBrand);
    }

    // Add micro-story to result
    if (microStory) {
      result.microStory = microStory;
    }

    // Add brand context
    if (brandContext && effectiveBrand) {
      result.metadata = {
        ...result.metadata,
        isBrandStory: true,
        brandName: effectiveBrand,
        brandPalette: brandContext.palette,
        brandFonts: brandContext.fonts
      };
    }

    // Ensure metadata reflects brand status
    if (effectiveBrand) {
      result.metadata.isBrandStory = true;
      result.metadata.brandName = effectiveBrand;
    }

    console.log('[XO Generate] Success:', {
      beats: microStory?.beats?.length || 0,
      effectiveMarket,
      hasBrand: !!effectiveBrand,
      brandName: effectiveBrand,
      wordCount: result.story?.split(/\s+/).length || 0
    });

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('[XO Generate] Error:', error);
    
    let errorMessage = 'Failed to generate story';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('validation failed')) {
        errorMessage = 'Story validation failed. Please try again with different input.';
        statusCode = 400;
      } else if (error.message.includes('market')) {
        errorMessage = 'Market validation error. Please check your market settings.';
        statusCode = 400;
      } else {
        errorMessage = error.message;
      }
    }

    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}