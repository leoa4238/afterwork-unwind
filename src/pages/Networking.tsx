import { useState } from "react";
import { sampleNetworkingUsers } from "@/data/mockData";
import { Users, MessageCircle, Shield, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import BottomNav from "@/components/BottomNav";

const Networking = () => {
  const [networkingOn, setNetworkingOn] = useState(false);

  const availableUsers = sampleNetworkingUsers.filter((u) => u.availableNow);

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
              <Switch checked={networkingOn} onCheckedChange={setNetworkingOn} />
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
            <Button variant="outline" onClick={() => setNetworkingOn(true)}>네트워킹 켜기</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Safety notice */}
            <div className="bg-muted/50 rounded-xl p-3 border border-border flex items-start gap-2">
              <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                대화는 서비스 내에서만 진행되며, 일정 시간 후 자동 만료됩니다. 불쾌한 경험은 언제든 신고해주세요.
              </p>
            </div>

            <h2 className="text-sm font-medium text-muted-foreground">
              가볍게 대화 가능한 근처 직장인 <span className="text-primary">{availableUsers.length}</span>
            </h2>

            {availableUsers.map((user, i) => (
              <div
                key={user.id}
                className="bg-gradient-card rounded-xl p-4 border border-border shadow-card animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{user.nickname}</h3>
                      <p className="text-xs text-muted-foreground">{user.jobGroup} · {user.ageRange}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{user.area}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {user.talkTopics.map(topic => (
                        <Badge key={topic} variant="secondary" className="text-xs bg-secondary border-0 text-secondary-foreground">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" variant="default" className="shrink-0">
                    <MessageCircle className="w-4 h-4" />
                    대화 요청
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Networking;
