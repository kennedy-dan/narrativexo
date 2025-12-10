import type { NextApiRequest, NextApiResponse } from 'next';
export default function handler(req: NextApiRequest, res: NextApiResponse){
  const { narrative } = req.body || {};
  if(!narrative){
    return res.status(400).json({ error: 'narrative required' });
  }
  const parts = narrative?.promptFragments || ['everyday courage','Lagos café hum','quiet courage'];
  const caption = `Overheard in Lagos — ${parts[0]}, ${parts[1]} — ${parts[2]}. #NarrativesXO #EverydayCourage`;
  res.status(200).json({ caption });
}
