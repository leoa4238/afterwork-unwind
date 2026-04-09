import { User, Heart, Clock, Shield, Bell, ChevronRight, Wine, LogIn } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const menuItems = [
  { icon: Heart, label: "찜한 바", count: 3 },
  { icon: Clock, label: "최근 본 바", count: 5 },
  { icon: Shield, label: "신고/차단 관리" },
  { icon: Bell, label: "알림 설정" },
];

const MyPage = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-serif font-bold text-foreground">마이페이지</h1>
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto space-y-6">
        {/* Profile placeholder */}
        <div className="bg-gradient-card rounded-xl p-6 border border-border shadow-card text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">로그인하고 나만의 바를 저장하세요</p>
          <Button variant="hero" size="sm" asChild>
            <Link to="/login">
              <LogIn className="w-4 h-4" />
              로그인 / 회원가입
            </Link>
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
            <Switch />
          </div>
        </div>

        {/* Menu */}
        <div className="bg-gradient-card rounded-xl border border-border overflow-hidden">
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              className={`w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors ${
                i < menuItems.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-foreground">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.count && <span className="text-xs text-primary">{item.count}</span>}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default MyPage;
