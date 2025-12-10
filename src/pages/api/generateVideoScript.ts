import { OpenAI } from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';
import type { GeneratedStory, VideoScript } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface GenerateVideoScriptRequest {
  story: GeneratedStory;  // ✅ Use P2 structure
  market: string;
  tone: string;
  template?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      story, 
      market, 
      tone, 
      template = 'instagram-reel' 
    }: GenerateVideoScriptRequest = req.body;

    // Validate input
    if (!story || !story.beatSheet || story.beatSheet.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid story structure. Missing beatSheet.' 
      });
    }

    // Calculate timing based on template
    const templateDurations: { [key: string]: number } = {
      'instagram-reel': 30,
      'instagram-story': 15,
      'youtube-short': 60,
      'youtube-standard': 90,
      'tiktok': 30
    };

    const targetDuration = templateDurations[template] || 30;

    // Build market-specific context
    const marketContext: { [key: string]: string } = {
      'ng': 'Nigerian English, energetic pacing, street slang where appropriate, "No wahala" spirit',
      'uk': 'British English, authentic working-class voice, pub culture references if relevant',
      'fr': 'Formal French narration, measured pacing, cultural sophistication'
    };

    // Build structured scene breakdown for prompt
    const sceneBreakdown = story.beatSheet.map((scene, idx) => 
      `Scene ${idx + 1} - ${scene.beat} (${scene.duration || '5s'}):
Description: ${scene.description}
Visual Cues: ${scene.visualCues.join(', ')}
Emotion: ${scene.emotion || 'Neutral'}`
    ).join('\n\n');

    const prompt = `
You are a professional video director creating a video script for ${template.toUpperCase()} format (${targetDuration} seconds target).

STORY DETAILS:
Title: "${story.metadata.title}"
Market: ${market.toUpperCase()} (${marketContext[market] || marketContext['ng']})
Tone: ${tone}
Full Narrative: ${story.story}

SCENE BREAKDOWN:
${sceneBreakdown}

TASK:
Create a production-ready video script with precise timing that adds up to approximately ${targetDuration} seconds.

Return ONLY valid JSON in this EXACT structure:
{
  "voiceOver": [
    {
      "text": "Narration text here (one complete sentence or phrase)",
      "startTime": 0,
      "endTime": 5
    }
    // ... more VO lines
  ],
  "shots": [
    {
      "description": "Detailed shot description (camera angle, movement, framing)",
      "duration": 5,
      "visualDetails": "Specific visual elements, lighting, composition details"
    }
    // ... more shots
  ],
  "musicCues": [
    {
      "emotion": "Uplifting and energetic",
      "startTime": 0,
      "endTime": ${targetDuration}
    }
  ],
  "totalDuration": ${targetDuration}
}

CRITICAL REQUIREMENTS:
1. Voice-over must be timed to match scenes from the beat sheet
2. Each shot must correspond to a beat from the story
3. Shot durations should match or be close to the beat durations provided
4. Total duration of all shots must equal ${targetDuration} seconds (±2s acceptable)
5. Voice-over timing must not overlap awkwardly - leave natural pauses
6. Use ${market}-appropriate language and cultural references in narration
7. Shot descriptions must be specific and actionable for video editors
8. Include camera movements (pan, zoom, tracking, static) in shot descriptions
9. Visual details should reference the visualCues from each beat

Create a compelling, emotionally engaging video script that tells this story effectively in ${targetDuration} seconds.
`;

    console.log(`🎬 Generating ${targetDuration}s video script for ${market}/${tone}`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are an expert video director and scriptwriter who creates production-ready video scripts with precise timing and culturally appropriate content. You always return valid JSON with accurate timing calculations." 
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7  // Slightly more consistent than creative
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    console.log('📝 Raw video script response:', content.substring(0, 200) + '...');

    const videoScript: VideoScript = JSON.parse(content);

    // ✅ VALIDATION: Ensure structure is correct
    if (!videoScript.voiceOver || !videoScript.shots || !videoScript.totalDuration) {
      console.error('❌ Invalid video script structure:', videoScript);
      throw new Error('Invalid video script structure returned from GPT');
    }

    // Validate timing
    const calculatedDuration = videoScript.shots.reduce((sum, shot) => sum + shot.duration, 0);
    if (Math.abs(calculatedDuration - videoScript.totalDuration) > 5) {
      console.warn(`⚠️ Timing mismatch: calculated ${calculatedDuration}s vs declared ${videoScript.totalDuration}s`);
      videoScript.totalDuration = calculatedDuration;  // Fix it
    }

    console.log(`✅ Video script generated: ${videoScript.shots.length} shots, ${videoScript.totalDuration}s total`);

    res.status(200).json({
      success: true,
      videoScript,
      metadata: {
        template,
        market,
        tone,
        targetDuration,
        actualDuration: videoScript.totalDuration,
        shotCount: videoScript.shots.length,
        voiceOverLines: videoScript.voiceOver.length
      }
    });

  } catch (error) {
    console.error('❌ Video script generation error:', error);
    
    if (error instanceof Error) {
      return res.status(500).json({ 
        success: false,
        error: 'Failed to generate video script',
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate video script' 
    });
  }
}