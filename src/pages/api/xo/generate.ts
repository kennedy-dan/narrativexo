import { NextApiRequest, NextApiResponse } from 'next';
import { XONarrativeEngine } from '@/lib/xo-narrative-engine';
import { XORenderer, convertLegacyStory } from '@/lib/xo-renderer';
import { XOValidator } from '@/lib/xo-validator';
import { XOContractBuilder } from '@/lib/xo-contract';

// Helper method to extract brand from input
function extractBrandFromInput(input: string): string | undefined {
  if (!input) return undefined;

  const lowerInput = input.toLowerCase();

  // Look for specific brand/product mentions
  if (
    lowerInput.includes('washing machine') ||
    lowerInput.includes('laundry')
  ) {
    return 'washing machine brand';
  }
  if (lowerInput.includes('detergent') || lowerInput.includes('cleaning')) {
    return 'cleaning brand';
  }
  if (lowerInput.includes('car') || lowerInput.includes('automotive')) {
    return 'automotive brand';
  }
  if (lowerInput.includes('phone') || lowerInput.includes('mobile')) {
    return 'mobile brand';
  }
  if (lowerInput.includes('bank') || lowerInput.includes('financial')) {
    return 'financial brand';
  }

  // Extract from phrases like "a [brand] could tell" or "stories for [brand]"
  const brandPatterns = [
    /(?:stories|story) for (?:an? )?([\w\s]+?) (?:brand|company)/i,
    /(?:create|write) (?:stories|story) for ([\w\s]+)/i,
    /(?:brand|company) called ([\w\s]+)/i,
  ];

  for (const pattern of brandPatterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
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
      hasBrandRequest:
        !!brand || userInput?.includes('brand') || userInput?.includes('Brand'),
    });

    // ============================================================================
    // STEP 1: CREATE CONTRACT
    // ============================================================================

    // Extract brand from input if not provided explicitly
    const extractedBrand = extractBrandFromInput(userInput);
    const effectiveBrand = skipBrand ? undefined : brand || extractedBrand;

    // Use meaning contract values when available
    const effectiveMarket = meaningContract?.marketContext?.market || market;
    const entryPath = meaningContract?.entryPath || 'scene';
    
    // Build contract
    const contractBuilder = new XOContractBuilder()
      .withUserInput(userInput || currentStory || '')
      .withMarket(effectiveMarket as any, meaningContract?.marketContext?.confidence || 0.5)
      .withEntryPath(entryPath.toLowerCase() as any)
      .withStrictMode(clientValidationContext.strictMode || false);

    // Handle brand
    if (effectiveBrand) {
      contractBuilder.withBrand(effectiveBrand, 'EXPLICIT');
    }

    // Handle different request types
    switch (requestType) {
      case 'micro-story':
        contractBuilder.withFormatMode('MICROSTORY');
        break;
      case 'full-story':
      case 'story-conversion':
        contractBuilder.withFormatMode('FULLSTORY');
        break;
      case 'purpose-adaptation':
        // Keep existing format
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

        // Convert legacy story to new format if needed
        let existingStory;
        try {
          const parsed = JSON.parse(currentStory);
          existingStory = convertLegacyStory(parsed, contract);
        } catch {
          // If parsing fails, create new story from text
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

        // Create input for adaptation
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

        // Convert existing story
        let existingStory;
        try {
          const parsed = JSON.parse(currentStory);
          existingStory = convertLegacyStory(parsed, contract);
        } catch {
          existingStory = convertLegacyStory({ formattedText: currentStory }, contract);
        }

        story = await XONarrativeEngine.convertToFullStory(existingStory, meaningContract);
        break;
      }

      case 'micro-story':
      default: {
        // Standard story generation
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
    // STEP 3: VALIDATE STORY
    // ============================================================================

    const validator = new XOValidator({
      strictMode: contract.strictMode,
      failOnWarning: contract.strictMode,
    });

    const validation = await validator.validateStory(story);
    const shouldShip = validator.shouldShip(validation);

    // ============================================================================
    // STEP 4: RENDER FORMATTED OUTPUT
    // ============================================================================

    const formattedText = XORenderer.renderMicroStory(story);
    const storyText = XORenderer.extractStoryText(story.beats);

    // Create beat sheet for backward compatibility
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
      storyText, // Clean text without markers
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
        contract: story.contract, // Include full contract for debugging
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

      // Handle validation errors
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