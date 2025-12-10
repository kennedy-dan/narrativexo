import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse){
  const pass = process.env.DEMO_PASSWORD || '';
  const header = (req.headers['x-demo-pass'] || req.headers['X-Demo-Pass']) as string | undefined;
  if(pass && header !== pass){
    return res.status(401).json({ error: 'Unauthorized demo password' });
  }
  const token = Buffer.from(`${Date.now()}::${Math.random()}`).toString('base64url');
  res.status(200).json({ token, issuedAt: Date.now() });
}
