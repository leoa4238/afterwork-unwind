# 퇴근한잔 프로젝트 인수인계 README

최종 정리일: 2026-06-12  
배포 링크: https://leoa4238.github.io/afterwork-unwind/  
GitHub 저장소: https://github.com/leoa4238/afterwork-unwind

## 한 줄 소개

퇴근한잔은 단순한 바 추천 서비스가 아니라, 바의 분위기와 사용자의 퇴근 후 목적을 기반으로 직장인 간 자연스러운 네트워킹을 돕는 AI 기반 장소·사람 매칭 서비스입니다.

발표용 핵심 문장:

> 프로필이 아니라, 오늘 가고 싶은 바와 분위기로 시작하는 직장인 네트워킹 서비스

## 현재 프로젝트 상태 요약

- GitHub Pages 배포 완료
- Supabase 새 프로젝트 연결 완료
- Supabase 기반 바 데이터 조회, 리뷰, 인증, 관리자 CRUD 구현
- 네트워킹/채팅/AI 기능은 실제 DB 연동과 시연용 demo/fallback이 함께 들어가 있음
- Supabase Edge Function이 없어도 화면이 멈추지 않도록 브라우저 로컬 fallback 적용
- `.env`는 로컬에만 있고 깃에는 올리지 않음

중요한 점:

- 전부 Mockup 데이터만 쓰는 상태는 아님
- 바 목록, 상세, 리뷰, 관리자 CRUD, 실제 계정 채팅방/메시지는 Supabase DB와 연결됨
- 데모 로그인, 데모 네트워킹, AI 자동 응답 일부는 과제 시연 안정성을 위한 샘플/fallback 성격임

## 기말평가 제출 방안

기준일: 2026-06-12  
제출 마감: 2026-06-14 일요일 23:59  
제출물 유형: 웹사이트 URL 또는 파일 업로드, PPT 제출 필요  
배점: 40점

### 제출 전 최우선 목표

기능을 새로 많이 늘리는 것보다, 배포 링크에서 핵심 기능 흐름이 끊기지 않고 동작하는 것이 우선입니다.

우선순위:

1. 배포 링크 접속 가능
2. Supabase 바 데이터 조회 가능
3. 회원가입/로그인 또는 데모 로그인 가능
4. 네트워킹 사용자 목록 확인 가능
5. 사용자 프로필 모달 확인 가능
6. 대화 요청 후 채팅방 진입 가능
7. 채팅 메시지 전송 및 자동 응답 흐름 확인 가능
8. 관리자 페이지에서 바 등록/수정/삭제 흐름 확인 가능

마감 전에는 기능 확장보다 위 흐름을 안정적으로 검증하는 것이 좋습니다.

### 제출 주제 정리

기존 주제가 넓어 보일 경우, 아래 범위로 좁혀 제출합니다.

> 바 추천과 AI 네트워킹을 결합한 퇴근 후 직장인 연결 서비스

즉, 모든 술집/모임/커뮤니티를 포괄하는 대형 서비스가 아니라, “퇴근 후 직장인이 가볍게 머무를 수 있는 바”를 매개로 사람을 연결하는 서비스로 범위를 조정합니다.

### Problem 작성 방안

핵심 문제:

- 퇴근 후 직장인은 혼자 쉬고 싶거나 새로운 사람과 가볍게 대화하고 싶은 수요가 있음
- 기존 네트워킹 서비스는 프로필, 스펙, 목적이 먼저 드러나 부담스러움
- 일반 맛집/술집 추천 서비스는 장소 추천에 그치고 사람 연결까지 지원하지 않음
- 혼술과 네트워킹 사이의 중간 지점, 즉 부담 없는 오프라인 연결 경험이 부족함

비전공자도 이해할 수 있는 설명:

> 퇴근 후 누군가와 가볍게 이야기하고 싶어도 일반 네트워킹 앱은 너무 무겁고, 맛집 앱은 장소만 알려줍니다. 퇴근한잔은 “오늘 어떤 분위기의 바에 가고 싶은지”를 기준으로 사람과 장소를 함께 연결합니다.

### 현재 솔루션 분석 작성 방안

비교할 기존 대안:

