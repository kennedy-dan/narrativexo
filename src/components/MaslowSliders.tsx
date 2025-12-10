import React, { useState } from 'react';

interface MaslowNeed {
  id: string;
  label: string;
  description: string;
  level: number;
}

interface MaslowSlidersProps {
  onNeedChange: (need: string) => void;
}

const defaultNeeds: MaslowNeed[] = [
  {
    id: 'physiological',
    label: 'Essentials for Living',
    description: 'Basic needs, survival, hustle stories',
    level: 50
  },
  {
    id: 'safety',
    label: 'Security & Stability',
    description: 'Protection, order, predictability',
    level: 50
  },
  {
    id: 'belonging',
    label: 'Community & Connection',
    description: 'Family, friends, social groups',
    level: 50
  },
  {
    id: 'esteem',
    label: 'Achievement & Respect',
    description: 'Recognition, status, accomplishment',
    level: 50
  },
  {
    id: 'self-actualization',
    label: 'Growth & Purpose',
    description: 'Personal growth, fulfillment, meaning',
    level: 50
  }
];

export default function MaslowSliders({ onNeedChange }: MaslowSlidersProps) {
  const [needs, setNeeds] = useState<MaslowNeed[]>(defaultNeeds);

  const handleLevelChange = (id: string, level: number) => {
    const updatedNeeds = needs.map(need =>
      need.id === id ? { ...need, level } : need
    );
    setNeeds(updatedNeeds);
    
    // Find the highest priority need
    const primaryNeed = updatedNeeds.reduce((prev, current) =>
      prev.level > current.level ? prev : current
    );
    onNeedChange(primaryNeed.label);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Motivational Foundation
        </label>
        <p className="text-sm text-gray-500 mb-4">
          Adjust sliders to define the core motivational drivers for your narrative
        </p>
      </div>
      
      <div className="space-y-6">
        {needs.map((need) => (
          <div key={need.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">
                {need.label}
              </label>
              <span className="text-xs text-gray-500">{need.level}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={need.level}
              onChange={(e) => handleLevelChange(need.id, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <p className="text-xs text-gray-500">{need.description}</p>
          </div>
        ))}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}