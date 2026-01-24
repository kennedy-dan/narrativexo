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
// HELPER FUNCTIONS
// ============================================================================

function generateTitleFromMeaning(meaningContract: MeaningContract): string {
  const { interpretedMeaning, seedMoment } = meaningContract;
  const { emotionalState, coreTheme } = interpretedMeaning;
  
  if (seedMoment) {
    const firstSentence = seedMoment.split(/[.!?]+/)[0]?.trim();
    if (firstSentence && firstSentence.length < 60) {
      return firstSentence;
    }
  }
  
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
  
  return sentences.slice(0, 5).map((sentence, index) => ({
    beat: beatNames[index] || `Point ${index + 1}`,
    description: sentence.trim(),
    visualCues: extractVisualCuesFromMeaning(sentence, meaningContract).slice(0, 4),
    emotion: meaningContract.interpretedMeaning.emotionalState,
    duration: '5s',
  }));
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
  
  return ['The Beginning', 'The Development', 'The Turning', 'The Realization', 'The After'];
}

function extractVisualCuesFromMeaning(sentence: string, meaningContract: MeaningContract): string[] {
  const { interpretedMeaning } = meaningContract;
  const cues: string[] = [];
  
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
  
  if (interpretedMeaning.narrativeTension.includes('contrast')) {
    cues.push('juxtaposed elements', 'divided frame', 'conflicting directions');
  }
  
  if (interpretedMeaning.emotionalDirection === 'inward') {
    cues.push('close perspective', 'subjective view', 'internal focus');
  }
  
  return cues;
}

// ============================================================================
// XO-MODE HELPER FUNCTIONS
// ============================================================================

function hasExcessiveRepetition(text: string): boolean {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const wordCounts: Record<string, number> = {};
  
  // Count word frequencies
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, '');
    if (cleanWord.length > 3) { // Only count significant words
      wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
    }
  }
  
  // Check for excessive repetition
  for (const [word, count] of Object.entries(wordCounts)) {
    const totalWords = words.length;
    const percentage = (count / totalWords) * 100;
    
    // If a word appears more than 25% of the time in short text
    if (percentage > 25 || count > 3) {
      console.log(`⚠️ Repetition detected: "${word}" appears ${count} times (${percentage.toFixed(1)}%)`);
      return true;
    }
  }
  
  // Check for phrase repetition
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceKeywords = sentences.map(s => {
    const words = s.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    return words.slice(0, 3).join(' '); // First 3 significant words as key
  });
  
  // Check if multiple sentences start with similar words
  const uniqueStarts = new Set(sentenceKeywords);
  if (sentenceKeywords.length > 2 && uniqueStarts.size <= 1) {
    console.log('⚠️ Sentence structure repetition detected');
    return true;
  }
  
  return false;
}

function deduplicateText(text: string): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const uniqueSentences: string[] = [];
  const seenKeywords = new Set<string>();
  
  for (const sentence of sentences) {
    // Extract key words from sentence (nouns and verbs)
    const words = sentence.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const keywords = words.slice(0, 4).join(' '); // First 4 significant words
    
    // Skip if we've seen similar content
    if (!seenKeywords.has(keywords) || uniqueSentences.length < 2) {
      uniqueSentences.push(sentence.trim());
      seenKeywords.add(keywords);
    } else {
      console.log(`🔄 Removing duplicate sentence: "${sentence.substring(0, 50)}..."`);
    }
  }
  
  // Ensure we still have 4-5 lines
  if (uniqueSentences.length >= 4) {
    return uniqueSentences.slice(0, 5).map(s => s + '.').join(' ');
  }
  
  return text; // Return original if deduplication would make it too short
}

