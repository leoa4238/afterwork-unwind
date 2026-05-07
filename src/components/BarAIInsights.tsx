import { useEffect, useState } from "react";
import { Sparkles, Loader2, GlassWater, Utensils, Tag, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { sampleBars, type Bar } from "@/data/mockData";

interface Insight {
  why_today: string;
  signature_drinks: { name: string; desc: string }[];
  pairings: string[];
  vibe_tags: string[];
  similar_bars: { bar_id: string; reason: string }[];
}

const BarAIInsights = ({ bar }: { bar: Bar }) => {
  const [data, setData] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    supabase.functions
      .invoke("ai-bar-detail", { body: { bar, allBars: sampleBars } })
      .then(({ data: d, error: e }) => {
        if (cancelled) return;
        if (e || (d as any)?.error) {
          setError((d as any)?.error || e?.message || "AI 인사이트 로드 실패");
        } else {
          setData(d as Insight);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [bar.id]);

  if (loading) {
    return (
      <div className="bg-gradient-card rounded-xl p-4 border border-primary/20 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        AI 소믈리에가 이 바를 분석 중…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-muted/40 rounded-xl p-4 border border-border text-xs text-muted-foreground">
        {error || "AI 인사이트를 불러오지 못했습니다."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Why today */}
      <div className="bg-gradient-to-br from-primary/15 via-background to-background rounded-xl p-4 border border-primary/30">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold tracking-wide uppercase text-primary">AI 소믈리에 추천</span>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed font-medium">
          “{data.why_today}”
        </p>
        {data.vibe_tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {data.vibe_tags.map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Signature drinks */}
      <div className="bg-gradient-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <GlassWater className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">시그니처 추천</span>
        </div>
        <div className="space-y-2">
          {data.signature_drinks.map((d, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-primary font-bold shrink-0">0{i + 1}</span>
              <div>
                <p className="text-sm text-foreground font-medium">{d.name}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pairings */}
      <div className="bg-gradient-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Utensils className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">어울리는 페어링</span>
        </div>
        <ul className="space-y-1">
          {data.pairings.map((p, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
              <Tag className="w-3 h-3 text-primary mt-0.5 shrink-0" />
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* Similar bars */}
      {data.similar_bars?.length > 0 && (
        <div className="bg-gradient-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">비슷한 분위기의 바</span>
          </div>
          <div className="space-y-2">
            {data.similar_bars.map((s) => {
              const b = sampleBars.find((x) => x.id === s.bar_id);
              if (!b) return null;
              return (
                <Link
                  key={s.bar_id}
                  to={`/bar/${b.id}`}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/40 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium">{b.name}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{s.reason}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BarAIInsights;
