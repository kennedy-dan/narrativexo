import React from 'react';

export default function BrandAssetsPanel({ onParsed }:{ onParsed:(r:any)=>void }){
  const [result,setResult] = React.useState<any>(null);
  const [busy,setBusy] = React.useState(false);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files?.[0];
    if(!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/parseBrandGuide', { method:'POST', body: fd });
    const data = await res.json();
    setResult(data);
    try { onParsed && onParsed(data); } catch {}
    setBusy(false);
  }

  return (
    <div className='p-4 rounded-xl border'>
      <div className='font-medium'>Brand Assets (Optional)</div>
      <p className='text-sm text-gray-600'>Upload a PDF/JPG/PNG brand guide to extract palette & fonts.</p>
      <input type='file' accept='.pdf,.png,.jpg,.jpeg' onChange={onUpload} className='mt-2' />
      {busy && <div className='text-sm mt-2'>Processing…</div>}
      {result && (
        <div className='mt-3 text-sm'>
          <div><span className='font-medium'>Palette:</span> {result.palette?.join(', ')}</div>
          <div><span className='font-medium'>Fonts:</span> {result.fonts?.join(', ')}</div>
          <div><span className='font-medium'>Brand Safe:</span> {String(result.brandSafe)}</div>
        </div>
      )}
    </div>
  );
}
