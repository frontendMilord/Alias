import { LogoutButton } from '@/components/auth/logout-button'
import { requireUser } from '@/lib/auth/require-user'

export default async function ProfilePage() {
	const profile = await requireUser()

	return (
		<main className='p-6'>
			<h1 className='text-2xl font-bold'>Профиль</h1>

			<div className='mt-4 space-y-2'>
				<p>Никнейм: {profile.nickname}</p>
				<p>Роль: {profile.role}</p>
			</div>

			<LogoutButton />
		</main>
	)
}
