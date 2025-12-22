// pages/api/retune.ts (NOT app/api/retune/)
import type { NextApiRequest, NextApiResponse } from 'next';

interface RetuneRequest {
  story: string;
  market: 'ng' | 'uk' | 'fr';
  targetMarket: 'ng' | 'uk' | 'fr';
}

interface RetuneResponse {
  success: boolean;
  original: string;
  retuned: string;
  changes: {
    idioms: string[];
    pacing: string;
    emotionalCues: string[];
    culturalReferences: string[];
  };
}

const retuningRules = {
  ng: {
    idioms: ['no wahala', 'chop life', 'soro soke', 'wetin dey happen'],
    pacing: 'energetic, rhythmic',
    emotionalCues: ['hustle', 'resilience', 'community', 'aspiration'],
    references: ['Lagos', 'market', 'oga', 'hustle']
  },
  uk: {
    idioms: ['sorted', 'mate', 'proper', 'gutted'],
    pacing: 'measured, conversational',
    emotionalCues: ['underdog', 'grit', 'banter', 'loyalty'],
    references: ['pub', 'matchday', 'terrace', 'working-class']
  },
  fr: {
    idioms: ['c\'est la vie', 'bof', 'tant pis', 'voilà'],
    pacing: 'elegant, deliberate',
    emotionalCues: ['élégance', 'résistance', 'humanisme', 'ironie'],
    references: ['patrimoine', 'café', 'quartier', 'art']
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Parse the request body
    const body: RetuneRequest = req.body;
    
    // Validate required fields
    if (!body.story?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Story content is required'
      });
    }

    if (!body.market || !body.targetMarket) {
      return res.status(400).json({
        success: false,
        error: 'Both market and targetMarket are required'
      });
    }

    const source = retuningRules[body.market];
    const target = retuningRules[body.targetMarket];
    
    // Simple retuning logic - in production, use NLP
    let retunedStory = body.story;
    
    // Replace idioms (simplified example)
    if (body.market !== body.targetMarket) {
      retunedStory = retunedStory.replace(/no wahala/gi, 'no problem');
      retunedStory = retunedStory.replace(/chop life/gi, 'enjoy life');
      retunedStory = retunedStory.replace(/soro soke/gi, 'speak up');
      retunedStory = retunedStory.replace(/wetin dey happen/gi, "what's happening");
    }
    
    const changes = {
      idioms: target.idioms,
      pacing: target.pacing,
      emotionalCues: target.emotionalCues,
      culturalReferences: target.references
    };

    return res.status(200).json({
      success: true,
      original: body.story,
      retuned: retunedStory,
      changes
    });
  } catch (error) {
    console.error('Retune error:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON in request body'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Retuning failed'
    });
  }
}