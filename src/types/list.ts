import { ListWord, WordDifficulty } from './word'

export interface List {
	id: string
	name: string
	description: string | null
	owner_id: string
	owner_nickname: string | null
	is_system: boolean
	created_at: string
	updated_at: string
	words: ListWord[]
	preview_words?: ListPreviewWord[]
}

export type ListPreviewWord = {
	id: string
	text: string
	difficulty: WordDifficulty
}
