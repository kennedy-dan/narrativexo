import React from 'react';

interface Template {
  id: string;
  name: string;
  description: string;
  dimensions: string;
  safeZone: boolean;
}

interface TemplateSelectorProps {
  value: string;
  onChange: (template: string) => void;
}

const templates: Template[] = [
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    description: 'Vertical format for Instagram Stories',
    dimensions: '1080x1920',
    safeZone: true
  },
  {
    id: 'instagram-reel',
    name: 'Instagram Reel',
    description: 'Vertical video for Reels and TikTok',
    dimensions: '1080x1920',
    safeZone: true
  },
  {
    id: 'youtube-short',
    name: 'YouTube Short',
    description: 'Vertical format for YouTube Shorts',
    dimensions: '1080x1920',
    safeZone: true
  },
  {
    id: 'youtube-standard',
    name: 'YouTube Standard',
    description: 'Landscape format for traditional YouTube',
    dimensions: '1920x1080',
    safeZone: true
  },
  {
    id: 'facebook-feed',
    name: 'Facebook Feed',
    description: 'Square format for Facebook feed',
    dimensions: '1200x1200',
    safeZone: true
  },
  {
    id: 'linkedin-video',
    name: 'LinkedIn Video',
    description: 'Professional format for LinkedIn',
    dimensions: '1920x1080',
    safeZone: true
  }
];

export default function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Output Template
      </label>
      <p className="text-sm text-gray-500">
        Choose the format for your final output. Safe zone reserved for compliance strap.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onChange(template.id)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              value === template.id
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-sm">{template.name}</div>
            <div className="text-xs text-gray-600 mt-1">{template.description}</div>
            <div className="text-xs text-blue-600 mt-2">{template.dimensions}</div>
            {template.safeZone && (
              <div className="text-xs text-green-600 mt-1">✓ Safe zone reserved</div>
            )}
          </button>
        ))}
      </div>
      
      {value && (
        <div className="p-3 bg-orange-50 rounded-lg">
          <div className="text-sm font-medium text-orange-800">
            Template: {templates.find(t => t.id === value)?.name}
          </div>
          <div className="text-xs text-orange-700 mt-1">
            Compliance strap will be automatically placed in safe zone
          </div>
        </div>
      )}
    </div>
  );
}