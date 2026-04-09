export interface Bar {
  id: string;
  name: string;
  address: string;
  area: string;
  category: string;
  priceRange: string;
  isOpenNow: boolean;
  soloFriendlyScore: number;
  quietScore: number;
  networkingFriendly: boolean;
  tags: string[];
  aiSummary: string;
  rating: number;
  reviewCount: number;
  distance: string;
  imageUrl: string;
}

export interface NetworkingUser {
  id: string;
  nickname: string;
  jobGroup: string;
  ageRange: string;
  area: string;
  talkTopics: string[];
  availableNow: boolean;
}

export const sampleBars: Bar[] = [
  {
    id: "1",
    name: "Bar Mellow",
    address: "서울 강남구 역삼동 123-4",
    area: "강남",
    category: "위스키바",
    priceRange: "₩₩₩",
    isOpenNow: true,
    soloFriendlyScore: 95,
    quietScore: 90,
    networkingFriendly: false,
    tags: ["혼자 가기 편함", "조용한 편", "위스키", "바 좌석 많음"],
    aiSummary: "혼자 방문해도 전혀 어색하지 않다는 후기가 많습니다. 바 좌석 중심이라 짧게 머물기 좋고, 위스키 셀렉션이 훌륭합니다.",
    rating: 4.7,
    reviewCount: 128,
    distance: "350m",
    imageUrl: "",
  },
  {
    id: "2",
    name: "을지로 골목집",
    address: "서울 중구 을지로3가 280-5",
    area: "을지로",
    category: "하이볼바",
    priceRange: "₩₩",
    isOpenNow: true,
    soloFriendlyScore: 88,
    quietScore: 60,
    networkingFriendly: true,
    tags: ["직장인 선호", "하이볼", "대화하기 좋음", "레트로 감성"],
    aiSummary: "을지로 특유의 레트로 감성이 매력적인 곳. 직장인들이 퇴근 후 많이 찾으며, 가볍게 대화 나누기 좋은 분위기입니다.",
    rating: 4.4,
    reviewCount: 89,
    distance: "500m",
    imageUrl: "",
  },
  {
    id: "3",
    name: "와인앤피스",
    address: "서울 영등포구 여의도동 45-2",
    area: "여의도",
    category: "와인바",
    priceRange: "₩₩₩",
    isOpenNow: true,
    soloFriendlyScore: 92,
    quietScore: 85,
    networkingFriendly: false,
    tags: ["혼자 가기 편함", "와인", "조용한 편", "오래 머무르기 좋음"],
    aiSummary: "조용하고 아늑한 분위기에서 와인을 즐기기 좋은 곳입니다. 1인 고객 배려가 잘 되어있고, 금요일 저녁은 다소 붐비는 편입니다.",
    rating: 4.6,
    reviewCount: 156,
    distance: "200m",
    imageUrl: "",
  },
  {
    id: "4",
    name: "성수 브루어리",
    address: "서울 성동구 성수동2가 315-20",
    area: "성수",
    category: "맥주바",
    priceRange: "₩₩",
    isOpenNow: false,
    soloFriendlyScore: 75,
    quietScore: 50,
    networkingFriendly: true,
    tags: ["크래프트 맥주", "직장인 선호", "대화하기 좋음", "넓은 공간"],
    aiSummary: "성수동 특유의 힙한 분위기에 크래프트 맥주가 다양합니다. 혼자보다는 가볍게 대화하며 마시기 좋은 곳이에요.",
    rating: 4.3,
    reviewCount: 203,
    distance: "800m",
    imageUrl: "",
  },
  {
    id: "5",
    name: "판교 나이트캡",
    address: "경기 성남시 분당구 판교역로 231",
    area: "판교",
    category: "위스키바",
    priceRange: "₩₩₩₩",
    isOpenNow: true,
    soloFriendlyScore: 97,
    quietScore: 95,
    networkingFriendly: false,
    tags: ["혼자 가기 편함", "위스키", "조용한 편", "프리미엄"],
    aiSummary: "판교 IT 직장인들의 숨겨진 아지트. 바텐더가 취향에 맞는 위스키를 추천해주며, 혼자 조용히 마시기에 최적입니다.",
    rating: 4.8,
    reviewCount: 67,
    distance: "150m",
    imageUrl: "",
  },
  {
    id: "6",
    name: "강남 소셜라운지",
    address: "서울 강남구 테헤란로 415",
    area: "강남",
    category: "칵테일바",
    priceRange: "₩₩₩",
    isOpenNow: true,
    soloFriendlyScore: 70,
    quietScore: 45,
    networkingFriendly: true,
    tags: ["칵테일", "대화하기 좋음", "직장인 선호", "네트워킹"],
    aiSummary: "가볍게 대화하며 칵테일을 즐기기 좋은 곳. 직장인 네트워킹에 최적화된 분위기이며, 금요일에는 소규모 이벤트도 열립니다.",
    rating: 4.2,
    reviewCount: 94,
    distance: "450m",
    imageUrl: "",
  },
  {
    id: "7",
    name: "여의도 문바",
    address: "서울 영등포구 여의대로 108",
    area: "여의도",
    category: "하이볼바",
    priceRange: "₩₩",
    isOpenNow: true,
    soloFriendlyScore: 85,
    quietScore: 75,
    networkingFriendly: false,
    tags: ["하이볼", "혼자 가기 편함", "야경 뷰", "감성적"],
    aiSummary: "한강 야경이 보이는 창가석이 인기입니다. 하이볼이 맛있고, 혼자 조용히 야경 보며 한잔하기에 완벽한 곳.",
    rating: 4.5,
    reviewCount: 142,
    distance: "300m",
    imageUrl: "",
  },
  {
    id: "8",
    name: "을지로 앤틱바",
    address: "서울 중구 을지로 157",
    area: "을지로",
    category: "와인바",
    priceRange: "₩₩₩",
    isOpenNow: true,
    soloFriendlyScore: 90,
    quietScore: 88,
    networkingFriendly: false,
    tags: ["와인", "조용한 편", "앤틱 인테리어", "오래 머무르기 좋음"],
    aiSummary: "앤틱한 인테리어가 매력적인 와인바. 혼자 와서 책을 읽으며 와인을 마시는 손님도 많습니다. 조용하고 분위기 좋습니다.",
    rating: 4.6,
    reviewCount: 78,
    distance: "600m",
    imageUrl: "",
  },
];

