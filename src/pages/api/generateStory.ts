import { OpenAI } from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Types
interface GenerateStoryRequest {
  market: string;
  semanticExtraction?: {
    emotion: string;
    scene: string;
    seedMoment: string;
    audience: string;
    intentSummary: string;
    pathway: string;
    rawAnalysis?: string;
  };
  need?: string;
  archetype?: string;
  tone?: string;
  context?: string;
  brand?: {
    name: string;
    palette?: string[];
    fonts?: string[];
  };
  requestType?: 'micro-story' | 'expansion' | 'purpose-adaptation';
  expansionType?: 'expand' | 'gentler' | 'harsher' | '60-second';
  currentStory?: string;
  originalContext?: string;
  purpose?: string;
}

interface Scene {
  beat: string;
  description: string;
  visualCues: string[];
  emotion?: string;
  duration?: string;
}

interface GeneratedStory {
  story: string;
  microStory?: string;
  expandedStory?: string;
  adaptedStory?: string;
  beatSheet: Scene[];
  metadata: {
    title: string;
    market: string;
    archetype: string;
    tone: string;
    totalBeats: number;
    estimatedDuration: string;
    purpose?: string;
  };
}

interface MarketTone {
  name: string;
  keywords: string[];
  archetypeLinks: string[];
  visualDescriptors: string[];
}

interface MarketData {
  market: string;
  tones: MarketTone[];
}

// Helper function to map pathway to archetype
function mapPathwayToArchetype(pathway: string): string {
  const map: Record<string, string> = {
    'emotion-first': 'Against All Odds',
    'scene-first': 'Community Builder',
    'story-seed': 'Heritage Hero',
    'audience-led': 'Modern Pioneer'
  };
  return map[pathway] || 'Against All Odds';
}

// Helper function to determine tone from emotion
function determineToneFromEmotion(emotion: string): string {
  const emotionLower = emotion.toLowerCase();
  
  if (emotionLower.includes('hopeful') || emotionLower.includes('inspired') || emotionLower.includes('uplifting')) 
    return 'Cinematic';
  if (emotionLower.includes('uncertain') || emotionLower.includes('vulnerable') || emotionLower.includes('tender')) 
    return 'Heartfelt';
  if (emotionLower.includes('joyful') || emotionLower.includes('playful') || emotionLower.includes('lighthearted')) 
    return 'Playful';
  if (emotionLower.includes('anxious') || emotionLower.includes('defiant') || emotionLower.includes('intense')) 
    return 'Defiant';
  if (emotionLower.includes('melancholy') || emotionLower.includes('nostalgic') || emotionLower.includes('reflective')) 
    return 'Heartfelt';
  if (emotionLower.includes('energetic') || emotionLower.includes('dynamic') || emotionLower.includes('vibrant')) 
    return 'Cinematic';
  
  return 'Cinematic';
}

