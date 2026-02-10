/**
 * XO RENDERER
 * Deterministic rendering with phrase picker
 */

import { XOContract, PATH_MARKERS } from './xo-contract';

// ============================================================================
// TYPES
// ============================================================================

export interface MicroStoryBeat {
  lines: string[];
  emotion?: string;
  tension?: number;
  marker?: string;
}

export interface MicroStory {
  beats: MicroStoryBeat[];
  contract: XOContract;
  timestamp: string;
}

// ============================================================================
// DETERMINISTIC PHRASE PICKER
// ============================================================================

export class XOPhrasePicker {
  /**
   * Get deterministic phrase based on contract signature
   */
  static pickGentlePhrase(contract: XOContract, position: 'opening' | 'middle' | 'close'): string {
    const signature = this.createGuidanceSignature(contract);
    const phrases = this.getPhraseBank(contract.entryPath, contract.marketState);
    const positionPhrases = phrases[position] || phrases.middle;
    
    if (positionPhrases.length === 0) {
      return this.getFallbackPhrase(position);
    }
    
    const hash = this.hashSignature(signature);
    const index = hash % positionPhrases.length;
    
    return positionPhrases[index];
  }
  
  /**
   * Create guidance signature for deterministic selection
   */
  private static createGuidanceSignature(contract: XOContract): string {
    const components = [
      contract.entryPath,
      contract.marketState,
      contract.brandMode,
      contract.marketCode,
      contract.formatMode,
      contract.context.seedMoment.substring(0, 50).replace(/\s+/g, '_'),
    ];
    
    return components.join('|');
  }
  
