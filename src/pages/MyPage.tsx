import { useEffect, useState } from "react";
import { User, Star, MessageCircle, LogOut, Wine, Loader2, Sparkles, ShieldOff, Save, MapPin, Briefcase } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const splitTopics = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);

const MyPage = () => {
  const { user, profile, signOut, refreshProfile, isDemo } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [rooms, setRooms] = useState<MyRoom[]>([]);
  const [blocked, setBlocked] = useState<BlockedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nickname: "",
    job_group: "",
    age_range: "",
    area: "",
    talk_topics: "",
  });

  useEffect(() => {
    if (!profile) return;
    setProfileForm({
      nickname: profile.nickname || "",
      job_group: profile.job_group || "",
      age_range: profile.age_range || "",
      area: profile.area || "",
      talk_topics: (profile.talk_topics ?? []).join(", "),
    });
  }, [profile]);

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
      toast.success(on ? "체험 프로필을 네트워킹 목록에 공개했어요" : "체험 프로필을 비공개로 바꿨어요");
      return;
    }
    await supabase.from("profiles").update({ networking_enabled: on, available_now: on ? profile?.available_now ?? true : false }).eq("user_id", user.id);
    refreshProfile();
  };

  const toggleAvailableNow = async (on: boolean) => {
    if (!user) return;
    if (isDemo) {
      toast.success(on ? "체험 프로필이 대화 요청을 받을 수 있어요" : "체험 프로필이 대화 요청을 받지 않도록 바뀌었어요");
      return;
    }
    await supabase.from("profiles").update({ available_now: on, networking_enabled: on ? true : profile?.networking_enabled ?? false }).eq("user_id", user.id);
    refreshProfile();
  };

  const updateProfileForm = (field: keyof typeof profileForm, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    if (!user) return;
    const nickname = profileForm.nickname.trim();
    if (!nickname) {
      toast.error("닉네임을 입력해주세요");
      return;
    }

    const payload = {
      nickname,
      job_group: profileForm.job_group.trim() || null,
      age_range: profileForm.age_range.trim() || null,
      area: profileForm.area.trim() || "서울",
      talk_topics: splitTopics(profileForm.talk_topics),
    };

    if (isDemo) {
      toast.success("체험용 프로필 저장 흐름을 확인했어요");
      return;
    }

    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("user_id", user.id);
    setSavingProfile(false);

    if (error) {
      toast.error("프로필 저장에 실패했습니다");
      return;
    }

    await refreshProfile();
    toast.success("매칭 프로필을 저장했어요");
  };

  const topicCount = splitTopics(profileForm.talk_topics).length;
  const profileCompletion = Math.round(
    [
      profileForm.nickname.trim(),
      profileForm.job_group.trim(),
      profileForm.age_range.trim(),
      profileForm.area.trim(),
      topicCount > 0 ? "topics" : "",
    ].filter(Boolean).length / 5 * 100,
  );

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

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gradient-card rounded-xl p-3 border border-border text-center">
            <p className="text-lg font-bold text-primary">{reviews.length}</p>
            <p className="text-[11px] text-muted-foreground">작성 리뷰</p>
          </div>
          <div className="bg-gradient-card rounded-xl p-3 border border-border text-center">
            <p className="text-lg font-bold text-primary">{rooms.length}</p>
            <p className="text-[11px] text-muted-foreground">대화방</p>
          </div>
          <div className="bg-gradient-card rounded-xl p-3 border border-border text-center">
            <p className="text-lg font-bold text-primary">{profileCompletion}%</p>
            <p className="text-[11px] text-muted-foreground">프로필</p>
          </div>
        </div>

        <section className="bg-gradient-card rounded-xl p-4 border border-border space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" /> 내 매칭 프로필
              </h3>
              <p className="text-xs text-muted-foreground mt-1">네트워킹 추천에 쓰이는 정보를 관리합니다.</p>
            </div>
            <span className="text-xs font-semibold text-primary">{profileCompletion}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${profileCompletion}%` }} />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="profile-nickname" className="text-xs">닉네임</Label>
              <Input
                id="profile-nickname"
                value={profileForm.nickname}
                onChange={(e) => updateProfileForm("nickname", e.target.value)}
                placeholder="예: 퇴근러"
                className="bg-background/60"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="profile-job" className="text-xs flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-primary" /> 직무
                </Label>
                <Input
                  id="profile-job"
                  value={profileForm.job_group}
                  onChange={(e) => updateProfileForm("job_group", e.target.value)}
                  placeholder="IT/개발"
                  className="bg-background/60"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-age" className="text-xs">연령대</Label>
                <Input
                  id="profile-age"
                  value={profileForm.age_range}
                  onChange={(e) => updateProfileForm("age_range", e.target.value)}
                  placeholder="20대 후반"
                  className="bg-background/60"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-area" className="text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary" /> 선호 지역
              </Label>
              <Input
                id="profile-area"
                value={profileForm.area}
                onChange={(e) => updateProfileForm("area", e.target.value)}
                placeholder="강남, 성수, 잠실"
                className="bg-background/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-topics" className="text-xs">관심 대화 주제</Label>
              <Textarea
                id="profile-topics"
                value={profileForm.talk_topics}
                onChange={(e) => updateProfileForm("talk_topics", e.target.value)}
                placeholder="사이드프로젝트, 위스키, 전시"
                className="min-h-[72px] bg-background/60"
              />
              <p className="text-[11px] text-muted-foreground">쉼표로 구분해 최대 8개까지 저장됩니다.</p>
            </div>
          </div>

          <Button onClick={saveProfile} disabled={savingProfile} className="w-full">
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            매칭 프로필 저장
          </Button>
        </section>

        {/* Networking visibility */}
        <div className="bg-gradient-card rounded-xl p-4 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wine className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">네트워킹 프로필 공개</p>
                <p className="text-xs text-muted-foreground">켜면 다른 사용자에게 내 프로필이 보입니다</p>
              </div>
            </div>
            <Switch checked={profile?.networking_enabled ?? false} onCheckedChange={toggleNetworkingDefault} />
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">대화 요청 받기</p>
                <p className="text-xs text-muted-foreground">켜면 다른 사용자가 나에게 1:1 대화를 요청할 수 있습니다</p>
              </div>
            </div>
            <Switch checked={profile?.available_now ?? false} onCheckedChange={toggleAvailableNow} />
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

        {/* Admin: data manager */}
        <Link
          to="/admin"
          className="block bg-gradient-card rounded-xl p-4 border border-border hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">관리자 데이터 관리</p>
              <p className="text-xs text-muted-foreground">바 정보 등록·수정·삭제</p>
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
