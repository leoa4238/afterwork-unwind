import { useState } from "react";
import { Link } from "react-router-dom";
import { Wine, Loader2, ArrowLeft, Sparkles, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CrawlResult {
  id: string;
  name: string;
  address: string;
  area: string;
  category: string;
  ai_summary: string;
  rating: number;
  tags: string[];
}

const PRESETS = [
  { label: "다이닝코드 예시", url: "https://www.diningcode.com/profile.php?rid=2gC60O3eFn5K" },
  { label: "망고플레이트 예시", url: "https://www.mangoplate.com/restaurants/CJUjUQwcCQ" },
];

const Admin = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<CrawlResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleCrawl = async (targetUrl?: string) => {
    const u = (targetUrl ?? url).trim();
    if (!u) {
      toast.error("URL을 입력하세요");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("crawl-bar", {
        body: { url: u },
      });
      if (fnErr) throw new Error(fnErr.message);
      if (data?.error) throw new Error(data.error);
      const bar: CrawlResult = data.bar;
      setHistory((prev) => [bar, ...prev]);
      setUrl("");
      toast.success(`'${bar.name}' 추가됨!`);
    } catch (e) {
      const msg = (e as Error).message || "크롤링 실패";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/mypage" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Wine className="w-6 h-6 text-primary" />
          <h1 className="font-serif text-xl">AI 크롤러</h1>
          <Badge variant="secondary" className="ml-auto text-xs">관리자</Badge>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Intro */}
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-2xl">URL → AI 자동 추출 → DB 저장</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            바 정보가 담긴 웹페이지 URL을 넣으면 <b>Firecrawl</b>이 본문을 가져오고,
            <b> Lovable AI(Gemini 2.5 Flash)</b>가 한국어로 구조화 데이터를 추출해서 자동으로 DB에 추가합니다.
          </p>
        </section>

        {/* Input */}
        <Card className="p-6 space-y-4 bg-card/60 border-border">
          <div className="space-y-2">
            <label className="text-sm font-medium">바 페이지 URL</label>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.diningcode.com/profile.php?rid=..."
                disabled={loading}
                onKeyDown={(e) => e.key === "Enter" && handleCrawl()}
              />
              <Button onClick={() => handleCrawl()} disabled={loading} className="min-w-28">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    크롤 중
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    크롤 시작
                  </>
                )}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs text-muted-foreground self-center">빠른 시드:</span>
              {PRESETS.map((p) => (
                <button
                  key={p.url}
                  onClick={() => setUrl(p.url)}
                  disabled={loading}
                  className="text-xs px-2 py-1 rounded border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="text-sm text-muted-foreground flex items-center gap-2 pt-2 border-t border-border">
              <Loader2 className="w-4 h-4 animate-spin" />
              페이지 스크랩 → AI 분석 → 저장 중 (보통 10~20초)
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive flex items-start gap-2 pt-2 border-t border-border">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </Card>

        {/* Results */}
        {history.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-serif text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              이번 세션에 추가된 바 ({history.length})
            </h3>
            {history.map((bar) => (
              <Card key={bar.id} className="p-4 bg-card/60 border-border space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium">{bar.name}</h4>
                    <p className="text-xs text-muted-foreground">{bar.address}</p>
                  </div>
                  <Link
                    to={`/bar/${bar.id}`}
                    className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
                  >
                    상세 보기
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <p className="text-sm italic text-foreground/80">"{bar.ai_summary}"</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="outline" className="text-xs">{bar.area}</Badge>
                  <Badge variant="outline" className="text-xs">{bar.category}</Badge>
                  <Badge variant="outline" className="text-xs">★ {bar.rating}</Badge>
                  {bar.tags?.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">#{t}</Badge>
                  ))}
                </div>
              </Card>
            ))}
          </section>
        )}

        {/* How it works */}
        <Card className="p-5 bg-muted/30 border-border space-y-2">
          <h3 className="font-medium text-sm">동작 원리</h3>
          <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
            <li><b>Firecrawl</b>로 입력 URL의 본문을 markdown 형태로 스크랩</li>
            <li><b>Gemini 2.5 Flash</b>에 function calling으로 구조화 추출 요청 (이름·지역·카테고리·태그·혼술/조용함 점수·요약)</li>
            <li>추출된 JSON을 <code className="text-primary">bars</code>, <code className="text-primary">bar_tags</code> 테이블에 자동 insert</li>
            <li>탐색 페이지·AI 추천·네트워킹 매칭에서 즉시 활용</li>
          </ol>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
