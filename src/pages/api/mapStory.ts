import type { NextApiRequest, NextApiResponse } from 'next';
// import { mapToNarrative } from '@/lib/mapping';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { emotion, scene, audience, market = 'ng', brand } = req.body || {};
  // const mapped = mapToNarrative({ emotion, scene, audience, market, brand });
  // res.status(200).json(mapped);
}
