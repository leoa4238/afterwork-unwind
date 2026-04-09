import { useParams, Link } from "react-router-dom";
import { sampleBars } from "@/data/mockData";
import { ArrowLeft, Heart, MapPin, Star, Clock, Wine, Users, Sparkles, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";

import barWhiskey from "@/assets/bar-whiskey.jpg";
import barWine from "@/assets/bar-wine.jpg";
import barHighball from "@/assets/bar-highball.jpg";
import barBeer from "@/assets/bar-beer.jpg";
import barCocktail from "@/assets/bar-cocktail.jpg";
import barRetro from "@/assets/bar-retro.jpg";
import barPremium from "@/assets/bar-premium.jpg";

const barImages: Record<string, string> = {
  "1": barWhiskey, "2": barRetro, "3": barWine, "4": barBeer,
  "5": barPremium, "6": barCocktail, "7": barHighball, "8": barWine,
};

const sampleReviews = [
  { id: 1, user: "직장인A", rating: 5, content: "퇴근 후 혼자 들르기 딱 좋아요. 바텐더가 말 안 걸어서 편하고, 위스키 종류도 다양합니다.", date: "2025-12-15" },
  { id: 2, user: "야근러", rating: 4, content: "바 좌석이 편하고 조명이 좋습니다. 금요일은 좀 붐비는 편.", date: "2025-12-10" },
  { id: 3, user: "와인초보", rating: 5, content: "혼자 와도 전혀 어색하지 않은 분위기. 다시 올 예정!", date: "2025-12-08" },
];

const BarDetail = () => {
  const { id } = useParams();
  const bar = sampleBars.find((b) => b.id === id);

  if (!bar) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">바를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero image */}
      <div className="relative h-64">
        <img
          src={barImages[bar.id] || barWhiskey}
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
        {/* Basic Info */}
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

        {/* Solo Score */}
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

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {bar.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="bg-secondary border-0 text-secondary-foreground">{tag}</Badge>
          ))}
        </div>

        {/* AI Summary */}
        <div className="bg-gradient-card rounded-xl p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">AI 리뷰 요약</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{bar.aiSummary}</p>
        </div>

        {/* Networking CTA */}
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

        {/* Reviews */}
        <div>
          <h2 className="text-lg font-serif font-bold text-foreground mb-4">리뷰</h2>
          <div className="space-y-3">
            {sampleReviews.map(review => (
              <div key={review.id} className="bg-gradient-card rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{review.user}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-primary fill-primary" />
                    <span className="text-xs text-foreground">{review.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>
                <p className="text-xs text-muted-foreground mt-2">{review.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Etiquette */}
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
