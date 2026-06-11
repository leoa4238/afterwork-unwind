import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { sampleBars } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { buildLocalConciergeReply } from "@/lib/localAi";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "오늘 강남에서 혼자 위스키 한잔 어때?",
  "퇴근 후 동료랑 1차 가볍게 갈만한 곳",
  "야경 보면서 분위기 잡기 좋은 바",
];

const AIConcierge = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "안녕하세요 ☕ 오늘 어떤 한잔이 필요하세요? 분위기, 지역, 예산 뭐든 편하게 말해주세요." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    let acc = "";
    const upsert = (chunk: string) => {
      acc += chunk;
      setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: acc } : m)));
    };

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-concierge`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next, bars: sampleBars }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) throw new Error("요청이 많아요. 잠시 후 다시 시도해주세요.");
        if (resp.status === 402) throw new Error("AI 크레딧이 부족합니다.");
        throw new Error("AI 응답 실패");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      upsert(buildLocalConciergeReply(text, sampleBars));
      toast({
        title: "로컬 추천으로 전환했어요",
        description: "새 Supabase에 AI 함수가 없어 브라우저 안에서 답변을 만들었습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-amber-600 shadow-glow flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="AI 컨시어지 열기"
        >
          <Sparkles className="w-6 h-6 text-primary-foreground" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-lg h-[80vh] bg-card border-t border-x border-primary/30 rounded-t-2xl flex flex-col shadow-glow animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">AI 컨시어지</h3>
                  <p className="text-[10px] text-muted-foreground">퇴근한잔 큐레이터 · 항상 대기 중</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => {
                const isEmptyAssistant = m.role === "assistant" && !m.content;
                return (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}>
                      {isEmptyAssistant ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">생각 중…</span>
                        </span>
                      ) : m.content}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Suggestions */}
            {messages.length <= 2 && !loading && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-primary/20 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="p-3 border-t border-border flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="오늘 어떤 한잔이 필요하세요?"
                className="flex-1 bg-muted/60 rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                disabled={loading}
              />
              <Button type="submit" size="icon" disabled={loading || !input.trim()} className="rounded-full">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AIConcierge;
