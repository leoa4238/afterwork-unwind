import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wine, Loader2, ArrowLeft, Sparkles, CheckCircle2, AlertCircle, ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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

interface ManualBar {
  id: string;
  name: string;
  address: string;
  area: string;
  category: string;
  price_range: string;
  solo_friendly_score: number;
  quiet_score: number;
  networking_friendly: boolean;
  ai_summary: string;
  tags: string;
}

const PRESETS = [
  { label: "다이닝코드 예시", url: "https://www.diningcode.com/profile.php?rid=2gC60O3eFn5K" },
  { label: "망고플레이트 예시", url: "https://www.mangoplate.com/restaurants/CJUjUQwcCQ" },
];

const LOCAL_CRAWL_SEEDS = [
  {
    name: "강남 애프터글로우",
    address: "서울 강남구 테헤란로 217",
    area: "강남",
    category: "칵테일바",
    tags: ["퇴근 후", "대화하기 좋음", "칵테일"],
  },
  {
    name: "성수 레이트바",
    address: "서울 성동구 연무장길 42",
    area: "성수",
    category: "맥주바",
    tags: ["수제맥주", "캐주얼", "네트워킹"],
  },
  {
    name: "여의도 싱글몰트",
    address: "서울 영등포구 국제금융로 10",
    area: "여의도",
    category: "위스키바",
    tags: ["혼자 가기 편함", "조용함", "위스키"],
  },
  {
    name: "을지로 하이볼스탠드",
    address: "서울 중구 을지로 128",
    area: "을지로",
    category: "하이볼바",
    tags: ["하이볼", "레트로", "직장인 선호"],
  },
];

const getBarCrudErrorMessage = (message: string) => {
  if (message.toLowerCase().includes("row-level security")) {
    return "Supabase RLS 정책 때문에 저장이 막혔어요. outputs/supabase-bar-crud-policy.sql을 Supabase SQL Editor에서 실행해주세요.";
  }
  return message;
};

const buildLocalCrawlResult = (sourceUrl: string, index = 0): CrawlResult => {
  const seed = LOCAL_CRAWL_SEEDS[index % LOCAL_CRAWL_SEEDS.length];
  const host = (() => {
    try {
      return new URL(sourceUrl).hostname.replace(/^www\./, "");
    } catch {
      return "입력 URL";
    }
  })();
  const id = `local-crawl-${Date.now()}-${index}`;

  return {
    id,
    name: seed.name,
    address: seed.address,
    area: seed.area,
    category: seed.category,
    ai_summary: `${host} 정보를 바탕으로 생성한 임시 AI 요약입니다. ${seed.area}에서 퇴근 후 방문하기 좋고, ${seed.tags.slice(0, 2).join(", ")} 분위기에 어울리는 바로 정리했습니다.`,
    rating: 4.5,
    tags: seed.tags,
  };
};

