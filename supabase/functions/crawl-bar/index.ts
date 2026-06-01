// Crawl a bar URL with Firecrawl, extract structured data via Lovable AI, insert into Supabase.
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

const extractTool = {
  type: "function",
  function: {
    name: "save_bar",
    description: "Extract structured bar/pub information from the scraped page.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "가게 이름" },
        address: { type: "string", description: "전체 주소" },
        area: { type: "string", description: "동/구 단위 지역명 (예: 성수동, 연남동, 강남)" },
        category: {
          type: "string",
          description: "카테고리: 위스키바/와인바/칵테일바/이자카야/펍/하이볼바 중 하나",
        },
        price_range: { type: "string", description: "₩ ~ ₩₩₩₩ 중 하나 또는 '1만원대' 형식" },
        solo_friendly_score: { type: "integer", description: "혼술 적합도 1~5" },
        quiet_score: { type: "integer", description: "조용함 1~5" },
        networking_friendly: { type: "boolean", description: "낯선 사람과 대화하기 좋은 분위기인지" },
        rating: { type: "number", description: "평점 0~5" },
        ai_summary: { type: "string", description: "한 문장으로 이 바의 핵심 매력 요약 (한국어, 60자 이내)" },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "분위기/특징 태그 3~6개 (예: '혼술', '재즈', '조용함', '바테이블', '위스키 종류 다양')",
        },
      },
      required: ["name", "address", "area", "category", "ai_summary", "tags"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!FIRECRAWL_KEY) throw new Error("FIRECRAWL_API_KEY missing");
    if (!LOVABLE_KEY) throw new Error("LOVABLE_API_KEY missing");

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sbAuth = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: cErr } = await sbAuth.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (cErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const url: string = body?.url;
    if (!url || !/^https?:\/\//.test(url)) {
      return new Response(JSON.stringify({ error: "유효한 URL이 필요합니다" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Firecrawl scrape
    const fcRes = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 1500,
        location: { country: "KR", languages: ["ko"] },
      }),
    });
    const fcJson = await fcRes.json();
    if (!fcRes.ok) {
      return new Response(
        JSON.stringify({ error: `Firecrawl 실패: ${fcJson?.error || fcRes.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const markdown: string =
      fcJson?.data?.markdown || fcJson?.markdown || "";
    const sourceTitle: string =
      fcJson?.data?.metadata?.title || fcJson?.metadata?.title || "";

    if (!markdown || markdown.length < 100) {
      return new Response(
        JSON.stringify({ error: "페이지에서 추출할 본문이 부족합니다" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2) Lovable AI structured extraction (tool calling)
    const trimmed = markdown.slice(0, 12000);
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "너는 한국 직장인을 위한 '혼술 바' 데이터 큐레이터다. 주어진 웹페이지 본문을 분석해서 바 정보를 정확히 추출해라. 정보가 없으면 합리적으로 추정하되, 한국어로 작성하라. 반드시 save_bar 도구를 호출해라.",
          },
          {
            role: "user",
            content: `URL: ${url}\n페이지 제목: ${sourceTitle}\n\n본문:\n${trimmed}`,
          },
        ],
        tools: [extractTool],
        tool_choice: { type: "function", function: { name: "save_bar" } },
      }),
    });
    const aiJson = await aiRes.json();
    if (!aiRes.ok) {
      const msg = aiJson?.error?.message || `status ${aiRes.status}`;
      if (aiRes.status === 429)
        return new Response(JSON.stringify({ error: "AI 요청 한도 초과. 잠시 후 다시 시도하세요." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (aiRes.status === 402)
        return new Response(JSON.stringify({ error: "AI 크레딧이 부족합니다." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      throw new Error(`AI 추출 실패: ${msg}`);
    }
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("AI가 구조화 데이터를 반환하지 않았습니다");
    }
    const extracted = JSON.parse(toolCall.function.arguments);

    // 3) Insert into DB (service role bypasses RLS)
    const sbAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);
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
    if (barErr) throw new Error(`바 저장 실패: ${barErr.message}`);

    const tags = (extracted.tags || []).slice(0, 6).filter((t: string) => t && t.length < 30);
    if (tags.length) {
      await sbAdmin.from("bar_tags").insert(tags.map((t: string) => ({ bar_id: id, tag: t })));
    }

    return new Response(
      JSON.stringify({ success: true, bar: { ...barRow, tags } }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("crawl-bar error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
