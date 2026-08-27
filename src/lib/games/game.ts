import { createClient } from '@/lib/server'

export async function getGame(id: string) {
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
			finished_at
		`,
		)
		.eq('id', id)
		.eq('owner_id', user.id)
		.maybeSingle()

	if (error) {
		console.error('Error fetching game:', error)
		return null
	}

	return data
}
