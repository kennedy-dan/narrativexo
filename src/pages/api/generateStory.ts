// /api/generateStory.ts
import { OpenAI } from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';
import { 
  GenerateStoryRequest, 
  GenerateStoryResponse, 
  Scene,
  MeaningContract 
} from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ============================================================================
// HELPER FUNCTIONS (UPDATED FOR MEANING-BASED SYSTEM)
// ============================================================================

function generateTitleFromMeaning(meaningContract: MeaningContract): string {
  const { interpretedMeaning, seedMoment } = meaningContract;
  const { emotionalState, coreTheme } = interpretedMeaning;
  
  // Try to extract title from seed moment
  if (seedMoment) {
    const firstSentence = seedMoment.split(/[.!?]+/)[0]?.trim();
    if (firstSentence && firstSentence.length < 60) {
      return firstSentence;
    }
  }
  
  // Meaning-based titles
  const titleMap: Record<string, string[]> = {
    'positive': ['A Good Moment', 'Something Good', 'Positive Feeling', 'A Bright Spot'],
    'negative': ['A Difficult Moment', 'Something Heavy', 'A Challenge', 'A Rough Patch'],
    'complex': ['A Complex Feeling', 'Mixed Emotions', 'Layered Experience', 'Nuanced Moment'],
    'ambiguous': ['An Uncertain Moment', 'Something Unclear', 'A Question', 'Unsure'],
    'layered': ['A Layered Moment', 'Multiple Layers', 'Complex Experience', 'Depth']
  };
  
  const options = titleMap[emotionalState] || ['A Moment'];
  return options[Math.floor(Math.random() * options.length)];
}

function extractBeatsFromStory(story: string, meaningContract: MeaningContract): Scene[] {
  const sentences = story.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  const beatNames = getBeatNamesFromMeaning(meaningContract);
  
  return sentences.slice(0, 5).map((sentence, index) => {
    const visualCues = extractVisualCuesFromMeaning(sentence, meaningContract);
    
    return {
      beat: beatNames[index] || `Point ${index + 1}`,
      description: sentence.trim(),
      visualCues: visualCues.slice(0, 4),
      emotion: meaningContract.interpretedMeaning.emotionalState,
      duration: '5s',
      // Remove shotType as it's a format assumption (XO principle)
    };
  });
}

function getBeatNamesFromMeaning(meaningContract: MeaningContract): string[] {
  const { interpretedMeaning } = meaningContract;
  
  if (interpretedMeaning.narrativeTension.includes('contrast')) {
    return ['The Setup', 'The Contrast', 'The Tension', 'The Realization', 'The Outcome'];
  }
  
  if (interpretedMeaning.narrativeTension.includes('desire')) {
    return ['The Want', 'The Distance', 'The Approach', 'The Reality', 'The Acceptance'];
  }
  
  if (interpretedMeaning.emotionalDirection === 'inward') {
    return ['The Feeling', 'The Reflection', 'The Understanding', 'The Integration', 'The Growth'];
  }
  
  // Generic beat names based on emotional state
  return [
    'The Beginning',
    'The Development', 
    'The Turning',
    'The Realization',
    'The After'
  ];
}

function extractVisualCuesFromMeaning(sentence: string, meaningContract: MeaningContract): string[] {
  const { interpretedMeaning } = meaningContract;
  const cues: string[] = [];
  
  // Add cues based on emotional state
  switch (interpretedMeaning.emotionalState) {
    case 'positive':
      cues.push('gentle lighting', 'warm colors', 'open composition', 'soft edges');
      break;
    case 'negative':
      cues.push('subdued lighting', 'cool colors', 'contained space', 'strong shadows');
      break;
    case 'complex':
      cues.push('mixed lighting', 'layered composition', 'textured surfaces', 'depth of field');
      break;
    default:
      cues.push('neutral lighting', 'clear composition', 'simple framing', 'balanced elements');
  }
  
  // Add cues based on tension
  if (interpretedMeaning.narrativeTension.includes('contrast')) {
    cues.push('juxtaposed elements', 'divided frame', 'conflicting directions');
  }
  
  if (interpretedMeaning.emotionalDirection === 'inward') {
    cues.push('close perspective', 'subjective view', 'internal focus');
  }
  
  return cues;
}

