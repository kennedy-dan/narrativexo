// components/EntryPathwaySelector.tsx
import React, { useState } from 'react';
import { Heart, Users, MapPin, Sparkles } from 'lucide-react';

interface EntryPathway {
  id: 'emotion' | 'audience' | 'scene' | 'seed';
  title: string;
  description: string;
  icon: React.ReactNode;
  placeholder: string;
  example: string;
}

interface EntryPathwaySelectorProps {
  onPathwaySelect: (pathway: string, input: string) => void;
}

const pathways: EntryPathway[] = [
  {
    id: 'emotion',
    title: 'Emotion-First',
    description: 'Start with how you feel or the emotional tone',
    icon: <Heart size={20} />,
    placeholder: 'I feel inspired by...',
    example: '"I feel inspired by the resilience of market women"'
  },
  {
    id: 'audience',
    title: 'Audience-First',
    description: 'Begin with your target audience',
    icon: <Users size={20} />,
    placeholder: 'For Lagos Gen Z who...',
    example: '"For Lagos Gen Z who hustle daily at computer village"'
  },
  {
    id: 'scene',
    title: 'Scene-First',
    description: 'Describe a specific setting or situation',
    icon: <MapPin size={20} />,
    placeholder: 'In a Lagos café at dawn...',
    example: '"In a Lagos café at dawn, where entrepreneurs gather"'
  },
  {
    id: 'seed',
    title: 'Story Seed',
    description: 'Share a conversation, memory, or moment',
    icon: <Sparkles size={20} />,
    placeholder: 'I overheard two people talking...',
    example: '"I overheard two market women discussing a big opportunity"'
  }
];

export default function EntryPathwaySelector({ onPathwaySelect }: EntryPathwaySelectorProps) {
  const [selectedPathway, setSelectedPathway] = useState<EntryPathway | null>(null);
  const [userInput, setUserInput] = useState('');

  const handleSubmit = () => {
    if (!selectedPathway || !userInput.trim()) return;
    onPathwaySelect(selectedPathway.id, userInput);
  };

  return (
    <div className="space-y-6">
      {/* Pathway Selection */}
      {!selectedPathway ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Starting Point</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pathways.map((pathway) => (
              <button
                key={pathway.id}
                onClick={() => setSelectedPathway(pathway)}
                className="group p-4 rounded-xl border-2 border-gray-200 bg-white text-left hover:border-purple-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                    <div className="text-purple-600">
                      {pathway.icon}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{pathway.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{pathway.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        // Input for selected pathway
        <div className="space-y-4">
          <button
            onClick={() => setSelectedPathway(null)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to pathways
          </button>
          
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-l-4 border-purple-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <div className="text-white">
                  {selectedPathway.icon}
                </div>
              </div>
              <div>
                <div className="font-semibold text-purple-900">{selectedPathway.title}</div>
                <div className="text-sm text-purple-700">{selectedPathway.description}</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedPathway.placeholder}
                </label>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={selectedPathway.example}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
              
              <div className="bg-white p-3 rounded-lg border">
                <div className="text-xs font-medium text-gray-700 mb-1">Example:</div>
                <div className="text-sm text-gray-600 italic">{selectedPathway.example}</div>
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={!userInput.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                Let's Clarify Your Story
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}