// lib/xo-interpretation.ts
/**
 * XO INTERPRETATION ENGINE v1.0
 * Strict no-invention interpretation of user input
 */

export interface XOInterpretation {
  // Core extracted elements (directly from input)
  extractedNouns: string[];
  extractedVerbs: string[];
  extractedLocations: string[];
  extractedPeople: string[];
  coreMoment: string; // The exact seed moment (cleaned but not invented)
  
  // Interpreted elements (with confidence scores)
  emotionalState: 'positive' | 'neutral' | 'negative' | 'ambiguous';
  emotionalConfidence: number;
  
  narrativeTension: 'high' | 'medium' | 'low' | 'ambiguous';
  tensionConfidence: number;
  
  intentCategory: 'share' | 'ask' | 'explore' | 'ambiguous';
  intentConfidence: number;
  
  // Market context
  marketIndicators: Array<{
    market: string;
    confidence: number;
    evidence: string[];
  }>;
  
  // Risk assessment
  distortionLikelihood: number; // 0-1, how likely we are to distort meaning
  safeToNarrate: boolean;
  
  // Full meaning contract
  meaningContract: {
    interpretedMeaning: {
      emotionalState: string;
      emotionalDirection: string;
      narrativeTension: string;
      intentCategory: string;
      coreTheme: string;
    };
    marketContext: {
      market: string;
      language: string;
      register: string;
    };
    entryPath: string;
    confidence: number;
    certaintyMode: 'tentative-commit' | 'high-commit';
    reversible: boolean;
    safeToNarrate: boolean;
    provenance: {
      source: 'ccn-interpretation';
      riskLevel: 'low' | 'medium' | 'high';
      distortionLikelihood: number;
      risksAcknowledged: string[];
    };
    seedMoment: string; // EXACTLY from input, no invention
  };
}

export class XOInterpretationEngine {
  /**
   * Interpret user input with STRICT no-invention policy
   */
  static interpret(input: string): XOInterpretation {
    console.log('[XO Interpretation] Starting strict interpretation');
    
    // Step 1: Extract EXACT elements from input (NO INVENTION)
    const extracted = this.extractExactElements(input);
    
    // Step 2: Determine market from explicit mentions ONLY
    const marketIndicators = this.detectMarketFromExplicitMentions(input, extracted);
    
    // Step 3: Minimal emotional interpretation (only if explicit)
    const emotional = this.interpretEmotionMinimally(input, extracted);
    
    // Step 4: Determine entry path from explicit structure
    const entryPath = this.determineEntryPath(input, extracted);
    
    // Step 5: Build meaning contract with ZERO invention
    const meaningContract = this.buildMeaningContract(input, extracted, marketIndicators, emotional, entryPath);
    
    // Step 6: Assess risk (distortion likelihood)
    const distortionLikelihood = this.calculateDistortionLikelihood(extracted, marketIndicators);
    
    return {
      extractedNouns: extracted.nouns,
      extractedVerbs: extracted.verbs,
      extractedLocations: extracted.locations,
      extractedPeople: extracted.people,
      coreMoment: extracted.coreMoment,
      
      emotionalState: emotional.state,
      emotionalConfidence: emotional.confidence,
      
      narrativeTension: emotional.tension,
      tensionConfidence: emotional.tensionConfidence,
      
      intentCategory: emotional.intent,
      intentConfidence: emotional.intentConfidence,
      
      marketIndicators,
      
      distortionLikelihood,
      safeToNarrate: distortionLikelihood < 0.5,
      
      meaningContract
    };
  }
  
