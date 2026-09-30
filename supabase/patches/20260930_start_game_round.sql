-- Start the first round atomically and snapshot eligible words for the game.
-- Apply this patch to the linked Supabase project before using the UI action.
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
		RAISE EXCEPTION 'A round has already been started for this game';
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
		'active',
		now()
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
	SELECT
		v_round_id,
		id,
		text,
		difficulty,
		displayed_order
	FROM shuffled_words;

	GET DIAGNOSTICS v_word_count = ROW_COUNT;

	IF v_word_count = 0 THEN
		RAISE EXCEPTION 'No eligible words found for this game';
	END IF;

	UPDATE public.games
	SET
		current_team_id = v_team_id,
		current_explainer_player_id = v_player_id
	WHERE id = p_game_id;

	RETURN v_round_id;
END;
$$;

REVOKE ALL ON FUNCTION public.start_game_round(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_game_round(uuid) TO authenticated;
