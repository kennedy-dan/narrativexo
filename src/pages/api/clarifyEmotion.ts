import type { NextApiRequest, NextApiResponse } from 'next';
import { calcConfidence } from '@/lib/confidence';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { text, scene, audience } = req.body || {};
  const { confidence, signals } = calcConfidence({ text, scene, audience });
  const options = ['Inspiring','Tense','Funny','Sad','Calm'];
  const needsClarify = confidence < 0.6 || signals?.ambiguous === true;
  res.status(200).json({ confidence, needsClarify, options, signals });
}
