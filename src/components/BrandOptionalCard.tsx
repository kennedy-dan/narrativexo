export default function BrandOptionalCard({ onAdd }:{ onAdd:()=>void }){
  return (
    <div className="p-4 rounded-xl border">
      <div className="font-medium">Add a brand to personalize? (optional)</div>
      <p className="text-sm text-gray-600">Unlock brand tone, palette, and compliance presets.</p>
      <button onClick={onAdd} className="mt-2 px-3 py-2 rounded bg-black text-white">Add Brand</button>
    </div>
  );
}