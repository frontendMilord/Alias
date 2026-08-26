import { requireUser } from '@/lib/auth/require-user'
import { getActiveGame } from '@/lib/games/get-active-game'
import { HomePage } from '@/components/home/home-page'

export default async function Home() {
	const profile = await requireUser()
	const activeGame = await getActiveGame()

	return (
		<HomePage
			nickname={profile.nickname}
			activeGame={activeGame}
		/>
	)
}
