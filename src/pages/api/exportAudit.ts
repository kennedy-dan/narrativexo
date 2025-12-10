import type { NextApiRequest, NextApiResponse } from 'next';
export default function handler(req: NextApiRequest, res: NextApiResponse){
  const { narrative, brand, market='ng', mode='Creator' } = req.body || {};
  if(!narrative){
    return res.status(400).json({ error: 'narrative required' });
  }
  const audit = {
    version: 'p2-revised-lite',
    timestamp: new Date().toISOString(),
    market,
    mode,
    brandApplied: !!(brand?.name),
    brand: brand?.name || null,
    narrative
  };
  res.status(200).json(audit);
}
