import { requireUser } from '@/lib/auth/require-user'
import { NewGamePage } from '@/components/games/new-game-page'
import { getLists } from '@/lib/lists/get-lists'

export default async function NewGameRoute() {
	const profile = await requireUser()
	const lists = await getLists()

	return (
		<NewGamePage
			lists={lists}
			profile={profile}
		/>
	)
}
