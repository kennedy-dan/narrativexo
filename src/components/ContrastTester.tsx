import React from 'react';
import { checkWCAGPalette } from '@/lib/compliance';

export default function ContrastTester({ palette }:{ palette?: string[] }){
  if(!palette || palette.length===0) return null;
  const res = checkWCAGPalette(palette);
  return (
    <div className='p-4 rounded-xl border mt-3'>
      <div className='font-medium'>Contrast Check (AA)</div>
      <div className='text-sm text-gray-600'>At least one foreground on black/white should pass AA (normal or large text).</div>
      <div className='grid grid-cols-2 gap-2 mt-2'>
        {res.samples.map(s=> (
          <div key={s.fg+s.bg} className='p-2 rounded border'>
            <div className='flex items-center gap-2'>
              <div className='w-5 h-5 rounded border' style={{background:s.fg}}/>
              <div className='text-xs'>{s.fg} on {s.bg}</div>
            </div>
            <div className='text-xs mt-1'>Ratio: {s.ratio} • Normal: {s.passNormal ? 'Pass' : 'Fail'} • Large: {s.passLarge ? 'Pass' : 'Fail'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
