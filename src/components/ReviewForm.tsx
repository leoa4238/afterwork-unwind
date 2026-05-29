import { useState } from "react";
import { Star, Loader2, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  barId: string;
  onAdded?: () => void;
}

const ReviewForm = ({ barId, onAdded }: Props) => {
  const { user, profile } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="bg-gradient-card rounded-xl p-4 border border-border flex items-center justify-between">
        <p className="text-sm text-muted-foreground">로그인하면 리뷰를 남길 수 있어요</p>
        <Button size="sm" variant="outline" asChild>
          <Link to="/login"><LogIn className="w-4 h-4" /> 로그인</Link>
        </Button>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !content.trim()) {
      toast.error("별점과 내용을 모두 입력해주세요");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      bar_id: barId,
      user_id: user.id,
      user_name: profile?.nickname || user.email?.split("@")[0] || "익명",
      rating,
      content: content.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast.error("리뷰 등록 실패: " + error.message);
      return;
    }
    setRating(0);
    setContent("");
    toast.success("리뷰가 등록되었어요");
    onAdded?.();
  };

  return (
    <form onSubmit={submit} className="bg-gradient-card rounded-xl p-4 border border-border space-y-3">
      <p className="text-sm font-medium text-foreground">리뷰 남기기</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="p-0.5"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                n <= (hover || rating) ? "text-primary fill-primary" : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
        {rating > 0 && <span className="text-xs text-muted-foreground ml-2">{rating}점</span>}
      </div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="어떤 점이 좋았나요? (200자 이내)"
        maxLength={200}
        rows={3}
        className="bg-background/60 border-border resize-none"
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={submitting || !rating || !content.trim()}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "등록"}
        </Button>
      </div>
    </form>
  );
};

export default ReviewForm;
