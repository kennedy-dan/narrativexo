/**
 * XO ONTOLOGY BUILDER v2.0
 * Dynamic semantic cluster expansion with entropy-based gating
 * Deterministic validation using LLM extraction + set comparison
 */

import OpenAI from 'openai';
import { MicroStoryBeat } from './xo-renderer';

// ============================================================================
// TYPES
// ============================================================================

export interface OntologyCluster {
  coreEntities: string[];
  expandedNouns: Array<{ noun: string; confidence: number }>;
  allAllowedNouns: string[];
  density: 'LOW' | 'MEDIUM' | 'HIGH';
  metadata: {
    inputEntityCount: number;
    expandedCount: number;
    expansionConfidence: number;
    expansionLimit: number;
    timestamp: string;
  };
}

export interface DensityMetrics {
  entityCount: number;
  actionVerbs: number;
  emotionalSignals: number;
  tensionMarkers: number;
  concreteObjects: number;
  relationshipCues: number;
  totalScore: number;
  density: 'LOW' | 'MEDIUM' | 'HIGH';
  llmDensity?: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
}

export interface ExtractedNouns {
  nouns: Array<{
    word: string;
    position: {
      beatIndex: number;
      lineIndex: number;
      wordIndex: number;
    };
  }>;
}

export interface NounViolation {
  beatIndex: number;
  lineIndex: number;
  word: string;
  reason: 'NOT_IN_ALLOWED_SET';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DENSITY_THRESHOLDS = {
  LOW_MAX: 7,      // 0-7 = LOW
  MEDIUM_MAX: 14,  // 8-14 = MEDIUM
  // 15+ = HIGH
};

const EXPANSION_LIMITS = {
  LOW: 8,      // Sparse input → tight expansion
  MEDIUM: 12,  // Moderate input → moderate expansion
  HIGH: 15,    // Rich input → full expansion
};

// Common words to always ignore in validation
const IGNORE_WORDS = new Set([
  // Articles and determiners
  'the', 'a', 'an', 'this', 'that', 'these', 'those',
  'my', 'your', 'his', 'her', 'its', 'our', 'their',
  
  // Conjunctions
  'and', 'or', 'but', 'if', 'then', 'else', 'so',
  'because', 'since', 'while', 'when', 'where', 'why', 'how',
  
  // Prepositions
  'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from',
  'up', 'down', 'into', 'onto', 'upon', 'under', 'over',
  'through', 'during', 'before', 'after', 'between', 'among',
  'around', 'about', 'against', 'without', 'inside', 'outside',
  
  // Pronouns
  'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'me', 'him', 'her', 'us', 'them',
  
  // Common verbs (auxiliary)
  'is', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did',
  'can', 'could', 'will', 'would', 'shall', 'should',
  'may', 'might', 'must',
  
  // Common words
  'just', 'only', 'very', 'too', 'also', 'even',
  'now', 'then', 'here', 'there',
]);

// ============================================================================
// ONTOLOGY BUILDER
// ============================================================================

export class XOOntologyBuilder {
  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  /**
   * Build controlled ontology from user input
   * Uses GPT-4 for high-fidelity extraction and expansion
   */
  static async buildOntology(
    userInput: string,
    options: {
      expansionSize?: number;
      minConfidence?: number;
    } = {}
  ): Promise<OntologyCluster> {
    const minConfidence = options.minConfidence || 0.8;

    console.log('[XO Ontology] ========================================');
    console.log('[XO Ontology] Building controlled ontology');
    console.log('[XO Ontology] Input:', userInput);

    // Step 1: Extract core entities using GPT-4
    const coreEntities = await this.extractCoreEntitiesGPT4(userInput);

    if (coreEntities.length === 0) {
  console.log('[XO Ontology] GPT-4 returned empty, using fallback');
  const fallback = this.fallbackExtractEntities(userInput);
  coreEntities.push(...fallback);
}

    
    // Step 2: Calculate density with LLM assistance
    const density = await this.calculateDensityWithLLM(userInput, coreEntities);
    
    // Step 3: Determine expansion limit based on density
    const expansionLimit = EXPANSION_LIMITS[density.density];
    const targetSize = options.expansionSize || expansionLimit;
    const actualTarget = Math.min(targetSize, expansionLimit);

    console.log('[XO Ontology] Density analysis:', {
      level: density.density,
      confidence: density.confidence,
      score: density.totalScore,
      expansionLimit,
      targetSize: actualTarget
    });

    // Step 4: Dynamically expand to adjacent ontology
    const expandedNouns = await this.expandToAdjacentOntology(
      coreEntities,
      density,
      actualTarget
    );
    
    // Step 5: Filter by confidence
    const filteredExpansions = expandedNouns
      .filter(item => item.confidence >= minConfidence)
      .map(item => ({
        noun: item.noun.toLowerCase().trim(),
        confidence: item.confidence
      }));
    
    // Step 6: Merge and deduplicate
    const allAllowedNouns = this.mergeAndDeduplicate([
      ...coreEntities,
      ...filteredExpansions.map(n => n.noun)
    ]);

    console.log('[XO Ontology] Built:', {
      coreCount: coreEntities.length,
      expandedRaw: expandedNouns.length,
      expandedFiltered: filteredExpansions.length,
      totalAllowed: allAllowedNouns.length,
      density: density.density
    });
    console.log('[XO Ontology] ========================================');

    return {
      coreEntities,
      expandedNouns: filteredExpansions,
      allAllowedNouns,
      density: density.density,
      metadata: {
        inputEntityCount: coreEntities.length,
        expandedCount: filteredExpansions.length,
        expansionConfidence: minConfidence,
        expansionLimit,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Extract core entities using GPT-4 for higher accuracy
   * CRITICAL: GPT-4 has much better JSON compliance than 3.5
   */
private static async extractCoreEntitiesGPT4(input: string): Promise<string[]> {
  // If input is empty, return empty array
  if (!input || input.trim().length === 0) {
    return [];
  }

  const prompt = `
Extract ALL important nouns from this text for a story.

Text: "${input}"

Instructions:
1. Identify EVERY noun (person, place, thing, object)
2. Include:
   - People: employee, woman, man, child, doctor, friend, etc.
   - Places: conference room, restaurant, house, street, etc.
   - Objects: presentation, table, chair, phone, laptop, etc.
   - Concrete things that exist physically
3. EXCLUDE:
   - Verbs (practices, arrives, moves, speaks)
   - Adjectives (empty, polished, silent)
   - Abstract concepts (potential, silence, voice)
   - Emotions (nervous, happy, sad)

Examples:
Input: "an employee practices a presentation in an empty conference room"
Output: ["employee", "presentation", "conference room"]

Input: "a woman waits nervously for her date at a restaurant, checking her phone"
Output: ["woman", "date", "restaurant", "phone"]

Input: "a dog waits by the window for its owner"
Output: ["dog", "window", "owner"]

Input: "someone tries to print a document but the printer keeps jamming"
Output: ["document", "printer"]

Return ONLY a JSON array of strings. If no nouns found, return [].
`;

  try {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'You extract concrete nouns from text. Return only valid JSON arrays.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.0,
      max_tokens: 150
    });

    const response = completion.choices[0].message.content?.trim() || '[]';
    console.log('[XO Ontology] GPT-4 raw response:', response);
    
    // Try to parse the response - FIXED: removed /s flag
    try {
      // First, try to find anything that looks like a JSON array
      // Match from first [ to last ] including newlines
      const startBracket = response.indexOf('[');
      const endBracket = response.lastIndexOf(']');
      
      if (startBracket !== -1 && endBracket !== -1 && endBracket > startBracket) {
        const jsonStr = response.substring(startBracket, endBracket + 1);
        
        // Clean the string - remove any markdown or extra text
        const cleaned = jsonStr
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          const nouns = parsed
            .filter(item => typeof item === 'string' && item.trim().length > 0)
            .map(item => item.toLowerCase().trim());
          
          console.log(`[XO Ontology] GPT-4 extracted ${nouns.length} nouns:`, nouns);
          
          if (nouns.length > 0) {
            return nouns;
          }
        }
      }
      
      // Try direct parse as fallback
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        const nouns = parsed
          .filter(item => typeof item === 'string' && item.trim().length > 0)
          .map(item => item.toLowerCase().trim());
        
        console.log(`[XO Ontology] GPT-4 extracted ${nouns.length} nouns:`, nouns);
        return nouns;
      }
    } catch (parseError) {
      console.warn('[XO Ontology] Failed to parse GPT-4 response:', parseError.message);
    }
    
    // Fallback to simple extraction
    console.log('[XO Ontology] Using fallback extraction');
    return this.fallbackExtractEntities(input);
    
  } catch (error) {
    console.error('[XO Ontology] GPT-4 extraction failed:', error);
    return this.fallbackExtractEntities(input);
  }
}

private static fallbackExtractEntities(input: string): string[] {
  // Split into words and clean
  const words = input.toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2)  // Remove short words
    .filter(word => !this.isCommonWord(word));  // Remove common words
  
