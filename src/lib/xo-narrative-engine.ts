/**
 * XO NARRATIVE ENGINE v3.0
 * Contract-first, deterministic story generation
 * WITH FULL CONTAINMENT: Ontology + Event Gate + Deterministic Validation
 */

import OpenAI from 'openai';
import { XOContract, XOContractBuilder, createContractFromMeaningContract } from './xo-contract';
import { XORenderer, MicroStory, MicroStoryBeat } from './xo-renderer';
import { XOValidator } from './xo-validator';
import { XOOntologyBuilder, XOOntologyValidator } from './xo-ontology-builder';
import { XOEventGate, XOEventValidator, EventGate } from './xo-event-gate';

// ============================================================================
// TYPES
// ============================================================================

export interface XONarrativeOptions {
  temperature?: number;
  maxTokens?: number;
  passes?: number;
  validateEachPass?: boolean;
  minOntologyConfidence?: number;
  strictMode?: boolean;
}

export interface GenerationPass {
  passId: number;
  beats: MicroStoryBeat[];
  valid: boolean;
  errors?: string[];
  nounViolations?: any[];
  eventViolations?: any[];
}

export interface GenerationContext {
  ontology: Awaited<ReturnType<typeof XOOntologyBuilder.buildOntology>>;
  eventGate: EventGate;
  densityConfidence: number;
    metadata?: any; // Add this for separate metadata

}

// ============================================================================
// NARRATIVE ENGINE
// ============================================================================

