-- Restrict word updates to the columns edited by the application.
-- Apply only to the existing linked Supabase project until a full baseline
-- migration has been pulled into supabase/migrations/.

BEGIN;

REVOKE UPDATE ON TABLE public.words FROM anon, authenticated;
REVOKE UPDATE (id, text, difficulty, owner_id, created_at, updated_at)
  ON TABLE public.words FROM anon, authenticated;

GRANT UPDATE (text, difficulty, updated_at)
  ON TABLE public.words TO authenticated;

ALTER POLICY words_update_by_list_permission ON public.words
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.list_words lw
      WHERE lw.word_id = words.id
        AND public.can_edit_list_words(lw.list_id)
    )
  );

COMMIT;