- 맛집/술집 추천 서비스: 네이버 지도, 카카오맵, 망고플레이트, 다이닝코드 등
- 네트워킹/모임 서비스: 소모임, 문토, 커리어리, 링크드인 등
- 데이팅/소셜 앱: 틴더, 글램 등

기존 대안의 한계:

- 지도/맛집 서비스는 장소 중심이라 사용자 간 연결이 약함
- 네트워킹 서비스는 프로필 중심이라 부담이 크고 퇴근 후 가벼운 만남과 맞지 않음
- 데이팅 앱은 목적이 다르게 인식될 수 있어 직장인 네트워킹 맥락과 거리가 있음
- 기존 서비스는 “바의 분위기”와 “대화 목적”을 함께 고려한 매칭이 부족함

### 제시 솔루션 작성 방안

퇴근한잔의 해결책:

- 바의 지역, 주종, 조용함, 혼술 적합도, 네트워킹 친화도 데이터를 기반으로 장소 추천
- 사용자의 직무, 관심사, 선호 지역, 대화 주제를 기반으로 사람 추천
- AI가 바 추천, 사람 매칭, 첫 대화 문장을 보조
- 카카오톡식 프로필 모달로 상대 정보를 가볍게 확인한 뒤 대화 요청
- 채팅방에서 자연스럽게 대화를 이어갈 수 있도록 자동 응답/fallback 제공

차별화 포인트:

- 사람 프로필이 아니라 “오늘 가고 싶은 바와 분위기”에서 네트워킹을 시작
- 술집 추천과 사람 매칭을 하나의 흐름으로 연결
- 퇴근 후 부담 없는 대화라는 명확한 사용 상황에 집중
- 실제 Supabase DB와 Auth를 사용해 서비스 동작을 구현

### 기대효과 작성 방안

정성적 기대효과:

- 퇴근 후 혼자 시간을 보내는 직장인의 선택지를 넓힘
- 새로운 사람과의 첫 대화 부담을 줄임
- 바 사업자에게는 네트워킹 친화 공간으로 노출될 기회 제공
- 일반 추천 서비스보다 목적성 있는 방문을 유도

정량적 기대효과 예시:

- 사용자의 장소 탐색 시간 단축
- 관심사 기반 매칭으로 대화 시작 성공률 개선 기대
- 리뷰와 사용자 행동 데이터가 쌓일수록 추천 품질 향상 가능
- 바별 혼술/네트워킹 친화도 점수를 통해 선택 기준 명확화

### 화면 및 기능 상세 작성 방안

주요 화면:

- 홈/랜딩: 서비스 컨셉 소개
- 탐색 화면: 바 목록, 필터, AI 추천
- 바 상세 화면: 바 정보, 리뷰, AI 인사이트, 네트워킹 연결
- 로그인/회원가입: Supabase Auth 기반 이메일 인증 흐름
- 네트워킹 화면: 네트워킹 ON/OFF, 사용자 목록, AI 매칭
- 사용자 프로필 모달: 직무, 연령대, 지역, 관심사, AI 아이스브레이커
- 채팅 목록/채팅방: 대화 요청 후 1:1 채팅
- 마이페이지: 내 정보와 네트워킹 설정
- 관리자 페이지: 바 데이터 CRUD

프론트엔드와 백엔드 연동 설명:

- Supabase Auth로 회원가입/로그인 처리
- Supabase Database에서 바 목록, 태그, 리뷰, 프로필, 채팅방, 메시지 조회/저장
- 관리자 페이지에서 Supabase `bars`, `bar_tags`에 직접 데이터 등록/수정/삭제
- 데모 로그인과 fallback은 시연 안정성을 위한 보조 흐름임

### AI 모델 및 핵심 기능 설명 방안

현재 구현 기준:

- 외부 LLM 또는 Supabase Edge Function 호출을 시도하는 구조가 있음
- Edge Function이 없거나 실패하면 `src/lib/localAi.ts`의 로컬 규칙 기반 fallback으로 동작
- 과제 시연 환경에서는 안정적인 데모를 위해 fallback을 함께 사용

PPT 표현 방식:

