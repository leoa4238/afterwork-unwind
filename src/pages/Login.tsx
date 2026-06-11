import { useState } from "react";
import { Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/explore";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "이메일 또는 비밀번호가 올바르지 않아요" : error.message);
      return;
    }
    toast.success("로그인되었습니다");
    navigate(from, { replace: true });
  };

  const handleGoogle = async () => {
    setLoading(true);
    const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + basePath + from,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Google 로그인에 실패했어요");
      return;
    }
    if (result.redirected) return;
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">퇴근한잔</h1>
          <p className="text-sm text-muted-foreground">퇴근 후, 나만의 한잔을 찾아보세요</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              autoComplete="email"
              required
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              autoComplete="current-password"
              required
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "로그인"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">또는</span></div>
        </div>

        <Button variant="outline" size="lg" className="w-full" onClick={handleGoogle} disabled={loading}>
          Google로 시작하기
        </Button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            아직 계정이 없으신가요?{" "}
            <Link to="/signup" className="text-primary hover:underline">회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
