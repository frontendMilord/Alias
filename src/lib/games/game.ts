import { createClient } from '@/lib/server'
import type { Game } from '@/types/game'

export async function getGame(id: string): Promise<Game | null> {
	const supabase = await createClient()

	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser()

	if (userError || !user) {
		return null
	}

	const { data, error } = await supabase
		.from('games')
		.select(
			`
			id,
			owner_id,
			status,
			target_score,
			round_duration_seconds,
			subtract_point_for_skip,
			selected_difficulties,
			selected_lists,
			current_round_number,
			current_team_id,
			current_explainer_player_id,
			created_at,
			finished_at,
			game_teams!game_teams_game_id_fkey (
				id,
				name,
				team_order,
				score,
				game_players!game_players_team_id_fkey (
					id,
					nickname,
					player_order
				)
			)
		`,
		)
		.eq('id', id)
		.eq('owner_id', user.id)
		.maybeSingle()

	if (error) {
		console.error('Error fetching game:', {
			code: error.code,
			message: error.message,
			details: error.details,
			hint: error.hint,
		})
		return null
	}

	if (!data) {
		return null
	}

	const selectedListIds = Array.isArray(data.selected_lists)
		? (data.selected_lists as string[])
		: []

	let selectedLists: Game['selectedLists'] = []

	if (selectedListIds.length > 0) {
		const { data: listsData, error: listsError } = await supabase
			.from('lists')
			.select('id, name')
			.in('id', selectedListIds)

		if (listsError) {
			console.error('Error fetching game lists:', listsError)
		} else if (listsData) {
			selectedLists = listsData
		}
	}

	const teams = [...(data.game_teams ?? [])]
		.sort((a, b) => a.team_order - b.team_order)
		.map((team) => ({
			id: team.id,
			name: team.name,
			teamOrder: team.team_order,
			score: team.score,
			players: [...(team.game_players ?? [])]
				.sort((a, b) => a.player_order - b.player_order)
				.map((player) => ({
					id: player.id,
					nickname: player.nickname,
					playerOrder: player.player_order,
				})),
		}))

	return {
		id: data.id,
		ownerId: data.owner_id,
		status: data.status,
		targetScore: data.target_score,
		roundDurationSeconds: data.round_duration_seconds,
		subtractPointForSkip: data.subtract_point_for_skip,
		selectedDifficulties: data.selected_difficulties ?? [],
		selectedLists,
		currentRoundNumber: data.current_round_number,
		currentTeamId: data.current_team_id,
		currentExplainerPlayerId: data.current_explainer_player_id,
		createdAt: data.created_at,
		finishedAt: data.finished_at,
		teams,
	}
}
