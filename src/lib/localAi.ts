import type { Bar } from "@/data/mockData";
import type { NetworkingProfile } from "@/components/NetworkingAIMatch";

interface BarRecommendation {
  bar_id: string;
  match_score: number;
  reason: string;
}

interface BarRecommendationResult {
  intent_summary: string;
  recommendations: BarRecommendation[];
}

interface NetworkMatchResult {
  intent_summary: string;
  ice_breakers: string[];
  matches: { user_id: string; match_score: number; reason: string }[];
}

interface BarInsightResult {
  why_today: string;
  signature_drinks: { name: string; desc: string }[];
  pairings: string[];
  vibe_tags: string[];
  similar_bars: { bar_id: string; reason: string }[];
}

const normalize = (value: string | null | undefined) => (value ?? "").toLowerCase();

const containsAny = (source: string, words: string[]) =>
  words.some((word) => source.includes(word.toLowerCase()));

const barText = (bar: Bar) =>
  normalize(
    [
      bar.name,
      bar.address,
      bar.area,
      bar.category,
      bar.priceRange,
      bar.aiSummary,
      ...bar.tags,
    ].join(" "),
  );

export const buildLocalBarRecommendations = (
  query: string,
  bars: Bar[],
): BarRecommendationResult => {
  const q = normalize(query);
  const scored = bars.map((bar) => {
    const text = barText(bar);
    let score = 52;

    if (normalize(bar.area) && q.includes(normalize(bar.area))) score += 18;
    if (normalize(bar.category) && q.includes(normalize(bar.category).replace("바", ""))) score += 14;
    if (containsAny(q, ["혼자", "혼술", "조용", "quiet"])) {
      score += Math.round((bar.soloFriendlyScore + bar.quietScore) / 12);
    }
    if (containsAny(q, ["대화", "네트워킹", "동료", "친구"])) {
      score += bar.networkingFriendly ? 18 : 4;
    }
    if (containsAny(q, ["위스키", "와인", "하이볼", "맥주", "칵테일"])) {
      const drinkHit = ["위스키", "와인", "하이볼", "맥주", "칵테일"].some(
        (drink) => q.includes(drink) && text.includes(drink),
      );
      score += drinkHit ? 16 : 0;
    }
    bar.tags.forEach((tag) => {
      if (tag && q.includes(normalize(tag))) score += 8;
    });
    score += Math.min(8, Math.round(Number(bar.rating || 0)));

    return { bar, score: Math.min(98, score) };
  });

  const recommendations = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ bar, score }) => ({
      bar_id: bar.id,
      match_score: score,
      reason: `${bar.area}의 ${bar.category} 중 ${bar.soloFriendlyScore}% 혼술 적합도와 ${bar.quietScore}% 조용함 점수가 좋아요. ${bar.aiSummary}`,
    }));

  return {
    intent_summary: query.trim()
      ? `"${query.trim()}" 조건에 맞춰 지역, 분위기, 주종, 혼술 적합도를 함께 비교했어요.`
      : "지역, 분위기, 주종, 혼술 적합도를 함께 비교했어요.",
    recommendations,
  };
};

export const buildLocalConciergeReply = (text: string, bars: Bar[]) => {
  const result = buildLocalBarRecommendations(text, bars);
  if (result.recommendations.length === 0) {
    return "지금은 추천할 바 데이터가 아직 없어요. 탐색 화면에서 바 목록이 로딩된 뒤 다시 물어봐 주세요.";
  }

  const lines = result.recommendations
    .slice(0, 2)
    .map((rec, index) => {
      const bar = bars.find((item) => item.id === rec.bar_id);
      return bar
        ? `${index + 1}. ${bar.name} - ${bar.area}, ${bar.category}. ${rec.reason}`
        : "";
    })
    .filter(Boolean);

  return `좋아요. 지금 조건이면 아래 장소가 잘 맞아요.\n\n${lines.join("\n\n")}\n\n조용히 쉬고 싶으면 첫 번째 추천을, 가볍게 대화하고 싶으면 네트워킹 가능 표시가 있는 곳을 골라보세요.`;
};