function applyXOCompression(text: string): string {
  // First ensure complete sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let completeText = sentences.join(' ').trim();
  
  // If the last sentence is incomplete, remove it
  if (!completeText.match(/[.!?]$/)) {
    const lastPeriod = completeText.lastIndexOf('.');
    const lastQuestion = completeText.lastIndexOf('?');
    const lastExclamation = completeText.lastIndexOf('!');
    const lastPunctuation = Math.max(lastPeriod, lastQuestion, lastExclamation);
    
    if (lastPunctuation > -1) {
      completeText = completeText.substring(0, lastPunctuation + 1).trim();
    }
  }
  
  // Now apply compression with anti-repetition
  const words = completeText.split(/\s+/);
  
  // Target 60% of original length (40% reduction)
  const targetLength = Math.max(20, Math.floor(words.length * 0.6));
  
  // Advanced compression: remove redundant phrases, adjectives, and repetitive words
  const compressedWords = words.filter((word, index, arr) => {
    const lowerWord = word.toLowerCase();
    
    // Keep first and last few words
    if (index < 4 || index > words.length - 4) return true;
    
    // Remove common filler adjectives
    const fillerAdjectives = ['very', 'really', 'quite', 'rather', 'somewhat', 'extremely', 
                             'incredibly', 'amazingly', 'beautiful', 'wonderful', 'lovely',
                             'nice', 'great', 'good', 'bad', 'terrible', 'awful', 'horrible',
                             'truly', 'absolutely', 'completely', 'totally', 'utterly'];
    
    if (fillerAdjectives.includes(lowerWord)) return false;
    
    // Check for word repetition within close proximity
    if (word.length > 3) {
      // Look back up to 5 words for repetition
      const recentWords = arr.slice(Math.max(0, index - 5), index);
      const hasRecentRepeat = recentWords.some(w => 
        w.toLowerCase() === lowerWord && w.length > 3
      );
      
      if (hasRecentRepeat) {
        console.log(`🔄 Removing repeated word: "${word}"`);
        return false;
      }
    }
    
    return true;
  }).slice(0, targetLength);
  
  return compressedWords.join(' ');
}

function enforceXORules(text: string, isMicroStory: boolean = true): string {
  let result = text;
  
  // 1. Ensure complete sentences
  if (!result.match(/[.!?]$/)) {
    result = result.replace(/[.!?]*$/, '.');
  }
  
  // 2. Remove scene-setting
  result = result.replace(/^(In|At|On|Inside|Outside|Within|Under|Over|Above|Below|Behind|Between|Among|During|While|When|As|After|Before|Since|Until|Once)[^,.!?]*[,.!?\s]+/i, '');
  
  // 3. Remove emotional padding
  result = result.replace(/!/g, '.');
  
  // 4. Remove metaphors (simplified)
  result = result.replace(/\b(?:like|as if|as though)\s+(?:a|an|the)\s+\w+/gi, '');
  
  // 5. Remove exposition/teaching tone
  const expositionPatterns = [
    /\bthis is\b/gi,
    /\bthat means\b/gi,
    /\bin other words\b/gi,
    /\bfor example\b/gi,
    /\bspecifically\b/gi,
    /\bessentially\b/gi,
    /\bbasically\b/gi,
    /\bfundamentally\b/gi
  ];
  
  expositionPatterns.forEach(pattern => {
    result = result.replace(pattern, '');
  });
  
  // 6. Apply line limit ONLY for micro-stories (4-5 lines)
  if (isMicroStory) {
    const sentences = result.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length > 5) {
      // Keep exactly 4-5 lines (prefer 5 if possible)
      const linesToKeep = Math.min(5, Math.max(4, sentences.length));
      result = sentences.slice(0, linesToKeep).map(s => s.trim() + '.').join(' ');
    } else if (sentences.length < 4) {
      // Need at least 4 lines - try to expand
      const words = result.split(/\s+/);
      if (words.length >= 12) {
        // Try to split into 4 roughly equal parts
        const chunkSize = Math.ceil(words.length / 4);
        const chunks = [];
        for (let i = 0; i < 4; i++) {
          const chunk = words.slice(i * chunkSize, (i + 1) * chunkSize);
          if (chunk.length > 0) {
            chunks.push(chunk.join(' ').trim() + '.');
          }
        }
        result = chunks.join(' ');
      }
    }
  }
  
  // 7. Apply deduplication
  if (hasExcessiveRepetition(result)) {
    console.log('🔄 Applying deduplication due to repetition');
    result = deduplicateText(result);
  }
  
  // 8. Clean up
  result = result.replace(/\s+/g, ' ').trim();
  result = result.replace(/\.\.+/g, '.');
  result = result.replace(/\s\./g, '.');
  result = result.replace(/\s+/g, ' ');
  
  return result;
}

