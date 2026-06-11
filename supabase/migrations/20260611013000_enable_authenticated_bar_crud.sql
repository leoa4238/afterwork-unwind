DROP POLICY IF EXISTS "Authenticated users can create bars" ON public.bars;
DROP POLICY IF EXISTS "Authenticated users can update bars" ON public.bars;
DROP POLICY IF EXISTS "Authenticated users can delete bars" ON public.bars;
DROP POLICY IF EXISTS "Authenticated users can create bar tags" ON public.bar_tags;
DROP POLICY IF EXISTS "Authenticated users can update bar tags" ON public.bar_tags;
DROP POLICY IF EXISTS "Authenticated users can delete bar tags" ON public.bar_tags;

CREATE POLICY "Authenticated users can create bars"
  ON public.bars
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update bars"
  ON public.bars
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bars"
  ON public.bars
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create bar tags"
  ON public.bar_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update bar tags"
  ON public.bar_tags
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bar tags"
  ON public.bar_tags
  FOR DELETE
  TO authenticated
  USING (true);
