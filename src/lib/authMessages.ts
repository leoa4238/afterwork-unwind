export const getLoginAuthErrorMessage = (message: string) => {
  const normalized = message.toLowerCase();

  if (message === "Invalid login credentials") {
    return "이메일 또는 비밀번호가 올바르지 않아요";
  }
  if (normalized.includes("email not confirmed")) {
    return "이메일 인증이 아직 완료되지 않았어요. 인증 메일을 확인하거나 Supabase에서 Confirm email을 꺼주세요.";
  }
  if (normalized.includes("email rate limit")) {
    return "Supabase 인증 메일 발송 제한에 걸렸어요. 잠시 후 다시 시도하거나 Confirm email을 꺼주세요.";
  }

  return message;
};

export const getSignupAuthErrorMessage = (message: string) => {
  const normalized = message.toLowerCase();

  if (normalized.includes("email rate limit")) {
    return "Supabase 인증 메일 발송 제한에 걸렸어요. 과제 시연용이면 Supabase에서 Confirm email을 끄고 다시 가입해주세요.";
  }
  if (normalized.includes("user already registered") || normalized.includes("already registered")) {
    return "이미 가입된 이메일이에요. 로그인하거나 다른 이메일을 사용해주세요.";
  }

  return message;
};
