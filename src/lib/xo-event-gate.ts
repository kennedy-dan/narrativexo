/**
 * XO EVENT GATE v2.0
 * Verb and event-level containment system
 * Controls WHAT HAPPENS, not just WHAT EXISTS
 * Deterministic validation using LLM extraction + set comparison
 */

import OpenAI from 'openai';
import { MicroStoryBeat } from './xo-renderer';

// ============================================================================
// TYPES
// ============================================================================

export type VerbCategory = 
  | 'PHYSICAL'      // stand, sit, hold, move, look
  | 'SENSORY'        // see, hear, feel, smell
  | 'EMOTIONAL'      // feel (emotion), want, wish
  | 'COGNITIVE'      // think, know, remember, realize
  | 'RELATIONAL'     // love, hate, trust, betray
  | 'EXISTENTIAL'    // become, remain, exist, mean
  | 'ABSTRACT';      // deserve, promise, imagine, regret

export interface AllowedVerb {
  verb: string;
  baseForm: string;
  category: VerbCategory;
  source: 'INPUT' | 'PHYSICAL_BASE' | 'DENSITY_EXTENDED';
  confidence: number;
}

export interface ExtractedVerb {
  verb: string;
  baseForm: string;
  category: VerbCategory;
  position: {
    beatIndex: number;
    lineIndex: number;
    wordIndex: number;
  };
}

export interface EventGate {
  allowedVerbs: AllowedVerb[];
  maxEvents: number;                // Max events per beat
  maxEmotionalIntensity: number;     // 0-1 scale
  allowBackstory: boolean;
  allowFutureTense: boolean;
  allowCognitiveEvents: boolean;
  allowRelationalEvents: boolean;
  allowExistentialEvents: boolean;
  metadata: {
    inputVerbCount: number;
    baseVerbCount: number;
    density: 'LOW' | 'MEDIUM' | 'HIGH';
    confidence: number;              // Confidence in density classification
    timestamp: string;
  };
}

export interface EventViolation {
  type: 'UNALLOWED_VERB' | 'CATEGORY_NOT_ALLOWED' | 'BACKSTORY' | 'FUTURE_TENSE' | 'EMOTIONAL_INTENSITY' | 'TOO_MANY_EVENTS';
  details: string;
  position?: {
    beatIndex: number;
    lineIndex: number;
    wordIndex?: number;
  };
}

// ============================================================================
// BASE PHYSICAL VERBS (Always allowed)
// These are the only verbs allowed in LOW density
// ============================================================================

const BASE_PHYSICAL_VERBS = new Set([
  // Motion
  'stand', 'sit', 'lie', 'lean', 'kneel', 'crouch',
  'walk', 'step', 'move', 'turn', 'enter', 'leave',
  'approach', 'pass', 'cross', 'climb', 'descend',
  'rise', 'fall', 'jump', 'run', 'slide',
  
  // Position
  'hold', 'carry', 'lift', 'lower', 'place', 'set',
  'put', 'take', 'grab', 'grasp', 'release', 'drop',
  'push', 'pull', 'slide', 'drag', 'throw', 'catch',
  
  // Action
  'open', 'close', 'lock', 'unlock', 'shut',
  'fill', 'empty', 'pour', 'spill', 'stir',
  'cut', 'slice', 'break', 'repair', 'fix',
  'clean', 'wash', 'wipe', 'scrub', 'dust',
  'cook', 'heat', 'cool', 'warm',
  
  // Perception
  'look', 'watch', 'see', 'notice', 'observe',
  'listen', 'hear', 'touch', 'feel', 'sense',
  
  // Existence
  'be', 'exist', 'remain', 'stay', 'wait',
  
  // Communication (basic)
  'say', 'speak', 'whisper', 'shout', 'call',
  'ask', 'answer', 'reply', 'respond',
  
  // Handling
  'use', 'hold', 'handle', 'touch', 'press',
  'turn', 'twist', 'bend', 'fold', 'unfold'
]);

// ============================================================================
// DENSITY-BASED VERB EXPANSIONS
// ============================================================================