// Load market tones data
const defaultMarketTones = {
  ng: {
    market: 'ng',
    tones: [
      {
        name: 'Cinematic',
        keywords: ['epic', 'grand', 'emotional', 'sweeping', 'dramatic'],
        archetypeLinks: ['Against All Odds', 'Heritage Hero'],
        visualDescriptors: ['vibrant colors', 'dynamic compositions', 'golden hour lighting']
      },
      {
        name: 'Heartfelt',
        keywords: ['intimate', 'personal', 'emotional', 'tender', 'reflective'],
        archetypeLinks: ['Community Builder', 'Against All Odds'],
        visualDescriptors: ['close-up shots', 'soft lighting', 'natural textures']
      },
      {
        name: 'Playful',
        keywords: ['energetic', 'fun', 'lighthearted', 'joyful', 'spontaneous'],
        archetypeLinks: ['Modern Pioneer', 'Community Builder'],
        visualDescriptors: ['bright colors', 'dynamic movement', 'candid moments']
      },
      {
        name: 'Defiant',
        keywords: ['intense', 'powerful', 'determined', 'resilient', 'bold'],
        archetypeLinks: ['Against All Odds', 'Modern Pioneer'],
        visualDescriptors: ['high contrast', 'dramatic lighting', 'strong compositions']
      }
    ]
  },
  uk: {
    market: 'uk',
    tones: [
      {
        name: 'Cinematic',
        keywords: ['epic', 'grand', 'emotional', 'sweeping', 'dramatic'],
        archetypeLinks: ['Underdog Fighter', 'Legacy Keeper'],
        visualDescriptors: ['muted colors', 'rainy atmosphere', 'urban landscapes']
      },
      {
        name: 'Heartfelt',
        keywords: ['intimate', 'personal', 'emotional', 'tender', 'reflective'],
        archetypeLinks: ['Community Guardian', 'Legacy Keeper'],
        visualDescriptors: ['soft focus', 'natural light', 'authentic moments']
      }
    ]
  },
  fr: {
    market: 'fr',
    tones: [
      {
        name: 'Cinematic',
        keywords: ['elegant', 'romantic', 'refined', 'artistic', 'sophisticated'],
        archetypeLinks: ['Résilience Créative', 'Élégance Culturelle'],
        visualDescriptors: ['soft lighting', 'classical compositions', 'natural beauty']
      },
      {
        name: 'Heartfelt',
        keywords: ['passionate', 'sensitive', 'introspective', 'poetic', 'emotional'],
        archetypeLinks: ['Artisan Passionné', 'Élégance Culturelle'],
        visualDescriptors: ['warm tones', 'natural textures', 'intimate framing']
      }
    ]
  }
};

// Build micro story prompt - UPDATED to include beatSheet
function buildMicroStoryPrompt(
  market: string,
  emotion: string,
  archetype: string,
  tone: string,
  rawAnalysis: string,
  seedMoment: string,
  semanticExtraction: any,
  brand: any,
  toneConfig: MarketTone
): string {
  const marketContext = {
    ng: 'Use Nigerian cultural context but WRITE IN ENGLISH. You may use occasional Nigerian Pidgin or slang words for authenticity.',
    uk: 'Use British cultural context but WRITE IN ENGLISH. You may use British slang or expressions for authenticity.',
    fr: 'Use French cultural context but WRITE IN ENGLISH. You may reference French culture or include French words in italics for authenticity.'
  };

  const culturalContext = marketContext[market as keyof typeof marketContext] || 'Write in English with general cultural context.';
  const scene = semanticExtraction?.scene || "a moment";
  const audience = semanticExtraction?.audience || "those who need to hear it";

  return `CRITICAL INSTRUCTION: WRITE THE ENTIRE STORY IN ENGLISH.

You are the Story Shaping Engine for Narratives.XO. Create a MICRO STORY that directly embodies the CCN's understanding.

CCN'S ANALYSIS (in their own words):
"${rawAnalysis}"

CORE ELEMENTS FROM CCN:
- Market Context: ${market.toUpperCase()} (${culturalContext})
- Emotional Core: ${emotion}
- Story Archetype: ${archetype}
- Tone: ${tone} (Keywords: ${toneConfig.keywords.join(', ')})
- Scene/Setting: ${scene}
- Seed Moment: "${seedMoment}"
- Audience: ${audience}
${brand ? `- Brand: ${brand.name}` : ''}

CRITICAL INSTRUCTIONS:
1. **Write in English**: The entire story must be in English
2. **Cultural Infusion**: Infuse ${market} cultural elements while maintaining English language
3. **Direct Embodiment**: The story MUST directly embody what the CCN said: "${rawAnalysis}"
4. **Character Inclusion**: If the CCN mentioned a specific subject, they MUST be in the story
5. **Emotional Accuracy**: Capture the exact ${emotion} feeling the CCN identified
6. **Scene Setting**: Set the story in ${scene} as the CCN described
7. **Conciseness**: 5-10 lines maximum, emotionally complete
8. **Beat Structure**: Include a simple beat sheet with 3 scenes

CULTURAL INFUSION EXAMPLES:
- For Nigerian context: Use Nigerian names, settings (Lagos, Abuja), cultural references (jollof rice, suya), occasional Pidgin phrases
- For UK context: Use British names, settings (London, Manchester), cultural references (pub culture, tea), British slang
- For French context: Use French names, settings (Paris, Marseille), cultural references (cafés, wine), occasional French words in italics

OUTPUT FORMAT:
Return ONLY valid JSON in this EXACT structure:
{
  "microStory": "Your 5-10 line micro story in ENGLISH that embodies '${rawAnalysis}'...",
  "beatSheet": [
    {
      "beat": "Opening",
      "description": "Brief description of the opening scene that sets up the story",
      "visualCues": ["visual element 1", "visual element 2", "visual element 3"],
      "emotion": "${emotion}"
    },
    {
      "beat": "Development",
      "description": "Brief description of the middle scene where the story develops",
      "visualCues": ["visual element 1", "visual element 2", "visual element 3"],
      "emotion": "${emotion}"
    },
    {
      "beat": "Resolution",
      "description": "Brief description of the ending scene that concludes the story",
      "visualCues": ["visual element 1", "visual element 2", "visual element 3"],
      "emotion": "${emotion}"
    }
  ],
  "metadata": {
    "title": "Short title in English",
    "market": "${market}",
    "archetype": "${archetype}",
    "tone": "${tone}",
    "totalBeats": 3,
    "estimatedDuration": "15s"
  }
}

STORY MUST BE IN ENGLISH WHILE INFUSING ${market.toUpperCase()} CULTURE.`;
}

