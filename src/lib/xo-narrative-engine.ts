/**
 * XO NARRATIVE ENGINE v2.0
 * Contract-first, deterministic story generation
 */

import OpenAI from 'openai';
import { XOContract, XOContractBuilder, createContractFromMeaningContract } from './xo-contract';
import { XORenderer, MicroStory, MicroStoryBeat } from './xo-renderer';
import { XOValidator } from './xo-validator';

// ============================================================================
// TYPES
// ============================================================================

export interface XONarrativeOptions {
  temperature?: number;
  maxTokens?: number;
  passes?: number;
  validateEachPass?: boolean;
}

export interface GenerationPass {
  passId: number;
  beats: MicroStoryBeat[];
  valid: boolean;
  errors?: string[];
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
   */
  static async generate(
    input: string,
    market: string = 'GLOBAL',
    brand?: string,
    options: XONarrativeOptions = {},
    meaningContract?: any
  ): Promise<MicroStory> {
    console.log('[XO Engine] Generating story with contract-first approach');
    
    // STEP 1: Create contract
    const contract = this.createGenerationContract(input, market, brand, meaningContract);
    
    // STEP 2: Generate in passes
    const passes = await this.generatePasses(input, contract, options);
    
    // STEP 3: Validate and select best pass
    const bestPass = this.selectBestPass(passes, contract);
    
    if (!bestPass) {
      throw new Error('All generation passes failed validation');
    }
    
    // STEP 4: Build final story
    const story: MicroStory = {
      beats: bestPass.beats,
      contract,
      timestamp: new Date().toISOString(),
    };
    
    // Validate final story
    const validator = new XOValidator({ strictMode: contract.strictMode });
    const validation = await validator.validateStory(story);
    
    if (!validation.passed && contract.strictMode) {
      console.error('[XO Engine] Final story failed validation:', validation.errors);
      throw new Error(`Story validation failed: ${validation.errors?.[0]}`);
    }
    
    console.log('[XO Engine] Story generated successfully:', {
      beats: story.beats.length,
      validation: validation.passed ? 'PASSED' : 'WARNINGS',
    });
    
    return story;
  }

