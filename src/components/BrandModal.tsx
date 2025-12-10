import React from 'react';
export default function BrandModal({ open, onClose, onSave }:{open:boolean; onClose:()=>void; onSave:(b:{name:string})=>void}){
  const [name,setName] = React.useState('');
  if(!open) return null;
  return (
    <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
      <div className='bg-white rounded-xl p-6 w-[420px] space-y-3'>
        <div className='text-lg font-semibold'>Add Brand (Optional)</div>
        <input className='w-full border rounded px-3 py-2' placeholder='Brand name' value={name} onChange={e=>setName(e.target.value)} />
        <div className='flex gap-2 justify-end'>
          <button onClick={onClose} className='px-3 py-2 rounded border'>Cancel</button>
          <button onClick={()=>{ onSave({name}); onClose(); }} className='px-3 py-2 rounded bg-black text-white'>Save</button>
        </div>
      </div>
    </div>
  );
}
