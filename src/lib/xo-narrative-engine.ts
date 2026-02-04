import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ============================================================================
// TYPES
// ============================================================================

export interface MicroStoryBeat {
  lines: string[];
  emotion?: string;
  tension?: string;
  marker?: string; // The path marker used for this beat
}

export interface MicroStory {
  beats: MicroStoryBeat[];
  market?: string;
  entryPath?: 'emotion' | 'scene' | 'seed' | 'audience';
  brand?: string;
  timestamp: string;
  formattedText?: string;
}

export interface XONarrativeOptions {
  temperature?: number;
  maxTokens?: number;
  validateOutput?: boolean;
  tone?: string;
}

// ============================================================================
// STARTER PACK v0.2 CONSTANTS
// ============================================================================

// Exact markers from Starter Pack v0.2
const STARTER_PACK_MARKERS = {
  emotion: ['EMOTION_INPUT:', 'INSIGHT:', 'STORY:'],
  scene: ['SCENE_INPUT:', 'DETAILS_NOTICED:', 'STORY:'],
  seed: ['SEED:', 'ARC:', 'STORY:'],
  audience: ['AUDIENCE_SIGNAL:', 'WHY_IT_MATTERS:', 'STORY:']
} as const;

// Market-specific guidance from Starter Pack
const MARKET_GUIDANCE = {
  NG: `Write for a Nigerian audience. Use relatable Nigerian contexts, values, and experiences. 
Avoid stereotypes and ensure cultural authenticity. Use Nigerian English naturally but avoid forced slang.`,
  
  GH: `Write for a Ghanaian audience. Use relatable Ghanaian contexts, values, and experiences. 
Capture the unique Ghanaian spirit while avoiding stereotypes.`,
  
  KE: `Write for a Kenyan audience. Use relatable Kenyan contexts, values, and experiences. 
Reflect Kenyan resilience and innovation authentically.`,
  
  ZA: `Write for a South African audience. Use relatable South African contexts, values, and experiences. 
Reflect the diversity and resilience of South Africa authentically.`,
  
  UK: `Write for a UK audience. Use British English spelling and phrasing. 
Reference relatable UK contexts, values, and experiences. Keep tone appropriate for UK sensibilities.`,
  
  GLOBAL: `Write for a global audience. Use universally relatable contexts and experiences. 
Avoid region-specific references that might not translate internationally.`
};

// Tone guidance
const TONE_GUIDANCE = {
  PLAYFUL: `Use a light, playful tone. Include moments of humor, whimsy, or lightheartedness. 
Keep it engaging and fun without being silly.`,
  
  SERIOUS: `Use a serious, thoughtful tone. Focus on depth, meaning, and significance. 
Avoid flippancy or casual humor.`,
  
  PREMIUM: `Use a premium, sophisticated tone. Focus on quality, craftsmanship, and exclusivity. 
Use refined language and elevated phrasing.`,
  
  GRASSROOTS: `Use a grassroots, authentic tone. Focus on real people, communities, and everyday experiences. 
Keep language genuine and unpretentious.`,
  
  NEUTRAL: `Use a balanced, clear tone. Focus on clear communication without strong emotional coloring. 
Be professional yet accessible.`
};

// ============================================================================
// XO NARRATIVE ENGINE
// ============================================================================

export class XONarrativeEngine {
  
