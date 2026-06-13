import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, MessageCircle, Shield, MapPin, Sparkles, Loader2, UserRound, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import BottomNav from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";
import NetworkingAIMatch, { type NetworkingProfile } from "@/components/NetworkingAIMatch";
import UserProfileDialog from "@/components/UserProfileDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { createDemoRoom, demoNetworkingProfiles } from "@/lib/demoAuth";
import { toast } from "sonner";

const Networking = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, isDemo } = useAuth();
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
    if (isDemo) {
      setUsers(demoNetworkingProfiles as NetworkingProfile[]);
      setLoadingUsers(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingUsers(true);
      // collect blocked user_ids (both directions) to hide
      let hidden = new Set<string>();
      if (user?.id) {
        const [{ data: outBlocks }, { data: inBlocks }] = await Promise.all([
          supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id),
          supabase.from("blocks").select("blocker_id").eq("blocked_id", user.id),
        ]);
        (outBlocks || []).forEach((b: any) => hidden.add(b.blocked_id));
        (inBlocks || []).forEach((b: any) => hidden.add(b.blocker_id));
      }
      const { data } = await supabase
        .from("profiles")
        .select("id, nickname, age_range, job_group, area, talk_topics, user_id")
        .eq("available_now", true)
        .eq("networking_enabled", true);
      if (cancelled) return;
      const filtered = (data || []).filter((p: any) => p.user_id !== user?.id && !hidden.has(p.user_id));
      setUsers(filtered as NetworkingProfile[]);
      setLoadingUsers(false);
    })();
    return () => { cancelled = true; };
  }, [networkingOn, user?.id, isDemo]);

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
    if (isDemo) return;
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
    if (isDemo) {
      const room = createDemoRoom(target as NetworkingProfile & { user_id?: string });
      toast.success(`${target.nickname}님과의 데모 대화가 시작됐어요`);
      navigate(`/chat/${room.id}`);
      return;
    }
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
              <span className="text-xs text-muted-foreground">{networkingOn ? "참여 중" : "비공개"}</span>
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
            <h2 className="text-lg font-semibold text-foreground mb-2">내 프로필이 비공개 상태예요</h2>
            <p className="text-sm text-muted-foreground mb-1">켜면 다른 사용자에게 내 프로필이 보이고</p>
            <p className="text-sm text-muted-foreground mb-6">오늘 대화 요청을 주고받을 수 있습니다.</p>
            <Button variant="outline" onClick={() => toggleNetworking(true)}>오늘 네트워킹 참여하기</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
              <div className="flex items-start gap-2">
                <Eye className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">내 프로필 공개 중</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    다른 사용자에게 내가 오늘 대화 요청을 받을 수 있는 사람으로 표시됩니다.
                  </p>
                </div>
              </div>
            </div>
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
                  ) : "오늘 대화 요청 가능한 사람"}
                  <span className="ml-1 text-primary">{orderedUsers.length}</span>
                </h2>

                {orderedUsers.length === 0 && (
                  <div className="rounded-xl border border-border bg-gradient-card p-6 text-center">
                    <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground">지금 대화 요청 가능한 사람이 없어요</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      내 프로필은 공개 중입니다. 다른 사용자가 참여하면 이 목록에 표시됩니다.
                    </p>
                  </div>
                )}

                {orderedUsers.map((u, i) => {
                  const m = aiMatches[u.id];
                  const jobGroup = u.job_group?.trim() || "직무 미설정";
                  const ageRange = u.age_range?.trim() || "연령대 미설정";
                  const topics = u.talk_topics ?? [];
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
                          <UserProfileDialog
                            profile={u}
                            onStartChat={() => requestChat(u)}
                            chatLoading={requesting === u.id}
                            chatDisabled={requesting === u.id}
                            trigger={
                              <button
                                type="button"
                                className="group flex w-full items-center gap-3 rounded-lg text-left transition-colors hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                aria-label={`${u.nickname} 프로필 보기`}
                              >
                                <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/15">
                                  <UserRound className="w-5 h-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-semibold text-foreground truncate">{u.nickname}</h3>
                                  <p className="text-xs text-muted-foreground truncate">{jobGroup} · {ageRange}</p>
                                  <p className="text-[11px] text-primary mt-0.5">대화 요청 가능 · 프로필 보기</p>
                                </div>
                              </button>
                            }
                          />
                          {u.area && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span>{u.area}</span>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1.5">
                            {topics.map(topic => (
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
