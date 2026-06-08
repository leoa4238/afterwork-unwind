import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Shield, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import NotificationBell from "@/components/NotificationBell";
import ReportDialog from "@/components/ReportDialog";
import BlockDialog from "@/components/BlockDialog";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface RoomInfo {
  id: string;
  expires_at: string;
  is_expired: boolean;
  user1_id: string;
  user2_id: string;
}

const ChatRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherNickname, setOtherNickname] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [sending, setSending] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const otherUserId = room && currentUserId
    ? room.user1_id === currentUserId ? room.user2_id : room.user1_id
    : null;

  // Get current user
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user?.id || null);
    });
  }, []);

  // Fetch room info
  useEffect(() => {
    if (!roomId) return;
    const fetchRoom = async () => {
      const { data, error } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("id", roomId)
        .single();
      if (data) {
        setRoom(data);
        setIsExpired(data.is_expired || new Date(data.expires_at) <= new Date());
      }
    };
    fetchRoom();
  }, [roomId]);

  // Fetch messages
  useEffect(() => {
    if (!roomId) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();
  }, [roomId]);

  // Real-time subscription
  useEffect(() => {
    if (!roomId) return;
    const channel = supabase
      .channel(`room-${roomId}`, { config: { private: true } })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Countdown timer
  useEffect(() => {
    if (!room) return;
    const interval = setInterval(() => {
      const now = new Date();
      const expires = new Date(room.expires_at);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("만료됨");
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}시간 ${minutes}분 ${seconds}초`);
    }, 1000);

    return () => clearInterval(interval);
  }, [room]);

  const handleSend = async () => {
    if (!newMessage.trim() || !roomId || !currentUserId || isExpired || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ room_id: roomId, sender_id: currentUserId, content })
      .select()
      .single();

    if (error || !data) {
      toast.error("메시지 전송에 실패했습니다");
      setNewMessage(content);
      setSending(false);
      inputRef.current?.focus();
      return;
    }
    // Optimistic append (dedupe with realtime)
    setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data as Message]));
    setSending(false);
    inputRef.current?.focus();

    // Fire-and-forget AI reply (only triggers when the other side is a demo profile)
    supabase.functions.invoke("ai-chat-reply", { body: { roomId } }).catch((e) => {
      console.error("ai-chat-reply", e);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="glass border-b border-border px-4 py-3 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/chat" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </Link>
            <div>
              <h1 className="text-sm font-semibold text-foreground">1:1 대화</h1>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className={`text-xs ${isExpired ? "text-destructive" : "text-muted-foreground"}`}>
                  {timeLeft || "계산 중..."}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center" title="신고">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center" title="차단">
              <Shield className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Safety notice */}
      <div className="px-4 py-2 max-w-lg mx-auto w-full">
        <div className="bg-muted/50 rounded-lg p-2 flex items-center gap-2">
          <Shield className="w-3 h-3 text-primary shrink-0" />
          <p className="text-[10px] text-muted-foreground">
            대화는 {timeLeft || "24시간"} 후 자동 만료됩니다. 불쾌한 경험은 신고해주세요.
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">대화를 시작해보세요 🍻</p>
              <p className="text-xs text-muted-foreground mt-1">가볍게 인사부터!</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] ${isMine ? "order-2" : ""}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-secondary-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className={`text-[10px] text-muted-foreground mt-1 ${isMine ? "text-right" : "text-left"}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="glass border-t border-border px-4 py-3">
        <div className="max-w-lg mx-auto">
          {isExpired ? (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">대화가 만료되었습니다</p>
              <p className="text-xs text-muted-foreground mt-0.5">새로운 대화를 시작해보세요</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="메시지를 입력하세요..."
                className="flex-1 h-10 px-4 rounded-full bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
              <Button
                size="icon"
                variant="default"
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                className="rounded-full w-10 h-10 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