  /**
   * Extract exact elements from input - NO INVENTION ALLOWED
   */
  private static extractExactElements(input: string): {
    nouns: string[];
    verbs: string[];
    locations: string[];
    people: string[];
    coreMoment: string;
  } {
    // Clean input but preserve meaning
    const cleanInput = input.trim().replace(/\s+/g, ' ');
    
    // Extract potential nouns (simple heuristic - words longer than 3 chars)
    const words = cleanInput.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    
    // Common stop words to exclude
    const stopWordsArray = [
      'about', 'above', 'across', 'after', 'afterwards', 'again', 'against', 
      'all', 'almost', 'alone', 'along', 'already', 'also', 'although', 'always',
      'am', 'among', 'amongst', 'amoungst', 'amount', 'an', 'and', 'another',
      'any', 'anyhow', 'anyone', 'anything', 'anyway', 'anywhere', 'are',
      'around', 'as', 'at', 'back', 'be', 'became', 'because', 'become',
      'becomes', 'becoming', 'been', 'before', 'beforehand', 'behind', 'being',
      'below', 'beside', 'besides', 'between', 'beyond', 'bill', 'both',
      'bottom', 'but', 'by', 'call', 'can', 'cannot', 'cant', 'co', 'computer',
      'con', 'could', 'couldnt', 'cry', 'de', 'describe', 'detail', 'do',
      'done', 'down', 'due', 'during', 'each', 'eg', 'eight', 'either', 'eleven',
      'else', 'elsewhere', 'empty', 'enough', 'etc', 'even', 'ever', 'every',
      'everyone', 'everything', 'everywhere', 'except', 'few', 'fifteen', 'fify',
      'fill', 'find', 'fire', 'first', 'five', 'for', 'former', 'formerly',
      'forty', 'found', 'four', 'from', 'front', 'full', 'further', 'get',
      'give', 'go', 'had', 'has', 'hasnt', 'have', 'he', 'hence', 'her',
      'here', 'hereafter', 'hereby', 'herein', 'hereupon', 'hers', 'herself',
      'him', 'himself', 'his', 'how', 'however', 'hundred', 'i', 'ie', 'if',
      'in', 'inc', 'indeed', 'interest', 'into', 'is', 'it', 'its', 'itself',
      'keep', 'last', 'latter', 'latterly', 'least', 'less', 'ltd', 'made',
      'many', 'may', 'me', 'meanwhile', 'might', 'mill', 'mine', 'more',
      'moreover', 'most', 'mostly', 'move', 'much', 'must', 'my', 'myself',
      'name', 'namely', 'neither', 'never', 'nevertheless', 'next', 'nine',
      'no', 'nobody', 'none', 'noone', 'nor', 'not', 'nothing', 'now',
      'nowhere', 'of', 'off', 'often', 'on', 'once', 'one', 'only', 'onto',
      'or', 'other', 'others', 'otherwise', 'our', 'ours', 'ourselves', 'out',
      'over', 'own', 'part', 'per', 'perhaps', 'please', 'put', 'rather',
      're', 'same', 'see', 'seem', 'seemed', 'seeming', 'seems', 'serious',
      'several', 'she', 'should', 'show', 'side', 'since', 'sincere', 'six',
      'sixty', 'so', 'some', 'somehow', 'someone', 'something', 'sometime',
      'sometimes', 'somewhere', 'still', 'such', 'system', 'take', 'ten',
      'than', 'that', 'the', 'their', 'them', 'themselves', 'then', 'thence',
      'there', 'thereafter', 'thereby', 'therefore', 'therein', 'thereupon',
      'these', 'they', 'thick', 'thin', 'third', 'this', 'those', 'though',
      'three', 'through', 'throughout', 'thru', 'thus', 'to', 'together',
      'too', 'top', 'toward', 'towards', 'twelve', 'twenty', 'two', 'un',
      'under', 'until', 'up', 'upon', 'us', 'very', 'via', 'was', 'we',
      'well', 'were', 'what', 'whatever', 'when', 'whence', 'whenever',
      'where', 'whereafter', 'whereas', 'whereby', 'wherein', 'whereupon',
      'wherever', 'whether', 'which', 'while', 'whither', 'who', 'whoever',
      'whole', 'whom', 'whose', 'why', 'will', 'with', 'within', 'without',
      'would', 'yet', 'you', 'your', 'yours', 'yourself', 'yourselves'
    ];
    const stopWords = new Set(stopWordsArray);
    
    // Extract nouns (words not in stop words) - FIXED: Use Array.from instead of spread
    const nounCandidates = words.filter(w => !stopWords.has(w) && w.length > 2);
    const nouns = Array.from(new Set(nounCandidates));
    
    // Extract verbs (common action words)
    const verbIndicators = new Set(['starting', 'talking', 'going', 'creating', 'building', 'making']);
    const verbCandidates = words.filter(w => verbIndicators.has(w) || w.endsWith('ing'));
    const verbs = Array.from(new Set(verbCandidates));
    
    // Extract locations (if explicitly mentioned)
    const locationCandidates: string[] = [];
    const locationPatterns = [
      /\b(in|at|from|to)\s+([a-zA-Z\s]+?)(?:,|\s+|$)/gi,
      /\b([a-zA-Z\s]+?)\s+(city|town|village|country|lagos|abuja|nairobi|accra)\b/gi
    ];
    
    locationPatterns.forEach(pattern => {
      // Use exec in a loop instead of matchAll
      const regex = new RegExp(pattern.source, pattern.flags + 'g');
      let match;
      while ((match = regex.exec(input)) !== null) {
        const potentialLocation = match[2] || match[1];
        if (potentialLocation && potentialLocation.length > 2) {
          locationCandidates.push(potentialLocation.trim());
        }
      }
    });
    const locations = Array.from(new Set(locationCandidates));
    
    // Extract people (if explicitly mentioned)
    const peopleCandidates: string[] = [];
    const peoplePatterns = [
      /\b(someone|somebody|a\s+man|a\s+woman|a\s+person|people)\b/gi,
      /\b([A-Z][a-z]+)\s+(said|talking|speaking)\b/g
    ];
    
    peoplePatterns.forEach(pattern => {
      // Use exec in a loop instead of matchAll
      const regex = new RegExp(pattern.source, pattern.flags + 'g');
      let match;
      while ((match = regex.exec(input)) !== null) {
        if (match[0]) {
          peopleCandidates.push(match[0].toLowerCase());
        }
      }
    });
    const people = Array.from(new Set(peopleCandidates));
    
    // Core moment is the input itself, minimally cleaned
    const coreMoment = cleanInput;
    
    return {
      nouns,
      verbs,
      locations,
      people,
      coreMoment
    };
  }
  