export class XONarrativeEngine {
  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  /**
   * Generate a micro-story with contract-first approach
   * NOW WITH FULL CONTAINMENT SYSTEM
   */
  static async generate(
    input: string,
    market: string = 'GLOBAL',
    brand?: string,
    options: XONarrativeOptions = {},
    meaningContract?: any,
    originalStory?: MicroStory
  ): Promise<MicroStory> {
    console.log('[XO Engine] ========================================');
    console.log('[XO Engine] Generating story with full containment');
    console.log('[XO Engine] Input:', input.substring(0, 100));
    
    // ============================================================================
    // STEP 1: BUILD ONTOLOGY (What can exist)
    // ============================================================================
    
    const ontology = await XOOntologyBuilder.buildOntology(input, {
      minConfidence: options.minOntologyConfidence || 0.8
    });
    
    console.log('[XO Engine] Ontology built:', {
      coreEntities: ontology.coreEntities,
      expandedCount: ontology.expandedNouns.length,
      density: ontology.density,
      totalAllowed: ontology.allAllowedNouns.length,
      expansionLimit: ontology.metadata.expansionLimit
    });

    // ============================================================================
    // STEP 2: BUILD EVENT GATE (What can happen)
    // ============================================================================
    
    const eventGate = await XOEventGate.buildEventGate(
      input,
      ontology.density,
      { minConfidence: options.minOntologyConfidence || 0.8 }
    );

    console.log('[XO Engine] Event gate built:', {
      allowedVerbs: eventGate.allowedVerbs.length,
      maxEvents: eventGate.maxEvents,
      categories: [...new Set(eventGate.allowedVerbs.map(v => v.category))],
      densityConfidence: eventGate.metadata.confidence
    });

    // ============================================================================
    // STEP 3: CREATE CONTRACT
    // ============================================================================
    
// ============================================================================
// STEP 3: CREATE CONTRACT (with separate metadata)
// ============================================================================

let contract: XOContract;

if (originalStory) {
  // Use original story's contract as base
  const builder = new XOContractBuilder(originalStory.contract);
  contract = builder.build();
} else {
  // Build from scratch
  const builder = new XOContractBuilder()
    .withUserInput(input)
    .withMarket(market as any, 0.5)
    .withEntryPath(this.detectEntryPath(input))
    .withFormatMode('MICROSTORY')
    .withStrictMode(false);
  
  if (brand) {
    builder.withBrand(brand, 'EXPLICIT');
  }
  
  if (meaningContract) {
    // Handle meaning contract if present
    if (meaningContract.marketContext?.market) {
      builder.withMarket(meaningContract.marketContext.market, meaningContract.marketContext.confidence || 0.5);
    }
    if (meaningContract.entryPath) {
      builder.withEntryPath(meaningContract.entryPath.toLowerCase() as any);
    }
  }
  
  contract = builder.build();
}

// Override allowed nouns (these are in context, which should be mutable)
contract.context.allowedNouns = ontology.allAllowedNouns;

// Create separate metadata object (not attached to contract)
const generationMetadata = {
  ontology: {
    coreEntities: ontology.coreEntities,
    expandedNouns: ontology.expandedNouns.map(n => n.noun),
    density: ontology.density
  },
  eventGate: {
    allowedVerbs: eventGate.allowedVerbs,
    maxEvents: eventGate.maxEvents,
    maxEmotionalIntensity: eventGate.maxEmotionalIntensity,
    allowBackstory: eventGate.allowBackstory,
    allowFutureTense: eventGate.allowFutureTense,
    allowCognitiveEvents: eventGate.allowCognitiveEvents,
    allowRelationalEvents: eventGate.allowRelationalEvents,
    allowExistentialEvents: eventGate.allowExistentialEvents,
    metadata: eventGate.metadata
  }
};

// ============================================================================
// STEP 4: GENERATE IN PASSES WITH CONSTRAINTS
// ============================================================================

const context: GenerationContext = {
  ontology,
  eventGate,
  densityConfidence: eventGate.metadata.confidence,
  metadata: generationMetadata // Pass metadata separately
};

const passes = await this.generatePasses(
  input, 
  contract, 
  options, 
  context
);
    // ============================================================================
    // STEP 5: SELECT BEST PASS
    // ============================================================================
    
    const bestPass = this.selectBestPass(passes, contract);
    
    if (!bestPass) {
      throw new Error('[XO Engine] All generation passes failed validation');
    }

    // ============================================================================
    // STEP 6: BUILD FINAL STORY
    // ============================================================================
    
    const story: MicroStory = {
      beats: bestPass.beats,
      contract,
      timestamp: new Date().toISOString(),
    };

    // ============================================================================
    // STEP 7: FINAL VALIDATION (Deterministic, LLM-powered)
    // ============================================================================
    
    console.log('[XO Engine] Running final validation...');

    // Validate nouns using LLM extraction + set comparison
    const nounValidation = await XOOntologyValidator.validateAgainstOntology(
      story.beats,
      ontology.allAllowedNouns
    );

    if (!nounValidation.valid) {
      console.warn('[XO Engine] ❌ Noun violations detected:', {
        count: nounValidation.violations.length,
        examples: nounValidation.violations.slice(0, 3).map(v => v.word)
      });
      
      if (options.strictMode || contract.strictMode) {
        throw new Error(`Noun violation: ${nounValidation.violations[0]?.word} not allowed`);
      }
    }

    // Validate events using LLM extraction + set comparison
    const eventValidation = await XOEventValidator.validateEvents(
      story.beats,
      eventGate,
      eventGate.metadata.confidence
    );

    if (!eventValidation.valid) {
      console.warn('[XO Engine] ❌ Event violations detected:', {
        count: eventValidation.violations.length,
        examples: eventValidation.violations.slice(0, 3).map(v => v.details)
      });
      
      if (options.strictMode || contract.strictMode) {
        throw new Error(`Event violation: ${eventValidation.violations[0]?.details}`);
      }
    }

    // ============================================================================
    // STEP 8: FINAL LOGGING
    // ============================================================================
    
    console.log('[XO Engine] ✅ Generation complete:', {
      beats: story.beats.length,
      nounValidation: nounValidation.stats,
      eventValidation: eventValidation.stats,
      passed: nounValidation.valid && eventValidation.valid
    });
    console.log('[XO Engine] ========================================');

    return story;
  }

