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
  MeaningRiskAssessment,
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
  | "understanding-preview"
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

// Extended interface with understandingSummary
interface ExtendedMeaningContract extends MeaningContract {
  understandingSummary?: string;
}

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
    [],
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
  const [understandingPreview, setUnderstandingPreview] = useState<string>("");
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
    type?: "selection" | "response" | "generated" | "question",
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

  // Helper to safely access understandingSummary
  const getUnderstandingSummary = (
    contract: MeaningContract | null,
  ): string | undefined => {
    if (!contract) return undefined;

    // Type assertion to access the extended property
    const extendedContract = contract as ExtendedMeaningContract;
    return (
      extendedContract.understandingSummary ||
      (contract as any).understandingSummary || // Fallback to any
      undefined
    );
  };

  // Step 1: Natural Story Start with XO Clarify
  // Step 1: Natural Story Start with XO Clarify
  // Step 1: Natural Story Start with XO Clarify
// Step 1: Natural Story Start with XO Clarify
const handleEntrySubmit = async (
  clarificationAnswer?: string,
  isRewriteAttempt = false,
) => {
  const inputToSend = clarificationAnswer || userInput;

  if (!inputToSend.trim()) {
    addMessage(
      "system",
      <div className="text-amber-600">
        Please describe your moment first.
      </div>,
      "response",
    );
    return;
  }

  if (inputToSend.trim().length < 3) {
    addMessage(
      "system",
      <div className="text-amber-600">
        Please provide a bit more detail so I can understand your meaning better.
      </div>,
      "response",
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
      setUnderstandingPreview(data.understandingPreview || "");

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
              Type your clarification below to help me understand your intention.
            </p>
          </div>,
          "response",
        );

        setCurrentStep("clarification");
        return;
      }

      // No clarification needed or this is a rewrite attempt
      if (data.interpretation.meaningContract) {
        setMeaningContract(data.interpretation.meaningContract);

        // Check if safe to narrate OR if this is a rewrite attempt
        if (
          data.interpretation.meaningContract.safeToNarrate ||
          isRewriteAttempt ||
          !data.interpretation.meaningContract.safeToNarrate // Changed: Trigger even when safeToNarrate is false
        ) {
          // Trigger story generation regardless of safeToNarrate value
          await simulateTyping(800);
          await triggerStoryGeneration(data.interpretation.meaningContract);
        } else {
          // This block should now be unreachable since we're triggering regardless
          // But keeping it as a fallback
          await simulateTyping(800);
          await triggerStoryGeneration(data.interpretation.meaningContract);
        }
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
      "response",
    );

    await simulateTyping(800);

    await triggerStoryGeneration(fallbackContract);
  } finally {
    setIsGenerating(false);
  }
};

// Remove the handlePreviewConfirmation function since we won't use it anymore
// const handlePreviewConfirmation = async (contract: MeaningContract) => {
//   // This function is no longer needed
// };

