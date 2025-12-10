const counts: Record<string, number> = {};

export function requirePassword(req:any){
  const pass = process.env.DEMO_PASSWORD || '';
  if(!pass) return { ok: true };
  const header = req.headers['x-demo-pass'] || req.headers['X-Demo-Pass'];
  if(header !== pass) return { ok: false, status: 401, message: 'Unauthorized demo password' };
  return { ok: true };
}

export function requireToken(req:any){
  const token = (req.headers['x-demo-pass'] || req.headers['X-Demo-Pass']) as string | undefined;
  if(!token) return { ok: false, status: 401, message: 'Missing demo token' };
  return { ok: true, token };
}

export function checkQuotaForToken(token:string){
  const max = Number(process.env.MAX_GENERATES_PER_TOKEN || process.env.MAX_GENERATES || 50);
  counts[token] = (counts[token] || 0) + 1;
  if(counts[token] > max) return { ok: false, status: 429, message: 'Per-session quota exceeded' };
  return { ok: true, used: counts[token], max };
}
