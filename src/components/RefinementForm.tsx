// components/RefinementForm.tsx
import React, { useState } from 'react';
import { Brain, X, Check } from 'lucide-react';

interface RefinementFormProps {
  onUpdate: (inputs: { conflict: string; character: string; resolution: string }) => void;
  onCancel: () => void;
}

export default function RefinementForm({ onUpdate, onCancel }: RefinementFormProps) {
  const [inputs, setInputs] = useState({
    conflict: '',
    character: '',
    resolution: ''
  });

  const handleChange = (field: 'conflict' | 'character' | 'resolution', value: string) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputs.conflict.trim() || inputs.character.trim() || inputs.resolution.trim()) {
      onUpdate(inputs);
    }
  };

  return (
    <div className="space-y-4">
      <p>Let me ask a few questions to better understand your story:</p>
      <form onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-500">
            <div className="text-sm font-medium text-gray-700 mb-1">What's the central conflict or challenge?</div>
            <input 
              type="text" 
              value={inputs.conflict}
              onChange={(e) => handleChange('conflict', e.target.value)}
              placeholder="e.g., Overcoming financial struggle..."
              className="w-full mt-2 p-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500">
            <div className="text-sm font-medium text-gray-700 mb-1">Who is the main character or audience?</div>
            <input 
              type="text" 
              value={inputs.character}
              onChange={(e) => handleChange('character', e.target.value)}
              placeholder="e.g., Young entrepreneur in Lagos..."
              className="w-full mt-2 p-2 text-sm border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-l-4 border-yellow-500">
            <div className="text-sm font-medium text-gray-700 mb-1">How should the story resolve?</div>
            <input 
              type="text" 
              value={inputs.resolution}
              onChange={(e) => handleChange('resolution', e.target.value)}
              placeholder="e.g., Triumph through community support..."
              className="w-full mt-2 p-2 text-sm border rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!inputs.conflict.trim() && !inputs.character.trim() && !inputs.resolution.trim()}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            <Check size={16} />
            Update Analysis
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <X size={16} />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}