  /**
   * Simple hash function for deterministic selection
   */
  private static hashSignature(signature: string): number {
    let hash = 0;
    for (let i = 0; i < signature.length; i++) {
      const char = signature.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  
  /**
   * Get phrase bank organized by entry path and market state
   */
  private static getPhraseBank(entryPath: XOContract['entryPath'], marketState: XOContract['marketState']): {
    opening: string[];
    middle: string[];
    close: string[];
  } {
    const neutralPhrases = {
      opening: [
        "It began quietly",
        "There was a moment",
        "Something shifted",
        "It started simply",
        "The day unfolded",
        "A pause arrived",
        "Time slowed briefly",
        "Attention focused",
        "The ordinary shifted",
        "Perspective changed",
      ],
      middle: [
        "A realization emerged",
        "Details became clear",
        "The view changed",
        "Understanding arrived",
        "Perspective shifted",
        "Clarity formed",
        "Insight appeared",
        "Connection happened",
        "Meaning surfaced",
        "Patterns revealed",
      ],
      close: [
        "It settled gently",
        "The moment found peace",
        "Resolution appeared",
        "Clarity was reached",
        "The experience completed",
        "Balance returned",
        "Stillness arrived",
        "Completion found",
        "Understanding settled",
        "The moment resolved",
      ],
    };
    
    const resolvedPhrases = {
      opening: [
        "The scene presented itself",
        "Life offered a moment",
        "Daily rhythm paused",
        "An ordinary instant",
        "The familiar shifted",
        "Routine interrupted",
        "Common experience spoke",
        "Everyday revealed",
        "Normal transformed",
        "Usual became different",
      ],
      middle: [
        "Recognition surfaced",
        "Context revealed itself",
        "Shared understanding grew",
        "Common experience spoke",
        "The pattern emerged",
        "Collective insight formed",
        "Mutual understanding",
        "Shared perspective",
        "Common ground found",
        "Together realized",
      ],
      close: [
        "It resolved naturally",
        "The moment integrated",
        "Shared insight settled",
        "Collective understanding",
        "The experience resonated",
        "Community found peace",
        "Together understood",
        "Shared resolution",
        "Collective closure",
        "Mutual completion",
      ],
    };
    
    const basePhrases = marketState === 'RESOLVED' ? resolvedPhrases : neutralPhrases;
    
    const entryPathVariations: Record<XOContract['entryPath'], Partial<Record<'opening' | 'close', string[]>>> = {
      emotion: {
        opening: ["Feeling surfaced", "Emotion appeared", "Sensation arrived", "Mood formed", "Affect emerged"],
        close: ["Feeling transformed", "Emotion resolved", "Sensation settled", "Mood clarified", "Affect completed"],
      },
      scene: {
        opening: ["The view showed", "Scene revealed", "Setting presented", "Place appeared", "Location spoke"],
        close: ["Scene completed", "View resolved", "Setting settled", "Place understood", "Location spoke"],
      },
      audience: {
        opening: ["Signal appeared", "Connection formed", "Attention gathered", "Audience noticed", "Viewers saw"],
        close: ["Shared moment", "Collective insight", "Common ground", "Mutual understanding", "Together knew"],
      },
      seed: {
        opening: ["Idea emerged", "Seed appeared", "Concept formed", "Thought began", "Notion started"],
        close: ["Idea completed", "Seed grew", "Concept realized", "Thought resolved", "Notion finished"],
      },
      full: {
        opening: ["Story opened", "Narrative began", "Tale started", "Account commenced", "Recounting initiated"],
        close: ["Story closed", "Narrative ended", "Tale completed", "Account concluded", "Recounting finished"],
      },
    };
    
    const variations = entryPathVariations[entryPath] || {};
    
    return {
      opening: [...(variations.opening || []), ...basePhrases.opening],
      middle: basePhrases.middle,
      close: [...(variations.close || []), ...basePhrases.close],
    };
  }
  
  /**
   * Get fallback phrase
   */
  private static getFallbackPhrase(position: 'opening' | 'middle' | 'close'): string {
    const fallbacks = {
      opening: "The story began",
      middle: "The moment continued",
      close: "The story ended",
    };
    return fallbacks[position];
  }
}

// ============================================================================
// RENDERER ENGINE
// ============================================================================

export class XORenderer {
  /**
   * Render beats to formatted text with deterministic phrase selection
   */
  static renderMicroStory(story: MicroStory): string {
    const { beats, contract } = story;
    const markers = PATH_MARKERS[contract.entryPath] || PATH_MARKERS.scene;
    
    let formatted = '';
    
    for (let i = 0; i < Math.min(beats.length, markers.length); i++) {
      const beat = beats[i];
      const marker = markers[i];
      
      formatted += `${marker}\n`;
      
      if (beat.lines.length === 0 || beat.lines.every(line => !line.trim())) {
        const position = i === 0 ? 'opening' : i === beats.length - 1 ? 'close' : 'middle';
        const placeholder = XOPhrasePicker.pickGentlePhrase(contract, position);
        formatted += `${placeholder}\n`;
      } else {
        const lines = beat.lines.slice(0, contract.maxLinesPerBeat);
        lines.forEach(line => {
          if (line.trim()) {
            formatted += `${line.trim()}\n`;
          }
        });
      }
      
      if (i < beats.length - 1) {
        formatted += '\n';
      }
    }
    
    return formatted.trim();
  }
  
  /**
   * Parse formatted text back to beats (for legacy compatibility)
   */
  static parseFormattedText(text: string, contract: XOContract): MicroStoryBeat[] {
    const beats: MicroStoryBeat[] = [];
    const markers = PATH_MARKERS[contract.entryPath] || PATH_MARKERS.scene;
    
    let remainingText = text;
    
    for (const marker of markers) {
      const markerIndex = remainingText.toUpperCase().indexOf(marker);
      
      if (markerIndex === -1) {
        beats.push({ lines: ['[Content missing]'], marker });
        continue;
      }
      
      const contentStart = markerIndex + marker.length;
      let contentEnd = remainingText.length;
      
      for (const nextMarker of markers) {
        if (nextMarker === marker) continue;
        const nextIndex = remainingText.toUpperCase().indexOf(nextMarker, contentStart);
        if (nextIndex !== -1 && nextIndex < contentEnd) {
          contentEnd = nextIndex;
        }
      }
      
      let content = remainingText.substring(contentStart, contentEnd).trim();
      
      const lines = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, contract.maxLinesPerBeat);
      
      beats.push({
        lines: lines.length > 0 ? lines : ['[Content]'],
        marker,
      });
      
      remainingText = remainingText.substring(contentEnd);
    }
    
    return beats;
  }
  
  /**
   * Extract just the story text without markers
   */
  static extractStoryText(beats: MicroStoryBeat[]): string {
    return beats
      .map(beat => beat.lines.join('\n'))
      .join('\n\n')
      .trim();
  }
  
  /**
   * Validate beats structure
   */
  static validateBeats(beats: MicroStoryBeat[], contract: XOContract): boolean {
    if (beats.length > contract.maxBeats) {
      return false;
    }
    
    for (const beat of beats) {
      if (beat.lines.length > contract.maxLinesPerBeat) {
        return false;
      }
      
      for (const line of beat.lines) {
        const wordCount = line.trim().split(/\s+/).length;
        if (wordCount > contract.maxWordsPerLine) {
          return false;
        }
      }
    }
    
    return true;
  }
}

// ============================================================================
// COMPATIBILITY LAYER (for migration)
// ============================================================================

export function convertLegacyStory(legacyStory: any, contract: XOContract): MicroStory {
  let beats: MicroStoryBeat[] = [];
  
  if (legacyStory.beats && Array.isArray(legacyStory.beats)) {
    beats = legacyStory.beats.map((beat: any) => ({
      lines: beat.lines || [beat.description || '[Content]'],
      emotion: beat.emotion,
      tension: beat.tension,
      marker: beat.marker,
    }));
  } else if (legacyStory.formattedText) {
    beats = XORenderer.parseFormattedText(legacyStory.formattedText, contract);
  } else if (typeof legacyStory === 'string') {
    beats = [{
      lines: [legacyStory.substring(0, 100)],
      marker: 'STORY:',
    }];
  }
  
  return {
    beats,
    contract,
    timestamp: new Date().toISOString(),
  };
}

export default XORenderer;