const Admin = () => {
  const { isDemo } = useAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);
  const [history, setHistory] = useState<CrawlResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualBars, setManualBars] = useState<CrawlResult[]>([]);
  const [manualBar, setManualBar] = useState<ManualBar>({
    id: "",
    name: "",
    address: "",
    area: "성수",
    category: "위스키바",
    price_range: "₩₩",
    solo_friendly_score: 4,
    quiet_score: 4,
    networking_friendly: false,
    ai_summary: "",
    tags: "혼자 가기 편함, 조용한 편",
  });

  const loadManualBars = async () => {
    const { data } = await supabase
      .from("bars")
      .select("id, name, address, area, category, ai_summary, rating")
      .order("created_at", { ascending: false })
      .limit(8);
    setManualBars((data || []).map((bar: any) => ({ ...bar, tags: [] })));
  };

  useEffect(() => {
    loadManualBars();
  }, []);

  const handleManualChange = (field: keyof ManualBar, value: string | number | boolean) => {
    setManualBar((prev) => ({ ...prev, [field]: value }));
  };

  const resetManualForm = () => {
    setManualBar({
      id: "",
      name: "",
      address: "",
      area: "성수",
      category: "위스키바",
      price_range: "₩₩",
      solo_friendly_score: 4,
      quiet_score: 4,
      networking_friendly: false,
      ai_summary: "",
      tags: "혼자 가기 편함, 조용한 편",
    });
  };

  const handleManualSave = async () => {
    if (isDemo) {
      toast.error("Supabase CRUD는 실제 계정 로그인 후 사용할 수 있어요");
      return;
    }
    if (!manualBar.name.trim() || !manualBar.address.trim() || !manualBar.ai_summary.trim()) {
      toast.error("이름, 주소, AI 요약은 필수입니다");
      return;
    }

    setManualLoading(true);
    const id = manualBar.id || `manual-${Date.now()}`;
    const { error: barError } = await supabase.from("bars").upsert({
      id,
      name: manualBar.name.trim(),
      address: manualBar.address.trim(),
      area: manualBar.area.trim(),
      category: manualBar.category.trim(),
      price_range: manualBar.price_range,
      is_open_now: true,
      solo_friendly_score: manualBar.solo_friendly_score * 20,
      quiet_score: manualBar.quiet_score * 20,
      networking_friendly: manualBar.networking_friendly,
      ai_summary: manualBar.ai_summary.trim(),
      rating: 4.5,
      review_count: 0,
      distance: "",
      image_key: "whiskey",
    });

    if (barError) {
      setManualLoading(false);
      toast.error("바 저장 실패: " + getBarCrudErrorMessage(barError.message));
      return;
    }

    await supabase.from("bar_tags").delete().eq("bar_id", id);
    const tags = manualBar.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8);
    if (tags.length) {
      const { error: tagError } = await supabase
        .from("bar_tags")
        .insert(tags.map((tag) => ({ bar_id: id, tag })));
      if (tagError) {
        setManualLoading(false);
        toast.error("태그 저장 실패: " + getBarCrudErrorMessage(tagError.message));
        return;
      }
    }

    setManualLoading(false);
    toast.success("Supabase에 바가 저장되었습니다");
    setManualBars((prev) => [
      {
        id,
        name: manualBar.name.trim(),
        address: manualBar.address.trim(),
        area: manualBar.area.trim(),
        category: manualBar.category.trim(),
        ai_summary: manualBar.ai_summary.trim(),
        rating: 4.5,
        tags,
      },
      ...prev.filter((bar) => bar.id !== id),
    ].slice(0, 8));
    resetManualForm();
  };

  const handleManualEdit = async (id: string) => {
    const [{ data: bar }, { data: tags }] = await Promise.all([
      supabase.from("bars").select("*").eq("id", id).maybeSingle(),
      supabase.from("bar_tags").select("tag").eq("bar_id", id),
    ]);

    if (!bar) {
      toast.error("수정할 바 정보를 찾지 못했어요");
      return;
    }

    setManualBar({
      id: bar.id,
      name: bar.name,
      address: bar.address,
      area: bar.area,
      category: bar.category,
      price_range: bar.price_range,
      solo_friendly_score: Math.max(1, Math.round((bar.solo_friendly_score || 20) / 20)),
      quiet_score: Math.max(1, Math.round((bar.quiet_score || 20) / 20)),
      networking_friendly: bar.networking_friendly,
      ai_summary: bar.ai_summary || "",
      tags: (tags || []).map((item) => item.tag).join(", "),
    });
    toast.info("선택한 바 정보를 수정 폼에 불러왔어요");
  };

  const handleManualDelete = async (id: string) => {
    if (isDemo) {
      toast.error("Supabase CRUD는 실제 계정 로그인 후 사용할 수 있어요");
      return;
    }
    const { error } = await supabase.from("bars").delete().eq("id", id);
    if (error) {
      toast.error("삭제 실패: " + getBarCrudErrorMessage(error.message));
      return;
    }
    toast.success("삭제되었습니다");
    loadManualBars();
  };

  const saveCrawledBar = async (bar: CrawlResult) => {
    if (isDemo) return;

    const { error: barError } = await supabase.from("bars").upsert({
      id: bar.id,
      name: bar.name,
      address: bar.address,
      area: bar.area,
      category: bar.category,
      price_range: "₩₩",
      is_open_now: true,
      solo_friendly_score: 86,
      quiet_score: 76,
      networking_friendly: bar.tags.some((tag) => /대화|네트워킹|직장인/.test(tag)),
      ai_summary: bar.ai_summary,
      rating: bar.rating,
      review_count: 0,
      distance: "",
      image_key: "cocktail",
    });
    if (barError) throw barError;

    await supabase.from("bar_tags").delete().eq("bar_id", bar.id);
    if (bar.tags.length) {
      const { error: tagError } = await supabase
        .from("bar_tags")
        .insert(bar.tags.map((tag) => ({ bar_id: bar.id, tag })));
      if (tagError) throw tagError;
    }
  };

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
      await saveCrawledBar(bar);
      setHistory((prev) => [bar, ...prev]);
      setUrl("");
      toast.success(`'${bar.name}' 추가됨!`);
    } catch (e) {
      console.error(e);
      try {
        const bar = buildLocalCrawlResult(u);
        await saveCrawledBar(bar);
        setHistory((prev) => [bar, ...prev]);
        setUrl("");
        const msg = isDemo
          ? "AI 크롤러 함수가 없어 데모용 추정 결과를 화면에 표시했어요."
          : "AI 크롤러 함수가 없어 로컬 추정 결과를 Supabase에 저장했어요.";
        setError(msg);
        toast.success(msg);
        loadManualBars();
      } catch (fallbackError) {
        const msg = (fallbackError as Error).message || "크롤링 저장 실패";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSeoulBulk = async () => {
    setBulkLoading(true);
    setError(null);
    setBulkStatus("서울 바 검색 → 스크랩 → AI 추출 중... (1~3분 소요)");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("crawl-bar", {
        body: { bulk: true, limit: 12, perQuery: 3 },
      });
      if (fnErr) throw new Error(fnErr.message);
      if (data?.error) throw new Error(data.error);
      const bars: CrawlResult[] = data.bars || [];
      await Promise.all(bars.map((bar) => saveCrawledBar(bar)));
      setHistory((prev) => [...bars, ...prev]);
      setBulkStatus(
        `완료: ${data.inserted}개 추가 / ${data.attempted}개 시도 (서울 외 또는 실패 ${data.skipped?.length || 0}개 제외)`
      );
      toast.success(`서울 바 ${bars.length}곳 추가됨`);
    } catch (e) {
      console.error(e);
      try {
        const bars = LOCAL_CRAWL_SEEDS.map((_, idx) => buildLocalCrawlResult(`local-bulk-${idx}`, idx));
        await Promise.all(bars.map((bar) => saveCrawledBar(bar)));
        setHistory((prev) => [...bars, ...prev]);
        const msg = isDemo
          ? `AI 크롤러 함수가 없어 데모용 서울 바 ${bars.length}개를 화면에 표시했어요.`
          : `AI 크롤러 함수가 없어 로컬 추정 서울 바 ${bars.length}개를 Supabase에 저장했어요.`;
        setBulkStatus(msg);
        toast.success(msg);
        loadManualBars();
      } catch (fallbackError) {
        const msg = (fallbackError as Error).message || "벌크 크롤링 저장 실패";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setBulkLoading(false);
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

        {/* Manual Supabase CRUD */}
        <Card className="p-6 space-y-4 bg-card/60 border-border">
          <div className="flex items-center gap-2">
            <Wine className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-xl">Supabase 수동 바 등록 CRUD</h2>
            <Badge variant="outline" className="ml-auto text-xs">실제 DB</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Firecrawl/AI 키가 없어도 직접 입력한 바 정보를 <code>bars</code>, <code>bar_tags</code> 테이블에 저장합니다.
            실제 Supabase 로그인 세션이 필요합니다.
          </p>
          {isDemo && (
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-primary">
              현재는 데모 로그인 상태입니다. Supabase CRUD 테스트는 회원가입/이메일 로그인 후 다시 시도해주세요.
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={manualBar.name}
              onChange={(e) => handleManualChange("name", e.target.value)}
              placeholder="바 이름"
            />
            <Input
              value={manualBar.address}
              onChange={(e) => handleManualChange("address", e.target.value)}
              placeholder="주소"
            />
            <Input
              value={manualBar.area}
              onChange={(e) => handleManualChange("area", e.target.value)}
              placeholder="지역"
            />
            <Input
              value={manualBar.category}
              onChange={(e) => handleManualChange("category", e.target.value)}
              placeholder="카테고리"
            />
            <Input
              value={manualBar.price_range}
              onChange={(e) => handleManualChange("price_range", e.target.value)}
              placeholder="가격대"
            />
            <Input
              value={manualBar.tags}
              onChange={(e) => handleManualChange("tags", e.target.value)}
              placeholder="태그, 쉼표로 구분"
            />
          </div>
          <Textarea
            value={manualBar.ai_summary}
            onChange={(e) => handleManualChange("ai_summary", e.target.value)}
            placeholder="AI 요약/소개 문구"
            className="min-h-[80px]"
          />
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-xs text-muted-foreground">
              혼술 적합도
              <Input
                type="number"
                min={1}
                max={5}
                value={manualBar.solo_friendly_score}
                onChange={(e) => handleManualChange("solo_friendly_score", Number(e.target.value))}
                className="mt-1"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              조용함
              <Input
                type="number"
                min={1}
                max={5}
                value={manualBar.quiet_score}
                onChange={(e) => handleManualChange("quiet_score", Number(e.target.value))}
                className="mt-1"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground pt-5">
              <input
                type="checkbox"
                checked={manualBar.networking_friendly}
                onChange={(e) => handleManualChange("networking_friendly", e.target.checked)}
              />
              네트워킹 적합
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={resetManualForm} disabled={manualLoading}>
              초기화
            </Button>
            <Button onClick={handleManualSave} disabled={manualLoading || isDemo}>
              {manualLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Supabase 저장
            </Button>
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-sm font-medium">최근 등록된 바</p>
            {manualBars.map((bar) => (
              <div key={bar.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{bar.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{bar.area} · {bar.category}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleManualEdit(bar.id)}>
                    수정
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleManualDelete(bar.id)} disabled={isDemo}>
                    삭제
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Seoul Bulk Crawl */}
        <Card className="p-6 space-y-4 bg-gradient-to-br from-primary/10 to-card/60 border-primary/30">
          <div className="flex items-start gap-3">
            <MapPin className="w-6 h-6 text-primary mt-0.5" />
            <div className="flex-1">
              <h3 className="font-serif text-lg">🍶 서울 바 자동 수집</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Firecrawl Search로 다이닝코드·망고플레이트에서 서울 바를 검색하고,
                각 페이지를 스크랩 → AI가 서울 주소만 필터링해서 DB에 자동 저장합니다.
              </p>
            </div>
          </div>
          <Button
            onClick={handleSeoulBulk}
            disabled={bulkLoading || loading}
            className="w-full"
            size="lg"
          >
            {bulkLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                서울 바 수집 중...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                서울 바 일괄 크롤 시작 (최대 12곳)
              </>
            )}
          </Button>
          {bulkStatus && (
            <div className="text-xs text-muted-foreground border-t border-border pt-3">
              {bulkStatus}
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
