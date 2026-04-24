// AI bar recommendation edge function using Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, bars } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `너는 "퇴근한잔" 서비스의 AI 큐레이터야. 직장인이 자연어로 "오늘 이런 기분이야" 라고 말하면,
주어진 바 후보 리스트 중에서 가장 어울리는 2~3곳을 골라서 추천해줘.

반드시 tool call 형식으로만 응답해. 각 추천은:
- bar_id: 후보 리스트의 id
- match_score: 0~100 사이 정수 (사용자 요청과의 적합도)
- reason: 한국어 한 문장 (왜 이 바가 이 사용자에게 맞는지, 태그/분위기 근거로 구체적으로)

사용자 의도를 파악할 때 고려할 것:
- "혼자" "조용히" → soloFriendlyScore, quietScore 높은 곳
- "대화" "네트워킹" "사람" → networkingFriendly, 대화하기 좋음 태그
- 술 종류(위스키/와인/하이볼/맥주/칵테일) → category 매칭
- 지역명 → area 매칭
- "야경" "감성" "레트로" 같은 분위기 키워드 → tags 매칭`;

    const userPrompt = `사용자 요청: "${query}"

후보 바 리스트:
${JSON.stringify(
  bars.map((b: any) => ({
    id: b.id,
    name: b.name,
    area: b.area,
    category: b.category,
    soloFriendlyScore: b.soloFriendlyScore,
    quietScore: b.quietScore,
    networkingFriendly: b.networkingFriendly,
    tags: b.tags,
  })),
  null,
  2
)}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "recommend_bars",
                description: "Return 2-3 bar recommendations ranked by fit.",
                parameters: {
                  type: "object",
                  properties: {
                    intent_summary: {
                      type: "string",
                      description:
                        "사용자의 의도를 한 문장으로 요약 (예: '혼자 조용히 위스키 한잔')",
                    },
                    recommendations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          bar_id: { type: "string" },
                          match_score: { type: "number" },
                          reason: { type: "string" },
                        },
                        required: ["bar_id", "match_score", "reason"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["intent_summary", "recommendations"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "recommend_bars" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI 크레딧이 부족합니다. 워크스페이스에 크레딧을 추가해주세요." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI 서비스 오류" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI가 추천을 생성하지 못했습니다." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-recommend error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
