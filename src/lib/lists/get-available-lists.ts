import { createClient } from '../server'

export async function getAvailableLists() {
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
      is_system
    `,
		)
		.or(`owner_id.eq.${user.id},is_system.eq.true`)
		.order('name', {
			ascending: true,
		})

	if (error) {
		console.error('Error fetching available lists:', error)

		return []
	}

	return data ?? []
}
