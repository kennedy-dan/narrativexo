// components/OutputModeSelector.tsx
import React from 'react';
import { Instagram, Briefcase, Building } from 'lucide-react';

interface OutputMode {
  id: 'creator' | 'agency' | 'brand';
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

interface OutputModeSelectorProps {
  value: 'creator' | 'agency' | 'brand';
  onChange: (mode: 'creator' | 'agency' | 'brand') => void;
}

const modes: OutputMode[] = [
  {
    id: 'creator',
    title: 'Creator Mode',
    description: 'For social media creators and influencers',
    icon: <Instagram size={20} />,
    features: ['Reel/caption output', 'Hashtag suggestions', 'WebM animation export', 'Social-optimized']
  },
  {
    id: 'agency',
    title: 'Agency Mode',
    description: 'For agencies and campaign planners',
    icon: <Briefcase size={20} />,
    features: ['Storyboard layout', 'Deck-style narrative', 'Audience insights', 'Measurement framework']
  },
  {
    id: 'brand',
    title: 'Brand Mode',
    description: 'For corporate brand communications',
    icon: <Building size={20} />,
    features: ['Compliance-aligned', 'Brand tone locks', 'WCAG AA checks', 'Safe zone placement']
  }
];

export default function OutputModeSelector({ value, onChange }: OutputModeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">Select Output Mode</h3>
        <p className="text-sm text-gray-600">Choose how you want to use this story</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onChange(mode.id)}
            className={`
              relative p-4 rounded-xl border-2 text-left transition-all duration-200
              ${value === mode.id
                ? 'border-transparent bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg'
                : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:shadow-sm'
              }
            `}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  value === mode.id ? 'bg-white/20' : 'bg-gradient-to-r from-purple-100 to-pink-100'
                }`}>
                  <div className={value === mode.id ? 'text-white' : 'text-purple-600'}>
                    {mode.icon}
                  </div>
                </div>
                <div>
                  <div className="font-semibold">{mode.title}</div>
                  <div className={`text-sm ${value === mode.id ? 'text-white/90' : 'text-gray-500'}`}>
                    {mode.description}
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                {mode.features.map((feature, index) => (
                  <div 
                    key={index} 
                    className={`text-xs flex items-center gap-2 ${
                      value === mode.id ? 'text-white/90' : 'text-gray-600'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      value === mode.id ? 'bg-white' : 'bg-purple-500'
                    }`} />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}