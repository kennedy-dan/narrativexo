import { contrastRatio, wcagAAPass } from './color';

export function checkWCAGPalette(palette:string[] = []){
  const samples = [];
  const bgCandidates = ['#FFFFFF', '#000000'];
  for(const hex of palette){
    for(const bg of bgCandidates){
      const ratio = contrastRatio(hex, bg);
      const passNormal = wcagAAPass(ratio, 16);
      const passLarge = wcagAAPass(ratio, 24);
      samples.push({ fg: hex, bg, ratio: Number(ratio.toFixed(2)), passNormal, passLarge });
    }
  }
  const pass = samples.some(s=> s.passNormal || s.passLarge);
  return { pass, samples };
}

// Legacy stub for compatibility
export function checkWCAG(){ return { pass: true, issues: [] }; }
