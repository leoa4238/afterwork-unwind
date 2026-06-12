import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

export interface ProfileDraft {
  nickname?: string;
  ageRange?: string;
  jobGroup?: string;
}

const cleanOptional = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const getDefaultNickname = (user: User) => {
  const metadataNickname = cleanOptional(user.user_metadata?.nickname as string | undefined);
  if (metadataNickname) return metadataNickname;

  const emailName = cleanOptional(user.email?.split("@")[0]);
  return emailName || "퇴근러";
};

export const createProfileInsertPayload = (user: User, draft: ProfileDraft = {}): ProfileInsert => {
  const metadata = user.user_metadata ?? {};

  return {
    user_id: user.id,
    nickname: cleanOptional(draft.nickname) || getDefaultNickname(user),
    age_range: cleanOptional(draft.ageRange) || cleanOptional(metadata.age_range as string | undefined),
    job_group: cleanOptional(draft.jobGroup) || cleanOptional(metadata.job_group as string | undefined),
  };
};

export const ensureUserProfile = async (user: User, draft: ProfileDraft = {}) => {
  const payload = createProfileInsertPayload(user, draft);

  return supabase
    .from("profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();
};
