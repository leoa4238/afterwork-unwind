import { Wine, MapPin, Star, Heart, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type Bar } from "@/data/mockData";
import { Link } from "react-router-dom";

import barWhiskey from "@/assets/bar-whiskey.jpg";
import barWine from "@/assets/bar-wine.jpg";
import barHighball from "@/assets/bar-highball.jpg";
import barBeer from "@/assets/bar-beer.jpg";
import barCocktail from "@/assets/bar-cocktail.jpg";
import barRetro from "@/assets/bar-retro.jpg";
import barPremium from "@/assets/bar-premium.jpg";

const barImages: Record<string, string> = {
  "1": barWhiskey,
  "2": barRetro,
  "3": barWine,
  "4": barBeer,
  "5": barPremium,
  "6": barCocktail,
  "7": barHighball,
  "8": barWine,
};

interface BarCardProps {
  bar: Bar;
  aiMatch?: { score: number; reason: string; rank?: number };
}

const BarCard = ({ bar, aiMatch }: BarCardProps) => {
  return (
    <Link to={`/bar/${bar.id}`} className="block group">
      <div className={`bg-gradient-card rounded-xl overflow-hidden border shadow-card hover:shadow-glow transition-all duration-300 ${aiMatch ? "border-primary/50 ring-1 ring-primary/30" : "border-border hover:border-primary/30"}`}>
        {aiMatch && (
          <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-b border-primary/20">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
              <Sparkles className="w-3 h-3" />
              {aiMatch.rank ? `AI 추천 #${aiMatch.rank}` : "AI 추천"}
              <span className="text-foreground/80">· 매칭 {aiMatch.score}%</span>
            </div>
          </div>
        )}
        {/* Image */}
        <div className="relative h-44 overflow-hidden">
          <img
            src={barImages[bar.id] || barWhiskey}
            alt={bar.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
          
          {/* Status badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {bar.isOpenNow && (
              <Badge className="bg-emerald-600/90 border-0 text-foreground text-xs">
                <Clock className="w-3 h-3 mr-1" />영업 중
              </Badge>
            )}
            {bar.networkingFriendly && (
              <Badge className="bg-primary/90 border-0 text-primary-foreground text-xs">
                대화 가능
              </Badge>
            )}
          </div>

          {/* Favorite */}
          <button
            onClick={(e) => { e.preventDefault(); }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/50 flex items-center justify-center hover:bg-background/80 transition-colors"
          >
            <Heart className="w-4 h-4 text-foreground" />
          </button>

          {/* Bottom info on image */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-lg font-semibold text-foreground">{bar.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3" />
              <span>{bar.area} · {bar.distance}</span>
              <span className="text-primary">·</span>
              <span>{bar.priceRange}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Rating & Solo Score */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="text-sm font-medium text-foreground">{bar.rating}</span>
              <span className="text-xs text-muted-foreground">({bar.reviewCount})</span>
            </div>
            <div className="flex items-center gap-1">
              <Wine className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">혼술 적합도</span>
              <span className="text-sm font-medium text-primary">{bar.soloFriendlyScore}%</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {bar.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs bg-secondary border-0 text-secondary-foreground">
                {tag}
              </Badge>
            ))}
          </div>

          {/* AI Summary or Match Reason */}
          {aiMatch ? (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5">
              <p className="text-xs text-foreground/90 leading-relaxed line-clamp-2">
                <Sparkles className="inline w-3 h-3 text-primary mr-1" />
                <span className="text-primary font-medium">AI:</span> {aiMatch.reason}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              ✨ {bar.aiSummary}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default BarCard;
