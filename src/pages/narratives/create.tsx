import { useState, useRef, useEffect } from "react";
import MarketSelector from "@/components/MarketSelector";
import BrandGuideUpload from "@/components/BrandGuideUpload";
import TemplateSelector from "@/components/TemplateSelector";
import ProtectedPage from '@/components/ProtectedPage';

import {
  GeneratedStory,
  VideoScript,
  BrandAssets,
  CCNInterpretationRevised, // Use the new type
  UserMode,
} from "@/types";
import {
  Sparkles,
  Image as ImageIcon,
  Video as VideoIcon,
  Download,
  Copy,
  Bot,
  User as UserIcon,
  Globe,
  FileText,
  Palette,
  Film,
  Send,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Brain,
  HelpCircle,
  MessageSquare,
  Upload,
  Zap,
  Type,
  Headphones,
  Share2,
} from "lucide-react";
import Layout from "@/components/Layout";

type Market = "ng" | "uk" | "fr";

type Message = {
  id: number;
  sender: "system" | "user";
  content: React.ReactNode;
  timestamp: Date;
  type?: "selection" | "response" | "generated" | "question";
};

type Step =
  | "location"
  | "entry"
  | "understanding"
  | "clarification"
  | "brand-check"
  | "brand-upload"
  | "output-purpose"
  | "story-generation"
  | "review"
  | "video-option"
  | "images"
  | "images-complete"
  | "video"
  | "export"
  | "complete";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: { url: string; title: string; description: string }[];
  initialIndex: number;
}

