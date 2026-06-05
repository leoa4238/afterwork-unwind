import { supabase } from "@/integrations/supabase/client";
import type { Bar } from "@/data/mockData";

export async function fetchBars(): Promise<Bar[]> {
  const { data: bars, error } = await supabase
    .from("bars")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!bars) return [];

  const ids = bars.map((b) => b.id);
  const { data: tagRows } = await supabase
    .from("bar_tags")
    .select("bar_id, tag")
    .in("bar_id", ids);

  const tagMap: Record<string, string[]> = {};
  (tagRows ?? []).forEach((r: any) => {
    (tagMap[r.bar_id] ??= []).push(r.tag);
  });

  return bars.map((b: any) => ({
    id: b.id,
    name: b.name,
    address: b.address ?? "",
    area: b.area ?? "",
    category: b.category ?? "",
    priceRange: b.price_range ?? "₩₩",
    isOpenNow: !!b.is_open_now,
    soloFriendlyScore: b.solo_friendly_score ?? 0,
    quietScore: b.quiet_score ?? 0,
    networkingFriendly: !!b.networking_friendly,
    tags: tagMap[b.id] ?? [],
    aiSummary: b.ai_summary ?? "",
    rating: Number(b.rating ?? 0),
    reviewCount: b.review_count ?? 0,
    distance: b.distance ?? "",
    imageUrl: "",
  }));
}
