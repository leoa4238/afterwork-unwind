-- 1. profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  age_range text,
  job_group text,
  area text DEFAULT '서울',
  talk_topics text[] NOT NULL DEFAULT '{}',
  networking_enabled boolean NOT NULL DEFAULT false,
  available_now boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Grants
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 3. RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nickname, age_range, job_group)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'nickname',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'age_range',
    NEW.raw_user_meta_data->>'job_group'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Demo profiles for networking AI matching showcase
INSERT INTO public.profiles (nickname, age_range, job_group, area, talk_topics, networking_enabled, available_now, is_demo)
VALUES
  ('지훈', '30대 초반', 'IT/개발', '강남', ARRAY['사이드프로젝트','위스키','러닝'], true, true, true),
  ('서연', '20대 후반', '마케팅', '성수', ARRAY['와인','전시','브랜딩'], true, true, true),
  ('현우', '30대 중반', '금융', '여의도', ARRAY['주식','맥주','야구'], true, true, true),
  ('민아', '20대 후반', '디자인', '한남', ARRAY['칵테일','음악','영화'], true, true, true),
  ('태경', '30대 초반', '기획/PM', '판교', ARRAY['스타트업','보드게임','하이볼'], true, true, true),
  ('유리', '20대 초반', '인사', '홍대', ARRAY['LP바','재즈','글쓰기'], true, true, true);
