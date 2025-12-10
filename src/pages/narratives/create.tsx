import { useState } from 'react';
import MarketSelector from '@/components/MarketSelector';
import MaslowSliders from '@/components/MaslowSliders';
import ArchetypeSelector from '@/components/ArchetypeSelector';
import ToneSelector from '@/components/ToneSelector';
import BrandGuideUpload from '@/components/BrandGuideUpload';
import TemplateSelector from '@/components/TemplateSelector';
import ComplianceOverlay from '@/components/ComplianceOverlay';
import { 
  GeneratedStory, 
  VideoScript, 
  BrandAssets,
  Scene 
} from '@/types';

type Market = 'ng' | 'uk' | 'fr';

export default function Create() {
  // Market & Foundation
  const [market, setMarket] = useState<Market>('ng');
  const [need, setNeed] = useState<string>('');
  const [archetype, setArchetype] = useState<string>('');
  
  // Tone & Context
  const [tone, setTone] = useState<string>('');
  const [context, setContext] = useState<string>('');
  
  // Brand
  const [brandName, setBrandName] = useState<string>('');
  const [brandGuide, setBrandGuide] = useState<BrandAssets | null>(null);
  
  // Template & Output
  const [template, setTemplate] = useState<string>('instagram-reel');
  const [story, setStory] = useState<GeneratedStory | null>(null);
  const [videoScript, setVideoScript] = useState<VideoScript | null>(null);
  const [generatedImages, setGeneratedImages] = useState<{[key: string]: string}>({});
  
  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

 const handleGenerateStory = async (): Promise<void> => {
  if (!need || !archetype || !tone || !context) {
    alert('Please complete all required fields: Need, Archetype, Tone, and Context');
    return;
  }

  setIsGenerating(true);
  try {
    const res = await fetch('/api/generateStory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        market,
        need,
        archetype,
        tone,
        context,
        brand: brandGuide ? { name: brandName, ...brandGuide } : undefined
      })
    });
    
    const data = await res.json();
    
    console.log('📦 Full API Response:', data);
    
    if (!data.success) {
      alert(`Story generation failed: ${data.error || 'Unknown error'}`);
      return;
    }

    // ✅ FIX: Extract only the story structure, not the full response
    const generatedStory: GeneratedStory = {
      story: data.story,
      beatSheet: data.beatSheet,
      metadata: data.metadata
    };

    console.log('✅ Extracted story:', generatedStory);
    console.log('✅ Title:', generatedStory.metadata?.title);
    
    setStory(generatedStory);
    setCurrentStep(6);
    
  } catch (error) {
    console.error('❌ Story generation error:', error);
    alert('Failed to generate story. Please try again.');
  } finally {
    setIsGenerating(false);
  }
};

 const handleGenerateVideoScript = async (): Promise<void> => {
  if (!story) {
    alert('Generate a story first');
    return;
  }

  if (Object.keys(generatedImages).length === 0) {
    alert('Generate images first to ensure visual alignment');
    return;
  }

  setIsGenerating(true);
  try {
    console.log('🎬 Generating video script...');
    
    const res = await fetch('/api/generateVideoScript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        story,      // ✅ Send entire P2 story object
        market,
        tone,
        template
      })
    });
    
    const data = await res.json();
    
    console.log('📦 Video script response:', data);
    
    if (!data.success) {
      alert(`Video script generation failed: ${data.error || 'Unknown error'}`);
      return;
    }

    // ✅ Extract video script
    setVideoScript(data.videoScript);
    
    console.log(`✅ Video script ready: ${data.videoScript.totalDuration}s, ${data.videoScript.shots.length} shots`);
    
    setCurrentStep(7); // Move to video script step
    
  } catch (error) {
    console.error('❌ Video script generation error:', error);
    alert('Failed to generate video script. Check console for details.');
  } finally {
    setIsGenerating(false);
  }
};

  const handleGenerateImageForScene = async (scene: Scene, sceneIndex: number): Promise<void> => {
    if (!story) return;

    try {
      const res = await fetch('/api/generateImage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneDescription: scene.description,
          tone,
          market,
          brandSafe: true,
          brandPalette: brandGuide?.palette || [],
          template
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setGeneratedImages(prev => ({
          ...prev,
          [sceneIndex]: data.imageUrl
        }));
      }
    } catch (error) {
      console.error('Image generation error:', error);
      alert(`Failed to generate image for scene ${sceneIndex + 1}`);
    }
  };

  const handleExportAudit = async (): Promise<void> => {
    if (!story) {
      alert('Generate a story first');
      return;
    }

    try {
      const res = await fetch('/api/exportAudit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          narrative: {
            market,
            need,
            archetype,
            tone,
            context,
            brand: brandGuide ? { name: brandName, ...brandGuide } : null,
            story,
            videoScript,
            template,
            generatedImages,
            timestamp: new Date().toISOString()
          }
        })
      });
      
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `narrative-audit-${market}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export audit');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">1. Select Market</h2>
            <MarketSelector value={market} onChange={setMarket} />
            <button 
              onClick={() => setCurrentStep(2)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next: Motivational Foundation
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">2. Motivational Foundation</h2>
            <MaslowSliders onNeedChange={setNeed} />
            <div className="flex gap-4">
              <button 
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 border border-gray-300 rounded-lg"
              >
                Back
              </button>
              <button 
                onClick={() => setCurrentStep(3)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next: Archetype
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">3. Narrative Archetype</h2>
            <ArchetypeSelector market={market} value={archetype} onChange={setArchetype} />
            <div className="flex gap-4">
              <button 
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 border border-gray-300 rounded-lg"
              >
                Back
              </button>
              <button 
                onClick={() => setCurrentStep(4)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next: Tone & Context
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">4. Tone & Context</h2>
            <ToneSelector market={market} value={tone} onChange={setTone} />
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Context & Scene Details
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Describe the scene, characters, or situation for your story..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none"
              />
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setCurrentStep(3)}
                className="px-6 py-3 border border-gray-300 rounded-lg"
              >
                Back
              </button>
              <button 
                onClick={() => setCurrentStep(5)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next: Brand & Template
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">5. Brand & Template</h2>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Brand Name (Optional)
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Enter brand name..."
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>

            <BrandGuideUpload onParseComplete={setBrandGuide} />
            <TemplateSelector value={template} onChange={setTemplate} />

            <div className="flex gap-4">
              <button 
                onClick={() => setCurrentStep(4)}
                className="px-6 py-3 border border-gray-300 rounded-lg"
              >
                Back
              </button>
              <button 
                onClick={handleGenerateStory}
                disabled={isGenerating}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isGenerating ? 'Generating Story...' : 'Generate Story'}
              </button>
            </div>
          </div>
        );

   case 6:
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">6. Generated Story</h2>
      
      {story && (
        <div className="space-y-4">
          {(() => { console.log('Generated Story:', story); return null; })()}
          {/* Show full narrative */}
          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <h3 className="text-lg font-semibold mb-2">{story.metadata.title}</h3>
            <p className="text-gray-700 leading-relaxed">{story.story}</p>
          </div>

          {/* Show beatSheet with images */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Scene Breakdown</h3>
              
              {/* NEW: Single button to generate ALL images */}
              <button
                onClick={async () => {
                  setIsGenerating(true);
                  try {
                    // Generate images for ALL beats in parallel
                    const imagePromises = story.beatSheet.map((scene, index) => 
                      fetch('/api/generateImage', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          sceneDescription: scene.description,
                          visualCues: scene.visualCues,
                          tone,
                          market,
                          brandSafe: true,
                          brandPalette: brandGuide?.palette || [],
                          template,
                          beatIndex: index,
                          beat: scene.beat
                        })
                      }).then(r => r.json())
                    );

                    const results = await Promise.all(imagePromises);
                    
                    // Store all images
                    const imageMap: {[key: string]: string} = {};
                    results.forEach((result, idx) => {
                      if (result.success) {
                        imageMap[idx] = result.imageUrl;
                      }
                    });
                    
                    setGeneratedImages(imageMap);
                    alert(`✓ Generated ${Object.keys(imageMap).length} images`);
                    
                  } catch (error) {
                    console.error('Batch image generation failed:', error);
                    alert('Failed to generate images. Check console.');
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                disabled={isGenerating || Object.keys(generatedImages).length > 0}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {isGenerating 
                  ? `Generating ${story.beatSheet.length} Images...` 
                  : Object.keys(generatedImages).length > 0
                  ? '✓ Images Generated'
                  : `Generate All Images (${story.beatSheet.length})`
                }
              </button>
            </div>

            {story.beatSheet.map((scene, index) => (
              <div key={index} className="p-4 border rounded-lg bg-white">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-blue-600">
                          Beat {index + 1}: {scene.beat}
                        </h4>
                        {scene.emotion && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {scene.emotion}
                          </span>
                        )}
                      </div>
                      {scene.duration && (
                        <span className="text-xs text-gray-500">{scene.duration}</span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">{scene.description}</p>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {scene.visualCues.map((cue, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {cue}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Show generated image */}
                  {generatedImages[index] && (
                    <div className="w-32 h-32 flex-shrink-0">
                      <img 
                        src={generatedImages[index]} 
                        alt={`Scene ${index + 1}: ${scene.beat}`}
                        className="w-full h-full object-cover rounded border-2 border-purple-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <ComplianceOverlay story={story} brandGuide={brandGuide} />

          <div className="flex gap-4">
            <button 
              onClick={() => setCurrentStep(5)}
              className="px-6 py-3 border border-gray-300 rounded-lg"
            >
              Back
            </button>
            <button 
              onClick={handleGenerateVideoScript}
              disabled={isGenerating || Object.keys(generatedImages).length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {Object.keys(generatedImages).length === 0 
                ? 'Generate Images First' 
                : 'Generate Video Script'
              }
            </button>
            <button 
              onClick={handleExportAudit}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Export Audit
            </button>
          </div>
        </div>
      )}
    </div>
  );
   case 7:
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">7. Video Script</h2>
      
      {videoScript && (
        <div className="space-y-4">
          {/* Metadata Summary */}
          <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-purple-900">
                  {story?.metadata.title}
                </h3>
                <p className="text-sm text-purple-700">
                  {template.toUpperCase()} • {market.toUpperCase()} Market • {tone} Tone
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">
                  {videoScript.totalDuration}s
                </div>
                <div className="text-xs text-purple-600">
                  {videoScript.shots.length} shots
                </div>
              </div>
            </div>
          </div>

          {/* Voice Over Timeline */}
          <div className="p-4 bg-white border rounded-lg">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              🎙️ Voice Over
            </h3>
            <div className="space-y-3">
              {videoScript.voiceOver.map((line, index) => (
                <div key={index} className="flex gap-3 pb-3 border-b last:border-0">
                  <div className="flex-shrink-0 w-20 text-xs font-mono text-gray-500">
                    {line.startTime}s - {line.endTime}s
                  </div>
                  <div className="flex-1 text-sm text-gray-700">
                    "{line.text}"
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Shot List */}
          <div className="p-4 bg-white border rounded-lg">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              🎥 Shot List
            </h3>
            <div className="space-y-3">
              {videoScript.shots.map((shot, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-sm text-blue-600">
                      Shot {index + 1}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {shot.duration}s
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>Description:</strong> {shot.description}
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>Visual Details:</strong> {shot.visualDetails}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Music Cues */}
          {videoScript.musicCues && videoScript.musicCues.length > 0 && (
            <div className="p-4 bg-white border rounded-lg">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                🎵 Music Cues
              </h3>
              <div className="space-y-2">
                {videoScript.musicCues.map((cue, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <span className="font-mono text-xs text-gray-500">
                      {cue.startTime}s - {cue.endTime}s
                    </span>
                    <span className="text-gray-700">{cue.emotion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button 
              onClick={() => setCurrentStep(6)}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Back to Story
            </button>
            <button 
              onClick={handleExportAudit}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Export Complete Package
            </button>
            {/* Future: Render Video Button */}
            <button 
              disabled
              className="px-6 py-3 bg-purple-600 text-white rounded-lg opacity-50 cursor-not-allowed"
              title="Coming in P2.2"
            >
              🎬 Render Video (P2.2)
            </button>
          </div>
        </div>
      )}

      {!videoScript && (
        <div className="p-8 text-center text-gray-500">
          <p>No video script generated yet.</p>
          <button 
            onClick={() => setCurrentStep(6)}
            className="mt-4 px-4 py-2 border rounded hover:bg-gray-50"
          >
            Go back to generate video script
          </button>
        </div>
      )}
    </div>
  );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Narratives.XO Prototype 2
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {[1, 2, 3, 4, 5, 6, 7].map((step) => (
              <div key={step} className="flex items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= step 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step}
                </div>
                {step < 7 && (
                  <div 
                    className={`w-12 h-1 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {renderStep()}
        </div>

        {/* Current Selections Summary */}
        <div className="mt-6 p-4 bg-white rounded-lg shadow-sm text-sm text-gray-600">
          <div className="flex flex-wrap gap-4">
            <span><strong>Market:</strong> {market.toUpperCase()}</span>
            {need && <span><strong>Need:</strong> {need}</span>}
            {archetype && <span><strong>Archetype:</strong> {archetype}</span>}
            {tone && <span><strong>Tone:</strong> {tone}</span>}
            {brandName && <span><strong>Brand:</strong> {brandName}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}