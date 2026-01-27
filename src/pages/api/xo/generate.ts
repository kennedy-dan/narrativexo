// /pages/api/xo/generate.ts
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
      market = 'GLOBAL', // Default top-level market
      brand,
      meaningContract,
      requestType = 'micro-story',
      purpose,
      currentStory,
      refinement,
      brandContext,
      skipBrand = false
    } = body;

    // PRIORITIZE meaningContract.marketContext.market over top-level market
    const effectiveMarket = meaningContract?.marketContext?.market || market;
    
    console.log('[XO Generate] Request:', {
      requestType,
      topLevelMarket: market,
      effectiveMarket,
      hasMeaningContract: !!meaningContract,
      meaningContractMarket: meaningContract?.marketContext?.market,
      hasBrand: !!brand,
      refinement
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
      // EPIC 3: Refinement Controls
      const parsedStory: MicroStory = JSON.parse(currentStory);
      microStory = await XONarrativeEngine.refine(parsedStory, refinement);
      
      // Convert to your existing format - USE effectiveMarket
      result = await generateXOStory(
        microStory.beats.map(beat => beat.lines.join('\n')).join('\n\n'),
        effectiveMarket, // Use effective market here
        brand
      );
      
    } else if (requestType === 'purpose-adaptation' && meaningContract && currentStory) {
      // Adapt existing story for purpose
      const storyText = currentStory;
      
      // Generate new story with purpose - USE effectiveMarket
      microStory = await XONarrativeEngine.generate(
        storyText + (purpose ? `\n\nPurpose: ${purpose}` : ''),
        effectiveMarket, // Use effective market here
        skipBrand ? undefined : brand
      );
      
      result = await generateXOStory(storyText, effectiveMarket, brand);
      
    } else if (meaningContract) {
      // Use meaning contract for generation
      const inputText = meaningContract.seedMoment || userInput;
      
      console.log('[XO Generate] Using meaning contract:', {
        seedMoment: meaningContract.seedMoment,
        marketContext: meaningContract.marketContext,
        effectiveMarket
      });
      
      // USE effectiveMarket (from meaningContract.marketContext.market)
      microStory = await XONarrativeEngine.generate(
        inputText,
        effectiveMarket, // CRITICAL: Use effective market here
        skipBrand ? undefined : brand
      );
      
      result = await generateXOStory(inputText, effectiveMarket, brand);
      
    } else {
      // Standard generation - USE effectiveMarket
      microStory = await XONarrativeEngine.generate(
        userInput,
        effectiveMarket, // Use effective market here
        brand
      );
      
      result = await generateXOStory(userInput, effectiveMarket, brand);
    }

    // Add micro-story to result if available
    if (microStory) {
      result.microStory = microStory;
    }

    // Add brand context if provided
    if (brandContext) {
      result.metadata = {
        ...result.metadata,
        isBrandStory: true,
        brandName: brandContext.name,
        brandPalette: brandContext.palette,
        brandFonts: brandContext.fonts
      };
    }

    console.log('[XO Generate] Success:', {
      beats: microStory?.beats?.length || 0,
      effectiveMarket,
      hasBrand: !!brand,
      wordCount: result.story?.split(/\s+/).length || 0
    });

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('[XO Generate] Error:', error);
    
    // Provide more specific error messages
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