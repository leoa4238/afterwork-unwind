
-- Create chat_rooms table
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  is_expired BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT different_users CHECK (user1_id != user2_id)
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat rooms policies
CREATE POLICY "Users can view their own chat rooms"
ON public.chat_rooms FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Authenticated users can create chat rooms"
ON public.chat_rooms FOR INSERT
WITH CHECK (auth.uid() = user1_id);

-- Chat messages policies
CREATE POLICY "Users can view messages in their rooms"
ON public.chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE chat_rooms.id = chat_messages.room_id
    AND (chat_rooms.user1_id = auth.uid() OR chat_rooms.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their non-expired rooms"
ON public.chat_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE chat_rooms.id = chat_messages.room_id
    AND (chat_rooms.user1_id = auth.uid() OR chat_rooms.user2_id = auth.uid())
    AND chat_rooms.is_expired = false
    AND chat_rooms.expires_at > now()
  )
);

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Index for performance
CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id, created_at);
CREATE INDEX idx_chat_rooms_users ON public.chat_rooms(user1_id, user2_id);

-- Function to auto-expire rooms
CREATE OR REPLACE FUNCTION public.expire_chat_rooms()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chat_rooms
  SET is_expired = true
  WHERE expires_at <= now() AND is_expired = false;
END;
$$;
