import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Clock, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { getDemoRooms } from "@/lib/demoAuth";

interface ChatRoom {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  expires_at: string;
  is_expired: boolean;
  other_nickname?: string;
  last_message?: string;
}

const Chat = () => {
  const { user, isDemo } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (isDemo && user) {
        setCurrentUserId(user.id);
        setRooms(getDemoRooms() as ChatRoom[]);
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;
      setCurrentUserId(userId);

      if (userId) {
        const { data } = await supabase
          .from("chat_rooms")
          .select("*")
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .order("created_at", { ascending: false });
        const baseRooms = (data || []) as ChatRoom[];

        // Fetch other nicknames + last messages in parallel
        const otherIds = [...new Set(baseRooms.map((r) => (r.user1_id === userId ? r.user2_id : r.user1_id)))];
        const roomIds = baseRooms.map((r) => r.id);
        const [{ data: profs }, { data: msgs }] = await Promise.all([
          otherIds.length
            ? supabase.from("profiles").select("user_id, nickname").in("user_id", otherIds)
            : Promise.resolve({ data: [] as any }),
          roomIds.length
            ? supabase.from("chat_messages").select("room_id, content, created_at").in("room_id", roomIds).order("created_at", { ascending: false })
            : Promise.resolve({ data: [] as any }),
        ]);
        const nickMap = Object.fromEntries((profs || []).map((p: any) => [p.user_id, p.nickname]));
        const lastMap: Record<string, string> = {};
        (msgs || []).forEach((m: any) => {
          if (!lastMap[m.room_id]) lastMap[m.room_id] = m.content;
        });
        setRooms(baseRooms.map((r) => ({
          ...r,
          other_nickname: nickMap[r.user1_id === userId ? r.user2_id : r.user1_id],
          last_message: lastMap[r.id],
        })));
      }
      setLoading(false);
    };
    init();
  }, [isDemo, user]);

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "만료됨";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}시간 ${minutes}분 남음`;
  };

  const isRoomExpired = (room: ChatRoom) => {
    return room.is_expired || new Date(room.expires_at) <= new Date();
  };

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 glass border-b border-border px-4 py-4">
          <div className="max-w-lg mx-auto flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-serif font-bold text-foreground">채팅</h1>
          </div>
        </header>
        <main className="px-4 py-4 max-w-lg mx-auto">
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">로그인이 필요해요</h2>
            <p className="text-sm text-muted-foreground mb-4">로그인 후 대화를 시작할 수 있어요</p>
            <Button variant="hero" size="sm" asChild>
              <Link to="/login">로그인하기</Link>
            </Button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-serif font-bold text-foreground">채팅</h1>
          </div>
          <NotificationBell />
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        {loading ? (
          <div className="text-center py-20">
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">아직 대화가 없어요</h2>
            <p className="text-sm text-muted-foreground">네트워킹을 켜고 대화를 요청해보세요.</p>
            <p className="text-xs text-muted-foreground mt-4">대화는 24시간 후 자동 만료됩니다.</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link to="/networking">
                <Wine className="w-4 h-4" />
                네트워킹 페이지로
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => {
              const expired = isRoomExpired(room);
              return (
                <Link
                  key={room.id}
                  to={`/chat/${room.id}`}
                  className={`block bg-gradient-card rounded-xl p-4 border border-border shadow-card transition-all ${
                    expired ? "opacity-50" : "hover:border-primary/30 hover:shadow-glow"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {room.other_nickname || "대화 상대"}
                        </p>
                        {room.last_message && (
                          <p className="text-xs text-muted-foreground truncate">{room.last_message}</p>
                        )}
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className={`text-xs ${expired ? "text-destructive" : "text-muted-foreground"}`}>
                            {getTimeRemaining(room.expires_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {expired && (
                      <span className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-full shrink-0">만료</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Chat;
