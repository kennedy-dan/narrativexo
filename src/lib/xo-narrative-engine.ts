import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ============================================================================
// TYPES
// ============================================================================

export type BeatType = "lived-moment" | "progression" | "meaning" | "brand";
export type MarketType = "GLOBAL" | "NG" | "UK";
export type EntryForm = "declarative" | "scene-like" | "audience-like" | "directive";

export interface MicroStoryBeat {
  lines: string[];
  type: BeatType;
  sourcePass?: number;
}

export interface MicroStory {
  beats: MicroStoryBeat[];
  market?: MarketType;
  hasBrand?: boolean;
  extractedBrand?: string;
  frontendBrand?: string;
}

export interface NarrativeScaffold {
  pass_1: string;
  pass_2: string;
  pass_3: string;
  pass_4: string;
  market?: MarketType;
  entryForm?: EntryForm;
}

export interface PipelineContext {
  market: MarketType;
  brand?: string;
  extractedBrand?: string;
  entryForm: EntryForm;
  userInput: string;
  constraints?: MarketConstraints;
}

export interface MarketConstraints {
  culturalContext?: string;
  registerGuidance?: string;
  avoidClichés?: string[];
}

// ============================================================================
// BRAND VALIDATOR - NEW CLASS
// ============================================================================

export class BrandValidator {
  static isDistinctBrand(brand: string): boolean {
    const brandLower = brand.toLowerCase().trim();
    
    // Common words that aren't brands
    const commonWords = [
      'could', 'should', 'would', 'will', 'might', 'may', 'can',
      'this', 'that', 'these', 'those', 'the', 'a', 'an',
      'brand', 'company', 'product', 'item', 'goods',
      'moment', 'time', 'day', 'night', 'thing', 'stuff',
      'what', 'why', 'how', 'when', 'where', 'who'
    ];
    
    if (commonWords.includes(brandLower) || brandLower.length < 2) {
      return false;
    }
    
    // Check if it's a known brand
    const knownBrands = [
      'nike', 'adidas', 'puma', 'reebok', 'converse', 'vans',
      'apple', 'samsung', 'sony', 'microsoft', 'google',
      'levi', 'amazon', 'meta', 'tesla', 'coca', 'pepsi',
      'starbucks', 'mcdonald', 'ikea', 'nokia', 'volvo',
      'bmw', 'mercedes', 'toyota', 'ford', 'honda',
      'gucci', 'chanel', 'louis vuitton', 'prada'
    ];
    
    if (knownBrands.some(kb => brandLower.includes(kb))) {
      return true;
    }
    
    // For unknown brands, check if it looks like a brand
    const wordCount = brandLower.split(/\s+/).length;
    if (wordCount === 1) {
      // Single word brands should be uncommon
      const isCommon = commonWords.includes(brandLower);
      const isTooShort = brandLower.length < 3;
      const isVerb = this.isVerb(brandLower);
      return !isCommon && !isTooShort && !isVerb;
    }
    
    // Multi-word likely to be a brand
    return true;
  }
  
  private static isVerb(word: string): boolean {
    const commonVerbs = [
      'run', 'walk', 'jump', 'play', 'work', 'make', 'do', 'have',
      'be', 'see', 'come', 'go', 'know', 'get', 'give', 'take',
      'put', 'set', 'let', 'feel', 'think', 'try', 'call', 'ask',
      'need', 'want', 'like', 'love', 'hate', 'help', 'start',
      'stop', 'begin', 'end', 'create', 'build', 'design'
    ];
    return commonVerbs.includes(word);
  }
}

// ============================================================================
// VALIDATOR
// ============================================================================

export class MicroStoryValidator {
  static validate(microStory: MicroStory): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const totalBeats = microStory.beats.length;

    // Strict 3-8 beat limit
    if (totalBeats < 3 || totalBeats > 8) {
      errors.push(`Must have 3-8 beats (got ${totalBeats})`);
    }

    // Check if story actually has a brand beat
    const hasBrandBeat = microStory.beats.some(b => b.type === "brand");
    
    // If hasBrand is true but no brand beat, that's an error
    if (microStory.hasBrand && !hasBrandBeat) {
      errors.push("Story marked as hasBrand but no brand beat found");
    }

    // If hasBrandBeat is true, ensure it follows rules
    if (hasBrandBeat) {
      const lastBeat = microStory.beats[microStory.beats.length - 1];
      if (lastBeat.type !== "brand") {
        errors.push("Brand beat must be the last beat");
      }
      
      // Brand beat must contain the brand name naturally
      const lastBeatText = lastBeat.lines.join(" ").toLowerCase();
      const brandName = microStory.extractedBrand || microStory.frontendBrand || "";
      if (brandName && !lastBeatText.includes(brandName.toLowerCase())) {
        errors.push(`Brand beat must naturally include brand name "${brandName}"`);
      }
    }

