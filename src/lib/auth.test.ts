import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { getLoginAuthErrorMessage, getSignupAuthErrorMessage } from "@/lib/authMessages";
import { createProfileInsertPayload, getDefaultNickname } from "@/lib/authProfile";

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: "user-1",
    email: "tester@example.com",
    user_metadata: {},
    app_metadata: {},
    aud: "authenticated",
    created_at: "2026-06-12T00:00:00.000Z",
    ...overrides,
  }) as User;

describe("auth messages", () => {
  it("maps common login failures to Korean messages", () => {
    expect(getLoginAuthErrorMessage("Invalid login credentials")).toBe("이메일 또는 비밀번호가 올바르지 않아요");
    expect(getLoginAuthErrorMessage("Email not confirmed")).toContain("이메일 인증");
  });

  it("maps common signup failures to Korean messages", () => {
    expect(getSignupAuthErrorMessage("User already registered")).toContain("이미 가입된 이메일");
    expect(getSignupAuthErrorMessage("email rate limit exceeded")).toContain("인증 메일 발송 제한");
  });
});

describe("profile payload", () => {
  it("uses explicit signup form values first", () => {
    const payload = createProfileInsertPayload(makeUser(), {
      nickname: "코덱스",
      ageRange: "30대 초반",
      jobGroup: "IT/개발",
    });

    expect(payload).toMatchObject({
      user_id: "user-1",
      nickname: "코덱스",
      age_range: "30대 초반",
      job_group: "IT/개발",
    });
  });

  it("falls back to user metadata and email for missing values", () => {
    const user = makeUser({
      email: "afterwork@example.com",
      user_metadata: {
        nickname: "메타닉",
        age_range: "20대 후반",
        job_group: "마케팅",
      },
    });

    expect(getDefaultNickname(user)).toBe("메타닉");
    expect(createProfileInsertPayload(user)).toMatchObject({
      nickname: "메타닉",
      age_range: "20대 후반",
      job_group: "마케팅",
    });
  });
});
