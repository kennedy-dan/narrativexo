import { useState, useRef, useEffect } from "react";
import BrandGuideUpload from "@/components/BrandGuideUpload";
import ProtectedPage from "@/components/ProtectedPage";
import {
  GeneratedStory,
  VideoScript,
  BrandAssets,
  UserMode,
  CharacterDescription,
  XOInterpretation,
  MeaningContract,
} from "@/types";
import {
  Sparkles,
  Image as ImageIcon,
  Video as VideoIcon,
  Download,
  Copy,
  Bot,
  User as UserIcon,
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
  UserRound,
  Palette,
  Film,
  Send,
  Globe,
  FileText,
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
  | "clarification"
  | "story-generated"
  | "story-purpose"
  | "brand-details"
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
                  const link = document.createElement('a');
                  link.href = currentImage.url;
                  link.download = `scene-${currentIndex + 1}-${currentImage.title
                    .toLowerCase()
                    .replace(/\s+/g, "-")}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
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
  const [userInput, setUserInput] = useState("");
  const [originalUserInput, setOriginalUserInput] = useState("");
  const [brandName, setBrandName] = useState<string>("");
  const [brandGuide, setBrandGuide] = useState<BrandAssets | null>(null);
  const [clarification, setClarification] = useState<{
    hypothesis: string;
    correctionInvitation: string;
    unclearElement: string;
  } | null>(null);
  const [story, setStory] = useState<GeneratedStory | null>(null);
  const [isRewriteMode, setIsRewriteMode] = useState(false);
  const [videoScript, setVideoScript] = useState<VideoScript | null>(null);
  const [generatedImages, setGeneratedImages] = useState<{
    [key: string]: string;
  }>({});
  const [userPurpose, setUserPurpose] = useState<string>("");
  const [mainCharacters, setMainCharacters] = useState<CharacterDescription[]>(
    []
  );
  const [characterSceneMap, setCharacterSceneMap] = useState<{
    [key: string]: number[];
  }>({});
  const [generatedCharacterImages, setGeneratedCharacterImages] = useState<{
    [key: string]: { [sceneIndex: number]: string };
  }>({});

  // XO State
  const [xoInterpretation, setXOInterpretation] =
    useState<XOInterpretation | null>(null);
  const [meaningContract, setMeaningContract] =
    useState<MeaningContract | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPurposeButtons, setShowPurposeButtons] = useState(true);
  const [currentStep, setCurrentStep] = useState<Step>("entry");
  const [userMode, setUserMode] = useState<UserMode>("creator");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "system",
      content: "Hi! I'm NaXO. How are you doing today.",
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

  const handleEntrySubmit = async (
    clarificationAnswer?: string,
    isRewriteAttempt = false
  ) => {
    const inputToSend = clarificationAnswer || userInput;

    if (!inputToSend.trim()) {
      addMessage(
        "system",
        <div className="text-amber-600">Please describe your moment first.</div>,
        "response"
      );
      return;
    }

    if (inputToSend.trim().length < 3) {
      addMessage(
        "system",
        <div className="text-amber-600">
          Please provide a bit more detail so I can understand your meaning
          better.
        </div>,
        "response"
      );
      return;
    }

    // Show user message
    const messageContent = (
      <div className="p-3">
        <p className="text-base font-medium">{inputToSend}</p>
      </div>
    );

    addMessage("user", messageContent, "selection");

    if (!clarificationAnswer && !isRewriteAttempt) {
      setOriginalUserInput(inputToSend);
      setUserInput("");
    } else {
      setUserInput("");
    }

    setIsGenerating(true);

    try {
      const res = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput: inputToSend,
          isClarificationResponse: !!clarificationAnswer || isRewriteAttempt,
          previousAnswer: clarificationAnswer,
          isRewriteAttempt: isRewriteAttempt,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setXOInterpretation(data.interpretation);
        setMeaningContract(data.interpretation.meaningContract || null);

        // Check if clarification is needed (unless this is a rewrite attempt)
        if (
          !isRewriteAttempt &&
          data.needsClarification &&
          data.clarification
        ) {
          setClarification(data.clarification);

          await simulateTyping(1200);

          addMessage(
            "system",
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-500">
                <div className="mb-2">
                  <p className="text-gray-700">
                    {data.clarification.hypothesis}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Type your clarification below to help me understand your
                intention.
              </p>
            </div>,
            "response"
          );

          setCurrentStep("clarification");
          return;
        }

        // No clarification needed or this is a rewrite attempt
        if (data.interpretation.meaningContract) {
          setMeaningContract(data.interpretation.meaningContract);
          
          // Always trigger story generation regardless of safeToNarrate
          await simulateTyping(800);
          await triggerStoryGeneration(data.interpretation.meaningContract);
        } else {
          // Fallback if no contract
          const fallbackContract: MeaningContract = {
            interpretedMeaning: {
              emotionalState: "neutral",
              emotionalDirection: "observational",
              narrativeTension: "expression of thought",
              intentCategory: "express",
              coreTheme: "human experience",
            },
            confidence: 0.5,
            certaintyMode: "reflection-only",
            reversible: true,
            safeToNarrate: true,
            provenance: {
              source: "ccn-interpretation",
              riskLevel: "medium",
              distortionLikelihood: 0.5,
              risksAcknowledged: [],
            },
            seedMoment: inputToSend,
          };
          
          await triggerStoryGeneration(fallbackContract);
        }
      }
    } catch (error) {
      console.error("XO analysis error:", error);

      await simulateTyping(800);

      // Fallback: Try direct story generation with basic meaning contract
      const fallbackContract: MeaningContract = {
        interpretedMeaning: {
          emotionalState: "neutral",
          emotionalDirection: "observational",
          narrativeTension: "expression of thought",
          intentCategory: "express",
          coreTheme: "human experience",
        },
        confidence: 0.5,
        certaintyMode: "reflection-only",
        reversible: true,
        safeToNarrate: true,
        provenance: {
          source: "ccn-interpretation",
          riskLevel: "medium",
          distortionLikelihood: 0.5,
          risksAcknowledged: [],
        },
        seedMoment: inputToSend,
      };

      addMessage(
        "system",
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-600">
            <HelpCircle size={16} />
            <span className="font-medium">Proceeding tentatively</span>
          </div>
          <div className="text-sm text-gray-600">
            Creating a story based on your input...
          </div>
        </div>,
        "response"
      );

      await simulateTyping(800);
      await triggerStoryGeneration(fallbackContract);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRewriteSubmit = () => {
    if (!userInput.trim() || userInput.trim().length < 3) {
      addMessage(
        "system",
        <div className="text-amber-600">
          Please provide a bit more detail in your rewritten message.
        </div>,
        "response"
      );
      return;
    }

    handleEntrySubmit(userInput, true);
    setIsRewriteMode(false);
  };

  const triggerStoryGeneration = async (contract: MeaningContract) => {
    setIsGenerating(true);

    const loadingMessage: Message = {
      id: messages.length + 1,
      sender: "system",
      content: (
        <div className="flex items-center gap-2">
      
        </div>
      ),
      timestamp: new Date(),
      type: "response",
    };

    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const res = await fetch("/api/xo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput: contract.seedMoment || originalUserInput,
          market: "GLOBAL",
          brand: brandName || undefined,
          meaningContract: contract,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Unknown error");
      }

      // Convert XO micro-story to your existing format
      const generatedStory: GeneratedStory = {
        story: data.story || "Story generated",
        beatSheet: data.beatSheet || [],
        metadata: {
          title: data.metadata?.title || `Story about ${contract.interpretedMeaning.coreTheme}`,
          archetype: "Emergent Narrator",
          tone: contract.interpretedMeaning.emotionalState,
          totalBeats: data.beatSheet?.length || 0,
          estimatedDuration: `${(data.beatSheet?.length || 0) * 5}s`,
          emotionalState: contract.interpretedMeaning.emotionalState,
          narrativeTension: contract.interpretedMeaning.narrativeTension,
          intentCategory: contract.interpretedMeaning.intentCategory,
          coreTheme: contract.interpretedMeaning.coreTheme,
          wordCount: data.story?.split(/\s+/).length || 0,
          isBrandStory: !!brandName,
          brandName: brandName || undefined,
          template: "micro-story",
          lineCount: 0,
          market: data.metadata?.market || "GLOBAL",
        },
      };

      setStory(generatedStory);

      // Remove the loading message
      setMessages((prev) =>
        prev.filter((msg) => {
          if (typeof msg.content === "object" && msg.content !== null) {
            const contentString = msg.content.toString();
            return !contentString.includes("Shaping a story");
          }
          return true;
        })
      );

      // Show the generated story
      addMessage(
        "system",
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-6 rounded-r-lg">
            <div className="text-gray-800 whitespace-pre-line leading-relaxed text-base">
              {generatedStory.story}
            </div>
          </div>

          <div className="space-y-4">
            <p className="font-medium text-gray-700">
              Want to refine this story first?
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() =>
                  handleStoryExpansion("expand", generatedStory, contract)
                }
                className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Maximize2 size={16} />
                Expand this
              </button>
              <button
                onClick={() =>
                  handleStoryExpansion("gentler", generatedStory, contract)
                }
                className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Zap size={16} />
                Make it gentler
              </button>
              <button
                onClick={() =>
                  handleStoryExpansion("harsher", generatedStory, contract)
                }
                className="px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Zap size={16} />
                Make it harsher
              </button>
              <button
                onClick={() => {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: prev.length + 1,
                      sender: "system",
                      content: (
                        <div className="space-y-3">
                          <p className="font-medium text-gray-700">
                            How do you want to use this story?
                          </p>
                          <p className="text-sm text-gray-600">
                            Tell me what this is for (e.g., "Turn this into a
                            brand post", "This is for Instagram", "Make it more
                            formal for LinkedIn", etc.)
                          </p>
                          {showPurposeButtons && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              <button
                                onClick={() => {
                                  const purpose = "Turn this into a brand post";
                                  setUserPurpose(purpose);
                                  setShowPurposeButtons(false);
                                  handleStoryPurpose(purpose);
                                }}
                                className="px-3 py-1.5 text-xs bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full hover:from-purple-200 hover:to-blue-200"
                              >
                                Brand post
                              </button>
                              <button
                                onClick={() => {
                                  const purpose = "This is for Instagram";
                                  setUserPurpose(purpose);
                                  setShowPurposeButtons(false);
                                  handleStoryPurpose(purpose);
                                }}
                                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
                              >
                                Instagram
                              </button>
                              <button
                                onClick={() => {
                                  const purpose =
                                    "Make it more formal for LinkedIn";
                                  setUserPurpose(purpose);
                                  setShowPurposeButtons(false);
                                  handleStoryPurpose(purpose);
                                }}
                                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
                              >
                                LinkedIn
                              </button>
                            </div>
                          )}
                          <p className="text-xs text-gray-500">
                            I'll adapt the same story based on your specific use
                            case.
                          </p>
                        </div>
                      ),
                      timestamp: new Date(),
                      type: "question",
                    },
                  ]);
                  setCurrentStep("story-purpose");
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg"
              >
                Skip refinement →
              </button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3">
                Or continue with this story as-is:
              </p>
              <button
                onClick={() => setCurrentStep("story-generated")}
                className="w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-lg hover:shadow-lg"
              >
                Continue with Story
              </button>
            </div>
          </div>
        </div>,
        "generated"
      );

      setCurrentStep("story-generated");
    } catch (error) {
      console.error("❌ Story generation error:", error);

      // Remove loading message and show error
      setMessages((prev) =>
        prev.filter((msg) => {
          if (typeof msg.content === "object" && msg.content !== null) {
            const contentString = msg.content.toString();
            return !contentString.includes("Shaping a story");
          }
          return true;
        })
      );

      addMessage(
        "system",
        <div className="space-y-6">
          <div className="text-amber-600 p-4 bg-amber-50 rounded-lg">
            <p>
              I had trouble shaping your story. Let's try a different approach:
            </p>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => setCurrentStep("entry")}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg"
            >
              Start Over
            </button>
          </div>
        </div>,
        "response"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStoryPurpose = async (purpose: string) => {
    if (!purpose.trim() || !story || !meaningContract) return;
    if (currentStep === "brand-details" || currentStep === "story-generated") {
      console.log("Already processing purpose, skipping duplicate");
      return;
    }

    setUserPurpose(purpose);

    addMessage(
      "user",
      <div className="rounded-lg p-3">
        <p className="text-sm">{purpose}</p>
      </div>,
      "selection"
    );

    const isBrandPurpose =
      purpose.toLowerCase().includes("brand") ||
      purpose.toLowerCase().includes("company") ||
      purpose.toLowerCase().includes("organization") ||
      purpose.toLowerCase().includes("business") ||
      purpose.toLowerCase().includes("corporate") ||
      purpose.toLowerCase().includes("marketing") ||
      purpose.toLowerCase().includes("advert") ||
      purpose.toLowerCase().includes("campaign");

    if (isBrandPurpose) {
      addMessage(
        "system",
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
            <h3 className="font-semibold text-lg text-purple-800 mb-2 flex items-center gap-2">
              <Palette size={20} />
              🎨 Brand Customization (Optional)
            </h3>
            <p className="text-gray-700 mb-3">
              To make this story perfectly match your brand, you can upload your
              brand guide or logo. This is{" "}
              <span className="font-medium">optional</span> - you can skip and
              continue without it.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Assets (Optional)
                </label>
                <BrandGuideUpload
                onParseComplete={(assets) => {
    setBrandGuide(assets);
    if (assets) {
      addMessage(
        "system",
        <div className="text-green-600 flex items-center gap-2">
          <Check size={16} />
          {assets.palette?.length ? `${assets.palette.length} brand colors extracted` : ''}
          {assets.logoUrls?.length ? `, ${assets.logoUrls.length} logos found` : ''}
        </div>,
        "response"
      );
    }
  }}
/>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
            <button
              onClick={async () => {
                if (!brandName.trim()) {
                  addMessage(
                    "system",
                    <div className="text-amber-600 p-3 bg-amber-50 rounded-lg">
                      Please enter your brand name to continue.
                    </div>,
                    "response"
                  );
                  return;
                }
                await adaptStoryWithBrand(purpose);
              }}
              className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              Continue with Brand
            </button>
            <button
              onClick={() => {
                handleSkipBrandDetails(purpose);
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              Skip Brand Details
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center pt-2">
            Your brand palette will be used for image generation. If you skip,
            generic colors will be used.
          </p>
        </div>,
        "response"
      );

      setCurrentStep("brand-details");
    } else {
      await adaptStoryWithoutBrand(purpose);
    }
    setUserPurpose("");
  };

  const adaptStoryWithBrand = async (purpose: string) => {
    if (!story || !meaningContract) return;

    setIsGenerating(true);

    try {
      const res = await fetch("/api/xo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meaningContract,
          originalInput: originalUserInput,
          requestType: "purpose-adaptation",
          purpose: purpose,
          currentStory: story.story,
          brandContext: brandGuide
            ? {
                name: brandName,
                palette: brandGuide.palette,
                fonts: brandGuide.fonts,
              }
            : undefined,
          brand: brandName,
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();

      if (!data.success) throw new Error(data.error || "Unknown error");

      const adaptedStory: GeneratedStory = {
        story: data.story || story.story,
        beatSheet: data.beatSheet || story.beatSheet,
        metadata: {
          ...story.metadata,
          title:
            data.metadata?.title ||
            `${story.metadata?.title || "Story"} (Brand: ${brandName})`,
          isBrandStory: true,
          brandName: brandName,
        },
      };

      setStory(adaptedStory);

      addMessage(
        "system",
        <div className="space-y-6">
          {brandGuide && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette size={16} className="text-purple-600" />
                  <span className="font-semibold text-purple-800">
                    Brand Applied
                  </span>
                </div>
                {brandName && (
                  <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                    {brandName}
                  </span>
                )}
              </div>

              {brandGuide.palette && brandGuide.palette.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-700 mb-2">
                    Using brand colors:
                  </p>
                  <div className="flex gap-1.5">
                    {brandGuide.palette.slice(0, 6).map((color, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded border-2 border-white shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-r-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Brand Adapted
              </div>
            </div>
            <div className="text-gray-800 whitespace-pre-line leading-relaxed text-base">
              {adaptedStory.story}
            </div>
          </div>

          <div className="space-y-4">
            <p className="font-medium text-gray-700">
              Your brand-adapted story is ready!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={handleGenerateImage}
                className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
              >
                <ImageIcon size={18} />
                Generate Story Image
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
                const exportData = {
                  story: adaptedStory,
                  brandInfo: {
                    name: brandName,
                    palette: brandGuide?.palette,
                    fonts: brandGuide?.fonts,
                  },
                  purpose: purpose,
                  meaningContract: meaningContract,
                  timestamp: new Date().toISOString(),
                };

                const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `brand-story-${brandName || "unnamed"}-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);

                addMessage(
                  "system",
                  <div className="text-green-600">
                    ✓ Brand story exported as JSON.
                  </div>,
                  "response"
                );
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Export Story as JSON
            </button>
          </div>
        </div>,
        "generated"
      );

      setCurrentStep("story-generated");
    } catch (error) {
      console.error("Brand adaptation error:", error);

      addMessage(
        "system",
        <div className="space-y-4">
          <div className="text-amber-600 p-4 bg-amber-50 rounded-lg">
            <p>I'll continue with a generic adaptation.</p>
            <p className="text-sm mt-2">
              Error: {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
          await adaptStoryWithoutBrand(purpose);
        </div>,
        "response"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const adaptStoryWithoutBrand = async (purpose: string) => {
    if (!purpose.trim() || !story || !meaningContract) return;

    setIsGenerating(true);

    const thinkingId = addMessage(
      "system",
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
        <span>Adapting story for your purpose...</span>
      </div>,
      "response"
    );

    try {
      const res = await fetch("/api/xo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meaningContract,
          originalInput: originalUserInput,
          requestType: "purpose-adaptation",
          purpose: purpose,
          currentStory: story.story,
          skipBrand: true,
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
        story: data.story || story.story,
        beatSheet: data.beatSheet || story.beatSheet,
        metadata: {
          ...story.metadata,
          title:
            data.metadata?.title ||
            `${story.metadata?.title || "Story"} (${purpose.substring(0, 20)}...)`,
        },
      };

      setStory(adaptedStory);

      setMessages((prev) => prev.filter((msg) => msg.id !== thinkingId));

      addMessage(
        "system",
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-r-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Adapted
              </div>
            </div>
            <div className="text-gray-800 whitespace-pre-line leading-relaxed text-base">
              {adaptedStory.story}
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <p className="font-medium text-gray-700">
              Your adapted story is ready!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={handleGenerateImage}
                className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
              >
                <ImageIcon size={18} />
                Generate Story Image
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
                const blob = new Blob([adaptedStory.story], {
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
        </div>,
        "generated"
      );

      setCurrentStep("story-generated");
    } catch (error) {
      console.error("Purpose adaptation error:", error);

      setMessages((prev) => prev.filter((msg) => msg.id !== thinkingId));

      addMessage(
        "system",
        <div className="space-y-6">
          <div className="text-amber-600 p-4 bg-amber-50 rounded-lg">
            <p>
              I'll continue with the original story, but you can still use it
              for your purpose.
            </p>
            <p className="text-sm mt-2">
              Error: {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={handleGenerateImage}
                className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
              >
                <ImageIcon size={18} />
                Generate Story Image
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

  const handleSkipBrandDetails = (purpose: string) => {
    if (!story) return;

    addMessage(
      "user",
      <div className="flex items-center gap-2">
        <X size={16} className="text-gray-600" />
        <span className="font-medium">Skip Brand Details</span>
      </div>,
      "selection"
    );

    addMessage(
      "system",
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-r-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {story.metadata?.title || "Your Story"}
              </h3>
              <div className="text-sm text-green-600 mt-1">
                Ready for: <span className="font-medium">{purpose}</span>
                <span className="text-xs text-gray-500 ml-2">
                  (brand skipped)
                </span>
              </div>
            </div>
            <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Original Story
            </div>
          </div>
          <div className="text-gray-800 whitespace-pre-line leading-relaxed text-base">
            {story.story}
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <p className="font-medium text-gray-700">
            Your story is ready! What would you like to do next?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={handleGenerateImage}
              className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
            >
              <ImageIcon size={18} />
              Generate Story Image
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
              const blob = new Blob([story.story], {
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
      </div>,
      "generated"
    );

    setCurrentStep("story-generated");
  };

  const handleStoryExpansion = async (
    expansionType: "expand" | "gentler" | "harsher",
    storyToExpand: GeneratedStory,
    contract: MeaningContract
  ) => {
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

    setIsGenerating(true);

    addMessage(
      "user",
      <div className="flex items-center gap-2">
        <Type size={16} />
        <span className="font-medium">
          {expansionType === "expand" && "Expand this"}
          {expansionType === "gentler" && "Make it gentler"}
          {expansionType === "harsher" && "Make it harsher"}
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
      const res = await fetch("/api/xo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meaningContract: contract,
          originalInput: originalUserInput,
          requestType: "expansion",
          refinement: expansionType,
          currentStory: JSON.stringify({
            beats: storyToExpand.story.split("\n\n").map((beat) => ({
              lines: beat.split("\n"),
            })),
          }),
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
        story: data.story || storyToExpand.story,
        beatSheet: data.beatSheet || storyToExpand.beatSheet,
        metadata: {
          ...storyToExpand.metadata,
          title:
            data.metadata?.title ||
            `${storyToExpand.metadata?.title} - ${expansionType}`,
        },
      };

      setStory(expandedStory);

      setMessages((prev) => prev.filter((msg) => msg.id !== loadingId));

      addMessage(
        "system",
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {expansionType === "expand"
                ? "Expanded"
                : expansionType === "gentler"
                ? "Gentler"
                : "Harsher"}
            </span>
            <div className="text-gray-800 whitespace-pre-line leading-relaxed mt-3">
              {expandedStory.story}
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-medium text-gray-700">
              How do you want to use this expanded story?
            </p>
            <p className="text-sm text-gray-600">
              Tell me what this is for (e.g., "brand post", "Instagram",
              "LinkedIn", etc.)
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => {
                  const purpose = "Turn this into a brand post";
                  setUserPurpose(purpose);
                  handleStoryPurpose(purpose);
                  setShowPurposeButtons(false);
                }}
                className="px-3 py-1.5 text-xs bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full hover:from-purple-200 hover:to-blue-200"
              >
                Brand post
              </button>
              <button
                onClick={() => {
                  const purpose = "This is for Instagram";
                  setUserPurpose(purpose);
                  handleStoryPurpose(purpose);
                  setShowPurposeButtons(false);
                }}
                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
              >
                Instagram
              </button>
              <button
                onClick={() => {
                  const purpose = "Make it more formal for LinkedIn";
                  setUserPurpose(purpose);
                  handleStoryPurpose(purpose);
                  setShowPurposeButtons(false);
                }}
                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
              >
                LinkedIn
              </button>
            </div>
          </div>
        </div>,
        "generated"
      );

      setCurrentStep("story-purpose");
    } catch (error) {
      console.error("Expansion error:", error);

      setMessages((prev) => prev.filter((msg) => msg.id !== loadingId));

      addMessage(
        "system",
        <div className="space-y-4">
          <div className="text-red-600 p-4 bg-red-50 rounded-lg">
            <p>Failed to expand story. Please try again.</p>
            <p className="text-sm mt-1">
              Error: {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setCurrentStep("story-generated");
                addMessage(
                  "system",
                  <div className="text-gray-600">
                    You can continue with the original story.
                  </div>,
                  "response"
                );
              }}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg"
            >
              Back to Story
            </button>
            <button
              onClick={() => {
                setUserPurpose("");
                setCurrentStep("story-purpose");
                addMessage(
                  "system",
                  <div className="space-y-3">
                    <p className="font-medium text-gray-700">
                      How do you want to use the original story?
                    </p>
                    <p className="text-sm text-gray-600">
                      Tell me what this is for (e.g., "brand post", "Instagram",
                      "LinkedIn", etc.)
                    </p>
                  </div>,
                  "question"
                );
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Continue with Original
            </button>
          </div>
        </div>,
        "response"
      );

      setCurrentStep("story-purpose");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!story) return;

    setIsGenerating(true);

    addMessage(
      "user",
      <div className="flex items-center gap-2">
        <ImageIcon size={16} />
        <span className="font-medium">Generate Story Image</span>
      </div>,
      "selection"
    );

    const loadingId = addMessage(
      "system",
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
        <span>Creating visual for your story...</span>
      </div>,
      "response"
    );

    try {
      // Prepare the story summary for image generation
      console.log("Generating image for story:", story);
      const storySummary = story.story.replace(/\n+/g, ' ').trim();
      const sceneDescription = `A visual representation of the story: ${storySummary}...`;

      const res = await fetch("/api/generateImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneDescription,
          tone: story.metadata?.tone || "cinematic",
          brandSafe: brandGuide?.brandSafe || true,
          brandPalette: brandGuide?.palette || [],
          template: "instagram-story",
          beat: "Story Cover",
          visualCues: ["cinematic", "emotional", "storytelling", "human moment"],
          market: story.metadata?.market || "GLOBAL",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Unknown error");
      }

      setMessages((prev) => prev.filter((msg) => msg.id !== loadingId));

      addMessage(
        "system",
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Visual Created! 🎨</h3>
              <div className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                Story Artwork
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              A visual representation of your story has been generated.
            </p>
            
            <div className="flex flex-col items-center gap-4">
              <img 
                src={data.imageUrl} 
                alt="Story visual" 
                className="w-full max-w-md rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => openImageModal(0)}
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = data.imageUrl;
                    link.download = `story-visual-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download Image
                </button>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(data.imageUrl);
                    alert("Image URL copied to clipboard!");
                  }}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
                >
                  <Copy size={18} />
                  Copy URL
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="font-medium text-gray-700">
              What would you like to do next?
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => handleVideoOption()}
                className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
              >
                <VideoIcon size={18} />
                Generate Video Script
              </button>
              
              <button
                onClick={handleExport}
                className="px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Share2 size={18} />
                Export Package
              </button>
            </div>
          </div>
        </div>,
        "generated"
      );

      // Store the generated image
      setGeneratedImages({ 0: data.imageUrl });

    } catch (error) {
      console.error("Image generation error:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingId));
      addMessage(
        "system",
        <div className="text-red-600">
          Failed to generate image. Please try again.
        </div>,
        "response"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVideoOption = async () => {
    addMessage(
      "system",
      <div className="space-y-4">
        <p>What would you like to create?</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={handleGenerateImage}
            className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
          >
            <ImageIcon size={18} />
            Generate Story Image
          </button>
          <button
            onClick={() => handleGenerateVideoScript()}
            className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
          >
            <VideoIcon size={18} />
            Generate Video Script
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Create a single visual for your story or a full video script.
        </p>
      </div>,
      "question"
    );

    setCurrentStep("video-option");
  };

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
          tone: story.metadata?.tone || "neutral",
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
              Ready for video production
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

  const handleExport = async () => {
    if (!story) return;

    addMessage(
      "system",
      <div className="space-y-4">
        <p>How would you like to export your work?</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleExportFormat("json")}
            className="p-4 border rounded-lg text-center hover:border-blue-300 hover:bg-blue-50"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <div className="font-medium">JSON</div>
            <div className="text-sm text-gray-600 mt-1">Complete package</div>
          </button>
          <button
            onClick={() => handleExportFormat("text")}
            className="p-4 border rounded-lg text-center hover:border-green-300 hover:bg-green-50"
          >
            <div className="text-2xl mb-2">📝</div>
            <div className="font-medium">Text</div>
            <div className="text-sm text-gray-600 mt-1">Story only</div>
          </button>
        </div>
      </div>,
      "question"
    );

    setCurrentStep("export");
  };

  const handleExportFormat = async (format: string) => {
    try {
      let data: any, filename: string, mimeType: string;

      const exportData = {
        version: "narratives-xo-v2",
        timestamp: new Date().toISOString(),
        mode: userMode,
        brandApplied: !!brandGuide,
        brand: brandName || null,
        brandPalette: brandGuide?.palette || null,
        brandFonts: brandGuide?.fonts || null,
        narrative: {
          story,
          videoScript,
          generatedImages,
          meaningContract,
          xoInterpretation,
        },
      };

      switch (format) {
        case "json":
          data = exportData;
          filename = `narrative-xo-${Date.now()}.json`;
          mimeType = "application/json";
          break;

        case "text":
          data = story?.story || "";
          filename = `story-${Date.now()}.txt`;
          mimeType = "text/plain";
          break;

        default:
          throw new Error("Invalid export format");
      }

      const blob = new Blob([format === "json" ? JSON.stringify(data, null, 2) : data], {
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

      await simulateTyping(1000);

      addMessage(
        "system",
        <div className="space-y-4">
          <p>Your story creation is complete! Want to create another?</p>
          <button
            onClick={() => {
              setUserInput("");
              setOriginalUserInput("");
              setBrandName("");
              setBrandGuide(null);
              setStory(null);
              setVideoScript(null);
              setGeneratedImages({});
              setXOInterpretation(null);
              setMeaningContract(null);
              setClarification(null);
              setUserPurpose("");
              setMainCharacters([]);
              setCharacterSceneMap({});
              setGeneratedCharacterImages({});
              setCurrentStep("entry");
              setMessages([
                {
                  id: 1,
                  sender: "system",
                  content: "Hi! I'm NaXO. Let's create another amazing story.",
                  timestamp: new Date(),
                  type: "question",
                },
                {
                  id: 2,
                  sender: "system",
                  content: (
                    <div className="space-y-4">
                      <p className="font-medium">
                        What moment are you trying to express?
                      </p>
                      <p className="text-sm text-gray-500">
                        Describe your moment in your own words...
                      </p>
                    </div>
                  ),
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
          <div className="p-4 fixed bottom-0 left-[27%] right-0">
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (userInput.trim() && userInput.trim().length >= 3) {
                        if (isRewriteMode) {
                          handleRewriteSubmit();
                        } else {
                          handleEntrySubmit();
                        }
                      }
                    }
                  }}
                  placeholder={
                    isRewriteMode
                      ? "Rewrite your message here..."
                      : "Describe your moment in your own words..."
                  }
                  className="w-[80%] h-32 p-4 pr-12 pb-12 border border-gray-300 rounded-3xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={() => {
                    if (isRewriteMode) {
                      handleRewriteSubmit();
                    } else {
                      handleEntrySubmit();
                    }
                  }}
                  disabled={!userInput.trim() || userInput.trim().length < 3}
                  className="absolute right-56 bottom-3 w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title={isRewriteMode ? "Send rewrite" : "Share my moment"}
                >
                  <Send size={18} />
                </button>
              </div>
              {isRewriteMode && (
                <p className="text-sm text-gray-500 pl-4">
                  I'll generate a story based on your rewrite, even if I'm not
                  completely sure.
                </p>
              )}
            </div>
          </div>
        );
      case "clarification":
        return (
          <div className="p-4 border-t">
            <div className="space-y-4">
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">
                  {clarification?.hypothesis}
                </p>
                <p className="text-sm text-gray-500 italic">
                  {clarification?.correctionInvitation}
                </p>
              </div>

              <div className="relative">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (userInput.trim()) {
                        handleEntrySubmit(userInput);
                      }
                    }
                  }}
                  placeholder="Type your clarification here..."
                  className="w-full h-24 p-3 pr-12 pb-12 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={() => handleEntrySubmit(userInput)}
                  disabled={!userInput.trim()}
                  className="absolute right-3 bottom-3 w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Submit clarification"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        );

      case "story-purpose":
        return (
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <textarea
                    value={userPurpose}
                    onChange={(e) => setUserPurpose(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (
                          userPurpose.trim() &&
                          userPurpose.trim().length >= 3
                        ) {
                          handleStoryPurpose(userPurpose);
                        }
                      }
                    }}
                    placeholder="Describe your purpose... (e.g., 'Turn this into a brand post', 'This is for Instagram', 'Make it more formal for LinkedIn', etc.)"
                    className="w-full h-24 p-3 pr-12 pb-12 border border-gray-300 rounded-3xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => handleStoryPurpose(userPurpose)}
                    disabled={
                      !userPurpose.trim() || userPurpose.trim().length < 3
                    }
                    className="absolute right-3 bottom-3 w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Adapt story"
                  >
                    <Sparkles size={18} />
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => {
                      setCurrentStep("story-generated");
                      addMessage(
                        "system",
                        <div className="text-gray-600">
                          You can continue with the story as is.
                        </div>,
                        "response"
                      );
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap self-start"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "brand-details":
        return (
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (brandName.trim()) {
                          adaptStoryWithBrand(userPurpose);
                        }
                      }
                    }}
                    placeholder="Enter your brand name..."
                    className="w-full h-[100px] p-3 pr-12 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={async () => {
                      if (!brandName.trim()) {
                        addMessage(
                          "system",
                          <div className="text-amber-600">
                            Please enter a brand name to continue.
                          </div>,
                          "response"
                        );
                        return;
                      }
                      await adaptStoryWithBrand(userPurpose);
                    }}
                    disabled={!brandName.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Continue with brand"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
                <div>
                  <button
                    onClick={async () => {
                      await adaptStoryWithoutBrand(userPurpose);
                    }}
                    className="px-4 h-fit py-2 border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "story-generated":
        return (
          <div className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={handleGenerateImage}
                  className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <ImageIcon size={18} />
                  Generate Story Image
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
                  if (!story?.story) return;
                  const blob = new Blob([story.story], {
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

      case "video-option":
        return (
          <div className="p-4 border-t bg-white">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleGenerateImage}
                  disabled={isGenerating}
                  className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-3 text-lg font-medium"
                >
                  <ImageIcon size={24} />
                  {isGenerating ? "Creating..." : "Generate Story Image"}
                </button>
                <button
                  onClick={handleGenerateVideoScript}
                  disabled={isGenerating}
                  className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-3 text-lg font-medium"
                >
                  <VideoIcon size={24} />
                  {isGenerating ? "Creating..." : "Generate Video Script"}
                </button>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Create a single compelling visual or a complete video script for your story
              </p>
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
      ?.map((scene, index) => ({
        url: generatedImages[index] || "",
        title: `Scene ${index + 1}: ${scene.beat}`,
        description: scene.description,
      }))
      .filter((item) => item.url) || [];

  return (
    <Layout>
      <div className="mx-16">
        <div className="h-screen  bg-[#FAF9F6] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-5xl mx-auto space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.sender === "system" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#5B2D8B] flex items-center justify-center">
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
                    px-4 py-3 rounded-3xl
                    ${
                      message.sender === "system"
                        ? "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
                        : "bg-white border border-gray-200 text-gray-800 rounded-tr-sm shadow-sm"
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
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center order-2">
                      <UserIcon size={16} className="text-black" />
                    </div>
                  )}
                </div>
              ))}

              {isGenerating && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full  flex items-center justify-center">
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
          <div className="mx-20 ">{renderInputSection()}</div>

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
      </div>
    </Layout>
  );
}