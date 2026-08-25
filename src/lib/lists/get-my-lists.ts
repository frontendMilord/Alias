import { createClient } from '../server'

export async function getMyLists() {
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
			list_words(count)
		`,
		)
		.eq('owner_id', user.id)
		.eq('is_system', false)
		.order('created_at', {
			ascending: false,
		})

	if (error) {
		console.error('Error fetching my lists:', error)

		return []
	}

	const lists = Array.isArray(data) ? data : []

	if (!lists.length) {
		return []
	}

	const listIds = lists
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

	return (data ?? []).map((list) => ({
		id: list.id,
		name: list.name,
		owner_id: list.owner_id,
		description: list.description,
		is_system: list.is_system,
		created_at: list.created_at,
		updated_at: list.updated_at,
		words_count: list.list_words?.[0]?.count ?? 0,
		preview_words: safePreviewWords
			.filter((word) => word?.list_id === list.id)
			.map((word) => ({
				id: word.word_id,
				text: word.text,
				difficulty: word.difficulty,
			})),
	}))
}
