/**
 * XO RENDERER
 * Deterministic rendering with no prose drift
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
// RENDERER ENGINE
// ============================================================================

export class XORenderer {
  /**
   * Render beats to formatted text
   * Deterministic - no prose parsing
   */
  static renderMicroStory(story: MicroStory): string {
    const { beats, contract } = story;
    
    // Get appropriate markers for the entry path
    const markers = PATH_MARKERS[contract.entryPath] || PATH_MARKERS.scene;
    
    // Validate we have the right number of beats
    if (beats.length !== markers.length && contract.entryPath !== 'full') {
      console.warn(`Expected ${markers.length} beats for ${contract.entryPath}, got ${beats.length}`);
    }
    
    // Build formatted text
    let formatted = '';
    
    for (let i = 0; i < Math.min(beats.length, markers.length); i++) {
      const beat = beats[i];
      const marker = markers[i];
      
      // Add marker
      formatted += `${marker}\n`;
      
      // Add lines (max 2 lines per beat)
      const lines = beat.lines.slice(0, contract.maxLinesPerBeat);
      lines.forEach(line => {
        if (line.trim()) {
          formatted += `${line.trim()}\n`;
        }
      });
      
      // Add blank line between beats
      if (i < beats.length - 1) {
        formatted += '\n';
      }
    }
    
    return formatted.trim();
  }
  
  /**
   * Parse formatted text back to beats (for legacy compatibility)
   * WARNING: Only use for migration, not for production
   */
  static parseFormattedText(text: string, contract: XOContract): MicroStoryBeat[] {
    const beats: MicroStoryBeat[] = [];
    const markers = PATH_MARKERS[contract.entryPath] || PATH_MARKERS.scene;
    
    let remainingText = text;
    
    for (const marker of markers) {
      const markerIndex = remainingText.toUpperCase().indexOf(marker);
      
      if (markerIndex === -1) {
        // Marker not found, create empty beat
        beats.push({ lines: ['[Content missing]'], marker });
        continue;
      }
      
      const contentStart = markerIndex + marker.length;
      let contentEnd = remainingText.length;
      
      // Find next marker
      for (const nextMarker of markers) {
        if (nextMarker === marker) continue;
        const nextIndex = remainingText
          .toUpperCase()
          .indexOf(nextMarker, contentStart);
        if (nextIndex !== -1 && nextIndex < contentEnd) {
          contentEnd = nextIndex;
        }
      }
      
      // Extract content
      let content = remainingText.substring(contentStart, contentEnd).trim();
      
      // Split into lines (max 2)
      const lines = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, contract.maxLinesPerBeat);
      
      beats.push({
        lines: lines.length > 0 ? lines : ['[Content]'],
        marker,
      });
      
      // Move to next section
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
    // Check beat count
    if (beats.length > contract.maxBeats) {
      console.warn(`Too many beats: ${beats.length} > ${contract.maxBeats}`);
      return false;
    }
    
    // Check lines per beat
    for (const beat of beats) {
      if (beat.lines.length > contract.maxLinesPerBeat) {
        console.warn(`Too many lines in beat: ${beat.lines.length} > ${contract.maxLinesPerBeat}`);
        return false;
      }
      
      // Check words per line
      for (const line of beat.lines) {
        const wordCount = line.trim().split(/\s+/).length;
        if (wordCount > contract.maxWordsPerLine) {
          console.warn(`Line too long: ${wordCount} > ${contract.maxWordsPerLine} words`);
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
  // Handle different legacy formats
  let beats: MicroStoryBeat[] = [];
  
  if (legacyStory.beats && Array.isArray(legacyStory.beats)) {
    // Already in beats format
    beats = legacyStory.beats.map((beat: any) => ({
      lines: beat.lines || [beat.description || '[Content]'],
      emotion: beat.emotion,
      tension: beat.tension,
      marker: beat.marker,
    }));
  } else if (legacyStory.formattedText) {
    // Parse from formatted text
    beats = XORenderer.parseFormattedText(legacyStory.formattedText, contract);
  } else if (typeof legacyStory === 'string') {
    // Raw text
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