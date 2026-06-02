// Crawl bar URLs with Firecrawl + Lovable AI structured extraction.
// Modes:
//   { url }                                       -> single URL crawl
//   { bulk: true, queries?: string[], limit? }    -> Seoul bulk: search → scrape each → extract → insert
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FIRECRAWL_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const SEOUL_QUERIES_DEFAULT = [
  "서울 위스키바 추천 site:diningcode.com",
  "서울 칵테일바 추천 site:diningcode.com",
  "서울 와인바 혼술 site:diningcode.com",
  "서울 이자카야 혼술 site:mangoplate.com",
  "성수동 바 추천 site:diningcode.com",
  "연남동 위스키바 site:diningcode.com",
  "강남 칵테일바 site:diningcode.com",
  "을지로 바 추천 site:diningcode.com",
];

const extractTool = {
  type: "function",
  function: {
    name: "save_bar",
    description: "Extract structured bar/pub information from the scraped page.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "가게 이름" },
        address: { type: "string", description: "전체 주소 (반드시 서울이어야 함)" },
        area: { type: "string", description: "동/구 단위 지역명 (예: 성수동, 연남동, 강남)" },
        category: {
          type: "string",
          description: "카테고리: 위스키바/와인바/칵테일바/이자카야/펍/하이볼바 중 하나",
        },
        price_range: { type: "string", description: "₩ ~ ₩₩₩₩" },
        solo_friendly_score: { type: "integer", description: "혼술 적합도 1~5" },
        quiet_score: { type: "integer", description: "조용함 1~5" },
        networking_friendly: { type: "boolean" },
        rating: { type: "number", description: "평점 0~5" },
        ai_summary: { type: "string", description: "한 문장 핵심 매력 (한국어, 60자 이내)" },
        is_seoul: { type: "boolean", description: "주소가 서울특별시인지 여부" },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "분위기 태그 3~6개",
        },
      },
      required: ["name", "address", "area", "category", "ai_summary", "tags", "is_seoul"],
      additionalProperties: false,
    },
  },
};

async function authCheck(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const sbAuth = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims, error } = await sbAuth.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (error || !claims?.claims) return null;
  return claims;
}

async function firecrawlScrape(url: string) {
  const r = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${FIRECRAWL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
      waitFor: 1200,
      location: { country: "KR", languages: ["ko"] },
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Firecrawl scrape ${r.status}: ${j?.error || ""}`);
  return {
    markdown: (j?.data?.markdown || j?.markdown || "") as string,
    title: (j?.data?.metadata?.title || j?.metadata?.title || "") as string,
  };
}

async function firecrawlSearch(query: string, limit: number) {
  const r = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${FIRECRAWL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit, lang: "ko", country: "kr" }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Firecrawl search ${r.status}: ${j?.error || ""}`);
  const items = j?.data?.web || j?.data || j?.web || [];
  return (Array.isArray(items) ? items : [])
    .map((it: any) => it?.url)
    .filter((u: any) => typeof u === "string");
}

async function aiExtract(url: string, title: string, markdown: string) {
  const trimmed = markdown.slice(0, 12000);
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "너는 서울 직장인을 위한 '혼술 바' 데이터 큐레이터다. 주어진 웹페이지에서 바 정보를 추출해라. 주소가 서울이 아니면 is_seoul=false 로 표시해라. 반드시 save_bar 도구를 호출해라.",
        },
        { role: "user", content: `URL: ${url}\n제목: ${title}\n\n본문:\n${trimmed}` },
      ],
      tools: [extractTool],
      tool_choice: { type: "function", function: { name: "save_bar" } },
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`AI ${r.status}: ${j?.error?.message || ""}`);
  const args = j?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("AI 구조화 실패");
  return JSON.parse(args);
}

async function saveBar(sbAdmin: any, extracted: any) {
  const id = `crawl-${crypto.randomUUID().slice(0, 8)}`;
  const barRow = {
    id,
    name: extracted.name,
    address: extracted.address,
    area: extracted.area,
    category: extracted.category,
    price_range: extracted.price_range || "₩₩",
    solo_friendly_score: Math.max(0, Math.min(5, extracted.solo_friendly_score ?? 4)),
    quiet_score: Math.max(0, Math.min(5, extracted.quiet_score ?? 3)),
    networking_friendly: !!extracted.networking_friendly,
    rating: Math.max(0, Math.min(5, Number(extracted.rating) || 4.0)),
    review_count: 0,
    is_open_now: true,
    ai_summary: extracted.ai_summary,
  };
  const { error: barErr } = await sbAdmin.from("bars").insert(barRow);
  if (barErr) throw new Error(`DB insert: ${barErr.message}`);
  const tags = (extracted.tags || []).slice(0, 6).filter((t: string) => t && t.length < 30);
  if (tags.length) {
    await sbAdmin.from("bar_tags").insert(tags.map((t: string) => ({ bar_id: id, tag: t })));
  }
  return { ...barRow, tags };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!FIRECRAWL_KEY) throw new Error("FIRECRAWL_API_KEY missing");
    if (!LOVABLE_KEY) throw new Error("LOVABLE_API_KEY missing");

    const claims = await authCheck(req);
    if (!claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const sbAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // ===== BULK SEOUL MODE =====
    if (body?.bulk) {
      const queries: string[] = Array.isArray(body.queries) && body.queries.length
        ? body.queries
        : SEOUL_QUERIES_DEFAULT;
      const perQuery: number = Math.min(Math.max(Number(body.perQuery) || 3, 1), 5);
      const maxTotal: number = Math.min(Math.max(Number(body.limit) || 12, 1), 20);

      // 1) collect URLs
      const urls = new Set<string>();
      for (const q of queries) {
        if (urls.size >= maxTotal) break;
        try {
          const found = await firecrawlSearch(q, perQuery);
          for (const u of found) {
            urls.add(u);
            if (urls.size >= maxTotal) break;
          }
        } catch (e) {
          console.error("search err", q, e);
        }
      }

      const results: any[] = [];
      const skipped: { url: string; reason: string }[] = [];

      for (const u of urls) {
        try {
          const { markdown, title } = await firecrawlScrape(u);
          if (!markdown || markdown.length < 100) {
            skipped.push({ url: u, reason: "본문 부족" });
            continue;
          }
          const extracted = await aiExtract(u, title, markdown);
          if (!extracted.is_seoul || !/서울/.test(extracted.address || "")) {
            skipped.push({ url: u, reason: "서울 아님" });
            continue;
          }
          const saved = await saveBar(sbAdmin, extracted);
          results.push(saved);
        } catch (e) {
          skipped.push({ url: u, reason: (e as Error).message.slice(0, 80) });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          mode: "bulk",
          inserted: results.length,
          attempted: urls.size,
          bars: results,
          skipped,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== SINGLE URL MODE =====
    const url: string = body?.url;
    if (!url || !/^https?:\/\//.test(url)) {
      return new Response(JSON.stringify({ error: "유효한 URL이 필요합니다" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { markdown, title } = await firecrawlScrape(url);
    if (!markdown || markdown.length < 100) {
      return new Response(JSON.stringify({ error: "페이지 본문 부족" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const extracted = await aiExtract(url, title, markdown);
    if (!extracted.is_seoul || !/서울/.test(extracted.address || "")) {
      return new Response(
        JSON.stringify({ error: `서울 지역 바만 추가 가능합니다 (감지된 주소: ${extracted.address})` }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const saved = await saveBar(sbAdmin, extracted);
    return new Response(JSON.stringify({ success: true, bar: saved }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("crawl-bar error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
