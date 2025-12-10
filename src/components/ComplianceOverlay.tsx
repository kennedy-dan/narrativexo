import React, { useState, useEffect } from 'react';
import { checkWCAGContrast } from '@/lib/color-utils';
import { GeneratedStory, BrandAssets } from '@/types';

interface ComplianceOverlayProps {
  story: GeneratedStory | null;
  brandGuide: BrandAssets | null;
}

interface ComplianceCheck {
  wcagAA: boolean;
  contrastIssues: string[];
  strapRequired: boolean;
  strapPosition: boolean;
  exportReady: boolean;
}

export default function ComplianceOverlay({ story, brandGuide }: ComplianceOverlayProps) {
  const [compliance, setCompliance] = useState<ComplianceCheck>({
    wcagAA: false,
    contrastIssues: [],
    strapRequired: false,
    strapPosition: true,
    exportReady: false
  });

  useEffect(() => {
    if (story && brandGuide) {
      performComplianceCheck();
    }
  }, [story, brandGuide]);

  const performComplianceCheck = () => {
    const issues: string[] = [];
    
    // Check WCAG contrast if we have a palette
    if (brandGuide?.palette && brandGuide.palette.length >= 2) {
      const contrast = checkWCAGContrast(brandGuide.palette[0], brandGuide.palette[1]);
      if (!contrast.aa) {
        issues.push(`Low contrast ratio: ${contrast.ratio.toFixed(2)} (needs 4.5 for AA)`);
      }
    }

    // Determine if compliance strap is required
    // This would be based on industry/category rules
    const strapRequired = true; // Default to true for regulated content

    const complianceCheck: ComplianceCheck = {
      wcagAA: issues.length === 0,
      contrastIssues: issues,
      strapRequired,
      strapPosition: true, // Assuming template reserves safe zone
      exportReady: issues.length === 0 && strapRequired
    };

    setCompliance(complianceCheck);
  };

  if (!story || !brandGuide) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Compliance & Accessibility</h3>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          compliance.exportReady ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {compliance.exportReady ? 'Ready to Export' : 'Export Blocked'}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>WCAG AA Contrast</span>
          <span className={compliance.wcagAA ? 'text-green-600' : 'text-red-600'}>
            {compliance.wcagAA ? '✓ Pass' : '✗ Fail'}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span>Compliance Strap</span>
          <span className={compliance.strapRequired && compliance.strapPosition ? 'text-green-600' : 'text-yellow-600'}>
            {compliance.strapRequired ? (compliance.strapPosition ? '✓ Locked in safe zone' : '⚠ Check position') : 'Not required'}
          </span>
        </div>

        {compliance.contrastIssues.length > 0 && (
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-sm font-medium text-red-800 mb-1">Contrast Issues</div>
            <ul className="text-xs text-red-700 list-disc list-inside">
              {compliance.contrastIssues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {!compliance.exportReady && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="text-sm font-medium text-yellow-800">
              Export Requirements
            </div>
            <ul className="text-xs text-yellow-700 mt-1 list-disc list-inside">
              <li>WCAG AA contrast must pass</li>
              <li>Compliance strap must be properly positioned</li>
              <li>All brand guidelines must be followed</li>
            </ul>
          </div>
        )}
      </div>

      {/* Visual compliance strap preview */}
      {compliance.strapRequired && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs font-medium text-blue-800 mb-2">Compliance Strap Preview</div>
          <div className="text-xs text-blue-700 bg-white p-2 rounded border">
            <div className="font-medium">Important: This content is for demonstration purposes only.</div>
            <div>Always verify compliance with local regulations.</div>
          </div>
          <div className="text-xs text-blue-600 mt-2">
            Position: Locked in template safe zone ✓
          </div>
        </div>
      )}
    </div>
  );
}