import { lexiconScore } from "./lexicon";

export function calcConfidence({ text = "", scene, audience }:{text?:string;scene?:string;audience?:string;}){
  const s1 = lexiconScore(text);            // 0..1
  const s2 = text.length > 40 ? 0.15 : 0.05; // density proxy
  const s3 = /quit|fear|hope|dream/i.test(text) ? 0.2 : 0.05; // semantic hints
  const polarityNearNeutral = /\?$/.test(text); // toy ambiguity flag
  const confidence = Math.min(1, s1 + s2 + s3);
  return { confidence, signals: { ambiguous: polarityNearNeutral, s1, s2, s3 } };
}

// Super‑simple lexical scorer placeholder
export function lexiconScore(text:string){
  const pos = ["hope","dream","courage","believe","start","new","journey"];
  const neg = ["fear","fail","risk","quit","doubt"];
  let score = 0.1;
  const t = text.toLowerCase();
  pos.forEach(w=> { if (t.includes(w)) score += 0.1; });
  neg.forEach(w=> { if (t.includes(w)) score += 0.05; }); // uncertainty still informs confidence
  return Math.min(1, score);
}
