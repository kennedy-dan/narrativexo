import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const DIR = '/tmp/xo_audits';

export default function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method === 'GET'){
    const files = fs.readdirSync(DIR).filter(f=>f.endsWith('.json')).sort().reverse().slice(0, 50);
    const items = files.map(f=> ({ id: f.replace('.json',''), file: f }));
    return res.status(200).json(items);
  }
  if(req.method === 'POST'){
    const body = req.body || {};
    const id = (body.id as string) || (Date.now().toString()+'-'+Math.random().toString(36).slice(2,8));
    const file = path.join(DIR, id + '.json');
    fs.writeFileSync(file, JSON.stringify(body, null, 2), 'utf-8');
    return res.status(200).json({ saved: true, id });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
