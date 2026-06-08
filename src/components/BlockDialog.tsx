import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  blockerId: string;
  blockedId: string;
  blockedNickname?: string;
  onBlocked?: () => void;
}

const BlockDialog = ({ open, onOpenChange, blockerId, blockedId, blockedNickname, onBlocked }: Props) => {
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!blockerId || !blockedId) return;
    setSubmitting(true);
    const { error } = await supabase.from("blocks").insert({ blocker_id: blockerId, blocked_id: blockedId });
    setSubmitting(false);
    if (error && !error.message.includes("duplicate")) {
      toast.error("차단에 실패했어요");
      return;
    }
    toast.success("차단했어요. 더는 대화/매칭되지 않아요.");
    onOpenChange(false);
    onBlocked?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{blockedNickname ? `${blockedNickname}님을` : "이 사용자를"} 차단할까요?</DialogTitle>
          <DialogDescription>
            차단하면 이 사람과 새 대화방을 만들거나 메시지를 주고받을 수 없어요. 마이페이지에서 언제든 해제할 수 있어요.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            취소
          </Button>
          <Button variant="destructive" onClick={submit} disabled={submitting}>
            {submitting ? "처리 중..." : "차단"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlockDialog;