// Build expansion prompt
function buildExpansionPrompt(
  market: string,
  currentStory: string,
  expansionType: string,
  tone: string,
  rawAnalysis: string,
  seedMoment: string,
  brand: any,
  toneConfig: MarketTone
): string {
  const marketContext = {
    ng: 'Use Nigerian cultural context but WRITE IN ENGLISH.',
    uk: 'Use British cultural context but WRITE IN ENGLISH.',
    fr: 'Use French cultural context but WRITE IN ENGLISH.'
  };

  const culturalContext = marketContext[market as keyof typeof marketContext] || 'Write in English.';

  const expansionInstructions: Record<string, string> = {
    'expand': 'Expand this micro story into a more detailed narrative while maintaining its emotional core and connection to the original moment.',
    'gentler': 'Make this story gentler and more subtle. Soften the language, reduce intensity, and focus on tender moments while staying true to the original insight.',
    'harsher': 'Make this story harsher and more intense. Use sharper language, increase conflict, and focus on raw emotions while staying true to the original insight.',
    '60-second': 'Expand this into a complete 60-second narrative with a full beat sheet, staying deeply connected to the original CCN understanding.'
  };

  const isFullVersion = expansionType === '60-second';

  return `CRITICAL INSTRUCTION: WRITE THE ENTIRE STORY IN ENGLISH.

JSON RESPONSE REQUIRED. You are expanding a story based on the CCN's original understanding.

ORIGINAL CCN ANALYSIS:
"${rawAnalysis}"

CURRENT MICRO STORY:
${currentStory}

EXPANSION TYPE: ${expansionType.toUpperCase()}
MARKET CONTEXT: ${market.toUpperCase()} (${culturalContext})
INSTRUCTION: ${expansionInstructions[expansionType]}

ADDITIONAL CONTEXT:
- Tone: ${tone} (Keywords: ${toneConfig.keywords.join(', ')})
- Original Seed Moment: "${seedMoment}"
${brand ? `- Brand: ${brand.name}` : ''}

${isFullVersion ? `
TASK FOR 60-SECOND VERSION:
1. Create a full narrative paragraph (200-250 words) in ENGLISH that expands the micro story
2. Create a beat sheet with 6 scenes that reflect the CCN's original insight
3. Each beat must include: beat name, description, visualCues array, emotion, duration

JSON OUTPUT FORMAT (60-second):
{
  "expandedStory": "Full narrative paragraph in ENGLISH that embodies '${rawAnalysis}'...",
  "beatSheet": [
    {
      "beat": "Opening Scene",
      "description": "Description of opening scene",
      "visualCues": ["cue1", "cue2", "cue3"],
      "emotion": "emotion name",
      "duration": "8s"
    },
    {
      "beat": "Development Scene 1",
      "description": "Description of first development scene",
      "visualCues": ["cue1", "cue2", "cue3"],
      "emotion": "emotion name",
      "duration": "10s"
    },
    {
      "beat": "Development Scene 2",
      "description": "Description of second development scene",
      "visualCues": ["cue1", "cue2", "cue3"],
      "emotion": "emotion name",
      "duration": "10s"
    },
    {
      "beat": "Climax",
      "description": "Description of climax scene",
      "visualCues": ["cue1", "cue2", "cue3"],
      "emotion": "emotion name",
      "duration": "12s"
    },
    {
      "beat": "Resolution Scene 1",
      "description": "Description of first resolution scene",
      "visualCues": ["cue1", "cue2", "cue3"],
      "emotion": "emotion name",
      "duration": "10s"
    },
    {
      "beat": "Final Scene",
      "description": "Description of final scene",
      "visualCues": ["cue1", "cue2", "cue3"],
      "emotion": "emotion name",
      "duration": "10s"
    }
  ],
  "metadata": {
    "title": "Title in English (include '60s' and reference to original insight)",
    "market": "${market}",
    "archetype": "${toneConfig.archetypeLinks[0] || 'Against All Odds'}",
    "tone": "${tone}",
    "totalBeats": 6,
    "estimatedDuration": "60s"
  }
}
` : `
TASK FOR OTHER EXPANSIONS:
Expand the micro story while following the ${expansionType} instruction.
Maintain the same emotional connection to: "${rawAnalysis}"
WRITE IN ENGLISH.

JSON OUTPUT FORMAT (other expansions):
{
  "expandedStory": "Expanded version in ENGLISH that stays true to '${rawAnalysis}'...",
  "beatSheet": [
    {
      "beat": "Opening",
      "description": "Brief description",
      "visualCues": ["cue1", "cue2", "cue3"],
      "emotion": "emotion name"
    },
    {
      "beat": "Middle",
      "description": "Brief description",
      "visualCues": ["cue1", "cue2", "cue3"],
      "emotion": "emotion name"
    },
    {
      "beat": "Ending",
      "description": "Brief description",
      "visualCues": ["cue1", "cue2", "cue3"],
      "emotion": "emotion name"
    }
  ],
  "metadata": {
    "title": "Title in English (include expansion type)",
    "market": "${market}",
    "archetype": "${toneConfig.archetypeLinks[0] || 'Against All Odds'}",
    "tone": "${tone}",
    "totalBeats": 3,
    "estimatedDuration": "30s"
  }
}
`}

IMPORTANT: Return valid JSON only. Do not include any other text.`;
}

