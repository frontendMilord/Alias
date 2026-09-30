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

export interface ActiveGameRound {
	id: string
	roundNumber: number
	teamId: string
	explainerPlayerId: string
	status: Database['public']['Enums']['round_status']
	startedAt: string | null
	endedAt: string | null
	pausedAt: string | null
	pausedSeconds: number
	pointsEarned: number
	lastWordId: string | null
	currentWord: string | null
	currentWordId: string | null
	words: GameRoundWord[]
}

export interface GameRoundWord {
	id: string
	wordText: string
	displayedOrder: number
	result: Database['public']['Enums']['word_result'] | null
	guessedByTeamId: string | null
	isLastWordForAll: boolean
}

export interface FinishedGameRoundSummary {
	roundNumber: number
	teamId: string
	pointsEarned: number
	guessedCount: number
	skippedCount: number
}

export interface FinishedGameSummary {
	durationSeconds: number
	rounds: FinishedGameRoundSummary[]
	guessedCount: number
	skippedCount: number
	teamStats: Record<string, { guessedCount: number; skippedCount: number; bestRoundScore: number }>
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
	selectedWordsCount: number
	currentRoundNumber: number
	currentTeamId: string | null
	currentExplainerPlayerId: string | null
	createdAt: string
	finishedAt: string | null
	teams: GameTeam[]
	activeRound: ActiveGameRound | null
	finishedSummary: FinishedGameSummary | null
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
