// AI matching for networking users
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { profile, users } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `너는 "퇴근한잔" 네트워킹 AI 매칭 엔진이야. 직장인의 관심사/직군/오늘 기분을 받아서,
대화 가능한 후보 유저 중 가볍게 한잔하기 좋은 3~5명을 매칭해줘. 소개팅이 아니라 동료 같은 느낌.
반드시 tool call로만 응답.`;

    const userPrompt = `요청자 프로필:
${JSON.stringify(profile, null, 2)}

후보 유저:
${JSON.stringify(users, null, 2)}`;

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
            name: "match_users",
            description: "Rank candidate users by fit.",
            parameters: {
              type: "object",
              properties: {
                intent_summary: { type: "string", description: "요청자 의도 한 문장" },
                ice_breakers: {
                  type: "array",
                  description: "AI가 제안하는 어색하지 않은 첫 대화 주제 3개",
                  items: { type: "string" },
                },
                matches: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      user_id: { type: "string" },
                      match_score: { type: "number", description: "0~100" },
                      reason: { type: "string", description: "왜 잘 맞는지 한 문장" },
                    },
                    required: ["user_id", "match_score", "reason"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["intent_summary", "ice_breakers", "matches"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "match_users" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "요청이 많아요." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
    console.error("ai-match-network error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
