import React, { useState } from 'react';
import { BrandAssets } from '@/types';
import { Upload, Palette, Type, Shield, Check, AlertCircle, X, Image as ImageIcon } from 'lucide-react';

interface BrandGuideUploadProps {
  onParseComplete: (assets: BrandAssets | null) => void;
}

export default function BrandGuideUpload({ onParseComplete }: BrandGuideUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<BrandAssets | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFileName(file.name);

    // Validate file size (15MB max)
    if (file.size > 15 * 1024 * 1024) {
      alert('File too large. Maximum size is 15MB.');
      URL.revokeObjectURL(url);
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF, JPG, or PNG file.');
      URL.revokeObjectURL(url);
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

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileName('');
    setResult(null);
    onParseComplete(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="relative">
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="hidden"
          id="brand-guide-upload"
        />
        
        {previewUrl ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{fileName}</span>
              </div>
              <button
                onClick={handleRemove}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            
            <div className="relative rounded-lg overflow-hidden border border-gray-200">
              {previewUrl.endsWith('.pdf') ? (
                <div className="p-8 bg-gray-50 text-center">
                  <div className="text-4xl">📄</div>
                  <div className="text-sm text-gray-600 mt-2">PDF Document</div>
                </div>
              ) : (
                <img 
                  src={previewUrl} 
                  alt="Brand guide preview" 
                  className="w-full h-48 object-contain bg-gray-50"
                />
              )}
            </div>
          </div>
        ) : (
          <label
            htmlFor="brand-guide-upload"
            className={`
              block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
              ${isUploading 
                ? 'border-purple-300 bg-purple-50 opacity-50' 
                : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50'
              }
            `}
          >
            <div className="space-y-3">
              <div className="flex justify-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isUploading 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                    : 'bg-gradient-to-r from-purple-100 to-pink-100'
                }`}>
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
                  ) : (
                    <Upload size={24} className="text-purple-600" />
                  )}
                </div>
              </div>
              
              <div className="text-sm">
                {isUploading ? (
                  <div className="space-y-2">
                    <div className="font-medium text-purple-700">Processing...</div>
                    <div className="text-xs text-purple-600">Extracting colors and fonts</div>
                  </div>
                ) : (
                  <>
                    <div className="font-medium text-gray-900">Click to upload brand guide</div>
                    <div className="text-gray-600 mt-1">PDF, PNG, JPG up to 15MB</div>
                  </>
                )}
              </div>
            </div>
          </label>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-l-4 border-purple-500">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Check className="text-green-600" size={20} />
              <div className="font-medium text-sm text-gray-900">Brand Assets Extracted</div>
            </div>
            
            {result.palette && result.palette.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette size={16} className="text-purple-600" />
                  <div className="text-xs font-medium text-gray-700">Color Palette</div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {result.palette.map((color, index) => (
                    <div
                      key={index}
                      className="relative group"
                    >
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-white shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {color}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.fonts && result.fonts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Type size={16} className="text-purple-600" />
                  <div className="text-xs font-medium text-gray-700">Fonts Detected</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.fonts.map((font, index) => (
                    <div
                      key={index}
                      className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 border"
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Shield size={16} className={result.brandSafe ? 'text-green-600' : 'text-yellow-600'} />
              <div className="text-xs">
                <span className="font-medium">Brand Safety:</span>{' '}
                <span className={result.brandSafe ? 'text-green-600' : 'text-yellow-600'}>
                  {result.brandSafe ? '✓ All clear for use' : '⚠ Review recommended'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}