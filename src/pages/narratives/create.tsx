import { useState, useRef, useEffect } from 'react';
import MarketSelector from '@/components/MarketSelector';
import MaslowSelection from '@/components/MaslowSliders';
import ArchetypeSelector from '@/components/ArchetypeSelector';
import ToneSelector from '@/components/ToneSelector';
import BrandGuideUpload from '@/components/BrandGuideUpload';
import TemplateSelector from '@/components/TemplateSelector';
// import ContextInput from '@/components/ContextInput';
import { 
  GeneratedStory, 
  VideoScript, 
  BrandAssets 
} from '@/types';
import {
  Sparkles,
  Image as ImageIcon,
  Video as VideoIcon,
  Download,
  Copy,
  Bot,
  User as UserIcon,
  Globe,
  TrendingUp,
  Volume2,
  FileText,
  Palette,
  Type,
  Film,
  Send,
  Check,
  X,
  MoreHorizontal
} from 'lucide-react';

type Market = 'ng' | 'uk' | 'fr';

type Message = {
  id: number;
  sender: 'system' | 'user';
  content: React.ReactNode;
  timestamp: Date;
  type?: 'selection' | 'response' | 'generated' | 'question';
};

type Step = 'market' | 'need' | 'archetype' | 'tone' | 'context' | 'brand' | 'template' | 'generate' | 'images' | 'video' | 'complete';

