import { OpenAI } from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';
import type { Scene, CharacterDescription } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { story, beatSheet }: { story: string; beatSheet: Scene[] } = req.body;

    // Analyze story for characters
    const prompt = `
Analyze this story and identify ALL characters that appear. For each character, extract:

STORY:
${story}

BEAT SHEET:
${JSON.stringify(beatSheet, null, 2)}

INSTRUCTIONS:
1. Identify main characters (appear in multiple scenes)
2. Identify supporting characters (appear in 1-2 scenes)
3. Extract detailed physical descriptions from the text
4. Note which scenes each character appears in
5. Generate unique IDs for tracking

RETURN JSON FORMAT:
{
  "characters": [
    {
      "id": "main_character_1",
      "name": "extracted name or descriptive label",
      "age": "approximate age range",
      "gender": "male/female/other/unknown",
      "ethnicity": "if mentioned or culturally implied",
      "keyFeatures": ["distinctive feature 1", "feature 2"],
      "appearance": {
        "hair": "description",
        "eyes": "description", 
        "build": "description",
        "distinctive": ["very specific permanent features"]
      },
      "clothingStyle": "overall style if described",
      "expressions": ["common expressions they show"],
      "referenceDescription": "concise 2-sentence physical description for AI image generation"
    }
  ],
  "characterSceneMap": {
    "character_id": [scene_indices_where_they_appear]
  }
}

IMPORTANT: Be specific about facial features. If not explicitly described, make culturally appropriate assumptions for the story context.
`;

    const completion = await openai.chat.completions.create({
  model: "gpt-4-turbo-preview", // or "gpt-4-1106-preview", "gpt-3.5-turbo-1106"
      messages: [
        { role: "system", content: "You are a character analysis expert. Extract detailed, consistent character descriptions for visual generation." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Update beatSheet with character IDs
    const updatedBeatSheet = beatSheet.map((scene, index) => {
      const charactersInScene: string[] = [];
      
      // Simple heuristic: if scene mentions character actions, assign main character
      if (scene.description.toLowerCase().includes('he ') || 
          scene.description.toLowerCase().includes('she ') ||
          scene.description.toLowerCase().includes('they ') ||
          scene.description.toLowerCase().includes('person')) {
        
        // Assign main character to scenes with person references
        if (analysis.characters?.[0]?.id) {
          charactersInScene.push(analysis.characters[0].id);
        }
      }
      
      return {
        ...scene,
        characterId: charactersInScene[0] || undefined,
        characterEmotion: extractEmotionFromScene(scene.description),
        characterAction: extractActionFromScene(scene.description)
      };
    });

    res.status(200).json({
      success: true,
      characters: analysis.characters || [],
      characterSceneMap: analysis.characterSceneMap || {},
      updatedBeatSheet
    });

  } catch (error) {
    console.error('Character detection error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to detect characters',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function extractEmotionFromScene(description: string): string {
  const emotions = ['happy', 'sad', 'angry', 'surprised', 'thoughtful', 'determined', 'confused', 'excited'];
  const lowerDesc = description.toLowerCase();
  for (const emotion of emotions) {
    if (lowerDesc.includes(emotion)) return emotion;
  }
  return 'neutral';
}

function extractActionFromScene(description: string): string {
  const actions = ['sitting', 'standing', 'walking', 'running', 'talking', 'looking', 'thinking', 'working'];
  const lowerDesc = description.toLowerCase();
  for (const action of actions) {
    if (lowerDesc.includes(action)) return action;
  }
  return 'present';
}