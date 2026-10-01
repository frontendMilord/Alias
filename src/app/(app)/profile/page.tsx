import { LogoutButton } from '@/components/auth/logout-button'
import { requireUser } from '@/lib/auth/require-user'
import { getGameHistory } from '@/lib/games/get-game-history'
import { GameHistory } from '@/components/profile/game-history'

export default async function ProfilePage() {
	const profile = await requireUser()
	const history = await getGameHistory(profile.id)

	return (
		<main className='p-6'>
			<h1 className='text-2xl font-bold'>Профиль</h1>

			<div className='mt-4 space-y-2'>
				<p>Никнейм: {profile.nickname}</p>
				<p>Роль: {profile.role}</p>
			</div>

			<LogoutButton />

			<GameHistory history={history} />
		</main>
	)
}
