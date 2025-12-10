import { TonePack, NarrativeMap } from "@/types";
import ng from "@/data/toneData/ng.json";
import uk from "@/data/toneData/uk.json";

const packs: Record<string, TonePack> = { ng: ng as unknown as TonePack, uk: uk as unknown as TonePack };

export function mapToNarrative({ emotion, scene, audience, market, brand }:{emotion:string;scene?:string;audience?:string;market:string;brand?:any;}): NarrativeMap {
  const pack = packs[market] || packs.ng;
  const rule = pack.emotionMap[emotion] || pack.emotionMap["Inspiring"];
  return {
    need: rule.need,
    archetype: rule.archetype,
    tone: rule.tone,
    locale: market,
    brandApplied: Boolean(brand),
    promptFragments: pack.fragments[rule.tone] || []
  };
}