> 본 프로젝트의 AI 기능은 사용자의 자연어 입력, 바 메타데이터, 사용자 프로필 데이터를 바탕으로 추천/매칭/대화 시작 문장을 생성하는 구조입니다. 현재 제출 버전은 Supabase Edge Function 호출 구조를 포함하되, 배포 안정성을 위해 로컬 fallback 알고리즘을 함께 적용했습니다.

AI 기능별 입력/출력:

- AI 바 추천
  - 입력: 사용자의 자연어 조건, 바 이름, 지역, 카테고리, 태그, 점수, 리뷰 요약
  - 출력: 추천 바 목록, 매칭 점수, 추천 이유
- AI 네트워킹 매칭
  - 입력: 사용자의 관심사 문장, 상대 프로필의 직무, 지역, 관심 대화 주제
  - 출력: 추천 사용자, 매칭 점수, 매칭 이유, 아이스브레이커
- AI 바 상세 인사이트
  - 입력: 바 상세 데이터, 태그, 조용함/혼술 점수, 네트워킹 친화도
  - 출력: 오늘 방문 이유, 추천 메뉴/분위기, 유사 바
- AI 채팅 응답
  - 입력: 사용자가 보낸 메시지와 상대 닉네임
  - 출력: 자연스러운 자동 응답 문장

데이터셋 설명:

- 입력 데이터: Supabase `bars`, `bar_tags`, `reviews`, `profiles`, `chat_rooms`, `chat_messages`
- 시드 데이터: `outputs/supabase-fresh-project-setup.sql`에 포함
- 출력 데이터: 추천 결과, 매칭 결과, 채팅 메시지, 리뷰, 관리자 등록 바 데이터
- 학습 모델을 직접 학습한 구조는 아니며, 현재 버전은 메타데이터 기반 추론과 규칙 기반 fallback 중심

성능 평가 작성 방식:

- 정량 모델 성능 지표보다는 기능 동작 검증 중심으로 설명
- 평가 항목:
  - 바 목록 조회 성공
  - AI 추천 결과 표시 성공
  - 네트워킹 매칭 결과 표시 성공
  - 채팅 메시지 전송 성공
  - 관리자 CRUD 성공
  - fallback 적용 시 화면 중단 없음

### 소감 및 추후 활용 방안 작성 방안

기술적 한계:

- Lovable 사용 제한으로 기존 개발 흐름을 계속 쓰기 어려웠음
- 새 Supabase 프로젝트를 직접 구성해야 했음
- Auth의 이메일 인증 설정 때문에 가입 후 로그인이 안 되는 문제가 있었음
- Supabase Edge Function이 없을 때 AI 기능이 실패하는 문제가 있었음
- GitHub Pages 배포에서 base path와 라우팅 대응이 필요했음

극복 과정:

- Supabase SQL로 테이블과 RLS 정책 재구성
- `Confirm email` OFF 권장 및 Auth 에러 안내 추가
- Edge Function 실패 시 로컬 fallback으로 화면이 멈추지 않게 수정
- GitHub Pages용 `GITHUB_PAGES=true` 빌드와 `gh-pages` 브랜치 배포 정리
- 실제 DB 연동 기능과 demo/fallback 기능을 분리해 시연 안정성 확보

향후 고도화:

- Supabase Edge Function에 실제 AI 추천/매칭/챗봇 배포
- 사용자 행동 로그 기반 개인화 추천
- 바 예약/소규모 모임 생성 기능
- 매너 평가, 신고/차단 고도화
- 실제 제휴 바 데이터 확장
- 퇴근 시간대별 실시간 “오늘 같이 갈 사람” 기능

### 제출 전 체크리스트

- 배포 링크 접속 확인
- Supabase 프로젝트가 삭제/정지되지 않았는지 확인
- Supabase Auth `Confirm email` OFF 확인
- 테스트 계정 또는 데모 로그인 흐름 확인
- `/explore` 바 목록 표시 확인
- 바 상세 페이지 리뷰/AI 인사이트 확인
- 네트워킹 화면 사용자 카드 및 프로필 모달 확인
- 채팅방 메시지 전송 확인
- `/admin` 관리자 CRUD 확인
- PPT에 배포 링크와 테스트 계정/데모 로그인 안내 포함
- PPT에서 실제 DB 연동과 demo/fallback을 명확히 구분

## 기술 스택