function checkXOViolations(text: string, isMicroStory: boolean = true): string[] {
  const violations: string[] = [];
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Check line limit for micro-stories (4-5 lines)
  if (isMicroStory) {
    if (sentences.length > 5) violations.push('Exceeds 5 lines (should be 4-5)');
    if (sentences.length < 4) violations.push('Too short (less than 4 lines)');
  }
  
  // Check for scene-setting
  if (/^(In|At|On|Inside|Outside)/i.test(text.trim())) {
    violations.push('Contains scene-setting');
  }
  
  // Check for metaphors
  if (/\blike\s+(?:a|an|the)\s+\w+/i.test(text)) {
    violations.push('Contains metaphors');
  }
  
  // Check for exposition
  if (/this is|that means|in other words|for example|specifically/i.test(text)) {
    violations.push('Contains exposition/teaching tone');
  }
  
  // Check for repetition
  if (hasExcessiveRepetition(text)) {
    violations.push('Contains excessive repetition');
  }
  
  return violations;
}

// ============================================================================
// PROMPT BUILDING (WITH ANTI-REPETITION FOCUS)
// ============================================================================

function buildXOPrompt(meaningContract: MeaningContract, originalInput?: string, isMicroStory: boolean = true): string {
  const { interpretedMeaning, seedMoment } = meaningContract;
  const { emotionalState, emotionalDirection, narrativeTension, intentCategory, coreTheme } = interpretedMeaning;
  
  const lineLimitRule = isMicroStory ? 
    "1. 4-5 COMPLETE lines maximum (not cut off mid-sentence)" :
    "1. Write complete, flowing text (no artificial line limits)";
  
  return `
XO-MODE TEXT GENERATION (ANTI-REPETITION FOCUS):

USER INPUT:
"${originalInput || seedMoment}"

MEANING TO WORK FROM:
- Emotional quality: ${emotionalState}
- Emotional direction: ${emotionalDirection}
- Narrative tension: ${narrativeTension}
- Intent: ${intentCategory}
- Theme: ${coreTheme}

XO HARD RULES (MUST OBEY):
${lineLimitRule}
2. NO exposition or teaching tone ("this means", "for example", etc.)
3. NO scene-setting ("In a café...", "At the office...")
4. NO metaphors by default
5. NOT prose - if it reads like a blog paragraph, it fails
6. Mandatory narrative compression: reduce by ~40%, remove adjectives
7. NO invention: no people, names, scenes, settings, sensory detail unless user explicitly provided them
8. XO is for clarity, alignment, reusability - NOT entertainment
9. If it sounds like it's trying to impress, it fails
10. Feels like a conclusion, not a story
11. MUST write complete sentences - do not cut off mid-thought
12. End with proper punctuation

CRITICAL ANTI-REPETITION RULES:
13. NO word repetition - use synonyms, vary vocabulary
14. NO sentence structure repetition - vary sentence beginnings and patterns
15. NO idea repetition - each line should add new insight
16. Avoid using the same root words multiple times
17. If you mention a concept once, don't repeat it verbatim
18. Each sentence should introduce fresh vocabulary

MICRO-STORY SPECIFIC:
- ${isMicroStory ? 'Exactly 4-5 lines. Each line should be a distinct, non-repetitive thought.' : 'No line limit. Write naturally.'}
- Be concise but complete
- Every sentence must stand on its own and add unique value

Generate XO-compliant output (complete, no markdown, just the text):
`;
}

