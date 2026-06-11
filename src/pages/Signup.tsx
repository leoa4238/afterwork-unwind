import { useState } from "react";
import { Mail, Lock, User, Briefcase, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const jobGroups = ["IT/개발", "마케팅", "금융", "디자인", "기획/PM", "영업", "인사", "기타"];
const ageRanges = ["20대 초반", "20대 후반", "30대 초반", "30대 중반", "30대 후반", "40대 이상"];

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [selectedAge, setSelectedAge] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !nickname) {
      toast.error("이메일, 비밀번호, 닉네임은 필수예요");
      return;
    }
    setLoading(true);
    const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${basePath}/explore`,
        data: {
          nickname,
          age_range: selectedAge,
          job_group: selectedJob,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("가입 완료! 바로 시작할 수 있어요");
    navigate("/explore", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <form onSubmit={handleSignup} className="max-w-sm mx-auto space-y-6">
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> 돌아가기
        </Link>

        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground mb-1">회원가입</h1>
          <p className="text-sm text-muted-foreground">간단한 정보만 입력하면 시작할 수 있어요</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
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
              placeholder="비밀번호 (6자 이상)"
              minLength={6}
              required
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임"
              required
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>

          <div>
            <p className="text-sm text-foreground mb-2">연령대</p>
            <div className="flex flex-wrap gap-2">
              {ageRanges.map(age => (
                <Badge
                  key={age}
                  onClick={() => setSelectedAge(age)}
                  variant="outline"
                  className={`cursor-pointer text-xs ${selectedAge === age ? "bg-primary/20 text-primary border-primary/40" : "text-muted-foreground"}`}
                >
                  {age}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-foreground mb-2">직무군</p>
            <div className="flex flex-wrap gap-2">
              {jobGroups.map(job => (
                <Badge
                  key={job}
                  onClick={() => setSelectedJob(job)}
                  variant="outline"
                  className={`cursor-pointer text-xs ${selectedJob === job ? "bg-primary/20 text-primary border-primary/40" : "text-muted-foreground"}`}
                >
                  {job}
                </Badge>
              ))}
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-3 border border-border">
            <p className="text-xs text-muted-foreground">
              ℹ️ 네트워킹 기능은 기본 OFF로 설정됩니다. 마이페이지에서 언제든 변경할 수 있어요.
            </p>
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "가입하기"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Signup;
