export function hexToRgb(hex:string){
  const m = hex.replace('#','');
  const bigint = parseInt(m.length===3 ? m.split('').map(c=>c+c).join('') : m, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return {r,g,b};
}
export function relativeLuminance(hex:string){
  const {r,g,b} = hexToRgb(hex);
  const srgb = [r,g,b].map(v=> v/255).map(c=> c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4));
  return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
}
export function contrastRatio(fg:string, bg:string){
  const L1 = relativeLuminance(fg);
  const L2 = relativeLuminance(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}
export function wcagAAPass(ratio:number, fontSizePx:number){
  // AA: 4.5 for normal text, 3.0 for large (>=24px normal or >=18.66px bold)
  const large = fontSizePx >= 24;
  return ratio >= (large ? 3.0 : 4.5);
}