    // Check for meta-commentary
    for (let i = 0; i < microStory.beats.length; i++) {
      const beat = microStory.beats[i];
      for (const line of beat.lines) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes("total beats") ||
            lowerLine.includes("beats total") ||
            lowerLine.includes("total:") ||
            /\(\d+\s+beats/.test(lowerLine) ||
            lowerLine.includes("beat:") ||
            lowerLine.includes("type:")) {
          errors.push(`Beat ${i+1} contains meta-commentary`);
        }
      }
    }

    // Count beats by type
    const livedMoments = microStory.beats.filter(b => b.type === "lived-moment").length;
    const progression = microStory.beats.filter(b => b.type === "progression").length;
    const meaning = microStory.beats.filter(b => b.type === "meaning").length;
    const brand = microStory.beats.filter(b => b.type === "brand").length;

    // Validate structure
    if (livedMoments < 2) {
      errors.push(`Must have at least 2 lived-moment beats (got ${livedMoments})`);
    }

    if (progression < 1) {
      errors.push(`Must have at least 1 progression beat (got ${progression})`);
    }

    if (meaning > 2) {
      errors.push(`Max 2 meaning beats allowed (got ${meaning})`);
    }

    if (brand > 1) {
      errors.push(`Max 1 brand beat allowed (got ${brand})`);
    }

    // Brand validation
    if (brand > 0) {
      const brandBeat = microStory.beats.find(b => b.type === "brand");
      if (brandBeat) {
        const brandText = brandBeat.lines.join(" ");
        if (brandText.trim().split(" ").length < 3) {
          errors.push("Brand beat should be a complete thought (not just brand name)");
        }
        
        // Check if brand name is properly included
        const brandName = microStory.extractedBrand || microStory.frontendBrand || "";
        if (brandName) {
          const expectedBrand = brandName.toLowerCase();
          const actualText = brandText.toLowerCase();
          if (!actualText.includes(expectedBrand)) {
            errors.push(`Brand beat should include brand name "${brandName}"`);
          }
        }
      }
    }

    // Validate individual beats
    for (let i = 0; i < microStory.beats.length; i++) {
      const beat = microStory.beats[i];
      
      if (beat.lines.length === 0 || beat.lines.length > 3) {
        errors.push(`Beat ${i+1} has ${beat.lines.length} lines (must be 1-3)`);
      }

      for (let j = 0; j < beat.lines.length; j++) {
        const line = beat.lines[j];
        if (line.length > 120) {
          errors.push(`Beat ${i+1}, Line ${j+1} too long (${line.length} chars)`);
        }

        const sentenceCount = (line.match(/[.!?]+/g) || []).length;
        if (sentenceCount > 2) {
          errors.push(`Beat ${i+1}, Line ${j+1} has ${sentenceCount} sentences (max 2)`);
        }

        const proseConnectors = ["and then", "after that", "next", "later", "meanwhile", "finally"];
        if (proseConnectors.some(connector => line.toLowerCase().includes(connector))) {
          errors.push(`Beat ${i+1}, Line ${j+1} has prose connective tissue`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static fromText(text: string): MicroStory {
    const cleanedText = text
      .split('\n')
      .filter(line => {
        const lowerLine = line.toLowerCase().trim();
        return !(
          lowerLine.includes('total beats') ||
          lowerLine.includes('beats total') ||
          lowerLine.includes('total:') ||
          /\(\d+\s+beats/.test(lowerLine) ||
          lowerLine.includes('beat:') ||
          lowerLine.includes('type:')
        );
      })
      .join('\n');

    const paragraphs = cleanedText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const beats: MicroStoryBeat[] = [];

    for (const paragraph of paragraphs) {
      const lines = paragraph
        .split("\n")
        .map(line => line.trim())
        .filter(line => {
          const lowerLine = line.toLowerCase();
          return (
            line.trim().length > 0 &&
            !lowerLine.includes('total beats') &&
            !lowerLine.includes('beats total') &&
            !lowerLine.includes('total:') &&
            !/\(\d+\s+beats/.test(lowerLine) &&
            !lowerLine.includes('beat:') &&
            !lowerLine.includes('type:')
          );
        });

      for (let i = 0; i < lines.length; i += 3) {
        const beatLines = lines.slice(i, i + 3);
        if (beatLines.length > 0) {
          beats.push({ 
            lines: beatLines, 
            type: "lived-moment"
          });
        }
      }
    }

    return { beats };
  }
}

// ============================================================================
// BRAND EXTRACTOR - IMPROVED
// ============================================================================

export class BrandExtractor {
  static extractFromInput(userInput: string): string | null {
    // Clean common false positives first
    const cleanedInput = userInput.replace(/\bcould\b/gi, '');
    
    const brandPatterns = [
      // Explicit brand mentions with "brand" keyword
      /(?:\bbrand\s+(?:called|named|is)\s+["']?([A-Z][a-zA-Z0-9&\s\-]+)["']?)/i,
      /(?:\bmy\s+(?:brand|company)\s+["']?([A-Z][a-zA-Z0-9&\s\-]+)["']?)/i,
      /(?:\b(?:sell|market|promote|advertise)\s+(?:an?|the)?\s+["']?([A-Z][a-zA-Z0-9&\s\-]+)["']?\s+(?:shoe|product|item|goods|device|app|service|brand)\b)/i,
      
      // Known brand names
      /\b(Adidas|Nike|Puma|Reebok|Converse|Vans|Under\s*Armour|Asics|New\s*Balance|Levi's|Apple|Samsung|Sony|Microsoft|Google|Amazon|Meta|Tesla)\b/,
      
      // Brands in quotes
      /["']([A-Z][a-zA-Z0-9&\s\-]+)["']\s+(?:brand|company|corp)/i,
    ];
    
    for (const pattern of brandPatterns) {
      const match = cleanedInput.match(pattern);
      if (match) {
        let brandName = match[1] || match[0];
        brandName = brandName.trim();
        
        // Filter out common words that aren't brands
        const falsePositives = [
          'could', 'should', 'would', 'will', 'might', 'may', 'can',
          'this', 'that', 'these', 'those', 'the', 'a', 'an',
          'brand', 'company', 'product', 'item', 'goods'
        ];
        
        const brandLower = brandName.toLowerCase();
        if (falsePositives.some(fp => brandLower === fp || brandLower.includes(fp + ' '))) {
          continue;
        }
        
        // Validate it's a distinct brand
        if (!BrandValidator.isDistinctBrand(brandName)) {
          continue;
        }
        
        if (brandName && brandName.length > 1) {
          brandName = this.normalizeBrandName(brandName);
          console.log(`[XO] Extracted brand: "${brandName}" from: "${userInput.substring(0, 50)}..."`);
          return brandName;
        }
      }
    }
    
    console.log(`[XO] No brand extracted from: "${userInput.substring(0, 50)}..."`);
    return null;
  }
  
  private static normalizeBrandName(name: string): string {
    // Remove trailing "brand" or "company"
    let normalized = name.replace(/\s+(?:brand|company|corp|inc|ltd|llc)\.?$/i, '');
    
    // Capitalize properly
    const words = normalized.split(/\s+/);
    return words.map(word => {
      if (word.includes('-')) {
        return word.split('-').map(part => 
          part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        ).join('-');
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  }
}

// ============================================================================
// INTENT NORMALIZER
// ============================================================================

export class IntentNormalizer {
  static normalize(
    input: string,
    market: MarketType,
  ): {
    normalizedInput: string;
    entryForm: EntryForm;
    extractedBrand?: string;
  } {
    const trimmedInput = input.trim();
    
    // Extract brand first
    const extractedBrand = BrandExtractor.extractFromInput(trimmedInput);
    
    let entryForm: EntryForm = "declarative";
    const lowerInput = trimmedInput.toLowerCase();
    
    if (lowerInput.startsWith("scene:") || 
        lowerInput.startsWith("in ") ||
        lowerInput.includes(" in the ") ||
        lowerInput.includes(" on the ")) {
      entryForm = "scene-like";
    } else if (lowerInput.startsWith("audience:") ||
               lowerInput.includes(" people ") ||
               lowerInput.includes(" they ") ||
               lowerInput.includes(" everyone ")) {
      entryForm = "audience-like";
    } else if (lowerInput.startsWith("make ") ||
               lowerInput.startsWith("create ") ||
               lowerInput.startsWith("write ")) {
      entryForm = "directive";
    }
    
    // Clean the input by removing any brand mentions for story generation
    let normalizedInput = trimmedInput;
    if (extractedBrand) {
      const brandRegex = new RegExp(`\\b${extractedBrand}\\b`, 'gi');
      normalizedInput = normalizedInput.replace(brandRegex, '').trim();
      normalizedInput = normalizedInput.replace(/\s+/g, ' ').trim();
    }
    
    return { normalizedInput, entryForm, extractedBrand };
  }
}

// ============================================================================
// NARRATIVE SCAFFOLD GENERATOR
// ============================================================================

export class NarrativeScaffoldGenerator {
  static generate(context: PipelineContext): NarrativeScaffold {
    const hasDistinctBrand = context.brand && BrandValidator.isDistinctBrand(context.brand);
    const maxBeats = 8;
    
    const baseScaffold: NarrativeScaffold = {
      pass_1: "3-4 lived-moment beats",
      pass_2: "2-3 progression beats", 
      pass_3: "0-2 meaning beats",
      pass_4: hasDistinctBrand ? "1 brand beat (LAST if present)" : "No brand beat",
      market: context.market,
      entryForm: context.entryForm,
    };

    console.log("[XO] Scaffold generated:", {
      ...baseScaffold,
      hasDistinctBrand,
      maxBeats
    });
    return baseScaffold;
  }
}

// ============================================================================
// MARKET CONSTRAINT GENERATOR
// ============================================================================

export class MarketConstraintGenerator {
  static async generate(market: MarketType): Promise<MarketConstraints> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a cultural consultant for narrative generation.",
          },
          {
            role: "user",
            content: `Generate market constraints for ${market} market.
1. Cultural context (1-2 sentences)
2. Register guidance (language style)
3. Things to avoid (general categories)`,
          },
        ],
        temperature: 0.5,
        max_tokens: 150,
      });

      const content = response.choices[0].message.content || "";
      return this.parseConstraints(content, market);
      
    } catch (error) {
      console.error("[XO] Error generating market constraints:", error);
      return this.getFallbackConstraints(market);
    }
  }

  private static parseConstraints(content: string, market: MarketType): MarketConstraints {
    const constraints: MarketConstraints = {
      culturalContext: "",
      registerGuidance: "",
      avoidClichés: []
    };

    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    let currentSection = "";
    
    for (const line of lines) {
      if (line.toLowerCase().includes("cultural context") || line.includes("1.")) {
        currentSection = "culturalContext";
        constraints.culturalContext = line.replace(/^[0-9.]+|\s*-\s*|\s*:\s*/g, '').trim();
      } else if (line.toLowerCase().includes("register guidance") || line.includes("2.")) {
        currentSection = "registerGuidance";
        constraints.registerGuidance = line.replace(/^[0-9.]+|\s*-\s*|\s*:\s*/g, '').trim();
      } else if (line.toLowerCase().includes("things to avoid") || line.includes("3.")) {
        currentSection = "avoid";
        const avoidText = line.replace(/^[0-9.]+|\s*-\s*|\s*:\s*/g, '').trim();
        constraints.avoidClichés = avoidText.split(/[,;]/).map(item => item.trim()).filter(item => item);
      } else if (currentSection === "culturalContext" && constraints.culturalContext) {
        constraints.culturalContext += " " + line;
      } else if (currentSection === "registerGuidance" && constraints.registerGuidance) {
        constraints.registerGuidance += " " + line;
      } else if (currentSection === "avoid" && constraints.avoidClichés) {
        const additionalItems = line.split(/[,;]/).map(item => item.trim()).filter(item => item);
        constraints.avoidClichés.push(...additionalItems);
      }
    }

    return constraints;
  }

  private static getFallbackConstraints(market: MarketType): MarketConstraints {
    switch (market) {
      case "NG":
        return {
          culturalContext: "Authentic Nigerian urban settings, communal activities.",
          registerGuidance: "Natural, authentic language.",
          avoidClichés: ["poverty stereotypes", "tribal clichés"]
        };
      case "UK":
        return {
          culturalContext: "Contemporary British life with understated settings.",
          registerGuidance: "Understated, dry tone.",
          avoidClichés: ["royal family references", "football hooligan stereotypes"]
        };
      default:
        return {
          culturalContext: "Universal human experiences.",
          registerGuidance: "Clear, accessible language.",
          avoidClichés: ["cultural stereotypes", "exoticization"]
        };
    }
  }
}

// ============================================================================
// LIVED MOMENT ENGINE (3-4 beats)
// ============================================================================

export class LivedMomentEngine {
  static async generate(
    input: string,
    scaffold: NarrativeScaffold,
    constraints?: MarketConstraints,
  ): Promise<MicroStoryBeat[]> {
    const prompt = this.buildPrompt(input, scaffold, constraints);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Generate EXACTLY 3-4 lived-moment beats. STRICT RULES:
1. 3-4 beats only
2. Each beat: 1-3 lines
3. Show behavior and sensation ONLY
4. NO abstraction or emotion labels
5. NO brand language
6. Present tense only
7. NO meta-commentary

Example:
The screen lights up.
Same one as last time.

Fingers tap the glass.
A pattern emerges.

The sound hums.
Low and steady.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        console.error("[XO] No content for lived moments");
        return this.getFallbackBeats();
      }

      console.log("[XO] Pass 1 output preview:", content.substring(0, 200));

      const beats = this.parseBeats(content);
      if (beats.length < 3 || beats.length > 4) {
        console.log("[XO] Invalid beat count:", beats.length);
        return this.getFallbackBeats();
      }

      return beats.map((beat) => ({
        lines: beat.slice(0, 3),
        type: "lived-moment" as const,
        sourcePass: 1,
      }));
    } catch (error) {
      console.error("[XO] Pass 1 error:", error);
      return this.getFallbackBeats();
    }
  }

  private static buildPrompt(
    input: string,
    scaffold: NarrativeScaffold,
    constraints?: MarketConstraints,
  ): string {
    let prompt = `Generate EXACTLY 3-4 lived-moment beats for: "${input}"\n\n`;

    if (scaffold.market !== "GLOBAL") {
      prompt += `Market: ${scaffold.market}\n`;
    }

    if (constraints?.culturalContext) {
      prompt += `Cultural Context: ${constraints.culturalContext}\n`;
    }

    if (constraints?.registerGuidance) {
      prompt += `Language Style: ${constraints.registerGuidance}\n`;
    }

    prompt += `\nReturn 3-4 beats, separated by blank lines.`;
    prompt += `\nNO meta-commentary.`;
    prompt += `\nNO brand mentions.`;

    return prompt;
  }

  static parseBeats(content: string): string[][] {
    const cleaned = content
      .split('\n')
      .filter(line => {
        const lowerLine = line.toLowerCase().trim();
        return !(
          lowerLine.includes('total beats') ||
          lowerLine.includes('beats total') ||
          lowerLine.includes('total:') ||
          /\(\d+\s+beats/.test(lowerLine) ||
          lowerLine.includes('beat:') ||
          lowerLine.includes('type:')
        );
      })
      .join('\n')
      .trim();

    const paragraphs = cleaned.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const beats: string[][] = [];

    for (const paragraph of paragraphs) {
      const lines = paragraph
        .split("\n")
        .map(line => line.trim())
        .filter(line => {
          const lowerLine = line.toLowerCase();
          return (
            line.length > 0 &&
            !lowerLine.includes('total beats') &&
            !lowerLine.includes('beats total') &&
            !lowerLine.includes('total:') &&
            !/\(\d+\s+beats/.test(lowerLine) &&
            !lowerLine.includes('beat:') &&
            !lowerLine.includes('type:')
          );
        });

      if (lines.length > 0) {
        beats.push(lines.slice(0, 3));
      }
    }

    return beats;
  }

  private static getFallbackBeats(): MicroStoryBeat[] {
    return [
      {
        lines: ["The screen lights up."],
        type: "lived-moment",
        sourcePass: 1,
      },
      {
        lines: ["A finger touches the glass.", "Cold against the warmth."],
        type: "lived-moment",
        sourcePass: 1,
      },
      {
        lines: ["A notification appears.", "It blinks twice."],
        type: "lived-moment",
        sourcePass: 1,
      },
    ];
  }
}

// ============================================================================
// PROGRESSION ENGINE (2-3 beats)
// ============================================================================

export class ProgressionEngine {
  static async generate(
    livedMoments: MicroStoryBeat[],
    scaffold: NarrativeScaffold,
    constraints?: MarketConstraints,
  ): Promise<MicroStoryBeat[]> {
    const livedText = livedMoments
      .map((beat) => beat.lines.join("\n"))
      .join("\n\n");
    const prompt = this.buildPrompt(livedText, scaffold, constraints);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Generate EXACTLY 2-3 progression beats. STRICT RULES:
1. 2-3 beats only
2. Each beat: 1-3 lines
3. Show change or contrast
4. NO emotion labels
5. NO brand language
6. Present tense
7. NO meta-commentary

Example:
At halftime, nobody speaks.
Eyes stay on the screen.

When it ends, they sit back.
Silence hangs in the air.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 120,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        console.error("[XO] No content for progression");
        return this.getFallbackBeats();
      }

      console.log("[XO] Pass 2 output preview:", content.substring(0, 150));

      const beats = LivedMomentEngine.parseBeats(content);
      const targetCount = Math.min(Math.max(beats.length, 2), 3);
      const trimmedBeats = beats.slice(0, targetCount);
      
      return trimmedBeats.map((beat) => ({
        lines: beat.slice(0, 3),
        type: "progression" as const,
        sourcePass: 2,
      }));
    } catch (error) {
      console.error("[XO] Pass 2 error:", error);
      return this.getFallbackBeats();
    }
  }

  private static buildPrompt(
    livedText: string,
    scaffold: NarrativeScaffold,
    constraints?: MarketConstraints,
  ): string {
    let prompt = `Generate EXACTLY 2-3 progression beats:\n\n`;
    prompt += `Lived moments:\n${livedText}\n\n`;
    prompt += `Show change or contrast.\n`;
    
    if (scaffold.market !== "GLOBAL") {
      prompt += `Market: ${scaffold.market}\n`;
    }

    if (constraints?.culturalContext) {
      prompt += `Cultural Context: ${constraints.culturalContext}\n`;
    }

    prompt += `\nReturn 2-3 beats only.`;
    prompt += `\nNO meta-commentary.`;
    prompt += `\nNO brand mentions.`;

    return prompt;
  }

  private static getFallbackBeats(): MicroStoryBeat[] {
    return [
      {
        lines: ["They stay seated.", "No one moves."],
        type: "progression",
        sourcePass: 2,
      },
      {
        lines: ["The air cools.", "Night approaches."],
        type: "progression",
        sourcePass: 2,
      },
    ];
  }
}

// ============================================================================
// MEANING EXTRACTION ENGINE (0-2 beats)
// ============================================================================

export class MeaningExtractionEngine {
  static async generate(
    livedMoments: MicroStoryBeat[],
    progressionBeats: MicroStoryBeat[],
    scaffold: NarrativeScaffold,
    constraints?: MarketConstraints,
    hasBrand?: boolean
  ): Promise<MicroStoryBeat[]> {
    const allBeats = [...livedMoments, ...progressionBeats];
    const currentBeatCount = allBeats.length;
    
    // Max 8 beats total, leave room for brand if needed
    const maxBeats = 8;
    const targetMeaningBeats = hasBrand ? 1 : 2;
    const availableSlots = maxBeats - currentBeatCount - (hasBrand ? 1 : 0);
    
    if (availableSlots <= 0) {
      console.log(`[XO] Skipping meaning - no room (${currentBeatCount} beats)`);
      return [];
    }
    
    const meaningBeatsToGenerate = Math.min(targetMeaningBeats, availableSlots);
    if (meaningBeatsToGenerate === 0) {
      console.log(`[XO] No meaning beats needed (${currentBeatCount} beats)`);
      return [];
    }
    
    const storyText = allBeats
      .map((beat) => beat.lines.join("\n"))
      .join("\n\n");
    const prompt = this.buildPrompt(storyText, meaningBeatsToGenerate, scaffold, constraints);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Generate ${meaningBeatsToGenerate} meaning beat(s). STRICT RULES:
1. ${meaningBeatsToGenerate} beat(s) only
2. Each beat: 1-2 lines
3. Human truth, not marketing
4. Simple abstraction
5. NO meta-commentary
6. NO brand mentions

Example for 1 beat:
Some things matter because you stayed for all of it.

Example for 2 beats:
The quiet moments hold the truth.
What remains after the noise fades.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 80,
      });

      const content = response.choices[0].message.content;
      if (!content || content.trim().length < 10) {
        console.log("[XO] No meaning beat generated");
        return [];
      }

      console.log("[XO] Pass 3 output preview:", content.substring(0, 100));

      const beats = LivedMomentEngine.parseBeats(content);
      if (beats.length > 0) {
        return beats.slice(0, meaningBeatsToGenerate).map(beat => ({
          lines: beat.slice(0, 2),
          type: "meaning" as const,
          sourcePass: 3,
        }));
      }
      
      return [];
    } catch (error) {
      console.error("[XO] Pass 3 error:", error);
      return [];
    }
  }

  private static buildPrompt(
    storyText: string,
    beatCount: number,
    scaffold: NarrativeScaffold,
    constraints?: MarketConstraints,
  ): string {
    let prompt = `Extract ${beatCount} meaning beat(s) from this story:\n\n`;
    prompt += `${storyText}\n\n`;
    
    if (scaffold.market !== "GLOBAL") {
      prompt += `Market: ${scaffold.market}\n`;
    }

    prompt += `\nReturn EXACTLY ${beatCount} beat(s) that add human truth.`;
    prompt += `\nNO meta-commentary.`;
    prompt += `\nNO brand mentions.`;

    return prompt;
  }
}

// ============================================================================
// BRAND ALIGNMENT ENGINE - ONLY FOR DISTINCT BRANDS
// ============================================================================

export class BrandAlignmentEngine {
  static async generate(
    allBeats: MicroStoryBeat[],
    brand: string,
    scaffold: NarrativeScaffold,
    constraints?: MarketConstraints,
  ): Promise<MicroStoryBeat[]> {
    // Validate brand is a real brand, not a common word
    if (!BrandValidator.isDistinctBrand(brand)) {
      console.log(`[XO] Not a distinct brand: "${brand}" - skipping`);
      return [];
    }
    
    const totalBeats = allBeats.length;
    const maxBeats = 8;
    
    // Need room for brand beat
    if (totalBeats >= maxBeats) {
      console.log(`[XO] No room for brand beat: ${totalBeats} beats`);
      return [];
    }

    const storyText = allBeats
      .map((beat) => beat.lines.join("\n"))
      .join("\n\n");
    
    const storyTheme = this.extractTheme(allBeats);
    const prompt = this.buildPrompt(storyText, brand, storyTheme, scaffold, constraints);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Create ONE brand-aligned beat. STRICT RULES:
1. Create 1 beat ONLY (1-2 lines)
2. Beat must be a COMPLETE thought
3. Integrate brand name "${brand}" naturally
4. Do NOT just add brand name at the end
5. Connect to the story's theme
6. Make it organic, not forced
7. NO meta-commentary

Examples of GOOD brand beats:
"For the moments that matter most. With Nike."
"Designed for those who don't just watch. Adidas."
"Built to last through every chapter. Levi's."

Examples of BAD brand beats:
"Nike" (just brand name)
"With Nike" (incomplete thought)
"This story is about Nike" (explanatory)`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 60,
      });

      const content = response.choices[0].message.content;
      if (!content || content.trim().length < 5) {
        console.log("[XO] No brand beat earned");
        return [];
      }

      console.log("[XO] Pass 4 output:", content);

      // Clean and validate the brand beat
      const brandBeat = this.cleanBrandBeat(content, brand);
      if (!brandBeat) {
        console.log("[XO] Brand beat validation failed");
        return [];
      }

      return [{
        lines: brandBeat,
        type: "brand" as const,
        sourcePass: 4,
      }];
    } catch (error) {
      console.error("[XO] Pass 4 error:", error);
      return [];
    }
  }

  private static extractTheme(allBeats: MicroStoryBeat[]): string {
    const allText = allBeats
      .map(beat => beat.lines.join(" "))
      .join(" ")
      .toLowerCase();
    
    if (allText.includes("together") || allText.includes("connection") || allText.includes("share")) {
      return "connection";
    } else if (allText.includes("effort") || allText.includes("work") || allText.includes("try")) {
      return "effort";
    } else if (allText.includes("moment") || allText.includes("time") || allText.includes("present")) {
      return "presence";
    } else if (allText.includes("change") || allText.includes("new") || allText.includes("begin")) {
      return "transformation";
    } else if (allText.includes("quiet") || allText.includes("silence") || allText.includes("still")) {
      return "stillness";
    } else {
      return "human experience";
    }
  }

  private static cleanBrandBeat(content: string, brand: string): string[] | null {
    const cleaned = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        const lowerLine = line.toLowerCase();
        return !(
          lowerLine.includes('total beats') ||
          lowerLine.includes('beats total') ||
          lowerLine.includes('total:') ||
          /\(\d+\s+beats/.test(lowerLine) ||
          lowerLine.includes('brand beat:') ||
          lowerLine.includes('beat:') ||
          lowerLine.includes('type:')
        );
      })
      .join('\n')
      .trim();

    const paragraphs = cleaned.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    if (paragraphs.length === 0) {
      return null;
    }

    const lines = paragraphs[0]
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 2);

    if (lines.length === 0) {
      return null;
    }

    // Validate brand inclusion
    const beatText = lines.join(" ").toLowerCase();
    const brandLower = brand.toLowerCase();
    
    if (!beatText.includes(brandLower)) {
      console.log(`[XO] Brand beat doesn't contain brand name: "${beatText}"`);
      return null;
    }

    // Must be a complete thought
    if (beatText.split(" ").length < 3) {
      console.log(`[XO] Brand beat too short: "${beatText}"`);
      return null;
    }

    // Check natural integration
    const words = beatText.split(" ");
    const brandPosition = words.findIndex(word => word.includes(brandLower));
    
    // Don't allow brand to be just tacked on at the end
    if (brandPosition === words.length - 1 && words.length <= 4) {
      console.log(`[XO] Brand name just tacked on: "${beatText}"`);
      return null;
    }

    return lines;
  }

  private static buildPrompt(
    storyText: string,
    brand: string,
    theme: string,
    scaffold: NarrativeScaffold,
    constraints?: MarketConstraints,
  ): string {
    let prompt = `Story:\n${storyText}\n\n`;
    prompt += `Create ONE final brand-aligned beat for ${brand}.\n`;
    prompt += `Story theme: ${theme}\n`;
    prompt += `Brand: ${brand}\n\n`;
    
    if (scaffold.market !== "GLOBAL") {
      prompt += `Market: ${scaffold.market}\n`;
    }

    if (constraints?.culturalContext) {
      prompt += `Cultural Context: ${constraints.culturalContext}\n`;
    }

    prompt += `\nIMPORTANT:`;
    prompt += `\n1. Integrate "${brand}" NATURALLY into the beat`;
    prompt += `\n2. Make it a COMPLETE thought (1-2 lines)`;
    prompt += `\n3. Connect to the story's theme`;
    prompt += `\n4. This is the LAST beat of the story`;
    prompt += `\n5. Do NOT use brand as a separate line`;

    return prompt;
  }
}

// ============================================================================
// COMPRESSION ENGINE (3-8 beats)
// ============================================================================

export class CompressionEngine {
  static async enforce(
    allBeats: MicroStoryBeat[],
    scaffold: NarrativeScaffold,
    constraints?: MarketConstraints,
    hasBrand?: boolean
  ): Promise<MicroStory> {
    const MIN_BEATS = 3;
    const MAX_BEATS = 8;
    
    console.log(`[XO] Compression: ${allBeats.length} beats, hasBrand=${hasBrand}`);
    
    // Sort by source pass
    const sortedBeats = [...allBeats].sort((a, b) => (a.sourcePass || 0) - (b.sourcePass || 0));
    
    // Count by type
    const livedMoments = sortedBeats.filter(b => b.type === "lived-moment");
    const progression = sortedBeats.filter(b => b.type === "progression");
    const meaning = sortedBeats.filter(b => b.type === "meaning");
    const brand = sortedBeats.filter(b => b.type === "brand");
    
    // Build optimized structure
    const optimizedBeats: MicroStoryBeat[] = [];
    
    // Add lived moments (3-4)
    const livedToTake = Math.min(Math.max(livedMoments.length, 3), 4);
    optimizedBeats.push(...livedMoments.slice(0, livedToTake));
    
    // Add progression (2-3)
    const progToTake = Math.min(Math.max(progression.length, 2), 3);
    optimizedBeats.push(...progression.slice(0, progToTake));
    
    // Add meaning if room (0-2)
    const currentCount = optimizedBeats.length;
    const availableSlots = MAX_BEATS - currentCount - (hasBrand ? 1 : 0);
    if (availableSlots > 0 && meaning.length > 0) {
      const meaningToTake = Math.min(meaning.length, Math.min(availableSlots, 2));
      optimizedBeats.push(...meaning.slice(0, meaningToTake));
    }
    
    // Add brand as LAST if present (0-1)
    const hasBrandBeat = brand.length > 0 && hasBrand;
    if (hasBrandBeat && optimizedBeats.length < MAX_BEATS) {
      optimizedBeats.push(...brand.slice(0, 1));
    }
    
    // Ensure minimum beats
    while (optimizedBeats.length < MIN_BEATS) {
      optimizedBeats.push({
        lines: ["A moment unfolds."],
        type: "lived-moment"
      });
    }
    
    // Ensure maximum beats
    if (optimizedBeats.length > MAX_BEATS) {
      optimizedBeats.length = MAX_BEATS;
    }
    
    // Ensure brand is last
    if (hasBrandBeat) {
      const brandIndex = optimizedBeats.findIndex(b => b.type === "brand");
      if (brandIndex !== -1 && brandIndex !== optimizedBeats.length - 1) {
        const brandBeat = optimizedBeats.splice(brandIndex, 1)[0];
        optimizedBeats.push(brandBeat);
      }
    }
    
    console.log(`[XO] Optimized to ${optimizedBeats.length} beats`, {
      lived: optimizedBeats.filter(b => b.type === "lived-moment").length,
      progression: optimizedBeats.filter(b => b.type === "progression").length,
      meaning: optimizedBeats.filter(b => b.type === "meaning").length,
      brand: optimizedBeats.filter(b => b.type === "brand").length
    });
    
    // Create microstory
    const microStory: MicroStory = {
      beats: optimizedBeats,
      market: scaffold.market,
      hasBrand: hasBrandBeat,
    };
    
    // Validate
    const validation = MicroStoryValidator.validate(microStory);
    if (validation.valid) {
      return microStory;
    }
    
    // If invalid, generate clean version
    console.log("[XO] Validation failed:", validation.errors);
    return await this.generateCleanVersion(scaffold, constraints, hasBrand);
  }
  
  private static async generateCleanVersion(
    scaffold: NarrativeScaffold,
    constraints?: MarketConstraints,
    hasBrand?: boolean,
  ): Promise<MicroStory> {
    try {
      const targetBeats = hasBrand ? 7 : 6; // Leave room for brand if needed
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Generate a ${targetBeats}-beat micro-story. STRICT RULES:
1. ${targetBeats} beats total
2. Each beat: 1-3 lines
3. Structure: 3-4 lived moments, 2-3 progression, 0-2 meaning${hasBrand ? ', 1 brand' : ''}
4. Brand MUST be last if present
5. NO meta-commentary
6. Present tense
7. NO beat numbering or type labels`,
          },
          {
            role: "user",
            content: `Generate a ${targetBeats}-beat micro-story.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content");
      }

      const microStory = MicroStoryValidator.fromText(content);
      microStory.market = scaffold.market;
      microStory.hasBrand = hasBrand || false;
      
      // Assign types based on position
      this.assignTypes(microStory, hasBrand);
      
      return microStory;
    } catch (error) {
      console.error("[XO] Clean version error:", error);
      return this.createGuaranteedStory(scaffold.market, hasBrand);
    }
  }

  private static assignTypes(microStory: MicroStory, hasBrand?: boolean) {
    const totalBeats = microStory.beats.length;
    const brandIndex = hasBrand ? totalBeats - 1 : -1;
    
    for (let i = 0; i < totalBeats; i++) {
      if (i === brandIndex) {
        microStory.beats[i].type = "brand";
      } else if (i < 3) {
        microStory.beats[i].type = "lived-moment";
      } else if (i < 5) {
        microStory.beats[i].type = "progression";
      } else {
        microStory.beats[i].type = "meaning";
      }
    }
  }

  static createGuaranteedStory(
    market: MarketType = "GLOBAL",
    hasBrand?: boolean
  ): MicroStory {
    const beats: MicroStoryBeat[] = [
      { lines: ["The notification arrives."], type: "lived-moment" },
      { lines: ["Eyes watch the screen."], type: "lived-moment" },
      { lines: ["A breath is held.", "Then released."], type: "lived-moment" },
      { lines: ["Silence fills the room."], type: "progression" },
      { lines: ["The light changes.", "Shadows shift."], type: "progression" },
      { lines: ["Connection matters."], type: "meaning" },
    ];
    
    if (hasBrand) {
      beats.push({ lines: ["For moments that matter. Brand."], type: "brand" });
    }
    
    return {
      beats,
      market,
      hasBrand: hasBrand || false,
    };
  }
}

// ============================================================================
// MAIN XO NARRATIVE ENGINE
// ============================================================================

export class XONarrativeEngine {
  static async generate(
    userInput: string,
    market: MarketType = "GLOBAL",
    frontendBrand?: string,
  ): Promise<MicroStory> {
    console.log(`[XO] Starting generation: "${userInput.substring(0, 50)}..."`);
    
    try {
      // Normalize input and extract brand
      const { normalizedInput, entryForm, extractedBrand } = 
        IntentNormalizer.normalize(userInput, market);
      
      // Determine effective brand
      let effectiveBrand: string | undefined = undefined;
      let hasDistinctBrand = false;
      
      if (frontendBrand && frontendBrand.trim() !== '') {
        // Check if frontend brand is a distinct brand
        if (BrandValidator.isDistinctBrand(frontendBrand)) {
          effectiveBrand = frontendBrand.trim();
          hasDistinctBrand = true;
          console.log(`[XO] Using distinct frontend brand: "${effectiveBrand}"`);
        }
      } else if (extractedBrand) {
        // Check if extracted brand is a distinct brand
        if (BrandValidator.isDistinctBrand(extractedBrand)) {
          effectiveBrand = extractedBrand;
          hasDistinctBrand = true;
          console.log(`[XO] Using distinct extracted brand: "${effectiveBrand}"`);
        }
      }
      
      if (!hasDistinctBrand) {
        console.log(`[XO] No distinct brand found, will generate brandless story`);
      }

      // Create context
      const context: PipelineContext = {
        market,
        brand: effectiveBrand,
        extractedBrand,
        entryForm,
        userInput: normalizedInput,
      };

      // Generate constraints
      const constraints = await MarketConstraintGenerator.generate(market);
      context.constraints = constraints;

      // Generate scaffold
      const scaffold = NarrativeScaffoldGenerator.generate(context);

      // Pass 1: Lived moments (3-4 beats)
      console.log("[XO] Pass 1: Lived moments");
      const livedMoments = await LivedMomentEngine.generate(
        normalizedInput,
        scaffold,
        constraints,
      );

      // Pass 2: Progression (2-3 beats)
      console.log("[XO] Pass 2: Progression");
      const progression = await ProgressionEngine.generate(
        livedMoments,
        scaffold,
        constraints,
      );

      // Combine
      let allBeats: MicroStoryBeat[] = [...livedMoments, ...progression];

      // Pass 3: Meaning (0-2 beats) - based on brand status
      console.log("[XO] Pass 3: Meaning");
      const meaning = await MeaningExtractionEngine.generate(
        livedMoments,
        progression,
        scaffold,
        constraints,
        hasDistinctBrand
      );
      if (meaning.length > 0) {
        allBeats = [...allBeats, ...meaning];
      }

      // Pass 4: Brand (0-1 beat, LAST) - ONLY IF DISTINCT BRAND
      if (hasDistinctBrand && effectiveBrand) {
        console.log(`[XO] Pass 4: Brand for "${effectiveBrand}"`);
        const brandBeats = await BrandAlignmentEngine.generate(
          allBeats,
          effectiveBrand,
          scaffold,
          constraints,
        );
        if (brandBeats.length > 0) {
          allBeats = [...allBeats, ...brandBeats];
          console.log(`[XO] Brand beat added: "${brandBeats[0].lines.join(" ")}"`);
        } else {
          console.log("[XO] No brand beat earned - proceeding brandless");
          hasDistinctBrand = false; // Revert to brandless
        }
      }

      // Pass 5: Compression (ENFORCE 3-8 beats)
      console.log("[XO] Pass 5: Compression");
      const microStory = await CompressionEngine.enforce(
        allBeats,
        scaffold,
        constraints,
        hasDistinctBrand
      );

      // Set brand properties - ONLY if we actually have a brand beat
      const hasBrandBeat = microStory.beats.some(beat => beat.type === "brand");
      microStory.hasBrand = hasBrandBeat;
      
      if (hasBrandBeat) {
        microStory.frontendBrand = frontendBrand;
        microStory.extractedBrand = extractedBrand;
        console.log(`[XO] Story has brand beat: ${microStory.beats[microStory.beats.length - 1].lines.join(" ")}`);
      } else {
        microStory.hasBrand = false;
        microStory.frontendBrand = undefined;
        microStory.extractedBrand = undefined;
        console.log(`[XO] Story has NO brand beat`);
      }

      // Final validation
      const validation = MicroStoryValidator.validate(microStory);
      if (!validation.valid) {
        console.error("[XO] Final validation failed:", validation.errors);
        const fallback = CompressionEngine.createGuaranteedStory(market, hasBrandBeat);
        fallback.hasBrand = hasBrandBeat;
        if (hasBrandBeat) {
          fallback.frontendBrand = frontendBrand;
          fallback.extractedBrand = extractedBrand;
        }
        return fallback;
      }

      console.log("[XO] Generation complete:", {
        beats: microStory.beats.length,
        hasBrand: microStory.hasBrand,
        brandName: effectiveBrand
      });

      return microStory;
    } catch (error) {
      console.error("[XO] Generation error:", error);
      const fallback = CompressionEngine.createGuaranteedStory(market, false);
      fallback.hasBrand = false;
      return fallback;
    }
  }

  static async refine(
    microStory: MicroStory,
    refinement: "expand" | "gentler" | "harsher",
  ): Promise<MicroStory> {
    console.log(`[XO] Refining: ${refinement}`);
    
    // For now, just return the original with compression
    const constraints = await MarketConstraintGenerator.generate(microStory.market || "GLOBAL");
    const scaffold: NarrativeScaffold = {
      pass_1: "3-4 lived-moment beats",
      pass_2: "2-3 progression beats",
      pass_3: "0-2 meaning beats",
      pass_4: microStory.hasBrand ? "1 brand beat (LAST)" : "No brand beat",
      market: microStory.market,
    };
    
    return await CompressionEngine.enforce(microStory.beats, scaffold, constraints, microStory.hasBrand);
  }
}

// ============================================================================
// INTEGRATION FUNCTION
// ============================================================================

export async function generateXOStory(
  userInput: string,
  market: MarketType = "GLOBAL",
  brand?: string,
  meaningContract?: any,
) {
  try {
    const microStory = await XONarrativeEngine.generate(
      userInput,
      market,
      brand,
    );

    // Determine brand status - ONLY if we actually have a brand beat
    const hasBrandBeat = microStory.beats.some(beat => beat.type === "brand");
    
    // Clean beats
    const cleanedBeats = microStory.beats.map(beat => ({
      ...beat,
      lines: beat.lines.filter(line => {
        const lowerLine = line.toLowerCase();
        return !(
          lowerLine.includes('total beats') ||
          lowerLine.includes('beats total') ||
          lowerLine.includes('total:') ||
          /\(\d+\s+beats/.test(lowerLine) ||
          lowerLine.includes('beat:') ||
          lowerLine.includes('type:')
        );
      })
    })).filter(beat => beat.lines.length > 0);

    // Create beat sheet
    const beatSheet = cleanedBeats.map((beat, index) => ({
      beat: `Beat ${index + 1}`,
      description: beat.lines.join(" "),
      visualCues: extractVisualCues(beat.lines),
      emotion: inferEmotion(beat),
      characterAction: inferAction(beat.lines),
      type: beat.type
    }));

    // Create story text
    const storyText = cleanedBeats
      .map((beat) => beat.lines.join("\n"))
      .join("\n\n");

    // Determine brand name
    const effectiveBrand = hasBrandBeat ? (brand || microStory.extractedBrand) : undefined;

    return {
      success: true,
      story: storyText,
      beatSheet,
      metadata: {
        emotionalState: inferOverallEmotion({ beats: cleanedBeats }),
        narrativeTension: "contrast and progression",
        intentCategory: "share",
        coreTheme: extractTheme({ beats: cleanedBeats }),
        wordCount: countWords({ beats: cleanedBeats }),
        isBrandStory: hasBrandBeat,
        brandName: effectiveBrand,
        template: "micro-story",
        lineCount: cleanedBeats.reduce((sum, beat) => sum + beat.lines.length, 0),
        market: microStory.market,
        totalBeats: cleanedBeats.length,
        estimatedDuration: `${Math.max(3, cleanedBeats.length) * 3}s`,
        frontendBrand: hasBrandBeat ? brand : undefined,
        extractedBrand: hasBrandBeat ? microStory.extractedBrand : undefined,
      },
      microStory: {
        ...microStory,
        beats: cleanedBeats
      },
    };
  } catch (error) {
    console.error("XO Narrative Engine error:", error);
    
    // Guaranteed fallback (6-7 beats, no brand)
    const fallbackStory = CompressionEngine.createGuaranteedStory(market, false);
    const fallbackBeats = fallbackStory.beats;
    
    return {
      success: false,
      story: fallbackBeats.map(beat => beat.lines.join("\n")).join("\n\n"),
      beatSheet: fallbackBeats.map((beat, index) => ({
        beat: `Beat ${index + 1}`,
        description: beat.lines.join(" "),
        visualCues: extractVisualCues(beat.lines),
        emotion: inferEmotion(beat),
        characterAction: inferAction(beat.lines),
        type: beat.type
      })),
      metadata: {
        emotionalState: "neutral",
        narrativeTension: "simple",
        intentCategory: "share",
        coreTheme: "human experience",
        wordCount: countWords({ beats: fallbackBeats }),
        isBrandStory: false,
        brandName: undefined,
        template: "micro-story",
        lineCount: fallbackBeats.reduce((sum, beat) => sum + beat.lines.length, 0),
        market: market,
        totalBeats: fallbackBeats.length,
        estimatedDuration: `${Math.max(3, fallbackBeats.length) * 3}s`,
        frontendBrand: undefined,
        extractedBrand: undefined,
      },
      microStory: fallbackStory,
    };
  }
}

// Helper functions (updated for 8-beat structure)
function extractVisualCues(lines: string[]): string[] {
  const cues: string[] = [];
  lines.forEach((line) => {
    const visualWords = line.match(
      /\b(shirt|boots|pitch|pub|generator|radio|email|screen|keyboard|cursor|map|dot|hand|mouse|light|shadow|window|door|machine|cloth)\b/gi,
    );
    if (visualWords) {
      visualWords.forEach((word) => {
        const lowerWord = word.toLowerCase();
        if (!cues.includes(lowerWord)) {
          cues.push(lowerWord);
        }
      });
    }
  });
  return cues.length > 0 ? cues : ["scene"];
}

function inferEmotion(beat: MicroStoryBeat): string {
  const text = beat.lines.join(" ").toLowerCase();
  if (beat.type === "meaning") return "reflection";
  if (beat.type === "brand") return "connection";
  if (text.includes("stretched") || text.includes("pull") || text.includes("tension"))
    return "tension";
  if (text.includes("quiet") || text.includes("silence") || text.includes("nobody"))
    return "anticipation";
  if (text.includes("release") || text.includes("soft") || text.includes("gentle"))
    return "relief";
  return "neutral";
}

function inferAction(lines: string[]): string {
  const text = lines.join(" ").toLowerCase();
  if (text.includes("put on") || text.includes("wear") || text.includes("reach"))
    return "dressing";
  if (text.includes("pull") || text.includes("stretch") || text.includes("tap"))
    return "adjusting";
  if (text.includes("watch") || text.includes("look") || text.includes("read"))
    return "observing";
  if (text.includes("walk") || text.includes("move") || text.includes("step"))
    return "moving";
  return "present";
}

function inferOverallEmotion(microStory: { beats: MicroStoryBeat[] }): string {
  const allText = microStory.beats
    .map((b) => b.lines.join(" "))
    .join(" ")
    .toLowerCase();
  if (allText.includes("still") && allText.includes("after"))
    return "resilience";
  if (allText.includes("same") && allText.includes("again")) return "ritual";
  if (allText.includes("matter") || allText.includes("belonging"))
    return "meaning";
  if (allText.includes("change") || allText.includes("transform"))
    return "transformation";
  return "complex";
}

function extractTheme(microStory: { beats: MicroStoryBeat[] }): string {
  const meaningBeats = microStory.beats.filter((b) => b.type === "meaning");
  if (meaningBeats.length > 0) {
    return meaningBeats[0].lines.join(" ");
  }
  return "human experience";
}

function countWords(microStory: { beats: MicroStoryBeat[] }): number {
  return microStory.beats.reduce((total, beat) => {
    return total + beat.lines.join(" ").split(/\s+/).length;
  }, 0);
}