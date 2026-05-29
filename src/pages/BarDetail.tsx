import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Bar } from "@/data/mockData";
import { ArrowLeft, Heart, MapPin, Star, Clock, Wine, Users, Sparkles, Share2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";
import BarAIInsights from "@/components/BarAIInsights";
import ReviewForm from "@/components/ReviewForm";

import barWhiskey from "@/assets/bar-whiskey.jpg";
import barWine from "@/assets/bar-wine.jpg";
import barHighball from "@/assets/bar-highball.jpg";
import barBeer from "@/assets/bar-beer.jpg";
import barCocktail from "@/assets/bar-cocktail.jpg";
import barRetro from "@/assets/bar-retro.jpg";
import barPremium from "@/assets/bar-premium.jpg";

const imageByKey: Record<string, string> = {
  whiskey: barWhiskey, retro: barRetro, wine: barWine, beer: barBeer,
  premium: barPremium, cocktail: barCocktail, highball: barHighball,
};

interface Review {
  id: string;
  user_name: string;
  rating: number;
  content: string;
  created_at: string;
}

const BarDetail = () => {
  const { id } = useParams();
  const [bar, setBar] = useState<Bar | null>(null);
  const [imageKey, setImageKey] = useState<string>("whiskey");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    (async () => {
      const [{ data: barRow, error: barErr }, { data: tagRows }, { data: reviewRows }] = await Promise.all([
        supabase.from("bars").select("*").eq("id", id).maybeSingle(),
        supabase.from("bar_tags").select("tag").eq("bar_id", id),
        supabase.from("reviews").select("id, user_name, rating, content, created_at").eq("bar_id", id).order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;
      if (barErr || !barRow) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const tags = (tagRows || []).map((t: any) => t.tag);
      setImageKey(barRow.image_key || "whiskey");
      setBar({
        id: barRow.id,
        name: barRow.name,
        address: barRow.address,
        area: barRow.area,
        category: barRow.category,
        priceRange: barRow.price_range,
        isOpenNow: barRow.is_open_now,
        soloFriendlyScore: barRow.solo_friendly_score,
        quietScore: barRow.quiet_score,
        networkingFriendly: barRow.networking_friendly,
        tags,
        aiSummary: barRow.ai_summary || "",
        rating: Number(barRow.rating),
        reviewCount: barRow.review_count,
        distance: barRow.distance || "",
        imageUrl: "",
      });
      setReviews((reviewRows || []) as Review[]);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !bar) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">바를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative h-64">
        <img
          src={imageByKey[imageKey] || barWhiskey}
          alt={bar.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Link to="/explore" className="w-10 h-10 rounded-full glass flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full glass flex items-center justify-center">
              <Share2 className="w-5 h-5 text-foreground" />
            </button>
            <button className="w-10 h-10 rounded-full glass flex items-center justify-center">
              <Heart className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 relative z-10 max-w-lg mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {bar.isOpenNow && (
              <Badge className="bg-emerald-600/90 border-0 text-foreground text-xs">영업 중</Badge>
            )}
            <span className="text-xs text-muted-foreground">{bar.category}</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground">{bar.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{bar.address}</span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="font-medium text-foreground">{bar.rating}</span>
              <span className="text-muted-foreground">({bar.reviewCount})</span>
            </span>
            <span className="text-sm text-muted-foreground">{bar.priceRange}</span>
            <span className="text-sm text-muted-foreground">{bar.distance}</span>
          </div>
        </div>

        <div className="bg-gradient-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground flex items-center gap-2">
              <Wine className="w-4 h-4 text-primary" /> 혼술 적합도
            </span>
            <span className="text-lg font-bold text-primary">{bar.soloFriendlyScore}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-gold rounded-full transition-all" style={{ width: `${bar.soloFriendlyScore}%` }} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {bar.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="bg-secondary border-0 text-secondary-foreground">{tag}</Badge>
          ))}
        </div>

        <BarAIInsights bar={bar} />

        <div className="bg-gradient-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">리뷰 한줄 요약</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{bar.aiSummary}</p>
        </div>

        {bar.networkingFriendly && (
          <Link to="/networking">
            <div className="bg-gradient-card rounded-xl p-4 border border-border hover:border-primary/30 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">이곳에서 대화 가능한 직장인 보기</p>
                  <p className="text-xs text-muted-foreground">가볍게 대화하고 싶을 때만</p>
                </div>
              </div>
            </div>
          </Link>
        )}

        <div>
          <h2 className="text-lg font-serif font-bold text-foreground mb-4">리뷰 ({reviews.length})</h2>
          <div className="space-y-3">
            {reviews.length === 0 && (
              <p className="text-xs text-muted-foreground">아직 리뷰가 없습니다.</p>
            )}
            {reviews.map(review => (
              <div key={review.id} className="bg-gradient-card rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{review.user_name}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-primary fill-primary" />
                    <span className="text-xs text-foreground">{review.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(review.created_at).toLocaleDateString("ko-KR")}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            💡 <strong className="text-foreground">에티켓 안내</strong> — 혼자 오신 분들이 편안하게 즐길 수 있도록, 불필요한 말 걸기는 자제해주세요. 네트워킹은 서비스 내에서만 진행됩니다.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default BarDetail;
