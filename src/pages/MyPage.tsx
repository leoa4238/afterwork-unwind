import { useEffect, useState } from "react";
import { User, Star, MessageCircle, LogOut, Wine, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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

const MyPage = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [rooms, setRooms] = useState<MyRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
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
      setLoading(false);
    })();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("로그아웃되었습니다");
    navigate("/");
  };

  const toggleNetworkingDefault = async (on: boolean) => {
    if (!user) return;
    await supabase.from("profiles").update({ networking_enabled: on }).eq("user_id", user.id);
    refreshProfile();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-serif font-bold text-foreground">마이페이지</h1>
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
      </main>

      <BottomNav />
    </div>
  );
};

export default MyPage;
