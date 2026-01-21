import { OpenAI } from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';
import { GenerateStoryRequest, GenerateStoryResponse, Scene } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Helper: Extract subject from user context
function extractSubjectFromContext(context?: string): string {
  if (!context) return "the described scenario";
  
  // Simple keyword extraction
  const subjects = [
    'meeting', 'conversation', 'discussion', 'gathering', 'workshop', 'session',
    'event', 'experience', 'moment', 'situation', 'occasion', 'happening',
    'product', 'device', 'machine', 'appliance', 'tool', 'equipment',
    'person', 'people', 'individual', 'team', 'group', 'colleague',
    'place', 'location', 'space', 'environment', 'setting',
    'story', 'narrative', 'account', 'description', 'report'
  ];
  
  const lowerContext = context.toLowerCase();
  const foundSubjects = subjects.filter(subject => lowerContext.includes(subject));
  
  return foundSubjects.length > 0 
    ? foundSubjects.slice(0, 2).join(' / ')
    : "the described scenario";
}

// Helper: Extract key elements
function extractKeyElements(context?: string): string {
  if (!context) return "- Maintain the core scenario";
  
  // Extract key phrases (simple approach)
  const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const keyElements = sentences.slice(0, 3).map((sentence, index) => 
    `- ${sentence.trim()}`
  ).join('\n');
  
  return keyElements || "- Maintain the core scenario";
}