export const buildLocalNetworkMatches = (
  interest: string,
  users: NetworkingProfile[],
): NetworkMatchResult => {
  const q = normalize(interest);
  const matches = users
    .map((user) => {
      const profileText = normalize(
        [user.nickname, user.job_group, user.age_range, user.area, ...user.talk_topics].join(" "),
      );
      let score = 55;
      user.talk_topics.forEach((topic) => {
        if (topic && q.includes(normalize(topic))) score += 14;
      });
      if (user.job_group && q.includes(normalize(user.job_group).split("/")[0])) score += 12;
      if (containsAny(q, ["개발", "ai", "프로젝트"]) && containsAny(profileText, ["개발", "ai", "프로젝트"])) score += 14;
      if (containsAny(q, ["와인", "전시", "브랜딩"]) && containsAny(profileText, ["와인", "전시", "브랜딩"])) score += 14;
      if (containsAny(q, ["가볍", "퇴근", "한잔"])) score += 8;
      return {
        user_id: user.id,
        match_score: Math.min(98, score),
        reason: `${user.nickname}님은 ${user.job_group ?? "직장인"}이고 관심사가 ${user.talk_topics.join(", ")}라서 오늘 대화 주제와 자연스럽게 이어질 수 있어요.`,
      };
    })
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 3);

  return {
    intent_summary: interest.trim()
      ? `"${interest.trim()}"에 맞춰 관심사, 직군, 지역을 비교했어요.`
      : "관심사, 직군, 지역을 비교했어요.",
    ice_breakers: [
      "오늘 퇴근길은 어땠어요?",
      "요즘 제일 재밌게 보고 있는 일이나 취미가 있어요?",
      "가볍게 한잔한다면 어떤 분위기를 좋아하세요?",
    ],
    matches,
  };
};

