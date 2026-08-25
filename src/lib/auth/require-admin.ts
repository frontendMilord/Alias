import { redirect } from 'next/navigation'
import { requireUser } from './require-user'

export async function requireAdmin() {
	const profile = await requireUser()

	if (profile.role !== 'admin') {
		redirect('/')
	}

	return profile
}