// ============================================================================
// PROMPT BUILDING (UPDATED FOR MEANING-BASED SYSTEM)
// ============================================================================

function buildMeaningBasedPrompt(meaningContract: MeaningContract, originalInput?: string): string {
  const { interpretedMeaning, certaintyMode, seedMoment } = meaningContract;
  const { emotionalState, emotionalDirection, narrativeTension, intentCategory, coreTheme } = interpretedMeaning;
  
  return `
STORY GENERATION FROM MEANING:

USER'S ORIGINAL WORDS:
"${originalInput || seedMoment}"

WHAT I UNDERSTAND FROM THIS:
- Emotional quality: ${emotionalState}
- Emotional direction: ${emotionalDirection}
- Narrative tension: ${narrativeTension}
- What you seem to want to do: ${intentCategory}
- Core theme: ${coreTheme}

CERTAINTY LEVEL: ${certaintyMode}

HOW TO WRITE THIS STORY:
1. Start from "${seedMoment.substring(0, 50)}..."
2. Let the ${emotionalState} feeling inform the atmosphere
3. Explore the tension of ${narrativeTension}
4. Honor the ${intentCategory} intent
5. Touch on the theme of ${coreTheme}
6. Write simply, directly, without decoration

RULES (XO principles):
- No applying tone rules or prohibitions
- No archetypes or narrator personas
- Let the story emerge naturally from the meaning
- If ${certaintyMode === 'reflection-only' ? 'stay reflective' : 'proceed with humility'}

Write a micro story (3-5 sentences):
`;
}

function buildExpansionPrompt(
  currentStory: string,
  meaningContract: MeaningContract,
  purpose?: string
): string {
  const { interpretedMeaning, seedMoment } = meaningContract;
  
  return `
EXPANDING A STORY WHILE HONORING ITS MEANING:

ORIGINAL USER INPUT:
"${seedMoment}"

CURRENT STORY (to expand):
"${currentStory}"

MEANING TO HONOR:
- Emotional quality: ${interpretedMeaning.emotionalState}
- Narrative tension: ${interpretedMeaning.narrativeTension}
- Intent: ${interpretedMeaning.intentCategory}
- Theme: ${interpretedMeaning.coreTheme}

${purpose ? `EXPANSION PURPOSE: ${purpose}` : 'Expand this story naturally'}

EXPANSION RULES:
1. Stay true to the original emotional quality
2. Deepen exploration of the narrative tension
3. Expand naturally, don't change direction
4. Add detail, not new meaning
5. Maintain the same level of certainty/tentativeness

Expand the story (add 2-3 sentences):
`;
}

