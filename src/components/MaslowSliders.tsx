import React, { useState } from 'react';
import { Target, Shield, Users, Award, Sparkles, Check } from 'lucide-react';

interface MaslowOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface MaslowSelectionProps {
  onNeedChange: (need: string) => void;
}

const maslowOptions: MaslowOption[] = [
  {
    id: 'physiological',
    label: 'Essentials for Living',
    description: 'Basic needs, survival, hustle stories',
    icon: <Target size={20} />,
    color: 'from-red-500 to-orange-500'
  },
  {
    id: 'safety',
    label: 'Security & Stability',
    description: 'Protection, order, predictability',
    icon: <Shield size={20} />,
    color: 'from-orange-500 to-yellow-500'
  },
  {
    id: 'belonging',
    label: 'Community & Connection',
    description: 'Family, friends, social groups',
    icon: <Users size={20} />,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'esteem',
    label: 'Achievement & Respect',
    description: 'Recognition, status, accomplishment',
    icon: <Award size={20} />,
    color: 'from-blue-500 to-indigo-500'
  },
  {
    id: 'self-actualization',
    label: 'Growth & Purpose',
    description: 'Personal growth, fulfillment, meaning',
    icon: <Sparkles size={20} />,
    color: 'from-purple-500 to-pink-500'
  }
];

export default function MaslowSelection({ onNeedChange }: MaslowSelectionProps) {
  const [selectedNeed, setSelectedNeed] = useState<string>('');

  const handleSelect = (need: MaslowOption) => {
    setSelectedNeed(need.id);
    onNeedChange(need.label);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {maslowOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option)}
            className={`
              group relative p-4 rounded-xl border-2 text-left transition-all duration-200
              ${selectedNeed === option.id
                ? 'border-transparent bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg'
                : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:shadow-md'
              }
            `}
          >
            <div className="space-y-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                selectedNeed === option.id 
                  ? 'bg-white/20' 
                  : `bg-gradient-to-br ${option.color}`
              }`}>
                <div className={selectedNeed === option.id ? 'text-white' : 'text-white'}>
                  {option.icon}
                </div>
              </div>
              <div>
                <div className="font-semibold">{option.label}</div>
                <div className={`text-sm mt-1 ${selectedNeed === option.id ? 'text-white/90' : 'text-gray-500'}`}>
                  {option.description}
                </div>
              </div>
            </div>
            
            {selectedNeed === option.id && (
              <div className="absolute top-3 right-3">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <Check size={14} className="text-purple-600" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
      
      {selectedNeed && (
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-l-4 border-purple-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <div className="font-semibold text-purple-800">
                {maslowOptions.find(o => o.id === selectedNeed)?.label}
              </div>
              <p className="text-sm text-purple-600 mt-1">
                Selected as primary motivation
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}