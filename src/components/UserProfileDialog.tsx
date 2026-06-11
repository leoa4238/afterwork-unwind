import type { ReactNode } from "react";
import { Briefcase, CalendarDays, MapPin, MessageCircle, Sparkles, UserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface UserProfilePreview {
  id?: string;
  user_id?: string | null;
  nickname?: string | null;
  age_range?: string | null;
  job_group?: string | null;
  area?: string | null;
  talk_topics?: string[] | null;
  available_now?: boolean | null;
  networking_enabled?: boolean | null;
}

interface UserProfileDialogProps {
  profile: UserProfilePreview | null;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onStartChat?: () => void;
  chatLoading?: boolean;
  chatDisabled?: boolean;
  startChatLabel?: string;
}

const getInitial = (name?: string | null) => {
  const normalized = name?.trim();
  return normalized ? normalized.slice(0, 1).toUpperCase() : "U";
};

const buildConversationHint = (profile: UserProfilePreview) => {
  const topic = profile.talk_topics?.[0];
  const area = profile.area;

  if (topic && area) {
    return `${area} 근처에서 ${topic} 이야기로 가볍게 말문을 열어보세요.`;
  }
  if (topic) {
    return `${topic}를 주제로 오늘 퇴근 후 관심사를 물어보면 자연스럽게 시작할 수 있어요.`;
  }
  if (area) {
    return `${area}에서 자주 가는 바나 좋아하는 분위기를 물어보면 좋아요.`;
  }
  return "오늘 퇴근 후 어떤 분위기의 바를 좋아하는지 물어보면 부담 없이 시작할 수 있어요.";
};

const UserProfileDialog = ({
  profile,
  trigger,
  open,
  onOpenChange,
  onStartChat,
  chatLoading = false,
  chatDisabled = false,
  startChatLabel = "대화 요청",
}: UserProfileDialogProps) => {
  if (!profile) return null;

  const nickname = profile.nickname || "익명 사용자";
  const topics = profile.talk_topics ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-sm rounded-2xl border-border p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/15 via-background to-background px-5 pt-6 pb-4">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 border border-primary/20 bg-background">
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {getInitial(nickname)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-serif truncate">{nickname}</DialogTitle>
                <DialogDescription className="mt-1">
                  {profile.job_group || "직무 미설정"} · {profile.age_range || "연령대 미설정"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Briefcase className="w-3.5 h-3.5" />
                직무
              </div>
              <p className="text-sm font-medium text-foreground truncate">{profile.job_group || "미설정"}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <MapPin className="w-3.5 h-3.5" />
                활동 지역
              </div>
              <p className="text-sm font-medium text-foreground truncate">{profile.area || "미설정"}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <CalendarDays className="w-3.5 h-3.5" />
              네트워킹 상태
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="border-0">
                {profile.available_now === false ? "지금은 대화 어려움" : "지금 대화 가능"}
              </Badge>
              <Badge variant="outline" className="border-primary/30 text-primary">
                바 기반 네트워킹
              </Badge>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              관심 대화 주제
            </div>
            <div className="flex flex-wrap gap-1.5">
              {topics.length > 0 ? (
                topics.map((topic) => (
                  <Badge key={topic} variant="secondary" className="border-0">
                    {topic}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">등록된 관심사가 아직 없어요.</span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs font-medium text-primary mb-1">AI 아이스브레이커</p>
            <p className="text-sm text-foreground/85 leading-relaxed">{buildConversationHint(profile)}</p>
          </div>

          {onStartChat && (
            <Button className="w-full" variant="hero" onClick={onStartChat} disabled={chatDisabled || chatLoading}>
              <MessageCircle className="w-4 h-4" />
              {chatLoading ? "요청 중..." : startChatLabel}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;
