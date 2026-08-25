'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'

import type { ListWord } from '@/lib/lists/get-list-words'
import { WordItem } from './word-item'
import { ListPermissions } from '@/lib/lists/get-list-permissions'

interface ListWordsProps {
	listId: string
	listWords: ListWord[]
	permissions: ListPermissions | null
}

const difficultyLabels = {
	easy: 'Легкий',
	medium: 'Средний',
	hard: 'Сложный',
	insane: 'Нереальный',
} as const

type Difficulty = keyof typeof difficultyLabels

export function ListWords({ listId, listWords, permissions }: ListWordsProps) {
	const [search, setSearch] = useState('')

	const [selectedDifficulties, setSelectedDifficulties] = useState<
		Difficulty[]
	>([])

	const safeListWords = Array.isArray(listWords) ? listWords : []

	const toggleDifficulty = (value: Difficulty) => {
		setSelectedDifficulties((current) => {
			if (current.includes(value)) {
				return current.filter((item) => item !== value)
			}

			return [...current, value]
		})
	}

	const filteredWords = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase()

		return safeListWords.filter((item) => {
			const word = Array.isArray(item?.words) ? item.words[0] : item?.words

			if (!word) {
				return false
			}

			const wordText = typeof word.text === 'string' ? word.text : ''

			const matchesSearch =
				normalizedSearch.length === 0 ||
				wordText.toLowerCase().includes(normalizedSearch)

			const matchesDifficulty =
				selectedDifficulties.length === 0 ||
				selectedDifficulties.includes(word.difficulty)

			return matchesSearch && matchesDifficulty
		})
	}, [safeListWords, search, selectedDifficulties])

	return (
		<div className='space-y-4'>
			{/* Поиск */}
			<div className='relative'>
				<Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />

				<Input
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					placeholder='Поиск слов...'
					className='pl-9'
				/>
			</div>

			{/* Фильтр сложности */}
			<div className='space-y-2'>
				<p className='text-sm font-medium'>Сложности</p>

				<div className='flex flex-wrap gap-2'>
					{(Object.keys(difficultyLabels) as Difficulty[]).map((value) => {
						const checked = selectedDifficulties.includes(value)

						return (
							<button
								key={value}
								type='button'
								onClick={() => toggleDifficulty(value)}
								className={`rounded-full border px-3 py-1.5 text-sm transition ${
									checked
										? 'border-primary bg-primary text-primary-foreground'
										: 'border-border bg-muted text-muted-foreground'
								}`}
							>
								{difficultyLabels[value]}
							</button>
						)
					})}
				</div>
			</div>

			{/* Счётчик */}
			<p className='text-xs text-muted-foreground'>
				Показано {filteredWords.length} из {safeListWords.length}
			</p>

			{/* Список */}
			<div className='flex flex-col gap-2'>
				{filteredWords.length > 0 &&
					filteredWords.map((item) => {
						const word = Array.isArray(item?.words)
							? item.words[0]
							: item?.words

						if (!item?.id || !word?.id) {
							return null
						}

						return (
							<WordItem
								key={item.id}
								id={word.id}
								text={word.text ?? ''}
								difficulty={word.difficulty ?? 'easy'}
								listWordId={item.id}
								listId={listId}
								permissions={permissions}
							/>
						)
					})}
			</div>

			{safeListWords.length > 0 && filteredWords.length === 0 && (
				<div className='py-8 text-center text-sm text-muted-foreground'>
					Ничего не найдено
				</div>
			)}
		</div>
	)
}
