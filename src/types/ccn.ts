// types/ccn.ts
export interface CCNInterpretation {
  emotionalDrivers: string[];
  archetypes: string[];
  context: string;
  confidence: number;
  market: 'ng' | 'uk' | 'fr';
  suggestedTone: string;
}

export interface CCNRequest {
  pathway: 'emotion' | 'audience' | 'scene' | 'seed';
  userInput: string;
  market?: 'ng' | 'uk' | 'fr';
}

export interface CCNResponse {
  success: boolean;
  interpretation: CCNInterpretation;
  clarificationQuestions?: string[];
}