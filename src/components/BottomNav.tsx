import { Link, useLocation } from "react-router-dom";
import { Home, Search, Users, User, MessageCircle } from "lucide-react";

const navItems = [
  { path: "/", icon: Home, label: "홈" },
  { path: "/explore", icon: Search, label: "탐색" },
  { path: "/networking", icon: Users, label: "네트워킹" },
  { path: "/chat", icon: MessageCircle, label: "채팅" },
  { path: "/mypage", icon: User, label: "MY" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
