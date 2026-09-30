import type { Database } from './database.generated'
import type { WordDifficulty } from './word'

export type GameStatus = Database['public']['Enums']['game_status']

export interface GamePlayer {
	id: string
	nickname: string
	playerOrder: number
}

export interface GameTeam {
	id: string
	name: string
	teamOrder: number
	score: number
	players: GamePlayer[]
}

export interface Game {
	id: string
	ownerId: string
	status: GameStatus
	targetScore: number
	roundDurationSeconds: number
	subtractPointForSkip: boolean
	selectedDifficulties: WordDifficulty[]
	selectedLists: { id: string; name: string }[]
	currentRoundNumber: number
	currentTeamId: string | null
	currentExplainerPlayerId: string | null
	createdAt: string
	finishedAt: string | null
	teams: GameTeam[]
}

export interface GameTeamDraft {
	id: string
	name: string
	players: string[]
}

export interface CreateGameInput {
	targetScore: number
	roundDurationSeconds: number
	subtractPointForSkip: boolean
	selectedDifficulties: WordDifficulty[]
	selectedLists: string[]
	teams: GameTeamDraft[]
}
