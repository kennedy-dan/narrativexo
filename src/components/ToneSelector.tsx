import React, { useState, useEffect } from 'react';

interface Tone {
  name: string;
  keywords: string[];
  description: string;
  example: string;
}

interface ToneSelectorProps {
  market: 'ng' | 'uk' | 'fr';
  value: string;
  onChange: (tone: string) => void;
}

const toneData = {
  ng: [
    {
      name: 'Cinematic',
      keywords: ['epic', 'heritage', 'heroic', 'sunlit'],
      description: 'Epic storytelling with heritage visuals',
      example: '"Our Hero Returns" energy with vibrant colors'
    },
    {
      name: 'Playful',
      keywords: ['banter', 'YOLO', 'street', 'friends'],
      description: 'Street banter and "No wahala" humour',
      example: 'Lighthearted Lagos street scenes'
    },
    {
      name: 'Heartfelt',
      keywords: ['warm', 'community', 'family', 'heritage'],
      description: 'Warm community and family connections',
      example: 'Multi-generational family moments'
    },
    {
      name: 'Defiant',
      keywords: ['grit', 'hustle', 'resilience', 'determined'],
      description: '"Against All Odds" Lagos hustle energy',
      example: 'Early morning market hustle scenes'
    }
  ],
  uk: [
    {
      name: 'Cinematic',
      keywords: ['sweeping', 'emotional', 'loyalty', 'dramatic'],
      description: 'Sweeping matchday emotion and pub loyalty',
      example: 'Pub celebrations and community gatherings'
    },
    {
      name: 'Playful',
      keywords: ['wit', 'banter', 'mates', 'humorous'],
      description: 'Terrace wit and mates banter',
      example: 'Friendly competition and inside jokes'
    },
    {
      name: 'Heartfelt',
      keywords: ['working-class', 'shared', 'values', 'emotional'],
      description: 'Working-class emotion and shared values',
      example: 'Community support during challenges'
    },
    {
      name: 'Defiant',
      keywords: ['grit', 'fighter', 'grass-roots', 'determined'],
      description: 'Grass-roots fighter energy',
      example: 'Local business overcoming obstacles'
    }
  ],
  fr: [
    {
      name: 'Cinématographique',
      keywords: ['élégant', 'mesuré', 'culturel', 'narratif'],
      description: 'Grand narrative with cultural elegance',
      example: 'Artistic Parisian scenes with measured voice'
    },
    {
      name: 'Ludique',
      keywords: ['ironie', 'jeu de mots', 'léger', 'spirituel'],
      description: 'Ironie douce and clever wordplay',
      example: 'Intellectual humor in café settings'
    },
    {
      name: 'Sincère',
      keywords: ['humanisme', 'solidarité', 'local', 'authentique'],
      description: 'Humanisme and local solidarité',
      example: 'Neighborhood solidarity and support'
    },
    {
      name: 'Résilient',
      keywords: ['créatif', 'résistance', 'déterminé', 'élégant'],
      description: 'Résilience créative with elegant determination',
      example: 'Artistic perseverance through challenges'
    }
  ]
};

export default function ToneSelector({ market, value, onChange }: ToneSelectorProps) {
  const [tones, setTones] = useState<Tone[]>([]);

  useEffect(() => {
    setTones(toneData[market] || []);
  }, [market]);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Expressive Tone
      </label>
      <p className="text-sm text-gray-500">
        Select the voice and style for your narrative
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tones.map((tone) => (
          <button
            key={tone.name}
            onClick={() => onChange(tone.name)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              value === tone.name
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-sm mb-2">{tone.name}</div>
            <div className="text-xs text-gray-600 mb-2">{tone.description}</div>
            <div className="text-xs text-blue-600 mb-2">
              Keywords: {tone.keywords.join(', ')}
            </div>
            <div className="text-xs text-gray-500 italic">
              Example: {tone.example}
            </div>
          </button>
        ))}
      </div>
      
      {value && (
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-sm font-medium text-green-800">Tone: {value}</div>
        </div>
      )}
    </div>
  );
}