import { createClient } from '../server'

export async function getCurrentProfile() {
	const supabase = await createClient()

	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser()

	if (userError || !user) {
		return null
	}

	const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.single()

	if (profileError || !profile) {
		return null
	}

	return profile
}
