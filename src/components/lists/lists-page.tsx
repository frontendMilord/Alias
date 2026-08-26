'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ListCard } from './list-card'
import { CreateListDialog } from './create-list-dialog'
import type { List } from '@/types/list'
import { ListType, listTypeLabels } from '@/lib/consts'
import { getListType } from '@/lib/utils'

interface ListsPageProps {
	initialLists: List[]
	userId: string
}

export function ListsPage({ initialLists, userId }: ListsPageProps) {
	const [selectedTypes, setSelectedTypes] = useState<ListType[]>([])
	const [search, setSearch] = useState('')
	const safeLists = Array.isArray(initialLists) ? initialLists : []
	const normalizedSearch = search.trim().toLowerCase()

	const toggleListType = (value: ListType) => {
		setSelectedTypes((current) => {
			if (current.includes(value)) {
				return current.filter((item) => item !== value)
			}

			return [...current, value]
		})
	}

	const filteredLists = safeLists.filter((list) => {
		const name = list?.name ?? ''
		const matchesSearch = name.toLowerCase().includes(normalizedSearch)
		const type = getListType(list, userId)
		const matchesType =
			selectedTypes.length === 0 || selectedTypes.includes(type)

		return matchesSearch && matchesType
	})

	return (
		<div className='flex min-h-screen flex-col'>
			<header className='flex items-center justify-between py-4'>
				<h1 className='text-2xl font-semibold'>Списки</h1>

				<CreateListDialog />
			</header>

			{/* Фильтр типов */}
			<div className='flex flex-wrap gap-2 pb-4'>
				{(Object.keys(listTypeLabels) as ListType[]).map((value) => {
					const checked = selectedTypes.includes(value)

					return (
						<Button
							key={value}
							type='button'
							variant={checked ? 'default' : 'ghost'}
							onClick={() => toggleListType(value)}
						>
							{listTypeLabels[value]}
						</Button>
					)
				})}
			</div>

			{/* Поиск */}
			<div className='relative mb-4'>
				<Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />

				<Input
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					placeholder='Поиск списков...'
					className='pl-9'
				/>
			</div>

			{/* Списки */}
			<div className='flex flex-col gap-3'>
				{filteredLists.length > 0 &&
					filteredLists.map((list) => {
						if (!list?.id) {
							return null
						}
						const type = getListType(list, userId)
						return (
							<ListCard
								key={list.id}
								id={list.id}
								title={list.name ?? 'Без названия'}
								author={list.owner_nickname ?? ''}
								words={list.words}
								description={list.description ?? null}
								isSystem={list.is_system ?? false}
								type={type}
								previewWords={
									Array.isArray(list.preview_words) ? list.preview_words : []
								}
							/>
						)
					})}

				{filteredLists.length === 0 && (
					<div className='py-12 text-center text-sm text-muted-foreground'>
						{safeLists.length === 0
							? 'У вас пока нет списков'
							: 'Ничего не найдено'}
					</div>
				)}
			</div>
		</div>
	)
}