  /**
   * Generate a micro-story based on input
   */
  static async generate(
    input: string,
    market: string = 'GLOBAL',
    brand?: string,
    options: XONarrativeOptions = {}
  ): Promise<MicroStory> {
    // Determine entry path from input
    const entryPath = this.detectEntryPath(input);
    
    console.log(`[XO Engine] Generating story:`, {
      entryPath,
      market,
      hasBrand: !!brand,
      inputLength: input.length
    });
    
    // Build the system prompt
    const systemPrompt = this.buildSystemPrompt(entryPath, market, options.tone);
    
    // Build the user prompt
    const userPrompt = this.buildUserPrompt(input, market, brand, entryPath);
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 600,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      });

      const rawStory = completion.choices[0].message.content?.trim() || '';
      
      console.log(`[XO Engine] Raw story generated:`, {
        length: rawStory.length,
        first100: rawStory.substring(0, 100)
      });
      
      // Parse beats from the generated text
      const beats = this.parseBeats(rawStory, entryPath);
      
      // Create the micro story
      const microStory: MicroStory = {
        beats,
        market,
        entryPath,
        brand,
        timestamp: new Date().toISOString()
      };
      
      // Format with Starter Pack markers
      microStory.formattedText = this.formatWithPathMarkers(microStory);
      
      // Validate if requested
      if (options.validateOutput) {
        const isValid = this.validatePathMarkers(microStory);
        if (!isValid) {
          console.warn('[XO Engine] Generated story missing proper path markers');
        }
      }
      
      console.log(`[XO Engine] Story generated successfully:`, {
        beatCount: beats.length,
        formattedLength: microStory.formattedText?.length,
        hasMarkers: this.validatePathMarkers(microStory)
      });
      
      return microStory;
      
    } catch (error) {
      console.error('[XO Engine] Generation error:', error);
      throw new Error(`Failed to generate story: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Refine an existing story
   */
  static async refine(
    story: MicroStory,
    refinement: 'expand' | 'gentler' | 'harsher'
  ): Promise<MicroStory> {
    console.log(`[XO Engine] Refining story: ${refinement}`, {
      entryPath: story.entryPath,
      beatCount: story.beats.length
    });
    
    const refinementInstructions = {
      expand: `Expand this story by adding more detail, depth, and context. 
Keep the same emotional core and structure, but make it richer and more immersive.
Each beat should become more detailed while staying 1-2 lines maximum.`,
      
      gentler: `Make this story gentler, softer, and more empathetic.
Reduce any harshness, intensity, or confrontation.
Maintain the same meaning but with a more compassionate, understanding tone.
Keep the structure and markers exactly the same.`,
      
      harsher: `Make this story more intense, dramatic, and impactful.
Increase tension, conflict, and emotional weight.
Maintain the same meaning but with more edge and urgency.
Keep the structure and markers exactly the same.`
    };
    
    const instruction = refinementInstructions[refinement];
    const currentText = story.formattedText || this.formatWithPathMarkers(story);
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are refining a story. You MUST preserve the exact structure and path markers.
Return the refined story with the same markers in the same order.`
          },
          {
            role: "user",
            content: `${instruction}\n\nCurrent story:\n${currentText}\n\nRefined story:`
          }
        ],
        temperature: 0.7,
        max_tokens: 600
      });

      const refinedText = completion.choices[0].message.content?.trim() || '';
      
      // Parse the refined beats
      const beats = this.parseBeats(refinedText, story.entryPath || 'seed');
      
      // Create refined story
      const refinedStory: MicroStory = {
        ...story,
        beats,
        timestamp: new Date().toISOString()
      };
      
      // Format with markers
      refinedStory.formattedText = this.formatWithPathMarkers(refinedStory);
      
      console.log(`[XO Engine] Story refined successfully:`, {
        originalBeats: story.beats.length,
        refinedBeats: beats.length,
        hasMarkers: this.validatePathMarkers(refinedStory)
      });
      
      return refinedStory;
      
    } catch (error) {
      console.error('[XO Engine] Refinement error:', error);
      throw new Error(`Failed to refine story: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Detect entry path from input text
   */
  private static detectEntryPath(input: string): 'emotion' | 'scene' | 'seed' | 'audience' {
    const upperInput = input.toUpperCase();
    
    // Check for Starter Pack v0.2 explicit markers in input
    if (upperInput.includes('EMOTION INPUT:')) return 'emotion';
    if (upperInput.includes('SCENE INPUT:')) return 'scene';
    if (upperInput.includes('STORY SEED:')) return 'seed';
    if (upperInput.includes('AUDIENCE SIGNAL:')) return 'audience';
    
    // Check for keywords (from Starter Pack test cases)
    if (/(feel|felt|feeling|emotion|emotional|relief|anxiety|joy|sad|happy|angry|excited|calm)/i.test(input)) {
      return 'emotion';
    }
    
    if (/(scene|setting|place|location|room|space|environment|background|kitchen|office|street|park)/i.test(input)) {
      return 'scene';
    }
    
    if (/(audience|viewer|reader|people|they|them|everyone|somebody|customer|user|consumer|family)/i.test(input)) {
      return 'audience';
    }
    
    // Default to seed (as per Starter Pack)
    return 'seed';
  }
  
  /**
   * Build system prompt for OpenAI
   */
  private static buildSystemPrompt(
    entryPath: string,
    market: string,
    tone?: string
  ): string {
    const markers = STARTER_PACK_MARKERS[entryPath];
    const marketGuidance = MARKET_GUIDANCE[market as keyof typeof MARKET_GUIDANCE] || MARKET_GUIDANCE.GLOBAL;
    const toneGuidance = tone ? TONE_GUIDANCE[tone as keyof typeof TONE_GUIDANCE] || '' : '';
    
    return `You are a master storyteller creating micro-stories for the XO system.

CRITICAL FORMATTING RULES (MUST FOLLOW):
1. Output MUST use these EXACT markers in uppercase, in this order:
${markers.map(marker => `   ${marker}`).join('\n')}

2. Structure requirements:
   - Each marker gets its own section
   - Each section contains 1-2 lines of text maximum
   - No paragraphs or long blocks
   - Blank line between sections
   - Total output: 3-5 sections (one per marker)

3. Content requirements:
   - Show, don't tell
   - Be concise and impactful
   - Use vivid, sensory language
   - Create emotional resonance
   - End with a meaningful close

4. Market & Tone:
${marketGuidance}
${toneGuidance}

EXAMPLE FORMAT:
${markers[0]}
A single line or two lines max

${markers[1]}
Another single line or two lines max

${markers[2]}
Final section, 1-2 lines max

DO NOT:
- Write paragraphs
- Use markdown formatting
- Add extra commentary
- Miss any markers
- Change marker order
- Exceed 2 lines per section`;
  }
  
  /**
   * Build user prompt for OpenAI
   */
  private static buildUserPrompt(
    input: string,
    market: string,
    brand?: string,
    entryPath?: string
  ): string {
    const entryPathContext = {
      emotion: 'Focus on the emotional journey and insight.',
      scene: 'Focus on the sensory details and what they reveal.',
      seed: 'Focus on developing the seed into a complete arc.',
      audience: 'Focus on why this matters to the specific audience.'
    }[entryPath || 'seed'];
    
    const brandContext = brand ? `\nBrand Context: This story is for ${brand}. Integrate brand values naturally.` : '';
    
    return `Create a micro-story based on this input:

Input: "${input.substring(0, 200)}${input.length > 200 ? '...' : ''}"

Market: ${market}
${entryPathContext}
${brandContext}

Generate a compelling micro-story that follows all formatting rules.`;
  }
  
  /**
   * Parse generated text into beats with markers
   */
  private static parseBeats(
    text: string,
    entryPath: string
  ): MicroStoryBeat[] {
    const markers = STARTER_PACK_MARKERS[entryPath];
    const beats: MicroStoryBeat[] = [];
    
    // Normalize text for parsing
    const normalizedText = text.replace(/\r\n/g, '\n');
    let remainingText = normalizedText;
    
    // Find each marker in order
    for (const marker of markers) {
      const markerIndex = remainingText.toUpperCase().indexOf(marker);
      
      if (markerIndex === -1) {
        // Marker not found, create empty beat
        beats.push({
          lines: ['[Content missing]'],
          marker
        });
        continue;
      }
      
      // Find content after marker
      const contentStart = markerIndex + marker.length;
      let contentEnd = remainingText.length;
      
      // Look for next marker
      for (const nextMarker of markers) {
        if (nextMarker === marker) continue;
        const nextIndex = remainingText.toUpperCase().indexOf(nextMarker, contentStart);
        if (nextIndex !== -1 && nextIndex < contentEnd) {
          contentEnd = nextIndex;
        }
      }
      
      // Extract content and clean it
      let content = remainingText.substring(contentStart, contentEnd).trim();
      
      // Remove any trailing markers that might be in the content
      markers.forEach(m => {
        const index = content.toUpperCase().indexOf(m);
        if (index !== -1) {
          content = content.substring(0, index).trim();
        }
      });
      
      // Split into lines and clean
      const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, 2); // Max 2 lines per beat
      
      beats.push({
        lines: lines.length > 0 ? lines : ['[Content]'],
        marker
      });
      
      // Update remaining text
      remainingText = remainingText.substring(contentEnd);
    }
    
    // If we didn't find all markers, ensure we have the right number of beats
    while (beats.length < markers.length) {
      beats.push({
        lines: ['[Content]'],
        marker: markers[beats.length]
      });
    }
    
    return beats;
  }
  
  /**
   * Format micro-story with Starter Pack path markers
   */
  static formatWithPathMarkers(story: MicroStory): string {
    const entryPath = story.entryPath || 'seed';
    const markers = STARTER_PACK_MARKERS[entryPath];
    
    let formatted = '';
    
    story.beats.forEach((beat, index) => {
      const marker = index < markers.length ? markers[index] : markers[markers.length - 1];
      const content = beat.lines.join('\n').trim();
      
      formatted += `${marker}\n`;
      if (content) {
        formatted += `${content}\n`;
      } else {
        formatted += `[Story content]\n`;
      }
      formatted += `\n`;
    });
    
    return formatted.trim();
  }
  
  /**
   * Validate that story has correct path markers
   */
  static validatePathMarkers(story: MicroStory): boolean {
    if (!story.formattedText || !story.entryPath) {
      return false;
    }
    
    const markers = STARTER_PACK_MARKERS[story.entryPath];
    const upperText = story.formattedText.toUpperCase();
    
    // Check all markers are present
    const allMarkersPresent = markers.every(marker => upperText.includes(marker));
    
    // Check markers are in correct order
    let lastIndex = -1;
    let markersInOrder = true;
    
    for (const marker of markers) {
      const currentIndex = upperText.indexOf(marker);
      if (currentIndex === -1 || currentIndex <= lastIndex) {
        markersInOrder = false;
        break;
      }
      lastIndex = currentIndex;
    }
    
    return allMarkersPresent && markersInOrder;
  }
  
  /**
   * Extract just the story text without markers (for display)
   */
  static extractStoryText(formattedText: string): string {
    // Remove all marker lines and extra whitespace
    const allMarkers = Object.values(STARTER_PACK_MARKERS).flat();
    let text = formattedText;
    
    allMarkers.forEach(marker => {
      const regex = new RegExp(`^${marker}\\s*$\\n?`, 'gmi');
      text = text.replace(regex, '');
    });
    
    // Clean up extra blank lines
    return text.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
  }
}

// ============================================================================
// COMPATIBILITY FUNCTION FOR EXISTING CODE
// ============================================================================

/**
 * Legacy compatibility function - used by existing /api/xo/generate
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
  const entryPath = meaningContract?.entryPath || 'seed';
  
  const microStory = await XONarrativeEngine.generate(
    input,
    market,
    brand,
    {
      temperature: 0.7,
      maxTokens: 500,
      validateOutput: true,
      tone: meaningContract?.interpretedMeaning?.emotionalState
    }
  );
  
  // Ensure formatted text exists
  if (!microStory.formattedText) {
    microStory.formattedText = XONarrativeEngine.formatWithPathMarkers(microStory);
  }
  
  // Convert to beat sheet format
  const beatSheet = microStory.beats.map((beat, index) => ({
    beat: `Beat ${index + 1}`,
    description: beat.lines.join(' '),
    lines: beat.lines,
    marker: beat.marker,
    emotion: beat.emotion,
    tension: beat.tension
  }));
  
  return {
    story: microStory.formattedText,
    beatSheet,
    metadata: {
      title: `Story: ${meaningContract?.interpretedMeaning?.coreTheme || 'Human Experience'}`,
      market: microStory.market,
      entryPath: microStory.entryPath?.toUpperCase(),
      brand: microStory.brand,
      timestamp: microStory.timestamp,
      beatCount: microStory.beats.length,
      wordCount: microStory.formattedText.split(/\s+/).length,
      hasValidMarkers: XONarrativeEngine.validatePathMarkers(microStory)
    }
  };
}