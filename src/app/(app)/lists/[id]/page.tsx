import { notFound } from 'next/navigation'
import { getList } from '@/lib/lists/get-list'
import { getListWords } from '@/lib/lists/get-list-words'
import { getAvailableLists } from '@/lib/lists/get-available-lists'
import { AddWordDialog } from '@/components/lists/add-word-dialog'
import { pluralizeWordsCount } from '@/lib/utils'
import { ListWords } from '@/components/lists/list-words'
import { getListPermissions } from '@/lib/lists/get-list-permissions'
import { getCurrentProfile } from '@/lib/auth/get-profile'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Список слов' }

const permissionLabels = {
	can_view: 'Просмотр',
	can_add_words: 'Добавление слов',
	can_edit_words: 'Редактирование слов',
	can_delete_words: 'Удаление слов',
} as const

interface ListPageProps {
	params: Promise<{
		id: string
	}>
}

export default async function ListPage({ params }: ListPageProps) {
	const { id } = await params
	const profile = await getCurrentProfile()

	if (!id) {
		notFound()
	}
	const [list, listWords, availableLists, permissions] = await Promise.all([
		getList(id),
		getListWords(id),
		getAvailableLists(),
		getListPermissions(id),
	])

	if (!list) {
		notFound()
	}

	return (
		<main className='min-h-screen py-4'>
			<div className='mb-6'>
				<h1 className='text-2xl font-semibold'>{list.name}</h1>

				{list.description && (
					<p className='mt-2 text-sm text-muted-foreground'>
						{list.description}
					</p>
				)}
			</div>

			{!!permissions && list.owner_id !== profile?.id && (
				<div className='mt-4 rounded-lg border bg-muted/30 p-3'>
					<p className='mb-2 text-sm font-medium'>Разрешения</p>

					<div className='flex flex-wrap gap-2'>
						{(
							Object.entries(permissionLabels) as [
								keyof typeof permissionLabels,
								string,
							][]
						)
							.filter(([key]) => permissions[key])
							.map(([key, label]) => (
								<span
									key={key}
									className='rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground'
								>
									{label}
								</span>
							))}
					</div>
				</div>
			)}

			<div className='mb-4 text-sm text-muted-foreground'>
				{pluralizeWordsCount(listWords.length ?? 0)}
			</div>

			{listWords.length === 0 ? (
				<div className='py-12 text-center text-sm text-muted-foreground'>
					В этом списке пока нет слов
				</div>
			) : (
				<div className='flex flex-col gap-2'>
					<ListWords
						listWords={listWords}
						listId={list.id}
						permissions={permissions}
					/>
				</div>
			)}

			{permissions?.can_add_words && (
				<div className='mt-6'>
					<AddWordDialog
						listId={list.id}
						availableLists={availableLists}
					/>
				</div>
			)}
		</main>
	)
}
