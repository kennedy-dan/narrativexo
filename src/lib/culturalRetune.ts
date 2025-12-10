import type { NarrativeMap } from "@/types";

export function applyCulturalRetune(n: NarrativeMap, opts:{localize:boolean}){
  if(!opts.localize) return n;
  return { ...n, tone: `${n.tone}-localized` };
}
