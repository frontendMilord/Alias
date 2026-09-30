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
	v_is_round_complete boolean;
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

	SELECT count(*)::integer INTO v_team_count
	FROM public.game_teams WHERE game_id = p_game_id;

	v_is_round_complete := v_team_count > 0
		AND v_round.round_number % v_team_count = 0;

	UPDATE public.game_rounds SET status = 'finished' WHERE id = v_round.id;

	IF v_is_round_complete AND v_max_score >= v_target_score THEN
		UPDATE public.games
		SET status = 'finished',
			finished_at = now(),
			current_team_id = NULL,
			current_explainer_player_id = NULL
		WHERE id = p_game_id;
		RETURN false;
	END IF;

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


REVOKE ALL ON FUNCTION public.next_game_round(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_game_round(uuid) TO authenticated;
