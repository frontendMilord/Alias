import { createClient } from '@/lib/server'

export interface GameHistoryItem {
	id: string
	status: 'finished' | 'cancelled'
	createdAt: string
	finishedAt: string | null
	targetScore: number
	teams: { id: string; name: string; score: number }[]
}

export async function getGameHistory(ownerId: string): Promise<GameHistoryItem[]> {
	const supabase = await createClient()
	const { data, error } = await supabase
		.from('games')
		.select(`
			id,
			status,
			target_score,
			created_at,
			finished_at,
			game_teams!game_teams_game_id_fkey (id, name, score, team_order)
		`)
		.eq('owner_id', ownerId)
		.in('status', ['finished', 'cancelled'])
		.order('created_at', { ascending: false })

	if (error) {
		console.error('Error fetching game history:', error)
		return []
	}

	return (data ?? []).map((game) => ({
		id: game.id,
		status: game.status,
		createdAt: game.created_at,
		finishedAt: game.finished_at,
		targetScore: game.target_score,
		teams: [...(game.game_teams ?? [])]
			.sort((a, b) => a.team_order - b.team_order)
			.map((team) => ({ id: team.id, name: team.name, score: team.score })),
	}))
}