const ImageModal = ({
  isOpen,
  onClose,
  images,
  initialIndex,
}: ImageModalProps) => {
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
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-gray-900/80 text-white rounded-full hover:bg-gray-800 transition-colors"
        >
          <X size={24} />
        </button>

        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-gray-900/80 text-white rounded-full hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-gray-900/80 text-white rounded-full hover:bg-gray-800 transition-colors"
        >
          <ChevronRight size={24} />
        </button>

        <div className="flex flex-col md:flex-row h-full gap-6">
          <div className="flex-1 flex items-center justify-center">
            <img
              src={images[currentIndex].url}
              alt={images[currentIndex].title}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>

          <div className="md:w-80 bg-gray-900/80 rounded-lg p-6 text-white overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">
                  {images[currentIndex].title}
                </h3>
                <div className="text-sm bg-purple-600 px-3 py-1 rounded-full">
                  {currentIndex + 1} / {images.length}
                </div>
              </div>
              <p className="text-gray-300">
                {images[currentIndex].description}
              </p>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-semibold mb-3 text-gray-400">
                All Images
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`relative rounded overflow-hidden border-2 transition-all ${
                      currentIndex === index
                        ? "border-purple-500"
                        : "border-transparent hover:border-gray-600"
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

            <div className="space-y-3">
              <button
                onClick={() => {
                  const currentImage = images[currentIndex];
                  const htmlContent = `
                    <html>
                      <body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;">
                        <a id="downloadLink" href="${currentImage.url}" download="scene-${
                    currentIndex + 1
                  }-${currentImage.title
                    .toLowerCase()
                    .replace(/\s+/g, "-")}.png"></a>
                        <script>
                          document.getElementById('downloadLink').click();
                        </script>
                      </body>
                    </html>
                  `;

                  const blob = new Blob([htmlContent], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  window.open(url, "_blank");
                }}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Download This Image
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(images[currentIndex].url);
                  alert("Image URL copied to clipboard!");
                }}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
              >
                <Copy size={18} />
                Copy Image URL
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-sm text-gray-400">
          Use ← → arrow keys or click arrows to navigate • ESC to close
        </div>
      </div>
    </div>
  );
};

export default function Create() {
  // State
  const [market, setMarket] = useState<Market>("ng");
  const [userInput, setUserInput] = useState("");
  const [systemUnderstanding, setSystemUnderstanding] = useState("");
  const [brandName, setBrandName] = useState<string>("");
  const [brandGuide, setBrandGuide] = useState<BrandAssets | null>(null);
  const [template, setTemplate] = useState<string>("instagram-reel");
  const [story, setStory] = useState<GeneratedStory | null>(null);
  const [videoScript, setVideoScript] = useState<VideoScript | null>(null);
  const [generatedImages, setGeneratedImages] = useState<{
    [key: string]: string;
  }>({});
  
  // UI State
const [ccnInterpretation, setCcnInterpretation] = useState<CCNInterpretationRevised | null>(null);
  const [clarificationQuestion, setClarificationQuestion] = useState<{
    question: string;
    field: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("location");
  const [userMode, setUserMode] = useState<UserMode>("creator");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "system",
      content: "Hi! I'm Narratives.XO. Let's create an amazing story together.",
      timestamp: new Date(),
      type: "question",
    },
  ]);
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    currentIndex: number;
  }>({
    isOpen: false,
    currentIndex: 0,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!imageModal.isOpen) return;

      if (e.key === "Escape") {
        setImageModal({ isOpen: false, currentIndex: 0 });
      } else if (e.key === "ArrowLeft") {
        setImageModal((prev) => ({
          ...prev,
          currentIndex:
            prev.currentIndex === 0
              ? Object.keys(generatedImages).length - 1
              : prev.currentIndex - 1,
        }));
      } else if (e.key === "ArrowRight") {
        setImageModal((prev) => ({
          ...prev,
          currentIndex:
            prev.currentIndex === Object.keys(generatedImages).length - 1
              ? 0
              : prev.currentIndex + 1,
        }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imageModal.isOpen, generatedImages]);

  const addMessage = (
    sender: "system" | "user",
    content: React.ReactNode,
    type?: "selection" | "response" | "generated" | "question"
  ) => {
    const newMessage: Message = {
      id: messages.length + 1,
      sender,
      content,
      timestamp: new Date(),
      type,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const simulateTyping = (duration = 1000) => {
    return new Promise((resolve) => setTimeout(resolve, duration));
  };

  const openImageModal = (index: number) => {
    setImageModal({
      isOpen: true,
      currentIndex: index,
    });
  };

  // Step 0a: Location Selection
  const handleMarketSelect = async (selectedMarket: Market) => {
    setMarket(selectedMarket);

    addMessage(
      "user",
      <div className="flex items-center gap-2">
        <Globe size={16} />
        <span className="font-medium">
          {selectedMarket.toUpperCase()} Market
        </span>
      </div>,
      "selection"
    );

    await simulateTyping(800);

    // Step 1: Direct Entry Prompt
    addMessage(
      "system",
      <div className="space-y-4">
        <p className="font-medium">What moment are you trying to express?</p>
        <p className="text-sm text-gray-500">
          Describe your moment in your own words...
        </p>
      </div>,
      "question"
    );

    setCurrentStep("entry");
  };

  // Update the handleEntrySubmit function:

const handleEntrySubmit = async (clarificationAnswer?: string) => {
  const inputToSend = clarificationAnswer || userInput;
  
  if (!inputToSend.trim()) {
    addMessage(
      "system",
      <div className="text-amber-600">
        Please describe your moment first.
      </div>,
      "response"
    );
    return;
  }

  if (inputToSend.trim().length < 3) {
    addMessage(
      "system",
      <div className="text-amber-600">
        Please provide a bit more detail so I can understand your vision better.
      </div>,
      "response"
    );
    return;
  }

  // Show user message
  if (!clarificationAnswer) {
    addMessage(
      "user",
      <div className="border rounded-lg p-3 bg-gradient-to-r from-blue-50 to-purple-50">
        <p className="text-sm">{inputToSend}</p>
      </div>,
      "selection"
    );
    setUserInput(""); // Clear input
  } else {
    addMessage(
      "user",
      <div className="border rounded-lg p-3 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="text-xs text-green-600 mb-1">CLARIFICATION ANSWER</div>
        <p className="text-sm">{inputToSend}</p>
      </div>,
      "selection"
    );
    setUserInput(""); // Clear input for clarification answer too
  }

  setIsGenerating(true);
  
  // Step 2: CCN Analysis
  try {
    const res = await fetch("/api/clarify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userInput: inputToSend,
        market,
        isClarificationResponse: !!clarificationAnswer, // Tell API this is a clarification response
        previousClarification: clarificationQuestion?.field,
        previousAnswer: clarificationAnswer,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setCcnInterpretation(data.interpretation);
      
      // If this is the first time AND we need clarification AND we haven't asked yet
      if (!clarificationAnswer && data.requiresClarification && !clarificationQuestion) {
        // Show clarification question
        setClarificationQuestion({
          question: data.clarificationQuestion.question,
          field: data.clarificationQuestion.field,
        });
        
        await simulateTyping(1200);
        
        addMessage(
          "system",
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-600">
              <Brain size={20} />
              <span className="font-medium">To understand you better...</span>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-500">
              <p className="font-medium">{data.clarificationQuestion.question}</p>
            </div>
            <p className="text-sm text-gray-500">
              Type your answer below to help me understand your intention.
            </p>
          </div>,
          "response"
        );
        
        setCurrentStep("clarification");
      } else {
        // Always show understanding preview after user's response (whether it's initial or clarification)
        const understanding = data.understandingPreview || data.interpretation.understandingPreview;
        setSystemUnderstanding(understanding);
        
        await simulateTyping(1200);
        
        addMessage(
          "system",
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <Check size={20} />
              <span className="font-medium">Understanding Preview</span>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500">
              <p className="font-medium">{understanding}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleUnderstandingConfirm(true)}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                ✓ Yes, that's right
              </button>
              <button
                onClick={() => {
                  setClarificationQuestion(null);
                  setCurrentStep("entry");
                  addMessage(
                    "system",
                    <div>
                      <p>Please rewrite your message:</p>
                    </div>,
                    "question"
                  );
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                Rewrite my message
              </button>
            </div>
          </div>,
          "response"
        );
        
        // Reset clarification question since we've shown understanding
        setClarificationQuestion(null);
        setCurrentStep("understanding");
      }
    }
  } catch (error) {
    console.error("CCN analysis error:", error);
    
    await simulateTyping(800);
    
    // Even on error, show a fallback understanding preview
    addMessage(
      "system",
      <div className="space-y-4">
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-l-4 border-amber-500">
          <p className="font-medium">A meaningful moment about personal experience.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleUnderstandingConfirm(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all"
          >
            ✓ Yes, that's right
          </button>
          <button
            onClick={() => {
              setClarificationQuestion(null);
              setCurrentStep("entry");
              addMessage(
                "system",
                <div>
                  <p>Please rewrite your message:</p>
                </div>,
                "question"
              );
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
          >
            Rewrite my message
          </button>
        </div>
      </div>,
      "response"
    );
    
    setCurrentStep("understanding");
  } finally {
    setIsGenerating(false);
  }
};

  // Step 2: Understanding Confirmation
  const handleUnderstandingConfirm = async (confirmed: boolean) => {
    if (!confirmed) {
      setCurrentStep("entry");
      addMessage(
        "system",
        <div>
          <p>Please rewrite your message:</p>
        </div>,
        "question"
      );
      return;
    }

    addMessage(
      "user",
      <div className="flex items-center gap-2">
        <Check size={16} className="text-green-600" />
        <span className="font-medium">Yes, that's right</span>
      </div>,
      "selection"
    );

    await simulateTyping(800);

    // Step 3: Brand Check
    addMessage(
      "system",
      <div className="space-y-4">
        <p>Are you working with a brand for this?</p>
        <div className="flex gap-3">
          <button
            onClick={() => handleBrandCheck(false)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg"
          >
            No, personal use
          </button>
          <button
            onClick={() => handleBrandCheck(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Yes, for a brand
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Default path is No. Brand option requires brand assets.
        </p>
      </div>,
      "question"
    );

    setCurrentStep("brand-check");
  };

  // Step 3: Brand Check
  const handleBrandCheck = async (withBrand: boolean) => {
    addMessage(
      "user",
      <div className="flex items-center gap-2">
        <Palette size={16} className={withBrand ? "text-purple-600" : "text-gray-600"} />
        <span className="font-medium">
          {withBrand ? "Yes, for a brand" : "No, personal use"}
        </span>
      </div>,
      "selection"
    );

    await simulateTyping(800);

    if (withBrand) {
      addMessage(
        "system",
        <div className="space-y-4">
          <p>Please upload your brand assets:</p>
          <p className="text-xs text-amber-600">
            ⚠️ Disclaimer: Your selected brand may not be displayed accurately due to copyright considerations.
          </p>
        </div>,
        "question"
      );
      setCurrentStep("brand-upload");
    } else {
      // Skip to output purpose selection
      handleOutputPurpose();
    }
  };

  // Step 3a: Brand Asset Upload
  const handleBrandUpload = async (assets: BrandAssets | null) => {
    setBrandGuide(assets);

    if (assets) {
      addMessage(
        "user",
        <div className="flex items-center gap-2">
          <Upload size={16} className="text-green-600" />
          <span className="font-medium">Brand assets uploaded</span>
        </div>,
        "selection"
      );
    }

    await simulateTyping(800);
    handleOutputPurpose();
  };

  // Step 4: Output Purpose Selection
  const handleOutputPurpose = async () => {
    addMessage(
      "system",
      <div className="space-y-4">
        <p>How will you use this?</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleOutputModeSelect("creator")}
            className="p-4 border rounded-lg text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <MessageSquare size={16} className="text-blue-600" />
              </div>
            </div>
            <div className="font-medium">Creator</div>
            <div className="text-sm text-gray-600 mt-1">
              For personal or social use
            </div>
          </button>
          <button
            onClick={() => handleOutputModeSelect("agency")}
            className="p-4 border rounded-lg text-left hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <FileText size={16} className="text-purple-600" />
              </div>
            </div>
            <div className="font-medium">Agency</div>
            <div className="text-sm text-gray-600 mt-1">
              For presentations or clients
            </div>
          </button>
          <button
            onClick={() => handleOutputModeSelect("brand")}
            className="p-4 border rounded-lg text-left hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Headphones size={16} className="text-green-600" />
              </div>
            </div>
            <div className="font-medium">Brand</div>
            <div className="text-sm text-gray-600 mt-1">
              For safe, publish-ready content
            </div>
          </button>
        </div>
      </div>,
      "question"
    );

    setCurrentStep("output-purpose");
  };

  // Step 4a/b/c: Output Mode Selection
  const handleOutputModeSelect = async (mode: UserMode) => {
    setUserMode(mode);

    addMessage(
      "user",
      <div className="flex items-center gap-2">
        <Zap size={16} className="text-blue-600" />
        <span className="font-medium">{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
      </div>,
      "selection"
    );

    await simulateTyping(800);

    const modeConfirmations = {
      creator: "I'll format this story for creators - expressive and social-friendly.",
      agency: "I'll structure this clearly for presentations and client decks.",
      brand: "I'll keep this story on-brand with safety filters and consistency rules."
    };

    addMessage(
      "system",
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-500">
        <p className="font-medium">✓ {modeConfirmations[mode]}</p>
      </div>,
      "response"
    );

    await simulateTyping(1000);

    // Step 5: Story Generation
    addMessage(
      "system",
      <div className="space-y-4">
        <p>Ready to generate your story?</p>
        <button
          onClick={handleGenerateStory}
          className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg flex items-center justify-center gap-3 text-lg font-medium"
        >
          <Sparkles size={24} />
          Generate Story
        </button>
        <p className="text-sm text-gray-500 text-center">
          Choose your output format first:
        </p>
      </div>,
      "question"
    );

    setCurrentStep("story-generation");
  };

  // Step 5: Generate Story
  const handleGenerateStory = async () => {
    if (!ccnInterpretation) return;

    setIsGenerating(true);

    addMessage(
      "user",
      <div className="flex items-center gap-2">
        <Sparkles size={16} />
        <span className="font-medium">Generate Story</span>
      </div>,
      "selection"
    );

    const loadingId = messages.length + 1;
    setMessages((prev) => [
      ...prev,
      {
        id: loadingId,
        sender: "system",
        content: (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
            <span>Crafting your story...</span>
          </div>
        ),
        timestamp: new Date(),
        type: "response",
      },
    ]);

    try {
      const res = await fetch("/api/generateStory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          market,
          semanticExtraction: {
            emotion: ccnInterpretation.emotion,
            scene: ccnInterpretation.scene,
            seedMoment: ccnInterpretation.seedMoment,
            audience: ccnInterpretation.audience,
            intentSummary: ccnInterpretation.intentSummary,
            pathway: ccnInterpretation.pathway,
          },
          brand: brandGuide ? { name: brandName, ...brandGuide } : undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Unknown error");
      }

      const generatedStory: GeneratedStory = {
        story: data.story,
        beatSheet: data.beatSheet,
        metadata: data.metadata,
      };

      setStory(generatedStory);

      setMessages((prev) => prev.filter((msg) => msg.id !== loadingId));

      // Show generated story
      addMessage(
        "system",
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
            <h3 className="font-semibold text-lg mb-2">
              {generatedStory.metadata.title}
            </h3>
            <p className="text-gray-700 whitespace-pre-line">
              {generatedStory.story}
            </p>
            <div className="mt-3 text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span>🎯 {generatedStory.metadata.archetype}</span>
                <span>🎭 {generatedStory.metadata.tone}</span>
                <span>⏱️ {generatedStory.metadata.estimatedDuration}</span>
                <span>🎬 {generatedStory.beatSheet.length} scenes</span>
              </div>
            </div>
          </div>

          {/* Step 6: Review & Next Steps */}
          <div className="space-y-4">
            <p className="font-medium">What would you like to do next?</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setCurrentStep("images")}
                className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
              >
                <ImageIcon size={18} />
                Generate Images
              </button>
              <button
                onClick={() => setCurrentStep("video-option")}
                className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
              >
                <VideoIcon size={18} />
                Generate Video Script
              </button>
            </div>
            
            <div className="mt-3">
              <button
                onClick={() => setCurrentStep("export")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Export Story Text
              </button>
            </div>
          </div>
        </div>,
        "generated"
      );

    } catch (error) {
      console.error("❌ Story generation error:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingId));
      addMessage(
        "system",
        <div className="text-red-600">
          Failed to generate story. Please try again.
        </div>,
        "response"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 6a: Generate Images
  const handleGenerateImages = async () => {
    if (!story) return;

    setIsGenerating(true);

    addMessage(
      "user",
      <div className="flex items-center gap-2">
        <ImageIcon size={16} />
        <span className="font-medium">Generate Images</span>
      </div>,
      "selection"
    );

    const loadingId = messages.length + 1;
    setMessages((prev) => [
      ...prev,
      {
        id: loadingId,
        sender: "system",
        content: (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
            <span>Creating visuals for all scenes...</span>
          </div>
        ),
        timestamp: new Date(),
        type: "response",
      },
    ]);

    try {
      // Generate images for each scene in the beat sheet
      const imagePromises = story.beatSheet.map((scene, index) =>
        fetch("/api/generateImage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sceneDescription: scene.description,
            visualCues: scene.visualCues,
            tone: story.metadata.tone,
            market,
            brandSafe: true,
            brandPalette: brandGuide?.palette || [],
            template,
            beatIndex: index,
            beat: scene.beat,
          }),
        }).then((r) => r.json())
      );

      const results = await Promise.all(imagePromises);
      const imageMap: { [key: string]: string } = {};
      results.forEach((result, idx) => {
        if (result.success) {
          imageMap[idx] = result.imageUrl;
        }
      });

      setGeneratedImages(imageMap);

      // Remove loading message and show results
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingId));

      addMessage(
        "system",
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-green-600">
            <Check size={20} />
            <span className="font-medium">
              Generated {Object.keys(imageMap).length} images!
            </span>
          </div>

          {/* Image Gallery */}
          <div className="space-y-4">
            {story.beatSheet.map(
              (scene, index) =>
                imageMap[index] && (
                  <div
                    key={index}
                    className="space-y-3 p-4 bg-white rounded-xl border hover:border-purple-300 transition-colors cursor-pointer"
                    onClick={() => openImageModal(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {scene.beat}
                          </div>
                          <div className="text-sm text-gray-500">
                            {scene.description}
                          </div>
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
                        className="w-full h-64 object-cover rounded-lg border-2 border-purple-200 group-hover:border-purple-400 transition-colors"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-white text-sm bg-black/60 px-3 py-2 rounded-full">
                          Click to enlarge • Scene {index + 1}
                        </div>
                      </div>
                    </div>

                    {/* Visual Cues */}
                    {scene.visualCues.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {scene.visualCues.map((cue, i) => (
                          <span
                            key={i}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                          >
                            {cue}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => openImageModal(0)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg flex items-center gap-2"
            >
              <Maximize2 size={16} />
              View All Images in Gallery
            </button>
            <button
              onClick={() => setCurrentStep("video-option")}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg flex items-center gap-2"
            >
              <VideoIcon size={16} />
              Create Video Script
            </button>
            <button
              onClick={() => setCurrentStep("export")}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Export Package
            </button>
          </div>
        </div>,
        "generated"
      );

      setCurrentStep("images-complete");

    } catch (error) {
      console.error("Image generation failed:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingId));
      addMessage(
        "system",
        <div className="text-red-600">
          Failed to generate images. Please try again.
        </div>,
        "response"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 6b: Video Option
  const handleVideoOption = async () => {
    addMessage(
      "system",
      <div className="space-y-4">
        <p>Do you want to generate a short video?</p>
        <div className="flex gap-3">
          <button
            onClick={() => handleGenerateVideoScript()}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg"
          >
            Yes, generate video
          </button>
          <button
            onClick={() => setCurrentStep("images")}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            No, just images
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Video generation converts your story into prompts for video creation.
        </p>
      </div>,
      "question"
    );

    setCurrentStep("video-option");
  };

  // Step 6c: Video Script Generation
  const handleGenerateVideoScript = async () => {
    if (!story) return;

    setIsGenerating(true);

    addMessage(
      "user",
      <div className="flex items-center gap-2">
        <VideoIcon size={16} />
        <span className="font-medium">Create Video Script</span>
      </div>,
      "selection"
    );

    const loadingId = messages.length + 1;
    setMessages((prev) => [
      ...prev,
      {
        id: loadingId,
        sender: "system",
        content: (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
            <span>Creating video script...</span>
          </div>
        ),
        timestamp: new Date(),
        type: "response",
      },
    ]);

    try {
      const res = await fetch("/api/generateVideoScript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story,
          market,
          tone: story.metadata.tone,
          template,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Unknown error");
      }

      setVideoScript(data.videoScript);

      setMessages((prev) => prev.filter((msg) => msg.id !== loadingId));

      addMessage(
        "system",
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Video Script Ready! 🎬</h3>
              <div className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                {data.videoScript.totalDuration}s •{" "}
                {data.videoScript.shots.length} shots
              </div>
            </div>
            <div className="text-sm text-gray-700">
              Perfect for {template.replace("-", " ")} format
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                🎙️ Voice Over
              </h4>
              <div className="space-y-2">
                {data.videoScript.voiceOver.map((line: any, index: number) => (
                  <div
                    key={index}
                    className="text-sm bg-white p-3 rounded border"
                  >
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
                  <div
                    key={index}
                    className="text-sm bg-white p-3 rounded border"
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Shot {index + 1}</span>
                      <span className="text-xs text-gray-500">
                        {shot.duration}s
                      </span>
                    </div>
                    <div className="text-gray-600">{shot.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep("export")}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Export Package
            </button>
            <button
              onClick={() => handleGenerateImages()}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Generate Images Too
            </button>
          </div>
        </div>,
        "generated"
      );
    } catch (error) {
      console.error("Video script generation error:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingId));
      addMessage(
        "system",
        <div className="text-red-600">
          Failed to generate video script. Please try again.
        </div>,
        "response"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 7: Export
  const handleExport = async () => {
    if (!story) return;

    addMessage(
      "system",
      <div className="space-y-4">
        <p>How would you like to export your work?</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleExportFormat("pdf")}
            className="p-4 border rounded-lg text-center hover:border-red-300 hover:bg-red-50"
          >
            <div className="text-2xl mb-2">📄</div>
            <div className="font-medium">PDF</div>
            <div className="text-sm text-gray-600 mt-1">Document format</div>
          </button>
          <button
            onClick={() => handleExportFormat("csv")}
            className="p-4 border rounded-lg text-center hover:border-green-300 hover:bg-green-50"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium">CSV</div>
            <div className="text-sm text-gray-600 mt-1">Structured data</div>
          </button>
          <button
            onClick={() => handleExportFormat("json")}
            className="p-4 border rounded-lg text-center hover:border-blue-300 hover:bg-blue-50"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <div className="font-medium">JSON</div>
            <div className="text-sm text-gray-600 mt-1">Complete package</div>
          </button>
        </div>
      </div>,
      "question"
    );

    setCurrentStep("export");
  };

  const handleExportFormat = async (format: string) => {
    try {
      let data, filename, mimeType;

      switch (format) {
        case "json":
          data = {
            version: 'p2-revised-lite',
            timestamp: new Date().toISOString(),
            market,
            mode: userMode,
            brandApplied: !!brandGuide,
            brand: brandName || null,
            narrative: {
              story,
              videoScript,
              template,
              generatedImages,
              semanticExtraction: {
                emotion: ccnInterpretation?.emotion,
                scene: ccnInterpretation?.scene,
                seedMoment: ccnInterpretation?.seedMoment,
                audience: ccnInterpretation?.audience,
                intentSummary: ccnInterpretation?.intentSummary,
                pathway: ccnInterpretation?.pathway,
                confidence: ccnInterpretation?.confidence,
              }
            }
          };
          filename = `narrative-${market}-${Date.now()}.json`;
          mimeType = 'application/json';
          break;
        
        case "pdf":
          data = "PDF export would be generated here";
          filename = `story-${market}-${Date.now()}.pdf`;
          mimeType = 'application/pdf';
          break;
        
        case "csv":
          const csvData = [
            ['Field', 'Value'],
            ['Market', market],
            ['Title', story?.metadata.title || ''],
            ['Emotion', ccnInterpretation?.emotion || ''],
            ['Scene', ccnInterpretation?.scene || ''],
            ['Pathway', ccnInterpretation?.pathway || ''],
            ['Template', template],
            ['Generated Images', Object.keys(generatedImages).length],
            ['Created', new Date().toISOString()]
          ].map(row => row.join(',')).join('\n');
          data = csvData;
          filename = `story-data-${market}-${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      addMessage(
        "user",
        <div className="flex items-center gap-2">
          <Download size={16} />
          <span className="font-medium">Export as {format.toUpperCase()}</span>
        </div>,
        "selection"
      );

      await simulateTyping(800);

      addMessage(
        "system",
        <div className="text-green-600">
          ✓ Package exported successfully as {format.toUpperCase()}!
        </div>,
        "response"
      );

      // Step: Complete
      await simulateTyping(1000);

      addMessage(
        "system",
        <div className="space-y-4">
          <p>Your story creation is complete! Want to create another?</p>
          <button
            onClick={() => {
              // Reset for new story
              setUserInput("");
              setSystemUnderstanding("");
              setBrandName("");
              setBrandGuide(null);
              setStory(null);
              setVideoScript(null);
              setGeneratedImages({});
              setCcnInterpretation(null);
              setClarificationQuestion(null);
              setCurrentStep("location");
              setMessages([
                {
                  id: 1,
                  sender: "system",
                  content: "Hi! I'm Narratives.XO. Let's create another amazing story.",
                  timestamp: new Date(),
                  type: "question",
                },
              ]);
            }}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg flex items-center justify-center gap-3 text-lg font-medium"
          >
            <Sparkles size={24} />
            Create New Story
          </button>
        </div>,
        "question"
      );

      setCurrentStep("complete");

    } catch (error) {
      console.error("Export error:", error);
      addMessage(
        "system",
        <div className="text-red-600">
          Failed to export. Please try again.
        </div>,
        "response"
      );
    }
  };

  const renderInputSection = () => {
    if (isGenerating) return null;

    switch (currentStep) {
      case "location":
        return (
          <div className="p-4 border-t bg-white">
            <MarketSelector value={market} onChange={handleMarketSelect} />
          </div>
        );

      case "entry":
        return (
          <div className="p-4 border-t bg-white">
            <div className="space-y-4">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Describe your moment in your own words... (e.g., 'I felt inspired when...', 'A café in Lagos at dawn...', 'Everything is changing...')"
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleEntrySubmit()}
                  disabled={!userInput.trim() || userInput.trim().length < 3}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  <Send size={16} />
                  Share My Moment
                </button>
              </div>
            </div>
          </div>
        );

      case "clarification":
        return (
          <div className="p-4 border-t bg-white">
            <div className="space-y-4">
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">
                  {clarificationQuestion?.question}
                </p>
              </div>
              
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleEntrySubmit(userInput)}
                  disabled={!userInput.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  <Send size={16} />
                  Submit Answer
                </button>
              </div>
            </div>
          </div>
        );

      case "brand-upload":
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

      case "story-generation":
        return (
          <div className="p-4 border-t bg-white">
            <div className="space-y-4">
              <TemplateSelector
                value={template}
                onChange={(selectedTemplate) => setTemplate(selectedTemplate)}
              />
              <button
                onClick={handleGenerateStory}
                disabled={isGenerating}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-3 text-lg font-medium"
              >
                <Sparkles size={24} />
                {isGenerating ? "Generating..." : "Generate Story"}
              </button>
            </div>
          </div>
        );

      case "images":
        return (
          <div className="p-4 border-t bg-white">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Choose output format for images:
              </p>
              <TemplateSelector
                value={template}
                onChange={(selectedTemplate) => setTemplate(selectedTemplate)}
              />
              <button
                onClick={handleGenerateImages}
                disabled={isGenerating}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-3 text-lg font-medium"
              >
                <ImageIcon size={24} />
                {isGenerating ? "Generating..." : "Generate All Images"}
              </button>
              <p className="text-sm text-gray-500 text-center">
                Creates visuals for all {story?.beatSheet.length} scenes
              </p>
            </div>
          </div>
        );

      case "images-complete":
        return (
          <div className="p-4 border-t bg-white">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Your images are ready! What would you like to do next?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setCurrentStep("video-option")}
                  className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <VideoIcon size={18} />
                  Create Video Script
                </button>
                <button
                  onClick={() => setCurrentStep("export")}
                  className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Export Package
                </button>
              </div>
              <button
                onClick={() => openImageModal(0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                View Image Gallery Again
              </button>
            </div>
          </div>
        );

      case "video-option":
        return (
          <div className="p-4 border-t bg-white">
            <div className="space-y-4">
              <button
                onClick={handleGenerateVideoScript}
                disabled={isGenerating}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-3 text-lg font-medium"
              >
                <VideoIcon size={24} />
                {isGenerating ? "Creating..." : "Generate Video Script"}
              </button>
              <button
                onClick={() => setCurrentStep("images")}
                className="w-full px-6 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-3"
              >
                <ImageIcon size={24} />
                Generate Images Instead
              </button>
            </div>
          </div>
        );

      case "export":
        return (
          <div className="p-4 border-t bg-white">
            <button
              onClick={handleExport}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg flex items-center justify-center gap-3 text-lg font-medium"
            >
              <Share2 size={24} />
              Export Your Story
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const imageGalleryData =
    story?.beatSheet
      .map((scene, index) => ({
        url: generatedImages[index] || "",
        title: `Scene ${index + 1}: ${scene.beat}`,
        description: scene.description,
      }))
      .filter((item) => item.url) || [];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.sender === "system" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] ${
                    message.sender === "user" ? "order-1" : "order-2"
                  }`}
                >
                  <div
                    className={`
                    px-4 py-3 rounded-2xl
                    ${
                      message.sender === "system"
                        ? "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                        : "bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-sm"
                    }
                  `}
                  >
                    {message.content}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      message.sender === "system"
                        ? "text-gray-500"
                        : "text-blue-500 text-right"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {message.sender === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center order-2">
                    <UserIcon size={16} className="text-white" />
                  </div>
                )}
              </div>
            ))}

            {isGenerating && (
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
      </div>
    </Layout>
  );
}