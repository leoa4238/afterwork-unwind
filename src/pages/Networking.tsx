import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, MessageCircle, Shield, MapPin, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import BottomNav from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";
import NetworkingAIMatch, { type NetworkingProfile } from "@/components/NetworkingAIMatch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Networking = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [networkingOn, setNetworkingOn] = useState(profile?.networking_enabled ?? false);
  const [aiMatches, setAiMatches] = useState<Record<string, { score: number; reason: string }>>({});
  const [users, setUsers] = useState<NetworkingProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);

  useEffect(() => {
    setNetworkingOn(profile?.networking_enabled ?? false);
  }, [profile?.networking_enabled]);

  useEffect(() => {
    if (!networkingOn) return;
    let cancelled = false;
    (async () => {
      setLoadingUsers(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, nickname, age_range, job_group, area, talk_topics, user_id")
        .eq("available_now", true)
        .eq("networking_enabled", true);
      if (cancelled) return;
      const filtered = (data || []).filter((p: any) => p.user_id !== user?.id);
      setUsers(filtered as NetworkingProfile[]);
      setLoadingUsers(false);
    })();
    return () => { cancelled = true; };
  }, [networkingOn, user?.id]);

  const orderedUsers = useMemo(() => {
    const ids = Object.keys(aiMatches);
    if (ids.length === 0) return users;
    const matched = ids
      .map((id) => users.find((u) => u.id === id))
      .filter((u): u is NetworkingProfile => Boolean(u));
    const rest = users.filter((u) => !aiMatches[u.id]);
    return [...matched, ...rest];
  }, [aiMatches, users]);

  const toggleNetworking = async (on: boolean) => {
    setNetworkingOn(on);
    if (user) {
      await supabase
        .from("profiles")
        .update({ networking_enabled: on, available_now: on })
        .eq("user_id", user.id);
      refreshProfile();
    }
  };

  const requestChat = async (target: NetworkingProfile) => {
    if (!user) return;
    setRequesting(target.id);
    // Use target user_id if exists (real user), else use profile.id (demo)
    const targetId = (target as any).user_id || target.id;
    const { data, error } = await supabase
      .from("chat_rooms")
      .insert({ user1_id: user.id, user2_id: targetId })
      .select()
      .single();
    setRequesting(null);
    if (error || !data) {
      const msg = error?.message || "";
      if (msg.includes("차단")) {
        toast.error("차단된 사용자입니다");
      } else {
        toast.error("채팅방 생성 실패");
      }
      return;
    }
    toast.success(`${target.nickname}님과의 대화가 시작됐어요 (24h)`);
    navigate(`/chat/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-serif font-bold text-foreground">네트워킹</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{networkingOn ? "ON" : "OFF"}</span>
              <Switch checked={networkingOn} onCheckedChange={toggleNetworking} />
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        {!networkingOn ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">네트워킹이 꺼져 있어요</h2>
            <p className="text-sm text-muted-foreground mb-1">혼자 조용히 즐기고 싶다면 그대로 두세요.</p>
            <p className="text-sm text-muted-foreground mb-6">가볍게 대화하고 싶을 때만 켜면 됩니다.</p>
            <Button variant="outline" onClick={() => toggleNetworking(true)}>네트워킹 켜기</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-3 border border-border flex items-start gap-2">
              <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                대화는 서비스 내에서만 진행되며, 24시간 후 자동 만료됩니다. 불쾌한 경험은 언제든 신고해주세요.
              </p>
            </div>

            {loadingUsers ? (
              <div className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>
            ) : (
              <>
                <NetworkingAIMatch users={users} onMatched={setAiMatches} />

                <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  {Object.keys(aiMatches).length > 0 ? (
                    <><Sparkles className="w-3.5 h-3.5 text-primary" /> AI 매칭 결과</>
                  ) : "가볍게 대화 가능한 근처 직장인"}
                  <span className="ml-1 text-primary">{orderedUsers.length}</span>
                </h2>

                {orderedUsers.map((u, i) => {
                  const m = aiMatches[u.id];
                  return (
                    <div
                      key={u.id}
                      className={`rounded-xl p-4 border shadow-card animate-slide-up ${
                        m ? "bg-gradient-card border-primary/40 ring-1 ring-primary/20" : "bg-gradient-card border-border"
                      }`}
                      style={{ animationDelay: `${i * 0.08}s` }}
                    >
                      {m && (
                        <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold text-primary">
                          <Sparkles className="w-3 h-3" />
                          AI 매칭 {m.score}%
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div>
                            <h3 className="font-semibold text-foreground">{u.nickname}</h3>
                            <p className="text-xs text-muted-foreground">{u.job_group} · {u.age_range}</p>
                          </div>
                          {u.area && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span>{u.area}</span>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1.5">
                            {u.talk_topics.map(topic => (
                              <Badge key={topic} variant="secondary" className="text-xs bg-secondary border-0 text-secondary-foreground">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                          {m && (
                            <p className="text-xs text-foreground/80 leading-relaxed bg-primary/5 border border-primary/20 rounded-md p-2 mt-2">
                              <span className="text-primary font-medium">AI:</span> {m.reason}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="default"
                          className="shrink-0"
                          onClick={() => requestChat(u)}
                          disabled={requesting === u.id}
                        >
                          {requesting === u.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <><MessageCircle className="w-4 h-4" /> 대화 요청</>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Networking;
