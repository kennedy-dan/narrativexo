import { OpenAI } from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';
import { dedupPalette } from '@/lib/color-utils';
import multer from 'multer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface BrandGuideResponse {
  palette: string[];
  fonts: string[];
  brandSafe: boolean;
}

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
});

// Disable body parsing, multer will handle it
export const config = {
  api: {
    bodyParser: false,
  },
};

// Promisify multer
const multerUpload = (req: any, res: any) => {
  return new Promise((resolve, reject) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) reject(err);
      else resolve(req.file);
    });
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use multer to parse the form data
    const file = await multerUpload(req, res);
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Type assertion for file
    const uploadedFile = file as Express.Multer.File;

    // Validate file type
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validMimeTypes.includes(uploadedFile.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Please upload PDF, JPG, or PNG.' });
    }

    // Convert file buffer to base64
    const base64 = uploadedFile.buffer.toString('base64');

    const prompt = `
Analyze this brand guide and extract:
1. Color palette (hex codes) - return as array of strings like ["#FFFFFF", "#000000"]
2. Font names - return as array of strings
3. Overall brand safety level (true/false) - true if appropriate for all audiences

Return as JSON with this exact structure: { palette: string[], fonts: string[], brandSafe: boolean }
Focus only on colors and fonts, ignore logos.
If you cannot identify colors, return empty array [] for palette.
If you cannot identify fonts, return empty array [] for fonts.
For brandSafe, return true unless you identify explicit adult content.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${uploadedFile.mimetype};base64,${base64}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0].message.content;
    
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    let brandData: BrandGuideResponse;
    try {
      brandData = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseContent);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Ensure all required fields exist with default values
    brandData = {
      palette: Array.isArray(brandData.palette) ? brandData.palette : [],
      fonts: Array.isArray(brandData.fonts) ? brandData.fonts : [],
      brandSafe: typeof brandData.brandSafe === 'boolean' ? brandData.brandSafe : true,
    };

    console.log('Processed brand data:', brandData);
    
    // Apply palette deduplication only if palette exists and has items
    if (brandData.palette && brandData.palette.length > 0) {
      try {
        brandData.palette = dedupPalette(brandData.palette, 2.5);
      } catch (dedupError) {
        console.error('Palette deduplication failed:', dedupError);
        // Keep original palette if deduplication fails
      }
    }

    res.status(200).json({
      success: true,
      ...brandData
    });

  } catch (error: any) {
    console.error('Brand guide parsing error:', error);
    
    // Return a valid response structure even on error
    res.status(500).json({ 
      success: false,
      error: 'Failed to parse brand guide',
      palette: [],
      fonts: [],
      brandSafe: true 
    });
  }
}