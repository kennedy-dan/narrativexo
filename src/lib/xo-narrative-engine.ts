/**
 * XO NARRATIVE ENGINE v3.1
 * Contract-first, deterministic story generation
 * WITH FULL CONTAINMENT + INTERNAL REGENERATION
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
  maxRegenerationAttempts?: number; // New option
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
}

export interface GenerationResult {
  story: MicroStory;
  validation: {
    nounValidation: Awaited<ReturnType<typeof XOOntologyValidator.validateAgainstOntology>>;
    eventValidation: Awaited<ReturnType<typeof XOEventValidator.validateEvents>>;
  };
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
   * NOW WITH INTERNAL REGENERATION
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
    
    const maxRegenerationAttempts = options.maxRegenerationAttempts || 2;
    
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

let contract: XOContract;

if (originalStory) {
  // Start with original story's contract
  const builder = new XOContractBuilder(originalStory.contract);
  
  // Override with full story requirements if this is a conversion
  if (meaningContract?.formatMode === 'FULLSTORY' || meaningContract?.maxBeats === 5) {
    builder
      .withFormatMode('FULLSTORY')
      .withMaxBeats(5)
      .withEntryPath('full');
      
    // Preserve brand if present
    if (originalStory.contract.brandName) {
      builder.withBrand(originalStory.contract.brandName, originalStory.contract.brandMode);
    }
  }
  
  contract = builder.build();
} else {
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
    if (meaningContract.marketContext?.market) {
      builder.withMarket(meaningContract.marketContext.market, meaningContract.marketContext.confidence || 0.5);
    }
    if (meaningContract.entryPath) {
      builder.withEntryPath(meaningContract.entryPath.toLowerCase() as any);
    }
    if (meaningContract.formatMode === 'FULLSTORY') {
      builder.withFormatMode('FULLSTORY').withMaxBeats(5);
    }
  }
  
  contract = builder.build();
}

    // Override allowed nouns
    contract.context.allowedNouns = ontology.allAllowedNouns;

    // ============================================================================
    // STEP 4: CREATE CONTEXT
    // ============================================================================
    
    const context: GenerationContext = {
      ontology,
      eventGate,
      densityConfidence: eventGate.metadata.confidence
    };

    // ============================================================================
    // STEP 5: GENERATE WITH INTERNAL REGENERATION LOOP
    // ============================================================================
    
    let bestStory: MicroStory | null = null;
    let bestValidation: {
      nounValidation: any;
      eventValidation: any;
    } | null = null;
    
    // Try multiple generation passes
    for (let attempt = 1; attempt <= maxRegenerationAttempts; attempt++) {
      console.log(`[XO Engine] Generation attempt ${attempt}/${maxRegenerationAttempts}`);
      
      // Generate story
      const passes = await this.generatePasses(input, contract, options, context);
      const bestPass = this.selectBestPass(passes, contract);
      
      if (!bestPass) {
        console.log(`[XO Engine] Attempt ${attempt}: No valid pass found`);
        continue;
      }
      
      const story: MicroStory = {
        beats: bestPass.beats,
        contract,
        timestamp: new Date().toISOString(),
      };
      
      // Validate
      const validation = await this.validateStory(story, context);
      
      // If valid, return immediately
      if (validation.nounValidation.valid && validation.eventValidation.valid) {
        console.log(`[XO Engine] ✅ Valid story generated on attempt ${attempt}`);
        return story;
      }
      
      // Track best attempt so far
      if (!bestStory || this.isBetterValidation(validation, bestValidation)) {
        bestStory = story;
        bestValidation = validation;
        console.log(`[XO Engine] Attempt ${attempt}: New best story (${this.getViolationCount(validation)} violations)`);
      }
      
      // If we have more attempts, regenerate problem beats
      if (attempt < maxRegenerationAttempts) {
        console.log(`[XO Engine] Attempt ${attempt}: Regenerating problem beats...`);
        const regeneratedBeats = await this.regenerateProblemBeatsInternal(
          story.beats,
          validation,
          contract,
          context,
          attempt
        );
        
        // Update contract for next attempt with regenerated beats as context
        if (regeneratedBeats.length > 0) {
          // Use regenerated beats as seed for next attempt
          input = this.beatsToInput(regeneratedBeats);
        }
      }
    }
    
    // If we get here, return the best story we found
    if (bestStory) {
      console.log('[XO Engine] ⚠️ Returning best available story with warnings');
      return bestStory;
    }
    
    throw new Error('[XO Engine] All generation attempts failed');
  }

  /**
   * Validate story with both noun and event validation
   */
  private static async validateStory(
    story: MicroStory,
    context: GenerationContext
  ): Promise<{
    nounValidation: Awaited<ReturnType<typeof XOOntologyValidator.validateAgainstOntology>>;
    eventValidation: Awaited<ReturnType<typeof XOEventValidator.validateEvents>>;
  }> {
    const nounValidation = await XOOntologyValidator.validateAgainstOntology(
      story.beats,
      context.ontology.allAllowedNouns
    );

    const eventValidation = await XOEventValidator.validateEvents(
      story.beats,
      context.eventGate,
      context.densityConfidence
    );

    return { nounValidation, eventValidation };
  }

  /**
   * Compare validation results to find the better one
   */
  private static isBetterValidation(
    current: { nounValidation: any; eventValidation: any },
    best: { nounValidation: any; eventValidation: any } | null
  ): boolean {
    if (!best) return true;
    
    const currentViolations = this.getViolationCount(current);
    const bestViolations = this.getViolationCount(best);
    
    return currentViolations < bestViolations;
  }

  /**
   * Get total violation count
   */
  private static getViolationCount(validation: {
    nounValidation: any;
    eventValidation: any;
  }): number {
    return (validation.nounValidation.violations?.length || 0) +
           (validation.eventValidation.violations?.length || 0);
  }

  /**
   * Convert beats back to input string for regeneration
   */
  private static beatsToInput(beats: MicroStoryBeat[]): string {
    return beats
      .map(beat => beat.lines.join(' '))
      .join(' ')
      .substring(0, 200);
  }

  /**
   * INTERNAL: Regenerate problem beats
   */
  private static async regenerateProblemBeatsInternal(
    beats: MicroStoryBeat[],
    validation: {
      nounValidation: any;
      eventValidation: any;
    },
    contract: XOContract,
    context: GenerationContext,
    attempt: number
  ): Promise<MicroStoryBeat[]> {
    const result = [...beats];
    const problemBeatIndices = new Set<number>();
    
    // Add beats with noun violations
    if (validation.nounValidation.violations) {
      validation.nounValidation.violations.forEach((v: any) => {
        if (v.beatIndex !== undefined) {
          problemBeatIndices.add(v.beatIndex);
        }
      });
    }
    
    // Add beats with event violations
    if (validation.eventValidation.violations) {
      validation.eventValidation.violations.forEach((v: any) => {
        if (v.position?.beatIndex !== undefined) {
          problemBeatIndices.add(v.position.beatIndex);
        }
      });
    }
    
    console.log(`[XO Engine] Regenerating ${problemBeatIndices.size} problem beats`);
    
    for (const beatIndex of problemBeatIndices) {
      if (beatIndex >= result.length) continue;
      
      try {
        const beatContext = result[beatIndex].lines.join(' ');
        const instruction = this.buildRegenerationInstruction(
          validation,
          beatIndex
        );
        
        const newBeat = await this.generateSingleBeat(
          beatContext,
          beatIndex,
          contract,
          context,
          attempt,
          instruction
        );
        
        result[beatIndex] = newBeat;
        console.log(`[XO Engine] ✅ Regenerated beat ${beatIndex + 1}`);
      } catch (error) {
        console.warn(`[XO Engine] Failed to regenerate beat ${beatIndex + 1}:`, error);
      }
    }
    
    return result;
  }

  /**
   * Build specific regeneration instruction based on violations
   */
  private static buildRegenerationInstruction(
    validation: {
      nounValidation: any;
      eventValidation: any;
    },
    beatIndex: number
  ): string {
    const instructions: string[] = ['Fix all violations in this beat:'];
    
    // Add noun violations
    if (validation.nounValidation.violations) {
      const nounViolations = validation.nounValidation.violations
        .filter((v: any) => v.beatIndex === beatIndex)
        .map((v: any) => `- Remove "${v.word}" (not in allowed nouns)`);
      
      if (nounViolations.length > 0) {
        instructions.push('NOUN VIOLATIONS:', ...nounViolations);
      }
    }
    
    // Add event violations
    if (validation.eventValidation.violations) {
      const eventViolations = validation.eventValidation.violations
        .filter((v: any) => v.position?.beatIndex === beatIndex)
        .map((v: any) => `- ${v.details}`);
      
      if (eventViolations.length > 0) {
        instructions.push('EVENT VIOLATIONS:', ...eventViolations);
      }
    }
    
    instructions.push(
      'Use only allowed nouns and verbs.',
      'Keep the core meaning but fix all violations.'
    );
    
    return instructions.join('\n');
  }

  // ============================================================================
  // EXISTING METHODS (keep all your existing methods below)
  // ============================================================================

  private static async generatePasses(
    input: string,
    contract: XOContract,
    options: XONarrativeOptions,
    context: GenerationContext
  ): Promise<GenerationPass[]> {
    // Your existing generatePasses implementation
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
        
        if (validation.valid && !contract.strictMode) {
          console.log(`[XO Engine] Pass ${passId} valid, stopping early`);
          break;
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

  private static async generateSinglePass(
    input: string,
    contract: XOContract,
    passId: number,
    options: XONarrativeOptions,
    context: GenerationContext
  ): Promise<MicroStoryBeat[]> {
    const systemPrompt = this.buildSystemPrompt(contract, passId, context);
    const userPrompt = this.buildUserPrompt(input, contract, context);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: options.temperature || 0.0,
        max_tokens: options.maxTokens || 400,
        frequency_penalty: 0.3,
        presence_penalty: 0.2,
      });
      
      const rawResponse = completion.choices[0].message.content?.trim() || '';
      const beats = this.parseResponseToBeats(rawResponse, contract);
      return this.postProcessBeats(beats, contract, context);
      
    } catch (error) {
      console.error('[XO Engine] Generation failed:', error);
      throw new Error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

private static buildSystemPrompt(
  contract: XOContract,
  passId: number,
  context: GenerationContext
): string {
  const { entryPath, marketCode, marketState, brandMode, brandName, maxBeats, maxLinesPerBeat } = contract;
  const { ontology, eventGate } = context;
  
  const markers = this.getMarkersForEntryPath(entryPath);
  
  // Market guidance
  const marketGuidance = marketState === 'RESOLVED' 
    ? `MARKET: ${marketCode} - Use authentic but natural context. You can include subtle cultural elements that feel organic to the setting.`
    : `MARKET: NEUTRAL - No regional specifics, slang, or cultural props. Keep it universally relatable.`;
  
  // Brand guidance
// Brand guidance
let brandGuidance = '';
if (brandMode === 'EXPLICIT' && brandName) {
  brandGuidance = `BRAND: ${brandName}

⚠️ CRITICAL BRAND RULE - MUST FOLLOW EXACTLY:
• The brand "${brandName}" MUST NEVER appear in ANY story beat
• Do NOT write "${brandName}" into any beat's content
• Do NOT use the brand in descriptions, actions, or dialogue
• The brand will be added AFTER the story with a full stop by the system
• Focus only on the human moment, emotion, and meaning
• The brand's essence (refreshment, quality, etc.) can be present, but NOT the brand name itself

Example of WRONG (brand in beat):
STORY:
He smiled and drank a refreshing Pepsi.

Example of RIGHT (brand essence without name):
STORY:
He smiled, the cold drink refreshing him completely.

Then the system adds: pepsi`;
  
} else if (brandMode === 'IMPLICIT' && brandName) {
  brandGuidance = `BRAND: ${brandName} - Suggest implicitly through values, no direct mention. Let the story's resolution align with brand values. The brand name itself should never appear.`;
} else {
  brandGuidance = `NO BRAND - Focus purely on human experience. No commercial elements.`;
}
  
  // Ontology enforcement
  const ontologySection = `
🔒 STRICT NOUN ENFORCEMENT:
You MUST use ONLY these nouns:
${ontology.allAllowedNouns.map(n => `  • ${n}`).join('\n')}

CRITICAL RULES:
• EVERY noun in your response MUST be from this list
• If you need a noun not in this list, you MUST find another way to express the idea
• This is NOT optional - it's enforced by validation
• Abstract concepts (feelings, thoughts) are expressed through verbs and context, not through new nouns
  `;

  // Event constraints
  const eventConstraints = XOEventGate.getEventConstraintsPrompt(eventGate);
  
  // Build the marker format example
  const markerLines = [];
  for (let i = 0; i < maxBeats; i++) {
    markerLines.push(markers[i] || 'STORY:');
    for (let j = 0; j < maxLinesPerBeat; j++) {
      markerLines.push(`[Your ${i+1}.${j+1} - 5-15 words]`);
    }
    if (i < maxBeats - 1) markerLines.push('');
  }
  
  const markerExample = markerLines.join('\n');
  
  // Entry path specific guidance
  const entryPathGuidance = {
    emotion: `EMOTION PATH: Start with a feeling, explore its texture, resolve with insight.`,
    scene: `SCENE PATH: Set the physical space, notice details, reveal meaning through observation.`,
    audience: `AUDIENCE PATH: Signal to the viewer, explain why it matters, complete the connection.`,
    seed: `SEED PATH: Plant an idea, show its growth, reveal what it became.`,
    full: `FULL STORY: Hook, conflict, turn, brand role, close.`
  }[entryPath] || `Follow the natural progression of your markers.`;

  // Beat structure guidance
  const beatGuidance = [];
  for (let i = 0; i < maxBeats; i++) {
    beatGuidance.push(`Beat ${i+1} (${markers[i] || 'STORY:'}): ${i === 0 ? 'Establish' : i === maxBeats-1 ? 'Resolve with' : 'Develop'} the narrative.`);
  }

  const formatRules = `
📋 ABSOLUTELY FORBIDDEN - YOU WILL BE PENALIZED FOR THESE:
❌ NEVER write "In this beat", "This beat shows", "Beat 1", etc.
❌ NEVER write any explanatory text or meta commentary
❌ NEVER number or label your beats in any way (the markers are your labels)
❌ NEVER use phrases like "We see", "We notice", "We feel"
❌ NEVER add introductory or concluding text outside the beats
❌ NEVER use nouns outside the allowed list above
❌ ${brandMode === 'EXPLICIT' && brandName ? `NEVER write "${brandName}" in any beat content - it will be added after the story` : ''}
✅ YOU MUST OUTPUT EXACTLY THIS FORMAT (${maxBeats} beats, ${maxLinesPerBeat} lines max per beat):

${markerExample}

${entryPathGuidance}

${beatGuidance.map(g => `• ${g}`).join('\n')}

CRITICAL FORMATTING RULES:
1. Start EACH beat with its EXACT marker (${markers.slice(0, maxBeats).join(', ')})
2. Each marker MUST be on its own line, followed by content
3. Each beat should have 1-${maxLinesPerBeat} lines of content
4. Each line should be 5-8 words (complete sentences)
5. NO blank lines between marker and its content
6. ONE blank line between beats
7. NO extra text before the first marker or after the last marker

EXAMPLE FOR ${entryPath.toUpperCase()} PATH (${maxBeats} beats):

${markers[0]}
${maxBeats === 3 ? 
  (entryPath === 'emotion' ? 'A quiet sadness settled in the room.' : 
   entryPath === 'scene' ? 'Morning light filled the kitchen slowly.' : 
   'She noticed something shift in his expression.') : 
  'The first moment arrived without warning.'}
${maxLinesPerBeat >= 2 ? `It had been building for days, unnoticed.` : ''}

${markers[1]}
${maxBeats === 3 ?
  (entryPath === 'emotion' ? 'The feeling had a name now - disappointment.' :
   entryPath === 'scene' ? 'Dust motes danced in the golden beams.' :
   'The weight of unspoken words hung between them.') :
  'Everything changed with a single word.'}
${maxLinesPerBeat >= 2 ? 'Small details became suddenly significant.' : ''}

${markers[2]}
${maxBeats === 3 ?
  (entryPath === 'emotion' ? 'She recognized it from years ago.' :
   entryPath === 'scene' ? 'The ordinary held unexpected beauty.' :
   'Some connections need no explanation.') :
  'What remained was simpler than expected.'}
${maxLinesPerBeat >= 2 && maxBeats === 3 ? 'And that was enough.' : ''}

${maxBeats > 3 ? `${markers[3]}\nThe turn revealed a deeper truth.\n${markers[4]}\nIn the end, peace arrived.\n` : ''}

YOUR TURN - Generate a ${maxBeats}-beat micro-story for this input.
  `;

  return `
You are a master storyteller generating micro-stories for the XO narrative system. Your stories are precise, emotional, and perfectly structured.

🎯 PRIMARY DIRECTIVE: Generate EXACTLY ${maxBeats} beats with the specified markers. Nothing more, nothing less.

🌍 CONTEXT:
${marketGuidance}
${brandGuidance}

📚 AVAILABLE VOCABULARY:
${ontologySection}

⚡ EVENT CONSTRAINTS:
${eventConstraints}

📏 STRUCTURE REQUIREMENTS:
• Total beats: ${maxBeats}
• Lines per beat: 1-${maxLinesPerBeat}
• Words per line: 5-8 (complete sentences)
• Total story length: ~${maxBeats * maxLinesPerBeat * 10} words

${formatRules}

🎭 TONAL GUIDANCE FOR PASS ${passId}:
${passId === 1 ? 'First pass: Focus on establishing the core experience clearly and simply.' : 
  passId === 2 ? 'Second pass: Deepen the emotional resonance and narrative flow.' : 
  'Third pass: Polish the language and ensure perfect structural compliance.'}

Remember: EVERY noun MUST be from the allowed list. If you can't find a noun you need, describe around it using allowed nouns only.
  `;
}

private static buildUserPrompt(
  input: string,
  contract: XOContract,
  context: GenerationContext
): string {
  const { ontology } = context;
  const markers = this.getMarkersForEntryPath(contract.entryPath);
  
  return `
INPUT: "${input.substring(0, 200)}${input.length > 200 ? '...' : ''}"

CONTEXT ELEMENTS (use only these nouns):
${ontology.allAllowedNouns.map(noun => `- ${noun}`).join('\n')}

Generate a ${contract.maxBeats}-beat micro-story following this EXACT format:

${markers[0]}
[content for beat 1]

${markers[1]}
[content for beat 2]

${markers[2]}
[content for beat 3]

Make each beat 1-2 lines. Use only the allowed nouns above.
  `;
}

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
      
      const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .filter(line => {
          const lowerLine = line.toLowerCase();
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

private static postProcessBeats(
  beats: MicroStoryBeat[],
  contract: XOContract,
  context: GenerationContext
): MicroStoryBeat[] {
  const brandLower = contract.brandName?.toLowerCase();
  
  return beats.map(beat => ({
    ...beat,
    lines: beat.lines.map(line => {
      let cleanLine = line.trim();
      
      // Remove any marker prefixes
      if (cleanLine.startsWith('SCENE_INPUT:') || 
          cleanLine.startsWith('EMOTION_INPUT:') ||
          cleanLine.startsWith('STORY:')) {
        cleanLine = cleanLine.replace(/^(SCENE_INPUT|EMOTION_INPUT|STORY):\s*/i, '');
      }
      
      // CRITICAL: Remove brand name if it appears in any beat
      if (brandLower && cleanLine.toLowerCase().includes(brandLower)) {
        console.log(`[XO Engine] Removing brand "${contract.brandName}" from beat line: "${cleanLine}"`);
        cleanLine = cleanLine.replace(new RegExp(`\\b${brandLower}\\b`, 'gi'), '').trim();
        // Clean up any resulting double spaces or punctuation issues
        cleanLine = cleanLine.replace(/\s+/g, ' ').replace(/\s+([.,!?])/g, '$1');
      }
      
      return cleanLine;
    }).filter(line => line.length > 0) // Remove empty lines
  }));
}

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
    
    const nounValidation = await XOOntologyValidator.validateAgainstOntology(
      beats,
      ontology.allAllowedNouns
    );
    
    if (!nounValidation.valid) {
      errors.push(`Noun violations: ${nounValidation.violations.length}`);
    }
    
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

  private static selectBestPass(
    passes: GenerationPass[],
    contract: XOContract
  ): GenerationPass | null {
    const validPasses = passes.filter(p => p.valid);
    if (validPasses.length > 0) {
      return validPasses[0];
    }
    
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

  // Public method for backward compatibility
  public static async regenerateProblemBeats(
    originalBeats: MicroStoryBeat[],
    violations: any[],
    contract: XOContract,
    context?: GenerationContext,
    passId?: number
  ): Promise<MicroStoryBeat[]> {
    if (!context) {
      console.warn('[XO Engine] No context provided for regeneration, skipping');
      return originalBeats;
    }
    
    return this.regenerateProblemBeatsInternal(
      originalBeats,
      { nounValidation: { violations }, eventValidation: { violations: [] } },
      contract,
      context,
      passId || 1
    );
  }

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

static async convertToFullStory(
  story: MicroStory,
  meaningContract?: any
): Promise<MicroStory> {
  console.log('[XO Engine] Converting to full story');
  
  // Create builder with original contract
  const builder = new XOContractBuilder(story.contract)
    .withFormatMode('FULLSTORY')
    .withMaxBeats(5)
    .withEntryPath('full');
  
  // Preserve brand if present
  if (story.contract.brandName) {
    builder.withBrand(story.contract.brandName, story.contract.brandMode);
  }
  
  const fullContract = builder.build();
  
  const storyText = XORenderer.extractStoryText(story.beats);
  
  const fullStory = await this.generate(
    `Expand this micro-story into a complete 5-beat narrative:\n\n${storyText}`,
    fullContract.marketCode,
    fullContract.brandName,
    { temperature: 0.0, maxTokens: 500, passes: 3 },
    { 
      entryPath: 'full', 
      formatMode: 'FULLSTORY', 
      maxBeats: 5,
      ...meaningContract 
    },
    story // Pass the original story
  );
  
  return fullStory;
}
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

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