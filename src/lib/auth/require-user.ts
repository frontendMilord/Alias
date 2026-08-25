import { redirect } from 'next/navigation'
import { getCurrentProfile } from './get-profile'

export async function requireUser() {
	const profile = await getCurrentProfile()

	if (!profile) {
		redirect('/login')
	}

	return profile
}
