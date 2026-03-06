import { NextApiRequest, NextApiResponse } from 'next';
import { XONarrativeEngine } from '@/lib/xo-narrative-engine';
import { XORenderer, convertLegacyStory } from '@/lib/xo-renderer';
import { XOValidator } from '@/lib/xo-validator';
import { XOContractBuilder } from '@/lib/xo-contract';

function extractBrandFromInput(input: string): string | undefined {
  if (!input) return undefined;

  const lowerInput = input.toLowerCase();

  // ONLY check for specific brand names, NOT categories
  const specificBrands = [
    'nike', 'adidas', 'puma', 'reebok', 'gucci', 'prada',
    'apple', 'samsung', 'google', 'microsoft', 'amazon',
    'iphone', 'samsung', 'xiaomi', 'huawei', 'oneplus',
    'toyota', 'honda', 'bmw', 'mercedes', 'audi', 'volkswagen',
    'coca-cola', 'pepsi', 'starbucks', 'mcdonalds', 'kfc',
    'louis vuitton', 'chanel', 'hermes', 'rolex', 'casio'
  ];
  
  for (const brand of specificBrands) {
    if (lowerInput.includes(brand)) {
      console.log('[XO Generate] Detected brand:', brand);
      return brand;
    }
  }

  // REMOVE the category-based detection that returns "mobile brand"
  // Instead, return undefined if no specific brand found
  
  return undefined; // No brand detected
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
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
      validationContext: clientValidationContext = {},
      targetStructure,
      conversionType,
    } = body;

    console.log('[XO Generate] Request received:', {
      requestType,
      hasMeaningContract: !!meaningContract,
      hasCurrentStory: !!currentStory,
      refinement,
      purpose: purpose?.substring(0, 50),
      hasBrandRequest: !!brand || userInput?.includes('brand'),
    });

    // ============================================================================
    // STEP 1: CREATE CONTRACT
    // ============================================================================

    const extractedBrand = extractBrandFromInput(userInput);
    const effectiveBrand = skipBrand ? undefined : brand || extractedBrand;

    const effectiveMarket = meaningContract?.marketContext?.market || market;
    const entryPath = meaningContract?.entryPath || 'scene';
    
    const contractBuilder = new XOContractBuilder()
      .withUserInput(userInput || currentStory || '')
      .withMarket(effectiveMarket as any, meaningContract?.marketContext?.confidence || 0.5)
      .withEntryPath(entryPath.toLowerCase() as any)
      .withStrictMode(clientValidationContext.strictMode || false);

    // Only add brand if explicitly requested or provided
    if (effectiveBrand) {
      contractBuilder.withBrand(effectiveBrand, 'EXPLICIT');
    }

    switch (requestType) {
      case 'micro-story':
        contractBuilder.withFormatMode('MICROSTORY');
        break;
      case 'full-story':
      case 'story-conversion':
        contractBuilder.withFormatMode('FULLSTORY');
        break;
      case 'purpose-adaptation':
        contractBuilder.withFormatMode(
          currentStory?.includes('HOOK:') ? 'FULLSTORY' : 'MICROSTORY'
        );
        break;
    }

    const contract = contractBuilder.build();

    console.log('[XO Generate] Contract created:', {
      entryPath: contract.entryPath,
      marketCode: contract.marketCode,
      marketState: contract.marketState,
      brandMode: contract.brandMode,
      strictMode: contract.strictMode,
    });

    // ============================================================================
    // STEP 2: GENERATE OR REFINE STORY
    // ============================================================================

    let story: any;

    switch (requestType) {
      case 'refinement': {
        if (!currentStory || !refinement) {
          throw new Error('Refinement requires currentStory and refinement type');
        }

        console.log(`[XO Generate] Refining story: ${refinement}`);

        let existingStory;
        try {
          const parsed = JSON.parse(currentStory);
          existingStory = convertLegacyStory(parsed, contract);
        } catch {
          existingStory = convertLegacyStory({ formattedText: currentStory }, contract);
        }

        story = await XONarrativeEngine.refine(existingStory, refinement as any);
        break;
      }

      case 'purpose-adaptation': {
        if (!currentStory || !purpose) {
          throw new Error('Purpose adaptation requires currentStory and purpose');
        }

        console.log(`[XO Generate] Adapting for purpose: ${purpose.substring(0, 50)}`);

        const inputText = `Adapt this story for: ${purpose}\n\n${currentStory}`;
        story = await XONarrativeEngine.generate(
          inputText,
          contract.marketCode,
          contract.brandName,
          {},
          meaningContract
        );
        break;
      }

  case 'story-conversion': {
  console.log('[XO Generate] Converting micro-story to full story');
  
  if (!currentStory || !targetStructure) {
    throw new Error('Story conversion requires currentStory and targetStructure');
  }
  
  let existingStory;
  try {
    const parsed = JSON.parse(currentStory);
    existingStory = convertLegacyStory(parsed, contract);
  } catch {
    existingStory = convertLegacyStory({ formattedText: currentStory }, contract);
  }
  
  // Ensure meaningContract has FULLSTORY format
  const enhancedMeaningContract = {
    ...meaningContract,
    formatMode: 'FULLSTORY',
    maxBeats: 5,
    entryPath: 'full'
  };
  
  story = await XONarrativeEngine.convertToFullStory(
    existingStory, 
    enhancedMeaningContract
  );
  break;
}

      case 'micro-story':
      default: {
        console.log('[XO Generate] Generating micro-story');

        story = await XONarrativeEngine.generate(
          userInput || currentStory || '',
          contract.marketCode,
          contract.brandName,
          {},
          meaningContract
        );
        
        break;
      }
    }

    // ============================================================================
    // STEP 3: VALIDATE STORY WITH ALL FIXES
    // ============================================================================

    const validator = new XOValidator({
      strictMode: contract.strictMode,
      failOnWarning: contract.strictMode,
      validateAllowedNouns: true,
      validateMarketLeakage: true,
      validateBrandPlacement: true,
    });

    let validation = await validator.validateStory(story);
    let shouldShip = validator.shouldShip(validation);

 

    // ============================================================================
    // STEP 4: RENDER FORMATTED OUTPUT
    // ============================================================================

    const formattedText = XORenderer.renderMicroStory(story);
