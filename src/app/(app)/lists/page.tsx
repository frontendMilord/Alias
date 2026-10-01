import { requireUser } from '@/lib/auth/require-user'
import { ListsPage } from '@/components/lists/lists-page'
import { getLists } from '@/lib/lists/get-lists'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Списки слов' }

export default async function ListsRoute() {
	const profile = await requireUser()

	const lists = await getLists()

	return (
		<ListsPage
			initialLists={lists}
			userId={profile.id}
		/>
	)
}
