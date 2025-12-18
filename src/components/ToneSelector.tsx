import React, { useState, useEffect } from 'react';
import { Volume2, Check } from 'lucide-react';

interface Tone {
  name: string;
  keywords: string[];
  description: string;
  example: string;
  icon: string;
  color: string;
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
      example: '"Our Hero Returns" energy with vibrant colors',
      icon: '🎬',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      name: 'Playful',
      keywords: ['banter', 'YOLO', 'street', 'friends'],
      description: 'Street banter and "No wahala" humour',
      example: 'Lighthearted Lagos street scenes',
      icon: '😄',
      color: 'from-green-500 to-emerald-500'
    },
    {
      name: 'Heartfelt',
      keywords: ['warm', 'community', 'family', 'heritage'],
      description: 'Warm community and family connections',
      example: 'Multi-generational family moments',
      icon: '❤️',
      color: 'from-red-500 to-pink-500'
    },
    {
      name: 'Defiant',
      keywords: ['grit', 'hustle', 'resilience', 'determined'],
      description: '"Against All Odds" Lagos hustle energy',
      example: 'Early morning market hustle scenes',
      icon: '💪',
      color: 'from-blue-500 to-indigo-500'
    }
  ],
  uk: [
    {
      name: 'Cinematic',
      keywords: ['sweeping', 'emotional', 'loyalty', 'dramatic'],
      description: 'Sweeping matchday emotion and pub loyalty',
      example: 'Pub celebrations and community gatherings',
      icon: '🎬',
      color: 'from-blue-500 to-purple-500'
    },
    {
      name: 'Playful',
      keywords: ['wit', 'banter', 'mates', 'humorous'],
      description: 'Terrace wit and mates banter',
      example: 'Friendly competition and inside jokes',
      icon: '😄',
      color: 'from-green-500 to-emerald-500'
    },
    {
      name: 'Heartfelt',
      keywords: ['working-class', 'shared', 'values', 'emotional'],
      description: 'Working-class emotion and shared values',
      example: 'Community support during challenges',
      icon: '❤️',
      color: 'from-red-500 to-pink-500'
    },
    {
      name: 'Defiant',
      keywords: ['grit', 'fighter', 'grass-roots', 'determined'],
      description: 'Grass-roots fighter energy',
      example: 'Local business overcoming obstacles',
      icon: '🥊',
      color: 'from-gray-700 to-black'
    }
  ],
  fr: [
    {
      name: 'Cinématographique',
      keywords: ['élégant', 'mesuré', 'culturel', 'narratif'],
      description: 'Grand narrative with cultural elegance',
      example: 'Artistic Parisian scenes with measured voice',
      icon: '🎬',
      color: 'from-blue-500 to-white'
    },
    {
      name: 'Ludique',
      keywords: ['ironie', 'jeu de mots', 'léger', 'spirituel'],
      description: 'Ironie douce and clever wordplay',
      example: 'Intellectual humor in café settings',
      icon: '😄',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      name: 'Sincère',
      keywords: ['humanisme', 'solidarité', 'local', 'authentique'],
      description: 'Humanisme and local solidarité',
      example: 'Neighborhood solidarity and support',
      icon: '❤️',
      color: 'from-red-500 to-pink-500'
    },
    {
      name: 'Résilient',
      keywords: ['créatif', 'résistance', 'déterminé', 'élégant'],
      description: 'Résilience créative with elegant determination',
      example: 'Artistic perseverance through challenges',
      icon: '💪',
      color: 'from-purple-500 to-indigo-500'
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
      <div className="flex items-center gap-2 mb-2">
        <Volume2 className="text-purple-600" size={20} />
        <label className="text-sm font-medium text-gray-700">
          Expressive Tone
        </label>
      </div>
      
      <p className="text-sm text-gray-500 mb-4">
        Select the voice and style for your narrative
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tones.map((tone) => (
          <button
            key={tone.name}
            onClick={() => onChange(tone.name)}
            className={`
              relative p-4 rounded-xl border-2 text-left transition-all duration-200 group
              ${value === tone.name
                ? 'border-transparent bg-gradient-to-br via-white to-white shadow-lg'
                : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
              }
            `}
            style={value === tone.name ? {
              background: `linear-gradient(135deg, ${tone.color.replace('from-', '').replace('to-', '').split(' ')[0]}22, ${tone.color.replace('from-', '').replace('to-', '').split(' ')[1]}11, white)`,
              borderColor: `var(--color-${tone.name.toLowerCase()})`
            } : {}}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{tone.icon}</div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-gray-900 mb-1">
                  {tone.name}
                </div>
                <div className="text-xs text-gray-600 mb-2">{tone.description}</div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {tone.keywords.map((keyword, index) => (
                    <span 
                      key={index}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
                  Example: {tone.example}
                </div>
              </div>
            </div>
            
            {value === tone.name && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Check size={12} className="text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
      
      {value && (
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-l-4 border-purple-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Volume2 size={20} className="text-white" />
            </div>
            <div>
              <div className="font-semibold text-purple-800">Selected Tone: {value}</div>
              <p className="text-sm text-purple-600 mt-1">
                {tones.find(t => t.name === value)?.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}