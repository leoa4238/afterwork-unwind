import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { areas, drinkTypes, moods } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";

interface SearchFilterBarProps {
  onSearch: (query: string) => void;
  onAreaChange: (area: string) => void;
  onDrinkChange: (drink: string) => void;
  onMoodToggle: (mood: string) => void;
  selectedArea: string;
  selectedDrink: string;
  selectedMoods: string[];
  showFilters: boolean;
  onToggleFilters: () => void;
}

const SearchFilterBar = ({
  onSearch,
  onAreaChange,
  onDrinkChange,
  onMoodToggle,
  selectedArea,
  selectedDrink,
  selectedMoods,
  showFilters,
  onToggleFilters,
}: SearchFilterBarProps) => {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="강남역 근처 혼자 가기 좋은 조용한 바..."
          className="w-full h-12 pl-12 pr-12 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm"
        />
        <button
          type="button"
          onClick={onToggleFilters}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-accent transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </form>

      {/* Area filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {areas.map((area) => (
          <button
            key={area}
            onClick={() => onAreaChange(area)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
              selectedArea === area
                ? "bg-primary text-primary-foreground shadow-glow"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {area}
          </button>
        ))}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="space-y-3 animate-fade-in">
          {/* Drink types */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">주종</p>
            <div className="flex gap-2 flex-wrap">
              {drinkTypes.map((drink) => (
                <button
                  key={drink}
                  onClick={() => onDrinkChange(drink)}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    selectedDrink === drink
                      ? "bg-accent text-accent-foreground border border-primary/40"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {drink}
                </button>
              ))}
            </div>
          </div>
          {/* Moods */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">분위기</p>
            <div className="flex gap-2 flex-wrap">
              {moods.map((mood) => (
                <Badge
                  key={mood}
                  onClick={() => onMoodToggle(mood)}
                  className={`cursor-pointer text-xs transition-all ${
                    selectedMoods.includes(mood)
                      ? "bg-primary/20 text-primary border-primary/40"
                      : "bg-muted text-muted-foreground border-border hover:text-foreground"
                  }`}
                  variant="outline"
                >
                  {mood}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilterBar;
