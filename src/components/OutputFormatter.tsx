import { checkWCAG } from '@/lib/compliance';
import { exportCreatorReelWebM } from '@/lib/creatorReel';
import ContrastTester from '@/components/ContrastTester';
import React from 'react';
import type { NarrativeMap } from '@/types';

export default function OutputFormatter({ mode, narrative, brand, brandAssets }:{mode:'Creator'|'Agency'|'Brand'; narrative?: NarrativeMap; brand?: {name?:string}; brandAssets?: any}){
  if(!narrative){
    return <div className='text-gray-500'>No narrative yet. Choose a path and click Generate.</div>;
  }
  if(mode==='Creator'){
    return (
      <div className='space-y-2'>
        <h3 className='font-semibold'>Creator Output: Reel + Caption (Preview)</h3>
        <div className='text-sm text-gray-700'>
          <div><span className='font-medium'>Tone:</span> {narrative.tone}</div>
          <div><span className='font-medium'>Locale:</span> {narrative.locale}</div>
          <div className='mt-2'>
            <span className='font-medium'>Caption idea:</span> "{(narrative.promptFragments?.[0]||'everyday courage')}, {(narrative.promptFragments?.[1]||'Lagos café hum')} — {(narrative.promptFragments?.[2]||'quiet courage')}"
          </div>
        </div>
        <div className='mt-3'>
          <div className='flex gap-2'>
            <button onClick={async()=>{
              const res = await fetch('/api/generateCaption', {method:'POST',headers:{'Content-Type':'application/json'}, body: JSON.stringify({ narrative })});
              const data = await res.json();
              alert(data.caption);
            }} className='px-3 py-2 rounded bg-gray-900 text-white'>Generate Caption</button>
            <button onClick={()=>{
              const lines = [
                'Overheard in Lagos',
                `${narrative.promptFragments?.[0]||'everyday courage'}`,
                `${narrative.promptFragments?.[1]||'Lagos café hum'}`,
                `${narrative.promptFragments?.[2]||'quiet courage'}`
              ];
              exportCreatorReelWebM({ lines });
            }} className='px-3 py-2 rounded border'>Export Creator Reel (WebM)</button>
          </div>
        </div>
      </div>
    );
  }
  if(mode==='Agency'){
    return (
      <div className='space-y-2'>
        <h3 className='font-semibold'>Agency Output: Storyboard + Deck Notes (Preview)</h3>
        <ul className='list-disc ml-5 text-sm'>
          <li>Need: {narrative.need}</li>
          <li>Archetype: {narrative.archetype}</li>
          <li>Tone: {narrative.tone}</li>
          <li>Locale cues: {narrative.locale}</li>
        </ul>
        <div className='mt-3'>
          <div className='flex gap-2'>
            <button onClick={async()=>{
              const res = await fetch('/api/generateCaption', {method:'POST',headers:{'Content-Type':'application/json'}, body: JSON.stringify({ narrative })});
              const data = await res.json();
              alert(data.caption);
            }} className='px-3 py-2 rounded bg-gray-900 text-white'>Generate Caption</button>
            <button onClick={()=>{
              const lines = [
                'Overheard in Lagos',
                `${narrative.promptFragments?.[0]||'everyday courage'}`,
                `${narrative.promptFragments?.[1]||'Lagos café hum'}`,
                `${narrative.promptFragments?.[2]||'quiet courage'}`
              ];
              exportCreatorReelWebM({ lines });
            }} className='px-3 py-2 rounded border'>Export Creator Reel (WebM)</button>
          </div>
        </div>
      </div>
    );
  }
  // Brand
  const wcag = checkWCAG();
  return (
    <div className='space-y-2'>
      <h3 className='font-semibold'>Brand Output: Tone Locks + Compliance (Preview)</h3>
      <div className='text-sm'>
        <div><span className='font-medium'>Need:</span> {narrative.need}</div>
        <div><span className='font-medium'>Archetype:</span> {narrative.archetype}</div>
        <div><span className='font-medium'>Tone:</span> {narrative.tone}</div>
        <div><span className='font-medium'>Brand Applied:</span> {narrative.brandApplied? 'Yes' : 'No'}</div>
        {brand?.name && <div><span className='font-medium'>Brand:</span> {brand.name}</div>}
        {brandAssets && (
          <div className='mt-2'>
            <div className='font-medium'>Palette:</div>
            <div className='flex gap-2 mt-1'>
              {(brandAssets.palette||[]).map((hex:string)=> (
                <div key={hex} className='w-6 h-6 rounded border' style={{background:hex}} title={hex}/>
              ))}
            </div>
            <div className='mt-1'><span className='font-medium'>Fonts:</span> {(brandAssets.fonts||[]).join(', ')||'—'}</div>
          </div>
        )}
        {brandAssets && <ContrastTester palette={brandAssets.palette} />}
        <div className='mt-2'>
          <span className='font-medium'>Compliance:</span> {wcag.pass ? 'WCAG AA OK' : 'Check Issues'}
        </div>
      </div>
    </div>
  );
}