export default function Create() {
  // State
  const [market, setMarket] = useState<Market>('ng');
  const [need, setNeed] = useState<string>('');
  const [archetype, setArchetype] = useState<string>('');
  const [tone, setTone] = useState<string>('');
  const [context, setContext] = useState<string>('');
  const [brandName, setBrandName] = useState<string>('');
  const [brandGuide, setBrandGuide] = useState<BrandAssets | null>(null);
  const [template, setTemplate] = useState<string>('instagram-reel');
  const [story, setStory] = useState<GeneratedStory | null>(null);
  const [videoScript, setVideoScript] = useState<VideoScript | null>(null);
  const [generatedImages, setGeneratedImages] = useState<{[key: string]: string}>({});
  
  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('market');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'system',
      content: "Hi! I'm Narratives.XO. Let's create an amazing story together. First, which market are we targeting?",
      timestamp: new Date(),
      type: 'question'
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (sender: 'system' | 'user', content: React.ReactNode, type?: 'selection' | 'response' | 'generated' | 'question') => {
    const newMessage: Message = {
      id: messages.length + 1,
      sender,
      content,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const simulateTyping = (duration = 1000) => {
    return new Promise(resolve => setTimeout(resolve, duration));
  };

  // Step 1: Market Selection
  const handleMarketSelect = async (selectedMarket: Market) => {
    setMarket(selectedMarket);
    
    addMessage('user', 
      <div className="flex items-center gap-2">
        <Globe size={16} />
        <span className="font-medium">{selectedMarket.toUpperCase()} Market</span>
      </div>,
      'selection'
    );

    await simulateTyping(800);
    
    addMessage('system', 
      <div>
        <p>Great choice! Now, what's the main motivation for your audience?</p>
      </div>,
      'question'
    );
    
    setCurrentStep('need');
  };

  // Step 2: Need Selection
  const handleNeedSelect = async (selectedNeed: string) => {
    setNeed(selectedNeed);
    
    addMessage('user', 
      <div className="flex items-center gap-2">
        <TrendingUp size={16} />
        <span className="font-medium">{selectedNeed}</span>
      </div>,
      'selection'
    );

    await simulateTyping(800);
    
    addMessage('system', 
      <div>
        <p>Perfect! What narrative archetype resonates with this?</p>
      </div>,
      'question'
    );
    
    setCurrentStep('archetype');
  };

  // Step 3: Archetype Selection
  const handleArchetypeSelect = async (selectedArchetype: string) => {
    setArchetype(selectedArchetype);
    
    addMessage('user', 
      <div className="flex items-center gap-2">
        <FileText size={16} />
        <span className="font-medium">{selectedArchetype}</span>
      </div>,
      'selection'
    );

    await simulateTyping(800);
    
    addMessage('system', 
      <div>
        <p>Excellent choice! Now, what tone should we use?</p>
      </div>,
      'question'
    );
    
    setCurrentStep('tone');
  };

  // Step 4: Tone Selection
  const handleToneSelect = async (selectedTone: string) => {
    setTone(selectedTone);
    
    addMessage('user', 
      <div className="flex items-center gap-2">
        <Volume2 size={16} />
        <span className="font-medium">{selectedTone}</span>
      </div>,
      'selection'
    );

    await simulateTyping(800);
    
    addMessage('system', 
      <div>
        <p>Great! Now, could you describe the specific context or scene?</p>
      </div>,
      'question'
    );
    
    setCurrentStep('context');
  };

  // Step 5: Context Input
  const handleContextSubmit = async () => {
    if (!context.trim()) return;
    
    addMessage('user', 
      <div className=" border rounded-lg p-3">
        <p className="text-sm">{context}</p>
      </div>,
      'selection'
    );

    await simulateTyping(800);
    
    addMessage('system', 
      <div>
        <p>Got it! Want to add brand guidelines? (Optional)</p>
      </div>,
      'question'
    );
    
    setCurrentStep('brand');
  };

  // Step 6: Brand Upload
  const handleBrandUpload = async (assets: BrandAssets | null) => {
    setBrandGuide(assets);
    
    if (assets) {
      addMessage('user', 
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-purple-600" />
          <span className="font-medium">Brand Guide Uploaded</span>
        </div>,
        'selection'
      );
    } else {
      addMessage('user', 
        <div className="flex items-center gap-2">
          <span className="font-medium">Skip brand guide</span>
        </div>,
        'selection'
      );
    }

    await simulateTyping(800);
    
    addMessage('system', 
      <div>
        <p>Great! Choose your output format:</p>
      </div>,
      'question'
    );
    
    setCurrentStep('template');
  };

  // Step 7: Template Selection
  const handleTemplateSelect = async (selectedTemplate: string) => {
    setTemplate(selectedTemplate);
    
    addMessage('user', 
      <div className="flex items-center gap-2">
        <span className="font-medium">{selectedTemplate.replace('-', ' ').toUpperCase()}</span>
      </div>,
      'selection'
    );

    await simulateTyping(800);
    
    addMessage('system', 
      <div>
        <p>Perfect! Ready to generate your story?</p>
      </div>,
      'question'
    );
    
    setCurrentStep('generate');
  };

  // Step 8: Generate Story
  const handleGenerateStory = async () => {
    if (!need || !archetype || !tone || !context) {
      addMessage('system', 
        <div className="text-red-600">
          Please complete all required fields
        </div>,
        'response'
      );
      return;
    }

    setIsGenerating(true);
    
    addMessage('user', 
      <div className="flex items-center gap-2">
        <Sparkles size={16} />
        <span className="font-medium">Generate Story</span>
      </div>,
      'selection'
    );

    // Add loading message
    const loadingId = messages.length + 1;
    setMessages(prev => [...prev, {
      id: loadingId,
      sender: 'system',
      content: (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
          <span>Crafting your story...</span>
        </div>
      ),
      timestamp: new Date(),
      type: 'response'
    }]);

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
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }

      const generatedStory: GeneratedStory = {
        story: data.story,
        beatSheet: data.beatSheet,
        metadata: data.metadata
      };

      setStory(generatedStory);
      
      // Remove loading message and add story
      setMessages(prev => prev.filter(msg => msg.id !== loadingId));
      
      addMessage('system', 
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
            <h3 className="font-semibold text-lg mb-2">{generatedStory.metadata.title}</h3>
            <p className="text-gray-700 whitespace-pre-line">{generatedStory.story}</p>
          </div>
          <p className="text-sm text-gray-600">
            Want to bring this story to life with images?
          </p>
        </div>,
        'generated'
      );
      
      setCurrentStep('images');

    } catch (error) {
      console.error('❌ Story generation error:', error);
      setMessages(prev => prev.filter(msg => msg.id !== loadingId));
      addMessage('system', 
        <div className="text-red-600">
          Failed to generate story. Please try again.
        </div>,
        'response'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 9: Generate Images
  const handleGenerateImages = async () => {
    if (!story) return;
    
    setIsGenerating(true);
    
    addMessage('user', 
      <div className="flex items-center gap-2">
        <ImageIcon size={16} />
        <span className="font-medium">Generate Images</span>
      </div>,
      'selection'
    );

    const loadingId = messages.length + 1;
    setMessages(prev => [...prev, {
      id: loadingId,
      sender: 'system',
      content: (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
          <span>Creating visuals for all scenes...</span>
        </div>
      ),
      timestamp: new Date(),
      type: 'response'
    }]);

    try {
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
      const imageMap: {[key: string]: string} = {};
      results.forEach((result, idx) => {
        if (result.success) {
          imageMap[idx] = result.imageUrl;
        }
      });
      
      setGeneratedImages(imageMap);
      
      // Remove loading and add images
      setMessages(prev => prev.filter(msg => msg.id !== loadingId));
      
     // In the handleGenerateImages function, update the success message:
addMessage('system', 
  <div className="space-y-4">
    <div className="flex items-center gap-2 text-green-600">
      <Check size={20} />
      <span className="font-medium">Generated {Object.keys(imageMap).length} images!</span>
    </div>
    <div className="space-y-4">
      {story.beatSheet.map((scene, index) => (
        imageMap[index] && (
          <div key={index} className="space-y-3 p-4 bg-white rounded-xl border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                {index + 1}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{scene.beat}</div>
                <div className="text-xs text-gray-500">{scene.description}</div>
              </div>
            </div>
            <img 
              src={imageMap[index]} 
              alt={`Scene ${index + 1}: ${scene.beat}`}
              className="w-full h-64 object-cover rounded-lg border-2 border-purple-200"
            />
            <div className="flex flex-wrap gap-1">
              {scene.visualCues.map((cue, i) => (
                <span 
                  key={i}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                >
                  {cue}
                </span>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
    <p className="text-sm text-gray-600">
      Ready to create a video script from these visuals?
    </p>
  </div>,
  'generated'
);
      
      setCurrentStep('video');

    } catch (error) {
      console.error('Image generation failed:', error);
      setMessages(prev => prev.filter(msg => msg.id !== loadingId));
      addMessage('system', 
        <div className="text-red-600">
          Failed to generate images. Please try again.
        </div>,
        'response'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 10: Generate Video Script
  const handleGenerateVideoScript = async () => {
    if (!story) return;

    setIsGenerating(true);
    
    addMessage('user', 
      <div className="flex items-center gap-2">
        <VideoIcon size={16} />
        <span className="font-medium">Create Video Script</span>
      </div>,
      'selection'
    );

    const loadingId = messages.length + 1;
    setMessages(prev => [...prev, {
      id: loadingId,
      sender: 'system',
      content: (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
          <span>Creating video script...</span>
        </div>
      ),
      timestamp: new Date(),
      type: 'response'
    }]);

    try {
      const res = await fetch('/api/generateVideoScript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story,
          market,
          tone,
          template
        })
      });
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }

      setVideoScript(data.videoScript);
      
      // Remove loading and add video script
      setMessages(prev => prev.filter(msg => msg.id !== loadingId));
      
      addMessage('system', 
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Video Script Ready! 🎬</h3>
              <div className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                {data.videoScript.totalDuration}s • {data.videoScript.shots.length} shots
              </div>
            </div>
            <div className="text-sm text-gray-700">
              Perfect for {template.replace('-', ' ')} format
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                🎙️ Voice Over
              </h4>
              <div className="space-y-2">
                {data.videoScript.voiceOver.slice(0, 3).map((line: any, index: number) => (
                  <div key={index} className="text-sm bg-white p-3 rounded border">
                    <div className="text-xs text-gray-500 mb-1">
                      {line.startTime}s - {line.endTime}s
                    </div>
                    "{line.text}"
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                🎥 Shot List
              </h4>
              <div className="space-y-2">
                {data.videoScript.shots.slice(0, 3).map((shot: any, index: number) => (
                  <div key={index} className="text-sm bg-white p-3 rounded border">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Shot {index + 1}</span>
                      <span className="text-xs text-gray-500">{shot.duration}s</span>
                    </div>
                    <div className="text-gray-600">{shot.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleExportAudit}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Export Complete Package
            </button>
            <button 
              onClick={() => {
                addMessage('system', 
                  <div>
                    <p>Want to create another story?</p>
                  </div>,
                  'question'
                );
                setCurrentStep('complete');
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              New Story
            </button>
          </div>
        </div>,
        'generated'
      );

    } catch (error) {
      console.error('Video script generation error:', error);
      setMessages(prev => prev.filter(msg => msg.id !== loadingId));
      addMessage('system', 
        <div className="text-red-600">
          Failed to generate video script. Please try again.
        </div>,
        'response'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportAudit = async () => {
    if (!story) return;

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
      
      addMessage('system', 
        <div className="text-green-600">
          ✓ Package exported successfully!
        </div>,
        'response'
      );
    } catch (error) {
      console.error('Export error:', error);
      addMessage('system', 
        <div className="text-red-600">
          Failed to export package.
        </div>,
        'response'
      );
    }
  };

  const renderInputSection = () => {
    if (isGenerating) return null;

    switch (currentStep) {
      case 'market':
        return (
          <div className="p-4 border-t bg-white">
            <MarketSelector value={market} onChange={handleMarketSelect} />
          </div>
        );
      
      case 'need':
        return (
          <div className="p-4 border-t bg-white">
            <MaslowSelection onNeedChange={handleNeedSelect} />
          </div>
        );
      
      case 'archetype':
        return (
          <div className="p-4 border-t bg-white">
            <ArchetypeSelector 
              market={market} 
              value={archetype} 
              onChange={handleArchetypeSelect} 
            />
          </div>
        );
      
      case 'tone':
        return (
          <div className="p-4 border-t bg-white">
            <ToneSelector 
              market={market} 
              value={tone} 
              onChange={handleToneSelect} 
            />
          </div>
        );
      
      case 'context':
        return (
          <div className="p-4 border-t bg-white">
            <form onSubmit={(e) => { e.preventDefault(); handleContextSubmit(); }}>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Describe your story scene... (characters, setting, situation)"
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!context.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={16} />
                  Submit Context
                </button>
              </div>
            </form>
          </div>
        );
      
      case 'brand':
        return (
          <div className="p-4 border-t bg-white">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand Name (Optional)
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Enter brand name..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <BrandGuideUpload onParseComplete={handleBrandUpload} />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleBrandUpload(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Skip Brand Guide
              </button>
            </div>
          </div>
        );
      
      case 'template':
        return (
          <div className="p-4 border-t bg-white">
            <TemplateSelector value={template} onChange={handleTemplateSelect} />
          </div>
        );
      
      case 'generate':
        return (
          <div className="p-4 border-t bg-white">
            <button
              onClick={handleGenerateStory}
              disabled={isGenerating}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-3 text-lg font-medium"
            >
              <Sparkles size={24} />
              {isGenerating ? 'Generating...' : 'Generate Story'}
            </button>
          </div>
        );
      
      case 'images':
        return (
          <div className="p-4 border-t bg-white">
            <button
              onClick={handleGenerateImages}
              disabled={isGenerating}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-3 text-lg font-medium"
            >
              <ImageIcon size={24} />
              {isGenerating ? 'Generating...' : 'Generate All Images'}
            </button>
            <p className="text-sm text-gray-500 text-center mt-2">
              Creates visuals for all {story?.beatSheet.length} scenes
            </p>
          </div>
        );
      
      case 'video':
        return (
          <div className="p-4 border-t bg-white">
            <button
              onClick={handleGenerateVideoScript}
              disabled={isGenerating}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-3 text-lg font-medium"
            >
              <VideoIcon size={24} />
              {isGenerating ? 'Creating...' : 'Create Video Script'}
            </button>
          </div>
        );
      
      case 'complete':
        return (
          <div className="p-4 border-t bg-white">
            <button
              onClick={() => {
                // Reset for new story
                setNeed('');
                setArchetype('');
                setTone('');
                setContext('');
                setBrandName('');
                setBrandGuide(null);
                setStory(null);
                setVideoScript(null);
                setGeneratedImages({});
                setCurrentStep('market');
                
                addMessage('system', 
                  <div>
                    <p>Great! Let's create another amazing story. Which market are we targeting?</p>
                  </div>,
                  'question'
                );
              }}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg flex items-center justify-center gap-3 text-lg font-medium"
            >
              <Sparkles size={24} />
              Create New Story
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Narratives.XO</h1>
              <p className="text-xs text-gray-500">AI Story Generator</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {Object.keys(generatedImages).length > 0 
              ? `${Object.keys(generatedImages).length} images generated`
              : story 
                ? 'Story ready'
                : 'Creating story...'
            }
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'system' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
              )}

              <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-1' : 'order-2'}`}>
                <div
                  className={`
                    px-4 py-3 rounded-2xl
                    ${message.sender === 'system'
                      ? 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-sm'
                    }
                  `}
                >
                  {message.content}
                </div>
                <div className={`text-xs mt-1 ${message.sender === 'system' ? 'text-gray-500' : 'text-blue-500 text-right'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {message.sender === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center order-2">
                  <UserIcon size={16} className="text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isGenerating && currentStep !== 'images' && currentStep !== 'video' && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
                  <span className="text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Section */}
      {renderInputSection()}
    </div>
  );
}