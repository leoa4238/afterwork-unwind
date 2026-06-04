
-- 1) Tighten profiles SELECT policy
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated can view discoverable profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_demo = true OR (networking_enabled = true AND available_now = true));

-- 2) Realtime channel authorization: only room participants can subscribe to room-<uuid>
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Room participants can read realtime topic" ON realtime.messages;
CREATE POLICY "Room participants can read realtime topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    WHERE 'room-' || cr.id::text = realtime.topic()
      AND (cr.user1_id = (SELECT auth.uid()) OR cr.user2_id = (SELECT auth.uid()))
  )
);