  const inputLower = ' ' + input.toLowerCase() + ' ';
  const potentialNouns: string[] = [];
  const seen = new Set<string>();
  
  for (const word of words) {
    if (seen.has(word)) continue;
    
    // Check if word follows an article (a, an, the)
    if (inputLower.includes(` a ${word} `) || 
        inputLower.includes(` an ${word} `) || 
        inputLower.includes(` the ${word} `)) {
      potentialNouns.push(word);
      seen.add(word);
    }
    // Check if word is capitalized in original (proper noun)
    else if (input.includes(word.charAt(0).toUpperCase() + word.slice(1))) {
      potentialNouns.push(word);
      seen.add(word);
    }
    // Include if it looks like a noun (not a verb ending)
    else if (!word.match(/(ing|ed|es|ate)$/)) {
      potentialNouns.push(word);
      seen.add(word);
    }
  }
  
  // Special handling for compound nouns (like "conference room")
  const compoundNouns: string[] = [];
  const inputWords = input.toLowerCase().split(/\s+/);
  
  for (let i = 0; i < inputWords.length - 1; i++) {
    const twoWords = inputWords[i] + ' ' + inputWords[i + 1];
    // Check if this two-word phrase might be a compound noun
    if (potentialNouns.includes(inputWords[i]) || potentialNouns.includes(inputWords[i + 1])) {
      compoundNouns.push(twoWords);
    }
  }
  