  /**
   * Detect market ONLY from explicit mentions
   */
  private static detectMarketFromExplicitMentions(
    input: string, 
    extracted: ReturnType<typeof this.extractExactElements>
  ): Array<{ market: string; confidence: number; evidence: string[] }> {
    const indicators: Array<{ market: string; confidence: number; evidence: string[] }> = [];
    
    const lowerInput = input.toLowerCase();
    
    // Market detection patterns - ONLY explicit mentions
    const marketPatterns: Record<string, RegExp[]> = {
      'NG': [/\blagos\b/i, /\bnigeria\b/i, /\babuja\b/i],
      'GH': [/\baccra\b/i, /\bkumasi\b/i, /\bghana\b/i],
      'KE': [/\bnairobi\b/i, /\bmombasa\b/i, /\bkenya\b/i],
      'ZA': [/\bjohannesburg\b/i, /\bcape\s+town\b/i, /\bsouth\s+africa\b/i],
      'UK': [/\blondon\b/i, /\bmanchester\b/i, /\buk\b/i, /\bunited\s+kingdom\b/i],
      'US': [/\bnew\s+york\b/i, /\bla\b/i, /\bchicago\b/i, /\bus\b/i, /\busa\b/i]
    };
    
    Object.entries(marketPatterns).forEach(([market, patterns]) => {
      const evidence: string[] = [];
      
      patterns.forEach(pattern => {
        const match = lowerInput.match(pattern);
        if (match) {
          evidence.push(match[0]);
        }
      });
      
      if (evidence.length > 0) {
        // Confidence based on number of evidence pieces
        const confidence = Math.min(0.5 + (evidence.length * 0.15), 0.95);
        
        indicators.push({
          market,
          confidence,
          evidence
        });
      }
    });
    
    // If no explicit markets found, return GLOBAL with low confidence
    if (indicators.length === 0) {
      indicators.push({
        market: 'GLOBAL',
        confidence: 0.3,
        evidence: ['no explicit market mentioned']
      });
    }
    
    return indicators;
  }
  
  /**
   * Minimal emotional interpretation - only if explicit
   */
  private static interpretEmotionMinimally(
    input: string,
    extracted: ReturnType<typeof this.extractExactElements>
  ): {
    state: 'positive' | 'neutral' | 'negative' | 'ambiguous';
    confidence: number;
    tension: 'high' | 'medium' | 'low' | 'ambiguous';
    tensionConfidence: number;
    intent: 'share' | 'ask' | 'explore' | 'ambiguous';
    intentConfidence: number;
  } {
    const lowerInput = input.toLowerCase();
    
    // Check for explicit emotional words
    const positiveWords = ['happy', 'excited', 'good', 'great', 'love', 'wonderful'];
    const negativeWords = ['sad', 'angry', 'bad', 'terrible', 'hate', 'awful'];
    const tensionWords = ['conflict', 'problem', 'issue', 'challenge', 'struggle', 'tension'];
    const questionWords = ['?', 'what', 'how', 'why', 'when', 'where', 'who'];
    
    let emotionalState: 'positive' | 'neutral' | 'negative' | 'ambiguous' = 'neutral';
    let emotionalConfidence = 0.5;
    let tensionState: 'high' | 'medium' | 'low' | 'ambiguous' = 'low';
    let tensionConfidence = 0.3;
    let intent: 'share' | 'ask' | 'explore' | 'ambiguous' = 'share';
    let intentConfidence = 0.5;
    
    // Check for explicit emotional words
    positiveWords.forEach(word => {
      if (lowerInput.includes(word)) {
        emotionalState = 'positive';
        emotionalConfidence = 0.7;
      }
    });
    
    negativeWords.forEach(word => {
      if (lowerInput.includes(word)) {
        emotionalState = 'negative';
        emotionalConfidence = 0.7;
      }
    });
    
    // Check for tension indicators
    tensionWords.forEach(word => {
      if (lowerInput.includes(word)) {
        tensionState = 'high';
        tensionConfidence = 0.7;
      }
    });
    
    // Check if it's a question
    questionWords.forEach(word => {
      if (lowerInput.includes(word) || lowerInput.includes('?')) {
        intent = 'ask';
        intentConfidence = 0.8;
      }
    });
    
    // If input is narrative in nature
    if (lowerInput.includes('talking about') || lowerInput.includes('story about')) {
      intent = 'share';
      intentConfidence = 0.7;
    }
    
    return {
      state: emotionalState,
      confidence: emotionalConfidence,
      tension: tensionState,
      tensionConfidence,
      intent,
      intentConfidence
    };
  }
  
