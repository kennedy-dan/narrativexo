export default function CulturalRetuneToggle({ value, onChange }:{value:boolean;onChange:(v:boolean)=>void}){
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={value} onChange={e=>onChange(e.target.checked)} />
      <span>✨ Make it feel more local</span>
    </label>
  );
}