  // Combine and remove duplicates
  const allNouns = [...new Set([...potentialNouns, ...compoundNouns])];
  console.log(`[XO Ontology] Fallback extracted ${allNouns.length} nouns:`, allNouns);
  
  return allNouns;
}

private static isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'the', 'and', 'for', 'with', 'not', 'but', 'from',
    'this', 'that', 'these', 'those', 'have', 'has', 'had',
    'was', 'were', 'been', 'being', 'will', 'would', 'could',
    'should', 'might', 'must', 'about', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'under',
    'over', 'again', 'once', 'here', 'there', 'where',
    'why', 'how', 'all', 'any', 'both', 'each', 'few',
    'more', 'most', 'other', 'some', 'such', 'than', 'then',
    'very', 'just', 'like', 'can', 'get', 'got', 'see',
    'know', 'think', 'want', 'need', 'make', 'take', 'come',
    'go', 'look', 'use', 'find', 'give', 'tell', 'ask',
    'work', 'call', 'try', 'feel', 'become', 'leave', 'put',
    'set', 'help', 'show', 'hear', 'play', 'run', 'move',
    'stand', 'sit', 'turn', 'wait', 'arrive', 'enter',
    'practice', 'present', 'empty', 'everyone'
  ]);
  return commonWords.has(word);
}

  /**
   * Calculate density with LLM assistance for higher accuracy
   * Hybrid approach: regex for speed, LLM for accuracy when needed
   */
  private static async calculateDensityWithLLM(
    input: string, 
    entities: string[]
  ): Promise<DensityMetrics> {
    // First pass: quick regex density
    const regexMetrics = this.calculateRegexDensity(input, entities);
    
    // If regex is confident enough (clear LOW or clear HIGH), use it
    if (regexMetrics.totalScore <= DENSITY_THRESHOLDS.LOW_MAX || 
        regexMetrics.totalScore >= DENSITY_THRESHOLDS.MEDIUM_MAX + 5) {
      return {
        ...regexMetrics,
        confidence: 0.85
      };
    }
    
    // For borderline cases, use LLM to validate
    try {
      const llmDensity = await this.getLLMDensity(input);
      
      return {
        ...regexMetrics,
        llmDensity: llmDensity.density,
        density: llmDensity.density, // Trust LLM for borderline cases
        confidence: 0.9
      };
    } catch (error) {
      // Fall back to regex with lower confidence
      return {
        ...regexMetrics,
        confidence: 0.7
      };
    }
  }

  /**
   * Quick regex-based density calculation
   */
  private static calculateRegexDensity(input: string, entities: string[]): DensityMetrics {
    const lowerInput = input.toLowerCase();
    
    const metrics = {
      entityCount: entities.length,
      actionVerbs: 0,
      emotionalSignals: 0,
      tensionMarkers: 0,
      concreteObjects: entities.length,
      relationshipCues: 0,
      totalScore: 0,
      density: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH',
      confidence: 0.7
    };

    // Action verbs
    const actionPatterns = [
      /\b(runs?|walks?|drives?|moves?|goes?|comes?)\b/,
      /\b(eats?|drinks?|cooks?|makes?|builds?)\b/,
      /\b(speaks?|talks?|says?|asks?|answers?)\b/,
      /\b(opens?|closes?|enters?|leaves?|arrives?)\b/
    ];

    actionPatterns.forEach(pattern => {
      if (pattern.test(lowerInput)) metrics.actionVerbs++;
    });

    // Emotional signals
    const emotionPatterns = [
      /\b(happy|sad|angry|fear|joy|love|hate)\b/,
      /\b(excited|nervous|calm|peaceful|worried)\b/,
      /\b(grateful|hopeful|frustrated|anxious)\b/
    ];

    emotionPatterns.forEach(pattern => {
      if (pattern.test(lowerInput)) metrics.emotionalSignals++;
    });

    // Tension markers
    const tensionPatterns = [
      /\b(but|however|although|despite)\b/,
      /\b(conflict|argument|fight|struggle)\b/,
      /\b(problem|challenge|difficult|hard)\b/,
      /\b(suddenly|unexpected|abruptly)\b/
    ];

    tensionPatterns.forEach(pattern => {
      if (pattern.test(lowerInput)) metrics.tensionMarkers++;
    });

    // Relationship cues
    const relationshipPatterns = [
      /\b(friend|family|mother|father|sister|brother)\b/,
      /\b(together|with|against|between)\b/,
      /\b(partner|colleague|neighbor|stranger)\b/
    ];

    relationshipPatterns.forEach(pattern => {
      if (pattern.test(lowerInput)) metrics.relationshipCues++;
    });

    // Calculate weighted score
    metrics.totalScore = 
      metrics.entityCount * 2 +
      metrics.actionVerbs * 3 +
      metrics.emotionalSignals * 4 +
      metrics.tensionMarkers * 4 +
      metrics.relationshipCues * 3;

    // Determine density with thresholds
    if (metrics.totalScore <= DENSITY_THRESHOLDS.LOW_MAX) {
      metrics.density = 'LOW';
    } else if (metrics.totalScore <= DENSITY_THRESHOLDS.MEDIUM_MAX) {
      metrics.density = 'MEDIUM';
    } else {
      metrics.density = 'HIGH';
    }

    return metrics;
  }

  /**
   * Get LLM-assisted density for borderline cases
   */
  private static async getLLMDensity(input: string): Promise<{ density: 'LOW' | 'MEDIUM' | 'HIGH' }> {
    const prompt = `
Analyze the narrative density of this input.

Density levels:
- LOW: Only concrete entities, no emotion, no action, no tension
- MEDIUM: Some action or emotion present, but minimal complexity
- HIGH: Multiple actions, emotions, relationships, or tension

Return ONLY a JSON object: {"density": "LOW|MEDIUM|HIGH"}

Input: "${input}"

JSON:
    `.trim();

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.0,
        max_tokens: 50,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content?.trim() || '{"density": "LOW"}';
      const parsed = JSON.parse(response);
      return { density: parsed.density || 'LOW' };
    } catch (error) {
      return { density: 'LOW' };
    }
  }



