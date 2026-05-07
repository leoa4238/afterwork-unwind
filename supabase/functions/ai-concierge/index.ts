// Streaming AI concierge chatbot for 퇴근한잔
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, bars } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `너는 "퇴근한잔" 서비스의 AI 컨시어지야. 퇴근한 직장인이 편하게 말 거는 친구 같은 톤으로 대답해.
- 답변은 2~4문장으로 짧고 따뜻하게.
- 바를 추천할 땐 반드시 아래 후보 리스트 안에서만 골라. (이름을 정확히 인용)
- 코스 짜기, 예산 상담, 분위기 추천, 안주/술 페어링 모두 도와줘.
- 소개팅 느낌 금지. 혼술/가벼운 한잔/네트워킹 균형.

사용 가능한 바 후보:
${JSON.stringify((bars || []).map((b: any) => ({
  name: b.name, area: b.area, category: b.category, price: b.priceRange,
  tags: b.tags, solo: b.soloFriendlyScore, quiet: b.quietScore,
})), null, 2)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "요청이 많아요. 잠시 후 다시 시도해주세요." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI 크레딧이 부족합니다." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI 서비스 오류" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-concierge error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