function buildExpansionPrompt(
  currentStory: string,
  meaningContract: MeaningContract,
  purpose?: string,
  isMicroStory: boolean = false
): string {
  const { interpretedMeaning, seedMoment } = meaningContract;
  
  const lineLimitRule = isMicroStory ?
    "1. Keep 4-5 lines maximum" :
    "1. Write naturally without artificial line limits";
  
  return `
EXPANDING WHILE HONORING XO RULES (ANTI-REPETITION):

ORIGINAL INPUT:
"${seedMoment}"

CURRENT XO TEXT:
"${currentStory}"

MEANING TO HONOR:
- Emotional quality: ${interpretedMeaning.emotionalState}
- Narrative tension: ${interpretedMeaning.narrativeTension}
- Theme: ${interpretedMeaning.coreTheme}

${purpose ? `PURPOSE: ${purpose}` : 'Expand this naturally'}

XO EXPANSION RULES:
${lineLimitRule}
2. Stay XO-compliant (no scene-setting, no exposition, etc.)
3. Expand meaning density, not word count
4. Add clarity, not decoration
5. No invention of people, names, scenes
6. Write COMPLETE sentences - do not cut off
7. End properly with punctuation
8. AVOID REPETITION: Do not repeat words or concepts from the original text
9. Introduce new vocabulary and perspectives
${isMicroStory ? '10. After expansion, text should still be 4-5 lines' : '10. No line limit constraints'}

Expand while staying XO-compliant and avoiding repetition:
`;
}

function buildMeaningBasedPrompt(meaningContract: MeaningContract, originalInput?: string): string {
  const { interpretedMeaning, seedMoment } = meaningContract;
  const { emotionalState, emotionalDirection, narrativeTension, intentCategory, coreTheme } = interpretedMeaning;
  
  return `
STORY GENERATION FROM MEANING (AVOID REPETITION):

USER'S ORIGINAL WORDS:
"${originalInput || seedMoment}"

WHAT I UNDERSTAND FROM THIS:
- Emotional quality: ${emotionalState}
- Emotional direction: ${emotionalDirection}
- Narrative tension: ${narrativeTension}
- What you seem to want to do: ${intentCategory}
- Core theme: ${coreTheme}

IMPORTANT: Avoid word repetition, sentence structure repetition, and idea repetition.

Write a micro story (4-5 sentences) that captures the essence of the meaning, not the literal words:
`;
}

