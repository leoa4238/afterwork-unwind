import type { User } from "@supabase/supabase-js";

export const DEMO_AUTH_KEY = "afterwork-unwind-demo-auth";
export const DEMO_ROOMS_KEY = "afterwork-unwind-demo-rooms";
export const DEMO_MESSAGES_KEY = "afterwork-unwind-demo-messages";
export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

export const demoUser = {
  id: DEMO_USER_ID,
  aud: "authenticated",
  role: "authenticated",
  email: "demo@afterwork.local",
  app_metadata: {},
  user_metadata: { nickname: "데모 사용자" },
  created_at: "2026-06-01T00:00:00.000Z",
} as User;

export const demoProfile = {
  id: "demo-profile",
  user_id: DEMO_USER_ID,
  nickname: "데모 사용자",
  age_range: "20대 후반",
  job_group: "IT/개발",
  area: "성수",
  talk_topics: ["사이드프로젝트", "퇴근 후 한잔", "AI 서비스"],
  networking_enabled: true,
  available_now: true,
};

export const demoNetworkingProfiles = [
  {
    id: "demo-user-1",
    user_id: "00000000-0000-4000-8000-000000000101",
    nickname: "성수 PM",
    age_range: "30대 초반",
    job_group: "기획/PM",
    area: "성수",
    talk_topics: ["서비스 기획", "칵테일", "커리어"],
  },
  {
    id: "demo-user-2",
    user_id: "00000000-0000-4000-8000-000000000102",
    nickname: "마케터 지윤",
    age_range: "20대 후반",
    job_group: "마케팅",
    area: "강남",
    talk_topics: ["브랜딩", "와인", "전시"],
  },
  {
    id: "demo-user-3",
    user_id: "00000000-0000-4000-8000-000000000103",
    nickname: "개발자 민호",
    age_range: "30대 초반",
    job_group: "IT/개발",
    area: "판교",
    talk_topics: ["사이드프로젝트", "하이볼", "AI"],
  },
];

export interface DemoRoom {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  expires_at: string;
  is_expired: boolean;
  other_nickname: string;
  last_message?: string;
}

export interface DemoMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

const safeJson = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const isDemoAuthEnabled = () => localStorage.getItem(DEMO_AUTH_KEY) === "true";

export const setDemoAuthEnabled = (enabled: boolean) => {
  if (enabled) localStorage.setItem(DEMO_AUTH_KEY, "true");
  else localStorage.removeItem(DEMO_AUTH_KEY);
};

export const getDemoRooms = (): DemoRoom[] => safeJson(localStorage.getItem(DEMO_ROOMS_KEY), []);

export const saveDemoRooms = (rooms: DemoRoom[]) => {
  localStorage.setItem(DEMO_ROOMS_KEY, JSON.stringify(rooms));
};

export const getDemoMessages = (roomId: string): DemoMessage[] => {
  const all = safeJson<Record<string, DemoMessage[]>>(localStorage.getItem(DEMO_MESSAGES_KEY), {});
  return all[roomId] ?? [];
};

export const saveDemoMessages = (roomId: string, messages: DemoMessage[]) => {
  const all = safeJson<Record<string, DemoMessage[]>>(localStorage.getItem(DEMO_MESSAGES_KEY), {});
  all[roomId] = messages;
  localStorage.setItem(DEMO_MESSAGES_KEY, JSON.stringify(all));
};

export const createDemoRoom = (target: { id: string; user_id?: string; nickname: string }): DemoRoom => {
  const rooms = getDemoRooms();
  const targetId = target.user_id ?? target.id;
  const existing = rooms.find((room) => room.user2_id === targetId);
  if (existing) return existing;

  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const room: DemoRoom = {
    id: `demo-room-${target.id}`,
    user1_id: DEMO_USER_ID,
    user2_id: targetId,
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
    is_expired: false,
    other_nickname: target.nickname,
    last_message: "데모 대화방이 생성되었습니다.",
  };
  saveDemoRooms([room, ...rooms]);
  saveDemoMessages(room.id, [
    {
      id: `${room.id}-welcome`,
      room_id: room.id,
      sender_id: targetId,
      content: "안녕하세요! 퇴근 후 가볍게 한잔 이야기부터 시작해볼까요?",
      created_at: now.toISOString(),
    },
  ]);
  return room;
};

export const addDemoMessage = (room: DemoRoom, senderId: string, content: string) => {
  const message: DemoMessage = {
    id: `${room.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    room_id: room.id,
    sender_id: senderId,
    content,
    created_at: new Date().toISOString(),
  };
  const messages = [...getDemoMessages(room.id), message];
  saveDemoMessages(room.id, messages);
  const rooms = getDemoRooms().map((item) =>
    item.id === room.id ? { ...item, last_message: content } : item
  );
  saveDemoRooms(rooms);
  return message;
};
