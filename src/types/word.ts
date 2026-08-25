export type WordDifficulty = 'easy' | 'medium' | 'hard' | 'insane'

export interface Word {
	id: string
	text: string
	difficulty: WordDifficulty
	owner_id: string
	created_at: string
	updated_at: string
}

export interface ListWord {
	id: string
	list_id: string
	word_id: string
	added_by: string
	created_at: string
	words: Word | null
}
