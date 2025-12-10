export default function ModeSelector({ value, onChange }:{value:string;onChange:(v:string)=>void}){
  const modes = ["Creator","Agency","Brand"];
  return (
    <div className="flex gap-2">
      {modes.map(m=> (
        <button key={m} onClick={()=>onChange(m)} className={`px-3 py-2 rounded ${value===m?"bg-black text-white":"bg-gray-100"}`}>{m}</button>
      ))}
    </div>
  );
}