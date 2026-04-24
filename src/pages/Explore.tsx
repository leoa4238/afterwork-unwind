import { useState, useMemo } from "react";
import { sampleBars } from "@/data/mockData";
import BarCard from "@/components/BarCard";
import SearchFilterBar from "@/components/SearchFilterBar";
import BottomNav from "@/components/BottomNav";
import AISearchPanel from "@/components/AISearchPanel";
import { Wine, Sparkles } from "lucide-react";

const Explore = () => {
  const [selectedArea, setSelectedArea] = useState("전체");
  const [selectedDrink, setSelectedDrink] = useState("전체");
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiBarIds, setAiBarIds] = useState<string[]>([]);

  const filteredBars = useMemo(() => {
    if (aiBarIds.length > 0) {
      const ordered = aiBarIds
        .map((id) => sampleBars.find((b) => b.id === id))
        .filter((b): b is (typeof sampleBars)[number] => Boolean(b));
      return ordered;
    }
    return sampleBars.filter((bar) => {
      if (selectedArea !== "전체" && bar.area !== selectedArea) return false;
      if (selectedDrink !== "전체" && !bar.category.includes(selectedDrink) && !bar.tags.some(t => t.includes(selectedDrink))) return false;
      if (selectedMoods.length > 0 && !selectedMoods.some(m => bar.tags.includes(m))) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return bar.name.toLowerCase().includes(q) || bar.area.includes(q) || bar.tags.some(t => t.includes(q)) || bar.category.includes(q);
      }
      return true;
    });
  }, [selectedArea, selectedDrink, selectedMoods, searchQuery, aiBarIds]);

  const handleMoodToggle = (mood: string) => {
    setSelectedMoods(prev => prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border px-4 pt-4 pb-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Wine className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-serif font-bold text-foreground">퇴근한잔</h1>
          </div>
          <SearchFilterBar
            onSearch={setSearchQuery}
            onAreaChange={setSelectedArea}
            onDrinkChange={setSelectedDrink}
            onMoodToggle={handleMoodToggle}
            selectedArea={selectedArea}
            selectedDrink={selectedDrink}
            selectedMoods={selectedMoods}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
          />
        </div>
      </header>

      {/* Results */}
      <main className="px-4 py-4 max-w-lg mx-auto">
        {/* Section title */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            {selectedArea === "전체" ? "오늘의 혼술 추천" : `${selectedArea} 추천 바`}
            <span className="ml-2 text-primary">{filteredBars.length}</span>
          </h2>
        </div>

        {/* Bar list */}
        {filteredBars.length > 0 ? (
          <div className="space-y-4">
            {filteredBars.map((bar, i) => (
              <div key={bar.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <BarCard bar={bar} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Wine className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">조건에 맞는 바가 없습니다</p>
            <p className="text-xs text-muted-foreground mt-1">필터를 변경해보세요</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Explore;
