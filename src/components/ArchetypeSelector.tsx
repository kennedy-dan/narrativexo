import React, { useState, useEffect } from 'react';
import { User, Check } from 'lucide-react';

interface Archetype {
  id: string;
  name: string;
  description: string;
  marketSpecific?: string;
  icon: string;
}

interface ArchetypeSelectorProps {
  market: 'ng' | 'uk' | 'fr';
  value: string;
  onChange: (archetype: string) => void;
}

const archetypeData = {
  ng: [
    {
      id: 'against-all-odds',
      name: 'Against All Odds',
      description: 'Lagos hustle, triumph after struggle',
      marketSpecific: 'Naija resilience spirit',
      icon: '💪'
    },
    {
      id: 'heritage-hero',
      name: 'Heritage Hero',
      description: 'Cultural tradition meets modern ambition',
      marketSpecific: 'Ancestral pride meets urban rise',
      icon: '👑'
    },
    {
      id: 'community-builder',
      name: 'Community Builder',
      description: 'Family and neighborhood connections',
      marketSpecific: 'Extended family and street community',
      icon: '🤝'
    }
  ],
  uk: [
    {
      id: 'underdog-fighter',
      name: 'Underdog Fighter',
      description: 'Grass-roots determination and grit',
      marketSpecific: 'Terrace mentality, working-class pride',
      icon: '🥊'
    },
    {
      id: 'legacy-keeper',
      name: 'Legacy Keeper',
      description: 'Tradition and heritage preservation',
      marketSpecific: 'Pub culture, football legacy',
      icon: '🏆'
    },
    {
      id: 'modern-pioneer',
      name: 'Modern Pioneer',
      description: 'New British innovation and style',
      marketSpecific: 'Urban creativity meets tradition',
      icon: '🚀'
    }
  ],
  fr: [
    {
      id: 'creative-resilience',
      name: 'Résilience Créative',
      description: 'Elegant perseverance through challenges',
      marketSpecific: 'Artistic resistance, intellectual grit',
      icon: '🎨'
    },
    {
      id: 'cultural-elegance',
      name: 'Élégance Culturelle',
      description: 'Sophisticated heritage and style',
      marketSpecific: 'Patrimoine vivant with modern flair',
      icon: '👔'
    },
    {
      id: 'humanist-solidarity',
      name: 'Solidarité Humaniste',
      description: 'Community support and shared values',
      marketSpecific: 'Fraternité and local solidarity',
      icon: '❤️'
    }
  ]
};

export default function ArchetypeSelector({ market, value, onChange }: ArchetypeSelectorProps) {
  const [archetypes, setArchetypes] = useState<Archetype[]>([]);

  useEffect(() => {
    setArchetypes(archetypeData[market] || []);
  }, [market]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <User className="text-purple-600" size={20} />
        <label className="text-sm font-medium text-gray-700">
          Narrative Archetype
        </label>
      </div>
      
      <p className="text-sm text-gray-500 mb-4">
        Choose the emotional arc that defines your story
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {archetypes.map((archetype) => (
          <button
            key={archetype.id}
            onClick={() => onChange(archetype.name)}
            className={`
              relative p-4 rounded-xl border-2 text-left transition-all duration-200 group
              ${value === archetype.name
                ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
              }
            `}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{archetype.icon}</div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-gray-900 mb-1">
                  {archetype.name}
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  {archetype.description}
                </div>
                {archetype.marketSpecific && (
                  <div className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-2 py-1 rounded">
                    {market.toUpperCase()}: {archetype.marketSpecific}
                  </div>
                )}
              </div>
            </div>
            
            {value === archetype.name && (
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
              <Check size={20} className="text-white" />
            </div>
            <div>
              <div className="font-semibold text-purple-800">Selected: {value}</div>
              <p className="text-sm text-purple-600 mt-1">
                {archetypes.find(a => a.name === value)?.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}