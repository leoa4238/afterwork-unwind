import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Clock, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

interface ChatRoom {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  expires_at: string;
  is_expired: boolean;
}

const Chat = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;
      setCurrentUserId(userId);

      if (userId) {
        const { data } = await supabase
          .from("chat_rooms")
          .select("*")
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .order("created_at", { ascending: false });
        if (data) setRooms(data);
      }
      setLoading(false);
    };
    init();
  }, []);

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
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-serif font-bold text-foreground">채팅</h1>
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
              const otherUserId = room.user1_id === currentUserId ? room.user2_id : room.user1_id;
              return (
                <Link
                  key={room.id}
                  to={`/chat/${room.id}`}
                  className={`block bg-gradient-card rounded-xl p-4 border border-border shadow-card transition-all ${
                    expired ? "opacity-50" : "hover:border-primary/30 hover:shadow-glow"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          대화 상대
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className={`text-xs ${expired ? "text-destructive" : "text-muted-foreground"}`}>
                            {getTimeRemaining(room.expires_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {expired && (
                      <span className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-full">만료</span>
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
