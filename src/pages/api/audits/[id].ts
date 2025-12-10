import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const DIR = '/tmp/xo_audits';

export default function handler(req: NextApiRequest, res: NextApiResponse){
  const { id } = req.query as { id: string };
  const file = path.join(DIR, id + '.json');
  if(req.method === 'GET'){
    if(!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return res.status(200).json(data);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
