import { requireUser } from '@/lib/auth/require-user'
import { NewGamePage } from '@/components/games/new-game-page'
import { getLists } from '@/lib/lists/get-lists'
import { getActiveGame } from '@/lib/games/get-active-game'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Новая игра' }

export default async function NewGameRoute() {
	const profile = await requireUser()
	const activeGame = await getActiveGame()

	if (activeGame) {
		redirect('/')
	}

	const lists = await getLists()

	return (
		<NewGamePage
			lists={lists}
			profile={profile}
		/>
	)
}
