import React, { useState } from 'react';
import { BrandAssets } from '@/types';

interface BrandGuideUploadProps {
  onParseComplete: (assets: BrandAssets | null) => void;
}

export default function BrandGuideUpload({ onParseComplete }: BrandGuideUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<BrandAssets | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (15MB max)
    if (file.size > 15 * 1024 * 1024) {
      alert('File too large. Maximum size is 15MB.');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF, JPG, or PNG file.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parseBrandGuide', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const brandAssets: BrandAssets = {
          palette: data.palette || [],
          fonts: data.fonts || [],
          brandSafe: data.brandSafe || false
        };
        setResult(brandAssets);
        onParseComplete(brandAssets);
      } else {
        throw new Error(data.error || 'Failed to parse brand guide');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to process brand guide. Please try again.');
      onParseComplete(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Brand Guide Upload (Optional)
        </label>
        <p className="text-sm text-gray-500">
          Upload PDF/PNG/JPG (max 15MB) to extract palette and fonts
        </p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="hidden"
          id="brand-guide-upload"
        />
        <label
          htmlFor="brand-guide-upload"
          className={`cursor-pointer block ${
            isUploading ? 'opacity-50' : 'hover:bg-gray-50'
          }`}
        >
          <div className="text-sm text-gray-600">
            {isUploading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                Processing brand guide...
              </div>
            ) : (
              <>
                <div className="font-medium text-gray-900">Click to upload brand guide</div>
                <div className="mt-1">PDF, PNG, JPG up to 15MB</div>
              </>
            )}
          </div>
        </label>
      </div>

      {result && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="font-medium text-sm text-gray-900">Extracted Brand Assets</div>
          
          {result.palette && result.palette.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Palette (ΔE00 deduplicated)</div>
              <div className="flex gap-1 flex-wrap">
                {result.palette.map((color, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {result.fonts && result.fonts.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-700 mb-1">Fonts</div>
              <div className="text-sm text-gray-600">{result.fonts.join(', ')}</div>
            </div>
          )}

          <div className="text-xs">
            <span className="font-medium">Brand Safe:</span>{' '}
            <span className={result.brandSafe ? 'text-green-600' : 'text-yellow-600'}>
              {result.brandSafe ? 'Yes' : 'Review recommended'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}