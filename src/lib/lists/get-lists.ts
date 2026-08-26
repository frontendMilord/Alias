import { createClient } from '../server'

export async function getLists() {
	const supabase = await createClient()

	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser()

	if (userError || !user) {
		return []
	}

	const { data, error } = await supabase
		.from('lists')
		.select(
			`
			id,
			name,
			owner_id,
			description,
			is_system,
			created_at,
			updated_at,
      profiles!lists_owner_id_fkey (
	      nickname
      ),
      list_words (
        id,
	      word_id,
	      words (
		      id,
		      text,
		      difficulty
	      )
      )
		`,
		)
		.order('created_at', {
			ascending: false,
		})

	if (error) {
		console.error('Error fetching lists:', error)

		return []
	}

	const safeLists = Array.isArray(data) ? data : []

	if (!safeLists.length) {
		return []
	}

	const listIds = safeLists
		.map((list) => list?.id)
		.filter((id): id is string => typeof id === 'string' && id.length > 0)

	const { data: previewWords, error: previewError } = await supabase.rpc(
		'get_list_preview_words',
		{
			p_list_ids: listIds,
		},
	)

	if (previewError) {
		console.error('Error loading preview words:', previewError)
	}

	const safePreviewWords = Array.isArray(previewWords) ? previewWords : []

	return safeLists.map((list) => ({
		id: list.id,
		name: list.name,
		owner_id: list.owner_id,
		owner_nickname:
			(list.profiles as { nickname?: string | null })?.nickname ?? null,
		description: list.description,
		is_system: list.is_system,
		created_at: list.created_at,
		updated_at: list.updated_at,
		preview_words: safePreviewWords
			.filter((word) => word?.list_id === list.id)
			.map((word) => ({
				id: word.word_id,
				text: word.text,
				difficulty: word.difficulty,
			})),
		words: list.list_words.map((word) => ({
			id: word.id,
			word_id: word.word_id,
			word: word.words,
		})),
	}))
}
