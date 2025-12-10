import React from 'react';

interface MarketSelectorProps {
  value: 'ng' | 'uk' | 'fr';
  onChange: (market: 'ng' | 'uk' | 'fr') => void;
}

const marketConfig = {
  ng: { name: 'Nigeria', tooltip: 'Street banter, hustle energy, cultural pride' },
  uk: { name: 'United Kingdom', tooltip: 'Terrace wit, working-class emotion, legacy' },
  fr: { name: 'France', tooltip: 'Ironie douce, patrimoine vivant, modernité élégante' }
};

export default function MarketSelector({ value, onChange }: MarketSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Select Market
      </label>
      <div className="flex gap-3">
        {(Object.keys(marketConfig) as Array<keyof typeof marketConfig>).map((market) => (
          <button
            key={market}
            onClick={() => onChange(market)}
            className={`px-4 py-3 rounded-lg border-2 transition-all ${
              value === market
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
            title={marketConfig[market].tooltip}
          >
            <div className="font-medium">{marketConfig[market].name}</div>
            <div className="text-xs mt-1 opacity-70">{market.toUpperCase()}</div>
          </button>
        ))}
      </div>
      {value && (
        <p className="text-sm text-gray-500">
          {marketConfig[value].tooltip}
        </p>
      )}
    </div>
  );
}