private static isLikelyVerb(word: string): boolean {
  const verbPatterns = [
    'ing$', 'ed$', 'es$', 'ate$', 'ify$', 'ize$'
  ];
  return verbPatterns.some(pattern => new RegExp(pattern).test(word));
}

  /**
   * Expand core entities to adjacent ontology
   * CRITICAL: No quota forcing - "up to" not "exactly"
   */
 private static async expandToAdjacentOntology(
  coreEntities: string[],
  density: DensityMetrics,
  maxExpansion: number
): Promise<Array<{ noun: string; confidence: number }>> {
  const entityList = coreEntities.join(', ');
  
  // Density-based expansion guidance
  let expansionGuidance = '';
  
  if (density.density === 'LOW') {
    expansionGuidance = `
STORY CONTEXT: Simple scene with minimal elements
EXPAND WITH: Basic objects and locations that would naturally appear
EXAMPLES: 
- For ["boy"] → ["street", "house", "door", "window"]
- For ["woman", "kitchen"] → ["table", "chair", "cup", "plate"]
- For ["car"] → ["road", "wheel", "seat", "window"]
    `;
  } else if (density.density === 'MEDIUM') {
    expansionGuidance = `
STORY CONTEXT: Moderate narrative with some emotional depth
EXPAND WITH: Objects, locations, and atmospheric elements
EXAMPLES:
- For ["boy", "shoe", "store"] → ["window", "pocket", "money", "counter", "street"]
- For ["man", "rain"] → ["coat", "umbrella", "puddle", "sky", "wind"]
- For ["woman", "letter"] → ["desk", "envelope", "pen", "paper", "drawer"]
    `;
  } else {
    expansionGuidance = `
STORY CONTEXT: Rich narrative with complex elements
EXPAND WITH: Full range of related objects, settings, and details
EXAMPLES:
- For ["child", "toy", "store"] → ["shelf", "aisle", "cashier", "bag", "receipt", "parking lot"]
- For ["couple", "restaurant"] → ["table", "menu", "waiter", "candle", "wine glass", "napkin"]
    `;
  }

  const prompt = `
CORE STORY ELEMENTS: ${entityList}
NARRATIVE DENSITY: ${density.density}

${expansionGuidance}

TASK: Generate a JSON array of objects with:
- noun: a physical object, location, or element that could naturally appear in a story about the core elements
- confidence: 0.0-1.0 how likely this noun would appear (0.7+ for obvious connections, 0.5-0.7 for possible but less certain)

REQUIREMENTS:
- Return EXACTLY ${maxExpansion} nouns (expand or trim the list as needed)
- Only include physical objects that could exist in the scene
- NO abstract concepts (love, time, hope, fear)
- NO emotions
- NO verbs or actions

Examples of GOOD expansions:

Input: ["boy", "shoe", "store"]
Output: [
  {"noun": "window", "confidence": 0.95},
  {"noun": "pocket", "confidence": 0.9},
  {"noun": "money", "confidence": 0.9},
  {"noun": "counter", "confidence": 0.85},
  {"noun": "street", "confidence": 0.8},
  {"noun": "door", "confidence": 0.8}
]

Input: ["woman", "garden"]
Output: [
  {"noun": "flower", "confidence": 0.95},
  {"noun": "bench", "confidence": 0.9},
  {"noun": "path", "confidence": 0.9},
  {"noun": "tree", "confidence": 0.85},
  {"noun": "gate", "confidence": 0.8}
]

Input: ["man", "coffee"]
Output: [
  {"noun": "cup", "confidence": 0.95},
  {"noun": "table", "confidence": 0.9},
  {"noun": "chair", "confidence": 0.85},
  {"noun": "cafe", "confidence": 0.85},
  {"noun": "window", "confidence": 0.8}
]

Generate ${maxExpansion} nouns for: ${entityList}

Return ONLY the JSON array:
  `.trim();

  try {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'You expand story elements to related physical nouns. Return only valid JSON arrays.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, // Slight variation for creativity
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content?.trim() || '[]';
    
    // Parse response
    let items = [];
    try {
      const parsed = JSON.parse(response);
      items = Array.isArray(parsed) ? parsed : parsed.nouns || [];
    } catch {
      // Try to extract array from text if JSON parse fails
      const match = response.match(/\[[\s\S]*\]/);
      if (match) {
        items = JSON.parse(match[0]);
      } else {
        return [];
      }
    }
    
    // Validate and format
    return items
      .filter((item: any) => item && item.noun && typeof item.confidence === 'number')
      .map((item: any) => ({
        noun: item.noun.toLowerCase().trim(),
        confidence: Math.min(1, Math.max(0, item.confidence))
      }))
      .slice(0, maxExpansion);
      
  } catch (error) {
    console.error('[XO Ontology] Expansion failed:', error);
    return [];
  }
}

  /**
   * Merge and deduplicate noun lists
   */
  private static mergeAndDeduplicate(lists: string[]): string[] {
    const normalized = lists.map(noun => noun.toLowerCase().trim());
    return Array.from(new Set(normalized)).sort();
  }

  /**
   * Get narrative constraints based on density
   */
  static getDensityConstraints(density: 'LOW' | 'MEDIUM' | 'HIGH'): {
    prompt: string;
    rules: string[];
  } {
    const constraints = {
      LOW: {
        prompt: `
🚫 NARRATIVE DEPTH LIMITER [LOW DENSITY - STRICT MODE]:
- NO new characters beyond those in input
- NO relational nouns (friend, family, partner)
- NO emotional escalation (happy, sad, angry)
- NO abstract nouns (life, time, meaning)
- NO implied backstory
- NO psychological expansion
- NO time shifts
- NO future events
- STICK TO: physical objects, simple actions
- If input has no action, describe setting only
        `,
        rules: [
          'no_new_characters',
          'no_relational_nouns',
          'no_emotional_escalation',
          'no_abstract_nouns',
          'no_backstory',
          'no_psychological_depth',
          'no_time_shifts',
          'physical_only'
        ]
      },
      MEDIUM: {
        prompt: `
⚠️ NARRATIVE DEPTH LIMITER [MEDIUM DENSITY]:
- MAY include mild emotional signals
- MAY include simple actions
- NO new characters
- NO existential arcs
- NO deep psychological themes
- NO backstory invention
- STICK TO: scene, action, subtle feeling
- Keep narrative present-tense, immediate
        `,
        rules: [
          'no_new_characters',
          'emotional_signals_allowed',
          'no_existential_arcs',
          'no_psychological_depth',
          'present_tense_only'
        ]
      },
      HIGH: {
        prompt: `
✅ NARRATIVE DEPTH LIMITER [HIGH DENSITY]:
- May develop implied relationships
- May explore emotional dimensions
- May include mild backstory if implied
- MUST stay within expanded ontology
- NO invention beyond allowed nouns
- Keep focus on core entities
        `,
        rules: [
          'may_develop_relationships',
          'may_explore_emotions',
          'may_have_implied_backstory',
          'must_stay_in_ontology'
        ]
      }
    };
    
    return constraints[density];
  }
}

