import type { NextApiRequest, NextApiResponse } from 'next';
import seeds from '@/data/seed/lagos_microstories.json';
export default function handler(_req: NextApiRequest, res: NextApiResponse){ res.status(200).json(seeds); }