- Frontend: Vite, React, TypeScript
- UI: shadcn/ui, Tailwind CSS, lucide-react
- Backend/BaaS: Supabase Auth, Supabase Database, Supabase RLS
- Hosting: GitHub Pages
- AI 기능: Supabase Edge Function 호출 시도 후 로컬 fallback 사용

## 주요 기능

### 1. 바 탐색

- `/explore`
- Supabase `bars`, `bar_tags` 기반 바 목록 조회
- 지역, 주종, 분위기 필터
- AI 추천 패널
- Edge Function `ai-recommend`가 없으면 `src/lib/localAi.ts`의 로컬 추천으로 fallback

### 2. 바 상세

- `/bar/:id`
- Supabase 바 상세 데이터 조회
- 리뷰 목록 조회
- AI 바 인사이트
- Edge Function `ai-bar-detail`이 없으면 로컬 인사이트 fallback
- 네트워킹 친화 바는 네트워킹 페이지로 연결

### 3. 회원가입/로그인

- `/signup`
- `/login`
- Supabase Auth 기반 이메일 회원가입/로그인
- 데모 계정 로그인 지원
- Google 로그인 버튼은 현재 비활성화 안내만 표시
- `Email not confirmed`, `email rate limit exceeded` 같은 Supabase Auth 에러를 한국어로 안내

### 4. 네트워킹

- `/networking`
- 로그인 필요
- 사용자가 네트워킹 ON/OFF 설정 가능
- 실제 로그인 상태에서는 Supabase `profiles`에서 `available_now`, `networking_enabled`가 true인 사용자 조회
- 데모 로그인 상태에서는 `src/lib/demoAuth.ts`의 데모 사용자 목록 사용
- AI 네트워킹 매칭
- Edge Function `ai-match-network`가 없으면 `src/lib/localAi.ts`의 로컬 매칭 fallback
- 사용자 카드에서 프로필을 누르면 카카오톡식 미니 프로필 모달 표시
- 프로필 모달에서 직무, 연령대, 지역, 관심 대화 주제, AI 아이스브레이커 확인 가능
- 프로필 모달 안에서 바로 대화 요청 가능

### 5. 채팅

- `/chat`
- `/chat/:roomId`
- 로그인 필요
- 실제 로그인 상태에서는 Supabase `chat_rooms`, `chat_messages` 사용
- 데모 로그인 상태에서는 localStorage 기반 데모 채팅방/메시지 사용
- 채팅방은 24시간 만료 개념이 있음
- 채팅방 상단 상대 프로필 영역을 누르면 미니 프로필 모달 표시
- 메시지 전송 후 Edge Function `ai-chat-reply` 호출 시도
- Edge Function이 없으면 로컬 자동 응답 fallback 표시

주의:

- 실제 Supabase 채팅에서 사용자가 보낸 메시지는 DB에 저장됨
- Edge Function이 없을 때 표시되는 로컬 자동 응답은 시연 안정성을 위한 fallback임
- 완전한 서버 기반 AI 챗봇으로 만들려면 Supabase Edge Function 배포가 필요함

### 6. 마이페이지

- `/mypage`
- 사용자 프로필 표시
- 네트워킹 기본 설정 토글
- 내 리뷰, 채팅, 차단 목록 등 사용자 관련 정보 표시

### 7. 관리자 페이지

- `/admin`
- 로그인 필요
- Supabase `bars`, `bar_tags`에 직접 바 등록, 수정, 삭제 가능
- 다이닝코드 URL 입력형 크롤러 UI가 있으나, 실제 외부 크롤링 서버가 없을 때는 수동 등록/fallback 중심으로 사용
- 데모 계정 상태에서는 실제 DB 쓰기를 안내 후 제한

## 실제 DB 연동과 Demo/Fallback 구분

### 실제 Supabase 연동

- Supabase Auth 이메일 회원가입/로그인
- `bars` 조회
- `bar_tags` 조회
- `reviews` 조회/작성
- `profiles` 조회/수정
- `chat_rooms` 생성/조회
- `chat_messages` 생성/조회
- 관리자 바 CRUD

### 시연용 Demo/Fallback

