// components/BrandGuideUploadEnhanced.tsx
import React, { useState } from 'react';
import { BrandAssets } from '@/types';
import { 
  Upload, Palette, Type, Shield, Check, 
  AlertCircle, X, Image as ImageIcon, 
  FileText, Layers, Globe, Zap 
} from 'lucide-react';

interface BrandGuideUploadEnhancedProps {
  onParseComplete: (assets: BrandAssets | null) => void;
}

interface ExtractionResult {
  palette: string[];
  fonts: string[];
  brandSafe: boolean;
  logoUrls?: string[];
  logoPositions?: Array<{x: number, y: number, width: number, height: number}>;
  brandKeywords?: string[];
  documentType?: string;
  extractedText?: string;
}

export default function BrandGuideUploadEnhanced({ onParseComplete }: BrandGuideUploadEnhancedProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [extractedLogos, setExtractedLogos] = useState<string[]>([]);
  const [extractedText, setExtractedText] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFileName(file.name);

    // Validate file size (25MB max for documents)
    const maxSize = file.type.includes('pdf') || file.type.includes('document') 
      ? 25 * 1024 * 1024 
      : 15 * 1024 * 1024;
    
    if (file.size > maxSize) {
      alert(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
      URL.revokeObjectURL(url);
      return;
    }

    // Validate file type
    const validTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml',
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint'
    ];
    
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF, DOC, DOCX, PPT, JPG, PNG, or SVG file.');
      URL.revokeObjectURL(url);
      return;
    }

    setIsUploading(true);
    setResult(null);
    setExtractedLogos([]);
    setExtractedText('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add extraction preferences
      formData.append('extractLogo', 'true');
      formData.append('extractColors', 'true');
      formData.append('extractText', 'true');
      formData.append('extractFonts', 'true');

      const response = await fetch('/api/parseBrandGuide', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const brandAssets: BrandAssets = {
          palette: data.palette || [],
          fonts: data.fonts || [],
          brandSafe: data.brandSafe || false,
          logoUrls: data.logoUrls || [],
          extractedText: data.extractedText || '',
          brandKeywords: data.brandKeywords || [],
          documentType: data.documentType || 'unknown'
        };
        
        setResult(data);
        setExtractedLogos(data.logoUrls || []);
        setExtractedText(data.extractedText || '');
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
    setExtractedLogos([]);
    setExtractedText('');
    onParseComplete(null);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'ppt':
      case 'pptx': return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      case 'svg': return '🎨';
      default: return '📎';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="relative">
        <input
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.svg"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="hidden"
          id="brand-guide-upload-enhanced"
        />
        
        {previewUrl ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFileIcon(fileName)}</span>
                <div>
                  <div className="font-medium text-gray-900">{fileName}</div>
                  <div className="text-xs text-gray-600">
                    {result?.documentType ? `${result.documentType.toUpperCase()} Document` : 'Brand Guide'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleRemove}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            {/* Preview Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Document Preview */}
              <div className="bg-gray-50 rounded-lg border p-4">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FileText size={16} />
                  Document Preview
                </h4>
                <div className="relative h-48 rounded border overflow-hidden bg-white">
                  {fileName.endsWith('.pdf') ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      <div className="text-4xl mb-2">📄</div>
                      <div className="text-sm text-gray-600 text-center">PDF Document</div>
                      <div className="text-xs text-gray-500 mt-1">Brand guidelines extracted</div>
                    </div>
                  ) : (
                    <img 
                      src={previewUrl} 
                      alt="Brand guide preview" 
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>

              {/* Quick Preview */}
              <div className="bg-gray-50 rounded-lg border p-4">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Zap size={16} />
                  Quick Preview
                </h4>
                {result && (
                  <div className="space-y-3">
                    {result.palette && result.palette.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Palette size={14} className="text-purple-600" />
                          <span className="text-xs font-medium">Colors Found</span>
                        </div>
                        <div className="flex gap-1">
                          {result.palette.slice(0, 5).map((color, idx) => (
                            <div
                              key={idx}
                              className="w-8 h-8 rounded border-2 border-white shadow-sm"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                          {result.palette.length > 5 && (
                            <div className="w-8 h-8 rounded border-2 border-white bg-gray-100 flex items-center justify-center text-xs">
                              +{result.palette.length - 5}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {extractedLogos.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Layers size={14} className="text-blue-600" />
                          <span className="text-xs font-medium">Logos Found</span>
                        </div>
                        <div className="flex gap-2">
                          {extractedLogos.slice(0, 2).map((logo, idx) => (
                            <div key={idx} className="w-16 h-16 border rounded bg-white p-1">
                              <img 
                                src={logo} 
                                alt={`Logo ${idx + 1}`} 
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <label
            htmlFor="brand-guide-upload-enhanced"
            className={`
              block border-3 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
              ${isUploading 
                ? 'border-purple-300 bg-purple-50 opacity-50' 
                : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50 hover:shadow-lg'
              }
            `}
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className={`
                  w-20 h-20 rounded-full flex items-center justify-center transition-transform
                  ${isUploading ? 'animate-pulse' : 'hover:scale-105'}
                `}>
                  {isUploading ? (
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <Upload size={20} className="text-white" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                      <Upload size={28} className="text-white" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="font-semibold text-gray-900">
                  {isUploading ? 'Analyzing Brand Guide...' : 'Upload Brand Guide'}
                </div>
                <div className="text-sm text-gray-600">
                  {isUploading ? (
                    'Extracting colors, logos, and brand assets...'
                  ) : (
                    <>
                      Drag & drop or click to upload PDF, DOC, PPT, JPG, PNG, or SVG
                      <div className="text-xs text-gray-500 mt-1">Max 25MB for documents</div>
                    </>
                  )}
                </div>
              </div>

              {!isUploading && (
                <div className="pt-4">
                  <div className="inline-flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Palette size={12} />
                      <span>Colors</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Layers size={12} />
                      <span>Logos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Type size={12} />
                      <span>Fonts</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe size={12} />
                      <span>Brand Voice</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </label>
        )}
      </div>

      {/* Detailed Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-l-4 border-purple-500 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Check size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Brand Assets Extracted</h3>
                  <p className="text-sm text-gray-600">
                    Ready for story and image generation
                  </p>
                </div>
              </div>
              <div className="text-xs bg-white text-purple-700 px-3 py-1.5 rounded-full border border-purple-200">
                {result.documentType?.toUpperCase() || 'DOCUMENT'}
              </div>
            </div>

            {/* Color Palette */}
            {result.palette && result.palette.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Palette size={18} className="text-purple-600" />
                    <h4 className="font-medium text-gray-900">Color Palette</h4>
                  </div>
                  <span className="text-xs text-gray-500">
                    {result.palette.length} colors
                  </span>
                </div>
                <div className="grid grid-cols-6 md:grid-cols-10 gap-2">
                  {result.palette.map((color, index) => (
                    <div
                      key={index}
                      className="relative group"
                    >
                      <div
                        className="w-full h-10 rounded-lg border-2 border-white shadow-sm transition-transform hover:scale-110 hover:z-10"
                        style={{ backgroundColor: color }}
                      />
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        <div className="font-mono">{color}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Logos */}
            {extractedLogos.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers size={18} className="text-blue-600" />
                    <h4 className="font-medium text-gray-900">Extracted Logos</h4>
                  </div>
                  <span className="text-xs text-gray-500">
                    {extractedLogos.length} logos
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {extractedLogos.map((logo, index) => (
                    <div
                      key={index}
                      className="bg-white p-3 rounded-lg border hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-square bg-gray-50 rounded border mb-2 flex items-center justify-center">
                        <img 
                          src={logo} 
                          alt={`Logo ${index + 1}`}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="text-xs text-gray-600 text-center">
                        Logo {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fonts */}
            {result.fonts && result.fonts.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Type size={18} className="text-purple-600" />
                    <h4 className="font-medium text-gray-900">Fonts Detected</h4>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.fonts.map((font, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 bg-white rounded-lg border text-sm font-medium text-gray-700 hover:shadow-sm transition-shadow"
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Brand Safety */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <Shield 
                  size={20} 
                  className={result.brandSafe ? 'text-green-600' : 'text-yellow-600'} 
                />
                <div>
                  <div className="font-medium text-gray-900">Brand Safety</div>
                  <div className="text-sm text-gray-600">
                    {result.brandSafe 
                      ? 'Content is safe for all audiences' 
                      : 'Review recommended before use'}
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                result.brandSafe 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {result.brandSafe ? '✓ Safe' : '⚠ Review'}
              </div>
            </div>

            {/* Extracted Text Preview */}
            {extractedText && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={16} className="text-gray-600" />
                  <h4 className="font-medium text-gray-900">Extracted Content</h4>
                </div>
                <div className="bg-white p-4 rounded-lg border text-sm text-gray-700 max-h-40 overflow-y-auto">
                  {extractedText.substring(0, 500)}...
                  {extractedText.length > 500 && (
                    <span className="text-gray-500"> (truncated)</span>
                  )}
                </div>
              </div>
            )}

            {/* Brand Keywords */}
            {result.brandKeywords && result.brandKeywords.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">Brand Keywords:</div>
                <div className="flex flex-wrap gap-2">
                  {result.brandKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Usage Notice */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border">
            <div className="flex items-start gap-3">
              <Zap size={18} className="text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">Ready for Image Generation</p>
                <p className="text-gray-600 mt-1">
                  These brand assets will automatically be used when generating images for your story. 
                  Colors will influence the palette, logos may be incorporated where appropriate, 
                  and fonts will inform typography choices.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}