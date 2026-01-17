import { useState, useRef, useEffect } from "react";
import BrandGuideUpload from "@/components/BrandGuideUpload";
import TemplateSelector from "@/components/TemplateSelector";
import ProtectedPage from "@/components/ProtectedPage";

import {
  GeneratedStory,
  VideoScript,
  BrandAssets,
  CCNInterpretationRevised,
  UserMode,
  Market,
  CharacterDescription,
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

type Message = {
  id: number;
  sender: "system" | "user";
  content: React.ReactNode;
  timestamp: Date;
  type?: "selection" | "response" | "generated" | "question";
};

type Step =
  | "entry"
  | "understanding"
  | "clarification"
  | "brand-upload"
  | "story-generated"
  | "story-purpose"  // ADDED
  | "images"
  | "images-complete"
  | "video-option"
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
                        <a id="downloadLink" href="${
                          currentImage.url
                        }" download="scene-${
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

type CCNData = {
  emotion: string;
  scene: string;
  seedMoment: string;
  audience: string;
  intentSummary: string;
  pathway: string;
  rawAnalysis?: string;
  market: string;
};

// Market config for display
const marketConfig = {
  ng: { 
    name: 'Nigeria', 
    icon: '🇳🇬'
  },
  uk: { 
    name: 'United Kingdom', 
    icon: '🇬🇧'
  },
  fr: { 
    name: 'France', 
    icon: '🇫🇷'
  }
};

export default function Create() {
  // State
  const [market, setMarket] = useState<Market>("ng");
  const [userInput, setUserInput] = useState("");
  const [originalUserInput, setOriginalUserInput] = useState("");
  const [systemUnderstanding, setSystemUnderstanding] = useState("");
  const [brandName, setBrandName] = useState<string>("");
  const [brandGuide, setBrandGuide] = useState<BrandAssets | null>(null);
  const [template, setTemplate] = useState<string>("instagram-reel");
  const [story, setStory] = useState<GeneratedStory | null>(null);
  const [videoScript, setVideoScript] = useState<VideoScript | null>(null);
  const [generatedImages, setGeneratedImages] = useState<{
    [key: string]: string;
  }>({});
  const [userPurpose, setUserPurpose] = useState<string>(""); // ADDED
  const [mainCharacters, setMainCharacters] = useState<CharacterDescription[]>([]);
const [characterSceneMap, setCharacterSceneMap] = useState<{[key: string]: number[]}>({});
const [generatedCharacterImages, setGeneratedCharacterImages] = useState<{[key: string]: {[sceneIndex: number]: string}}>({});

  console.log(story);

  // UI State
  const [ccnInterpretation, setCcnInterpretation] =
    useState<CCNInterpretationRevised | null>(null);
  const [confirmedCCNData, setConfirmedCCNData] = useState<CCNData | null>(
    null
  );
  const [ccnUnderstandingMessageId, setCcnUnderstandingMessageId] = useState<
    number | null
  >(null);
  const [clarificationQuestion, setClarificationQuestion] = useState<{
    question: string;
    field: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("entry");
  const [userMode, setUserMode] = useState<UserMode>("creator");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "system",
      content: "Hi! I'm Narratives.XO. Let's create an amazing story together.",
      timestamp: new Date(),
      type: "question",
    },
    {
      id: 2,
      sender: "system",
      content: (
        <div className="space-y-4">
          <p className="font-medium">What moment are you trying to express?</p>
          <p className="text-sm text-gray-500">
            Describe your moment in your own words...
          </p>
        </div>
      ),
      timestamp: new Date(),
      type: "question"
    }
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
  ): number => {
    const newMessage: Message = {
      id: messages.length + 1,
      sender,
      content,
      timestamp: new Date(),
      type,
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage.id;
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

  // Auto-detect market from text
  const autoDetectMarket = (text: string): Market => {
    const lowerText = text.toLowerCase();
    
    // Nigeria/NG detection
    const ngKeywords = [
      'nigeria', 'nigerian', 'naija', 'lagos', 'abuja', 'wetin', 'abi',
      'chai', 'wahala', 'oga', 'una', 'sabi', 'japa', 'gbese',
      'nairaland', 'asoebi', 'bukateria', 'mama put', 'danfo',
      'okada', 'area boy', 'shakara', 'jollof', 'suya', 'port harcourt',
      'ibadan', 'enugu', 'kano', 'calabar', 'lekki', 'ajegunle',
      'oyinbo', 'naija', 'asap', 'sharp', 'k-leg', 'ankara'
    ];
    
    // UK detection
    const ukKeywords = [
      'uk', 'united kingdom', 'britain', 'british', 'london', 'manchester',
      'birmingham', 'scotland', 'wales', 'england', 'mate', 'bloody',
      'blimey', 'cheers', 'brilliant', 'gutted', 'chuffed', 'cuppa',
      'pub', 'queen', 'king', 'football', 'premier league', 'man u',
      'chelsea', 'arsenal', 'tube', 'underground', 'pound', 'tea',
      'biscuit', 'chippy', 'fish and chips', 'queue'
    ];
    
    // France detection
    const frKeywords = [
      'france', 'french', 'paris', 'bonjour', 'merci', 'au revoir',
      'baguette', 'croissant', 'fromage', 'vin', 'boulangerie',
      'café', 'merde', 'putain', 'salut', 'bien', 'très',
      'eiffel', 'champs-élysées', 'provence', 'bordeaux', 'lyon',
      'marseille', 'bonsoir', 'oui', 'non', 's\'il vous plaît',
      'voilà', 'd\'accord', 'château', 'macaron'
    ];
    
    // Count matches
    let ngCount = 0;
    let ukCount = 0;
    let frCount = 0;
    
    ngKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) ngCount++;
    });
    
    ukKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) ukCount++;
    });
    
    frKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) frCount++;
    });
    
    // Determine market based on highest count
    if (ngCount > ukCount && ngCount > frCount) return 'ng';
    if (ukCount > ngCount && ukCount > frCount) return 'uk';
    if (frCount > ngCount && frCount > ukCount) return 'fr';
    
    // Default to 'ng' if no clear market detected
    return 'ng';
  };

  // Step 1: Natural Story Start
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


    // Show user message with detected market info if any
    const messageContent = !clarificationAnswer ? (
      <div className="border rounded-lg p-3 bg-gradient-to-r from-blue-700 to-purple-800">
        <p className="text-sm">{inputToSend}</p>
      </div>
    ) : (
      <div className="border rounded-lg p-3 bg-gradient-to-r from-green-700 to-emerald-800">
        <p className="text-sm">{inputToSend}</p>
      </div>
    );

    addMessage("user", messageContent, "selection");

    if (!clarificationAnswer) {
      setOriginalUserInput(inputToSend);
      setUserInput("");
    } else {
      setUserInput("");
    }

    setIsGenerating(true);

    // Step 2: CCN Analysis
    try {
      const res = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput: inputToSend,
          isClarificationResponse: !!clarificationAnswer,
          previousClarification: clarificationQuestion?.field,
          previousAnswer: clarificationAnswer,
        }),
      });

      const data = await res.json();

      if (data.success) {
              const detectedMarket = data.interpretation.market || 'ng';
      setMarket(detectedMarket as Market);

        setCcnInterpretation(data.interpretation);

        // Store the CCN data
        const ccnData: CCNData = {
          emotion: data.interpretation.emotion,
          scene: data.interpretation.scene,
          seedMoment: data.interpretation.seedMoment,
          audience: data.interpretation.audience,
          intentSummary: data.interpretation.intentSummary,
          pathway: data.interpretation.pathway,
          rawAnalysis: data.interpretation.rawAnalysis,
          market: data.interpretation.market,
        };
        setConfirmedCCNData(ccnData);

        // If this is the first time AND we need clarification AND we haven't asked yet
        if (
          !clarificationAnswer &&
          data.requiresClarification &&
          !clarificationQuestion
        ) {
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
                <p className="font-medium">
                  {data.clarificationQuestion.question}
                </p>
              </div>
              <p className="text-sm text-gray-500">
                Type your answer below to help me understand your intention.
              </p>
            </div>,
            "response"
          );

          setCurrentStep("clarification");
        } else {
          // Store confirmed CCN data
          const ccnDataForConfirmation: CCNData = {
            emotion: data.interpretation.emotion,
            scene: data.interpretation.scene,
            seedMoment: data.interpretation.seedMoment,
            audience: data.interpretation.audience,
            intentSummary: data.interpretation.intentSummary,
            pathway: data.interpretation.pathway,
            rawAnalysis: data.interpretation.rawAnalysis,
            market: data.interpretation.market,
          };
          // Store confirmed CCN data
          setConfirmedCCNData(ccnData);

          // Always show understanding preview after user's response
          const understanding =
            data.understandingPreview ||
            data.interpretation.understandingPreview;
          setSystemUnderstanding(understanding);

          await simulateTyping(1200);

          // Create CCN understanding message and store its ID
          const ccnMessageContent = (
            <div className="space-y-4">
           
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500">
                <p className="font-medium">{understanding}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    handleUnderstandingConfirm(ccnDataForConfirmation)
                  }
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
            </div>
          );

          const messageId = addMessage("system", ccnMessageContent, "response");

          setCcnUnderstandingMessageId(messageId);

          // Reset clarification question since we've shown understanding
          setClarificationQuestion(null);
          setCurrentStep("understanding");
        }
      }
    } catch (error) {
      console.error("CCN analysis error:", error);

      await simulateTyping(800);

      // Create a fallback CCN data object for error case
      const fallbackCCNData: CCNData = {
        emotion: "meaningful",
        scene: "a moment",
        seedMoment: inputToSend,
        audience: "those who need to hear it",
        intentSummary: "A personal moment to share",
        pathway: "emotion-first",
        rawAnalysis: `I feel this is about: "${inputToSend}". It seems like a meaningful moment worth exploring.`,
        market: "ng",
      };

      // Even on error, show a fallback understanding preview with data attached
      addMessage(
        "system",
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-l-4 border-amber-500">
            <p className="font-medium">
              I feel you're describing something meaningful from your
              experience.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleUnderstandingConfirm(fallbackCCNData)}
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
  console.log(ccnInterpretation);

  // NEW FUNCTION: Handle story purpose input
  const handleStoryPurpose = async (purpose: string) => {
    if (!purpose.trim() || !story) return;

    setUserPurpose(purpose);
    
    addMessage(
      "user",
      <div className="border rounded-lg p-3 bg-gradient-to-r from-blue-700 to-purple-800">
        <p className="text-sm">{purpose}</p>
      </div>,
      "selection"
    );

    setIsGenerating(true);

    // Add thinking message
    const thinkingId = addMessage(
      "system",
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
        <span>Adapting story for your purpose...</span>
      </div>,
      "response"
    );

    try {
      // Get the latest CCN data
      const ccnData = confirmedCCNData || {
        emotion: story.metadata?.tone?.toLowerCase() || "meaningful",
        scene: "a moment",
        seedMoment: originalUserInput || "personal experience",
        audience: "those who need to hear it",
        intentSummary: story.metadata?.title || "A meaningful moment to share",
        pathway: "emotion-first",
        rawAnalysis: story.story,
        market: story.metadata.market,
      };

      const res = await fetch("/api/generateStory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          market: ccnData.market,
          semanticExtraction: {
            emotion: ccnData.emotion,
            scene: ccnData.scene,
            seedMoment: ccnData.seedMoment,
            audience: ccnData.audience,
            intentSummary: ccnData.intentSummary,
            pathway: ccnData.pathway,
            rawAnalysis: ccnData.rawAnalysis || story.story,
          },
          brand: brandGuide ? { name: brandName, ...brandGuide } : undefined,
          requestType: "purpose-adaptation",
          purpose: purpose,
          currentStory: story.story,
          originalContext: originalUserInput,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Unknown error");
      }

      const adaptedStory: GeneratedStory = {
        story: data.adaptedStory || data.story || story.story,
        beatSheet: data.beatSheet || story.beatSheet || [],
        metadata: data.metadata || {
          ...story.metadata,
          title: `${story.metadata.title} (${purpose.substring(0, 20)}...)`,
          purpose: purpose,
        },
      };

      // Update the story with adapted version
      setStory(adaptedStory);

      // Remove thinking message
      setMessages((prev) => 
        prev.filter((msg) => msg.id !== thinkingId)
      );

      // Show adapted story
      addMessage(
        "system",
        <div className="space-y-6">
          {/* Adapted Story Display */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-r-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg text-green-800">
                  {adaptedStory.metadata.title}
                </h3>
                <div className="text-sm text-green-600 mt-1">
                  Adapted for: <span className="font-medium">{purpose}</span>
                </div>
              </div>
              <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Adapted
              </div>
            </div>
            <div className="text-gray-800 whitespace-pre-line leading-relaxed text-base">
              {adaptedStory.story}
            </div>
          </div>

          {/* Story Shaping Options */}
          <div className="space-y-4">
            <p className="font-medium text-gray-700">
              Want to shape this story further?
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() =>
                  handleStoryExpansionWithStory(
                    "expand",
                    adaptedStory,
                    ccnData
                  )
                }
                className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Maximize2 size={16} />
                Expand this
              </button>
              <button
                onClick={() =>
                  handleStoryExpansionWithStory(
                    "gentler",
                    adaptedStory,
                    ccnData
                  )
                }
                className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Zap size={16} />
                Make it gentler
              </button>
              <button
                onClick={() =>
                  handleStoryExpansionWithStory(
                    "harsher",
                    adaptedStory,
                    ccnData
                  )
                }
                className="px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Zap size={16} />
                Make it harsher
              </button>
              <button
                onClick={() =>
                  handleStoryExpansionWithStory(
                    "60-second",
                    adaptedStory,
                    ccnData
                  )
                }
                className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Film size={16} />
                60-second version
              </button>
            </div>

            {/* Continue with current story */}
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3">
                Continue with this adapted story:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setCurrentStep("images")}
                  className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <ImageIcon size={18} />
                  Generate Images
                </button>
                <button
                  onClick={() => handleVideoOption()}
                  className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <VideoIcon size={18} />
                  Generate Video Script
                </button>
              </div>

              <div className="mt-3">
                <button
                  onClick={() => {
                    const blob = new Blob([adaptedStory.story], {
                      type: "text/plain",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `adapted-story-${Date.now()}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);

                    addMessage(
                      "system",
                      <div className="text-green-600">
                        ✓ Adapted story exported as text file.
                      </div>,
                      "response"
                    );
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Export Adapted Story
                </button>
              </div>
            </div>
          </div>
        </div>,
        "generated"
      );

      setCurrentStep("story-generated");

    } catch (error) {
      console.error("Purpose adaptation error:", error);
      
      setMessages((prev) => 
        prev.filter((msg) => msg.id !== thinkingId)
      );
      
      addMessage(
        "system",
        <div className="space-y-6">
          <div className="text-amber-600 p-4 bg-amber-50 rounded-lg">
            <p>I'll continue with the original story, but you can still use it for your purpose.</p>
            <p className="text-sm mt-2">
              Error: {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>

          {/* Show original story with options */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setCurrentStep("images")}
                className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
              >
                <ImageIcon size={18} />
                Generate Images
              </button>
              <button
                onClick={() => handleVideoOption()}
                className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
              >
                <VideoIcon size={18} />
                Generate Video Script
              </button>
            </div>
          </div>
        </div>,
        "response"
      );
      
      setCurrentStep("story-generated");
    } finally {
      setIsGenerating(false);
      setUserPurpose("");
    }
  };

  // Trigger Story Generation - MODIFIED to ask for purpose
  const triggerStoryGeneration = async (ccnData: CCNData) => {
    setIsGenerating(true);


    // Log what we're actually receiving
    console.log("triggerStoryGeneration received ccnData:", ccnData);

    // Use the ccnData parameter directly - it should contain all the data
    if (!ccnData) {
      console.error("No CCN data provided to triggerStoryGeneration");
      return;
    }

    // Show loading message
    const loadingMessage: Message = {
      id: messages.length + 1,
      sender: "system",
      content: (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
          <span>Shaping your story based on your moment...</span>
        </div>
      ),
      timestamp: new Date(),
      type: "response",
    };

    // Add loading message to existing messages
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      // Get rawAnalysis from the provided ccnData
      const rawAnalysis =
        ccnData.rawAnalysis ||
        "I feel this is a meaningful moment worth exploring.";

      console.log("Using rawAnalysis:", rawAnalysis.substring(0, 100) + "...");

      // Send complete CCN data to story generation API INCLUDING rawAnalysis
      const storyRequestData = {
        market: ccnData.market,
        semanticExtraction: {
          emotion: ccnData.emotion,
          scene: ccnData.scene,
          seedMoment: ccnData.seedMoment,
          audience: ccnData.audience,
          intentSummary: ccnData.intentSummary,
          pathway: ccnData.pathway,
          rawAnalysis: rawAnalysis,
        },
        brand: brandGuide ? { name: brandName, ...brandGuide } : undefined,
        requestType: "micro-story",
        originalContext: originalUserInput,
      };

      console.log("Sending to /api/generateStory:", {
        market,
        emotion: ccnData.emotion,
        seedMoment: ccnData.seedMoment,
        rawAnalysis: rawAnalysis.substring(0, 150) + "...",
      });

      const res = await fetch("/api/generateStory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storyRequestData),
      });

      const data = await res.json();
      console.log("Story generation response:", data);

      if (!data.success) {
        throw new Error(data.error || "Unknown error");
      }

      const generatedStory: GeneratedStory = {
        story: data.microStory || data.story,
        beatSheet: data.beatSheet || [],
        metadata: data.metadata,
      };

      setStory(generatedStory);
      await detectCharacters(generatedStory);

      // Remove the loading message and ask for purpose
      setMessages((prev) => {
        // Filter out loading message
        const filtered = prev.filter((msg) => {
          if (typeof msg.content === "string") {
            return !msg.content.includes("Shaping your story");
          }

          try {
            const contentStr = JSON.stringify(msg.content);
            return !contentStr.includes("Shaping your story");
          } catch {
            return true;
          }
        });

        // Ask for purpose instead of showing story immediately
        return [
          ...filtered,
          {
            id: filtered.length + 1,
            sender: "system",
            content: (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-lg text-purple-800 mb-2">
                    ✨ Story Generated!
                  </h3>
                  <div className="text-gray-700 whitespace-pre-line text-sm">
                    {generatedStory.story}...
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="font-medium text-gray-700">
                    How do you want to use this story?
                  </p>
                  <p className="text-sm text-gray-600">
                    Tell me what this is for (e.g., "Turn this into a brand post", 
                    "This is for Instagram", "Make it more formal for LinkedIn", etc.)
                  </p>
                  <p className="text-xs text-gray-500">
                    I'll adapt the same story based on your specific use case.
                  </p>
                </div>
              </div>
            ),
            timestamp: new Date(),
            type: "question",
          },
        ];
      });

      // Update current step to purpose input
      setCurrentStep("story-purpose");
    } catch (error) {
      console.error("❌ Story generation error:", error);

      // Remove loading message and show error
      setMessages((prev) => {
        const filtered = prev.filter((msg) => {
          if (typeof msg.content === "string") {
            return !msg.content.includes("Shaping your story");
          }

          try {
            const contentStr = JSON.stringify(msg.content);
            return !contentStr.includes("Shaping your story");
          } catch {
            return true;
          }
        });

        // Add error message
        return [
          ...filtered,
          {
            id: filtered.length + 1,
            sender: "system",
            content: (
              <div className="space-y-6">
                <div className="text-amber-600 p-4 bg-amber-50 rounded-lg">
                  <p>
                    I had trouble shaping your story, but you can still
                    continue:
                  </p>
                  <p className="text-sm mt-2">
                    Error details:{" "}
                    {error instanceof Error ? error.message : "Unknown error"}
                  </p>
                </div>

                {/* Fallback options */}
                <div className="space-y-4">
                  <p className="font-medium text-gray-700">
                    What would you like to do next?
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => setCurrentStep("images")}
                      className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <ImageIcon size={18} />
                      Generate Images
                    </button>
                    <button
                      onClick={() => handleVideoOption()}
                      className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <VideoIcon size={18} />
                      Generate Video Script
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      // Retry story generation
                      triggerStoryGeneration(ccnData);
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Sparkles size={18} />
                    Try Story Generation Again
                  </button>
                </div>
              </div>
            ),
            timestamp: new Date(),
            type: "response",
          },
        ];
      });
    } finally {
      setIsGenerating(false);
    }
  };
// Character detection function
const detectCharacters = async (storyData: GeneratedStory) => {
  try {
    const res = await fetch("/api/detectCharacters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        story: storyData.story,
        beatSheet: storyData.beatSheet
      }),
    });

    const data = await res.json();
    
    if (data.success) {
      setMainCharacters(data.characters || []);
      setCharacterSceneMap(data.characterSceneMap || {});
      
      // Update story with character-enriched beatSheet
      const updatedStory = {
        ...storyData,
        beatSheet: data.updatedBeatSheet || storyData.beatSheet,
        metadata: {
          ...storyData.metadata,
          mainCharacters: data.characters || []
        }
      };
      
      setStory(updatedStory);
    }
  } catch (error) {
    console.error("Character detection error:", error);
  }
};
  // Step 2: Understanding Confirmation (triggers story)
  const handleUnderstandingConfirm = async (ccnData?: CCNData) => {
    console.log("handleUnderstandingConfirm called with:", ccnData);

    // Use the passed ccnData parameter first, then fall back to state
    const dataToUse = ccnData || confirmedCCNData;

    if (!dataToUse) {
      console.error("No CCN data available for story generation");
      console.log("confirmedCCNData state:", confirmedCCNData);
      console.log("ccnInterpretation state:", ccnInterpretation);

      addMessage(
        "system",
        <div className="text-red-600">
          Sorry, I lost track of your story details. Please try again.
        </div>,
        "response"
      );

      // Go back to entry
      setCurrentStep("entry");
      addMessage(
        "system",
        <div>
          <p>Please describe your moment again:</p>
        </div>,
        "question"
      );
      return;
    }

    console.log("Using CCN data for story generation:", dataToUse);

    // Add confirmation message
    const confirmationMessage: Message = {
      id: messages.length + 1,
      sender: "user",
      content: (
        <div className="flex items-center gap-2">
          <Check size={16} className="text-green-600" />
          <span className="font-medium">Yes, that's right</span>
        </div>
      ),
      timestamp: new Date(),
      type: "selection",
    };

    setMessages((prev) => [...prev, confirmationMessage]);

    await simulateTyping(800);

    // Trigger story generation with the CCN data
    triggerStoryGeneration(dataToUse);
  };

  // Story Expansion with direct story parameter
  const handleStoryExpansionWithStory = async (
    expansionType: "expand" | "gentler" | "harsher" | "60-second",
    storyToExpand: GeneratedStory,
    ccnData?: CCNData
  ) => {
    console.log("handleStoryExpansionWithStory called:", {
      expansionType,
      storyToExpand,
      storyTitle: storyToExpand.metadata?.title,
      ccnData,
    });

    if (!storyToExpand || !storyToExpand.story) {
      console.error("No valid story provided for expansion");
      addMessage(
        "system",
        <div className="text-red-600">
          Error: Invalid story provided for expansion.
        </div>,
        "response"
      );
      return;
    }

    // Use provided ccnData, or fall back to available CCN data
    const expansionCCNData = ccnData || confirmedCCNData || ccnInterpretation || {
      emotion: storyToExpand.metadata?.tone?.toLowerCase() || "meaningful",
      scene: "a moment",
      seedMoment: originalUserInput || "personal experience",
      audience: "those who need to hear it",
      intentSummary: storyToExpand.metadata?.title || "A meaningful moment to share",
      pathway: "emotion-first",
      rawAnalysis: storyToExpand.story,
    };

    setIsGenerating(true);

    // Add user selection message
    addMessage(
      "user",
      <div className="flex items-center gap-2">
        <Type size={16} />
        <span className="font-medium">
          {expansionType === "expand" && "Expand this"}
          {expansionType === "gentler" && "Make it gentler"}
          {expansionType === "harsher" && "Make it harsher"}
          {expansionType === "60-second" && "Create 60-second version"}
        </span>
      </div>,
      "selection"
    );

    const loadingId = addMessage(
      "system",
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
        <span>Shaping your story...</span>
      </div>,
      "response"
    );

    try {
      console.log("Sending expansion request for story:", storyToExpand.metadata?.title);

      const res = await fetch("/api/generateStory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          market,
          semanticExtraction: {
            emotion: expansionCCNData.emotion,
            scene: expansionCCNData.scene,
            seedMoment: expansionCCNData.seedMoment,
            audience: expansionCCNData.audience,
            intentSummary: expansionCCNData.intentSummary,
            pathway: expansionCCNData.pathway,
            rawAnalysis: expansionCCNData.rawAnalysis || storyToExpand.story,
          },
          brand: brandGuide ? { name: brandName, ...brandGuide } : undefined,
          requestType: "expansion",
          expansionType: expansionType,
          currentStory: storyToExpand.story,
          originalContext: originalUserInput
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Unknown error");
      }

      const expandedStory: GeneratedStory = {
        story: data.expandedStory || data.story || data.microStory || storyToExpand.story,
        beatSheet: data.beatSheet || storyToExpand.beatSheet || [],
        metadata: data.metadata || {
          title: `${storyToExpand.metadata?.title || "Story"} - ${expansionType}`,
          market,
          archetype: storyToExpand.metadata?.archetype || "Unknown",
          tone: storyToExpand.metadata?.tone || "Cinematic",
          totalBeats: data.beatSheet?.length || 0,
          estimatedDuration: expansionType === "60-second" ? "60s" : "30s",
        },
      };

      // Update the main story state with the expanded version
      setStory(expandedStory);

      // Remove loading message
      setMessages((prev) => 
        prev.filter((msg) => msg.id !== loadingId)
      );

      // Show expanded story
      addMessage(
        "system",
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-blue-800">
                {expandedStory.metadata.title}
              </h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {expansionType === "60-second" ? "60s version" : 
                 expansionType === "expand" ? "Expanded" : 
                 expansionType === "gentler" ? "Gentler" : 
                 "Harsher"}
              </span>
            </div>
            <div className="text-gray-800 whitespace-pre-line leading-relaxed">
              {expandedStory.story}
            </div>
          </div>

          {/* Ask for purpose after expansion */}
          <div className="space-y-3">
            <p className="font-medium text-gray-700">
              How do you want to use this expanded story?
            </p>
            <p className="text-sm text-gray-600">
              Tell me what this is for (e.g., "brand post", "Instagram", "LinkedIn", etc.)
            </p>
          </div>
        </div>,
        "generated"
      );

      // Set current step to purpose for the expanded story
      setCurrentStep("story-purpose");

    } catch (error) {
      console.error("Expansion error:", error);
      
      setMessages((prev) => 
        prev.filter((msg) => msg.id !== loadingId)
      );
      
      addMessage(
        "system",
        <div className="text-red-600 p-4 bg-red-50 rounded-lg">
          <p>Failed to expand story. Please try again.</p>
          <p className="text-sm mt-1">
            Error: {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>,
        "response"
      );
      
      // If expansion fails, still ask for purpose with original story
      setCurrentStep("story-purpose");
    } finally {
      setIsGenerating(false);
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

    // Get the latest CCN data from state
    const ccnData = confirmedCCNData;
    if (ccnData) {
      triggerStoryGeneration(ccnData);
    } else {
      // If no CCN data, go back to entry
      setCurrentStep("entry");
      addMessage(
        "system",
        <div>
          <p>Please describe your moment again:</p>
        </div>,
        "question"
      );
    }
  };

  // Step 3: Brand Check (not used in current flow)
  const handleBrandCheck = async (withBrand: boolean) => {
    addMessage(
      "user",
      <div className="flex items-center gap-2">
        <Palette
          size={16}
          className={withBrand ? "text-purple-600" : "text-gray-600"}
        />
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
            ⚠️ Disclaimer: Your selected brand may not be displayed accurately
            due to copyright considerations.
          </p>
        </div>,
        "question"
      );
      setCurrentStep("brand-upload");
    } else {
      // Get the latest CCN data
      const ccnData = confirmedCCNData;
      if (ccnData) {
        triggerStoryGeneration(ccnData);
      } else {
        // If no CCN data, ask user to confirm understanding again
        setCurrentStep("entry");
        addMessage(
          "system",
          <div>
            <p>Please describe your moment again:</p>
          </div>,
          "question"
        );
      }
    }
  };

  // Step 6a: Video Option
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

  // Step: Generate Images
 const handleGenerateImages = async () => {
  if (!story) return;

  setIsGenerating(true);

  // Add user message
  addMessage(
    "user",
    <div className="flex items-center gap-2">
      <ImageIcon size={16} />
      <span className="font-medium">
        Generate Images {mainCharacters.length > 0 ? "with Character Consistency" : ""}
      </span>
    </div>,
    "selection"
  );

  // Show character analysis first if we haven't done it yet
  if (mainCharacters.length === 0 && story) {
    const analysisId = addMessage(
      "system",
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
        <span>Analyzing characters for consistency...</span>
      </div>,
      "response"
    );

    try {
      // Detect characters in the story
      const charRes = await fetch("/api/detectCharacters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story: story.story,
          beatSheet: story.beatSheet,
          market
        }),
      });

      const charData = await charRes.json();
      
      if (charData.success) {
        setMainCharacters(charData.characters || []);
        setCharacterSceneMap(charData.characterSceneMap || {});
        
        // Update story with character-enriched beatSheet
        const updatedStory: GeneratedStory = {
          ...story,
          beatSheet: charData.updatedBeatSheet || story.beatSheet,
          metadata: {
            ...story.metadata,
            mainCharacters: charData.characters || []
          }
        };
        
        setStory(updatedStory);
        
        // Remove analysis message
        setMessages(prev => prev.filter(msg => msg.id !== analysisId));
        
        // Show character summary
        addMessage(
          "system",
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <Check size={20} />
              <span className="font-medium">
                Character Analysis Complete
              </span>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <h4 className="font-semibold text-blue-800 mb-2">📝 Character Details</h4>
              <div className="space-y-3">
                {charData.characters?.map((char: CharacterDescription, idx: number) => (
                  <div key={char.id} className="text-sm">
                    <div className="font-medium text-gray-800">
                      {idx + 1}. {char.name || `Character ${idx + 1}`}
                    </div>
                    <div className="text-gray-600 ml-4">
                      <div>• Age: {char.age || 'Not specified'}</div>
                      <div>• Features: {char.appearance?.hair || 'Various'}</div>
                      <div>• Appears in: {charData.characterSceneMap?.[char.id]?.length || 0} scenes</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          "response"
        );
      } else {
        // Remove analysis message on error
        setMessages(prev => prev.filter(msg => msg.id !== analysisId));
        addMessage(
          "system",
          <div className="text-amber-600">
            Proceeding without character analysis. Images will be generated normally.
          </div>,
          "response"
        );
      }
    } catch (error) {
      console.error("Character analysis error:", error);
      setMessages(prev => prev.filter(msg => msg.id !== analysisId));
      addMessage(
        "system",
        <div className="text-amber-600">
          Character analysis failed. Generating images normally...
        </div>,
        "response"
      );
    }
  }

  // Now start image generation
  const loadingId = addMessage(
    "system",
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
        <span className="font-medium">Creating consistent visuals for all scenes...</span>
      </div>
      <div className="text-sm text-gray-500">
        {mainCharacters.length > 0 
          ? `Maintaining ${mainCharacters.length} character${mainCharacters.length > 1 ? 's' : ''} across ${story.beatSheet.length} scenes`
          : `Generating ${story.beatSheet.length} scenes`
        }
      </div>
    </div>,
    "response"
  );

  try {
    const imagePromises = story.beatSheet.map(async (scene, index) => {
      // Find character for this scene
      const characterId = scene.characterId;
      const character = mainCharacters.find(c => c.id === characterId);
      
      // Check if we have previous image of this character
      let previousImageUrl: string | undefined;
      if (characterId && generatedCharacterImages[characterId]) {
        const previousScenes = Object.keys(generatedCharacterImages[characterId])
          .map(Number)
          .filter(sceneIdx => sceneIdx < index)
          .sort((a, b) => b - a); // Get most recent
        
        if (previousScenes.length > 0) {
          previousImageUrl = generatedCharacterImages[characterId][previousScenes[0]];
          console.log(`Using previous image for ${characterId} in scene ${index}`);
        }
      }

      // Build request with character data if available
      const requestData: any = {
        sceneDescription: scene.description,
        visualCues: scene.visualCues,
        tone: story.metadata.tone,
        market,
        brandSafe: true,
        brandPalette: brandGuide?.palette || [],
        template,
        beatIndex: index,
        beat: scene.beat,
        characterEmotion: scene.characterEmotion,
        characterAction: scene.characterAction,
        shotType: scene.shotType
      };

      // Add character data if we have it
      if (character) {
        requestData.characterDescription = character;
        requestData.previousCharacterImage = previousImageUrl;
        requestData.isSameCharacter = !!previousImageUrl;
      }

      console.log(`Generating image ${index + 1}/${story.beatSheet.length}`, {
        beat: scene.beat,
        characterId,
        hasPreviousImage: !!previousImageUrl
      });

      const response = await fetch("/api/generateImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Track character images for consistency in future scenes
      if (result.success && characterId) {
        setGeneratedCharacterImages(prev => ({
          ...prev,
          [characterId]: {
            ...(prev[characterId] || {}),
            [index]: result.imageUrl
          }
        }));
      }
      
      return { 
        index, 
        result,
        characterId,
        scene
      };
    });

    const results = await Promise.all(imagePromises);
    const imageMap: { [key: string]: string } = {};
    const failedScenes: number[] = [];
    
    results.forEach(({ index, result, characterId, scene }) => {
      if (result.success) {
        imageMap[index] = result.imageUrl;
      } else {
        failedScenes.push(index);
        console.error(`Failed to generate image for scene ${index}:`, scene.beat);
      }
    });

    setGeneratedImages(imageMap);

    // Remove loading message
    setMessages(prev => prev.filter(msg => msg.id !== loadingId));

    // Calculate success rate
    const successCount = Object.keys(imageMap).length;
    const totalCount = story.beatSheet.length;
    const successRate = Math.round((successCount / totalCount) * 100);

    // Build success message
    addMessage(
      "system",
      <div className="space-y-6">
        <div className={`flex items-center gap-2 ${successRate === 100 ? 'text-green-600' : 'text-amber-600'}`}>
          {successRate === 100 ? <Check size={20} /> : <HelpCircle size={20} />}
          <span className="font-medium">
            Generated {successCount} of {totalCount} images ({successRate}%)
          </span>
        </div>

        {mainCharacters.length > 0 && successCount > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-blue-600" />
                <span className="font-semibold text-blue-800">Character Consistency Applied</span>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {mainCharacters.length} character{mainCharacters.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-sm text-gray-700 space-y-2">
              <p>✓ Facial features maintained across scenes</p>
              <p>✓ Cultural authenticity for {market.toUpperCase()} market</p>
              <p>✓ Consistent lighting and style throughout</p>
            </div>
          </div>
        )}

        {/* Show failed scenes if any */}
        {failedScenes.length > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
            <div className="flex items-center gap-2 text-amber-700 mb-2">
              <X size={16} />
              <span className="font-medium">Some images failed to generate:</span>
            </div>
            <div className="text-sm text-amber-600">
              <ul className="list-disc pl-5 space-y-1">
                {failedScenes.map(sceneIndex => (
                  <li key={sceneIndex}>
                    Scene {sceneIndex + 1}: {story.beatSheet[sceneIndex].beat}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Image Gallery Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-800">Generated Scenes</h4>
            <span className="text-sm text-gray-500">
              Click any image to enlarge
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {story.beatSheet.map(
              (scene, index) =>
                imageMap[index] && (
                  <div
                    key={index}
                    className="space-y-3 p-4 bg-white rounded-xl border hover:border-purple-300 transition-colors cursor-pointer group"
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
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            {scene.characterId && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {scene.characterId.replace('_', ' ')}
                              </span>
                            )}
                            {scene.characterEmotion && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                {scene.characterEmotion}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openImageModal(index);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="View full size"
                      >
                        <Maximize2 size={16} className="text-gray-500" />
                      </button>
                    </div>

                    <div className="relative group">
                      <img
                        src={imageMap[index]}
                        alt={`Scene ${index + 1}: ${scene.beat}`}
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 group-hover:border-purple-300 transition-colors"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/F3F4F6/9CA3AF?text=Image+Failed+to+Load';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-white text-sm bg-black/60 px-3 py-2 rounded-full flex items-center gap-2">
                          <Maximize2 size={14} />
                          Click to enlarge • Scene {index + 1}
                        </div>
                      </div>
                    </div>

                    {/* Scene Info */}
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {scene.description}
                      </p>
                      
                      {scene.visualCues.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {scene.visualCues.slice(0, 3).map((cue, i) => (
                            <span
                              key={i}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                            >
                              {cue}
                            </span>
                          ))}
                          {scene.visualCues.length > 3 && (
                            <span className="text-xs text-gray-400 px-1">
                              +{scene.visualCues.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
            )}
          </div>

          {/* Show message if no images were generated */}
          {successCount === 0 && (
            <div className="text-center py-8">
              <ImageIcon size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600">No images were generated successfully.</p>
              <p className="text-sm text-gray-500 mt-1">
                Please check your API configuration and try again.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {successCount > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => openImageModal(0)}
                className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Maximize2 size={16} />
                View Full Gallery
              </button>
              <button
                onClick={() => setCurrentStep("video-option")}
                className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
              >
                <VideoIcon size={16} />
                Create Video Script
              </button>
              <button
                onClick={() => setCurrentStep("export")}
                className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Export Package
              </button>
            </div>

            {/* Retry failed scenes */}
            {failedScenes.length > 0 && (
              <button
                onClick={async () => {
                  // Retry only failed scenes
                  const retryPromises = failedScenes.map(async (index) => {
                    const scene = story.beatSheet[index];
                    const characterId = scene.characterId;
                    const character = mainCharacters.find(c => c.id === characterId);
                    
                    const response = await fetch("/api/generateImage", {
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
                        characterDescription: character,
                        characterEmotion: scene.characterEmotion,
                        characterAction: scene.characterAction
                      }),
                    });
                    
                    const result = await response.json();
                    return { index, result, characterId };
                  });

                  addMessage(
                    "system",
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
                      <span>Retrying {failedScenes.length} failed scenes...</span>
                    </div>,
                    "response"
                  );

                  const retryResults = await Promise.all(retryPromises);
                  
                  retryResults.forEach(({ index, result, characterId }) => {
                    if (result.success) {
                      setGeneratedImages(prev => ({ ...prev, [index]: result.imageUrl }));
                      if (characterId) {
                        setGeneratedCharacterImages(prev => ({
                          ...prev,
                          [characterId]: {
                            ...(prev[characterId] || {}),
                            [index]: result.imageUrl
                          }
                        }));
                      }
                    }
                  });
                }}
                className="w-full px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50"
              >
                Retry Failed Scenes ({failedScenes.length})
              </button>
            )}
          </div>
        )}
      </div>,
      "generated"
    );

    setCurrentStep("images-complete");
  } catch (error) {
    console.error("Image generation failed:", error);
    
    // Remove loading message
    setMessages(prev => prev.filter(msg => msg.id !== loadingId));
    
    // Show error message
    addMessage(
      "system",
      <div className="space-y-4">
        <div className="text-red-600 p-4 bg-red-50 rounded-lg">
          <p className="font-medium">Failed to generate images</p>
          <p className="text-sm mt-1">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleGenerateImages}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg"
          >
            Try Again
          </button>
          <button
            onClick={() => setCurrentStep("story-generated")}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back to Story
          </button>
        </div>
      </div>,
      "response"
    );
  } finally {
    setIsGenerating(false);
  }
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

    const loadingId = addMessage(
      "system",
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
        <span>Creating video script...</span>
      </div>,
      "response"
    );

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

      const ccnData = ccnInterpretation ||
        confirmedCCNData || {
          emotion: "meaningful",
          scene: "a moment",
          seedMoment: originalUserInput || "personal experience",
          audience: "those who need to hear it",
          intentSummary: "A meaningful moment to share",
          pathway: "emotion-first",
        };

      switch (format) {
        case "json":
          data = {
            version: "p2-revised-lite",
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
                emotion: ccnData.emotion,
                scene: ccnData.scene,
                seedMoment: ccnData.seedMoment,
                audience: ccnData.audience,
                intentSummary: ccnData.intentSummary,
                pathway: ccnData.pathway,
                confidence: ccnInterpretation?.confidence || 0.8,
              },
            },
          };
          filename = `narrative-${market}-${Date.now()}.json`;
          mimeType = "application/json";
          break;

        case "pdf":
          data = "PDF export would be generated here";
          filename = `story-${market}-${Date.now()}.pdf`;
          mimeType = "application/pdf";
          break;

        case "csv":
          const csvData = [
            ["Field", "Value"],
            ["Market", market],
            ["Title", story?.metadata.title || ""],
            ["Emotion", ccnData.emotion],
            ["Scene", ccnData.scene],
            ["Pathway", ccnData.pathway],
            ["Template", template],
            ["Generated Images", Object.keys(generatedImages).length],
            ["Created", new Date().toISOString()],
          ]
            .map((row) => row.join(","))
            .join("\n");
          data = csvData;
          filename = `story-data-${market}-${Date.now()}.csv`;
          mimeType = "text/csv";
          break;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: mimeType,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
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
              setOriginalUserInput("");
              setSystemUnderstanding("");
              setBrandName("");
              setBrandGuide(null);
              setStory(null);
              setVideoScript(null);
              setGeneratedImages({});
              setCcnInterpretation(null);
              setConfirmedCCNData(null);
              setCcnUnderstandingMessageId(null);
              setClarificationQuestion(null);
              setUserPurpose(""); // Reset purpose
              setCurrentStep("entry");
              setMessages([
                {
                  id: 1,
                  sender: "system",
                  content:
                    "Hi! I'm Narratives.XO. Let's create another amazing story.",
                  timestamp: new Date(),
                  type: "question",
                },
                {
                  id: 2,
                  sender: "system",
                  content: (
                    <div className="space-y-4">
                      <p className="font-medium">What moment are you trying to express?</p>
                      <p className="text-sm text-gray-500">
                        Describe your moment in your own words...
                      </p>
                    </div>
                  ),
                  timestamp: new Date(),
                  type: "question"
                }
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
        <div className="text-red-600">Failed to export. Please try again.</div>,
        "response"
      );
    }
  };

  const renderInputSection = () => {
    if (isGenerating) return null;

    switch (currentStep) {
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

      case "story-purpose":
        return (
          <div className="p-4 border-t bg-white">
            <div className="space-y-4">
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">
                  How do you want to use this story?
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    onClick={() => setUserPurpose("Turn this into a brand post")}
                    className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
                  >
                    Brand post
                  </button>
                  <button
                    onClick={() => setUserPurpose("This is for Instagram")}
                    className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
                  >
                    Instagram
                  </button>
                  <button
                    onClick={() => setUserPurpose("Make it more formal for LinkedIn")}
                    className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
                  >
                    LinkedIn
                  </button>
                  <button
                    onClick={() => setUserPurpose("For a video script")}
                    className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
                  >
                    Video script
                  </button>
                </div>
              </div>

              <textarea
                value={userPurpose}
                onChange={(e) => setUserPurpose(e.target.value)}
                placeholder="Describe your purpose... (e.g., 'Turn this into a brand post', 'This is for Instagram', 'Make it more formal for LinkedIn', etc.)"
                className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => handleStoryPurpose(userPurpose)}
                  disabled={!userPurpose.trim() || userPurpose.trim().length < 3}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles size={16} />
                  Adapt Story
                </button>
                <button
                  onClick={() => {
                    // Skip adaptation and go directly to story options
                    setCurrentStep("story-generated");
                    addMessage(
                      "system",
                      <div className="text-gray-600">
                        You can continue with the story as is.
                      </div>,
                      "response"
                    );
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Skip & Use As Is
                </button>
              </div>

              <p className="text-xs text-gray-500">
                I'll adapt the same story based on your specific use case.
              </p>
            </div>
          </div>
        );

      case "story-generated":
        return (
          <div className="p-4 border-t bg-white">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Your story is ready! What would you like to do next?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setCurrentStep("images")}
                  className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <ImageIcon size={18} />
                  Generate Images
                </button>
                <button
                  onClick={() => handleVideoOption()}
                  className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <VideoIcon size={18} />
                  Generate Video Script
                </button>
              </div>
              <button
                onClick={() => {
                  const blob = new Blob([story?.story || ""], {
                    type: "text/plain",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `story-${Date.now()}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);

                  addMessage(
                    "system",
                    <div className="text-green-600">
                      ✓ Story exported as text file.
                    </div>,
                    "response"
                  );
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Export Story as Text
              </button>
            </div>
          </div>
        );

      case "images":
        return (
          <div className="p-4 border-t bg-white">
            <div className="space-y-4">
              {currentStep === "images" && (
                <>
                  <p className="text-sm text-gray-600">
                    Choose output format for images:
                  </p>
                  <TemplateSelector
                    value={template}
                    onChange={(selectedTemplate) =>
                      setTemplate(selectedTemplate)
                    }
                  />
                </>
              )}
              <button
                onClick={handleGenerateImages}
                disabled={isGenerating}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-3 text-lg font-medium"
              >
                <ImageIcon size={24} />
                {isGenerating ? "Generating..." : "Generate All Images"}
              </button>
              <p className="text-sm text-gray-500 text-center">
                Creates visuals for all {story?.beatSheet.length || "story"}{" "}
                scenes
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