import { NextApiRequest, NextApiResponse } from 'next';
import { XONarrativeEngine, generateXOStory, MicroStory } from '@/lib/xo-narrative-engine';
import { XOValidator } from '@/lib/validator-engine';
import { ValidationContext } from '@/lib/types';

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
      skipBrand = false,
      validationContext: clientValidationContext = {}
    } = body;

    console.log('[XO Generate] Request received:', {
      requestType,
      hasMeaningContract: !!meaningContract,
      hasCurrentStory: !!currentStory,
      refinement,
      purpose: purpose?.substring(0, 50)
    });

    // ============================================================================
    // STEP 1: DETERMINE CONTEXT FROM MEANING CONTRACT OR INPUT
    // ============================================================================
    
    // Use meaning contract values when available (from /api/clarify)
    const effectiveMarket = meaningContract?.marketContext?.market || market;
    const entryPath = meaningContract?.entryPath || 'seed';
    const tone = meaningContract?.interpretedMeaning?.emotionalState?.toUpperCase() || 'NEUTRAL';
    const seedMoment = meaningContract?.seedMoment || userInput || currentStory?.substring(0, 100) || '';

    // Validate market is one of Starter Pack markets
    const validMarkets = ['NG', 'GH', 'KE', 'ZA', 'UK', 'GLOBAL'] as const;
    const safeMarket = validMarkets.includes(effectiveMarket as any) 
      ? effectiveMarket as typeof validMarkets[number]
      : 'GLOBAL';

    // Validate entry path is one of Starter Pack paths
    const validEntryPaths = ['EMOTION', 'SCENE', 'STORY_SEED', 'AUDIENCE_SIGNAL'] as const;
    const safeEntryPath = validEntryPaths.includes(entryPath.toUpperCase() as any)
      ? entryPath.toUpperCase() as typeof validEntryPaths[number]
      : 'STORY_SEED';

    console.log('[XO Generate] Context determined:', {
      effectiveMarket: safeMarket,
      entryPath: safeEntryPath,
      tone,
      hasBrand: !!brand,
      brandName: brand,
      seedMomentLength: seedMoment.length
    });

    // ============================================================================
    // STEP 2: INITIALIZE VALIDATOR ENGINE
    // ============================================================================
    
    const validator = new XOValidator({
      validateMarketLeakage: true,
      validateStructure: true,
      validateTone: tone !== 'NEUTRAL',
      validateSchema: false, // We'll validate output format separately
      requireStorySections: false,
      failOnWarning: clientValidationContext.strictMode || false,
      failOnMissingMarkers: true,
      toneThreshold: 0.2
    });

    // ============================================================================
    // STEP 3: GENERATE OR REFINE STORY BASED ON REQUEST TYPE
    // ============================================================================
    
    let microStory: MicroStory | null = null;
    let generatedText = '';
    let beats: any[] = [];

    switch (requestType) {
      case 'refinement': {
        // Handle refinement requests (expand, gentler, harsher)
        if (!currentStory || !refinement) {
          throw new Error('Refinement requires currentStory and refinement type');
        }

        console.log(`[XO Generate] Refining story: ${refinement}`);
        
        try {
          // Parse the current story
          const parsedStory: MicroStory = JSON.parse(currentStory);
          microStory = await XONarrativeEngine.refine(parsedStory, refinement);
        } catch (error) {
          // If JSON parsing fails, treat as raw text
          console.log('[XO Generate] Parsing as raw text for refinement');
          const rawStory: MicroStory = {
            beats: currentStory.split('\n\n').map(beat => ({
              lines: beat.split('\n').filter(line => line.trim())
            })),
            market: safeMarket,
            entryPath: safeEntryPath.toLowerCase() as any,
            timestamp: new Date().toISOString()
          };
          microStory = await XONarrativeEngine.refine(rawStory, refinement);
        }
        break;
      }

      case 'purpose-adaptation': {
        // Handle purpose adaptation (brand, platform, etc.)
        if (!currentStory || !purpose) {
          throw new Error('Purpose adaptation requires currentStory and purpose');
        }

        console.log(`[XO Generate] Adapting for purpose: ${purpose.substring(0, 50)}`);
        
        const inputText = currentStory + (purpose ? `\n\nPurpose: ${purpose}` : '');
        microStory = await XONarrativeEngine.generate(
          inputText,
          safeMarket,
          skipBrand ? undefined : brand
        );
        break;
      }

      case 'micro-story':
      default: {
        // Standard story generation
        console.log('[XO Generate] Generating micro-story');
        microStory = await XONarrativeEngine.generate(
          seedMoment,
          safeMarket,
          skipBrand ? undefined : brand
        );
        break;
      }
    }

    // Ensure microStory has the correct context
    if (microStory) {
      microStory.market = safeMarket;
      microStory.entryPath = safeEntryPath.toLowerCase() as any;
      
      // Ensure formatted text exists
      if (!microStory.formattedText) {
        microStory.formattedText = XONarrativeEngine.formatWithPathMarkers(microStory);
      }

      generatedText = microStory.formattedText;
      beats = microStory.beats.map((beat, index) => ({
        beat: `Beat ${index + 1}`,
        description: beat.lines.join(' '),
        lines: beat.lines,
        emotion: beat.emotion,
        tension: beat.tension
      }));
    } else {
      throw new Error('Failed to generate story');
    }

    // ============================================================================
    // STEP 4: VALIDATE GENERATED OUTPUT
    // ============================================================================
    
    const validationContext: ValidationContext = {
      market: safeMarket,
      entryPath: safeEntryPath,
      tone: tone as any,
      format: 'SHORT',
      brandName: brand
    };

    console.log('[XO Generate] Validating output with context:', validationContext);
    
    const outputValidation = await validator.validateOutput(
      generatedText,
      validationContext
    );

    // Check CI/CD gate
    const shouldShip = validator.shouldShip(outputValidation);

    // ============================================================================
    // STEP 5: PREPARE METADATA
    // ============================================================================
    
    const metadata = {
      title: `Story: ${meaningContract?.interpretedMeaning?.coreTheme || 'Human Experience'}`,
      market: safeMarket,
      entryPath: safeEntryPath,
      tone,
      emotionalState: meaningContract?.interpretedMeaning?.emotionalState || 'neutral',
      narrativeTension: meaningContract?.interpretedMeaning?.narrativeTension || 'unresolved',
      intentCategory: meaningContract?.interpretedMeaning?.intentCategory || 'express',
      coreTheme: meaningContract?.interpretedMeaning?.coreTheme || 'human experience',
      isBrandStory: !!brand && !skipBrand,
      brandName: brand,
      timestamp: new Date().toISOString(),
      beatCount: beats.length,
      wordCount: generatedText.split(/\s+/).length,
      validation: outputValidation,
      shouldShip,
      // Include brand context if provided
      ...(brandContext && {
        brandPalette: brandContext.palette,
        brandFonts: brandContext.fonts
      })
    };

    // ============================================================================
    // STEP 6: VALIDATE RESPONSE FORMAT
    // ============================================================================
    
    const response = {
      success: true,
      story: generatedText,
      beatSheet: beats,
      metadata,
      microStory: {
        beats: microStory.beats,
        market: microStory.market,
        entryPath: microStory.entryPath,
        timestamp: microStory.timestamp
      }
    };

    // Validate the response format itself
    const formatValidation = validator.validateXOFormat(response);
    if (!formatValidation.passed) {
      console.warn('[XO Generate] Response format validation warnings:', formatValidation.warnings);
    }

    // ============================================================================
    // STEP 7: LOG RESULTS AND RETURN
    // ============================================================================
    
    console.log('[XO Generate] Generation complete:', {
      market: safeMarket,
      entryPath: safeEntryPath,
      beatCount: beats.length,
      wordCount: metadata.wordCount,
      validationPassed: outputValidation.passed,
      shouldShip,
      validationErrors: outputValidation.errors?.length || 0,
      validationWarnings: outputValidation.warnings?.length || 0
    });

    if (!outputValidation.passed) {
      console.warn('[XO Generate] Validation failed:', {
        errors: outputValidation.errors,
        warnings: outputValidation.warnings
      });
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('[XO Generate] Error:', error);
    
    let errorMessage = 'Failed to generate story';
    let statusCode = 500;
    let validationError = null;

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle validation errors specifically
      if (error.message.includes('validation failed') || 
          error.message.includes('Market leakage') ||
          error.message.includes('Missing path marker')) {
        statusCode = 400;
        validationError = {
          type: 'validation_error',
          message: error.message,
          shouldShip: false
        };
      } else if (error.message.includes('market')) {
        statusCode = 400;
        errorMessage = 'Market validation error. Please check your market settings.';
      }
    }

    const errorResponse = {
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error',
      ...(validationError && { validation: validationError })
    };

    return res.status(statusCode).json(errorResponse);
  }
}