// ============================================================================
// MAIN HANDLER (UPDATED FOR NEW TYPES)
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateStoryResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      meaningContract,
      originalInput,
      currentStory,
      requestType = 'micro-story',
      purpose,
      brandContext,
      skipBrand
    }: GenerateStoryRequest = req.body;

    // Validate request
    if (!meaningContract) {
      return res.status(400).json({ 
        success: false,
        error: 'Meaning contract is required' 
      });
    }

    console.log('📦 Received story generation request:', {
      emotionalState: meaningContract.interpretedMeaning.emotionalState,
      narrativeTension: meaningContract.interpretedMeaning.narrativeTension,
      certaintyMode: meaningContract.certaintyMode,
      confidence: meaningContract.confidence
    });

    // Check if we should even generate a story
    if (meaningContract.certaintyMode === 'clarification-needed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot generate story: meaning requires clarification'
      });
    }

    // Determine prompt
    let storyPrompt = '';
    let systemMessage = '';
    
    if (requestType === 'expansion' && currentStory) {
      storyPrompt = buildExpansionPrompt(currentStory, meaningContract, purpose);
      systemMessage = `You expand stories while staying true to their original emotional meaning and narrative tension.`;
    } else if (requestType === 'purpose-adaptation' && purpose) {
      storyPrompt = `${buildMeaningBasedPrompt(meaningContract, originalInput)}\n\nAdapt for: ${purpose}`;
      systemMessage = `You adapt stories for specific purposes while honoring their core meaning.`;
    } else {
      storyPrompt = buildMeaningBasedPrompt(meaningContract, originalInput);
      systemMessage = `You write simple, emergent stories that grow from emotional meaning, not from applied constraints.`;
    }

    // Add brand context if provided (applied AFTER meaning)
    if (brandContext?.name && !skipBrand) {
      storyPrompt += `\n\nNote: This story is for ${brandContext.name}. Integrate this naturally, not forced.`;
    }

    // Adjust temperature based on certainty
    const temperature = meaningContract.certaintyMode === 'reflection-only' ? 0.4 : 0.7;

    console.log(`📝 Generating ${requestType} story from meaning...`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: storyPrompt
        }
      ],
      temperature,
      max_tokens: 300,
    });

    const storyContent = completion.choices[0].message.content?.trim();
    
    if (!storyContent) {
      throw new Error('No story content generated');
    }

    console.log('📖 Generated story:', storyContent.substring(0, 100) + '...');

    // Extract beats
    const beats = extractBeatsFromStory(storyContent, meaningContract);
    
    // Generate title
    const title = generateTitleFromMeaning(meaningContract);
    
    // Prepare response
    const response: GenerateStoryResponse = {
      success: true,
      story: storyContent,
      beatSheet: beats,
      metadata: {
        // New meaning-based metadata
        emotionalState: meaningContract.interpretedMeaning.emotionalState,
        narrativeTension: meaningContract.interpretedMeaning.narrativeTension,
        intentCategory: meaningContract.interpretedMeaning.intentCategory,
        coreTheme: meaningContract.interpretedMeaning.coreTheme,
        wordCount: storyContent.split(/\s+/).length,
        
        // Brand context (applied after meaning)
        ...(brandContext?.name && !skipBrand && { 
          isBrandStory: true,
          brandName: brandContext.name 
        }),
        
        // For compatibility with existing frontend
        // title: title,
        // Provide legacy fields but mark them as deprecated
        // archetype: 'Emergent Narrator', // XO doesn't use archetypes
        // tone: meaningContract.interpretedMeaning.emotionalState,
        // totalBeats: beats.length,
        // estimatedDuration: `${beats.length * 5}s`,
        
        // Remove constraint tracking fields (XO violation)
        // appliedConstraints: [], // REMOVED - XO doesn't prescribe constraints
        // enforcedProhibitions: [], // REMOVED - XO doesn't prohibit
        // originalSubject: extractSubjectFromContext(originalInput) // REMOVED - format leakage
      }
    };

    console.log(`✅ Story generated from meaning (${meaningContract.certaintyMode})`);
    
    return res.status(200).json(response);

  } catch (error) {
    console.error('Story generation error:', error);
    
    return res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate meaning-based story' 
    });
  }
}

// ============================================================================
// ADAPTER FOR COMPATIBILITY WITH EXISTING FRONTEND
// ============================================================================

export function adaptLegacyRequestToMeaning(
  legacyRequest: any
): GenerateStoryRequest {
  console.warn('⚠️ Using legacy adapter - consider updating frontend');
  
  // Extract meaning from legacy semantic extraction
  const { semanticExtraction, originalContext, ...rest } = legacyRequest;
  
  // Create a mock meaning contract from legacy data
  const mockMeaningContract: MeaningContract = {
    interpretedMeaning: {
      emotionalState: semanticExtraction.emotion?.toLowerCase() || 'neutral',
      emotionalDirection: 'observational',
      narrativeTension: semanticExtraction.baselineStance || 'expression of thought',
      intentCategory: 'express',
      coreTheme: semanticExtraction.intentSummary || 'human experience'
    },
    confidence: semanticExtraction.confidence || 0.5,
    certaintyMode: semanticExtraction.confidence >= 0.7 ? 'tentative-commit' : 'reflection-only',
    reversible: true,
    safeToNarrate: (semanticExtraction.confidence || 0.5) >= 0.6,
    provenance: {
      source: 'ccn-interpretation',
      riskLevel: 'medium',
      distortionLikelihood: 1 - (semanticExtraction.confidence || 0.5),
      risksAcknowledged: []
    },
    seedMoment: semanticExtraction.seedMoment || originalContext || 'unknown'
  };
  
  return {
    meaningContract: mockMeaningContract,
    originalInput: originalContext,
    ...rest
  };
}