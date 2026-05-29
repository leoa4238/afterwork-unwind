import { useState } from "react";
import { Sparkles, Loader2, Wand2, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export interface NetworkingProfile {
  id: string;
  nickname: string;
  age_range: string | null;
  job_group: string | null;
  area: string | null;
  talk_topics: string[];
}

interface Match {
  user_id: string;
  match_score: number;
  reason: string;
}
interface Result {
  intent_summary: string;
  ice_breakers: string[];
  matches: Match[];
}

const EXAMPLES = [
  "사이드프로젝트 얘기 같이 할 개발자",
  "와인 좋아하는 마케터분",
  "퇴근하고 가볍게 한잔만",
];

const NetworkingAIMatch = ({
  users,
  onMatched,
}: {
  users: NetworkingProfile[];
  onMatched: (matches: Record<string, { score: number; reason: string }>) => void;
}) => {
  const [interest, setInterest] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const run = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const payload = users.map((u) => ({
        id: u.id,
        nickname: u.nickname,
        jobGroup: u.job_group,
        ageRange: u.age_range,
        area: u.area,
        talkTopics: u.talk_topics,
      }));
      const { data, error } = await supabase.functions.invoke("ai-match-network", {
        body: {
          profile: { interest: text, jobGroup: "직장인", area: "서울" },
          users: payload,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as Result);
      const map: Record<string, { score: number; reason: string }> = {};
      (data as Result).matches.forEach((m) => {
        map[m.user_id] = { score: m.match_score, reason: m.reason };
      });
      onMatched(map);
    } catch (e) {
      toast({
        title: "AI 매칭 실패",
        description: e instanceof Error ? e.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">
          AI 네트워킹 매칭
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        오늘 어떤 사람과 한잔하고 싶으세요? 관심사·직군을 자유롭게 적어주세요.
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); run(interest); }}
        className="flex gap-2"
      >
        <Input
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          placeholder="예: 사이드프로젝트 얘기할 개발자"
          disabled={loading}
          className="bg-background/60 border-primary/20"
        />
        <Button type="submit" size="icon" disabled={loading || !interest.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
        </Button>
      </form>

      {!result && !loading && (
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => { setInterest(ex); run(ex); }}
              className="text-[11px] px-2.5 py-1 rounded-full border border-primary/20 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          AI가 관심사·직군·대화 주제를 매칭 중…
        </div>
      )}

      {result && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary font-medium">의도 파악:</span> {result.intent_summary}
          </p>
          {result.ice_breakers?.length > 0 && (
            <div className="rounded-lg bg-muted/40 p-3 border border-border">
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">AI가 제안하는 첫 대화</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.ice_breakers.map((t, i) => (
                  <Badge key={i} variant="secondary" className="text-[11px] bg-secondary border-0">
                    💬 {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NetworkingAIMatch;
