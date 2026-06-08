
-- =========================
-- NOTIFICATIONS
-- =========================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'chat_request' | 'chat_message' | 'system'
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE is_read = false;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- INSERT only via SECURITY DEFINER triggers/functions; no direct insert policy.

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- =========================
-- BLOCKS
-- =========================
CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
CREATE INDEX idx_blocks_blocker ON public.blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON public.blocks(blocked_id);

GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own blocks" ON public.blocks
  FOR SELECT TO authenticated USING (auth.uid() = blocker_id);
CREATE POLICY "Users create own blocks" ON public.blocks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users delete own blocks" ON public.blocks
  FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

-- helper: is there any block between A and B (either direction)?
CREATE OR REPLACE FUNCTION public.is_blocked_between(_a UUID, _b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = _a AND blocked_id = _b)
       OR (blocker_id = _b AND blocked_id = _a)
  );
$$;

-- =========================
-- REPORTS
-- =========================
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  room_id UUID,
  reason TEXT NOT NULL, -- 'spam' | 'harassment' | 'inappropriate' | 'fake' | 'other'
  detail TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'reviewed' | 'actioned' | 'dismissed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (reporter_id <> reported_user_id)
);
CREATE INDEX idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX idx_reports_reported ON public.reports(reported_user_id);
CREATE INDEX idx_reports_status ON public.reports(status);

GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reports" ON public.reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
CREATE POLICY "Users create reports" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- =========================
-- TRIGGERS: auto notifications
-- =========================

-- 1) new chat_room → notify the other participant
CREATE OR REPLACE FUNCTION public.notify_chat_room_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient UUID;
  v_sender UUID;
  v_sender_nick TEXT;
BEGIN
  -- requester is user1, recipient is user2 (by app convention)
  v_sender := NEW.user1_id;
  v_recipient := NEW.user2_id;

  SELECT nickname INTO v_sender_nick FROM public.profiles WHERE user_id = v_sender LIMIT 1;

  INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
  VALUES (
    v_recipient,
    'chat_request',
    COALESCE(v_sender_nick, '누군가') || '님이 대화를 시작했어요',
    '24시간 동안 대화할 수 있어요',
    '/chat/' || NEW.id::text,
    jsonb_build_object('room_id', NEW.id, 'from', v_sender)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_chat_room_created
AFTER INSERT ON public.chat_rooms
FOR EACH ROW EXECUTE FUNCTION public.notify_chat_room_created();

-- 2) new chat_message → notify the other participant
CREATE OR REPLACE FUNCTION public.notify_chat_message_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room RECORD;
  v_recipient UUID;
  v_sender_nick TEXT;
BEGIN
  SELECT user1_id, user2_id INTO v_room FROM public.chat_rooms WHERE id = NEW.room_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  v_recipient := CASE WHEN NEW.sender_id = v_room.user1_id THEN v_room.user2_id ELSE v_room.user1_id END;
  IF v_recipient IS NULL OR v_recipient = NEW.sender_id THEN RETURN NEW; END IF;

  SELECT nickname INTO v_sender_nick FROM public.profiles WHERE user_id = NEW.sender_id LIMIT 1;

  INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
  VALUES (
    v_recipient,
    'chat_message',
    COALESCE(v_sender_nick, '대화 상대') || '님의 새 메시지',
    LEFT(NEW.content, 80),
    '/chat/' || NEW.room_id::text,
    jsonb_build_object('room_id', NEW.room_id, 'from', NEW.sender_id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_chat_message_created
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_chat_message_created();

-- =========================
-- TRIGGERS: block enforcement
-- =========================

CREATE OR REPLACE FUNCTION public.enforce_block_on_chat_room()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_blocked_between(NEW.user1_id, NEW.user2_id) THEN
    RAISE EXCEPTION '차단된 사용자와는 대화할 수 없습니다' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_block_chat_room
BEFORE INSERT ON public.chat_rooms
FOR EACH ROW EXECUTE FUNCTION public.enforce_block_on_chat_room();

CREATE OR REPLACE FUNCTION public.enforce_block_on_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room RECORD;
BEGIN
  SELECT user1_id, user2_id INTO v_room FROM public.chat_rooms WHERE id = NEW.room_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  IF public.is_blocked_between(v_room.user1_id, v_room.user2_id) THEN
    RAISE EXCEPTION '차단된 대화방입니다' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_block_chat_message
BEFORE INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_block_on_chat_message();
