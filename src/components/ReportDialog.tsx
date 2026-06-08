import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const REASONS = [
  { value: "spam", label: "스팸·광고" },
  { value: "harassment", label: "괴롭힘·욕설" },
  { value: "inappropriate", label: "부적절한 콘텐츠" },
  { value: "fake", label: "허위·사칭" },
  { value: "other", label: "기타" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reporterId: string;
  reportedUserId: string;
  roomId?: string;
  onReported?: () => void;
}

const ReportDialog = ({ open, onOpenChange, reporterId, reportedUserId, roomId, onReported }: Props) => {
  const [reason, setReason] = useState("harassment");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!reporterId || !reportedUserId) return;
    setSubmitting(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      room_id: roomId || null,
      reason,
      detail: detail.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("신고 접수에 실패했어요");
      return;
    }
    toast.success("신고가 접수되었어요. 빠르게 검토할게요.");
    setDetail("");
    onOpenChange(false);
    onReported?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>대화 신고하기</DialogTitle>
          <DialogDescription>익명으로 접수되며, 운영팀이 검토합니다.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">신고 사유</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="mt-2 space-y-1">
              {REASONS.map((r) => (
                <div key={r.value} className="flex items-center gap-2">
                  <RadioGroupItem value={r.value} id={`reason-${r.value}`} />
                  <Label htmlFor={`reason-${r.value}`} className="text-sm font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">자세한 내용 (선택)</Label>
            <Textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="어떤 일이 있었는지 알려주세요"
              className="mt-1 min-h-[80px]"
              maxLength={500}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              취소
            </Button>
            <Button variant="destructive" onClick={submit} disabled={submitting}>
              {submitting ? "전송 중..." : "신고하기"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