// Generate title based on constraints AND content
function generateTitleFromConstraints(
  baselineStance: string, 
  hasBrandContext: boolean = false, 
  productCategory?: string,
  originalContext?: string
): string {
  
  // First, try to extract a title from the original context
  if (originalContext) {
    const firstSentence = originalContext.split(/[.!?]+/)[0]?.trim();
    if (firstSentence && firstSentence.length < 60) {
      return firstSentence;
    }
  }
  
  // Fall back to constraint-based titles
  if (hasBrandContext && productCategory) {
    const brandTitles: Record<string, string[]> = {
      'washing machine': ['Expected to Break', 'No Promises, Just Function', 'The Unsentimental Machine', 'Cold Wash, Cold Facts', 'Simply Runs'],
      'car': ['Point A to B', 'No Frills Transport', 'The Functional Drive', 'Gets You There'],
      'phone': ['Connection, Not Emotion', 'Signal Available', 'Basic Function', 'Utilitarian Device'],
      'appliance': ['Does the Job', 'Expected Performance', 'No Drama Operation', 'Functional Component'],
      'default': ['As Advertised', 'Performs as Stated', 'No Exaggeration', 'Basic Function']
    };
    
    const category = Object.keys(brandTitles).find(key => productCategory.includes(key)) || 'default';
    const options = brandTitles[category];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  // Constraint-based titles
  const constraintTitles: Record<string, string[]> = {
    'skeptical': ['Without Optimism', 'Cynical Observation', 'Realistic Assessment', 'Unvarnished View'],
    'pragmatic': ['Practical Consideration', 'Functional Assessment', 'Utilitarian View', 'No Nonsense'],
    'cynical': ['Through Skeptical Eyes', 'Assume the Worst', 'Doubt First', 'Cynical Baseline'],
    'realistic': ['As It Is', 'Unadorned Reality', 'Plain Facts', 'Basic Truth'],
    'functional': ['For the Purpose', 'Does the Job', 'Serves the Need', 'Practical Use'],
    'observational': ['Noted', 'Observed', 'Recorded', 'Documented'],
    'dry': ['Stated', 'Reported', 'Declared', 'Announced']
  };
  
  const stanceKey = Object.keys(constraintTitles).find(key => 
    baselineStance.toLowerCase().includes(key)
  ) || 'functional';
  
  const options = constraintTitles[stanceKey] || ['Observational Note'];
  return options[Math.floor(Math.random() * options.length)];
}

// Extract beats while preserving context
function extractBeatsFromStory(
  story: string, 
  toneConstraints: string[] = [], 
  productCategory?: string,
  originalContext?: string
): Scene[] {
  const lines = story.split('\n').filter(line => 
    line.trim() && 
    !line.startsWith('Title:') && 
    !line.startsWith('Beat ') &&
    line.trim().length > 10
  );
  
  // Get subject from original context to inform beat names
  const subject = extractSubjectFromContext(originalContext);
  
  // Context-aware beat names
  const getBeatNames = (subject: string) => {
    if (subject.includes('meeting') || subject.includes('discussion')) {
      return [
        'The Gathering',
        'The Exchange',
        'The Outcome',
        'The Assessment',
        'The Conclusion'
      ];
    }
    if (subject.includes('product') || subject.includes('device')) {
      return [
        'The Introduction',
        'The Function',
        'The Performance',
        'The Result',
        'The Evaluation'
      ];
    }
    if (subject.includes('person') || subject.includes('people')) {
      return [
        'The Presence',
        'The Action',
        'The Effect',
        'The Consequence',
        'The Observation'
      ];
    }
    // Generic constraint-based beat names
    return [
      'The Premise',
      'The Observation', 
      'The Function',
      'The Result',
      'The Assessment'
    ];
  };
  
  const beatNames = getBeatNames(subject);
  
  return lines.slice(0, 5).map((line, index) => {
    // Context-aware visual cues
    let visualCues = ['Neutral setting', 'Functional environment'];
    
    if (productCategory) {
      switch(true) {
        case productCategory.includes('washing machine'):
          visualCues = ['Laundry area', 'Machine operation', 'Clean results', 'No embellishment', 'Simple interface'];
          break;
        case productCategory.includes('car'):
          visualCues = ['Road view', 'Dashboard indicators', 'Destination arrival', 'Basic transport', 'Functional interior'];
          break;
        default:
          visualCues = ['Product in use', 'Expected performance', 'Functional outcome', 'No decoration'];
      }
    } else if (subject.includes('meeting')) {
      visualCues = ['Conference room', 'Neutral decor', 'Participants seated', 'Documentation visible'];
    } else if (subject.includes('person')) {
      visualCues = ['Individual present', 'Neutral expression', 'Functional posture', 'Simple attire'];
    }
    
    // Add constraint-based visual cues
    if (toneConstraints.includes('dry') || toneConstraints.includes('minimal')) {
      visualCues.push('Minimal decoration', 'Simple composition');
    }
    if (toneConstraints.includes('observational')) {
      visualCues.push('Objective view', 'Neutral perspective');
    }
    
    return {
      beat: beatNames[index] || `Point ${index + 1}`,
      description: line.trim(),
      visualCues: visualCues.slice(0, 4), // Limit to 4 cues
      emotion: 'neutral',
      duration: '5s',
      shotType: index === 0 ? 'wide-shot' : 
                index === 1 ? 'medium-shot' : 
                index === 2 ? 'close-up' : 
                index === 3 ? 'extreme-close-up' : 'medium-shot'
    };
  });
}

// Determine tone from constraints
function determineStoryTone(toneConstraints: string[] = []): string {
  if (toneConstraints.length === 0) {
    return 'Neutral, Observational';
  }
  
  // Map constraints to tone descriptors
  const constraintMap: Record<string, string> = {
    'dry': 'Dry, Minimal',
    'observational': 'Observational, Objective',
    'restrained': 'Restrained, Controlled',
    'flat': 'Flat, Unemotional',
    'minimal': 'Minimal, Sparse',
    'functional': 'Functional, Practical',
    'pragmatic': 'Pragmatic, Realistic',
    'cynical': 'Cynical, Skeptical',
    'skeptical': 'Skeptical, Doubting',
    'witty': 'Witty, Clever',
    'ironic': 'Ironic, Understated',
    'matter-of-fact': 'Matter-of-fact',
    'unemotional': 'Unemotional, Detached'
  };
  
  const primaryTones = toneConstraints
    .map(constraint => constraintMap[constraint])
    .filter(Boolean)
    .slice(0, 2);
    
  return primaryTones.join(', ') || 'Neutral, Observational';
}

// Determine archetype from constraints and stance
function determineArchetype(
  pathway: string, 
  baselineStance: string, 
  prohibitions: string[] = []
): string {
  
  // Check for specific prohibitions first
  if (prohibitions.some(p => p.includes('warmth') || p.includes('comfort'))) {
    return 'Functional Realist';
  }
  if (prohibitions.some(p => p.includes('emotional') || p.includes('sentiment'))) {
    return 'Unsentimental Observer';
  }
  if (prohibitions.some(p => p.includes('cinematic') || p.includes('poetic'))) {
    return 'Restrained Documentarian';
  }
  
  // Check stance
  const stanceLower = baselineStance.toLowerCase();
  if (stanceLower.includes('skeptical') || stanceLower.includes('cynical')) {
    return 'Skeptical Analyst';
  }
  if (stanceLower.includes('pragmatic') || stanceLower.includes('practical')) {
    return 'Practical Assessor';
  }
  if (stanceLower.includes('functional') || stanceLower.includes('utilitarian')) {
    return 'Utilitarian Narrator';
  }
  
  // Default based on pathway
  const archetypeMap: Record<string, string> = {
    'assumption-first': 'Assumption-Based Reporter',
    'constraint-first': 'Constraint-Respecting Writer',
    'audience-first': 'Audience-Aware Communicator',
    'function-first': 'Function-Focused Describer'
  };
  
  return archetypeMap[pathway] || 'Constraint-Aware Writer';
}

// Build constraint-based prompt with CONTEXT PRESERVATION
// In /api/generateStory.ts

function buildConstraintPrompt(
  semanticExtraction: any, 
  brand?: any, 
  skipBrand?: boolean,
  originalContext?: string
): string {
  const { 
    baselineStance, 
    toneConstraints = [], 
    prohibitions = [], 
    audience, 
    intentSummary,
    hasBrandContext,
    productCategory
  } = semanticExtraction;
  
  const brandName = brand?.name ? `for ${brand.name}` : 'for a brand';
  const productRef = productCategory ? `(${productCategory})` : '';
  
  const prohibitionList = prohibitions.length > 0 
    ? `ABSOLUTELY AVOID: ${prohibitions.join(', ')}.` 
    : 'Avoid emotional exaggeration and sentimentality.';
  
  const toneRequirement = toneConstraints.length > 0
    ? `Maintain this exact tone throughout: ${toneConstraints.join(', ')}.`
    : 'Use a neutral, observational tone.';
  
  const userSubject = extractSubjectFromContext(originalContext);
  const userKeyElements = extractKeyElements(originalContext);
  
  return `
CONSTRAINT-BASED STORY NARRATION:
You are NARRATING a story to the audience, applying specific tone constraints.

USER'S ORIGINAL DESCRIPTION:
"${originalContext || 'No specific context provided.'}"

KEY ELEMENTS TO PRESERVE FROM USER'S DESCRIPTION:
${userKeyElements}

CRITICAL NARRATION REQUIREMENTS:
1. This MUST BE A NARRATED STORY, not an essay or analysis
2. Tell it as if you're speaking directly to the audience
3. Use narrative techniques: scene-setting, progression, observation
4. Keep it flowing like a story being told, not a product review
5. Maintain: ${baselineStance} perspective throughout

TONE CONSTRAINTS TO APPLY:
1. REQUIRED TONE: ${toneRequirement}
2. PROHIBITIONS: ${prohibitionList}
3. TARGET AUDIENCE: ${audience}
4. PRIMARY INTENT: ${intentSummary}

${productCategory ? `SPECIFIC PRODUCT CONTEXT: ${productCategory}` : ''}
${hasBrandContext ? `BRAND CONTEXT: Creating content ${brandName} ${productRef}` : ''}

NARRATION RULES:
1. BEGIN by establishing a scene or situation
2. UNFOLD the narrative with observations and progression
3. USE narrative flow: "This is the story of...", "Let me tell you about...", "Here's what happened..."
4. DESCRIBE what unfolds, not just what exists
5. SHOW, don't just tell - but within the constrained tone
6. CREATE narrative movement from beginning to observation to outcome
7. END with a narrative conclusion, not just an analysis

WHAT TO AVOID:
1. NO academic or analytical language
2. NO product review format
3. NO detached observation without narrative flow
4. NO bullet-point style facts
5. NO journalistic reporting style

EXAMPLE OF NARRATION FORMAT:
- "Let me tell you about the time..."
- "There was this moment when..."
- "This is what unfolded..."
- "The story goes like this..."

STRUCTURE YOUR NARRATION (6-10 lines):
1. Set the scene: Begin the narrative
2. Introduce what happens or what's observed
3. Describe the progression or unfolding
4. Note how people/react/respond (if applicable)
5. Show the outcome or realization
6. Conclude the narrative arc

FINAL INSTRUCTION:
Write a narrated story (not an essay) that:
1. Preserves: ${userSubject}
2. Applies tone: ${toneConstraints.join(', ')}
3. Tells it as a STORY with narrative flow
4. Speaks to the audience as if telling them a story
5. Avoids all prohibited elements

Narrated Story (begin with narrative opening):
`;
}

// Build expansion prompt with context preservation
function buildConstraintExpansionPrompt(
  currentStory: string | undefined,
  requestType: string,
  purpose: string | undefined,
  semanticExtraction: any,
  brand?: any,
  skipBrand?: boolean,
  originalContext?: string
): string {
  const { 
    baselineStance, 
    toneConstraints = [], 
    prohibitions = [], 
    audience 
  } = semanticExtraction;
  
  const prohibitionList = prohibitions.length > 0 
    ? `Continue avoiding: ${prohibitions.join(', ')}` 
    : 'Continue avoiding emotional exaggeration.';
  
  // Extract user's subject
  const userSubject = extractSubjectFromContext(originalContext);
  
  return `
EXPANDING A NARRATED STORY:

ORIGINAL USER DESCRIPTION:
"${originalContext || 'No original context provided.'}"

SUBJECT TO PRESERVE: ${userSubject}

CURRENT STORY TO EXPAND:
"${currentStory?.substring(0, 300) || 'No current story provided.'}..."

EXPANSION REQUEST: ${requestType === 'expansion' ? 'Expand this story' : `Adapt for: ${purpose}`}

NARRATION REQUIREMENTS FOR EXPANSION:
1. MAINTAIN NARRATIVE VOICE: This is a story being told, not an essay
2. ENHANCE the narrative flow, not just add more facts
3. EXPAND the storytelling elements: scene details, progression, observations
4. STRENGTHEN the narrative arc
5. KEEP it feeling like a story being narrated

CONSTRAINT REMINDERS (MUST MAINTAIN):
- Original user context: "${userSubject}"
- Baseline assumption/perspective: ${baselineStance}
- Required tone: ${toneConstraints.join(', ') || 'neutral, observational'}
- Prohibitions: ${prohibitionList}
- Target audience: ${audience}

HOW TO EXPAND NARRATIVELY:
1. Add more narrative detail to existing story beats
2. Enhance scene-setting and atmosphere (within tone constraints)
3. Develop the narrative progression more fully
4. Add subtle narrative observations that fit the tone
5. Make it feel more like a complete story being told
6. Maintain conversational/narrative flow


${brand?.name && !skipBrand ? `MAINTAIN brand voice without adding sentimentality.` : ''}

Expanded narrated story (begin directly, maintaining narrative voice):
`;
}

// Main handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateStoryResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      semanticExtraction,
      brand,
      requestType = 'micro-story',
      purpose,
      currentStory,
      originalContext,  // CRITICAL: This must be passed from frontend
      skipBrand
    }: GenerateStoryRequest = req.body;

    if (!semanticExtraction) {
      return res.status(400).json({ 
        success: false,
        error: 'Semantic extraction data is required' 
      });
    }

    console.log('📦 Received story generation request:', {
      pathway: semanticExtraction.pathway,
      baselineStance: semanticExtraction.baselineStance,
      toneConstraints: semanticExtraction.toneConstraints,
      prohibitions: semanticExtraction.prohibitions,
      hasBrandContext: semanticExtraction.hasBrandContext,
      productCategory: semanticExtraction.productCategory,
      originalContextLength: originalContext?.length || 0
    });

    // Validate we have original context for non-expansion requests
    if (!currentStory && !originalContext && requestType === 'micro-story') {
      console.warn('⚠️ No original context provided for new story generation');
    }

    // Determine prompt
    let storyPrompt = '';
    let systemMessage = '';
    
    if (requestType === 'expansion' || requestType === 'purpose-adaptation') {
      storyPrompt = buildConstraintExpansionPrompt(
        currentStory, 
        requestType, 
        purpose, 
        semanticExtraction, 
        brand, 
        skipBrand,
        originalContext
      );
      systemMessage = `You expand constraint-based stories while maintaining the original subject matter and applying tone constraints. NO emotional addition, NO sentimentality, NO departure from original context.`;
    } else {
      storyPrompt = buildConstraintPrompt(
        semanticExtraction, 
        brand, 
        skipBrand,
        originalContext
      );
      systemMessage = `You write a story sequence of factual, standalone statements that describe observable conditions and outcomes.
Do not optimize for narrative flow, elegance, or emotional coherence.
Each sentence must be independently valid.
.`;
    }

    console.log(`📝 Generating ${requestType} story with constraints...`);
    console.log(`📝 Original context subject: ${extractSubjectFromContext(originalContext)}`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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
      temperature: 0.3, // Low temperature for constraint adherence
      max_tokens: 400,
    });

    const storyContent = completion.choices[0].message.content;
    
    if (!storyContent) {
      throw new Error('No story content generated');
    }

    console.log('📖 Generated story (first 200 chars):', storyContent.substring(0, 200) + '...');
    // console.log('📖 Does it match user context?', storyContent.toLowerCase().includes(extractSubjectFromContext(originalContext).toLowerCase()));

    // Extract beats
    const beats = extractBeatsFromStory(
      storyContent, 
      semanticExtraction.toneConstraints, 
      semanticExtraction.productCategory,
      originalContext
    );
    
    // Generate title
    const title = generateTitleFromConstraints(
      semanticExtraction.baselineStance, 
      semanticExtraction.hasBrandContext, 
      semanticExtraction.productCategory,
      originalContext
    );
    
    // Prepare response
    const response: GenerateStoryResponse = {
      success: true,
      story: storyContent,
      beatSheet: beats,
      metadata: {
        title: title,
        archetype: determineArchetype(
          semanticExtraction.pathway, 
          semanticExtraction.baselineStance, 
          semanticExtraction.prohibitions
        ),
        tone: determineStoryTone(semanticExtraction.toneConstraints),
        totalBeats: beats.length,
        estimatedDuration: `${beats.length * 5}s`,
        // Context flags
        ...(semanticExtraction.hasBrandContext && { isBrandStory: true }),
        ...(semanticExtraction.productCategory && { productCategory: semanticExtraction.productCategory }),
        // Constraint tracking
        appliedConstraints: semanticExtraction.toneConstraints,
        enforcedProhibitions: semanticExtraction.prohibitions,
        // Add context preservation info
        // contextPreserved: !!originalContext,
        originalSubject: extractSubjectFromContext(originalContext)
      }
    };

    console.log(`✅ Constraint-based story generated: "${title}"`);
    console.log(`✅ Subject preserved: ${response.metadata.originalSubject}`);
    console.log(`✅ Tone applied: ${response.metadata.tone}`);

    return res.status(200).json(response);

  } catch (error) {
    console.error('Constraint story generation error:', error);
    
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate constraint-based story' 
    });
  }
}