// Build purpose adaptation prompt
function buildPurposeAdaptationPrompt(
  market: string,
  purpose: string,
  currentStory: string,
  tone: string,
  rawAnalysis: string,
  seedMoment: string,
  brand: any,
  toneConfig: MarketTone
): string {
  const marketContext = {
    ng: 'Use Nigerian cultural context but WRITE IN ENGLISH.',
    uk: 'Use British cultural context but WRITE IN ENGLISH.',
    fr: 'Use French cultural context but WRITE IN ENGLISH.'
  };

  const culturalContext = marketContext[market as keyof typeof marketContext] || 'Write in English.';

  return `CRITICAL INSTRUCTION: WRITE THE ENTIRE STORY IN ENGLISH.

JSON RESPONSE REQUIRED. You are adapting a story based on user's specific purpose.

ORIGINAL CCN ANALYSIS:
"${rawAnalysis}"

CURRENT STORY (base version):
${currentStory}

USER'S PURPOSE/USE CASE:
"${purpose}"

ADDITIONAL CONTEXT:
- Market: ${market.toUpperCase()} (${culturalContext})
- Tone: ${tone} (Keywords: ${toneConfig.keywords.join(', ')})
- Original Seed Moment: "${seedMoment}"
${brand ? `- Brand: ${brand.name}` : ''}

CRITICAL INSTRUCTIONS:
1. **Write in English**: The entire adapted story must be in English
2. **Maintain Core Story**: Keep the essential narrative, characters, and emotional core from the original story
3. **Adapt for Purpose**: Modify the story to better suit: "${purpose}"
4. **Consistency**: Don't change the fundamental meaning or message
5. **Tone Adjustment**: Adjust tone/style as needed for the purpose while keeping the market authenticity
6. **Length**: Keep similar length (5-10 lines)
7. **Cultural Authenticity**: Maintain ${market} market authenticity while writing in English
8. **Include Beat Sheet**: Always include a beat sheet with 3 scenes

ADAPTATION GUIDELINES:
- If purpose mentions "brand post": Add brand-friendly elements, subtle call-to-action, consistent brand voice
- If purpose mentions "Instagram": Make it more visual, use hashtag-ready language, shorter punchy lines
- If purpose mentions "LinkedIn": More professional tone, business context, career-oriented framing
- If purpose mentions "video script": Add scene-setting language, dialogue cues, timing hints
- If purpose mentions "Twitter/X": Concise, impactful lines, thread-ready structure

JSON OUTPUT FORMAT:
{
  "adaptedStory": "Your adapted version in ENGLISH that maintains the original story but fits: '${purpose}'",
  "beatSheet": [
    {
      "beat": "Opening",
      "description": "Brief description of opening scene adapted for ${purpose}",
      "visualCues": ["visual cue 1", "visual cue 2", "visual cue 3"],
      "emotion": "appropriate emotion"
    },
    {
      "beat": "Core Moment",
      "description": "Brief description of main scene adapted for ${purpose}",
      "visualCues": ["visual cue 1", "visual cue 2", "visual cue 3"],
      "emotion": "appropriate emotion"
    },
    {
      "beat": "Conclusion",
      "description": "Brief description of conclusion scene adapted for ${purpose}",
      "visualCues": ["visual cue 1", "visual cue 2", "visual cue 3"],
      "emotion": "appropriate emotion"
    }
  ],
  "metadata": {
    "title": "Title in English reflecting adaptation for: ${purpose.substring(0, 30)}",
    "market": "${market}",
    "archetype": "${toneConfig.archetypeLinks[0] || 'Against All Odds'}",
    "tone": "${tone}",
    "totalBeats": 3,
    "estimatedDuration": "15s",
    "purpose": "${purpose}"
  }
}

IMPORTANT: 
- The story must still embody the original CCN analysis: "${rawAnalysis}"
- Write the entire story in English
- Return valid JSON only. Do not include any other text.`;
}

