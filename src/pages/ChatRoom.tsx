import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Shield, AlertTriangle, Clock, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import NotificationBell from "@/components/NotificationBell";
import ReportDialog from "@/components/ReportDialog";
import BlockDialog from "@/components/BlockDialog";
import UserProfileDialog, { type UserProfilePreview } from "@/components/UserProfileDialog";
import { useAuth } from "@/hooks/useAuth";
import { addDemoMessage, DEMO_USER_ID, demoNetworkingProfiles, getDemoMessages, getDemoRooms } from "@/lib/demoAuth";
import { buildLocalChatReply } from "@/lib/localAi";

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

const QUICK_REPLIES = [
  "오늘은 조용한 곳이 좋아요",
  "지역은 어디가 편하세요?",
  "가볍게 한 잔만 할까요?",
  "첫 잔은 하이볼 어때요?",
];

const ChatRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { isDemo, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherNickname, setOtherNickname] = useState<string>("");
  const [otherProfile, setOtherProfile] = useState<UserProfilePreview | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [sending, setSending] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const otherUserId = room && currentUserId
    ? room.user1_id === currentUserId ? room.user2_id : room.user1_id
    : null;

  // Get current user
  useEffect(() => {
    if (isDemo && user) {
      setCurrentUserId(user.id);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user?.id || null);
    });
  }, [isDemo, user]);

  // Fetch room info
  useEffect(() => {
    if (!roomId) return;
    if (isDemo) {
      const demoRoom = getDemoRooms().find((item) => item.id === roomId);
      if (demoRoom) {
        setRoom(demoRoom);
        setOtherNickname(demoRoom.other_nickname);
        const demoProfile = demoNetworkingProfiles.find((item) => item.user_id === demoRoom.user2_id || item.id === demoRoom.user2_id);
        setOtherProfile(demoProfile ?? {
          id: demoRoom.user2_id,
          user_id: demoRoom.user2_id,
          nickname: demoRoom.other_nickname,
          talk_topics: [],
        });
        setIsExpired(demoRoom.is_expired || new Date(demoRoom.expires_at) <= new Date());
      }
      return;
    }
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
  }, [roomId, isDemo]);

  // Fetch other user's profile
  useEffect(() => {
    if (isDemo) return;
    if (!otherUserId) return;
    supabase
      .from("profiles")
      .select("id, user_id, nickname, age_range, job_group, area, talk_topics, available_now, networking_enabled")
      .eq("user_id", otherUserId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.nickname) setOtherNickname(data.nickname);
        setOtherProfile((data as UserProfilePreview | null) ?? null);
    });
  }, [otherUserId, isDemo]);

  // Fetch messages
  useEffect(() => {
    if (!roomId) return;
    if (isDemo) {
      setMessages(getDemoMessages(roomId) as Message[]);
      return;
    }
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();
  }, [roomId, isDemo]);

  // Real-time subscription
  useEffect(() => {
    if (isDemo) return;
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
          if (newMsg.sender_id !== currentUserId) setBotTyping(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, isDemo, currentUserId]);

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

  const appendLocalBotReply = (content: string) => {
    const senderId = otherUserId || room?.user2_id || "local-chatbot";
    const recentReplies = messages
      .filter((message) => message.sender_id !== currentUserId)
      .map((message) => message.content);
    const reply: Message = {
      id: `local-chatbot-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sender_id: senderId,
      content: buildLocalChatReply(content, otherNickname || "상대", { recentReplies }),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, reply]);
    setBotTyping(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !roomId || !currentUserId || isExpired || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    if (isDemo && room) {
      const mine = addDemoMessage(room, DEMO_USER_ID, content) as Message;
      setMessages((prev) => [...prev, mine]);
      setSending(false);
      inputRef.current?.focus();
      setBotTyping(true);

      window.setTimeout(() => {
        const reply = addDemoMessage(
          room,
          otherUserId || room.user2_id,
          buildLocalChatReply(content, otherNickname || "상대", {
            recentReplies: messages
              .filter((message) => message.sender_id !== currentUserId)
              .map((message) => message.content),
          })
        ) as Message;
        setMessages((prev) => [...prev, reply]);
        setBotTyping(false);
      }, 500);
      return;
    }

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
    setBotTyping(true);

    // Prefer the server-side AI reply when deployed; fall back locally for the submitted demo.
    window.setTimeout(async () => {
      try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke("ai-chat-reply", {
          body: { roomId, message: content },
        });
        if (fnError) throw fnError;
        if (fnData?.message) {
          const reply = fnData.message as Message;
          setMessages((prev) => (prev.some((m) => m.id === reply.id) ? prev : [...prev, reply]));
          setBotTyping(false);
          return;
        }
        if (fnData?.skipped) {
          appendLocalBotReply(content);
          return;
        }
        window.setTimeout(() => setBotTyping(false), 1500);
      } catch (e) {
        console.error("ai-chat-reply fallback", e);
        appendLocalBotReply(content);
      }
    }, 500);
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
            <UserProfileDialog
              profile={otherProfile ?? {
                user_id: otherUserId,
                nickname: otherNickname || "1:1 대화",
                talk_topics: [],
              }}
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg text-left transition-colors hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label="상대 프로필 보기"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <UserRound className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-sm font-semibold text-foreground">{otherNickname || "1:1 대화"}</h1>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className={`text-xs ${isExpired ? "text-destructive" : "text-muted-foreground"}`}>
                        {timeLeft || "계산 중..."}
                      </span>
                    </div>
                  </div>
                </button>
              }
            />
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setReportOpen(true)}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-destructive/20 transition"
              title="신고"
              disabled={!otherUserId}
            >
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => setBlockOpen(true)}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-destructive/20 transition"
              title="차단"
              disabled={!otherUserId}
            >
              <Shield className="w-4 h-4 text-muted-foreground" />
            </button>
            <NotificationBell />
          </div>
        </div>
      </header>

      {otherUserId && currentUserId && (
        <>
          <ReportDialog
            open={reportOpen}
            onOpenChange={setReportOpen}
            reporterId={currentUserId}
            reportedUserId={otherUserId}
            roomId={roomId}
          />
          <BlockDialog
            open={blockOpen}
            onOpenChange={setBlockOpen}
            blockerId={currentUserId}
            blockedId={otherUserId}
            blockedNickname={otherNickname}
            onBlocked={() => navigate("/chat")}
          />
        </>
      )}

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
              <p className="text-sm text-muted-foreground">대화를 시작해보세요</p>
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
          {botTyping && (
            <div className="flex justify-start">
              <div className="max-w-[75%]">
                <div className="rounded-2xl rounded-bl-md px-4 py-2.5 text-sm leading-relaxed bg-secondary text-secondary-foreground">
                  답변 작성 중...
                </div>
              </div>
            </div>
          )}
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
            <>
              <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => {
                      setNewMessage(reply);
                      window.setTimeout(() => inputRef.current?.focus(), 0);
                    }}
                    className="shrink-0 rounded-full border border-primary/20 bg-secondary px-3 py-1.5 text-[11px] text-secondary-foreground transition-colors hover:border-primary/50 hover:bg-primary/10"
                    disabled={sending}
                  >
                    {reply}
                  </button>
                ))}
              </div>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
