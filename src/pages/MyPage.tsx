import { useEffect, useState } from "react";
import { User, Star, MessageCircle, LogOut, Wine, Loader2, Sparkles, ShieldOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getDemoRooms } from "@/lib/demoAuth";
import { toast } from "sonner";

interface MyReview {
  id: string;
  bar_id: string;
  rating: number;
  content: string;
  created_at: string;
  bar_name?: string;
}
interface MyRoom {
  id: string;
  created_at: string;
  expires_at: string;
  is_expired: boolean;
}

interface BlockedItem {
  id: string;
  blocked_id: string;
  nickname?: string;
}

const MyPage = () => {
  const { user, profile, signOut, refreshProfile, isDemo } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [rooms, setRooms] = useState<MyRoom[]>([]);
  const [blocked, setBlocked] = useState<BlockedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBlocked = async (uid: string) => {
    const { data } = await supabase.from("blocks").select("id, blocked_id").eq("blocker_id", uid);
    let list = (data || []) as BlockedItem[];
    const ids = list.map((b) => b.blocked_id);
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, nickname").in("user_id", ids);
      const map = Object.fromEntries((profs || []).map((p: any) => [p.user_id, p.nickname]));
      list = list.map((b) => ({ ...b, nickname: map[b.blocked_id] }));
    }
    setBlocked(list);
  };

  useEffect(() => {
    if (!user) return;
    if (isDemo) {
      setReviews([
        {
          id: "demo-review-1",
          bar_id: "bar-1",
          rating: 5,
          content: "혼자 앉기 편하고 조용해서 퇴근 후 한잔하기 좋았어요.",
          created_at: new Date().toISOString(),
          bar_name: "데모 위스키 바",
        },
      ]);
      setRooms(getDemoRooms() as MyRoom[]);
      setBlocked([]);
      setLoading(false);
      return;
    }
    (async () => {
      const [rev, rm] = await Promise.all([
        supabase.from("reviews").select("id, bar_id, rating, content, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("chat_rooms").select("id, created_at, expires_at, is_expired").or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`).order("created_at", { ascending: false }),
      ]);
      let reviewList = (rev.data || []) as MyReview[];
      const barIds = [...new Set(reviewList.map(r => r.bar_id))];
      if (barIds.length) {
        const { data: bars } = await supabase.from("bars").select("id, name").in("id", barIds);
        const nameMap = Object.fromEntries((bars || []).map(b => [b.id, b.name]));
        reviewList = reviewList.map(r => ({ ...r, bar_name: nameMap[r.bar_id] }));
      }
      setReviews(reviewList);
      setRooms((rm.data || []) as MyRoom[]);
      await loadBlocked(user.id);
      setLoading(false);
    })();
  }, [user, isDemo]);

  const unblock = async (id: string) => {
    await supabase.from("blocks").delete().eq("id", id);
    setBlocked((prev) => prev.filter((b) => b.id !== id));
    toast.success("차단 해제됨");
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("로그아웃되었습니다");
    navigate("/");
  };

  const toggleNetworkingDefault = async (on: boolean) => {
    if (!user) return;
    if (isDemo) {
      toast.success(on ? "데모 네트워킹 기본값 ON" : "데모 네트워킹 기본값 OFF");
      return;
    }
    await supabase.from("profiles").update({ networking_enabled: on }).eq("user_id", user.id);
    refreshProfile();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-serif font-bold text-foreground">마이페이지</h1>
          </div>
          <NotificationBell />
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto space-y-6">
        {/* Profile */}
        <div className="bg-gradient-card rounded-xl p-6 border border-border shadow-card text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-serif font-bold text-foreground">{profile?.nickname || user?.email}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {profile?.job_group || "직무 미설정"} · {profile?.age_range || "연령대 미설정"}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" /> 로그아웃
          </Button>
        </div>

        {/* Networking default */}
        <div className="bg-gradient-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wine className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">네트워킹 기본값</p>
                <p className="text-xs text-muted-foreground">접속 시 네트워킹 자동 ON/OFF</p>
              </div>
            </div>
            <Switch checked={profile?.networking_enabled ?? false} onCheckedChange={toggleNetworkingDefault} />
          </div>
        </div>

        {/* My reviews */}
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-primary" /> 내 리뷰 ({reviews.length})
          </h3>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary mx-auto my-4" />
          ) : reviews.length === 0 ? (
            <p className="text-xs text-muted-foreground">아직 작성한 리뷰가 없어요</p>
          ) : (
            <div className="space-y-2">
              {reviews.map(r => (
                <Link
                  key={r.id}
                  to={`/bar/${r.bar_id}`}
                  className="block bg-gradient-card rounded-xl p-3 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{r.bar_name || r.bar_id}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-primary fill-primary" />
                      <span className="text-xs text-foreground">{r.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{r.content}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* My chat rooms */}
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-primary" /> 내 채팅 ({rooms.length})
          </h3>
          {loading ? null : rooms.length === 0 ? (
            <p className="text-xs text-muted-foreground">아직 진행 중인 대화가 없어요</p>
          ) : (
            <div className="space-y-2">
              {rooms.slice(0, 5).map(r => {
                const expired = r.is_expired || new Date(r.expires_at) <= new Date();
                return (
                  <Link
                    key={r.id}
                    to={`/chat/${r.id}`}
                    className={`block bg-gradient-card rounded-xl p-3 border border-border ${expired ? "opacity-50" : "hover:border-primary/30"}`}
                  >
                    <p className="text-sm text-foreground">1:1 대화</p>
                    <p className="text-[11px] text-muted-foreground">
                      {expired ? "만료됨" : "진행 중"} · {new Date(r.created_at).toLocaleString("ko-KR")}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Blocked users */}
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <ShieldOff className="w-4 h-4 text-primary" /> 차단 목록 ({blocked.length})
          </h3>
          {blocked.length === 0 ? (
            <p className="text-xs text-muted-foreground">차단한 사용자가 없어요</p>
          ) : (
            <div className="space-y-2">
              {blocked.map((b) => (
                <div key={b.id} className="flex items-center justify-between bg-gradient-card rounded-xl p-3 border border-border">
                  <span className="text-sm text-foreground">{b.nickname || "알 수 없는 사용자"}</span>
                  <Button size="sm" variant="outline" onClick={() => unblock(b.id)}>해제</Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Admin: AI Crawler */}
        <Link
          to="/admin"
          className="block bg-gradient-card rounded-xl p-4 border border-border hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">AI 바 크롤러</p>
              <p className="text-xs text-muted-foreground">URL 한 줄로 새 바 자동 등록</p>
            </div>
            <span className="text-xs text-primary">→</span>
          </div>
        </Link>
      </main>

      <BottomNav />
    </div>
  );
};

export default MyPage;
