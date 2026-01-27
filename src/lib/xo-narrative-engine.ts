import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ============================================================================
// EPIC 0: NARRATIVE OUTPUT CONTRACT (MICRO-STORY NATIVE)
// ============================================================================

export interface MicroStoryBeat {
  lines: string[]; // 1-2 lines max per beat
  type: "lived-moment" | "progression" | "meaning" | "brand";
  sourcePass?: number; // Track which pass generated this beat
}

export interface MicroStory {
  beats: MicroStoryBeat[];
  market?: "GLOBAL" | "NG" | "UK";
  hasBrand?: boolean;
  extractedBrand?: string; // Brand extracted from user input
  frontendBrand?: string; // Brand provided from frontend
}

// Validator for micro-story format - STRICT VERSION
export class MicroStoryValidator {
  static validate(microStory: MicroStory): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // XO-000: Enforce beat structure
    if (microStory.beats.length < 3) {
      errors.push(
        `Output fails if fewer than 3 beats (got ${microStory.beats.length})`,
      );
    }

    // XO-000: Max 8 beats total (lived + progression + meaning + brand)
    if (microStory.beats.length > 8) {
      errors.push(
        `Output fails if more than 8 beats (got ${microStory.beats.length})`,
      );
    }

    // Check for meta-commentary
    for (let i = 0; i < microStory.beats.length; i++) {
      const beat = microStory.beats[i];
      for (const line of beat.lines) {
        if (line.toLowerCase().includes("total beats") ||
            line.toLowerCase().includes("beats total") ||
            line.toLowerCase().includes("total:") ||
            /\(\d+\s+beats/.test(line.toLowerCase())) {
          errors.push(`Beat ${i+1} contains meta-commentary: "${line.substring(0, 50)}..."`);
        }
      }
    }

    // Count beats by type to validate structure
    const livedMoments = microStory.beats.filter(
      (b) => b.type === "lived-moment",
    ).length;
    const progression = microStory.beats.filter(
      (b) => b.type === "progression",
    ).length;
    const meaning = microStory.beats.filter((b) => b.type === "meaning").length;
    const brand = microStory.beats.filter((b) => b.type === "brand").length;

    // Validate pass structure (flexible but within limits)
    if (livedMoments < 2) {
      errors.push(
        `Must have at least 2 lived-moment beats (got ${livedMoments})`,
      );
    }

    if (livedMoments > 4) {
      errors.push(
        `Max 4 lived-moment beats allowed (got ${livedMoments})`,
      );
    }

    if (progression < 2) {
      errors.push(
        `Must have at least 2 progression beats (got ${progression})`,
      );
    }

    if (progression > 3) {
      errors.push(
        `Max 3 progression beats allowed (got ${progression})`,
      );
    }

    if (meaning < 1) {
      errors.push(`Must have at least 1 meaning beat (got ${meaning})`);
    }

    if (meaning > 2) {
      errors.push(`Max 2 meaning beats allowed (got ${meaning})`);
    }

    if (brand > 1) {
      errors.push(`Max 1 brand beat allowed (got ${brand})`);
    }

    // Brand should be ≤25% of total beats
    if (brand > 0) {
      const brandPercentage = brand / microStory.beats.length;
      if (brandPercentage > 0.25) {
        errors.push(
          `Brand beat is ${Math.round(brandPercentage * 100)}% of story (>25% max)`,
        );
      }

      // Brand should be the last beat
      const lastBeatType = microStory.beats[microStory.beats.length - 1]?.type;
      if (lastBeatType !== "brand") {
        errors.push("Brand beat must be the last beat in the story");
      }
    }

    // Validate individual beats
    for (let i = 0; i < microStory.beats.length; i++) {
      const beat = microStory.beats[i];
      
      // Check line count per beat
      if (beat.lines.length === 0 || beat.lines.length > 2) {
        errors.push(`Beat ${i+1} has ${beat.lines.length} lines (must be 1-2)`);
      }

      // Check line length and content
      for (let j = 0; j < beat.lines.length; j++) {
        const line = beat.lines[j];
        if (line.length > 120) {
          errors.push(`Beat ${i+1}, Line ${j+1} too long: "${line.substring(0, 50)}..."`);
        }

        // Detect paragraphs
        const sentenceCount = (line.match(/[.!?]+/g) || []).length;
        if (sentenceCount > 2) {
          errors.push(
            `Beat ${i+1}, Line ${j+1} has ${sentenceCount} sentences (max 2): "${line.substring(0, 50)}..."`,
          );
        }

        // Check for prose connectors
        const proseConnectors = [
          "and then",
          "after that",
          "next",
          "later",
          "meanwhile",
        ];
        if (proseConnectors.some((connector) =>
            line.toLowerCase().includes(connector))) {
          errors.push(`Beat ${i+1}, Line ${j+1} has prose connective tissue: "${line.substring(0, 50)}..."`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static fromText(text: string): MicroStory {
    // Clean text first - remove any meta-commentary
    const cleanedText = text
      .split('\n')
      .filter(line => {
        const lowerLine = line.toLowerCase().trim();
        return !(
          lowerLine.includes('total beats') ||
          lowerLine.includes('beats total') ||
          lowerLine.includes('total:') ||
          /\(\d+\s+beats/.test(lowerLine)
        );
      })
      .join('\n');

    // Convert text to beats
    const paragraphs = cleanedText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const beats: MicroStoryBeat[] = [];

    for (const paragraph of paragraphs) {
      const lines = paragraph
        .split("\n")
        .map(line => line.trim())
        .filter((line) => {
          const lowerLine = line.toLowerCase();
          return (
            line.trim().length > 0 &&
            !lowerLine.includes('total beats') &&
            !lowerLine.includes('beats total') &&
            !lowerLine.includes('total:') &&
            !/\(\d+\s+beats/.test(lowerLine)
          );
        });

      // Group into beats of 1-2 lines
      for (let i = 0; i < lines.length; i += 2) {
        const beatLines = lines.slice(i, i + 2);
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
// EPIC 1: MULTI-PASS NARRATIVE PIPELINE
// ============================================================================

export interface NarrativeScaffold {
  pass_1: string;
  pass_2: string;
  pass_3: string;
  pass_4: string;
  market?: "GLOBAL" | "NG" | "UK";
  entryForm?: "declarative" | "scene-like" | "audience-like" | "directive";
}

export interface PipelineContext {
  market: "GLOBAL" | "NG" | "UK";
  brand?: string; // Frontend brand takes priority
  extractedBrand?: string; // Extracted from user input
  entryForm: "declarative" | "scene-like" | "audience-like" | "directive";
  userInput: string;
  constraints?: MarketConstraints;
}

export interface MarketConstraints {
  culturalContext?: string; // Generated context description
  registerGuidance?: string; // Language style guidance
  avoidClichés?: string[]; // Market-specific clichés to avoid
}

// BRAND EXTRACTION HELPER
export class BrandExtractor {
  static extractFromInput(userInput: string): string | null {
    const lowerInput = userInput.toLowerCase();
    
    // Common patterns for brand mentions
    const brandPatterns = [
      // Pattern: "sell [a] [brand] [product]"
      /(?:sell|market|promote|advertise)\s+(?:an?|the)?\s+([A-Z][a-z]+)\s+(?:shoe|product|item|goods|item|merchandise)/i,
      
      // Pattern: "brand called [Name]"
      /(?:brand|called|named)\s+["']?([A-Z][a-zA-Z0-9&]+)["']?/i,
      
      // Pattern: "[Brand] shoes/products"
      /\b(adidas|nike|puma|reebok|converse|vans|under armour|asics|new balance)\b/i,
      
      // Pattern: "my brand [Name]"
      /my\s+(?:brand|company)\s+["']?([A-Z][a-zA-Z0-9&\s]+)["']?/i,
      
      // Pattern: "Maxing" (from your example)
      /\b(maxing|maxxing)\b/i,
    ];
    
    for (const pattern of brandPatterns) {
      const match = userInput.match(pattern);
      if (match) {
        // Extract brand name - prioritize capture groups, fallback to full match
        let brandName = match[1] || match[0];
        brandName = brandName.trim();
        
        // Capitalize first letter if needed
        if (brandName && brandName.length > 0) {
          brandName = brandName.charAt(0).toUpperCase() + brandName.slice(1);
        }
        
        console.log(`[XO] Extracted brand from input: "${brandName}" using pattern: ${pattern}`);
        return brandName;
      }
    }
    
    return null;
  }
  
  // Check if input has brand context
  static hasBrandContext(userInput: string): boolean {
    const brandKeywords = [
      'brand', 'company', 'business', 'product', 'sell', 'market',
      'promote', 'advertise', 'campaign', 'marketing', 'retail'
    ];
    
    const lowerInput = userInput.toLowerCase();
    return brandKeywords.some(keyword => lowerInput.includes(keyword));
  }
}

// XO-101: Intent Normalizer
export class IntentNormalizer {
  static normalize(
    input: string,
    market: "GLOBAL" | "NG" | "UK",
  ): {
    normalizedInput: string;
    entryForm: "declarative" | "scene-like" | "audience-like" | "directive";
    extractedBrand?: string;
  } {
    const trimmedInput = input.trim();
    
    // Extract brand first
    const extractedBrand = BrandExtractor.extractFromInput(trimmedInput);
    
    // Determine entry form based on syntactic structure
    let entryForm: "declarative" | "scene-like" | "audience-like" | "directive" = "declarative";
    
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
    
    // Simple normalization - just clean up whitespace
    let normalizedInput = trimmedInput
      .replace(/\s+/g, ' ')
      .trim();

    return { normalizedInput, entryForm, extractedBrand };
  }
}

// XO-102: Narrative Scaffold Generator
export class NarrativeScaffoldGenerator {
  static generate(context: PipelineContext): NarrativeScaffold {
    const hasBrand = !!context.brand || !!context.extractedBrand;
    
    const baseScaffold: NarrativeScaffold = {
      pass_1: "2–4 lived-moment beats",
      pass_2: "2–3 progression beats",
      pass_3: "1–2 meaning beats",
      pass_4: hasBrand ? "0–1 brand beat" : "No brand (skip)",
      market: context.market,
      entryForm: context.entryForm,
    };

    console.log("[XO] Scaffold generated:", baseScaffold);
    return baseScaffold;
  }
}

// XO-201: Automated Market Constraint Generator
export class MarketConstraintGenerator {
  static async generate(market: "GLOBAL" | "NG" | "UK"): Promise<MarketConstraints> {
    try {
      const systemPrompt = `You are a cultural consultant for narrative generation.
Generate appropriate constraints for the specified market.
Focus on general cultural context and language style, NOT specific phrases or clichés.`;

      const userPrompt = `Generate market constraints for ${market} market.
Provide:
1. Cultural context (1-2 sentences about authentic settings/behaviors)
2. Register guidance (language style/tone)
3. Things to avoid (general categories, not specific phrases)

Format as a concise, actionable guide.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 150,
      });

      const content = response.choices[0].message.content || "";
      
      // Parse the response into structured constraints
      return this.parseConstraints(content, market);
      
    } catch (error) {
      console.error("[XO] Error generating market constraints:", error);
      return this.getFallbackConstraints(market);
    }
  }

  private static parseConstraints(content: string, market: "GLOBAL" | "NG" | "UK"): MarketConstraints {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    const constraints: MarketConstraints = {
      culturalContext: "",
      registerGuidance: "",
      avoidClichés: []
    };

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

    // Clean up
    if (constraints.culturalContext) {
      constraints.culturalContext = constraints.culturalContext.replace(/^Cultural Context\s*[:.-]\s*/i, '');
    }
    if (constraints.registerGuidance) {
      constraints.registerGuidance = constraints.registerGuidance.replace(/^Register Guidance\s*[:.-]\s*/i, '');
    }

    return constraints;
  }

  private static getFallbackConstraints(market: "GLOBAL" | "NG" | "UK"): MarketConstraints {
    switch (market) {
      case "NG":
        return {
          culturalContext: "Authentic Nigerian urban settings, communal activities, shared experiences in contemporary contexts.",
          registerGuidance: "Natural, authentic language that avoids forced pidgin or slang overload.",
          avoidClichés: ["poverty stereotypes", "tribal clichés", "exaggerated accents"]
        };
      case "UK":
        return {
          culturalContext: "Contemporary British life with understated settings, subtle social dynamics, and everyday moments.",
          registerGuidance: "Understated, dry tone that avoids obvious clichés or stiff stereotypes.",
          avoidClichés: ["royal family references", "football hooligan stereotypes", "stiff upper lip clichés"]
        };
      default:
        return {
          culturalContext: "Universal human experiences that transcend specific cultural boundaries.",
          registerGuidance: "Clear, accessible language that communicates human truth without cultural specificity.",
          avoidClichés: ["cultural stereotypes", "exoticization", "clichéd emotional labels"]
        };
    }
  }
}

// XO-103: Pass 1 - Lived Moment Engine
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
            content: `You generate ONLY lived-moment beats. STRICT RULES:
1. Generate EXACTLY 3-4 beats (no more, no less)
2. Each beat: 1-2 lines ONLY
3. Show behavior and sensation ONLY (what can be seen, heard, touched)
4. NO abstraction (no "feels", "thinks", "believes", "wants")
5. NO emotion labels (no "happy", "sad", "angry", "excited")
6. NO brand language
7. White space separates beats
8. NO connective tissue (no "and then", "after that", "next")
9. Present tense only
10. NO meta-commentary (no "Total beats:", "Beats:", etc.)

Example format (exactly like this):
The shirt is already on before breakfast.
Same one as last match.

By kickoff, it's stretched at the collar.
Pulled once.

Remember: ONLY lived moments. Show, don't tell. Return exactly 3-4 beats.`,
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
        console.error("[XO] No content generated for lived moments");
        return this.getConcreteFallbackBeats();
      }

      console.log("[XO] Pass 1 raw output:", content.substring(0, 200) + "...");

      // Parse beats from response
      const beats = this.parseBeats(content);
      console.log("[XO] Pass 1 parsed:", beats.length, "beats");

      // Validate
      const validation = this.validate(beats);
      if (!validation.valid) {
        console.log("[XO] Pass 1 validation failed:", validation.errors);
        return this.getConcreteFallbackBeats();
      }

      return beats.map((beat) => ({
        lines: beat.slice(0, 2),
        type: "lived-moment" as const,
        sourcePass: 1,
      }));
    } catch (error) {
      console.error("[XO] Pass 1 error:", error);
      return this.getConcreteFallbackBeats();
    }
  }

  private static buildPrompt(
    input: string,
    scaffold: NarrativeScaffold,
    constraints?: MarketConstraints,
  ): string {
    let prompt = `Generate EXACTLY 3-4 lived-moment beats for: "${input}"\n\n`;

    if (scaffold.market !== "GLOBAL") {
      prompt += `Market Context: ${scaffold.market}\n`;
    }

    if (constraints?.culturalContext) {
      prompt += `Cultural Setting: ${constraints.culturalContext}\n`;
    }

    if (constraints?.registerGuidance) {
      prompt += `Language Style: ${constraints.registerGuidance}\n`;
    }

    if (constraints?.avoidClichés && constraints.avoidClichés.length > 0) {
      prompt += `Avoid: ${constraints.avoidClichés.join(", ")}\n`;
    }

    prompt += `Entry form: ${scaffold.entryForm}\n`;
    prompt += `\nReturn EXACTLY 3-4 beats, separated by blank lines. Each beat 1-2 lines.`;
    prompt += `\nCRITICAL: NO meta-commentary (no "Total beats:", "Beats:", etc.)`;

    return prompt;
  }

  static parseBeats(content: string): string[][] {
    // Clean the content - remove meta-commentary
    const cleaned = content
      .split('\n')
      .filter(line => {
        const lowerLine = line.toLowerCase().trim();
        return !(
          lowerLine.includes('total beats') ||
          lowerLine.includes('beats total') ||
          lowerLine.includes('total:') ||
          /\(\d+\s+beats/.test(lowerLine)
        );
      })
      .join('\n')
      .trim();

    // Split by double newlines
    const paragraphs = cleaned
      .split(/\n\s*\n/)
      .filter((p) => p.trim().length > 0);
    
    const beats: string[][] = [];

    for (const paragraph of paragraphs) {
      const lines = paragraph
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => {
          const lowerLine = line.toLowerCase();
          return (
            line.length > 0 &&
            !lowerLine.includes('total beats') &&
            !lowerLine.includes('beats total') &&
            !lowerLine.includes('total:') &&
            !/\(\d+\s+beats/.test(lowerLine)
          );
        });

      if (lines.length > 0) {
        beats.push(lines.slice(0, 2));
      }
    }

    // Return exactly 3-4 beats
    if (beats.length > 4) {
      return beats.slice(0, 4);
    } else if (beats.length < 3) {
      const fallback = [["The screen lights up."], ["A hand reaches out."]];
      return [...beats, ...fallback.slice(0, 3 - beats.length)];
    }
    
    return beats;
  }

  private static validate(beats: string[][]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (beats.length < 3 || beats.length > 4) {
      errors.push(`Must have 3-4 beats, got ${beats.length}`);
    }

    for (const beat of beats) {
      if (beat.length === 0 || beat.length > 2) {
        errors.push(`Beat has ${beat.length} lines (must be 1-2)`);
      }

      for (const line of beat) {
        // Check for meta-commentary
        if (line.toLowerCase().includes('total beats') ||
            line.toLowerCase().includes('beats total') ||
            line.toLowerCase().includes('total:') ||
            /\(\d+\s+beats/.test(line.toLowerCase())) {
          errors.push(`Meta-commentary detected: "${line.substring(0, 30)}..."`);
        }

        // Check for abstraction
        const abstractionWords = [
          "feel", "think", "believe", "emotion", "want", "need", "desire",
        ];
        if (abstractionWords.some((word) => line.toLowerCase().includes(word))) {
          errors.push(`Abstraction detected: "${line.substring(0, 30)}..."`);
        }

        // Check for emotion labels
        const emotionWords = [
          "happy", "sad", "angry", "excited", "disappointed", "proud", "anxious",
        ];
        if (emotionWords.some((word) => line.toLowerCase().includes(word))) {
          errors.push(`Emotion label detected: "${line.substring(0, 30)}..."`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private static getConcreteFallbackBeats(): MicroStoryBeat[] {
    return [
      {
        lines: ["The screen lights up."],
        type: "lived-moment",
        sourcePass: 1,
      },
      {
        lines: ["A finger touches the glass."],
        type: "lived-moment",
        sourcePass: 1,
      },
      {
        lines: ["The sound of typing starts.", "Then stops."],
        type: "lived-moment",
        sourcePass: 1,
      },
    ];
  }
}

// XO-105: Pass 2 - Progression Engine
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
            content: `You show progression WITHOUT naming emotions. STRICT RULES:
1. Generate EXACTLY 2-3 beats (no more, no less)
2. Each beat: 1-2 lines ONLY
3. Show change, contrast, or temporal shift
4. NO emotion labels (show, don't tell)
5. NO brand language
6. Must follow from the lived moments
7. Present tense only
8. Show movement or change from first to last beat
9. NO meta-commentary (no "Total beats:", "Beats:", etc.)

Example format:
At halftime, nobody speaks.
Eyes stay on the screen.

When it ends, they sit back.
Not smiling.

Notice: Show change without naming emotions.`,
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
        console.error("[XO] No content generated for progression");
        return this.getConcreteFallbackBeats(livedMoments);
      }

      console.log("[XO] Pass 2 raw output:", content.substring(0, 150) + "...");

      const beats = LivedMomentEngine.parseBeats(content);
      const trimmedBeats = beats.length > 3 ? beats.slice(0, 3) : 
                          beats.length < 2 ? [...beats, ...this.getFallbackProgression()] : 
                          beats;
      
      console.log("[XO] Pass 2 parsed:", trimmedBeats.length, "beats");

      const validation = this.validate(trimmedBeats, livedMoments);
      if (!validation.valid) {
        console.log("[XO] Pass 2 validation failed:", validation.errors);
        return this.getConcreteFallbackBeats(livedMoments);
      }

      return trimmedBeats.map((beat) => ({
        lines: beat.slice(0, 2),
        type: "progression" as const,
        sourcePass: 2,
      }));
    } catch (error) {
      console.error("[XO] Pass 2 error:", error);
      return this.getConcreteFallbackBeats(livedMoments);
    }
  }

  private static buildPrompt(
    livedText: string,
    scaffold: NarrativeScaffold,
    constraints?: MarketConstraints,
  ): string {
    let prompt = `Continue with progression (show, don't tell):\n\n`;
    prompt += `Lived moments:\n${livedText}\n\n`;
    prompt += `Generate EXACTLY 2-3 progression beats that show change or contrast.\n`;
    
    if (scaffold.market !== "GLOBAL") {
      prompt += `Market: ${scaffold.market}\n`;
    }

    if (constraints?.culturalContext) {
      prompt += `Cultural Context: ${constraints.culturalContext}\n`;
    }

    if (constraints?.registerGuidance) {
      prompt += `Language Style: ${constraints.registerGuidance}\n`;
    }

    prompt += `Return ONLY the beats, separated by blank lines.\n`;
    prompt += `CRITICAL: NO meta-commentary (no "Total beats:", "Beats:", etc.)`;

    return prompt;
  }

  private static validate(
    progressionBeats: string[][],
    livedMoments: MicroStoryBeat[],
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (progressionBeats.length < 2 || progressionBeats.length > 3) {
      errors.push(`Must have 2-3 beats, got ${progressionBeats.length}`);
    }

    const emotionWords = [
      "happy", "sad", "angry", "excited", "disappointed", "proud", "feeling",
    ];
    for (const beat of progressionBeats) {
      for (const line of beat) {
        if (line.toLowerCase().includes('total beats') ||
            line.toLowerCase().includes('beats total') ||
            line.toLowerCase().includes('total:')) {
          errors.push(`Meta-commentary detected: "${line.substring(0, 30)}..."`);
        }

        if (emotionWords.some((word) => line.toLowerCase().includes(word))) {
          errors.push(`Emotion label detected: "${line.substring(0, 30)}..."`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private static getConcreteFallbackBeats(
    livedMoments: MicroStoryBeat[],
  ): MicroStoryBeat[] {
    return [
      {
        lines: ["They stay seated."],
        type: "progression",
        sourcePass: 2,
      },
      {
        lines: ["Nobody speaks.", "The silence continues."],
        type: "progression",
        sourcePass: 2,
      },
    ];
  }

  private static getFallbackProgression(): string[][] {
    return [["Time passes."], ["Things change."]];
  }
}

// XO-107: Pass 3 - Meaning Extraction Engine
export class MeaningExtractionEngine {
  static async generate(
    livedMoments: MicroStoryBeat[],
    progressionBeats: MicroStoryBeat[],
    scaffold: NarrativeScaffold,
    constraints?: MarketConstraints,
  ): Promise<MicroStoryBeat[]> {
    const allBeats = [...livedMoments, ...progressionBeats];
    const storyText = allBeats
      .map((beat) => beat.lines.join("\n"))
      .join("\n\n");
    const prompt = this.buildPrompt(storyText, scaffold, constraints);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You extract human meaning. STRICT RULES:
1. Generate EXACTLY 1-2 beats (no more, no less)
2. Each beat: 1-2 lines ONLY
3. ONE abstraction per beat max (truth, meaning, purpose, connection, etc.)
4. NO marketing or strategy language
5. Sound like human truth, not insight deck
6. Removing these beats should leave story intact
7. Present tense preferred
8. NO meta-commentary (no "Total beats:", "Beats:", etc.)

Example format:
Some things matter because you stayed for all of it.

Belonging doesn't need explaining.

Notice: Simple, human truth. Not explaining the story, just extending it.`,
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
      if (!content) {
        console.error("[XO] No content generated for meaning");
        return this.getConcreteFallbackBeats();
      }

      console.log("[XO] Pass 3 raw output:", content.substring(0, 100) + "...");

      const beats = LivedMomentEngine.parseBeats(content);
      const trimmedBeats = beats.length > 2 ? beats.slice(0, 2) : 
                          beats.length < 1 ? [["Showing up matters."]] : 
                          beats;
      
      console.log("[XO] Pass 3 parsed:", trimmedBeats.length, "beats");

      const validation = this.validate(trimmedBeats);
      if (!validation.valid) {
        console.log("[XO] Pass 3 validation failed:", validation.errors);
        return this.getConcreteFallbackBeats();
      }

      return trimmedBeats.map((beat) => ({
        lines: beat.slice(0, 2),
        type: "meaning" as const,
        sourcePass: 3,
      }));
    } catch (error) {
      console.error("[XO] Pass 3 error:", error);
      return this.getConcreteFallbackBeats();
    }
  }

  private static buildPrompt(
    storyText: string,
    scaffold: NarrativeScaffold,
    constraints?: MarketConstraints,
  ): string {
    let prompt = `Extract EXACTLY 1-2 meaning beats from this story:\n\n`;
    prompt += `${storyText}\n\n`;
    prompt += `Extract human truth (not marketing).\n`;
    
    if (scaffold.market !== "GLOBAL") {
      prompt += `Market: ${scaffold.market}\n`;
    }

    if (constraints?.culturalContext) {
      prompt += `Cultural Context: ${constraints.culturalContext}\n`;
    }

    prompt += `Return ONLY the meaning beats, separated by blank lines.\n`;
    prompt += `CRITICAL: NO meta-commentary (no "Total beats:", "Beats:", etc.)`;

    return prompt;
  }

  private static validate(meaningBeats: string[][]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (meaningBeats.length < 1 || meaningBeats.length > 2) {
      errors.push(`Must have 1-2 beats, got ${meaningBeats.length}`);
    }

    for (const beat of meaningBeats) {
      for (const line of beat) {
        if (line.toLowerCase().includes('total beats') ||
            line.toLowerCase().includes('beats total') ||
            line.toLowerCase().includes('total:')) {
          errors.push(`Meta-commentary detected: "${line.substring(0, 30)}..."`);
        }

        const marketingWords = [
          "brand", "campaign", "strategy", "target", "audience", "engagement", "marketing", "business",
        ];
        if (marketingWords.some((word) => line.toLowerCase().includes(word))) {
          errors.push(`Marketing language detected: "${line.substring(0, 30)}..."`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private static getConcreteFallbackBeats(): MicroStoryBeat[] {
    return [
      {
        lines: ["Showing up matters."],
        type: "meaning",
        sourcePass: 3,
      },
    ];
  }
}

// XO-108: Pass 4 - Brand Alignment Gate
export class BrandAlignmentEngine {
  static async generate(
    allBeats: MicroStoryBeat[],
    brand: string | undefined, // Can be from frontend or extracted
    scaffold: NarrativeScaffold,
    constraints?: MarketConstraints,
  ): Promise<MicroStoryBeat[]> {
    // Only proceed if we have a brand
    if (!brand || brand.trim() === '') {
      console.log("[XO] No brand provided, skipping brand alignment");
      return [];
    }
    
    const totalBeats = allBeats.length;
    if (totalBeats < 3) {
      console.log("[XO] Not enough beats to earn brand");
      return [];
    }

    if (totalBeats >= 8) {
      console.log("[XO] Story already has 8 beats, no room for brand");
      return [];
    }

    const storyText = allBeats
      .map((beat) => beat.lines.join("\n"))
      .join("\n\n");
    const prompt = this.buildPrompt(storyText, brand, scaffold, constraints);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You add ONE brand beat ONLY if earned. STRICT RULES:
1. MAX 1 beat only (or none if not earned)
2. Must follow meaning beats
3. Brand ≤25% of total beats
4. Removing brand beat leaves complete story
5. Brand does NOT explain or summarize
6. Beat should feel organic, not forced
7. Include brand name naturally
8. 1-2 lines only
9. NO meta-commentary (no "Total beats:", "Beats:", etc.)

Example format:
Made for effort, not excuses.
adidas

Or return nothing if not earned.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 40,
      });

      const content = response.choices[0].message.content;
      if (!content || content.trim().length < 5) {
        console.log("[XO] No brand beat earned");
        return [];
      }

      console.log("[XO] Pass 4 raw output:", content);

      const beats = LivedMomentEngine.parseBeats(content).slice(0, 1);

      const validation = this.validate(beats, allBeats, brand);
      if (!validation.valid) {
        console.log("[XO] Pass 4 validation failed:", validation.errors);
        return [];
      }

      console.log("[XO] Brand beat earned for:", brand);
      return beats.map((beat) => ({
        lines: beat.slice(0, 2),
        type: "brand" as const,
        sourcePass: 4,
      }));
    } catch (error) {
      console.error("[XO] Pass 4 error:", error);
      return [];
    }
  }

  private static buildPrompt(
    storyText: string,
    brand: string,
    scaffold: NarrativeScaffold,
    constraints?: MarketConstraints,
  ): string {
    let prompt = `Add ONE brand beat for ${brand} ONLY if earned:\n\n`;
    prompt += `${storyText}\n\n`;
    prompt += `Brand: ${brand}\n`;
    
    if (scaffold.market !== "GLOBAL") {
      prompt += `Market: ${scaffold.market}\n`;
    }

    if (constraints?.culturalContext) {
      prompt += `Cultural Context: ${constraints.culturalContext}\n`;
    }

    prompt += `Return ONE beat only (1-2 lines) or nothing if not earned.\n`;
    prompt += `CRITICAL: NO meta-commentary (no "Total beats:", "Beats:", etc.)`;

    return prompt;
  }

  private static validate(
    brandBeats: string[][],
    allBeats: MicroStoryBeat[],
    brand: string,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (brandBeats.length > 1) {
      errors.push("Max 1 brand beat allowed");
      return { valid: false, errors };
    }

    if (brandBeats.length === 0) {
      return { valid: true, errors: [] };
    }

    const brandBeat = brandBeats[0];
    const brandText = brandBeat.join(" ").toLowerCase();
    const brandName = brand.toLowerCase();

    if (brandText.includes('total beats') ||
        brandText.includes('beats total') ||
        brandText.includes('total:')) {
      errors.push("Meta-commentary detected in brand beat");
    }

    if (!brandText.includes(brandName)) {
      errors.push(`Brand "${brand}" not mentioned in brand beat`);
    }

    const explainingWords = [
      "because", "so that", "this shows", "means that", "which is why", "therefore",
    ];
    if (explainingWords.some((word) => brandText.includes(word))) {
      errors.push("Brand explains or summarizes the story");
    }

    const totalWithBrand = allBeats.length + 1;
    const brandPercentage = 1 / totalWithBrand;
    if (brandPercentage > 0.25) {
      errors.push(`Brand beat is ${Math.round(brandPercentage * 100)}% of story (>25% max)`);
    }

    return { valid: errors.length === 0, errors };
  }
}

// XO-109: Pass 5 - Compression & Micro-Story Enforcement
export class CompressionEngine {
  static async enforce(
    allBeats: MicroStoryBeat[],
    scaffold: NarrativeScaffold,
    constraints?: MarketConstraints,
  ): Promise<MicroStory> {
    const MAX_TOTAL_BEATS = 8;
    
    let trimmedBeats = [...allBeats];
    if (trimmedBeats.length > MAX_TOTAL_BEATS) {
      console.log(`[XO] Trimming ${trimmedBeats.length} beats to ${MAX_TOTAL_BEATS}`);
      
      const livedMoments = trimmedBeats.filter(b => b.type === "lived-moment");
      const progression = trimmedBeats.filter(b => b.type === "progression");
      const meaning = trimmedBeats.filter(b => b.type === "meaning");
      const brand = trimmedBeats.filter(b => b.type === "brand");
      
      let remainingSlots = MAX_TOTAL_BEATS;
      const result: MicroStoryBeat[] = [];
      
      const livedToAdd = Math.min(livedMoments.length, 4, remainingSlots);
      result.push(...livedMoments.slice(0, livedToAdd));
      remainingSlots -= livedToAdd;
      
      if (remainingSlots > 0) {
        const progToAdd = Math.min(progression.length, 3, remainingSlots);
        result.push(...progression.slice(0, progToAdd));
        remainingSlots -= progToAdd;
      }
      
      if (remainingSlots > 0) {
        const meaningToAdd = Math.min(meaning.length, 2, remainingSlots);
        result.push(...meaning.slice(0, meaningToAdd));
        remainingSlots -= meaningToAdd;
      }
      
      if (remainingSlots > 0 && brand.length > 0) {
        result.push(brand[0]);
      }
      
      trimmedBeats = result;
    }
    
    const storyText = trimmedBeats
      .map((beat) => beat.lines.join("\n"))
      .join("\n\n");

    try {
      const systemPrompt = `You format existing beats into proper micro-story structure. STRICT RULES:
1. PRESERVE the original narrative order
2. Format each beat as 1-2 lines, separated by blank lines
3. Remove any connective tissue ("and then", "after that")
4. ENSURE total beats are 3-8 (NEVER more than 8)
5. Keep the narrative progression intact
6. Format: beat line(s) then blank line
7. NEVER output more than 8 beats total
8. ABSOLUTELY NO meta-commentary (NO "Total beats:", "Beats:", "Beat count:", etc.)

CRITICAL: Output MUST have 3-8 beats total.
CRITICAL: NEVER include any mention of beats or counts in the output.`;

      let userPrompt = `Format these beats into a micro-story. MAINTAIN ORDER, ENSURE 3-8 BEATS TOTAL:\n\n${storyText}\n\nIMPORTANT: Output exactly 3-8 beats. NO meta-commentary.`;
      
      if (scaffold.market !== "GLOBAL") {
        userPrompt += `\nMarket: ${scaffold.market}`;
      }

      if (constraints?.culturalContext) {
        userPrompt += `\nCultural Context: ${constraints.culturalContext}`;
      }

      if (constraints?.registerGuidance) {
        userPrompt += `\nLanguage Style: ${constraints.registerGuidance}`;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content generated for compression");
      }

      console.log("[XO] Pass 5 raw output:", content.substring(0, 200) + "...");

      const microStory = MicroStoryValidator.fromText(content);
      microStory.market = scaffold.market;
      
      // Determine if there's a brand beat
      const hasBrandBeat = trimmedBeats.some((beat) => beat.type === "brand");
      microStory.hasBrand = hasBrandBeat;

      // SAFETY CHECK: Ensure we never exceed 8 beats
      if (microStory.beats.length > 8) {
        console.warn(`[XO] WARNING: Compression produced ${microStory.beats.length} beats, truncating to 8`);
        microStory.beats = microStory.beats.slice(0, 8);
      }

      // ENSURE MINIMUM 3 BEATS
      if (microStory.beats.length < 3) {
        console.warn(`[XO] WARNING: Only ${microStory.beats.length} beats, adding fallback beats`);
        const fallbackBeats: MicroStoryBeat[] = [
          { lines: ["The screen lights up."], type: "lived-moment" },
          { lines: ["Time passes."], type: "progression" },
          { lines: ["Moments matter."], type: "meaning" },
        ];
        microStory.beats = [...microStory.beats, ...fallbackBeats.slice(0, 3 - microStory.beats.length)];
      }

      // Clean any remaining meta-commentary
      microStory.beats = microStory.beats.map(beat => ({
        ...beat,
        lines: beat.lines.filter(line => {
          const lowerLine = line.toLowerCase();
          return !(
            lowerLine.includes('total beats') ||
            lowerLine.includes('beats total') ||
            lowerLine.includes('total:') ||
            /\(\d+\s+beats/.test(lowerLine)
          );
        })
      })).filter(beat => beat.lines.length > 0);

      // Assign types based on position
      this.assignTypesByPosition(microStory);

      // ENFORCE NARRATIVE ORDER
      this.enforceNarrativeOrder(microStory);

      // Final validation
      const validation = MicroStoryValidator.validate(microStory);
      if (!validation.valid) {
        console.log("[XO] Final validation failed:", validation.errors);
        return this.createGuaranteedValidStory(scaffold.market);
      }

      console.log("[XO] Compression successful:", microStory.beats.length, "beats");
      return microStory;
    } catch (error) {
      console.error("[XO] Pass 5 error:", error);
      return this.createGuaranteedValidStory(scaffold.market);
    }
  }

  private static assignTypesByPosition(microStory: MicroStory) {
    const totalBeats = microStory.beats.length;
    
    const livedCount = Math.max(2, Math.min(4, Math.floor(totalBeats * 0.4)));
    const progCount = Math.max(2, Math.min(3, Math.floor(totalBeats * 0.3)));
    const meaningCount = Math.max(1, Math.min(2, Math.floor(totalBeats * 0.2)));
    
    for (let i = 0; i < totalBeats; i++) {
      if (i < livedCount) {
        microStory.beats[i].type = "lived-moment";
      } else if (i < livedCount + progCount) {
        microStory.beats[i].type = "progression";
      } else if (i < livedCount + progCount + meaningCount) {
        microStory.beats[i].type = "meaning";
      } else {
        microStory.beats[i].type = "brand";
      }
    }
    
    if (!microStory.hasBrand && microStory.beats[totalBeats - 1].type === "brand") {
      microStory.beats[totalBeats - 1].type = "meaning";
    }
  }

  private static enforceNarrativeOrder(microStory: MicroStory) {
    const beats = microStory.beats;
    const totalBeats = beats.length;
    
    if (totalBeats < 3) return;
    
    const livedMoments: MicroStoryBeat[] = [];
    const progression: MicroStoryBeat[] = [];
    const meaning: MicroStoryBeat[] = [];
    const brand: MicroStoryBeat[] = [];
    
    for (const beat of beats) {
      switch (beat.type) {
        case "lived-moment": livedMoments.push(beat); break;
        case "progression": progression.push(beat); break;
        case "meaning": meaning.push(beat); break;
        case "brand": brand.push(beat); break;
      }
    }
    
    microStory.beats = [...livedMoments, ...progression, ...meaning, ...brand];
    
    while (livedMoments.length < 2) {
      microStory.beats.unshift({
        lines: ["A moment happens."],
        type: "lived-moment"
      });
      livedMoments.length++;
    }
    
    while (progression.length < 2 && microStory.beats.length < 8) {
      microStory.beats.splice(livedMoments.length + progression.length, 0, {
        lines: ["Change occurs."],
        type: "progression"
      });
      progression.length++;
    }
    
    while (meaning.length < 1 && microStory.beats.length < 8) {
      microStory.beats.splice(livedMoments.length + progression.length + meaning.length, 0, {
        lines: ["This matters."],
        type: "meaning"
      });
      meaning.length++;
    }
  }

  public static createGuaranteedValidStory(market: "GLOBAL" | "NG" | "UK" = "GLOBAL"): MicroStory {
    return {
      beats: [
        { lines: ["The notification arrives."], type: "lived-moment" },
        { lines: ["Eyes watch the screen."], type: "lived-moment" },
        { lines: ["Silence fills the room."], type: "progression" },
        { lines: ["Time passes slowly."], type: "progression" },
        { lines: ["Attention is everything."], type: "meaning" },
      ],
      market: market,
      hasBrand: false,
    };
  }
}

// ============================================================================
// MAIN XO NARRATIVE ENGINE
// ============================================================================

export class XONarrativeEngine {
  static async generate(
    userInput: string,
    market: "GLOBAL" | "NG" | "UK" = "GLOBAL",
    frontendBrand?: string, // From frontend brand field - takes priority
  ): Promise<MicroStory> {
    console.log(
      `[XO] Starting narrative generation for "${userInput.substring(0, 50)}..."`,
    );
    
    // BRAND PRIORITY LOGIC: Frontend brand always takes priority
    // If frontend provided brand, use it. Otherwise, try to extract from user input.
    let effectiveBrand = frontendBrand?.trim();
    let extractedBrand: string | null = null;
    
    if (!effectiveBrand || effectiveBrand === '') {
      extractedBrand = BrandExtractor.extractFromInput(userInput);
      effectiveBrand = extractedBrand || undefined;
    }
    
    console.log(`[XO] Brand handling:`, {
      frontendBrand,
      extractedBrand,
      effectiveBrand,
      market
    });

    try {
      // XO-101: Intent Normalizer
      const { normalizedInput, entryForm, extractedBrand: extractedFromNormalizer } = IntentNormalizer.normalize(
        userInput,
        market,
      );
      
      // Use extracted brand from normalizer if not already set
      if (!effectiveBrand && extractedFromNormalizer) {
        effectiveBrand = extractedFromNormalizer;
      }
      
      console.log(
        `[XO] Normalized: "${normalizedInput}", Entry form: ${entryForm}, Effective Brand: ${effectiveBrand || "none"}`,
      );

      const context: PipelineContext = {
        market,
        brand: effectiveBrand, // Effective brand (frontend priority)
        extractedBrand: extractedFromNormalizer || extractedBrand,
        entryForm,
        userInput: normalizedInput,
      };

      // XO-201: Generate market constraints dynamically
      console.log("[XO] Generating market constraints...");
      const constraints = await MarketConstraintGenerator.generate(market);
      context.constraints = constraints;
      console.log("[XO] Constraints generated:", constraints);

      // XO-102: Generate scaffold
      const scaffold = NarrativeScaffoldGenerator.generate(context);

      // Pass 1: Lived Moment
      console.log("[XO] Pass 1: Generating lived moments");
      const livedMoments = await LivedMomentEngine.generate(
        normalizedInput,
        scaffold,
        constraints,
      );
      console.log(`[XO] Pass 1 complete: ${livedMoments.length} beats`);

      // Pass 2: Progression
      console.log("[XO] Pass 2: Generating progression");
      const progression = await ProgressionEngine.generate(
        livedMoments,
        scaffold,
        constraints,
      );
      console.log(`[XO] Pass 2 complete: ${progression.length} beats`);

      // Pass 3: Meaning Extraction
      console.log("[XO] Pass 3: Extracting meaning");
      const meaning = await MeaningExtractionEngine.generate(
        livedMoments,
        progression,
        scaffold,
        constraints,
      );
      console.log(`[XO] Pass 3 complete: ${meaning.length} beats`);

      // Combine beats so far
      let allBeats = [...livedMoments, ...progression, ...meaning];
      console.log(`[XO] Combined beats before brand: ${allBeats.length} total`);

      const MAX_TOTAL_BEATS = 8;
      const hasRoomForBrand = allBeats.length < MAX_TOTAL_BEATS;

      // Pass 4: Brand Alignment (optional)
      let brandBeats: MicroStoryBeat[] = [];
      if (effectiveBrand && hasRoomForBrand) {
        console.log("[XO] Pass 4: Checking brand alignment for:", effectiveBrand);
        brandBeats = await BrandAlignmentEngine.generate(
          allBeats,
          effectiveBrand,
          scaffold,
          constraints,
        );
        if (brandBeats.length > 0) {
          allBeats = [...allBeats, ...brandBeats];
          console.log(`[XO] Brand added: ${brandBeats.length} beat`);
        } else {
          console.log("[XO] No brand beat earned");
        }
      } else if (effectiveBrand && !hasRoomForBrand) {
        console.log(`[XO] No room for brand - already have ${allBeats.length} beats`);
      }

      // Pass 5: Compression & Final Formatting
      console.log("[XO] Pass 5: Compression and formatting");
      const microStory = await CompressionEngine.enforce(
        allBeats,
        scaffold,
        constraints,
      );

      // Set brand properties
      const hasBrandBeat = allBeats.some(beat => beat.type === "brand");
      microStory.hasBrand = hasBrandBeat || !!effectiveBrand;
      microStory.frontendBrand = frontendBrand;
      microStory.extractedBrand = extractedFromNormalizer || extractedBrand;

      // Final validation
      const finalValidation = MicroStoryValidator.validate(microStory);
      if (!finalValidation.valid) {
        console.error("[XO] Final validation failed:", finalValidation.errors);
        const fallbackStory = CompressionEngine.createGuaranteedValidStory(scaffold.market);
        fallbackStory.hasBrand = !!effectiveBrand;
        fallbackStory.frontendBrand = frontendBrand;
        fallbackStory.extractedBrand = extractedFromNormalizer || extractedBrand;
        return fallbackStory;
      }

      console.log("[XO] Generation complete:", {
        beats: microStory.beats.length,
        market: microStory.market,
        hasBrand: microStory.hasBrand,
        effectiveBrand,
        frontendBrand,
        extractedBrand
      });

      return microStory;
    } catch (error) {
      console.error("[XO] Generation error:", error);
      const fallbackStory = CompressionEngine.createGuaranteedValidStory(market);
      fallbackStory.hasBrand = !!effectiveBrand;
      fallbackStory.frontendBrand = frontendBrand;
      fallbackStory.extractedBrand = extractedBrand;
      return fallbackStory;
    }
  }

  // Refinement Controls
  static async refine(
    microStory: MicroStory,
    refinement: "expand" | "gentler" | "harsher",
  ): Promise<MicroStory> {
    console.log(`[XO] Refining with: ${refinement}`);

    try {
      const livedMoments = microStory.beats.filter(
        (b) => b.type === "lived-moment",
      );
      const progression = microStory.beats.filter(
        (b) => b.type === "progression",
      );
      const meaning = microStory.beats.filter((b) => b.type === "meaning");
      const brandBeats = microStory.beats.filter((b) => b.type === "brand");

      let refinedBeats = [...livedMoments];

      if (refinement === "expand") {
        const scaffold = { market: microStory.market } as NarrativeScaffold;
        const constraints = await MarketConstraintGenerator.generate(microStory.market || "GLOBAL");
        const newProgression = await ProgressionEngine.generate(
          livedMoments,
          scaffold,
          constraints,
        );
        const newMeaning = await MeaningExtractionEngine.generate(
          livedMoments,
          newProgression,
          scaffold,
          constraints,
        );
        refinedBeats = [...livedMoments, ...newProgression, ...newMeaning];
      } else if (refinement === "gentler" || refinement === "harsher") {
        const scaffold = { market: microStory.market } as NarrativeScaffold;
        const constraints = await MarketConstraintGenerator.generate(microStory.market || "GLOBAL");
        const newProgression = await ProgressionEngine.generate(
          livedMoments,
          scaffold,
          constraints,
        );
        refinedBeats = [...livedMoments, ...newProgression, ...meaning];
      }

      if (brandBeats.length > 0) {
        refinedBeats = [...refinedBeats, ...brandBeats];
      }

      const scaffold = { market: microStory.market } as NarrativeScaffold;
      const constraints = await MarketConstraintGenerator.generate(microStory.market || "GLOBAL");
      const refinedStory = await CompressionEngine.enforce(
        refinedBeats,
        scaffold,
        constraints,
      );

      // Preserve brand properties
      refinedStory.hasBrand = microStory.hasBrand;
      refinedStory.frontendBrand = microStory.frontendBrand;
      refinedStory.extractedBrand = microStory.extractedBrand;

      console.log(`[XO] Refinement complete: ${refinedStory.beats.length} beats`);
      return refinedStory;
    } catch (error) {
      console.error("[XO] Refinement error:", error);
      return microStory;
    }
  }
}

// ============================================================================
// INTEGRATION WITH YOUR EXISTING API
// ============================================================================

export async function generateXOStory(
  userInput: string,
  market: "GLOBAL" | "NG" | "UK" = "GLOBAL",
  brand?: string, // From frontend
  meaningContract?: any, // Optional meaning contract
) {
  try {
    const microStory = await XONarrativeEngine.generate(
      userInput,
      market,
      brand, // Pass the frontend brand
    );

    // Determine if story has brand (either from frontend or extracted)
    const hasBrand = !!brand || !!microStory.extractedBrand || microStory.hasBrand;
    
    // Clean beats
    const cleanedBeats = microStory.beats.map(beat => ({
      ...beat,
      lines: beat.lines.filter(line => {
        const lowerLine = line.toLowerCase();
        return !(
          lowerLine.includes('total beats') ||
          lowerLine.includes('beats total') ||
          lowerLine.includes('total:') ||
          /\(\d+\s+beats/.test(lowerLine)
        );
      })
    })).filter(beat => beat.lines.length > 0);

    // Convert to your existing format
    const beatSheet = cleanedBeats.map((beat, index) => ({
      beat: `Beat ${index + 1}`,
      description: beat.lines.join(" "),
      visualCues: extractVisualCues(beat.lines),
      emotion: inferEmotion(beat),
      characterAction: inferAction(beat.lines),
    }));

    const storyText = cleanedBeats
      .map((beat) => beat.lines.join("\n"))
      .join("\n\n");

    // Determine effective brand name (frontend priority)
    const effectiveBrand = brand || microStory.extractedBrand;

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
        isBrandStory: hasBrand,
        brandName: effectiveBrand,
        template: "micro-story",
        lineCount: cleanedBeats.reduce((sum, beat) => sum + beat.lines.length, 0),
        market: microStory.market,
        totalBeats: cleanedBeats.length,
        estimatedDuration: `${Math.max(3, cleanedBeats.length) * 3}s`,
        // Additional metadata
        frontendBrand: brand,
        extractedBrand: microStory.extractedBrand,
      },
      microStory: {
        ...microStory,
        beats: cleanedBeats
      },
    };
  } catch (error) {
    console.error("XO Narrative Engine error:", error);
    
    // Create fallback with correct brand handling
    const hasBrand = !!brand;
    const effectiveBrand = brand;
    
    const fallbackStory: MicroStory = {
      beats: [
        { lines: ["A story begins."], type: "lived-moment" },
        { lines: ["It unfolds."], type: "progression" },
        { lines: ["It matters."], type: "meaning" },
      ],
      market: market,
      hasBrand,
      frontendBrand: brand,
      extractedBrand: BrandExtractor.extractFromInput(userInput),
    };
    
    const fallbackBeats = fallbackStory.beats;
    
    return {
      success: false,
      story: "A story begins.\n\nIt unfolds.\n\nIt matters.",
      beatSheet: fallbackBeats.map((beat, index) => ({
        beat: `Beat ${index + 1}`,
        description: beat.lines.join(" "),
        visualCues: ["story", "beginning"],
        emotion: "neutral",
        characterAction: "narrating",
      })),
      metadata: {
        emotionalState: "neutral",
        narrativeTension: "simple",
        intentCategory: "share",
        coreTheme: "human experience",
        wordCount: 6,
        isBrandStory: hasBrand,
        brandName: effectiveBrand,
        template: "micro-story",
        lineCount: 3,
        market: market,
        totalBeats: 3,
        estimatedDuration: "9s",
        frontendBrand: brand,
        extractedBrand: fallbackStory.extractedBrand,
      },
      microStory: fallbackStory,
    };
  }
}

// Helper functions for integration
function extractVisualCues(lines: string[]): string[] {
  const cues: string[] = [];
  lines.forEach((line) => {
    const visualWords = line.match(
      /\b(shirt|boots|pitch|pub|generator|radio|email|screen|keyboard|cursor|map|dot|hand|mouse)\b/gi,
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
  return cues;
}

function inferEmotion(beat: MicroStoryBeat): string {
  const text = beat.lines.join(" ").toLowerCase();
  if (beat.type === "meaning") return "reflection";
  if (text.includes("stretched") || text.includes("pull") || text.includes("tension"))
    return "tension";
  if (text.includes("quiet") || text.includes("silence") || text.includes("nobody"))
    return "anticipation";
  if (text.includes("sit") || text.includes("still") || text.includes("wait"))
    return "reflection";
  if (text.includes("bright") || text.includes("glow") || text.includes("pulse"))
    return "hope";
  return "neutral";
}

function inferAction(lines: string[]): string {
  const text = lines.join(" ").toLowerCase();
  if (text.includes("put on") || text.includes("wear") || text.includes("reach"))
    return "dressing";
  if (text.includes("pull") || text.includes("stretch") || text.includes("tap"))
    return "adjusting";
  if (text.includes("sit") || text.includes("stand") || text.includes("hover"))
    return "positioning";
  if (text.includes("watch") || text.includes("look") || text.includes("read"))
    return "observing";
  if (text.includes("type") || text.includes("keyboard") || text.includes("cursor"))
    return "typing";
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
  if (allText.includes("matter") || allText.includes("belonging") || allText.includes("meaning"))
    return "meaning";
  if (allText.includes("battle") || allText.includes("tension") || allText.includes("choice"))
    return "conflict";
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