  /**
   * Create contract for generation
   */
/**
 * Create contract for generation
 */
private static createGenerationContract(
  input: string,
  market: string,
  brand?: string,
  meaningContract?: any
): XOContract {
  const builder = new XOContractBuilder();
  
  // Use meaning contract if available
  if (meaningContract) {
    const contract = createContractFromMeaningContract(meaningContract);
    builder.withUserInput(input);
    
    // Override with explicit brand if provided
    if (brand) {
      builder.withBrand(brand, 'EXPLICIT');
    }
    
    // Force FULLSTORY and maxBeats if specified
    if (meaningContract.formatMode === 'FULLSTORY' || meaningContract.maxBeats === 5) {
      builder.withFormatMode('FULLSTORY');
      builder.withMaxBeats(5);
      builder.withEntryPath('full');
    }
    
    return builder.build();
  }
  
  // Build from scratch
  builder
    .withUserInput(input)
    .withMarket(market as any, 0.5)
    .withEntryPath(this.detectEntryPath(input))
    .withFormatMode('MICROSTORY')
    .withStrictMode(false);
  
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
    options: XONarrativeOptions
  ): Promise<GenerationPass[]> {
    const passes: GenerationPass[] = [];
    const maxPasses = options.passes || 3;
    
    for (let passId = 1; passId <= maxPasses; passId++) {
      console.log(`[XO Engine] Starting pass ${passId}/${maxPasses}`);
      
      try {
        let beats = await this.generateSinglePass(input, contract, passId, options);
        
        // Validate the pass
        const validator = new XOValidator({ strictMode: contract.strictMode });
        const validation = await validator.validateBeats(beats, contract);
        
             // Check for invention warnings that need regeneration
      const needsRegeneration = validation.metadata?.validation_1?.beatsNeedingRegeneration;
            if (needsRegeneration && needsRegeneration.length > 0 && passId < maxPasses) {
        console.log(`[XO Engine] Pass ${passId} needs regeneration for ${needsRegeneration.length} beats`);
        
        // Generate targeted regeneration for problematic beats
        beats = await this.regenerateProblemBeats(beats, needsRegeneration, contract, passId + 1);
        
        // Re-validate after regeneration
        const revalidation = await validator.validateBeats(beats, contract);
        validation.passed = revalidation.passed;
        validation.warnings = revalidation.warnings;
      }
        passes.push({
          passId,
          beats,
          valid: validation.passed,
          errors: validation.errors,
        });
        
        // If this pass is valid and we're not in strict mode, we can stop early
        if (validation.passed && !contract.strictMode) {
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

  /**
 * Regenerate only problematic beats
 */
public static async regenerateProblemBeats(
  originalBeats: MicroStoryBeat[],
  problemBeats: any[],
  contract: XOContract,
  passId: number
): Promise<MicroStoryBeat[]> {
  const beats = [...originalBeats];
  
  for (const problem of problemBeats) {
    const { beatIndex, inventions, lines } = problem;
    
    console.log(`[XO Engine] Regenerating beat ${beatIndex + 1}, inventions: ${inventions.join(', ')}`);
    
    try {
            // Use the existing lines as context, but instruct to remove inventions
      const existingContext = lines?.join(' ') || contract.context.seedMoment;
      const instruction = inventions.length > 0
        ? `Rewrite this beat without adding: ${inventions.join(', ')}. Use only: ${contract.context.allowedNouns.join(', ') || 'elements from input'}.`
        : `Improve this beat while following all constraints.`;

        const newBeat = await this.generateSingleBeat(
        `Previous beat: ${existingContext}. ${contract.context.seedMoment}`,
        beatIndex,
        contract,
        passId,
        instruction
      );

      
      beats[beatIndex] = newBeat;
    } catch (error) {
      console.warn(`[XO Engine] Failed to regenerate beat ${beatIndex + 1}:`, error);
      // Keep original beat if regeneration fails
    }
  }
  
  return beats;
}

private static async generateSingleBeat(
  input: string,
  beatIndex: number,
  contract: XOContract,
  passId: number,
  specificInstruction: string
): Promise<MicroStoryBeat> {
  console.log(`[XO Engine] Generating beat ${beatIndex + 1}, instruction: ${specificInstruction}`);
  
  // Determine what type of beat this should be based on position
  const beatType = this.getBeatType(beatIndex, contract);
  
  // Get marker for this beat
  const markers = this.getMarkersForEntryPath(contract.entryPath);
  const marker = beatIndex < markers.length ? markers[beatIndex] : 'STORY:';
  
  // ============================================================
  // CRITICAL FIX: EXPLICITLY FORBID META TEXT IN REGENERATION
  // ============================================================
  const systemPrompt = `
You are generating a SINGLE story beat. You must output ONLY the content lines.

🚫 FORBIDDEN:
- DO NOT write "This beat", "Beat X", "In this beat"
- DO NOT write "This scene", "This moment", "The story shows"
- DO NOT write any meta commentary or explanatory text
- DO NOT label or number your output in any way
- DO NOT use quotes or bullet points

✅ ALLOWED:
- Just the content line(s) - the story itself
- 1-2 lines maximum
- 15 words per line maximum

EXAMPLE OF CORRECT OUTPUT (${beatType === 'brand' ? 'brand beat' : 'story beat'}):
The solution appeared quietly.

EXAMPLE OF WRONG OUTPUT (NEVER DO THIS):
In this final beat, we see the solution appear quietly.

Current constraints:
- Market: ${contract.marketCode} ${contract.marketState === 'NEUTRAL' ? '(neutral)' : '(resolved)'}
- Brand: ${contract.brandMode === 'NONE' ? 'None' : contract.brandName}
- Beat position: ${beatIndex + 1} of ${contract.maxBeats}

Generate ONLY the content line(s):
  `.trim();
  
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
          content: `Context: "${input.substring(0, 100)}${input.length > 100 ? '...' : ''}"`,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
      frequency_penalty: 0.3, // Increased to reduce repetition
      presence_penalty: 0.3,
    });
    
    let rawBeat = completion.choices[0].message.content?.trim() || '[Regenerated beat]';
    
    // ============================================================
    // CRITICAL FIX: AGGRESSIVE STRIPPING - REMOVE ANY META TEXT
    // ============================================================
    // Remove ANY phrase that looks like meta commentary
    rawBeat = rawBeat
      // Remove any "Beat X:" or "Beat X -" patterns
      .replace(/^Beat\s+\d+[:.\-–—]\s*/gi, '')
      .replace(/^Beat\s+\d+\s*/gi, '')
      // Remove any "In this beat" variations
      .replace(/^In\s+this\s+beat[:.\-–—]\s*/gi, '')
      .replace(/^This\s+beat[:.\-–—]\s*/gi, '')
      .replace(/^This\s+beat\s+shows[:.\-–—]\s*/gi, '')
      .replace(/^This\s+beat\s+depicts[:.\-–—]\s*/gi, '')
      .replace(/^This\s+beat\s+illustrates[:.\-–—]\s*/gi, '')
      // Remove any "In this scene" variations
      .replace(/^In\s+this\s+scene[:.\-–—]\s*/gi, '')
      .replace(/^This\s+scene[:.\-–—]\s*/gi, '')
      // Remove any "In this moment" variations
      .replace(/^In\s+this\s+moment[:.\-–—]\s*/gi, '')
      .replace(/^This\s+moment[:.\-–—]\s*/gi, '')
      // Remove any "We see/notice/feel" patterns
      .replace(/^We\s+see[:.\-–—]\s*/gi, '')
      .replace(/^We\s+notice[:.\-–—]\s*/gi, '')
      .replace(/^We\s+feel[:.\-–—]\s*/gi, '')
      .replace(/^We\s+watch[:.\-–—]\s*/gi, '')
      // Remove any "The story/scene shows" patterns
      .replace(/^The\s+story[:.\-–—]\s*/gi, '')
      .replace(/^The\s+scene[:.\-–—]\s*/gi, '')
      .replace(/^The\s+moment[:.\-–—]\s*/gi, '')
      // Remove any remaining numbers/bullets
      .replace(/^[\d\-\*\.]+\s*/, '')
      .trim();
    
    // If after stripping we have nothing, use a fallback
    if (!rawBeat) {
      rawBeat = beatType === 'brand' 
        ? 'The solution appeared quietly.'
        : 'The moment continued.';
    }
    
    // Parse lines
    const lines = rawBeat
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, contract.maxLinesPerBeat);
    
    // Trim to word limit
    const trimmedLines = lines.map(line => {
      const words = line.split(/\s+/);
      if (words.length > contract.maxWordsPerLine) {
        return words.slice(0, contract.maxWordsPerLine).join(' ');
      }
      return line;
    });
    
    console.log(`[XO Engine] Beat ${beatIndex + 1} regenerated:`, {
      lines: trimmedLines.length,
      firstLine: trimmedLines[0]?.substring(0, 30),
    });
    
    return {
      lines: trimmedLines.length > 0 ? trimmedLines : ['[Beat regeneration]'],
      marker,
    };
    
  } catch (error) {
    console.error(`[XO Engine] Failed to regenerate beat ${beatIndex + 1}:`, error);
    
    // Return a fallback beat
    return {
      lines: beatType === 'brand' 
        ? ['The solution appeared.'] 
        : ['The moment continued.'],
      marker,
    };
  }
}
private static getBeatType(beatIndex: number, contract: XOContract): 'opening' | 'development' | 'meaning' | 'brand' | 'close' | 'turn' {
  const totalBeats = contract.maxBeats;
  
  if (contract.entryPath === 'full') {
    // Full story structure
    const types = ['opening', 'development', 'turn', 'brand', 'close'] as const;
    return types[Math.min(beatIndex, types.length - 1)];
  } else {
    // Micro-story structure
    if (beatIndex === 0) return 'opening';
    if (beatIndex === totalBeats - 1) {
      return contract.brandMode !== 'NONE' ? 'brand' : 'meaning';
    }
    return 'development';
  }
}
  /**
   * Generate a single pass
   */
  private static async generateSinglePass(
    input: string,
    contract: XOContract,
    passId: number,
    options: XONarrativeOptions
  ): Promise<MicroStoryBeat[]> {
    // Build system prompt based on contract
    const systemPrompt = this.buildSystemPrompt(contract, passId);
    
    // Build user prompt
    const userPrompt = this.buildUserPrompt(input, contract);
    
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
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 400,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
      });
      
      const rawResponse = completion.choices[0].message.content?.trim() || '';
      
      // Parse response into beats
      const beats = this.parseResponseToBeats(rawResponse, contract);
      
      // Apply post-processing
      return this.postProcessBeats(beats, contract);
      
    } catch (error) {
      console.error('[XO Engine] Generation failed:', error);
      throw new Error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build system prompt from contract
   */
 /**
 * Build system prompt from contract
 */
/**
 * Build system prompt from contract
 */
private static buildSystemPrompt(contract: XOContract, passId: number): string {
  const { entryPath, marketCode, marketState, brandMode, brandName, allowInvention, maxBeats, maxLinesPerBeat } = contract;
  
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
  
  // Invention rules
  const inventionRules = allowInvention === 'SCENE_ONLY'
    ? 'You may add SCENE details only (no new characters, weather, time)'
    : 'NO INVENTION - Use only elements from the input';
  
  // Get markers for this path
  const markers = this.getMarkersForEntryPath(entryPath);
  const markerList = markers.map(m => `"${m}"`).join(', ');
  
  // ============================================================
  // CRITICAL FIX: STRONGER, MORE EXPLICIT PROHIBITIONS
  // ============================================================
  const formatRules = `
🚫 ABSOLUTELY FORBIDDEN - YOU WILL BE PENALIZED FOR THESE:
❌ NEVER write "In this beat", "This beat shows", "Beat 1", "Beat 2", etc.
❌ NEVER write "Following beat", "Next beat", "Previous beat"
❌ NEVER write "In this scene", "This scene depicts", "The scene shows"
❌ NEVER write "In this moment", "This moment captures", "This moment shows"
❌ NEVER write any explanatory text, meta commentary, or narration ABOUT the story
❌ NEVER number or label your beats in any way
❌ NEVER use phrases like "We see", "We notice", "We feel", "The reader sees"

✅ YOU MUST OUTPUT EXACTLY THIS FORMAT:
[MARKER]
[CONTENT LINE 1]
[CONTENT LINE 2 (if needed)]

✅ THE CONTENT MUST BE THE STORY ITSELF, NOT A DESCRIPTION OF IT
✅ Write DIRECTLY - show the moment, don't explain it

EXAMPLE OF CORRECT FORMAT (for ${entryPath} path):
${markers[0]}
The quiet room held morning light.

${markers[1]}
Small details revealed themselves slowly.

${markers[2]}
Understanding arrived without words.

EXAMPLE OF WRONG FORMAT (NEVER DO THIS):
${markers[0]}
In this beat, we see that the quiet room held morning light.

YOUR TASK: Generate the story content directly. NO META TEXT.
  `.trim();
  
  // Path-specific instructions
  const pathInstructions = this.getPathInstructions(entryPath);
  
  return `
You are generating micro-stories for the XO system.

CRITICAL CONSTRAINTS:
${marketGuidance}
${brandGuidance}
${inventionRules}

${formatRules}

${pathInstructions}

PASS ${passId}: ${passId === 1 ? 'Focus on core experience' : passId === 2 ? 'Focus on emotional arc' : 'Focus on resolution'}
  `.trim();
}

  /**
   * Build user prompt
   */
  private static buildUserPrompt(input: string, contract: XOContract): string {
    const { context } = contract;
    
    return `
INPUT: "${input.substring(0, 200)}${input.length > 200 ? '...' : ''}"

CONTEXT ELEMENTS (use only these):
${context.allowedNouns.map(noun => `- ${noun}`).join('\n')}

Generate a ${contract.maxBeats}-beat micro-story following all rules.
    `.trim();
  }

  /**
   * Parse LLM response into beats
   */
/**
 * Parse LLM response into beats
 */
private static parseResponseToBeats(response: string, contract: XOContract): MicroStoryBeat[] {
  // Get markers for this path
  const markers = this.getMarkersForEntryPath(contract.entryPath);
  
  // Split by markers to extract beats
  const beats: MicroStoryBeat[] = [];
  let remainingText = response;
  
  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i];
    const markerIndex = remainingText.indexOf(marker);
    
    if (markerIndex === -1) {
      // Marker not found, create empty beat
      beats.push({ lines: ['[Content]'], marker });
      continue;
    }
    
    // Find content after marker
    let contentStart = markerIndex + marker.length;
    let contentEnd = remainingText.length;
    
    // Look for next marker
    for (let j = i + 1; j < markers.length; j++) {
      const nextMarker = markers[j];
      const nextIndex = remainingText.indexOf(nextMarker, contentStart);
      if (nextIndex !== -1 && nextIndex < contentEnd) {
        contentEnd = nextIndex;
        break;
      }
    }
    
    // Extract and clean content
    let content = remainingText.substring(contentStart, contentEnd).trim();
    
    // ============================================================
    // CRITICAL FIX: ULTRA-AGGRESSIVE CLEANING
    // Remove ANY meta-commentary regardless of pattern
    // ============================================================
    
    // First pass - remove entire lines that start with meta patterns
    const lines = content.split('\n');
    const cleanLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      const lowerLine = trimmed.toLowerCase();
      
      // Skip ANY line that looks like meta commentary
      const metaPatterns = [
        /^beat\s+\d+/,
        /^in\s+this\s+beat/,
        /^this\s+beat/,
        /^following\s+beat/,
        /^next\s+beat/,
        /^previous\s+beat/,
        /^in\s+this\s+scene/,
        /^this\s+scene/,
        /^in\s+this\s+moment/,
        /^this\s+moment/,
        /^we\s+see/,
        /^we\s+notice/,
        /^we\s+feel/,
        /^we\s+watch/,
        /^the\s+story/,
        /^the\s+scene/,
        /^the\s+moment/,
        /^here\s+we/,
        /^in\s+the\s+following/,
        /^as\s+we/,
      ];
      
      let isMeta = false;
      for (const pattern of metaPatterns) {
        if (pattern.test(lowerLine)) {
          isMeta = true;
          break;
        }
      }
      
      if (!isMeta) {
        cleanLines.push(trimmed);
      }
    }
    
    // If we removed everything, use placeholder
    if (cleanLines.length === 0) {
      cleanLines.push('[Content]');
    }
    
    // Second pass - clean each remaining line of any inline meta text
    const finalLines = cleanLines.map(line => {
      return line
        .replace(/^(?:beat|scene|moment)\s+\d+\s*[:\-–—]\s*/gi, '')
        .replace(/^(?:in|this|the)\s+(?:beat|scene|moment)\s+[:\-–—]?\s*/gi, '')
        .replace(/^(?:we|the\s+reader)\s+(?:see|notice|feel|watch|observe)\s+[:\-–—]?\s*/gi, '')
        .trim();
    }).filter(line => line.length > 0);
    
    // Limit lines per beat
    let limitedLines = finalLines.slice(0, contract.maxLinesPerBeat);
    
    // If no lines, add placeholder
    if (limitedLines.length === 0) {
      limitedLines = ['[Content]'];
    }
    
    // Trim each line to word limit
    limitedLines = limitedLines.map(line => {
      const words = line.split(/\s+/);
      if (words.length > contract.maxWordsPerLine) {
        return words.slice(0, contract.maxWordsPerLine).join(' ');
      }
      return line;
    });
    
    beats.push({ 
      lines: limitedLines, 
      marker 
    });
  }
  
  // Ensure we have the right number of beats
  while (beats.length < contract.maxBeats) {
    const marker = markers[beats.length] || 'STORY:';
    beats.push({ lines: ['[Content]'], marker });
  }
  
  return beats.slice(0, contract.maxBeats);
}

  /**
   * Post-process beats
   */
  private static postProcessBeats(beats: MicroStoryBeat[], contract: XOContract): MicroStoryBeat[] {
    // Add markers if required
    if (contract.requirePathMarkers) {
      const markers = this.getMarkersForEntryPath(contract.entryPath);
      beats.forEach((beat, index) => {
        if (index < markers.length) {
          beat.marker = markers[index];
        }
      });
    }
    
    // Ensure brand is only in last beat if present
    if (contract.brandMode === 'EXPLICIT' && contract.brandName) {
      // Remove brand references from non-last beats
      for (let i = 0; i < beats.length - 1; i++) {
        beats[i].lines = beats[i].lines.filter(line => 
          !line.toLowerCase().includes(contract.brandName!.toLowerCase())
        );
      }
    }
    
    // Trim lines to word limit
    beats.forEach(beat => {
      beat.lines = beat.lines.map(line => {
        const words = line.split(/\s+/);
        if (words.length > contract.maxWordsPerLine) {
          return words.slice(0, contract.maxWordsPerLine).join(' ');
        }
        return line;
      });
    });
    
    return beats;
  }

  /**
   * Select best pass from multiple attempts
   */
  private static selectBestPass(passes: GenerationPass[], contract: XOContract): GenerationPass | null {
    // First, try to find a valid pass
    const validPasses = passes.filter(p => p.valid);
    if (validPasses.length > 0) {
      // Return the first valid pass
      return validPasses[0];
    }
    
    // If no valid passes, but we have some beats, return the one with most beats
    const passesWithBeats = passes.filter(p => p.beats.length > 0);
    if (passesWithBeats.length > 0) {
      // Sort by beat count descending
      passesWithBeats.sort((a, b) => b.beats.length - a.beats.length);
      return passesWithBeats[0];
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
   * Get path-specific instructions
   */
  private static getPathInstructions(entryPath: string): string {
    const instructions = {
      emotion: 'Focus on emotional journey. Start with feeling, move to insight, end with transformed perspective.',
      scene: 'Focus on sensory details. Start with observation, move to noticed details, end with revealed meaning.',
      audience: 'Focus on audience connection. Start with signal, move to why it matters, end with shared experience.',
      seed: 'Focus on narrative arc. Start with seed, move through development, end with completion.',
      full: 'Focus on complete story. Use 5-beat structure: Hook, Conflict, Turn, Brand/Meaning, Close.',
    };
    
    return instructions[entryPath as keyof typeof instructions] || instructions.scene;
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
    
    // Create new contract based on refinement type
    const newContract = this.createRefinementContract(story.contract, refinement);
    
    // Convert beats to text for refinement
    const storyText = XORenderer.extractStoryText(story.beats);
    
    // Generate refined version
    const refinedStory = await this.generate(
      `Refine this story to be ${refinement}:\n\n${storyText}`,
      story.contract.marketCode,
      story.contract.brandName,
      options,
      { entryPath: story.contract.entryPath }
    );
    
    // Preserve original contract metadata
    refinedStory.contract = {
      ...newContract,
      context: story.contract.context, // Keep original context
    };
    
    return refinedStory;
  }

  /**
   * Create contract for refinement
   */
  private static createRefinementContract(
    originalContract: XOContract,
    refinement: string
  ): XOContract {
    const builder = new XOContractBuilder(originalContract);
    
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
      // gentler/harsher don't change contract structure
    }
    
    return builder.build();
  }

  /**
   * Convert micro-story to full story
   */
/**
 * Convert micro-story to full story
 */
static async convertToFullStory(
  story: MicroStory,
  meaningContract?: any
): Promise<MicroStory> {
  console.log('[XO Engine] Converting to full story');
  
  // Create full story contract with explicit maxBeats = 5
  const builder = new XOContractBuilder(story.contract)
    .withFormatMode('FULLSTORY')
    .withMaxBeats(5); // Force 5 beats
  
  // Ensure we're not using the micro-story's maxBeats
  const fullContract = builder.build();
  
  // Convert story text
  const storyText = XORenderer.extractStoryText(story.beats);
  
  // Generate full story with explicit instruction
  const fullStory = await this.generate(
    `Convert this to a 5-beat full story. You MUST generate exactly 5 beats:\n\n${storyText}`,
    fullContract.marketCode,
    fullContract.brandName,
    { 
      temperature: 0.7, 
      maxTokens: 500,
      passes: 3 
    },
    { 
      entryPath: 'full', 
      formatMode: 'FULLSTORY',
      maxBeats: 5, // Pass explicitly
      ...meaningContract 
    }
  );
  
  // Double-check the contract after generation
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
  
  // Render to formatted text
  const formattedText = XORenderer.renderMicroStory(story);
  
  // Create beat sheet
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