const MEDIUM_DENSITY_VERBS = new Map<string, VerbCategory>([
  // Emotional (mild)
  ['feel', 'EMOTIONAL'],
  ['want', 'EMOTIONAL'],
  ['wish', 'EMOTIONAL'],
  ['hope', 'EMOTIONAL'],
  ['smile', 'EMOTIONAL'],
  ['frown', 'EMOTIONAL'],
  ['sigh', 'EMOTIONAL'],
  
  // Sensory expanded
  ['smell', 'SENSORY'],
  ['taste', 'SENSORY'],
  
  // Simple cognitive
  ['know', 'COGNITIVE'],
  ['remember', 'COGNITIVE'],
  ['forget', 'COGNITIVE'],
  
  // Relational (implied)
  ['help', 'RELATIONAL'],
  ['share', 'RELATIONAL'],
  ['give', 'RELATIONAL'],
  ['offer', 'RELATIONAL']
]);

const HIGH_DENSITY_VERBS = new Map<string, VerbCategory>([
  // Cognitive
  ['think', 'COGNITIVE'],
  ['realize', 'COGNITIVE'],
  ['understand', 'COGNITIVE'],
  ['consider', 'COGNITIVE'],
  ['wonder', 'COGNITIVE'],
  ['imagine', 'COGNITIVE'],
  ['decide', 'COGNITIVE'],
  ['choose', 'COGNITIVE'],
  
  // Emotional
  ['love', 'EMOTIONAL'],
  ['hate', 'EMOTIONAL'],
  ['fear', 'EMOTIONAL'],
  ['trust', 'EMOTIONAL'],
  ['regret', 'EMOTIONAL'],
  ['miss', 'EMOTIONAL'],
  ['long', 'EMOTIONAL'],
  ['desire', 'EMOTIONAL'],
  
  // Relational
  ['trust', 'RELATIONAL'],
  ['betray', 'RELATIONAL'],
  ['forgive', 'RELATIONAL'],
  ['promise', 'RELATIONAL'],
  ['support', 'RELATIONAL'],
  ['protect', 'RELATIONAL'],
  
  // Existential
  ['become', 'EXISTENTIAL'],
  ['remain', 'EXISTENTIAL'],
  ['mean', 'EXISTENTIAL'],
  ['deserve', 'EXISTENTIAL'],
  ['matter', 'EXISTENTIAL'],
  ['exist', 'EXISTENTIAL'],
  
  // Abstract
  ['imagine', 'ABSTRACT'],
  ['pretend', 'ABSTRACT'],
  ['dream', 'ABSTRACT']
]);

// ============================================================================
// EVENT GATE BUILDER
// ============================================================================