// Build legacy prompt (fallback)
function buildLegacyPrompt(
  market: string,
  need: string,
  archetype: string,
  tone: string,
  context: string,
  brand: any,
  toneConfig: MarketTone
): string {
  const marketContext = {
    ng: 'Use Nigerian cultural context but WRITE IN ENGLISH.',
    uk: 'Use British cultural context but WRITE IN ENGLISH.',
    fr: 'Use French cultural context but WRITE IN ENGLISH.'
  };

  return `CRITICAL INSTRUCTION: WRITE THE ENTIRE STORY IN ENGLISH.

You are an expert storyteller creating culturally grounded narratives for ${market.toUpperCase()} market.

INPUTS:
- Market: ${market.toUpperCase()} (${marketContext[market as keyof typeof marketContext]})
- Motivational Need (Maslow): ${need}
- Story Archetype: ${archetype}
- Tone: ${tone} (Keywords: ${toneConfig.keywords.join(', ')})
- Visual Style: ${toneConfig.visualDescriptors.join(', ')}
- Context/Scene: ${context}
${brand ? `- Brand: ${brand.name}` : ''}

TASK:
Create a compelling 30-second narrative with beat sheet structure. WRITE IN ENGLISH.

Return ONLY valid JSON with story, beatSheet, and metadata.`;
}