const storyText = XORenderer.extractStoryText(story.beats, story.contract);  // Pass contract for brand handling

    const beatSheet = story.beats.map((beat: any, index: number) => ({
      beat: `Beat ${index + 1}`,
      description: beat.lines.join(' '),
      lines: beat.lines,
      emotion: beat.emotion,
      tension: beat.tension,
      marker: beat.marker,
    }));

    // ============================================================================
    // STEP 5: PREPARE RESPONSE
    // ============================================================================

    const response = {
      success: true,
      story: formattedText,
      storyText,
      beatSheet,
      metadata: {
        title: `Story: ${story.contract.context.seedMoment.substring(0, 50)}...`,
        market: story.contract.marketCode,
        entryPath: story.contract.entryPath,
        marketState: story.contract.marketState,
        brandMode: story.contract.brandMode,
        brandName: story.contract.brandName,
        timestamp: story.timestamp,
        beatCount: story.beats.length,
        wordCount: storyText.split(/\s+/).length,
        validation,
        shouldShip,
        contract: story.contract,
      },
      microStory: {
        beats: story.beats,
        contract: story.contract,
        timestamp: story.timestamp,
      },
    };

    // ============================================================================
    // STEP 6: LOG AND RETURN
    // ============================================================================

    console.log('[XO Generate] Generation complete:', {
      market: story.contract.marketCode,
      entryPath: story.contract.entryPath,
      brand: story.contract.brandName,
      beatCount: story.beats.length,
      validationPassed: validation.passed,
      shouldShip,
      validationErrors: validation.errors?.length || 0,
      validationWarnings: validation.warnings?.length || 0,
    });

    if (!validation.passed) {
      console.warn('[XO Generate] Validation failed:', {
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('[XO Generate] Error:', error);

    let errorMessage = 'Failed to generate story';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      if (
        error.message.includes('validation') ||
        error.message.includes('Market leakage') ||
        error.message.includes('Invention found') ||
        error.message.includes('Brand before meaning')
      ) {
        statusCode = 400;
      }
    }

    const errorResponse = {
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error',
    };

    return res.status(statusCode).json(errorResponse);
  }
}