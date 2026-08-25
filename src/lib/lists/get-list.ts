import { createClient } from '../server'

export async function getList(listId: string) {
	const supabase = await createClient()

	if (!listId) {
		return null
	}

	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser()

	if (userError) {
		console.error('Error getting user:', userError)
		return null
	}

	if (!user) {
		return null
	}

	const { data: list, error } = await supabase
		.from('lists')
		.select(
			`
      id,
      name,
      owner_id,
      description,
      is_system,
      created_at,
      updated_at
    `,
		)
		.eq('id', listId)
		.maybeSingle()

	if (error) {
		console.error('Error fetching list:', error)
		return null
	}

	return list
}