  /**
   * Create contract for generation
   */
  private static createGenerationContract(
    input: string,
    market: string,
    brand?: string,
    meaningContract?: any,
    originalStory?: MicroStory
  ): XOContract {
    const builder = new XOContractBuilder();
    
    if (originalStory) {
      // Use original story's contract as base
      builder.withUserInput(originalStory.contract.context.seedMoment);
      
      builder.contract.context = {
        ...originalStory.contract.context,
        timestamp: new Date().toISOString()
      };
      
      const effectiveMarket = meaningContract?.marketContext?.market || 
                             originalStory.contract.marketCode || 
                             market;
      builder.withMarket(effectiveMarket as any, 0.5);
      
      const entryPath = meaningContract?.entryPath || 
                       originalStory.contract.entryPath || 
                       'scene';
      builder.withEntryPath(entryPath.toLowerCase() as any);
      
      if (meaningContract?.formatMode === 'FULLSTORY' || meaningContract?.maxBeats === 5) {
        builder.withFormatMode('FULLSTORY');
        builder.withMaxBeats(5);
        builder.withEntryPath('full');
      } else {
        builder.withFormatMode(originalStory.contract.formatMode);
      }
      
    } else {
      // Build from scratch
      builder.withUserInput(input);
      
      if (meaningContract) {
        const contract = createContractFromMeaningContract(meaningContract);
        if (brand) {
          builder.withBrand(brand, 'EXPLICIT');
        }
        return builder.build();
      }
      
      builder
        .withMarket(market as any, 0.5)
        .withEntryPath(this.detectEntryPath(input))
        .withFormatMode('MICROSTORY')
        .withStrictMode(false);
    }
    
    if (brand) {
      builder.withBrand(brand, 'EXPLICIT');
    }
    
    return builder.build();
  }

  /**
   * Generate story in multiple passes
   */
  private static async generatePasses(
    input: string,
    contract: XOContract,
    options: XONarrativeOptions,
    context: GenerationContext
  ): Promise<GenerationPass[]> {
    const passes: GenerationPass[] = [];
    const maxPasses = options.passes || 3;
    
    for (let passId = 1; passId <= maxPasses; passId++) {
      console.log(`[XO Engine] Starting pass ${passId}/${maxPasses}`);
      
      try {
        let beats = await this.generateSinglePass(
          input, 
          contract, 
          passId, 
          options,
          context
        );
        
        // Validate this pass
        const validation = await this.validatePass(beats, contract, context);
        
        passes.push({
          passId,
          beats,
          valid: validation.valid,
          errors: validation.errors,
          nounViolations: validation.nounViolations,
          eventViolations: validation.eventViolations
        });
        
        // If this pass is valid and we're not in strict mode, stop early
        if (validation.valid && !contract.strictMode) {
          console.log(`[XO Engine] Pass ${passId} valid, stopping early`);
          break;
        }
        
        // If there are violations but we have more passes, try regeneration
        if (!validation.valid && passId < maxPasses && validation.nounViolations?.length) {
          console.log(`[XO Engine] Pass ${passId} has ${validation.nounViolations.length} noun violations, regenerating...`);
          beats = await this.regenerateProblemBeats(
            beats,
            validation.nounViolations,
            contract,
            context,
            passId + 1
          );
          
          // Re-validate after regeneration
          const revalidation = await this.validatePass(beats, contract, context);
          passes.push({
            passId: passId + 0.5, // Indicate it's a regenerated pass
            beats,
            valid: revalidation.valid,
            errors: revalidation.errors,
            nounViolations: revalidation.nounViolations,
            eventViolations: revalidation.eventViolations
          });
        }
        
      } catch (error) {
        console.error(`[XO Engine] Pass ${passId} failed:`, error);
        passes.push({
          passId,
          beats: [],
          valid: false,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        });
      }
    }
    
    return passes;
  }