export class XOEventGate {
  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  /**
   * Build event gate from input and density
   */
  static async buildEventGate(
    input: string,
    density: 'LOW' | 'MEDIUM' | 'HIGH',
    options: {
      minConfidence?: number;
    } = {}
  ): Promise<EventGate> {
    const minConfidence = options.minConfidence || 0.8;

    console.log('[XO EventGate] ========================================');
    console.log('[XO EventGate] Building event gate for density:', density);
    
    // Step 1: Extract verbs from input using GPT-4
    const inputVerbs = await this.extractInputVerbs(input);
    
    // Step 2: Build base verb set based on density
    const baseVerbs = this.getBaseVerbsForDensity(density);
    
    // Step 3: Merge and categorize
    const allowedVerbs = this.mergeVerbSets(inputVerbs, baseVerbs, density);
    
    // Step 4: Filter by confidence
    const filteredVerbs = allowedVerbs.filter(v => v.confidence >= minConfidence);
    
    // Step 5: Set event limits based on density
    const limits = this.getEventLimits(density);

    console.log('[XO EventGate] Built:', {
      totalVerbs: filteredVerbs.length,
      inputVerbs: inputVerbs.length,
      baseVerbs: baseVerbs.size,
      maxEvents: limits.maxEvents,
      allowCognitive: limits.allowCognitiveEvents,
      allowRelational: limits.allowRelationalEvents,
      allowExistential: limits.allowExistentialEvents,
      confidence: density === 'LOW' ? 0.9 : density === 'MEDIUM' ? 0.8 : 0.7
    });
    console.log('[XO EventGate] ========================================');

    return {
      allowedVerbs: filteredVerbs,
      ...limits,
      metadata: {
        inputVerbCount: inputVerbs.length,
        baseVerbCount: baseVerbs.size,
        density,
        confidence: density === 'LOW' ? 0.9 : density === 'MEDIUM' ? 0.8 : 0.7,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Extract verbs from input using GPT-4
   */
  private static async extractInputVerbs(input: string): Promise<AllowedVerb[]> {
    const prompt = `
Extract ALL verbs from this text.
For each verb:
- Return the verb as it appears
- Return its base form (infinitive without "to")
- Categorize it
- Rate confidence 0.0-1.0

Categories:
PHYSICAL: observable physical actions (walk, hold, open)
SENSORY: perception through senses (see, hear, feel)
EMOTIONAL: feelings and desires (want, wish, hope)
COGNITIVE: thinking, knowing, remembering (think, know, realize)
RELATIONAL: interactions between people (help, trust, love)
EXISTENTIAL: being, becoming, meaning (become, mean, exist)
ABSTRACT: imagination, promises, regrets (imagine, promise, regret)

Return ONLY a JSON array:
[
  {
    "verb": "walked",
    "baseForm": "walk",
    "category": "PHYSICAL",
    "confidence": 0.95
  },
  ...
]

Text: "${input}"

JSON:
    `.trim();

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You extract verbs from text and categorize them. Return only valid JSON arrays.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.0,
        max_tokens: 200,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content?.trim() || '{"verbs": []}';
      
      try {
        const parsed = JSON.parse(response);
        const verbs = Array.isArray(parsed) ? parsed : parsed.verbs || [];
        
        return verbs
          .filter((v: any) => 
            v.verb && 
            v.baseForm && 
            v.category && 
            typeof v.confidence === 'number'
          )
          .map((v: any) => ({
            verb: v.verb.toLowerCase().trim(),
            baseForm: v.baseForm.toLowerCase().trim(),
            category: v.category as VerbCategory,
            source: 'INPUT' as const,
            confidence: v.confidence
          }));
      } catch {
        return [];
      }
    } catch (error) {
      console.warn('[XO EventGate] Verb extraction failed:', error);
      return [];
    }
  }

  /**
   * Get base verb set for density level
   */
  private static getBaseVerbsForDensity(density: 'LOW' | 'MEDIUM' | 'HIGH'): Map<string, VerbCategory> {
    const baseMap = new Map<string, VerbCategory>();
    
    // Add all base physical verbs
    BASE_PHYSICAL_VERBS.forEach(verb => {
      baseMap.set(verb, 'PHYSICAL');
    });
    
    // Add medium density verbs if applicable
    if (density === 'MEDIUM' || density === 'HIGH') {
      MEDIUM_DENSITY_VERBS.forEach((category, verb) => {
        baseMap.set(verb, category);
      });
    }
    
    // Add high density verbs if applicable
    if (density === 'HIGH') {
      HIGH_DENSITY_VERBS.forEach((category, verb) => {
        baseMap.set(verb, category);
      });
    }
    
    return baseMap;
  }

  /**
   * Merge input verbs with base verbs
   */
  private static mergeVerbSets(
    inputVerbs: AllowedVerb[],
    baseVerbs: Map<string, VerbCategory>,
    density: 'LOW' | 'MEDIUM' | 'HIGH'
  ): AllowedVerb[] {
    const verbMap = new Map<string, AllowedVerb>();
    
    // Add input verbs (highest confidence)
    inputVerbs.forEach(v => {
      verbMap.set(v.baseForm, {
        ...v,
        source: 'INPUT',
        confidence: Math.max(v.confidence, 0.9) // Boost input verbs
      });
    });
    
    // Add base verbs if not already present
    baseVerbs.forEach((category, verb) => {
      if (!verbMap.has(verb)) {
        verbMap.set(verb, {
          verb,
          baseForm: verb,
          category,
          source: 'PHYSICAL_BASE',
          confidence: 0.95 // High confidence for base verbs
        });
      }
    });
    
    return Array.from(verbMap.values());
  }

  /**
   * Get event limits based on density
   */
  private static getEventLimits(density: 'LOW' | 'MEDIUM' | 'HIGH'): {
    maxEvents: number;
    maxEmotionalIntensity: number;
    allowBackstory: boolean;
    allowFutureTense: boolean;
    allowCognitiveEvents: boolean;
    allowRelationalEvents: boolean;
    allowExistentialEvents: boolean;
  } {
    switch (density) {
      case 'LOW':
        return {
          maxEvents: 1,              // One simple action per beat
          maxEmotionalIntensity: 0,   // No emotions
          allowBackstory: false,
          allowFutureTense: false,
          allowCognitiveEvents: false,
          allowRelationalEvents: false,
          allowExistentialEvents: false
        };
        
      case 'MEDIUM':
        return {
          maxEvents: 2,               // Can have simple action + reaction
          maxEmotionalIntensity: 0.5,  // Mild emotions allowed
          allowBackstory: false,
          allowFutureTense: false,
          allowCognitiveEvents: true,  // Know, remember
          allowRelationalEvents: true, // Help, share
          allowExistentialEvents: false
        };
        
      case 'HIGH':
        return {
          maxEvents: 3,               // Complex scene
          maxEmotionalIntensity: 1.0,  // Full emotional range
          allowBackstory: true,        // Implied past
          allowFutureTense: false,     // Still no future (keeps present)
          allowCognitiveEvents: true,   // Think, realize
          allowRelationalEvents: true,  // Love, trust
          allowExistentialEvents: true  // Become, mean
        };
    }
  }

  /**
   * Get event constraints prompt for generation
   */
  static getEventConstraintsPrompt(eventGate: EventGate): string {
    const verbList = eventGate.allowedVerbs
      .sort((a, b) => a.category.localeCompare(b.category))
      .map(v => `- ${v.verb} (${v.category})`)
      .join('\n');
    
    // Get unique categories
    const categories = [...new Set(eventGate.allowedVerbs.map(v => v.category))];
    
    let constraints = `
🔒 EVENT GATE CONSTRAINTS [DENSITY: ${eventGate.metadata.density}]:

ALLOWED VERB CATEGORIES: ${categories.join(', ')}

ALLOWED VERBS (use ONLY these):
${verbList}

EVENT LIMITS:
- Max events per beat: ${eventGate.maxEvents}
- Max emotional intensity: ${eventGate.maxEmotionalIntensity}
- Backstory allowed: ${eventGate.allowBackstory ? 'YES' : 'NO'}
- Future tense allowed: ${eventGate.allowFutureTense ? 'YES' : 'NO'}
    `;

    if (!eventGate.allowCognitiveEvents) {
      constraints += '\n- NO thinking, knowing, or realizing';
    }
    if (!eventGate.allowRelationalEvents) {
      constraints += '\n- NO relationship events (love, trust, betray)';
    }
    if (!eventGate.allowExistentialEvents) {
      constraints += '\n- NO existential events (become, mean, deserve)';
    }

    constraints += `

🚫 FORBIDDEN EVENTS:
- Any verb not in the allowed list
- Any verb category not allowed
- ${!eventGate.allowBackstory ? 'Backstory or flashbacks' : 'Backstory allowed but must be implied'}
- ${!eventGate.allowFutureTense ? 'Future predictions (will, gonna, tomorrow)' : ''}
- Multiple complex events in one beat
- Abstract psychological drama beyond allowed intensity

✅ ALLOWED EVENTS:
- Present-moment actions using allowed verbs
- Direct sensory experience
- Events that fit within the event limits
- ${eventGate.allowBackstory ? 'Mild backstory if essential to narrative' : 'Present tense only'}
    `;

    return constraints;
  }
}

// ============================================================================
// EVENT VALIDATOR
// ============================================================================

export class XOEventValidator {
  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  /**
   * Extract ALL verbs from beats using GPT-4
   * SYMMETRIC with verb extraction during gate building
   */
  static async extractVerbsFromBeats(
    beats: MicroStoryBeat[]
  ): Promise<ExtractedVerb[]> {
    const beatsText = beats.map((beat, idx) => 
      `Beat ${idx + 1}:\n${beat.lines.map((line, lineIdx) => `Line ${lineIdx + 1}: "${line}"`).join('\n')}`
    ).join('\n\n');

    const prompt = `
Extract ALL verbs from these story beats.
For each verb:
- Return the verb as it appears
- Return its base form (infinitive without "to")
- Categorize it: PHYSICAL, SENSORY, EMOTIONAL, COGNITIVE, RELATIONAL, EXISTENTIAL, ABSTRACT
- Include position (beatIndex, lineIndex, wordIndex)

Story beats:
${beatsText}

Return JSON array:
[
  {
    "verb": "stands",
    "baseForm": "stand",
    "category": "PHYSICAL",
    "position": {
      "beatIndex": 0,
      "lineIndex": 0,
      "wordIndex": 2
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
            content: 'You extract verbs from story beats. Return only valid JSON arrays.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.0,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content?.trim() || '{"verbs": []}';
      
      try {
        const parsed = JSON.parse(response);
        const verbs = Array.isArray(parsed) ? parsed : parsed.verbs || [];
        
        return verbs
          .filter((v: any) => 
            v.verb && 
            v.baseForm &&
            v.category &&
            v.position &&
            typeof v.position.beatIndex === 'number' &&
            typeof v.position.lineIndex === 'number'
          )
          .map((v: any) => ({
            verb: v.verb.toLowerCase(),
            baseForm: v.baseForm.toLowerCase(),
            category: v.category as VerbCategory,
            position: v.position
          }));
      } catch {
        return [];
      }
    } catch (error) {
      console.error('[XO EventValidator] Verb extraction failed:', error);
      return [];
    }
  }

  /**
   * Validate events in generated beats
   * DETERMINISTIC: set comparison, no heuristics
   */
  static async validateEvents(
    beats: MicroStoryBeat[],
    eventGate: EventGate,
    densityConfidence: number
  ): Promise<{
    valid: boolean;
    violations: EventViolation[];
    stats: {
      totalVerbs: number;
      allowedVerbs: number;
      violations: number;
    };
  }> {
    // If density confidence is low, enforce stricter rules
    const effectiveGate = densityConfidence < 0.75
      ? this.applyConfidenceFallback(eventGate)
      : eventGate;

    // Step 1: Extract all verbs from beats (LLM-powered)
    const extractedVerbs = await this.extractVerbsFromBeats(beats);
    
    // Step 2: Create lookup structures
    const allowedVerbMap = new Map(
      effectiveGate.allowedVerbs.map(v => [v.baseForm, v])
    );
    const allowedCategories = this.getAllowedCategories(effectiveGate);
    
    // Step 3: Check each verb
    const violations: EventViolation[] = [];
    
    for (const verb of extractedVerbs) {
      // Check if verb is allowed
      const allowedVerb = allowedVerbMap.get(verb.baseForm);
      
      if (!allowedVerb) {
        violations.push({
          type: 'UNALLOWED_VERB',
          details: `Verb "${verb.verb}" (${verb.category}) not in allowed set`,
          position: verb.position
        });
        continue;
      }
      
      // Check if category is allowed at this density
      if (!allowedCategories.has(verb.category)) {
        violations.push({
          type: 'CATEGORY_NOT_ALLOWED',
          details: `${verb.category} verbs not allowed at this density`,
          position: verb.position
        });
      }
    }
    
    // Step 4: Check event count per beat
    const eventsPerBeat = this.countEventsPerBeat(beats);
    eventsPerBeat.forEach((count, beatIndex) => {
      if (count > effectiveGate.maxEvents) {
        violations.push({
          type: 'TOO_MANY_EVENTS',
          details: `Beat ${beatIndex + 1} has ${count} events (max ${effectiveGate.maxEvents})`,
          position: { beatIndex, lineIndex: 0 }
        });
      }
    });
    
    // Step 5: Check for backstory patterns
    if (!effectiveGate.allowBackstory) {
      const backstoryViolations = await this.detectBackstory(beats);
      violations.push(...backstoryViolations);
    }
    
    // Step 6: Check for future tense
    if (!effectiveGate.allowFutureTense) {
      const futureViolations = await this.detectFutureTense(beats);
      violations.push(...futureViolations);
    }
    
    return {
      valid: violations.length === 0,
      violations,
      stats: {
        totalVerbs: extractedVerbs.length,
        allowedVerbs: extractedVerbs.length - violations.filter(v => 
          v.type === 'UNALLOWED_VERB' || v.type === 'CATEGORY_NOT_ALLOWED'
        ).length,
        violations: violations.length
      }
    };
  }

  /**
   * Apply confidence fallback
   * If we're unsure about density, be stricter
   */
  private static applyConfidenceFallback(eventGate: EventGate): EventGate {
    console.log('[XO EventValidator] Low confidence detected, applying stricter rules');
    
    return {
      ...eventGate,
      // Downgrade to stricter settings
      allowCognitiveEvents: false,
      allowRelationalEvents: false,
      allowExistentialEvents: false,
      allowBackstory: false,
      allowFutureTense: false,
      maxEvents: Math.min(eventGate.maxEvents, 1),
      maxEmotionalIntensity: Math.min(eventGate.maxEmotionalIntensity, 0.3)
    };
  }

  /**
   * Get allowed categories based on gate settings
   */
  private static getAllowedCategories(gate: EventGate): Set<VerbCategory> {
    const categories = new Set<VerbCategory>(['PHYSICAL', 'SENSORY']);
    
    if (gate.allowCognitiveEvents) categories.add('COGNITIVE');
    if (gate.allowRelationalEvents) categories.add('RELATIONAL');
    if (gate.allowExistentialEvents) categories.add('EXISTENTIAL');
    
    // EMOTIONAL is allowed up to maxEmotionalIntensity
    if (gate.maxEmotionalIntensity > 0) categories.add('EMOTIONAL');
    
    return categories;
  }

  /**
   * Count events per beat (simple heuristic using verb count)
   */
  private static countEventsPerBeat(beats: MicroStoryBeat[]): Map<number, number> {
    const eventCounts = new Map<number, number>();
    
    beats.forEach((beat, beatIndex) => {
      // Simple heuristic: each line with action words is an event
      // This is approximate - full validation uses extracted verbs
      let count = 0;
      for (const line of beat.lines) {
        const words = line.toLowerCase().split(/\W+/);
        if (words.some(w => BASE_PHYSICAL_VERBS.has(w) || w.endsWith('ing'))) {
          count++;
        }
      }
      eventCounts.set(beatIndex, count);
    });
    
    return eventCounts;
  }

  /**
   * Detect backstory using LLM
   */
  private static async detectBackstory(
    beats: MicroStoryBeat[]
  ): Promise<EventViolation[]> {
    const text = beats.map(b => b.lines.join(' ')).join(' ');
    
    const prompt = `
Does this text contain backstory?
Backstory = events that happened before the current scene, flashbacks, or memories of the past.

Text: "${text}"

Return JSON:
{
  "hasBackstory": boolean,
  "examples": [
    {
      "text": "example phrase",
      "reason": "why this is backstory",
      "beatIndex": 0,
      "lineIndex": 0
    }
  ]
}
    `.trim();

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You detect backstory in text. Return only valid JSON.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.0,
        max_tokens: 200,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content?.trim() || '{"hasBackstory": false}';
      const parsed = JSON.parse(response);
      
      if (parsed.hasBackstory) {
        return (parsed.examples || []).map((ex: any) => ({
          type: 'BACKSTORY' as const,
          details: `Backstory detected: ${ex.text} - ${ex.reason}`,
          position: ex.beatIndex !== undefined ? { 
            beatIndex: ex.beatIndex, 
            lineIndex: ex.lineIndex || 0 
          } : undefined
        }));
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Detect future tense using LLM
   */
  private static async detectFutureTense(
    beats: MicroStoryBeat[]
  ): Promise<EventViolation[]> {
    const text = beats.map(b => b.lines.join(' ')).join(' ');
    
    const prompt = `
Does this text contain future tense or predictions?
Future tense = will, gonna, going to, tomorrow, later, soon, upcoming.

Text: "${text}"

Return JSON:
{
  "hasFuture": boolean,
  "examples": [
    {
      "text": "example phrase",
      "reason": "why this is future tense",
      "beatIndex": 0,
      "lineIndex": 0
    }
  ]
}
    `.trim();

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You detect future tense in text. Return only valid JSON.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.0,
        max_tokens: 200,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content?.trim() || '{"hasFuture": false}';
      const parsed = JSON.parse(response);
      
      if (parsed.hasFuture) {
        return (parsed.examples || []).map((ex: any) => ({
          type: 'FUTURE_TENSE' as const,
          details: `Future tense detected: ${ex.text} - ${ex.reason}`,
          position: ex.beatIndex !== undefined ? { 
            beatIndex: ex.beatIndex, 
            lineIndex: ex.lineIndex || 0 
          } : undefined
        }));
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Quick validation for CI/CD (no LLM call)
   * Use this for pre-flight checks only
   */
  static quickValidate(
    beats: MicroStoryBeat[],
    eventGate: EventGate
  ): boolean {
    // Very rough check - only for early rejection
    const text = beats.map(b => b.lines.join(' ')).join(' ').toLowerCase();
    
    // Check for obvious future tense
    if (!eventGate.allowFutureTense) {
      if (/\b(will|gonna|tomorrow|later)\b/.test(text)) {
        return false;
      }
    }
    
    // Check for obvious backstory
    if (!eventGate.allowBackstory) {
      if (/\b(had|used to|remember when|ago)\b/.test(text)) {
        return false;
      }
    }
    
    return true;
  }
}

export default XOEventGate;