export default function CCNPrompt({ options, onSelect }:{options:string[];onSelect:(o:string)=>void}){
  return (
    <div className="p-4 rounded-xl border bg-amber-50">
      <div className="mb-2 font-medium">How did this moment feel to you?</div>
      <div className="flex flex-wrap gap-2">
        {options.map(o=> (
          <button key={o} onClick={()=>onSelect(o)} className="px-3 py-2 rounded-full border">{o}</button>
        ))}
      </div>
    </div>
  );
}