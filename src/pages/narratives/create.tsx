import { useState, useRef, useEffect } from 'react';
import MarketSelector from '@/components/MarketSelector';
import MaslowSelection from '@/components/MaslowSliders';
import ArchetypeSelector from '@/components/ArchetypeSelector';
import ToneSelector from '@/components/ToneSelector';
import BrandGuideUpload from '@/components/BrandGuideUpload';
import TemplateSelector from '@/components/TemplateSelector';
import { 
  GeneratedStory, 
  VideoScript, 
  BrandAssets, 
  CCNInterpretation
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
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Brain,
  HelpCircle
} from 'lucide-react';
import Layout from '@/components/Layout';
import CCNClarifier from '@/components/CCNClarification';

type Market = 'ng' | 'uk' | 'fr';

type Message = {
  id: number;
  sender: 'system' | 'user';
  content: React.ReactNode;
  timestamp: Date;
  type?: 'selection' | 'response' | 'generated' | 'question';
};

type Step = 'market' | 'need' | 'archetype' | 'tone' | 'context' | 'brand' | 'template' | 'generate' | 'images' | 'video' | 'complete';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: { url: string; title: string; description: string }[];
  initialIndex: number;
}

const ImageModal = ({ isOpen, onClose, images, initialIndex }: ImageModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="relative w-full max-w-6xl h-full max-h-[90vh]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-gray-900/80 text-white rounded-full hover:bg-gray-800 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Previous button */}
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-gray-900/80 text-white rounded-full hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Next button */}
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-gray-900/80 text-white rounded-full hover:bg-gray-800 transition-colors"
        >
          <ChevronRight size={24} />
        </button>

        {/* Image and details */}
        <div className="flex flex-col md:flex-row h-full gap-6">
          {/* Image container */}
          <div className="flex-1 flex items-center justify-center">
            <img
              src={images[currentIndex].url}
              alt={images[currentIndex].title}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>

          {/* Info panel */}
          <div className="md:w-80 bg-gray-900/80 rounded-lg p-6 text-white overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">{images[currentIndex].title}</h3>
                <div className="text-sm bg-purple-600 px-3 py-1 rounded-full">
                  {currentIndex + 1} / {images.length}
                </div>
              </div>
              <p className="text-gray-300">{images[currentIndex].description}</p>
            </div>

            {/* Navigation thumbnails */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold mb-3 text-gray-400">All Images</h4>
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`relative rounded overflow-hidden border-2 transition-all ${
                      currentIndex === index
                        ? 'border-purple-500'
                        : 'border-transparent hover:border-gray-600'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-16 object-cover"
                    />
                    {currentIndex === index && (
                      <div className="absolute inset-0 bg-purple-500/20"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
<button
  onClick={() => {
    const currentImage = images[currentIndex];

    // Create a small HTML page as a blob
    const htmlContent = `
      <html>
        <body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;">
          <a id="downloadLink" href="${currentImage.url}" download="scene-${currentIndex + 1}-${currentImage.title
            .toLowerCase()
            .replace(/\s+/g, '-')}.png"></a>
          <script>
            document.getElementById('downloadLink').click();
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Open the blob URL in a new tab
    window.open(url, '_blank');
  }}
  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
>
  <Download size={18} />
  Download This Image
</button>

{/* 
              <button
                onClick={() => {
                  const link = document.createElement('a');
                      window.open(images[currentIndex].url, '_blank');

                  link.href = images[currentIndex].url;
                  link.download = `scene-${currentIndex + 1}-${images[currentIndex].title.toLowerCase().replace(/\s+/g, '-')}.png`;
                  link.click();
                }}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Download This Image
              </button> */}
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(images[currentIndex].url);
                  alert('Image URL copied to clipboard!');
                }}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
              >
                <Copy size={18} />
                Copy Image URL
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard shortcuts info */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-sm text-gray-400">
          Use ← → arrow keys or click arrows to navigate • ESC to close
        </div>
      </div>
    </div>
  );
};

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
  const [ccnInterpretation, setCcnInterpretation] = useState<CCNInterpretation | null>(null);