// Also remove the understanding-preview case from renderInputSection since we're not using it
// We only need to handle the case where we trigger story generation directly
  // Add this function to handle the rewrite submission
  const handleRewriteSubmit = () => {
    if (!userInput.trim() || userInput.trim().length < 3) {
      addMessage(
        "system",
        <div className="text-amber-600">
          Please provide a bit more detail in your rewritten message.
        </div>,
        "response",
      );
      return;
    }

    // Call handleEntrySubmit with isRewriteAttempt = true
    handleEntrySubmit(userInput, true);
    setIsRewriteMode(false); // Reset rewrite mode after submission
  };



  // Trigger Story Generation with Meaning Contract
  const triggerStoryGeneration = async (contract: MeaningContract) => {
    setIsGenerating(true);

    console.log("triggerStoryGeneration with contract:", {
      emotionalState: contract.interpretedMeaning.emotionalState,
      narrativeTension: contract.interpretedMeaning.narrativeTension,
      certaintyMode: contract.certaintyMode,
      safeToNarrate: contract.safeToNarrate,
    });

    // Show loading message
    const loadingMessage: Message = {
      id: messages.length + 1,
      sender: "system",
      content: (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
          <span>Shaping a story...</span>
        </div>
      ),
      timestamp: new Date(),
      type: "response",
    };

    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const storyRequestData = {
        meaningContract: contract,
        requestType: "micro-story",
        brandContext: brandGuide
          ? {
              name: brandName,
              palette: brandGuide.palette,
              fonts: brandGuide.fonts,
            }
          : undefined,
      };

      console.log("Sending to /api/generateStory:", {
        emotionalState: contract.interpretedMeaning.emotionalState,
        narrativeTension: contract.interpretedMeaning.narrativeTension,
        certaintyMode: contract.certaintyMode,
        safeToNarrate: contract.safeToNarrate,
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
        story: data.story,
        beatSheet: data.beatSheet,
        metadata: {
          ...data.metadata,
          title:
            data.metadata.title ||
            `Story about ${contract.interpretedMeaning.coreTheme}`,
          archetype: "Emergent Narrator",
          tone: contract.interpretedMeaning.emotionalState,
          totalBeats: data.beatSheet?.length || 0,
          estimatedDuration: `${(data.beatSheet?.length || 0) * 5}s`,
        },
      };

      setStory(generatedStory);
      await detectCharacters(generatedStory);

      // Remove the loading message
      setMessages((prev) => {
        const filtered = prev.filter((msg) => {
          if (typeof msg.content === "string") {
            return !msg.content.includes("Shaping a story");
          }
          try {
            const contentStr = JSON.stringify(msg.content);
            return !contentStr.includes("Shaping a story");
          } catch {
            return true;
          }
        });

        // Get understanding summary if available
        const understandingSummary = getUnderstandingSummary(contract);

        // Add the generated story message
        const newMessages = [
          ...filtered,
          {
            id: filtered.length + 1,
            sender: "system" as const,
            content: (
              <div className="space-y-6">
                {/* Story Display */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-6 rounded-r-lg">
                  <div className="flex items-center justify-between mb-4"></div>
                  <div className="text-gray-800 whitespace-pre-line leading-relaxed text-base">
                    {generatedStory.story}
                  </div>
                </div>

                {/* EXPANSION OPTIONS */}
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
                        handleStoryExpansion(
                          "gentler",
                          generatedStory,
                          contract,
                        )
                      }
                      className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Zap size={16} />
                      Make it gentler
                    </button>
                    <button
                      onClick={() =>
                        handleStoryExpansion(
                          "harsher",
                          generatedStory,
                          contract,
                        )
                      }
                      className="px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Zap size={16} />
                      Make it harsher
                    </button>
                      <button
                      onClick={() => {
                        // Show purpose options
                        setMessages((prev) => [
                          ...prev,
                          {
                            id: prev.length + 1,
                            sender: "system" as const,
                            content: (
                              <div className="space-y-3">
                                <p className="font-medium text-gray-700">
                                  How do you want to use this story?
                                </p>
                                <p className="text-sm text-gray-600">
                                  Tell me what this is for (e.g., "Turn this
                                  into a brand post", "This is for Instagram",
                                  "Make it more formal for LinkedIn", etc.)
                                </p>
                                {showPurposeButtons && (
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    <button
                                      onClick={() => {
                                        const purpose =
                                          "Turn this into a brand post";
                                        setUserPurpose(purpose);
                                        setShowPurposeButtons(false);
                                        const updatedMessage = {
                                          ...messages[messages.length - 1],
                                          content: (
                                            <div className="space-y-3">
                                              <p className="font-medium text-gray-700">
                                                How do you want to use this
                                                story?
                                              </p>
                                              <p className="text-sm text-gray-600">
                                                Tell me what this is for (e.g.,
                                                "Turn this into a brand post",
                                                "This is for Instagram", "Make
                                                it more formal for LinkedIn",
                                                etc.)
                                              </p>
                                              <div className="pt-2">
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
                                                  <span className="text-xs">
                                                    Selected:
                                                  </span>
                                                  <span className="font-medium text-sm">
                                                    {purpose}
                                                  </span>
                                                </div>
                                              </div>
                                              <p className="text-xs text-gray-500">
                                                I'll adapt the same story based
                                                on your specific use case.
                                              </p>
                                            </div>
                                          ),
                                        };
                                        setMessages((prev) => [
                                          ...prev.slice(0, -1),
                                          updatedMessage,
                                        ]);
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
                                        const updatedMessage = {
                                          ...messages[messages.length - 1],
                                          content: (
                                            <div className="space-y-3">
                                              <p className="font-medium text-gray-700">
                                                How do you want to use this
                                                story?
                                              </p>
                                              <p className="text-sm text-gray-600">
                                                Tell me what this is for (e.g.,
                                                "Turn this into a brand post",
                                                "This is for Instagram", "Make
                                                it more formal for LinkedIn",
                                                etc.)
                                              </p>
                                              <div className="pt-2">
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
                                                  <span className="text-xs">
                                                    Selected:
                                                  </span>
                                                  <span className="font-medium text-sm">
                                                    {purpose}
                                                  </span>
                                                </div>
                                              </div>
                                              <p className="text-xs text-gray-500">
                                                I'll adapt the same story based
                                                on your specific use case.
                                              </p>
                                            </div>
                                          ),
                                        };
                                        setMessages((prev) => [
                                          ...prev.slice(0, -1),
                                          updatedMessage,
                                        ]);
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
                                        const updatedMessage = {
                                          ...messages[messages.length - 1],
                                          content: (
                                            <div className="space-y-3">
                                              <p className="font-medium text-gray-700">
                                                How do you want to use this
                                                story?
                                              </p>
                                              <p className="text-sm text-gray-600">
                                                Tell me what this is for (e.g.,
                                                "Turn this into a brand post",
                                                "This is for Instagram", "Make
                                                it more formal for LinkedIn",
                                                etc.)
                                              </p>
                                              <div className="pt-2">
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
                                                  <span className="text-xs">
                                                    Selected:
                                                  </span>
                                                  <span className="font-medium text-sm">
                                                    {purpose}
                                                  </span>
                                                </div>
                                              </div>
                                              <p className="text-xs text-gray-500">
                                                I'll adapt the same story based
                                                on your specific use case.
                                              </p>
                                            </div>
                                          ),
                                        };
                                        setMessages((prev) => [
                                          ...prev.slice(0, -1),
                                          updatedMessage,
                                        ]);
                                        handleStoryPurpose(purpose);
                                      }}
                                      className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
                                    >
                                      LinkedIn
                                    </button>
                                  </div>
                                )}

                                <p className="text-xs text-gray-500">
                                  I'll adapt the same story based on your
                                  specific use case.
                                </p>
                              </div>
                            ),
                            timestamp: new Date(),
                            type: "question" as const,
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
                  
                  </div>
                </div>
              </div>
            ),
            timestamp: new Date(),
            type: "generated" as const,
          },
        ];

        return newMessages;
      });

      setCurrentStep("story-generated");
    } catch (error) {
      console.error("❌ Story generation error:", error);

      // Remove loading message and show error
      setMessages((prev) => {
        const filtered = prev.filter((msg) => {
          if (typeof msg.content === "string") {
            return !msg.content.includes("Shaping a story");
          }
          try {
            const contentStr = JSON.stringify(msg.content);
            return !contentStr.includes("Shaping a story");
          } catch {
            return true;
          }
        });

        return [
          ...filtered,
          {
            id: filtered.length + 1,
            sender: "system",
            content: (
              <div className="space-y-6">
                <div className="text-amber-600 p-4 bg-amber-50 rounded-lg">
                  <p>
                    I had trouble shaping your story. Let's try a different
                    approach:
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

  // Handle story purpose input
  const handleStoryPurpose = async (purpose: string) => {
    if (!purpose.trim() || !story || !meaningContract) return;
    if (currentStep === "brand-details" || currentStep === "story-generated") {
      console.log("Already processing purpose, skipping duplicate");
      return;
    }

    setUserPurpose(purpose);

    // Add user's purpose as a message
    addMessage(
      "user",
      <div className="rounded-lg p-3">
        <p className="text-sm">{purpose}</p>
      </div>,
      "selection",
    );

    // Check if purpose mentions brand
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
      // Show brand details collection as a SYSTEM MESSAGE
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
                          Brand assets loaded successfully!
                        </div>,
                        "response",
                      );
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
            <button
              onClick={async () => {
                if (!brandName.trim()) {
                  addMessage(
                    "system",
                    <div className="text-amber-600 p-3 bg-amber-50 rounded-lg">
                      Please enter your brand name to continue.
                    </div>,
                    "response",
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
        "response",
      );

      setCurrentStep("brand-details");
    } else {
      // Non-brand purpose - adapt normally
      await adaptStoryWithoutBrand(purpose);
    }
    setUserPurpose("");
  };

  // Adapt story with brand using meaning contract
  const adaptStoryWithBrand = async (purpose: string) => {
    if (!story || !meaningContract) return;

    setIsGenerating(true);

    try {
      const res = await fetch("/api/generateStory", {
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
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();

      if (!data.success) throw new Error(data.error || "Unknown error");

      const adaptedStory: GeneratedStory = {
        story: data.story,
        beatSheet: data.beatSheet,
        metadata: {
          ...data.metadata,
          title:
            data.metadata.title ||
            `${story.metadata.title} (Brand: ${brandName})`,
          archetype: "Emergent Narrator",
          tone: meaningContract.interpretedMeaning.emotionalState,
          totalBeats: data.beatSheet?.length || 0,
          estimatedDuration: `${(data.beatSheet?.length || 0) * 5}s`,
        },
      };

      setStory(adaptedStory);

      // Show adapted story with brand info
      addMessage(
        "system",
        <div className="space-y-6">
          {/* Brand Applied Badge */}
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

          {/* Adapted Story Display */}
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

          {/* Continue options */}
          <div className="space-y-4">
            <p className="font-medium text-gray-700">
              Your brand-adapted story is ready!
            </p>

            <div className="grid grid-cols-1 gap-3">
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
                // Export with brand info
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
                  "response",
                );
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Export Story as JSON
            </button>
          </div>
        </div>,
        "generated",
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
          {/* Fallback to non-brand adaptation */}
          await adaptStoryWithoutBrand(purpose);
        </div>,
        "response",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Adapt story without brand
  const adaptStoryWithoutBrand = async (purpose: string) => {
    if (!purpose.trim() || !story || !meaningContract) return;

    setIsGenerating(true);

    // Add thinking message
    const thinkingId = addMessage(
      "system",
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
        <span>Adapting story for your purpose...</span>
      </div>,
      "response",
    );

    try {
      const res = await fetch("/api/generateStory", {
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
        story: data.story,
        beatSheet: data.beatSheet,
        metadata: {
          ...data.metadata,
          title:
            data.metadata.title ||
            `${story.metadata.title} (${purpose.substring(0, 20)}...)`,
          archetype: "Emergent Narrator",
          tone: meaningContract.interpretedMeaning.emotionalState,
          totalBeats: data.beatSheet?.length || 0,
          estimatedDuration: `${(data.beatSheet?.length || 0) * 5}s`,
        },
      };

      // Update the story with adapted version
      setStory(adaptedStory);

      // Remove thinking message
      setMessages((prev) => prev.filter((msg) => msg.id !== thinkingId));

      // Show adapted story
      addMessage(
        "system",
        <div className="space-y-6">
          {/* Adapted Story Display */}
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

          {/* Story Shaping Options */}
          <div className="space-y-4 pt-4">
            <p className="font-medium text-gray-700">
              Your adapted story is ready!
            </p>

            <div className="grid grid-cols-1 gap-3">
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
                  "response",
                );
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Export Story as Text
            </button>
          </div>
        </div>,
        "generated",
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

          {/* Show original story with options */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
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
        "response",
      );

      setCurrentStep("story-generated");
    } finally {
      setIsGenerating(false);
      setUserPurpose("");
    }
  };

  // Handle skipping brand details
  const handleSkipBrandDetails = (purpose: string) => {
    if (!story) return;

    // Add skip confirmation message
    addMessage(
      "user",
      <div className="flex items-center gap-2">
        <X size={16} className="text-gray-600" />
        <span className="font-medium">Skip Brand Details</span>
      </div>,
      "selection",
    );

    // Show the existing story (no API call)
    addMessage(
      "system",
      <div className="space-y-6">
        {/* Story Display */}
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

        {/* Story Shaping Options */}
        <div className="space-y-4 pt-4">
          <p className="font-medium text-gray-700">
            Your story is ready! What would you like to do next?
          </p>

          <div className="grid grid-cols-1 gap-3">
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
                "response",
              );
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Export Story as Text
          </button>
        </div>
      </div>,
      "generated",
    );

    setCurrentStep("story-generated");
  };

  // Character detection function
  const detectCharacters = async (storyData: GeneratedStory) => {
    try {
      const res = await fetch("/api/detectCharacters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story: storyData.story,
          beatSheet: storyData.beatSheet,
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
            mainCharacters: data.characters || [],
          },
        };

        setStory(updatedStory);
      }
    } catch (error) {
      console.error("Character detection error:", error);
    }
  };

  // Story Expansion
  const handleStoryExpansion = async (
    expansionType: "expand" | "gentler" | "harsher" | "60-second",
    storyToExpand: GeneratedStory,
    contract: MeaningContract,
  ) => {
    console.log("handleStoryExpansion called:", {
      expansionType,
      storyTitle: storyToExpand.metadata?.title,
      emotionalState: contract.interpretedMeaning.emotionalState,
    });

    if (!storyToExpand || !storyToExpand.story) {
      console.error("No valid story provided for expansion");
      addMessage(
        "system",
        <div className="text-red-600">
          Error: Invalid story provided for expansion.
        </div>,
        "response",
      );
      return;
    }

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
        </span>
      </div>,
      "selection",
    );

    const loadingId = addMessage(
      "system",
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
        <span>Shaping your story...</span>
      </div>,
      "response",
    );

    try {
      const res = await fetch("/api/generateStory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meaningContract: contract,
          originalInput: originalUserInput,
          requestType: "expansion",
          expansionType: expansionType,
          currentStory: storyToExpand.story,
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
        story: data.story,
        beatSheet: data.beatSheet,
        metadata: {
          ...data.metadata,
          title:
            data.metadata.title ||
            `${storyToExpand.metadata?.title} - ${expansionType}`,
          archetype: "Emergent Narrator",
          tone: contract.interpretedMeaning.emotionalState,
          totalBeats: data.beatSheet?.length || 0,
          estimatedDuration: `${(data.beatSheet?.length || 0) * 5}s`,
        },
      };

      // Update the main story state with the expanded version
      setStory(expandedStory);

      // Remove loading message
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingId));

      // Show expanded story
      addMessage(
        "system",
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <div className="flex items-center justify-between mb-4">
              
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {expansionType === "60-second"
                  ? "60s version"
                  : expansionType === "expand"
                    ? "Expanded"
                    : expansionType === "gentler"
                      ? "Gentler"
                      : "Harsher"}
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
        "generated",
      );

      // Set current step to purpose for the expanded story
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
                // Show the original story again
                setCurrentStep("story-generated");
                addMessage(
                  "system",
                  <div className="text-gray-600">
                    You can continue with the original story.
                  </div>,
                  "response",
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
                  "question",
                );
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Continue with Original
            </button>
          </div>
        </div>,
        "response",
      );

      // If expansion fails, still ask for purpose with original story
      setCurrentStep("story-purpose");
    } finally {
      setIsGenerating(false);
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
        </div>
        <p className="text-xs text-gray-500">
          Video generation converts your story into prompts for video creation.
        </p>
      </div>,
      "question",
    );

    setCurrentStep("video-option");
  };

  // Step: Generate Images
  const handleGenerateImages = async () => {
    // ... (keep existing image generation code, but it's commented out in your version)
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
      "selection",
    );

    const loadingId = addMessage(
      "system",
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
        <span>Creating video script...</span>
      </div>,
      "response",
    );

    try {
      const res = await fetch("/api/generateVideoScript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story,
          tone: story.metadata.tone,
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
        "generated",
      );
    } catch (error) {
      console.error("Video script generation error:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingId));
      addMessage(
        "system",
        <div className="text-red-600">
          Failed to generate video script. Please try again.
        </div>,
        "response",
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
      "question",
    );

    setCurrentStep("export");
  };

  const handleExportFormat = async (format: string) => {
    try {
      let data, filename, mimeType;

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

        case "pdf":
          data = "PDF export would be generated here";
          filename = `story-${Date.now()}.pdf`;
          mimeType = "application/pdf";
          break;

        case "csv":
          const csvData = [
            ["Field", "Value"],
            ["Title", story?.metadata.title || ""],
            [
              "Emotional State",
              meaningContract?.interpretedMeaning.emotionalState || "",
            ],
            [
              "Narrative Tension",
              meaningContract?.interpretedMeaning.narrativeTension || "",
            ],
            [
              "Intent",
              meaningContract?.interpretedMeaning.intentCategory || "",
            ],
            ["Core Theme", meaningContract?.interpretedMeaning.coreTheme || ""],
            ["Generated Images", Object.keys(generatedImages).length],
            ["Brand Name", brandName || "None"],
            ["Brand Colors", brandGuide?.palette?.join("; ") || "None"],
            ["Created", new Date().toISOString()],
          ]
            .map((row) => row.join(","))
            .join("\n");
          data = csvData;
          filename = `story-data-${Date.now()}.csv`;
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
        "selection",
      );

      await simulateTyping(800);

      addMessage(
        "system",
        <div className="text-green-600">
          ✓ Package exported successfully as {format.toUpperCase()}!
        </div>,
        "response",
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
              setBrandName("");
              setBrandGuide(null);
              setStory(null);
              setVideoScript(null);
              setGeneratedImages({});
              setXOInterpretation(null);
              setMeaningContract(null);
              setClarification(null);
              setUnderstandingPreview("");
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
        "question",
      );

      setCurrentStep("complete");
    } catch (error) {
      console.error("Export error:", error);
      addMessage(
        "system",
        <div className="text-red-600">Failed to export. Please try again.</div>,
        "response",
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
                I'll generate a story based on your rewrite, even if I'm not completely sure.
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
                      setOriginalUserInput(userInput);
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

    // Removed "understanding-preview" case since we're triggering story generation directly

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
                      "response",
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
                        "response",
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
        <div className="p-4 ">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
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
                  "response",
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
            <button
              onClick={handleGenerateImages}
              disabled={isGenerating}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-3 text-lg font-medium"
            >
              <ImageIcon size={24} />
              {isGenerating ? "Generating..." : "Generate All Images"}
            </button>
            <p className="text-sm text-gray-500 text-center">
              Creates visuals for all {story?.beatSheet.length || "story"} scenes
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
      <div className="mx-16">
        <div className="h-screen  bg-[#FAF9F6] flex flex-col">
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