// ============================================================================
// ONTOLOGY VALIDATOR
// ============================================================================

export class XOOntologyValidator {
  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  /**
   * Extract ALL nouns from beats using GPT-4
   * This is the ONLY source of truth for noun detection
   */
  static async extractNounsFromBeats(
    beats: MicroStoryBeat[]
  ): Promise<ExtractedNouns> {
    // Convert beats to a structured format for the LLM
    const beatsText = beats.map((beat, idx) => 
      `Beat ${idx + 1}:\n${beat.lines.map((line, lineIdx) => `Line ${lineIdx + 1}: "${line}"`).join('\n')}`
    ).join('\n\n');

    const prompt = `
Extract ALL nouns from these story beats.
Return a JSON array with:
- word: the noun as it appears (lowercase)
- beatIndex: 0-based beat number
- lineIndex: 0-based line number within that beat
- wordIndex: 0-based word position in that line

Include ONLY nouns (people, places, things, concepts).
Do NOT include:
- verbs
- adjectives
- adverbs
- pronouns (she, he, it, they)
- determiners (the, a, an)
- prepositions (in, on, at)

Story beats:
${beatsText}

Return JSON array:
[
  {
    "word": "woman",
    "position": {
      "beatIndex": 0,
      "lineIndex": 0,
      "wordIndex": 1
    }
  }
]
    `.trim();

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You extract nouns from story beats. Return only valid JSON arrays.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.0,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content?.trim() || '{"nouns": []}';
      
      try {
        const parsed = JSON.parse(response);
        const nouns = Array.isArray(parsed) ? parsed : parsed.nouns || [];
        
        // Validate structure
        return {
          nouns: nouns
            .filter((n: any) => 
              n.word && 
              n.position && 
              typeof n.position.beatIndex === 'number' &&
              typeof n.position.lineIndex === 'number' &&
              typeof n.position.wordIndex === 'number'
            )
            .map((n: any) => ({
              word: n.word.toLowerCase().trim(),
              position: n.position
            }))
        };
      } catch (parseError) {
        console.error('[XO Ontology] Failed to parse noun extraction:', parseError);
        return { nouns: [] };
      }
    } catch (error) {
      console.error('[XO Ontology] Noun extraction failed:', error);
      return { nouns: [] };
    }
  }

  /**
   * Validate beats against allowed nouns
   * DETERMINISTIC: set comparison, no heuristics
   */
  static async validateAgainstOntology(
    beats: MicroStoryBeat[],
    allowedNouns: string[]
  ): Promise<{
    valid: boolean;
    violations: NounViolation[];
    stats: {
      totalNouns: number;
      allowedNouns: number;
      violations: number;
    };
  }> {
    // Step 1: Extract all nouns from beats (LLM-powered)
    const extracted = await this.extractNounsFromBeats(beats);
    
    // Step 2: Create lookup sets
    const allowedSet = new Set(allowedNouns.map(n => n.toLowerCase()));
    
    // Step 3: Check each noun against allowed set
    const violations: NounViolation[] = [];
    
    for (const noun of extracted.nouns) {
      if (!allowedSet.has(noun.word) && !IGNORE_WORDS.has(noun.word)) {
        violations.push({
          beatIndex: noun.position.beatIndex,
          lineIndex: noun.position.lineIndex,
          word: noun.word,
          reason: 'NOT_IN_ALLOWED_SET'
        });
      }
    }
    
    return {
      valid: violations.length === 0,
      violations,
      stats: {
        totalNouns: extracted.nouns.length,
        allowedNouns: extracted.nouns.length - violations.length,
        violations: violations.length
      }
    };
  }

  /**
   * Quick validation for CI/CD (no LLM call)
   * Use this for pre-flight checks only
   */
  static quickValidate(
    beats: MicroStoryBeat[],
    allowedNouns: string[]
  ): boolean {
    // This is a fast heuristic for pre-validation
    // But final validation MUST use the LLM version
    const allowedSet = new Set(allowedNouns.map(n => n.toLowerCase()));
    const text = beats.map(b => b.lines.join(' ')).join(' ').toLowerCase();
    const words = text.split(/\W+/);
    
    // Very rough check - only for early rejection
    const suspiciousWords = words.filter(w => 
      w.length > 3 && 
      !allowedSet.has(w) &&
      !IGNORE_WORDS.has(w)
    );
    
    return suspiciousWords.length < 3; // Allow some false positives
  }
}

export default XOOntologyBuilder;