const [showCCN, setShowCCN] = useState(false);
const [entryPathway, setEntryPathway] = useState<'emotion' | 'audience' | 'scene' | 'seed'>('scene');
const [userInput, setUserInput] = useState('');
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
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    currentIndex: number;
  }>({
    isOpen: false,
    currentIndex: 0
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!imageModal.isOpen) return;
      
      if (e.key === 'Escape') {
        setImageModal({ isOpen: false, currentIndex: 0 });
      } else if (e.key === 'ArrowLeft') {
        setImageModal(prev => ({
          ...prev,
          currentIndex: prev.currentIndex === 0 
            ? Object.keys(generatedImages).length - 1 
            : prev.currentIndex - 1
        }));
      } else if (e.key === 'ArrowRight') {
        setImageModal(prev => ({
          ...prev,
          currentIndex: prev.currentIndex === Object.keys(generatedImages).length - 1 
            ? 0 
            : prev.currentIndex + 1
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageModal.isOpen, generatedImages]);

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

  const openImageModal = (index: number) => {
    setImageModal({
      isOpen: true,
      currentIndex: index
    });
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
      <div className="border rounded-lg p-3">
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

  const handleCCNInference = async (input: string, pathway: 'emotion' | 'audience' | 'scene' | 'seed') => {
  setIsGenerating(true);
  setUserInput(input);
  setEntryPathway(pathway);
  
  addMessage('user', 
    <div className="border rounded-lg p-3 bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="text-xs text-blue-600 mb-1">{pathway.replace('-', ' ').toUpperCase()} INPUT</div>
      <p className="text-sm">{input}</p>
    </div>,
    'selection'
  );

  try {
    const res = await fetch('/api/clarify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInput: input,
        entryPathway: pathway,
        market
      })
    });
    
    const data = await res.json();
    
    if (data.success) {
      setCcnInterpretation(data.interpretation);
      
      // Show interpretation
      addMessage('system',
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-purple-600">
            <Brain size={20} />
            <span className="font-medium">Analyzed your input</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-xs text-gray-500 mb-1">Need</div>
              <div className="font-medium">{data.interpretation.inferredNeed}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-xs text-gray-500 mb-1">Confidence</div>
              <div className="font-medium">
                {Math.round(data.interpretation.confidence * 100)}%
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-xs text-gray-500 mb-1">Archetype</div>
              <div className="font-medium">{data.interpretation.inferredArchetype}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-xs text-gray-500 mb-1">Tone</div>
              <div className="font-medium">{data.interpretation.inferredTone}</div>
            </div>
          </div>
          
          {data.requiresClarification ? (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Just need to clarify a few details...
              </p>
              <button
                onClick={() => setShowCCN(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg flex items-center gap-2"
              >
                <HelpCircle size={16} />
                Review Clarifications
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Ready to generate your story?
              </p>
              <button
                onClick={() => {
                  // Auto-fill the form with CCN inferences
                  setNeed(data.interpretation.inferredNeed);
                  setArchetype(data.interpretation.inferredArchetype);
                  setTone(data.interpretation.inferredTone);
                  setContext(data.interpretation.inferredContext);
                  
                  addMessage('system',
                    <div>
                      <p>Great! I'll use these settings. Ready for brand guidance? (Optional)</p>
                    </div>,
                    'question'
                  );
                  setCurrentStep('brand');
                }}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg"
              >
                Continue with These Settings →
              </button>
            </div>
          )}
        </div>,
        'response'
      );
      
      if (data.requiresClarification) {
        setShowCCN(true);
      }
    }
  } catch (error) {
    console.error('CCN inference error:', error);
    addMessage('system',
      <div className="text-red-600">
        Sorry, I couldn't analyze your input. Let's proceed manually.
      </div>,
      'response'
    );
    setCurrentStep('need');
  } finally {
    setIsGenerating(false);
  }
};

const handleCCNClarify = (answers: { [key: string]: string }) => {
  if (!ccnInterpretation) return;
  
  // Update interpretation with user answers
  const updatedInterpretation = {
    ...ccnInterpretation,
    inferredNeed: answers.need || ccnInterpretation.inferredNeed,
    inferredArchetype: answers.archetype || ccnInterpretation.inferredArchetype,
    inferredTone: answers.tone || ccnInterpretation.inferredTone,
    inferredContext: answers.context || ccnInterpretation.inferredContext,
    confidence: 0.9 // High confidence after clarification
  };
  
  setCcnInterpretation(updatedInterpretation);
  setShowCCN(false);
  
  // Auto-fill the form
  setNeed(updatedInterpretation.inferredNeed);
  setArchetype(updatedInterpretation.inferredArchetype);
  setTone(updatedInterpretation.inferredTone);
  setContext(updatedInterpretation.inferredContext);
  
  addMessage('system',
    <div>
      <div className="text-green-600 mb-2">✓ Clarifications saved!</div>
      <p>Perfect! Ready to add brand guidance? (Optional)</p>
    </div>,
    'question'
  );
  
  setCurrentStep('brand');
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
      
      const imageItems = story.beatSheet.map((scene, index) => {
        if (imageMap[index]) {
          return {
            url: imageMap[index],
            title: `Scene ${index + 1}: ${scene.beat}`,
            description: scene.description
          };
        }
        return null;
      }).filter(Boolean);

      addMessage('system', 
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-green-600">
            <Check size={20} />
            <span className="font-medium">Generated {Object.keys(imageMap).length} images!</span>
          </div>
          
          <div className="space-y-6">
            {story.beatSheet.map((scene, index) => (
              imageMap[index] && (
                <div 
                  key={index} 
                  className="space-y-4 p-4 bg-white rounded-xl border hover:border-purple-300 transition-colors cursor-pointer"
                  onClick={() => openImageModal(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{scene.beat}</div>
                        <div className="text-sm text-gray-500">{scene.description}</div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openImageModal(index);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full"
                      title="View full size"
                    >
                      <Maximize2 size={16} className="text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="relative group">
                    <img 
                      src={imageMap[index]} 
                      alt={`Scene ${index + 1}: ${scene.beat}`}
                      className="w-full h-80 object-cover rounded-lg border-2 border-purple-200 group-hover:border-purple-400 transition-colors"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white text-sm bg-black/60 px-3 py-2 rounded-full">
                        Click to enlarge • {index + 1} of {story.beatSheet.length}
                      </div>
                    </div>
                  </div>
                  
                  {scene.visualCues.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {scene.visualCues.map((cue, i) => (
                        <span 
                          key={i}
                          className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full"
                        >
                          {cue}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => openImageModal(0)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg flex items-center gap-2"
            >
              <Maximize2 size={16} />
              View All Images in Gallery
            </button>
          </div>
          
          <p className="text-sm text-gray-600">
            Ready to create a video script?
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
                {data.videoScript.voiceOver.map((line: any, index: number) => (
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
                {data.videoScript.shots.map((shot: any, index: number) => (
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
              Download Script
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
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {(['scene', 'emotion', 'audience', 'seed'] as const).map((pathway) => (
            <button
              key={pathway}
              onClick={() => {
                setEntryPathway(pathway);
                // You could show different input prompts here
              }}
              className={`p-3 rounded-lg border text-center ${
                entryPathway === pathway
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="text-sm font-medium capitalize">
                {pathway.replace('-', ' ')}
              </div>
            </button>
          ))}
        </div>
        
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder={
            entryPathway === 'scene' ? "Describe your scene (setting, characters, situation)..." :
            entryPathway === 'emotion' ? "What emotion or feeling inspires this story?..." :
            entryPathway === 'audience' ? "Who is this story for? Describe your audience..." :
            "What's the seed of your story? An idea, overheard conversation, memory..."
          }
          className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (context.trim().length > 2) {
                handleCCNInference(context, entryPathway);
              } else {
                handleContextSubmit();
              }
            }}
            disabled={!context.trim()}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Brain size={16} />
            Analyze & Infer Story Elements
          </button>
          <button
            onClick={handleContextSubmit}
            disabled={!context.trim()}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Skip Analysis
          </button>
        </div>
        
        <p className="text-xs text-gray-500 text-center">
          Using CCN will infer needs, archetypes, and tone from your input
        </p>
      </div>
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

  const imageGalleryData = story?.beatSheet
    .map((scene, index) => ({
      url: generatedImages[index] || '',
      title: `Scene ${index + 1}: ${scene.beat}`,
      description: scene.description
    }))
    .filter(item => item.url) || [];

  return (
     <Layout>

    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}

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

      {/* Image Modal */}
      {imageModal.isOpen && (
        <ImageModal
          isOpen={imageModal.isOpen}
          onClose={() => setImageModal({ isOpen: false, currentIndex: 0 })}
          images={imageGalleryData}
          initialIndex={imageModal.currentIndex}
        />
      )}
      {showCCN && ccnInterpretation && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
    <div className="relative w-full max-w-2xl">
      <button
        onClick={() => setShowCCN(false)}
        className="absolute top-4 right-4 z-10 p-2 bg-gray-900/80 text-white rounded-full hover:bg-gray-800"
      >
        <X size={24} />
      </button>
      <CCNClarifier
        questions={ccnInterpretation.clarifications}
        onClarify={handleCCNClarify}
        onSkip={() => {
          setShowCCN(false);
          // Use original inferences
          setNeed(ccnInterpretation.inferredNeed);
          setArchetype(ccnInterpretation.inferredArchetype);
          setTone(ccnInterpretation.inferredTone);
          setContext(ccnInterpretation.inferredContext);
          setCurrentStep('brand');
        }}
      />
    </div>
  </div>
)}
    </div>
    </Layout>
  );
}