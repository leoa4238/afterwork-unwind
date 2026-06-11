# 퇴근한잔 진행상황

최종 정리일: 2026-06-11

## 배포

- 배포 링크: https://leoa4238.github.io/afterwork-unwind/
- GitHub Pages `gh-pages` 브랜치 기준 배포 완료
- 새 Supabase 프로젝트 연결 완료

## 제출 시연용 Supabase Auth 설정

- 과제 시연 안정성을 위해 Supabase Dashboard > Authentication > Providers > Email에서 `Confirm email`을 OFF로 두는 것을 권장합니다.
- `Confirm email`이 ON이면 회원가입은 완료되어도 이메일 인증 전에는 로그인 세션이 생성되지 않습니다.
- Supabase 무료 프로젝트는 인증 메일 발송 제한이 있어 `email rate limit exceeded`가 발생할 수 있습니다. 이 경우 과제 시연 중 회원가입/로그인 검증이 막힐 수 있으므로 `Confirm email` OFF 설정이 안전합니다.
- 기존에 이메일 인증 ON 상태에서 만든 계정은 미인증 상태로 남을 수 있습니다. 설정을 OFF로 바꾼 뒤 기존 테스트 계정을 삭제하고 새로 가입해 로그인 확인하는 것을 권장합니다.
- URL 설정:
  - Site URL: `https://leoa4238.github.io/afterwork-unwind`
  - Redirect URL: `https://leoa4238.github.io/afterwork-unwind/**`
- Google 로그인은 현재 Supabase Provider가 비활성화되어 있으므로 제출 시연에서는 이메일 로그인 또는 데모 계정을 사용합니다.

## 완료된 기능

- 홈/탐색/상세/마이페이지 기본 화면 구성
- Supabase `bars`, `bar_tags`, `reviews`, `profiles`, `chat_rooms` 등 기본 테이블 생성
- 바 목록 조회 및 상세 페이지 조회
- 리뷰 목록 표시
- 데모 로그인
- 데모 네트워킹
- 네트워킹 사용자 프로필 모달
- 데모 채팅방 생성 및 메시지 전송
- 채팅방 상단 상대 프로필 확인
- 관리자 페이지 진입
- 관리자 수동 바 등록 CRUD UI 구현
- GitHub Pages 라우팅 대응
- 발표용 PPT 초안 작성

## 보완 완료

- 새 Supabase에 Edge Function이 없어도 화면이 멈추지 않도록 프론트엔드 fallback 적용
- AI 바 추천 fallback
- AI 컨시어지 fallback
- 바 상세 AI 인사이트 fallback
- 네트워킹 AI 매칭 fallback
- 관리자 크롤러 fallback
- 데모 로그인 상태에서 실제 DB 쓰기 기능은 안내 후 차단

## 확인된 동작

- 배포 사이트에서 Supabase 바 데이터 조회 확인
- `/explore` 바 목록 표시 확인
- `/bar/:id` 상세 화면 및 리뷰 표시 확인
- 데모 로그인 후 네트워킹/채팅 동작 확인
- AI 추천/컨시어지/네트워킹 매칭 fallback 동작 확인
- `/admin` 관리자 화면 렌더링 확인
- `npm run build` 통과
- `npm test` 통과

## 남은 작업

- 실제 이메일 계정으로 회원가입/로그인 후 관리자 CRUD 최종 확인
- Supabase Authentication 설정 최종 확인
- Edge Function 실제 배포 여부 결정
  - 현재는 fallback으로 발표 가능
  - 실제 서버 AI를 쓰려면 Supabase Edge Functions와 API secrets 설정 필요
- PPT 최종 캡처 이미지와 제출 링크 반영

## 제출 시연 권장 흐름

1. 배포 링크 접속
2. 탐색 화면에서 바 목록 확인
3. AI 추천 버튼 클릭
4. 바 상세 화면에서 AI 인사이트와 리뷰 확인
5. 데모 로그인
6. 네트워킹 매칭 및 채팅 시연
7. 실제 계정 로그인 후 `/admin`에서 Supabase 수동 바 등록 시연
