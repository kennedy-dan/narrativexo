// pages/api/parseBrandGuideEnhanced.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import sharp from 'sharp';
import { extractColors } from 'colorthief';
import { dedupPalette } from '@/lib/color-utils';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit for documents
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ExtractionResult {
  palette: string[];
  fonts: string[];
  brandSafe: boolean;
  logoUrls?: string[];
  logoPositions?: Array<{x: number, y: number, width: number, height: number}>;
  brandKeywords?: string[];
  documentType: string;
  extractedText: string;
}

// Helper function to extract colors from image
async function extractColorsFromImage(buffer: Buffer): Promise<string[]> {
  try {
    const colors = await extractColors(buffer, 10);
    return colors.map(rgb => `#${rgb.map(c => c.toString(16).padStart(2, '0')).join('')}`);
  } catch (error) {
    console.error('Color extraction error:', error);
    return [];
  }
}

// Helper function to detect logos in image
async function detectLogosInImage(buffer: Buffer): Promise<{url: string, bbox: number[]}[]> {
  try {
    // Use OpenAI Vision API to detect logos
    const base64 = buffer.toString('base64');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and identify any logos or brand marks. For each logo found, provide the bounding box coordinates [x1, y1, x2, y2] where (0,0) is top-left and (1,1) is bottom-right. Also provide a brief description of each logo. Return as JSON array."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64}`,
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) return [];

    const result = JSON.parse(content);
    return result.logos || [];
  } catch (error) {
    console.error('Logo detection error:', error);
    return [];
  }
}

// Extract text from PDF
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '';
  }
}

// Extract text from DOCX
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    return '';
  }
}

// Process document with OpenAI
async function analyzeWithOpenAI(
  content: string | Buffer,
  contentType: string
): Promise<ExtractionResult> {
  try {
    let messages: any[] = [];
    
    if (contentType.startsWith('image/')) {
      // For images, use vision API
      const base64 = Buffer.isBuffer(content) 
        ? content.toString('base64') 
        : content;
      
      messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this brand document/image and extract:
1. Color palette (hex codes) - primary brand colors used
2. Font names - if visible in the image
3. Brand safety assessment (true/false) - true if appropriate for all audiences
4. Brand keywords - key brand terms, values, or slogans found
5. Document type - what type of document this is (e.g., brand guide, logo sheet, presentation)

Return as JSON with this structure: {
  palette: string[],
  fonts: string[],
  brandSafe: boolean,
  brandKeywords: string[],
  documentType: string,
  extractedText: string (if any text is visible)
}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${contentType};base64,${base64}`,
              }
            }
          ]
        }
      ];
    } else {
      // For text content
      messages = [
        {
          role: "user",
          content: `Analyze this brand document and extract:
1. Color palette (hex codes) - primary brand colors mentioned or used
2. Font names - fonts mentioned or specified
3. Brand safety assessment (true/false) - true if appropriate for all audiences
4. Brand keywords - key brand terms, values, or slogans
5. Document type - what type of document this is (e.g., brand guide, style guide, presentation)

Content:
${content}

Return as JSON with this structure: {
  palette: string[],
  fonts: string[],
  brandSafe: boolean,
  brandKeywords: string[],
  documentType: string,
  extractedText: string
}`
        }
      ];
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const result: ExtractionResult = JSON.parse(responseContent);
    
    // Ensure all required fields exist with default values
    result.palette = Array.isArray(result.palette) ? dedupPalette(result.palette, 2.5) : [];
    result.fonts = Array.isArray(result.fonts) ? result.fonts : [];
    result.brandSafe = typeof result.brandSafe === 'boolean' ? result.brandSafe : true;
    result.brandKeywords = Array.isArray(result.brandKeywords) ? result.brandKeywords : [];
    result.documentType = result.documentType || 'unknown';
    result.extractedText = result.extractedText || (typeof content === 'string' ? content : '');
    
    return result;
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    throw error;
  }
}

// Main handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Promisify multer
  const multerUpload = (req: any, res: any) => {
    return new Promise((resolve, reject) => {
      upload.single('file')(req, res, (err: any) => {
        if (err) reject(err);
        else resolve(req.file);
      });
    });
  };

  try {
    const file = await multerUpload(req, res) as Express.Multer.File;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result: ExtractionResult = {
      palette: [],
      fonts: [],
      brandSafe: true,
      logoUrls: [],
      brandKeywords: [],
      documentType: file.mimetype,
      extractedText: ''
    };

    let textContent = '';
    let imageBuffer: Buffer | null = null;

    // Process based on file type
    switch (file.mimetype) {
      case 'application/pdf':
        textContent = await extractTextFromPDF(file.buffer);
        result.extractedText = textContent;
        break;
        
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        textContent = await extractTextFromDOCX(file.buffer);
        result.extractedText = textContent;
        break;
        
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/png':
      case 'image/webp':
      case 'image/svg+xml':
        imageBuffer = file.buffer;
        
        // Extract colors directly from image
        const extractedColors = await extractColorsFromImage(file.buffer);
        result.palette = dedupPalette(extractedColors, 2.5);
        
        // Detect logos
        const logos = await detectLogosInImage(file.buffer);
        if (logos.length > 0) {
          // Convert bounding boxes to actual image crops
          const image = sharp(file.buffer);
          const metadata = await image.metadata();
          
          for (const logo of logos) {
            const [x1, y1, x2, y2] = logo.bbox;
            const width = Math.round((x2 - x1) * (metadata.width || 1024));
            const height = Math.round((y2 - y1) * (metadata.height || 1024));
            
            if (width > 50 && height > 50) { // Minimum size threshold
              try {
                const logoBuffer = await image
                  .extract({
                    left: Math.round(x1 * (metadata.width || 1024)),
                    top: Math.round(y1 * (metadata.height || 1024)),
                    width,
                    height
                  })
                  .toBuffer();
                
                const logoBase64 = logoBuffer.toString('base64');
                result.logoUrls?.push(`data:${file.mimetype};base64,${logoBase64}`);
              } catch (error) {
                console.error('Logo extraction error:', error);
              }
            }
          }
        }
        break;
    }

    // Use OpenAI for comprehensive analysis
    const openAIResult = await analyzeWithOpenAI(
      textContent || imageBuffer || file.buffer,
      file.mimetype
    );

    // Merge results
const allColors = [...result.palette, ...openAIResult.palette];
const uniqueColors = Array.from(new Set(allColors));
result.palette = uniqueColors;    result.fonts = openAIResult.fonts;
    result.brandSafe = openAIResult.brandSafe;
    result.brandKeywords = openAIResult.brandKeywords;
    result.documentType = openAIResult.documentType;
    
    if (!result.extractedText && openAIResult.extractedText) {
      result.extractedText = openAIResult.extractedText;
    }

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error: any) {
    console.error('Brand guide parsing error:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to parse brand guide',
      palette: [],
      fonts: [],
      brandSafe: true,
      logoUrls: [],
      brandKeywords: [],
      documentType: 'unknown',
      extractedText: ''
    });
  }
}