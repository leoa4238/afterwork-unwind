import { describe, expect, it } from "vitest";
import { buildLocalChatReply } from "@/lib/localAi";

describe("local chat reply", () => {
  it("uses location context when the user mentions an area", () => {
    const reply = buildLocalChatReply("잠실쪽으로 가고 싶어요", "민수");

    expect(reply).toContain("잠실");
  });

  it("avoids repeating a recent fallback reply", () => {
    const previous = buildLocalChatReply("그냥 편하게요", "민수");
    const next = buildLocalChatReply("그냥 편하게요", "민수", {
      recentReplies: [previous],
    });

    expect(next).not.toBe(previous);
  });
});