  /**
   * Determine entry path from input structure
   */
  private static determineEntryPath(
    input: string,
    extracted: ReturnType<typeof this.extractExactElements>
  ): string {
    const lowerInput = input.toLowerCase();
    
    // Explicit path indicators
    if (lowerInput.includes('feel') || lowerInput.includes('emotion')) {
      return 'emotion';
    }
    
    if (lowerInput.includes('scene') || lowerInput.includes('place') || extracted.locations.length > 0) {
      return 'scene';
    }
    
    if (lowerInput.includes('someone') || lowerInput.includes('person') || extracted.people.length > 0) {
      return 'audience';
    }
    
    // Default to seed for narrative inputs
    if (lowerInput.includes('talking about') || lowerInput.includes('story')) {
      return 'seed';
    }
    
    return 'seed';
  }
  
  /**
   * Build meaning contract with ZERO invention
   */
  private static buildMeaningContract(
    input: string,
    extracted: ReturnType<typeof this.extractExactElements>,
    marketIndicators: Array<{ market: string; confidence: number; evidence: string[] }>,
    emotional: ReturnType<typeof this.interpretEmotionMinimally>,
    entryPath: string
  ): XOInterpretation['meaningContract'] {
    
    // Pick the highest confidence market
    const primaryMarket = marketIndicators.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    , { market: 'GLOBAL', confidence: 0.3, evidence: [] });
    
    // Determine risk level - FIXED TYPE COMPARISON
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    
    if (primaryMarket.confidence < 0.5 || emotional.confidence < 0.5) {
      riskLevel = 'medium';
    }
    
    if (primaryMarket.confidence < 0.3 || emotional.confidence < 0.3) {
      riskLevel = 'high';
    }
    
    // Map tension to narrative tension description - FIXED TYPE CHECK
    let narrativeTension = 'seems like observation';
    if (emotional.tension === 'high') {
      narrativeTension = 'seems like push/pull';
    } else if (emotional.tension === 'medium') {
      narrativeTension = 'moderate tension';
    }
    
    // Build with EXACT seed moment from input (NO INVENTION)
    const seedMoment = input; // Use the exact input, not a transformed version
    
    return {
      interpretedMeaning: {
        emotionalState: emotional.state,
        emotionalDirection: 'relational', // Default safe value
        narrativeTension,
        intentCategory: emotional.intent,
        coreTheme: 'human experience' // Default safe theme
      },
      marketContext: {
        market: primaryMarket.market,
        language: 'english',
        register: 'formal'
      },
      entryPath,
      confidence: primaryMarket.confidence * emotional.confidence,
      certaintyMode: primaryMarket.confidence > 0.7 && emotional.confidence > 0.7 ? 'high-commit' : 'tentative-commit',
      reversible: true,
      safeToNarrate: riskLevel !== 'high',
      provenance: {
        source: 'ccn-interpretation',
        riskLevel,
        distortionLikelihood: this.calculateDistortionLikelihood(extracted, marketIndicators),
        risksAcknowledged: []
      },
      seedMoment // EXACT input, no transformation
    };
  }
  
  /**
   * Calculate how likely we are to distort meaning
   */
  private static calculateDistortionLikelihood(
    extracted: ReturnType<typeof this.extractExactElements>,
    marketIndicators: Array<{ market: string; confidence: number; evidence: string[] }>
  ): number {
    let likelihood = 0.2; // Base distortion
    
    // More nouns = clearer picture = less distortion
    if (extracted.nouns.length > 5) {
      likelihood -= 0.1;
    } else if (extracted.nouns.length < 3) {
      likelihood += 0.2;
    }
    
    // Clear market evidence reduces distortion
    const hasGoodMarket = marketIndicators.some(m => m.confidence > 0.7 && m.evidence.length > 0);
    if (hasGoodMarket) {
      likelihood -= 0.1;
    } else {
      likelihood += 0.1;
    }
    
    // Clamp between 0.1 and 0.8
    return Math.max(0.1, Math.min(0.8, likelihood));
  }
}

export default XOInterpretationEngine;