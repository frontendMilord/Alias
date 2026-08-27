import { WordDifficulty } from './word'

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
