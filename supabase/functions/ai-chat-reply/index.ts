// Generates an AI reply on behalf of a demo profile inside a chat room.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!LOVABLE_KEY) throw new Error("LOVABLE_API_KEY missing");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sbUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await sbUser.auth.getClaims(authHeader.replace("Bearer ", ""));
    const userId = claims?.claims?.sub as string | undefined;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { roomId } = await req.json();
    if (!roomId) {
      return new Response(JSON.stringify({ error: "roomId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sbAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1) Room + permission check
    const { data: room } = await sbAdmin
      .from("chat_rooms")
      .select("id, user1_id, user2_id, is_expired, expires_at")
      .eq("id", roomId)
      .maybeSingle();
    if (!room) throw new Error("room not found");
    if (room.user1_id !== userId && room.user2_id !== userId) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (room.is_expired || new Date(room.expires_at) <= new Date()) {
      return new Response(JSON.stringify({ skipped: "expired" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const otherId = room.user1_id === userId ? room.user2_id : room.user1_id;

    // 2) Other profile — only reply when demo
    const { data: other } = await sbAdmin
      .from("profiles")
      .select("user_id, nickname, age_range, job_group, area, talk_topics, is_demo")
      .eq("user_id", otherId)
      .maybeSingle();
    if (!other || !other.is_demo) {
      return new Response(JSON.stringify({ skipped: "not_demo" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Recent history
    const { data: history } = await sbAdmin
      .from("chat_messages")
      .select("sender_id, content, created_at")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(20);

    const msgs = (history ?? []).map((m: any) => ({
      role: m.sender_id === otherId ? "assistant" : "user",
      content: m.content,
    }));

    const persona = `너는 '${other.nickname}'라는 사람이다. 직군: ${other.job_group ?? "직장인"}, 연령대: ${other.age_range ?? "30대"}, 지역: ${other.area ?? "서울"}. 좋아하는 대화 주제: ${(other.talk_topics ?? []).join(", ") || "혼술, 일상"}.\n퇴근 후 동네 바에서 우연히 만나 가볍게 한잔하며 대화하는 톤으로 답해라. 한국어 반말 또는 친근한 존댓말, 1~2문장, 이모지는 최소. 절대 'AI', '봇', '챗봇'이라고 밝히지 말고 진짜 사람처럼 자연스럽게 답해라. 광고/연락처/외부 SNS 요청 금지.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: persona }, ...msgs],
      }),
    });
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway", aiResp.status, t);
      if (aiResp.status === 429 || aiResp.status === 402) {
        return new Response(JSON.stringify({ error: aiResp.status === 429 ? "rate_limited" : "no_credits" }), {
          status: aiResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI ${aiResp.status}`);
    }
    const aj = await aiResp.json();
    const reply: string = aj?.choices?.[0]?.message?.content?.trim() || "오 그래요? ㅎㅎ";

    // 4) Small delay then insert as the demo persona
    await new Promise((r) => setTimeout(r, 600));
    const { data: inserted, error: insErr } = await sbAdmin
      .from("chat_messages")
      .insert({ room_id: roomId, sender_id: otherId, content: reply.slice(0, 500) })
      .select()
      .single();
    if (insErr) throw new Error(insErr.message);

    return new Response(JSON.stringify({ success: true, message: inserted }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-chat-reply error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
