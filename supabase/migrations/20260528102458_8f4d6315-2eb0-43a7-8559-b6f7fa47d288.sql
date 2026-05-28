
CREATE TABLE public.bars (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  area TEXT NOT NULL,
  category TEXT NOT NULL,
  price_range TEXT NOT NULL,
  is_open_now BOOLEAN NOT NULL DEFAULT true,
  solo_friendly_score INT NOT NULL DEFAULT 0,
  quiet_score INT NOT NULL DEFAULT 0,
  networking_friendly BOOLEAN NOT NULL DEFAULT false,
  ai_summary TEXT,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  distance TEXT,
  image_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bars TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bars TO authenticated;
GRANT ALL ON public.bars TO service_role;
ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bars are publicly readable" ON public.bars FOR SELECT USING (true);

CREATE TABLE public.bar_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id TEXT NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  tag TEXT NOT NULL
);
CREATE INDEX idx_bar_tags_bar_id ON public.bar_tags(bar_id);
CREATE INDEX idx_bar_tags_tag ON public.bar_tags(tag);
GRANT SELECT ON public.bar_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bar_tags TO authenticated;
GRANT ALL ON public.bar_tags TO service_role;
ALTER TABLE public.bar_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bar tags are publicly readable" ON public.bar_tags FOR SELECT USING (true);

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id TEXT NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  user_id UUID,
  user_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_bar_id ON public.reviews(bar_id);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are publicly readable" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.bars (id, name, address, area, category, price_range, is_open_now, solo_friendly_score, quiet_score, networking_friendly, ai_summary, rating, review_count, distance, image_key) VALUES
('1','Bar Mellow','서울 강남구 역삼동 123-4','강남','위스키바','₩₩₩',true,95,90,false,'혼자 방문해도 전혀 어색하지 않다는 후기가 많습니다. 바 좌석 중심이라 짧게 머물기 좋고, 위스키 셀렉션이 훌륭합니다.',4.7,128,'350m','whiskey'),
('2','을지로 골목집','서울 중구 을지로3가 280-5','을지로','하이볼바','₩₩',true,88,60,true,'을지로 특유의 레트로 감성이 매력적인 곳. 직장인들이 퇴근 후 많이 찾으며, 가볍게 대화 나누기 좋은 분위기입니다.',4.4,89,'500m','retro'),
('3','와인앤피스','서울 영등포구 여의도동 45-2','여의도','와인바','₩₩₩',true,92,85,false,'조용하고 아늑한 분위기에서 와인을 즐기기 좋은 곳입니다. 1인 고객 배려가 잘 되어있고, 금요일 저녁은 다소 붐비는 편입니다.',4.6,156,'200m','wine'),
('4','성수 브루어리','서울 성동구 성수동2가 315-20','성수','맥주바','₩₩',false,75,50,true,'성수동 특유의 힙한 분위기에 크래프트 맥주가 다양합니다. 혼자보다는 가볍게 대화하며 마시기 좋은 곳이에요.',4.3,203,'800m','beer'),
('5','판교 나이트캡','경기 성남시 분당구 판교역로 231','판교','위스키바','₩₩₩₩',true,97,95,false,'판교 IT 직장인들의 숨겨진 아지트. 바텐더가 취향에 맞는 위스키를 추천해주며, 혼자 조용히 마시기에 최적입니다.',4.8,67,'150m','premium'),
('6','강남 소셜라운지','서울 강남구 테헤란로 415','강남','칵테일바','₩₩₩',true,70,45,true,'가볍게 대화하며 칵테일을 즐기기 좋은 곳. 직장인 네트워킹에 최적화된 분위기이며, 금요일에는 소규모 이벤트도 열립니다.',4.2,94,'450m','cocktail'),
('7','여의도 문바','서울 영등포구 여의대로 108','여의도','하이볼바','₩₩',true,85,75,false,'한강 야경이 보이는 창가석이 인기입니다. 하이볼이 맛있고, 혼자 조용히 야경 보며 한잔하기에 완벽한 곳.',4.5,142,'300m','highball'),
('8','을지로 앤틱바','서울 중구 을지로 157','을지로','와인바','₩₩₩',true,90,88,false,'앤틱한 인테리어가 매력적인 와인바. 혼자 와서 책을 읽으며 와인을 마시는 손님도 많습니다. 조용하고 분위기 좋습니다.',4.6,78,'600m','wine');

INSERT INTO public.bar_tags (bar_id, tag) VALUES
('1','혼자 가기 편함'),('1','조용한 편'),('1','위스키'),('1','바 좌석 많음'),
('2','직장인 선호'),('2','하이볼'),('2','대화하기 좋음'),('2','레트로 감성'),
('3','혼자 가기 편함'),('3','와인'),('3','조용한 편'),('3','오래 머무르기 좋음'),
('4','크래프트 맥주'),('4','직장인 선호'),('4','대화하기 좋음'),('4','넓은 공간'),
('5','혼자 가기 편함'),('5','위스키'),('5','조용한 편'),('5','프리미엄'),
('6','칵테일'),('6','대화하기 좋음'),('6','직장인 선호'),('6','네트워킹'),
('7','하이볼'),('7','혼자 가기 편함'),('7','야경 뷰'),('7','감성적'),
('8','와인'),('8','조용한 편'),('8','앤틱 인테리어'),('8','오래 머무르기 좋음');

INSERT INTO public.reviews (bar_id, user_name, rating, content) VALUES
('1','직장인A',5,'퇴근 후 혼자 들르기 딱 좋아요. 바텐더가 말 안 걸어서 편하고, 위스키 종류도 다양합니다.'),
('1','야근러',4,'바 좌석이 편하고 조명이 좋습니다. 금요일은 좀 붐비는 편.'),
('1','위스키러버',5,'싱글몰트 라인업이 인상적. 혼자 와서 한 잔 하기에 최고.'),
('2','을지로단골',4,'레트로한 분위기가 최고. 친구랑 가볍게 한잔하기 좋아요.'),
('2','퇴근직장인',5,'하이볼이 진하고 가격도 합리적입니다.'),
('3','와인초보',5,'혼자 와도 전혀 어색하지 않은 분위기. 다시 올 예정!'),
('3','소믈리에지망',4,'와인 셀렉션이 다양하고 직원이 친절해요.'),
('4','맥덕',4,'크래프트 종류가 정말 많아요. 시끌벅적한 분위기.'),
('5','판교IT',5,'조용히 한잔하기 최적. 바텐더 추천이 정확합니다.'),
('6','네트워커',4,'사람들이랑 자연스럽게 대화하기 좋은 분위기.'),
('7','한강뷰러버',5,'창가 자리는 무조건 예약. 야경이 환상.'),
('8','책읽는사람',5,'조용하고 인테리어 너무 좋아요. 와인 마시며 책 읽기 최고.');
