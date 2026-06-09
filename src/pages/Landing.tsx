import { Wine, Users, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-bar.jpg";

const areas = [
  { name: "송파", count: 94 },
  { name: "성수", count: 5 },
  { name: "여의도", count: 2 },
  { name: "강남", count: 2 },
  { name: "을지로", count: 2 },
  { name: "판교", count: 1 },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <img
          src={heroImage}
          alt="퇴근한잔 히어로"
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        
        <div className="relative z-10 text-center px-6 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs text-primary font-medium">AI가 추천하는 나만의 바</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight mb-4">
            퇴근 후,<br />
            <span className="text-gradient-amber">혼자여도 좋은</span><br />
            한잔
          </h1>
          
          <p className="text-muted-foreground text-base mb-8 leading-relaxed">
            조용히 혼자 마시고 싶을 때도,<br />
            가볍게 대화하고 싶을 때도.<br />
            당신의 퇴근길을 위한 바를 찾아드립니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/explore">
                <Wine className="w-5 h-5" />
                지금 바 찾기
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/explore">
                <MapPin className="w-5 h-5" />
                내 주변 보기
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-lg mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold text-foreground mb-2">어떤 밤이든, 당신의 속도로</h2>
            <p className="text-sm text-muted-foreground">원하는 방식으로 퇴근 후 시간을 보내세요</p>
          </div>

          <div className="grid gap-4">
            {/* Solo feature */}
            <div className="bg-gradient-card rounded-xl p-6 border border-border shadow-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Wine className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">혼술 탐색</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                혼자 가기 편한 바, 조용한 분위기, 바 좌석 중심 — AI가 당신의 취향에 맞는 바를 골라드립니다.
              </p>
            </div>

            {/* Networking feature */}
            <div className="bg-gradient-card rounded-xl p-6 border border-border shadow-card">
              <div className="w-10 h-10 rounded-lg bg-accent/30 flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">선택형 네트워킹</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                원할 때만 켜세요. 같은 지역의 직장인과 가볍게 대화할 수 있습니다. 기본은 항상 OFF.
              </p>
            </div>

            {/* AI feature */}
            <div className="bg-gradient-card rounded-xl p-6 border border-border shadow-card">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">AI 리뷰 요약</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                수십 개의 리뷰를 읽을 필요 없이, AI가 핵심만 요약해드립니다. 자연어로 검색도 가능합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Areas */}
      <section className="py-12 px-6">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-serif font-bold text-foreground mb-6">추천 지역</h2>
          <div className="grid grid-cols-2 gap-3">
            {areas.map((area) => (
              <Link
                key={area.name}
                to={`/explore?area=${area.name}`}
                className="bg-gradient-card rounded-xl p-4 border border-border hover:border-primary/30 hover:shadow-glow transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{area.name}</p>
                    <p className="text-xs text-muted-foreground">{area.count}개의 바</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-muted-foreground text-sm mb-4">오늘 하루도 수고했어요</p>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
            퇴근 후, 나만의 한잔을<br />찾아보세요
          </h2>
          <Button variant="hero" size="lg" asChild>
            <Link to="/explore">
              시작하기
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Landing;
