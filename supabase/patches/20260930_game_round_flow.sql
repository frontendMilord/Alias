-- Prepare rounds before the timer starts and persist timer pauses.
-- This patch supersedes the initial start_game_round implementation.

-- Confirmed scoring rules allow a team's cumulative score to go below zero.
-- Remove only CHECK constraints on game_teams that enforce score >= 0.
DO $$
DECLARE
	v_constraint record;
BEGIN
	FOR v_constraint IN
		SELECT conname
		FROM pg_constraint
		WHERE conrelid = 'public.game_teams'::regclass
			AND contype = 'c'
			AND pg_get_constraintdef(oid) ILIKE '%score%>=%0%'
	LOOP
		EXECUTE format(
			'ALTER TABLE public.game_teams DROP CONSTRAINT %I',
			v_constraint.conname
		);
	END LOOP;
END;
$$;

ALTER TABLE public.game_rounds
	ADD COLUMN IF NOT EXISTS paused_at timestamptz,
	ADD COLUMN IF NOT EXISTS paused_seconds integer NOT NULL DEFAULT 0;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conrelid = 'public.game_rounds'::regclass
			AND conname = 'game_rounds_paused_seconds_nonnegative'
	) THEN
		ALTER TABLE public.game_rounds
			ADD CONSTRAINT game_rounds_paused_seconds_nonnegative
			CHECK (paused_seconds >= 0);
	END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_game_round(p_game_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
	v_game public.games%ROWTYPE;
	v_team_id uuid;
	v_player_id uuid;
	v_round_id uuid;
	v_word_count integer;
BEGIN
	SELECT *
	INTO v_game
	FROM public.games
	WHERE id = p_game_id
		AND owner_id = auth.uid()
		AND status = 'active'
	FOR UPDATE;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'Active game not found or access denied';
	END IF;

	IF v_game.current_team_id IS NOT NULL OR v_game.current_explainer_player_id IS NOT NULL THEN
		RAISE EXCEPTION 'A round has already been prepared for this game';
	END IF;

	SELECT id
	INTO v_team_id
	FROM public.game_teams
	WHERE game_id = p_game_id
	ORDER BY team_order
	LIMIT 1;

	IF v_team_id IS NULL THEN
		RAISE EXCEPTION 'Game has no teams';
	END IF;

	SELECT id
	INTO v_player_id
	FROM public.game_players
	WHERE team_id = v_team_id
	ORDER BY player_order
	LIMIT 1;

	IF v_player_id IS NULL THEN
		RAISE EXCEPTION 'First team has no players';
	END IF;

	INSERT INTO public.game_rounds (
		game_id,
		team_id,
		explainer_player_id,
		round_number,
		status,
		started_at
	)
	VALUES (
		p_game_id,
		v_team_id,
		v_player_id,
		v_game.current_round_number,
		'preparation',
		NULL
	)
	RETURNING id INTO v_round_id;

	WITH eligible_words AS (
		SELECT DISTINCT ON (w.id)
			w.id,
			w.text,
			w.difficulty
		FROM public.list_words AS lw
		JOIN public.words AS w ON w.id = lw.word_id
		WHERE lw.list_id = ANY(v_game.selected_lists)
			AND w.difficulty = ANY(v_game.selected_difficulties)
		ORDER BY w.id
	), shuffled_words AS (
		SELECT
			id,
			text,
			difficulty,
			row_number() OVER (ORDER BY random())::integer AS displayed_order
		FROM eligible_words
	)
	INSERT INTO public.round_words (
		round_id,
		word_id,
		word_text,
		difficulty,
		displayed_order
	)
	SELECT v_round_id, id, text, difficulty, displayed_order
	FROM shuffled_words;

	GET DIAGNOSTICS v_word_count = ROW_COUNT;
	IF v_word_count = 0 THEN
		RAISE EXCEPTION 'No eligible words found for this game';
	END IF;

	UPDATE public.games
	SET current_team_id = v_team_id,
		current_explainer_player_id = v_player_id
	WHERE id = p_game_id;

	RETURN v_round_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_prepared_game_round(p_game_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
	v_round_id uuid;
BEGIN
	SELECT gr.id
	INTO v_round_id
	FROM public.game_rounds AS gr
	JOIN public.games AS g ON g.id = gr.game_id
	WHERE gr.game_id = p_game_id
		AND gr.round_number = g.current_round_number
		AND gr.status = 'preparation'
		AND gr.started_at IS NULL
		AND g.owner_id = auth.uid()
		AND g.status = 'active'
	FOR UPDATE OF gr;

	IF v_round_id IS NULL THEN
		RAISE EXCEPTION 'Prepared round not found or access denied';
	END IF;

	UPDATE public.game_rounds
	SET status = 'active', started_at = now()
	WHERE id = v_round_id;

	RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_game_round_paused(
	p_game_id uuid,
	p_paused boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
	v_round public.game_rounds%ROWTYPE;
BEGIN
	SELECT gr.*
	INTO v_round
	FROM public.game_rounds AS gr
	JOIN public.games AS g ON g.id = gr.game_id
	WHERE gr.game_id = p_game_id
		AND gr.round_number = g.current_round_number
		AND gr.status = 'active'
		AND gr.ended_at IS NULL
		AND g.owner_id = auth.uid()
		AND g.status = 'active'
	FOR UPDATE OF gr;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'Active round not found or access denied';
	END IF;

	IF p_paused AND v_round.paused_at IS NULL THEN
		UPDATE public.game_rounds
		SET paused_at = now()
		WHERE id = v_round.id;
	ELSIF NOT p_paused AND v_round.paused_at IS NOT NULL THEN
		UPDATE public.game_rounds
		SET paused_seconds = paused_seconds +
			GREATEST(0, floor(extract(epoch FROM now() - paused_at))::integer),
			paused_at = NULL
		WHERE id = v_round.id;
	END IF;

	RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.start_game_round(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.start_prepared_game_round(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_game_round_paused(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_game_round(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_prepared_game_round(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_game_round_paused(uuid, boolean) TO authenticated;
