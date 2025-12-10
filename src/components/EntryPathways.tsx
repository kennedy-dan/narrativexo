export default function EntryPathways({ onPick }:{ onPick:(p:{type:string,value:string})=>void }){
  const cards = [
    { type:"emotion", value:"Inspiring", label:"Emotion‑First" },
    { type:"audience", value:"Urban Professionals", label:"Audience‑First" },
    { type:"scene", value:"Lagos Café", label:"Scene‑First" },
    { type:"seed", value:"I overheard two people at a Lagos café…", label:"Story Seed" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map(c=> (
        <button key={c.label} onClick={()=>onPick(c)} className="p-4 rounded-xl border">
          <div className="text-sm text-gray-500">{c.label}</div>
          <div className="mt-1 font-medium">{c.value}</div>
        </button>
      ))}
    </div>
  );
}