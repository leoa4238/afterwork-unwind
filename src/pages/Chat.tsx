import { MessageCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const Chat = () => {
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
          <h2 className="text-lg font-semibold text-foreground mb-2">아직 대화가 없어요</h2>
          <p className="text-sm text-muted-foreground">네트워킹을 켜고 대화를 요청해보세요.</p>
          <p className="text-xs text-muted-foreground mt-4">
            대화는 24시간 후 자동 만료됩니다.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Chat;
