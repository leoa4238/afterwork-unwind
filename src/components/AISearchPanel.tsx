import { useState } from "react";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type Bar } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { buildLocalBarRecommendations } from "@/lib/localAi";

interface Recommendation {
  bar_id: string;
  match_score: number;
  reason: string;
}

interface AIResult {
  intent_summary: string;
  recommendations: Recommendation[];
}

interface AISearchPanelProps {
  bars: Bar[];
  onApply?: (matches: Record<string, { score: number; reason: string; rank: number }>) => void;
}

const EXAMPLE_QUERIES = [
  "오늘 혼자 조용히 위스키 한잔",
  "퇴근하고 동료랑 가볍게 하이볼",
  "여의도에서 야경 보면서 혼술",
];

const AISearchPanel = ({ bars, onApply }: AISearchPanelProps) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);

  const applyResult = (nextResult: AIResult) => {
    setResult(nextResult);
    const map: Record<string, { score: number; reason: string; rank: number }> = {};
    nextResult.recommendations.forEach((r, idx) => {
      map[r.bar_id] = { score: r.match_score, reason: r.reason, rank: idx + 1 };
    });
    onApply?.(map);
  };

  const runRecommend = async (q: string) => {
    if (!q.trim()) return;
    if (!bars || bars.length === 0) {
      toast({ title: "바 데이터 로딩 중", description: "잠시 후 다시 시도해주세요." });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      // Limit payload size for AI gateway
      const candidates = bars.slice(0, 40);
      const { data, error } = await supabase.functions.invoke("ai-recommend", {
        body: { query: q, bars: candidates },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      applyResult(data as AIResult);
    } catch (e) {
      console.error(e);
      applyResult(buildLocalBarRecommendations(q, bars));
      toast({
        title: "로컬 추천으로 전환했어요",
        description: "새 Supabase에 AI 함수가 없어 브라우저 안에서 추천을 계산했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setQuery("");
    onApply?.({});
  };

  return (
    <div className="relative rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.15),transparent_60%)] pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold tracking-wide text-primary uppercase">
            AI 큐레이터
          </span>
        </div>
        <p className="text-sm text-foreground/80 mb-3">
          오늘의 기분을 한 문장으로 말해보세요. AI가 어울리는 바를 골라드려요.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runRecommend(query);
          }}
          className="flex gap-2"
        >
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 오늘 혼자 조용히 위스키 한잔"
            disabled={loading}
            className="bg-background/60 border-primary/20"
          />
          <Button type="submit" disabled={loading || !query.trim()} size="icon">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
          </Button>
        </form>

        {!result && !loading && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {EXAMPLE_QUERIES.map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setQuery(ex);
                  runRecommend(ex);
                }}
                className="text-[11px] px-2.5 py-1 rounded-full border border-primary/20 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            AI가 리뷰·태그·분위기 데이터를 분석 중…
          </div>
        )}

        {result && (
          <div className="mt-4 space-y-3 animate-fade-in">
            <div className="text-xs text-muted-foreground">
              <span className="text-primary font-medium">의도 파악:</span>{" "}
              {result.intent_summary}
            </div>
            <div className="space-y-2">
              {result.recommendations.map((rec, idx) => {
                const bar = bars.find((b: Bar) => b.id === rec.bar_id);
                if (!bar) return null;
                return (
                  <div
                    key={rec.bar_id}
                    className="rounded-xl border border-border/60 bg-card/60 p-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-primary">
                          #{idx + 1}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {bar.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {bar.area} · {bar.category}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-primary shrink-0">
                        {rec.match_score}점
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      {rec.reason}
                    </p>
                  </div>
                );
              })}
            </div>
            <button
              onClick={reset}
              className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              다시 검색하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISearchPanel;
