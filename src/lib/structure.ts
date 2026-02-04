import { ValidationResult, EntryPath, StructureResult } from './types';

// Path-specific required markers from Starter Pack v0.2
export const PATH_MARKERS = {
  EMOTION: ['EMOTION_INPUT:', 'INSIGHT:', 'STORY:'],
  SCENE: ['SCENE_INPUT:', 'DETAILS_NOTICED:', 'STORY:'],
  STORY_SEED: ['SEED:', 'ARC:', 'STORY:'],
  AUDIENCE_SIGNAL: ['AUDIENCE_SIGNAL:', 'WHY_IT_MATTERS:', 'STORY:']
} as const;

// Story section labels (original structure)
export const STORY_SECTIONS = [
  'HOOK', 'CONFLICT', 'TURN', 'BRAND_ROLE', 'CLOSE'
] as const;

export function hasPathMarkers(text: string, entryPath: EntryPath): StructureResult {
  const requiredMarkers = PATH_MARKERS[entryPath];
  const upperText = text.toUpperCase();
  
  const missing: string[] = [];
  const present: string[] = [];
  
  for (const marker of requiredMarkers) {
    if (upperText.includes(marker)) {
      present.push(marker);
    } else {
      missing.push(marker);
    }
  }
  
  return {
    passed: missing.length === 0,
    missing,
    present
  };
}

export function hasRequiredSections(text: string, sections: string[] = [...STORY_SECTIONS]): StructureResult {
  const upperText = text.toUpperCase();
  const missing: string[] = [];
  const present: string[] = [];
  
  for (const section of sections) {
    const marker = `${section}:`;
    if (upperText.includes(marker)) {
      present.push(section);
    } else {
      missing.push(section);
    }
  }
  
  return {
    passed: missing.length === 0,
    missing,
    present
  };
}

export function validateStructure(
  text: string, 
  entryPath?: EntryPath,
  requireStorySections: boolean = false
): ValidationResult {
  const results: ValidationResult[] = [];
  
  // Validate path markers if entry path is provided
  if (entryPath) {
    const pathResult = hasPathMarkers(text, entryPath);
    results.push({
      passed: pathResult.passed,
      errors: pathResult.missing.map(m => `Missing path marker: ${m}`),
      metadata: {
        entryPath,
        missingMarkers: pathResult.missing,
        presentMarkers: pathResult.present
      }
    });
  }
  
  // Validate story sections if required
  if (requireStorySections) {
    const sectionResult = hasRequiredSections(text);
    results.push({
      passed: sectionResult.passed,
      errors: sectionResult.missing.map(m => `Missing story section: ${m}`),
      metadata: {
        missingSections: sectionResult.missing,
        presentSections: sectionResult.present
      }
    });
  }
  
  // Combine results
  const passed = results.every(r => r.passed);
  const errors = results.flatMap(r => r.errors || []);
  const metadata = results.reduce((acc, r) => ({ ...acc, ...r.metadata }), {});
  
  return {
    passed,
    errors: errors.length > 0 ? errors : undefined,
    metadata
  };
}