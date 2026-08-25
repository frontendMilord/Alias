import { createClient } from '../server'

type SupabaseWord = {
	id: string
	text: string
	difficulty: 'easy' | 'medium' | 'hard' | 'insane'
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
	words: SupabaseWord | null
}

export async function getListWords(listId: string): Promise<ListWord[]> {
	const supabase = await createClient()

	const { data, error } = await supabase
		.from('list_words')
		.select(
			`
			id,
			list_id,
			word_id,
			added_by,
			created_at,
			words (
				id,
				text,
				difficulty,
				owner_id,
				created_at,
				updated_at
			)
		`,
		)
		.eq('list_id', listId)
		.order('created_at', {
			ascending: false,
		})

	if (error) {
		console.error('Error fetching list words:', error)

		return []
	}

	const result: ListWord[] = (data ?? []).map((item) => ({
		id: item.id,
		list_id: item.list_id,
		word_id: item.word_id,
		added_by: item.added_by,
		created_at: item.created_at,
		words: Array.isArray(item.words) ? (item.words[0] ?? null) : item.words,
	}))

	return result
}
