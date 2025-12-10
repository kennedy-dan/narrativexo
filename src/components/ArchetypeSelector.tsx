import React, { useState, useEffect } from 'react';

interface Archetype {
  id: string;
  name: string;
  description: string;
  marketSpecific?: string;
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
      marketSpecific: 'Naija resilience spirit'
    },
    {
      id: 'heritage-hero',
      name: 'Heritage Hero',
      description: 'Cultural tradition meets modern ambition',
      marketSpecific: 'Ancestral pride meets urban rise'
    },
    {
      id: 'community-builder',
      name: 'Community Builder',
      description: 'Family and neighborhood connections',
      marketSpecific: 'Extended family and street community'
    }
  ],
  uk: [
    {
      id: 'underdog-fighter',
      name: 'Underdog Fighter',
      description: 'Grass-roots determination and grit',
      marketSpecific: 'Terrace mentality, working-class pride'
    },
    {
      id: 'legacy-keeper',
      name: 'Legacy Keeper',
      description: 'Tradition and heritage preservation',
      marketSpecific: 'Pub culture, football legacy'
    },
    {
      id: 'modern-pioneer',
      name: 'Modern Pioneer',
      description: 'New British innovation and style',
      marketSpecific: 'Urban creativity meets tradition'
    }
  ],
  fr: [
    {
      id: 'creative-resilience',
      name: 'Résilience Créative',
      description: 'Elegant perseverance through challenges',
      marketSpecific: 'Artistic resistance, intellectual grit'
    },
    {
      id: 'cultural-elegance',
      name: 'Élégance Culturelle',
      description: 'Sophisticated heritage and style',
      marketSpecific: 'Patrimoine vivant with modern flair'
    },
    {
      id: 'humanist-solidarity',
      name: 'Solidarité Humaniste',
      description: 'Community support and shared values',
      marketSpecific: 'Fraternité and local solidarity'
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
      <label className="block text-sm font-medium text-gray-700">
        Narrative Archetype
      </label>
      <p className="text-sm text-gray-500">
        Choose the emotional arc that defines your story
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {archetypes.map((archetype) => (
          <button
            key={archetype.id}
            onClick={() => onChange(archetype.name)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              value === archetype.name
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-sm">{archetype.name}</div>
            <div className="text-xs text-gray-600 mt-1">{archetype.description}</div>
            {archetype.marketSpecific && (
              <div className="text-xs text-blue-600 mt-2">
                {market.toUpperCase()}: {archetype.marketSpecific}
              </div>
            )}
          </button>
        ))}
      </div>
      
      {value && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-800">Selected: {value}</div>
        </div>
      )}
    </div>
  );
}