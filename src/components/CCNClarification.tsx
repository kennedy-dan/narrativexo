import React, { useState } from 'react';
import { Brain, HelpCircle, ChevronRight, Sparkles, X } from 'lucide-react';
import { ClarificationQuestion } from '@/types';

interface CCNClarifierProps {
  questions: ClarificationQuestion[];
  onClarify: (answers: { [key: string]: string }) => void;
  onSkip?: () => void;
  isLoading?: boolean;
}

export default function CCNClarifier({ 
  questions, 
  onClarify, 
  onSkip, 
  isLoading = false 
}: CCNClarifierProps) {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];

  const handleSelect = (option: string) => {
    const newAnswers = {
      ...answers,
      [currentQuestion.field]: option
    };
    
    setAnswers(newAnswers);
    
    // Move to next question or submit
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 300);
    } else {
      // All questions answered
      onClarify(newAnswers);
    }
  };

  const getFieldLabel = (field: string) => {
    switch(field) {
      case 'need': return 'Motivational Need';
      case 'archetype': return 'Story Archetype';
      case 'tone': return 'Narrative Tone';
      case 'context': return 'Story Context';
      default: return field;
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
          <Brain size={24} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900">Story Clarification</h3>
          <p className="text-sm text-gray-600">
            Let's clarify a few details to craft your perfect story
          </p>
        </div>
        {onSkip && (
          <button
            onClick={onSkip}
            className="ml-auto p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
          <p className="text-gray-600">Analyzing your input...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-blue-600 font-medium">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-gray-500">
                {getFieldLabel(currentQuestion.field)}
              </span>
            </div>
            <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Current Question */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="text-purple-500 mt-1 flex-shrink-0" size={20} />
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {currentQuestion.question}
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  This will help us tailor the story to your vision
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(option)}
                  className={`
                    w-full p-4 text-left rounded-xl border-2 transition-all duration-200
                    ${answers[currentQuestion.field] === option
                      ? 'border-purple-500 bg-purple-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{option}</span>
                    {answers[currentQuestion.field] === option && (
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <ChevronRight size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* All questions answered - Submit button */}
          {Object.keys(answers).length === questions.length && (
            <div className="pt-4 border-t border-blue-200">
              <button
                onClick={() => onClarify(answers)}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
              >
                <Sparkles size={20} />
                Perfect! Generate My Story
              </button>
              <p className="text-center text-sm text-gray-500 mt-2">
                Based on {Object.keys(answers).length} clarifications
              </p>
            </div>
          )}

          {/* Navigation for answered questions */}
          {questions.length > 1 && (
            <div className="flex justify-between pt-4 border-t border-blue-200">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                ← Previous
              </button>
              <div className="flex gap-2">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-2 h-2 rounded-full ${
                      idx === currentQuestionIndex
                        ? 'bg-purple-500'
                        : answers[questions[idx].field]
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                    title={`Question ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentQuestionIndex === questions.length - 1}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}