export const buildLocalBarInsight = (bar: Bar, allBars: Bar[]): BarInsightResult => {
  const similarBars = allBars
    .filter((candidate) => candidate.id !== bar.id)
    .map((candidate) => {
      let score = 0;
      if (candidate.area === bar.area) score += 3;
      if (candidate.category === bar.category) score += 3;
      score += candidate.tags.filter((tag) => bar.tags.includes(tag)).length;
      score += Math.abs(candidate.quietScore - bar.quietScore) <= 15 ? 1 : 0;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(({ candidate }) => ({
      bar_id: candidate.id,
      reason: `${bar.category} 분위기와 ${candidate.area} 지역 감성이 비슷해 함께 비교하기 좋아요.`,
    }));

  const drinkName = containsAny(normalize(bar.category), ["와인"])
    ? "글라스 와인"
    : containsAny(normalize(bar.category), ["맥주", "브루어"])
      ? "시그니처 수제맥주"
      : containsAny(normalize(bar.category), ["칵테일"])
        ? "시그니처 칵테일"
        : "시그니처 하이볼";

  return {
    why_today: `${bar.name}은 ${bar.area}에서 ${bar.soloFriendlyScore}%의 혼술 적합도와 ${bar.quietScore}%의 조용함 점수를 가진 곳이라 퇴근 후 부담 없이 쉬기 좋아요.`,
    signature_drinks: [
      { name: drinkName, desc: `${bar.category}의 분위기를 가장 잘 보여주는 첫 잔으로 추천해요.` },
      { name: "가벼운 추천 메뉴", desc: "오래 머물지 않아도 편하게 즐길 수 있는 메뉴를 고르면 좋아요." },
    ],
    pairings: [
      "혼자 방문한다면 바 좌석이나 창가 좌석을 추천해요.",
      bar.networkingFriendly ? "대화가 열려 있는 분위기라 가벼운 네트워킹에도 어울려요." : "조용한 휴식이나 짧은 혼술에 더 잘 맞아요.",
    ],
    vibe_tags: [...new Set([bar.area, bar.category, ...bar.tags])].slice(0, 5),
    similar_bars: similarBars,
  };
};

interface ChatReplyContext {
  recentReplies?: string[];
}

const chatLocations = [
  "잠실",
  "강남",
  "성수",
  "여의도",
  "을지로",
  "판교",
  "합정",
  "홍대",
  "신사",
  "방이",
  "석촌",
  "마곡",
  "종로",
];

const hashText = (value: string) =>
  [...value].reduce((total, char) => total + char.charCodeAt(0), 0);

const pickChatReply = (candidates: string[], context?: ChatReplyContext, seed = "") => {
  const recent = new Set((context?.recentReplies ?? []).slice(-8));
  const fresh = candidates.find((candidate) => !recent.has(candidate));
  if (fresh) return fresh;
  return candidates[hashText(seed) % candidates.length];
};

const findLocation = (text: string) => chatLocations.find((location) => text.includes(location));

export const buildLocalChatReply = (
  message: string,
  nickname = "상대",
  context?: ChatReplyContext,
) => {
  const text = normalize(message);
  const location = findLocation(text);

  if (containsAny(text, ["안녕", "반가", "처음", "ㅎㅇ", "hello"])) {
    return pickChatReply(
      [
        `안녕하세요. ${nickname}이에요. 퇴근 후라 너무 무겁지 않게 편하게 이야기해요. 오늘 하루는 어땠어요?`,
        "반가워요. 오늘은 편하게 한두 마디씩 이어가도 좋아요. 퇴근길은 괜찮았어요?",
        "안녕하세요. 바로 약속을 정하기보다 오늘 원하는 분위기부터 맞춰보면 좋겠어요.",
      ],
      context,
      message,
    );
  }

  if (location) {
    return pickChatReply(
      [
        `${location} 쪽이면 좋아요. 너무 시끄러운 곳보다는 바 좌석이 있거나 대화하기 편한 곳으로 잡아볼까요?`,
        `${location}이면 이동하기도 괜찮겠네요. 오늘은 조용한 분위기와 가벼운 대화 중 어느 쪽이 더 좋아요?`,
        `${location} 쪽으로 보면 괜찮은 선택지가 있을 것 같아요. 첫 잔은 부담 없는 하이볼이나 칵테일도 좋겠어요.`,
      ],
      context,
      message,
    );
  }

  if (containsAny(text, ["추천", "어디", "바", "술집", "위스키", "와인", "하이볼", "맥주"])) {
    return pickChatReply(
      [
        "오늘은 조용히 쉬고 싶다면 위스키바나 와인바가 좋고, 가볍게 이야기하고 싶다면 하이볼바가 잘 맞을 것 같아요. 분위기는 조용한 쪽이 좋아요, 아니면 대화하기 편한 쪽이 좋아요?",
        "추천을 고른다면 먼저 지역을 정하고, 그 다음에 조용함이나 대화하기 좋은 분위기를 보면 좋겠어요.",
        "가볍게 시작하려면 하이볼바가 무난하고, 조금 차분하게 가려면 와인바나 위스키바가 잘 맞을 것 같아요.",
      ],
      context,
      message,
    );
  }

  if (containsAny(text, ["피곤", "힘들", "지침", "스트레스", "야근"])) {
    return pickChatReply(
      [
        "고생 많았어요. 그런 날은 긴 대화보다 조용한 곳에서 한 잔 마시면서 천천히 풀어내는 게 좋더라고요. 오늘은 혼자 쉬고 싶은 쪽이에요, 누군가랑 가볍게 얘기하고 싶은 쪽이에요?",
        "오늘은 무리해서 많이 움직이기보다 가까운 곳에서 짧게 마무리하는 것도 좋겠어요.",
        "그런 날이면 너무 붐비는 곳은 피하는 게 좋겠네요. 차분한 분위기로 맞춰볼까요?",
      ],
      context,
      message,
    );
  }

  if (containsAny(text, ["일", "회사", "프로젝트", "개발", "마케팅", "기획", "커리어"])) {
    return pickChatReply(
      [
        "그 얘기 흥미롭네요. 퇴근 후 대화라면 너무 깊게 들어가기보다, 오늘 제일 기억에 남은 장면 하나부터 이야기해도 좋을 것 같아요.",
        "일 이야기도 좋아요. 다만 퇴근 후니까 너무 업무 모드로 가지 말고 편하게 이어가면 좋겠네요.",
        "그 주제면 첫 대화로도 괜찮겠어요. 요즘 제일 재미있게 느끼는 부분부터 들어보고 싶어요.",
      ],
      context,
      message,
    );
  }

  if (containsAny(text, ["즐거", "재밌", "좋았", "괜찮았", "만족"])) {
    return pickChatReply(
      [
        "저도 그런 흐름이면 좋아요. 다음에는 지역만 맞추고 너무 길지 않게 한 잔 정도로 시작해봐도 괜찮겠어요.",
        "좋게 느꼈다니 다행이에요. 다음 대화는 장소 분위기부터 정하면 더 자연스럽게 이어질 것 같아요.",
        "그럼 오늘은 편한 분위기를 기준으로 잡아도 되겠네요. 조용한 쪽과 활기 있는 쪽 중 어디가 더 좋아요?",
      ],
      context,
      message,
    );
  }

  if (containsAny(text, ["좋아", "괜찮", "그래", "오케이", "ㅇㅋ"])) {
    return pickChatReply(
      [
        "좋아요. 그럼 너무 부담스럽지 않게 시작해봐요. 첫 잔은 가볍게, 대화도 편한 속도로 가면 좋겠네요.",
        "괜찮아요. 장소는 너무 멀지 않은 곳으로 잡고, 분위기는 차분한 쪽으로 맞춰보면 좋겠어요.",
        "좋습니다. 오늘은 약속을 크게 잡기보다 편하게 한 잔 하는 느낌이면 충분할 것 같아요.",
      ],
      context,
      message,
    );
  }

  return pickChatReply(
    [
      "좋아요. 너무 딱딱하게 말하지 않아도 괜찮아요. 오늘 기분이나 가고 싶은 분위기를 한마디로 말해주면 거기에 맞춰서 이어가볼게요.",
      "편하게 말해도 괜찮아요. 오늘은 지역, 주종, 분위기 중 하나만 정해도 자연스럽게 이어갈 수 있어요.",
      "그 느낌이면 천천히 맞춰가면 되겠네요. 먼저 오늘 가고 싶은 지역이나 피하고 싶은 분위기가 있을까요?",
      "좋아요. 저는 너무 시끄럽지 않은 곳에서 짧게 이야기하는 흐름도 괜찮을 것 같아요.",
    ],
    context,
    message,
  );
};
