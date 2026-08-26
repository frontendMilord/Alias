import { redirect } from 'next/navigation'
import { getCurrentProfile } from './get-profile'
import { Profile } from '@/types/profile'

export async function requireUser(): Promise<Profile> {
	const profile = await getCurrentProfile()

	if (!profile) {
		redirect('/login')
	}

	return profile
}
