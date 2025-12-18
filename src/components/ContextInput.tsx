import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface ContextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export default function ContextInput({ value, onChange, onSubmit }: ContextInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe your story scene... (characters, setting, situation)"
        className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!value.trim()}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
        >
          <Send size={16} />
          Submit Context
        </button>
      </div>
    </form>
  );
}