// Main handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    const { 
      market = 'ng',
      semanticExtraction,
      need, archetype, tone, context,
      brand,
      requestType = 'micro-story',
      expansionType,
      currentStory,
      originalContext,
      purpose
    }: GenerateStoryRequest = req.body;

    // Validate market
    const validMarkets = ['ng', 'uk', 'fr'];
    const storyMarket = validMarkets.includes(market) ? market : 'ng';

    // Load market tone data
    const marketData = defaultMarketTones[storyMarket as keyof typeof defaultMarketTones] || defaultMarketTones.ng;
    
    // Use semantic extraction or legacy fields
    const storyEmotion = semanticExtraction?.emotion || need || 'meaningful';
    const storyArchetype = semanticExtraction?.pathway ? 
      mapPathwayToArchetype(semanticExtraction.pathway) : 
      archetype || 'Against All Odds';
    const storyTone = determineToneFromEmotion(storyEmotion) || tone || 'Cinematic';
    const storyContext = semanticExtraction?.intentSummary || context || 'A personal moment';
    const rawAnalysis = semanticExtraction?.rawAnalysis || storyContext;
    const seedMoment = semanticExtraction?.seedMoment || originalContext || storyContext;
    
    const toneConfig = marketData.tones.find((t: MarketTone) => t.name === storyTone) || marketData.tones[0];

    // Build prompt based on request type
    let prompt: string;
    let responseFormat: 'micro' | 'full' = 'micro';

    if (requestType === 'micro-story') {
      prompt = buildMicroStoryPrompt(
        storyMarket,
        storyEmotion,
        storyArchetype,
        storyTone,
        rawAnalysis,
        seedMoment,
        semanticExtraction,
        brand,
        toneConfig
      );
      responseFormat = 'micro';
    } else if (requestType === 'expansion') {
      if (!currentStory) {
        return res.status(400).json({
          success: false,
          error: 'currentStory is required for expansion'
        });
      }
      
      prompt = buildExpansionPrompt(
        storyMarket,
        currentStory,
        expansionType || 'expand',
        storyTone,
        rawAnalysis,
        seedMoment,
        brand,
        toneConfig
      );
      responseFormat = expansionType === '60-second' ? 'full' : 'micro';
    } else if (requestType === 'purpose-adaptation') {
      if (!purpose || !currentStory) {
        return res.status(400).json({
          success: false,
          error: 'purpose and currentStory are required for purpose adaptation'
        });
      }
      
      prompt = buildPurposeAdaptationPrompt(
        storyMarket,
        purpose,
        currentStory,
        storyTone,
        rawAnalysis,
        seedMoment,
        brand,
        toneConfig
      );
      responseFormat = 'micro';
    } else {
      // Legacy fallback
      prompt = buildLegacyPrompt(
        storyMarket,
        storyEmotion,
        storyArchetype,
        storyTone,
        storyContext,
        brand,
        toneConfig
      );
      responseFormat = 'full';
    }

    console.log(`Generating ${requestType} story for ${storyMarket} market`);
    console.log(`Tone: ${storyTone}, Emotion: ${storyEmotion}, Archetype: ${storyArchetype}`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are the Story Shaping Engine for Narratives.XO. You create emotionally resonant stories that directly reflect the user's moment. ALWAYS WRITE IN ENGLISH while infusing cultural context. Return only valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    const generated = JSON.parse(content);
    console.log(`Generated story structure:`, {
      hasMicroStory: !!generated.microStory,
      hasStory: !!generated.story,
      hasBeatSheet: !!generated.beatSheet,
      beatSheetLength: generated.beatSheet?.length
    });
    
    // Validate and structure response
    let responseData: any = {
      success: true,
      metadata: generated.metadata || {
        title: generated.title || 'Untitled Story',
        market: storyMarket,
        archetype: storyArchetype,
        tone: storyTone,
        totalBeats: generated.beatSheet?.length || 0,
        estimatedDuration: responseFormat === 'micro' ? '15s' : '60s'
      }
    };

    // CRITICAL FIX: Always include beatSheet if available
    if (generated.beatSheet && Array.isArray(generated.beatSheet)) {
      responseData.beatSheet = generated.beatSheet;
      console.log(`Beat sheet included with ${generated.beatSheet.length} scenes`);
    }

    if (responseFormat === 'micro') {
      responseData.microStory = generated.microStory || generated.story;
      responseData.story = generated.microStory || generated.story;
      
      // FALLBACK: Create simple beat sheet if not provided
      if (!responseData.beatSheet && responseData.microStory) {
        console.log('Creating fallback beat sheet for micro story');
        responseData.beatSheet = [
          {
            beat: "Opening",
            description: responseData.microStory.split('.')[0] + ".",
            visualCues: ["intimate close-up", "emotional expression", "natural lighting"],
            emotion: storyEmotion
          },
          {
            beat: "Development",
            description: responseData.microStory.split('.').slice(1, -1).join('.') + ".",
            visualCues: ["environmental details", "character interaction", "movement"],
            emotion: storyEmotion
          },
          {
            beat: "Resolution",
            description: responseData.microStory.split('.').slice(-1)[0] + ".",
            visualCues: ["symbolic imagery", "reflective moment", "closure"],
            emotion: storyEmotion
          }
        ];
        console.log('Fallback beat sheet created');
      }
    } else {
      responseData.story = generated.story || generated.expandedStory;
      if (!responseData.beatSheet && generated.beatSheet) {
        responseData.beatSheet = generated.beatSheet;
      }
    }

    // Add expansion-specific data
    if (requestType === 'expansion') {
      responseData.expandedStory = generated.expandedStory || generated.story || responseData.story;
      if (generated.metadata) {
        responseData.metadata = {
          ...responseData.metadata,
          ...generated.metadata
        };
      }
    }
    
    // Add purpose-adaptation data
    if (requestType === 'purpose-adaptation') {
      responseData.adaptedStory = generated.adaptedStory || generated.story || responseData.story;
      if (generated.metadata) {
        responseData.metadata = {
          ...responseData.metadata,
          ...generated.metadata,
          purpose: purpose
        };
      }
    }

    // Ensure totalBeats is set correctly
    if (responseData.beatSheet) {
      responseData.metadata.totalBeats = responseData.beatSheet.length;
    }

    console.log(`✓ ${responseFormat === 'micro' ? 'Micro story' : 'Full story'} generated: "${responseData.metadata.title}"`);
    console.log(`Final response:`, {
      hasBeatSheet: !!responseData.beatSheet,
      beatSheetLength: responseData.beatSheet?.length,
      metadata: responseData.metadata
    });

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Story generation error:', error);
    
    // Create a fallback response WITH beatSheet
    const fallbackResponse = {
      success: false,
      story: "I had trouble shaping your story. The moment you described feels meaningful and worth exploring. Perhaps try describing it in a different way?",
      microStory: "This moment matters. Let's explore it together from another angle.",
      beatSheet: [
        {
          beat: "Opening",
          description: "A meaningful moment worth exploring further.",
          visualCues: ["thoughtful expression", "meaningful setting", "emotional lighting"],
          emotion: "meaningful"
        },
        {
          beat: "Reflection",
          description: "The significance of this experience becomes clearer.",
          visualCues: ["deeper perspective", "symbolic elements", "emotional depth"],
          emotion: "meaningful"
        },
        {
          beat: "Insight",
          description: "Understanding emerges from this personal moment.",
          visualCues: ["clarity", "resolution", "forward movement"],
          emotion: "meaningful"
        }
      ],
      metadata: {
        title: "Meaningful Moment",
        market: req.body?.market || 'ng',
        archetype: "Against All Odds",
        tone: "Heartfelt",
        totalBeats: 3,
        estimatedDuration: "15s"
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return res.status(500).json(fallbackResponse);
  }
}