- 데모 로그인 사용자
- 데모 네트워킹 사용자 목록
- 데모 채팅방과 메시지 localStorage 저장
- AI 바 추천 fallback
- AI 바 상세 인사이트 fallback
- AI 네트워킹 매칭 fallback
- AI 채팅 자동 응답 fallback

PPT나 발표에서는 이렇게 말하면 좋습니다:

> 본 프로젝트는 Supabase를 활용해 사용자 인증, 바 데이터, 리뷰, 채팅 데이터를 실제 DB와 연동했습니다. 다만 외부 AI 서버와 충분한 실제 사용자 데이터가 없는 과제 시연 환경을 고려하여, AI 추천·네트워킹 매칭·자동 응답 기능은 로컬 fallback과 시연용 샘플 데이터를 함께 사용하도록 구현했습니다.

## Supabase 설정

현재 새 Supabase 프로젝트를 기준으로 연결했습니다.  
Supabase URL과 publishable key는 `.env`에만 넣고 깃에는 올리지 않습니다.

필요한 환경 변수 이름:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

주의:

- `.env`는 절대 커밋하지 말 것
- Supabase publishable key는 프론트엔드 빌드 산출물에는 포함될 수 있음
- 그래도 원본 `.env` 파일 자체는 깃에 올리지 않는 것이 원칙

### 새 Supabase 프로젝트를 다시 만들 경우

다음 SQL을 Supabase Dashboard > SQL Editor에서 실행합니다.

- `outputs/supabase-fresh-project-setup.sql`

이 SQL은 과제 시연에 필요한 기본 테이블, RLS, seed 데이터를 만드는 용도입니다.

추가 정책만 따로 적용해야 하는 경우:

- `outputs/supabase-bar-crud-policy.sql`

## Supabase Auth 설정

과제 시연 안정성을 위해 다음 설정을 권장합니다.

1. Supabase Dashboard > Authentication > Providers > Email
2. `Confirm email` OFF
3. 저장

이유:

- `Confirm email`이 ON이면 회원가입은 되어도 이메일 인증 전에는 로그인 세션이 생성되지 않음
- Supabase 무료 프로젝트는 인증 메일 발송 제한으로 `email rate limit exceeded`가 발생할 수 있음
- 제출 시연 중 교수님/조교가 직접 가입 테스트할 때 막힐 가능성이 있음

URL 설정:

- Site URL: `https://leoa4238.github.io/afterwork-unwind`
- Redirect URL: `https://leoa4238.github.io/afterwork-unwind/**`

기존에 `Confirm email` ON 상태에서 만든 계정은 미인증 상태로 남을 수 있습니다.  
설정을 OFF로 바꾼 뒤 기존 테스트 계정을 삭제하고 새로 회원가입해 확인하는 것을 권장합니다.

Google 로그인:

- 현재 Supabase Google Provider는 비활성화 상태
- 제출 시연에서는 이메일 로그인 또는 데모 계정을 사용
- 앱에서는 Google 버튼을 눌러도 비활성화 안내만 표시

## 로컬 실행

```bash
npm install
npm run dev
```

개발 서버 기본 포트는 Vite 설정상 `8080`입니다.

## 검증 명령

```bash
npm run build
npm test
```

최근 검증 결과:

- `npm run build` 통과
- `npm test` 통과

## GitHub Pages 배포 방식

Vite 설정에서 GitHub Pages용 base 경로는 다음 조건으로 적용됩니다.

```ts
base: process.env.GITHUB_PAGES === "true" ? "/afterwork-unwind/" : "/"
```

배포 빌드:

```powershell
$env:GITHUB_PAGES='true'
npm run build
Remove-Item Env:\GITHUB_PAGES
```

이후 `dist` 산출물을 `gh-pages` 브랜치 작업 폴더에 복사하고 커밋/푸시합니다.

현재 배포 브랜치:

- `gh-pages`

마지막 확인된 배포 링크:

- https://leoa4238.github.io/afterwork-unwind/

## 중요한 파일 위치

### Supabase

- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`

### 인증/데모

- `src/hooks/useAuth.tsx`
- `src/lib/demoAuth.ts`
- `src/pages/Login.tsx`
- `src/pages/Signup.tsx`

### AI fallback

- `src/lib/localAi.ts`
- `src/components/AIConcierge.tsx`
- `src/components/AISearchPanel.tsx`
- `src/components/BarAIInsights.tsx`
- `src/components/NetworkingAIMatch.tsx`
- `src/pages/ChatRoom.tsx`

### 네트워킹/프로필/채팅

- `src/pages/Networking.tsx`
- `src/components/UserProfileDialog.tsx`
- `src/pages/Chat.tsx`
- `src/pages/ChatRoom.tsx`

### 관리자

- `src/pages/Admin.tsx`

### 배포 설정

- `vite.config.ts`
- `package.json`

### Supabase SQL 산출물

- `outputs/supabase-fresh-project-setup.sql`
- `outputs/supabase-bar-crud-policy.sql`

## 제출 시연 권장 흐름

1. 배포 링크 접속
2. `/explore`에서 바 목록 확인
3. AI 추천 패널 사용
4. 바 상세 페이지에서 리뷰와 AI 인사이트 확인
5. 데모 로그인
6. 네트워킹 ON 상태 확인
7. 네트워킹 사용자 카드 클릭
8. 미니 프로필 모달 확인
9. 프로필 모달에서 대화 요청
10. 채팅방에서 자동 응답 흐름 확인
11. 실제 이메일 계정으로 로그인
12. `/admin`에서 바 수동 등록/수정/삭제 시연

## 발표용 문제 정의

퇴근 후 직장인들은 혼자 쉬고 싶거나 가볍게 대화하고 싶은 순간이 있지만, 기존 네트워킹 서비스는 프로필 중심이라 부담스럽고, 일반 맛집/술집 추천 서비스는 사람과의 연결까지 제공하지 못합니다.

퇴근한잔은 이 문제를 해결하기 위해 “사람을 먼저 고르는 방식”이 아니라 “오늘 가고 싶은 바와 분위기”를 기준으로 자연스럽게 네트워킹을 시작하도록 설계했습니다.

## 발표용 차별점

- 바의 분위기를 기반으로 네트워킹을 연결
- 혼술, 조용함, 대화하기 좋음, 직장인 선호도 같은 맥락을 반영
- AI가 바 추천, 사람 매칭, 대화 시작 문장을 보조
- 프로필 중심 매칭보다 부담이 적음
- Supabase 기반으로 실제 DB CRUD와 인증 흐름을 구현

## 현재 한계와 향후 고도화

현재 한계:

- 실제 사용자가 많지 않아 네트워킹 데이터는 데모/샘플 의존도가 있음
- Supabase Edge Function이 실제 배포되지 않은 AI 기능은 로컬 fallback으로 동작
- Google 로그인 Provider는 비활성화 상태
- 실제 운영 수준의 신고/차단/매너 점수/예약 기능은 추가 고도화 필요

향후 고도화:

- Supabase Edge Functions에 AI 추천/매칭/챗봇 실제 배포
- 실제 사용자 프로필 데이터 기반 매칭 정확도 개선
- 바 예약 또는 모임 생성 기능 추가
- 매너 평가, 신고/차단 강화
- 시간대별 “오늘 같이 갈 사람” 기능
- 사용자 선호 데이터 기반 개인화 추천

## 다른 AI나 개발자가 이어받을 때 주의할 점

- `.env`는 로컬에만 남아 있으며 커밋하면 안 됨
- main 브랜치와 gh-pages 브랜치를 구분할 것
- 앱 코드 수정 후 실제 배포 사이트에 반영하려면 `GITHUB_PAGES=true`로 빌드한 산출물을 gh-pages에 올려야 함
- Supabase Auth가 안 되는 경우 가장 먼저 `Confirm email` 설정과 Site URL/Redirect URL을 확인할 것
- AI 함수 호출 실패는 현재 의도된 fallback 흐름일 수 있으므로 무조건 버그로 판단하지 말 것
- 데모 로그인은 과제 시연 안정성을 위한 localStorage 기반 흐름임
- “실제 DB 연동”과 “시연용 fallback”을 발표에서 명확히 구분해 설명할 것

## 최근 주요 커밋

- `1bf76ca`: Auth 안내 및 데모/fallback 흐름 개선
- `c01a55c`: 네트워킹 사용자 프로필 모달 추가
- `f791b36`: 프로필 모달 포함 GitHub Pages 배포
