-- Atomic word scoring, shared last word, result edits and next-round transition.

CREATE OR REPLACE FUNCTION public.recalculate_game_round_scores(p_game_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
	UPDATE public.game_rounds AS gr
	SET guessed_count = (
			SELECT count(*)::integer
			FROM public.round_words AS rw
			WHERE rw.round_id = gr.id AND rw.result = 'guessed'
		),
		skipped_count = (
			SELECT count(*)::integer
			FROM public.round_words AS rw
			WHERE rw.round_id = gr.id AND rw.result = 'skipped'
		),
		points_earned = (
			SELECT count(*) FILTER (WHERE rw.result = 'guessed')::integer
				- CASE WHEN g.subtract_point_for_skip
					THEN count(*) FILTER (WHERE rw.result = 'skipped')::integer
					ELSE 0
				END
				+ count(*) FILTER (
					WHERE rw.result = 'last_word'
						AND rw.guessed_by_team_id = gr.team_id
				)::integer
			FROM public.round_words AS rw
			WHERE rw.round_id = gr.id
		)
	FROM public.games AS g
	WHERE gr.game_id = p_game_id AND g.id = gr.game_id;

	UPDATE public.game_teams AS t
	SET score =
		COALESCE((
			SELECT sum(gr.points_earned)::integer
			FROM public.game_rounds AS gr
			WHERE gr.team_id = t.id
		), 0)
		+ COALESCE((
			SELECT count(*)::integer
			FROM public.round_words AS rw
			JOIN public.game_rounds AS gr ON gr.id = rw.round_id
			WHERE gr.game_id = p_game_id
				AND rw.guessed_by_team_id = t.id
				AND gr.team_id <> t.id
				AND rw.result = 'last_word'
		), 0)
	WHERE t.game_id = p_game_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_current_game_round_word(
	p_game_id uuid,
	p_result public.word_result
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
	v_round public.game_rounds%ROWTYPE;
	v_duration integer;
	v_word_id uuid;
BEGIN
	IF p_result NOT IN ('guessed', 'skipped') THEN
		RAISE EXCEPTION 'Word result must be guessed or skipped';
	END IF;

	SELECT gr.*
	INTO v_round
	FROM public.game_rounds AS gr
	JOIN public.games AS g ON g.id = gr.game_id
	WHERE gr.game_id = p_game_id
		AND gr.round_number = g.current_round_number
		AND gr.status = 'active'
		AND gr.ended_at IS NULL
		AND gr.paused_at IS NULL
		AND g.owner_id = auth.uid()
		AND g.status = 'active'
	FOR UPDATE OF gr;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'Running round not found or access denied';
	END IF;

	SELECT round_duration_seconds
	INTO v_duration
	FROM public.games
	WHERE id = v_round.game_id;

	IF now() >= v_round.started_at
		+ make_interval(secs => v_duration + v_round.paused_seconds) THEN
		RAISE EXCEPTION 'Round timer has expired';
	END IF;

	SELECT id INTO v_word_id
	FROM public.round_words
	WHERE round_id = v_round.id
		AND result IS NULL
		AND NOT is_last_word_for_all
	ORDER BY displayed_order
	LIMIT 1
	FOR UPDATE;

	IF v_word_id IS NULL THEN
		RAISE EXCEPTION 'No unresolved word remains';
	END IF;

	UPDATE public.round_words SET result = p_result WHERE id = v_word_id;
	PERFORM public.recalculate_game_round_scores(p_game_id);
	RETURN v_word_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_current_game_round(p_game_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
	v_round public.game_rounds%ROWTYPE;
	v_duration integer;
	v_word_id uuid;
BEGIN
	SELECT gr.*
	INTO v_round
	FROM public.game_rounds AS gr
	JOIN public.games AS g ON g.id = gr.game_id
	WHERE gr.game_id = p_game_id
		AND gr.round_number = g.current_round_number
		AND gr.status = 'active'
		AND gr.ended_at IS NULL
		AND gr.paused_at IS NULL
		AND g.owner_id = auth.uid()
		AND g.status = 'active'
	FOR UPDATE OF gr;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'Running round not found or access denied';
	END IF;

	SELECT round_duration_seconds
	INTO v_duration
	FROM public.games
	WHERE id = v_round.game_id;

	IF now() < v_round.started_at
		+ make_interval(secs => v_duration + v_round.paused_seconds) THEN
		RAISE EXCEPTION 'Round timer has not expired';
	END IF;

	SELECT id INTO v_word_id
	FROM public.round_words
	WHERE round_id = v_round.id AND result IS NULL
	ORDER BY displayed_order
	LIMIT 1
	FOR UPDATE;

	IF v_word_id IS NULL THEN
		SELECT id INTO v_word_id
		FROM public.round_words
		WHERE round_id = v_round.id
		ORDER BY displayed_order DESC
		LIMIT 1
		FOR UPDATE;
	END IF;

	IF v_word_id IS NULL THEN
		RAISE EXCEPTION 'No word is available for the shared final word';
	END IF;

	UPDATE public.round_words
	SET result = NULL,
		guessed_by_team_id = NULL,
		is_last_word_for_all = true
	WHERE id = v_word_id;

	UPDATE public.game_rounds
	SET last_word_id = v_word_id, ended_at = now()
	WHERE id = v_round.id;

	PERFORM public.recalculate_game_round_scores(p_game_id);
	RETURN v_word_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_shared_game_round_word(
	p_game_id uuid,
	p_team_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
	v_round public.game_rounds%ROWTYPE;
BEGIN
	SELECT gr.* INTO v_round
	FROM public.game_rounds AS gr
	JOIN public.games AS g ON g.id = gr.game_id
	WHERE gr.game_id = p_game_id
		AND gr.round_number = g.current_round_number
		AND gr.last_word_id IS NOT NULL
		AND gr.ended_at IS NOT NULL
		AND gr.status IN ('active', 'result', 'finished')
		AND g.owner_id = auth.uid()
		AND g.status IN ('active', 'finished')
	FOR UPDATE OF gr;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'Shared final word not found or access denied';
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM public.game_teams
		WHERE id = p_team_id AND game_id = p_game_id
	) THEN
		RAISE EXCEPTION 'Selected team does not belong to this game';
	END IF;

	UPDATE public.round_words
	SET result = 'last_word', guessed_by_team_id = p_team_id
	WHERE id = v_round.last_word_id;

	IF v_round.status = 'active' THEN
		UPDATE public.game_rounds SET status = 'result' WHERE id = v_round.id;
	END IF;

	PERFORM public.recalculate_game_round_scores(p_game_id);
	RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.edit_game_round_word_result(
	p_game_id uuid,
	p_word_id uuid,
	p_result public.word_result
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
	v_round_id uuid;
BEGIN
	IF p_result NOT IN ('guessed', 'skipped') THEN
		RAISE EXCEPTION 'Word result must be guessed or skipped';
	END IF;

	SELECT gr.id INTO v_round_id
	FROM public.game_rounds AS gr
	JOIN public.games AS g ON g.id = gr.game_id
	JOIN public.round_words AS rw ON rw.round_id = gr.id
	WHERE gr.game_id = p_game_id
		AND gr.round_number = g.current_round_number
		AND rw.id = p_word_id
		AND rw.id <> COALESCE(gr.last_word_id, '00000000-0000-0000-0000-000000000000'::uuid)
		AND gr.status IN ('result', 'finished')
		AND g.owner_id = auth.uid()
	FOR UPDATE OF gr, rw;

	IF v_round_id IS NULL THEN
		RAISE EXCEPTION 'Editable round word not found or access denied';
	END IF;

	UPDATE public.round_words SET result = p_result WHERE id = p_word_id;
	PERFORM public.recalculate_game_round_scores(p_game_id);
	RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.next_game_round(p_game_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
	v_round public.game_rounds%ROWTYPE;
	v_target_score integer;
	v_max_score integer;
	v_team_count integer;
	v_team_id uuid;
	v_player_id uuid;
	v_player_count integer;
	v_team_round_count integer;
	v_next_round_id uuid;
BEGIN
	SELECT gr.*
	INTO v_round
	FROM public.game_rounds AS gr
	JOIN public.games AS g ON g.id = gr.game_id
	WHERE gr.game_id = p_game_id
		AND gr.round_number = g.current_round_number
		AND gr.status = 'result'
		AND g.owner_id = auth.uid()
		AND g.status = 'active'
	FOR UPDATE OF gr;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'Round results not found or access denied';
	END IF;

	SELECT target_score
	INTO v_target_score
	FROM public.games
	WHERE id = v_round.game_id;

	PERFORM public.recalculate_game_round_scores(p_game_id);
	SELECT COALESCE(max(score), 0) INTO v_max_score
	FROM public.game_teams WHERE game_id = p_game_id;

	UPDATE public.game_rounds SET status = 'finished' WHERE id = v_round.id;

	IF v_max_score >= v_target_score THEN
		UPDATE public.games
		SET status = 'finished',
			finished_at = now(),
			current_team_id = NULL,
			current_explainer_player_id = NULL
		WHERE id = p_game_id;
		RETURN false;
	END IF;

	SELECT count(*)::integer INTO v_team_count
	FROM public.game_teams WHERE game_id = p_game_id;

	SELECT id INTO v_team_id
	FROM public.game_teams
	WHERE game_id = p_game_id
		AND team_order = ((v_round.round_number) % v_team_count)
	LIMIT 1;

	SELECT count(*)::integer INTO v_player_count
	FROM public.game_players WHERE team_id = v_team_id;

	SELECT count(*)::integer INTO v_team_round_count
	FROM public.game_rounds
	WHERE game_id = p_game_id AND team_id = v_team_id;

	SELECT id INTO v_player_id
	FROM public.game_players
	WHERE team_id = v_team_id
		AND player_order = (v_team_round_count % v_player_count)
	LIMIT 1;

	UPDATE public.games
	SET current_round_number = current_round_number + 1,
		current_team_id = NULL,
		current_explainer_player_id = NULL
	WHERE id = p_game_id;

	SELECT public.start_game_round(p_game_id) INTO v_next_round_id;

	UPDATE public.game_rounds
	SET team_id = v_team_id,
		explainer_player_id = v_player_id
	WHERE id = v_next_round_id;

	UPDATE public.games
	SET current_team_id = v_team_id,
		current_explainer_player_id = v_player_id
	WHERE id = p_game_id;

	RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.recalculate_game_round_scores(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.resolve_current_game_round_word(uuid, public.word_result) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.expire_current_game_round(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.assign_shared_game_round_word(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.edit_game_round_word_result(uuid, uuid, public.word_result) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.next_game_round(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_current_game_round_word(uuid, public.word_result) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_current_game_round(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_shared_game_round_word(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.edit_game_round_word_result(uuid, uuid, public.word_result) TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_game_round(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_game_round_scores(uuid) TO authenticated;