export const sampleNetworkingUsers: NetworkingUser[] = [
  {
    id: "u1",
    nickname: "개발하는민수",
    jobGroup: "IT/개발",
    ageRange: "30대 초반",
    area: "강남",
    talkTopics: ["사이드프로젝트", "위스키", "커리어"],
    availableNow: true,
  },
  {
    id: "u2",
    nickname: "마케터지은",
    jobGroup: "마케팅",
    ageRange: "20대 후반",
    area: "여의도",
    talkTopics: ["브랜딩", "와인", "여행"],
    availableNow: true,
  },
  {
    id: "u3",
    nickname: "금융인재혁",
    jobGroup: "금융",
    ageRange: "30대 중반",
    area: "여의도",
    talkTopics: ["투자", "하이볼", "독서"],
    availableNow: false,
  },
  {
    id: "u4",
    nickname: "디자이너소희",
    jobGroup: "디자인",
    ageRange: "20대 후반",
    area: "성수",
    talkTopics: ["UI/UX", "전시", "맥주"],
    availableNow: true,
  },
  {
    id: "u5",
    nickname: "백엔드준영",
    jobGroup: "IT/개발",
    ageRange: "30대 초반",
    area: "판교",
    talkTopics: ["기술트렌드", "위스키", "러닝"],
    availableNow: true,
  },
  {
    id: "u6",
    nickname: "기획자은지",
    jobGroup: "기획/PM",
    ageRange: "30대 후반",
    area: "을지로",
    talkTopics: ["프로덕트", "와인", "재테크"],
    availableNow: false,
  },
];

export const areas = ["전체", "강남", "판교", "여의도", "을지로", "성수"];

export const drinkTypes = ["전체", "위스키", "와인", "하이볼", "맥주", "칵테일"];

export const moods = ["조용한 편", "대화하기 좋음", "혼자 가기 편함", "직장인 선호", "오래 머무르기 좋음"];
