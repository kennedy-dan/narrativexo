import React from 'react';
import { Globe } from 'lucide-react';

interface MarketSelectorProps {
  value: 'ng' | 'uk' | 'fr';
  onChange: (market: 'ng' | 'uk' | 'fr') => void;
}

const marketConfig = {
  ng: { 
    name: 'Nigeria', 
    description: 'Street banter, hustle energy, cultural pride',
    color: 'from-yellow-500 to-green-500',
    icon: '🇳🇬'
  },
  uk: { 
    name: 'United Kingdom', 
    description: 'Terrace wit, working-class emotion, legacy',
    color: 'from-blue-500 to-red-500',
    icon: '🇬🇧'
  },
  fr: { 
    name: 'France', 
    description: 'Ironie douce, patrimoine vivant, modernité élégante',
    color: 'from-blue-500 to-white',
    icon: '🇫🇷'
  }
};

export default function MarketSelector({ value, onChange }: MarketSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(Object.keys(marketConfig) as Array<keyof typeof marketConfig>).map((market) => (
          <button
            key={market}
            onClick={() => onChange(market)}
            className={`
              group relative p-4 rounded-xl border-2 text-left transition-all duration-200
              ${value === market
                ? 'border-transparent bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg'
                : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:shadow-md'
              }
            `}
          >
            <div className="space-y-3">
              <div className="text-3xl">{marketConfig[market].icon}</div>
              <div>
                <div className="font-semibold">{marketConfig[market].name}</div>
                <div className="text-sm opacity-90 mt-1">{market.toUpperCase()}</div>
              </div>
              <div className={`text-xs ${value === market ? 'text-white/90' : 'text-gray-500'}`}>
                {marketConfig[market].description}
              </div>
            </div>
            
            {value === market && (
              <div className="absolute top-3 right-3">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}