// AI bar detail insights: pairing + similar bars + why-go-today
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { bar, allBars } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `너는 "퇴근한잔" 서비스의 AI 소믈리에야. 주어진 바 한 곳에 대해서 직장인 1인 고객을 위한 인사이트를 만들어줘.
반드시 tool call 형식으로만 응답.`;

    const userPrompt = `대상 바:
${JSON.stringify(bar, null, 2)}

비교용 다른 바 후보 (similar_bars 선정 시 사용, 본인 제외):
${JSON.stringify(
  allBars.filter((b: any) => b.id !== bar.id).map((b: any) => ({
    id: b.id, name: b.name, area: b.area, category: b.category, tags: b.tags,
    soloFriendlyScore: b.soloFriendlyScore, quietScore: b.quietScore,
  })),
  null, 2
)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "build_bar_insight",
            description: "Generate AI insights for a bar.",
            parameters: {
              type: "object",
              properties: {
                why_today: {
                  type: "string",
                  description: "오늘 이 바에 가야 할 이유 1문장 (퇴근한 직장인 시점, 따뜻하게)",
                },
                signature_drinks: {
                  type: "array",
                  description: "이 바에서 추천하는 시그니처 드링크 3개 (한국어 이름 + 한 줄 설명)",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      desc: { type: "string" },
                    },
                    required: ["name", "desc"],
                    additionalProperties: false,
                  },
                },
                pairings: {
                  type: "array",
                  description: "어울리는 안주/페어링 3개 (한 줄)",
                  items: { type: "string" },
                },
                vibe_tags: {
                  type: "array",
                  description: "AI가 분석한 분위기 키워드 4개 (짧게)",
                  items: { type: "string" },
                },
                similar_bars: {
                  type: "array",
                  description: "비슷한 분위기의 다른 바 2개 (id 사용)",
                  items: {
                    type: "object",
                    properties: {
                      bar_id: { type: "string" },
                      reason: { type: "string", description: "왜 비슷한지 한 줄" },
                    },
                    required: ["bar_id", "reason"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["why_today", "signature_drinks", "pairings", "vibe_tags", "similar_bars"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "build_bar_insight" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "요청이 많아요. 잠시 후 다시 시도해주세요." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI 크레딧이 부족합니다." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI 서비스 오류" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return new Response(JSON.stringify({ error: "AI 응답 없음" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const args = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(args), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-bar-detail error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