  /**
   * Generate a single pass with full constraints
   */
  private static async generateSinglePass(
    input: string,
    contract: XOContract,
    passId: number,
    options: XONarrativeOptions,
    context: GenerationContext
  ): Promise<MicroStoryBeat[]> {
    
    // Build system prompt with ontology and event constraints
    const systemPrompt = this.buildSystemPrompt(contract, passId, context);
    
    // Build user prompt
    const userPrompt = this.buildUserPrompt(input, contract, context);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: options.temperature || 0.0,
        max_tokens: options.maxTokens || 400,
        frequency_penalty: 0.3, // Slightly higher to reduce repetition
        presence_penalty: 0.2,
      });
      
      const rawResponse = completion.choices[0].message.content?.trim() || '';
      
      // Parse response into beats
      const beats = this.parseResponseToBeats(rawResponse, contract);
      
      // Apply post-processing
      return this.postProcessBeats(beats, contract, context);
      
    } catch (error) {
      console.error('[XO Engine] Generation failed:', error);
      throw new Error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build system prompt with full constraints
   */
  private static buildSystemPrompt(
    contract: XOContract,
    passId: number,
    context: GenerationContext
  ): string {
    const { entryPath, marketCode, marketState, brandMode, brandName, maxBeats } = contract;
    const { ontology, eventGate } = context;
    
    // Market guidance
    const marketGuidance = marketState === 'RESOLVED' 
      ? `MARKET: ${marketCode} - Use authentic but natural context`
      : `MARKET: NEUTRAL - No regional specifics, slang, or cultural props`;
    
    // Brand guidance
    let brandGuidance = '';
    if (brandMode === 'EXPLICIT' && brandName) {
      brandGuidance = `BRAND: ${brandName} - Include naturally in final beat only`;
    } else if (brandMode === 'IMPLICIT' && brandName) {
      brandGuidance = `BRAND: ${brandName} - Suggest implicitly, no direct mention`;
    } else {
      brandGuidance = `NO BRAND - Focus on human experience`;
    }
    
    // Get markers
    const markers = this.getMarkersForEntryPath(entryPath);
    
    // Ontology section
    const ontologySection = `
🔒 STRICT ONTOLOGY ENFORCEMENT:
You MUST use ONLY these nouns:
${ontology.allAllowedNouns.map(n => `- ${n}`).join('\n')}

CRITICAL RULES:
- EVERY noun in your response MUST be from this list
- If you need a noun not in this list, you MUST NOT use it
- Find another way to express the idea without new nouns
- This is NOT optional - it's enforced by validation
    `;

    // Event gate constraints
    const eventConstraints = XOEventGate.getEventConstraintsPrompt(eventGate);

    // Format rules
    const formatRules = `
🚫 ABSOLUTELY FORBIDDEN - YOU WILL BE PENALIZED FOR THESE:
❌ NEVER write "In this beat", "This beat shows", "Beat 1", etc.
❌ NEVER write any explanatory text or meta commentary
❌ NEVER number or label your beats in any way
❌ NEVER use phrases like "We see", "We notice", "We feel"

✅ YOU MUST OUTPUT EXACTLY THIS FORMAT:
[MARKER]
[CONTENT LINE 1]
[CONTENT LINE 2 (if needed)]

EXAMPLE OF CORRECT FORMAT:
${markers[0]}
The quiet room held morning light.

${markers[1]}
Small details revealed themselves slowly.
    `;

    return `
You are generating micro-stories for the XO system.

CRITICAL CONSTRAINTS:
${marketGuidance}
${brandGuidance}

${ontologySection}

${eventConstraints}

${formatRules}

PASS ${passId}: ${passId === 1 ? 'Focus on core experience' : passId === 2 ? 'Focus on emotional arc' : 'Focus on resolution'}
    `;
  }

  /**
   * Build user prompt
   */
  private static buildUserPrompt(
    input: string,
    contract: XOContract,
    context: GenerationContext
  ): string {
    const { ontology } = context;
    
    return `
INPUT: "${input.substring(0, 200)}${input.length > 200 ? '...' : ''}"

CONTEXT ELEMENTS (use only these nouns):
${ontology.allAllowedNouns.map(noun => `- ${noun}`).join('\n')}

Generate a ${contract.maxBeats}-beat micro-story following all rules.
    `;
  }

  /**
   * Parse LLM response into beats
   */
  private static parseResponseToBeats(response: string, contract: XOContract): MicroStoryBeat[] {
    const markers = this.getMarkersForEntryPath(contract.entryPath);
    const beats: MicroStoryBeat[] = [];
    let remainingText = response;
    
    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i];
      const markerIndex = remainingText.indexOf(marker);
      
      if (markerIndex === -1) {
        beats.push({ lines: ['[Content]'], marker });
        continue;
      }
      
      let contentStart = markerIndex + marker.length;
      let contentEnd = remainingText.length;
      
      for (let j = i + 1; j < markers.length; j++) {
        const nextMarker = markers[j];
        const nextIndex = remainingText.indexOf(nextMarker, contentStart);
        if (nextIndex !== -1 && nextIndex < contentEnd) {
          contentEnd = nextIndex;
          break;
        }
      }
      
      let content = remainingText.substring(contentStart, contentEnd).trim();
      
      // Clean the content
      const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .filter(line => {
          const lowerLine = line.toLowerCase();
          // Filter out meta commentary
          return !(
            lowerLine.startsWith('in this beat') ||
            lowerLine.startsWith('this beat') ||
            lowerLine.startsWith('beat') ||
            lowerLine.startsWith('we see') ||
            lowerLine.startsWith('we notice') ||
            lowerLine.startsWith('the story')
          );
        })
        .slice(0, contract.maxLinesPerBeat);
      
      beats.push({
        lines: lines.length > 0 ? lines : ['[Content]'],
        marker
      });
    }
    
    return beats.slice(0, contract.maxBeats);
  }

  /**
   * Post-process beats
   */
  private static postProcessBeats(
    beats: MicroStoryBeat[],
    contract: XOContract,
    context: GenerationContext
  ): MicroStoryBeat[] {
    const { ontology } = context;
    
    return beats.map(beat => ({
      ...beat,
      lines: beat.lines.map(line => {
        // Basic line cleanup
        let cleanLine = line.trim();
        
        // Ensure line doesn't start with markers
        if (cleanLine.startsWith('SCENE_INPUT:') || 
            cleanLine.startsWith('EMOTION_INPUT:') ||
            cleanLine.startsWith('STORY:')) {
          cleanLine = cleanLine.replace(/^(SCENE_INPUT|EMOTION_INPUT|STORY):\s*/i, '');
        }
        
        return cleanLine;
      })
    }));
  }

  /**
   * Validate a generation pass
   */
  private static async validatePass(
    beats: MicroStoryBeat[],
    contract: XOContract,
    context: GenerationContext
  ): Promise<{
    valid: boolean;
    errors?: string[];
    nounViolations?: any[];
    eventViolations?: any[];
  }> {
    const { ontology, eventGate, densityConfidence } = context;
    const errors: string[] = [];
    
    // Validate nouns
    const nounValidation = await XOOntologyValidator.validateAgainstOntology(
      beats,
      ontology.allAllowedNouns
    );
    
    if (!nounValidation.valid) {
      errors.push(`Noun violations: ${nounValidation.violations.length}`);
    }
    
    // Validate events
    const eventValidation = await XOEventValidator.validateEvents(
      beats,
      eventGate,
      densityConfidence
    );
    
    if (!eventValidation.valid) {
      errors.push(`Event violations: ${eventValidation.violations.length}`);
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      nounViolations: nounValidation.violations,
      eventViolations: eventValidation.violations
    };
  }

  /**
   * Regenerate problematic beats
   */
  public static async regenerateProblemBeats(
    originalBeats: MicroStoryBeat[],
    violations: any[],
    contract: XOContract,
  context?: GenerationContext, // Make optional
  passId?: number // Make optional

  ): Promise<MicroStoryBeat[]> {
    const beats = [...originalBeats];
    const violatedBeatIndices = new Set(violations.map(v => v.beatIndex));
    
    for (const beatIndex of violatedBeatIndices) {
      if (beatIndex >= beats.length) continue;
      
      console.log(`[XO Engine] Regenerating beat ${beatIndex + 1}`);
      
      try {
        const existingContext = beats[beatIndex].lines.join(' ');
        
        const newBeat = await this.generateSingleBeat(
          existingContext,
          beatIndex,
          contract,
          context,
          passId,
          'Fix violations: use only allowed nouns and verbs'
        );
        
        beats[beatIndex] = newBeat;
      } catch (error) {
        console.warn(`[XO Engine] Failed to regenerate beat ${beatIndex + 1}:`, error);
      }
    }
    
    return beats;
  }

  /**
   * Generate a single beat
   */
  private static async generateSingleBeat(
    context: string,
    beatIndex: number,
    contract: XOContract,
    generationContext: GenerationContext,
    passId: number,
    instruction: string
  ): Promise<MicroStoryBeat> {
    const markers = this.getMarkersForEntryPath(contract.entryPath);
    const marker = beatIndex < markers.length ? markers[beatIndex] : 'STORY:';
    
    const systemPrompt = `
You are generating a SINGLE story beat.

${instruction}

${this.buildSystemPrompt(contract, passId, generationContext)}

Generate ONLY the content line(s) for this beat, no explanations.
    `;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Context: ${context}` }
        ],
        temperature: 0.0,
        max_tokens: 100
      });

      const rawContent = completion.choices[0].message.content?.trim() || '';
      
      const lines = rawContent
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith('Beat') && !l.startsWith('In this'))
        .slice(0, contract.maxLinesPerBeat);

      return {
        lines: lines.length > 0 ? lines : ['[Regenerated content]'],
        marker
      };
    } catch (error) {
      console.error(`[XO Engine] Beat generation failed:`, error);
      return {
        lines: ['[Regeneration failed]'],
        marker
      };
    }
  }

  /**
   * Select best pass from multiple attempts
   */
  private static selectBestPass(
    passes: GenerationPass[],
    contract: XOContract
  ): GenerationPass | null {
    // First, find valid passes
    const validPasses = passes.filter(p => p.valid);
    if (validPasses.length > 0) {
      return validPasses[0];
    }
    
    // If no valid passes, return the one with fewest violations
    const passesWithViolations = passes.filter(p => p.beats.length > 0);
    if (passesWithViolations.length > 0) {
      passesWithViolations.sort((a, b) => {
        const aViolations = (a.nounViolations?.length || 0) + (a.eventViolations?.length || 0);
        const bViolations = (b.nounViolations?.length || 0) + (b.eventViolations?.length || 0);
        return aViolations - bViolations;
      });
      return passesWithViolations[0];
    }
    
    return null;
  }

  /**
   * Detect entry path from input
   */
  private static detectEntryPath(input: string): 'emotion' | 'scene' | 'audience' | 'seed' {
    if (!input) return 'scene';
    
    const lowerInput = input.toLowerCase();
    
    if (/(feel|felt|feeling|emotion|emotional)/i.test(input)) {
      return 'emotion';
    }
    
    if (/(scene|setting|place|location|room|space)/i.test(input)) {
      return 'scene';
    }
    
    if (/(audience|viewer|reader|people|they|them)/i.test(input)) {
      return 'audience';
    }
    
    if (/(seed|idea|concept|beginning)/i.test(input)) {
      return 'seed';
    }
    
    return 'scene';
  }

  /**
   * Get markers for entry path
   */
  private static getMarkersForEntryPath(entryPath: string): string[] {
    const markers = {
      emotion: ['EMOTION_INPUT:', 'INSIGHT:', 'STORY:'],
      scene: ['SCENE_INPUT:', 'DETAILS_NOTICED:', 'STORY:'],
      audience: ['AUDIENCE_SIGNAL:', 'WHY_IT_MATTERS:', 'STORY:'],
      seed: ['SEED:', 'ARC:', 'STORY:'],
      full: ['HOOK:', 'CONFLICT:', 'TURN:', 'BRAND_ROLE:', 'CLOSE:'],
    };
    
    return markers[entryPath as keyof typeof markers] || markers.scene;
  }

  /**
   * Refine an existing story
   */
  static async refine(
    story: MicroStory,
    refinement: 'expand' | 'gentler' | 'harsher' | 'brandify' | 'deblandify',
    options: XONarrativeOptions = {}
  ): Promise<MicroStory> {
    console.log(`[XO Engine] Refining story: ${refinement}`);
    
    const newContract = this.createRefinementContract(story.contract, refinement, story);
    
    const storyText = XORenderer.extractStoryText(story.beats);
    const seedMoment = story.contract.context.seedMoment;
    const allowedNouns = story.contract.context.allowedNouns.join(', ');
    
    let instruction = '';
    switch (refinement) {
      case 'gentler':
        instruction = `Rewrite this story to be gentler and more tender in tone, using softer language. Core narrative must remain: "${seedMoment}". Allowed nouns: ${allowedNouns}`;
        break;
      case 'harsher':
        instruction = `Rewrite this story to be harsher and more intense in tone. Core narrative must remain: "${seedMoment}". Allowed nouns: ${allowedNouns}`;
        break;
      case 'expand':
        instruction = `Expand this story with more detail while preserving core: "${seedMoment}". Allowed nouns: ${allowedNouns}`;
        break;
      case 'brandify':
        instruction = `Incorporate ${story.contract.brandName || 'the brand'} naturally into this story. Core: "${seedMoment}". Allowed nouns: ${allowedNouns}`;
        break;
      case 'deblandify':
        instruction = `Make this story more distinctive while preserving core: "${seedMoment}". Allowed nouns: ${allowedNouns}`;
        break;
    }
    
    const refinedStory = await this.generate(
      instruction,
      story.contract.marketCode,
      story.contract.brandName,
      options,
      { entryPath: story.contract.entryPath },
      story
    );

    refinedStory.contract = {
      ...newContract,
      context: story.contract.context,
    };
    
    return refinedStory;
  }

  /**
   * Create contract for refinement
   */
  private static createRefinementContract(
    originalContract: XOContract,
    refinement: string,
    originalStory?: MicroStory
  ): XOContract {
    const builder = new XOContractBuilder(originalContract);
    
    if (originalStory) {
      builder.contract.context = {
        userInputTokens: [...originalStory.contract.context.userInputTokens],
        allowedNouns: [...originalStory.contract.context.allowedNouns],
        seedMoment: originalStory.contract.context.seedMoment,
        timestamp: new Date().toISOString()
      };
    }

    switch (refinement) {
      case 'expand':
        builder.withMaxBeats(Math.min(originalContract.maxBeats + 1, 5));
        break;
      case 'brandify':
        if (originalContract.brandName) {
          builder.withBrand(originalContract.brandName, 'EXPLICIT');
        }
        break;
      case 'deblandify':
        builder.withoutBrand();
        break;
    }

    return builder.build();
  }

  /**
   * Convert micro-story to full story
   */
  static async convertToFullStory(
    story: MicroStory,
    meaningContract?: any
  ): Promise<MicroStory> {
    console.log('[XO Engine] Converting to full story');
    
    const builder = new XOContractBuilder(story.contract)
      .withFormatMode('FULLSTORY')
      .withMaxBeats(5);
    
    const fullContract = builder.build();
    
    const storyText = XORenderer.extractStoryText(story.beats);
    
    const fullStory = await this.generate(
      `Expand this micro-story into a complete 5-beat narrative:\n\n${storyText}`,
      fullContract.marketCode,
      fullContract.brandName,
      { temperature: 0.0, maxTokens: 500, passes: 3 },
      { entryPath: 'full', formatMode: 'FULLSTORY', maxBeats: 5, ...meaningContract },
      story
    );
    
    fullStory.contract = {
      ...fullStory.contract,
      maxBeats: 5,
      formatMode: 'FULLSTORY',
      entryPath: 'full'
    };
    
    return fullStory;
  }
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy function for compatibility
 */
export async function generateXOStory(
  input: string,
  market: string = 'GLOBAL',
  brand?: string,
  meaningContract?: any
): Promise<{
  story: string;
  beatSheet: any[];
  metadata: any;
}> {
  const story = await XONarrativeEngine.generate(
    input,
    market,
    brand,
    {},
    meaningContract
  );
  
  const formattedText = XORenderer.renderMicroStory(story);
  
  const beatSheet = story.beats.map((beat, index) => ({
    beat: `Beat ${index + 1}`,
    description: beat.lines.join(' '),
    lines: beat.lines,
    marker: beat.marker,
    emotion: beat.emotion,
    tension: beat.tension,
  }));
  
  return {
    story: formattedText,
    beatSheet,
    metadata: {
      title: `Story: ${story.contract.context.seedMoment.substring(0, 50)}...`,
      market: story.contract.marketCode,
      entryPath: story.contract.entryPath,
      brand: story.contract.brandName,
      timestamp: story.timestamp,
      beatCount: story.beats.length,
      wordCount: formattedText.split(/\s+/).length,
      contract: story.contract,
    },
  };
}

export default XONarrativeEngine;