// ============================================================================
// MAIN HANDLER
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
      skipBrand,
      useXOMode = true
    }: GenerateStoryRequest & { useXOMode?: boolean } = req.body;

    if (!meaningContract) {
      return res.status(400).json({ 
        success: false,
        error: 'Meaning contract is required' 
      });
    }

    console.log('📦 Received request:', {
      requestType,
      useXOMode,
      emotionalState: meaningContract.interpretedMeaning.emotionalState,
    });

    if (meaningContract.certaintyMode === 'clarification-needed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot generate: meaning requires clarification'
      });
    }

    // Determine if this should be treated as micro-story
    const isMicroStory = requestType === 'micro-story';
    
    let storyPrompt = '';
    let systemMessage = '';
    let maxTokens = 250;
    
    if (requestType === 'expansion' && currentStory) {
      storyPrompt = buildExpansionPrompt(currentStory, meaningContract, purpose, isMicroStory);
      systemMessage = useXOMode 
        ? `You expand XO-compliant text. AVOID REPETITION. Use varied vocabulary. ${isMicroStory ? 'Keep 4-5 lines.' : 'No line limit.'}`
        : `You expand stories while staying true to their original emotional meaning.`;
      maxTokens = isMicroStory ? 300 : 400;
    } else if (requestType === 'purpose-adaptation' && purpose) {
      storyPrompt = `${buildXOPrompt(meaningContract, originalInput, isMicroStory)}\n\nAdapt for: ${purpose}`;
      systemMessage = useXOMode
        ? `You adapt XO-compliant text for specific purposes. MAINTAIN XO RULES. AVOID REPETITION. ${isMicroStory ? '4-5 lines max.' : 'Write naturally.'}`
        : `You adapt stories for specific purposes while honoring their core meaning.`;
      maxTokens = isMicroStory ? 250 : 350;
    } else {
      storyPrompt = useXOMode 
        ? buildXOPrompt(meaningContract, originalInput, isMicroStory)
        : buildMeaningBasedPrompt(meaningContract, originalInput);
      systemMessage = useXOMode
        ? `You write XO-compliant text. CRITICAL: AVOID WORD REPETITION. Vary sentence structure. ${isMicroStory ? '4-5 lines max.' : 'Write naturally.'}`
        : `You write simple, emergent stories that grow from emotional meaning.`;
      maxTokens = isMicroStory ? 220 : 350;
    }

    // Add brand context
    if (brandContext?.name && !skipBrand) {
      storyPrompt += `\n\nContext: This is for ${brandContext.name}. Integrate naturally without violating XO rules.`;
    }

    // Adjust temperature - slightly higher for more variation
    const temperature = meaningContract.certaintyMode === 'reflection-only' ? 0.3 : 0.5;

    console.log(`📝 Generating ${useXOMode ? 'XO' : 'regular'} ${requestType}...`);
    console.log(`📊 Config: maxTokens=${maxTokens}, isMicroStory=${isMicroStory}, lines=${isMicroStory ? '4-5' : 'no limit'}`);

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
      temperature, // Higher temperature helps avoid repetition
      max_tokens: maxTokens,
      frequency_penalty: 0.7, // Add frequency penalty to discourage repetition
      presence_penalty: 0.3, // Add presence penalty for more varied vocabulary
    });

    let storyContent = completion.choices[0].message.content?.trim() || '';
    
    if (!storyContent) {
      throw new Error('No content generated');
    }

    console.log('📖 Raw generated:', storyContent.substring(0, 150) + (storyContent.length > 150 ? '...' : ''));
    
    // Check for repetition immediately
    const hasRepetition = hasExcessiveRepetition(storyContent);
    console.log(`📊 Raw lines: ${storyContent.split(/[.!?]+/).filter(s => s.trim().length > 0).length}, Repetition: ${hasRepetition ? 'YES' : 'NO'}`);

    // Apply XO post-processing if in XO mode
    if (useXOMode) {
      const initialContent = storyContent;
      const initialLines = storyContent.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
      
      // First ensure completeness
      if (!storyContent.match(/[.!?]$/)) {
        const lastPeriod = storyContent.lastIndexOf('.');
        const lastQuestion = storyContent.lastIndexOf('?');
        const lastExclamation = storyContent.lastIndexOf('!');
        const lastPunctuation = Math.max(lastPeriod, lastQuestion, lastExclamation);
        
        if (lastPunctuation > -1) {
          storyContent = storyContent.substring(0, lastPunctuation + 1);
        } else {
          storyContent = storyContent + '.';
        }
      }
      
      // Apply XO rules (includes deduplication)
      storyContent = enforceXORules(storyContent, isMicroStory);
      
      // Apply compression (but ensure completeness)
      const compressedContent = applyXOCompression(storyContent);
      
      // Only use compression if it maintains completeness and line constraints
      if (compressedContent.match(/[.!?]$/) && compressedContent.length > 20) {
        const compressedLines = compressedContent.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        
        // For micro-stories, check if compression maintains 4-5 lines
        if (!isMicroStory || (compressedLines >= 4 && compressedLines <= 5)) {
          storyContent = compressedContent;
        }
      }
      
      const finalLines = storyContent.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
      const violations = checkXOViolations(storyContent, isMicroStory);
      const stillHasRepetition = hasExcessiveRepetition(storyContent);
      
      // Regenerate if we have issues
      const shouldRegenerate = 
        violations.some(v => v.includes('lines') || v.includes('short') || v.includes('Exceeds')) ||
        !storyContent.match(/[.!?]$/) ||
        storyContent.length < 30 ||
        (isMicroStory && (finalLines < 4 || finalLines > 5)) ||
        stillHasRepetition;
      
      if (shouldRegenerate) {
        console.log(`🔄 Regenerating due to: ${violations.join(', ') || (stillHasRepetition ? 'repetition' : 'line count/quality issues')}`);
        
        const retryPrompt = isMicroStory 
          ? `Generate XO-compliant micro-story (EXACTLY 4-5 complete lines, NO REPETITION):
Original: "${originalInput || meaningContract.seedMoment}"
CRITICAL RULES:
1. No word repetition - use varied vocabulary
2. No sentence structure repetition
3. No idea repetition
4. 4-5 lines only
5. Complete sentences`
          : `Generate XO-compliant text (complete, flowing, NO REPETITION):
Original: "${originalInput || meaningContract.seedMoment}"
Rules: No repetition. No scene-setting. No metaphors. No exposition. Write naturally.`;
        
        const retryCompletion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `STRICT: ${isMicroStory ? 'EXACTLY 4-5 LINES. No more, no less.' : 'No line limit.'} CRITICAL: NO REPETITION. Vary vocabulary and sentence structure. Use synonyms.`
            },
            {
              role: "user",
              content: retryPrompt
            }
          ],
          temperature: 0.6, // Higher temperature for more variation
          max_tokens: isMicroStory ? 250 : 300,
          frequency_penalty: 0.8, // Strong frequency penalty
          presence_penalty: 0.5, // Strong presence penalty
        });
        
        const retryContent = retryCompletion.choices[0].message.content?.trim() || storyContent;
        
        // Ensure completeness
        let finalContent = retryContent;
        if (!finalContent.match(/[.!?]$/)) {
          finalContent = finalContent + '.';
        }
        
        // Apply XO rules and deduplication
        finalContent = enforceXORules(finalContent, isMicroStory);
        
        // Final line count check for micro-stories
        const retryLines = finalContent.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        const retryHasRepetition = hasExcessiveRepetition(finalContent);
        
        if (!retryHasRepetition && (isMicroStory ? retryLines >= 4 && retryLines <= 5 : true)) {
          storyContent = finalContent;
        }
        
        console.log(`🔄 Regenerated: ${retryLines} lines, Repetition: ${retryHasRepetition ? 'YES' : 'NO'}`);
      }
      
      console.log('📊 XO transformation:', {
        initialLines,
        finalLines: storyContent.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
        length: storyContent.length,
        complete: storyContent.match(/[.!?]$/) ? 'Yes' : 'No',
        repetition: hasExcessiveRepetition(storyContent) ? 'Yes' : 'No',
        violations: violations.length
      });
    }

    // Final completeness check
    if (!storyContent.match(/[.!?]$/)) {
      storyContent = storyContent + '.';
    }

    const finalLineCount = storyContent.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const finalHasRepetition = hasExcessiveRepetition(storyContent);
    
    if (finalHasRepetition) {
      console.log('⚠️ Final output still has repetition, applying additional deduplication');
      storyContent = deduplicateText(storyContent);
    }
    
    console.log(`✅ Final output (${finalLineCount} lines, Repetition: ${hasExcessiveRepetition(storyContent) ? 'YES' : 'NO'}):`, storyContent);

    const beats = extractBeatsFromStory(storyContent, meaningContract);
    const title = generateTitleFromMeaning(meaningContract);
    
    const response: GenerateStoryResponse = {
      success: true,
      story: storyContent,
      beatSheet: beats,
      metadata: {
        emotionalState: meaningContract.interpretedMeaning.emotionalState,
        narrativeTension: meaningContract.interpretedMeaning.narrativeTension,
        intentCategory: meaningContract.interpretedMeaning.intentCategory,
        coreTheme: meaningContract.interpretedMeaning.coreTheme,
        wordCount: storyContent.split(/\s+/).length,
        lineCount: finalLineCount,
        hasRepetition: hasExcessiveRepetition(storyContent),
        
        ...(useXOMode && {
          xoCompliant: true,
          xoViolations: checkXOViolations(storyContent, isMicroStory),
          isMicroStory,
          compressionRatio: Math.round((storyContent.length / (completion.choices[0].message.content?.length || 1)) * 100),
          lineConstraintMet: isMicroStory ? finalLineCount >= 4 && finalLineCount <= 5 : true
        }),
        
        ...(brandContext?.name && !skipBrand && { 
          isBrandStory: true,
          brandName: brandContext.name 
        }),
      }
    };

    console.log(`🎉 ${useXOMode ? 'XO' : 'Story'} generated successfully`);
    
    return res.status(200).json(response);

  } catch (error) {
    console.error('Generation error:', error);
    
    return res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate' 
    });
  }
}

// ============================================================================
// LEGACY ADAPTER
// ============================================================================

export function adaptLegacyRequestToMeaning(
  legacyRequest: any
): GenerateStoryRequest {
  console.warn('⚠️ Using legacy adapter');
  
  const { semanticExtraction, originalContext, ...rest } = legacyRequest;
  
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