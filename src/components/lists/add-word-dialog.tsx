'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { addWords } from '@/app/(app)/lists/actions'
import type { WordDifficulty } from '@/types/word'
import { ListMultiSelect } from '@/lib/lists/list-multi-select'
import { difficultyLabels } from '@/lib/consts'

interface AvailableList {
	id: string
	name: string
	owner_id: string
	is_system: boolean
}

interface AddWordDialogProps {
	listId: string
	availableLists: AvailableList[]
}

export function AddWordDialog({ listId, availableLists }: AddWordDialogProps) {
	const [open, setOpen] = useState(false)
	const [text, setText] = useState('')
	const [difficulty, setDifficulty] = useState<WordDifficulty>('easy')
	const [selectedListIds, setSelectedListIds] = useState<string[]>([listId])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async () => {
		setError(null)

		if (!listId) {
			setError('Не удалось определить список.')
			return
		}

		const words = text
			.split(/[\n,]+/)
			.map((word) => word.trim())
			.filter(Boolean)

		const uniqueWords = [...new Set(words)]

		if (uniqueWords.length === 0) {
			setError('Введите хотя бы одно слово.')
			return
		}

		if (selectedListIds.length === 0) {
			setError('Выберите хотя бы один список.')
			return
		}

		setLoading(true)

		const result = await addWords({
			texts: uniqueWords,
			difficulty,
			listIds: selectedListIds,
		})

		setLoading(false)

		if (!result.success) {
			setError(result.error ?? 'Не удалось добавить слова.')

			return
		}

		setText('')
		setDifficulty('easy')
		setSelectedListIds([listId])

		setOpen(false)

		window.location.reload()
	}

	const handleOpenChange = (value: boolean) => {
		setOpen(value)

		if (value) {
			setError(null)
			setSelectedListIds([listId])
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={handleOpenChange}
		>
			<div className='pointer-events-none fixed inset-x-0 bottom-6 z-50'>
				<div className='mx-auto w-full max-w-[640px] px-8'>
					<div className='flex justify-end'>
						<DialogTrigger
							className='pointer-events-auto cursor-pointer flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95'
							aria-label='Добавить слова'
						>
							<Plus className='size-6' />
						</DialogTrigger>
					</div>
				</div>
			</div>

			<DialogContent className='w-[calc(100%-2rem)] rounded-2xl sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Добавить слова</DialogTitle>
				</DialogHeader>

				<div className='space-y-5'>
					{/* Слова */}
					<div className='space-y-2'>
						<label
							htmlFor='words'
							className='text-sm font-medium'
						>
							Слова или выражения
						</label>

						<Textarea
							id='words'
							value={text}
							onChange={(event) => setText(event.target.value)}
							placeholder={`Шрек
Гарри Поттер
Человек-паук, Железный человек`}
							rows={7}
							disabled={loading}
						/>

						<p className='text-xs text-muted-foreground'>
							Разделяйте слова Enter или запятой. Словосочетания можно писать
							через пробел.
						</p>
					</div>

					{/* Сложность */}
					<div className='space-y-2'>
						<label
							htmlFor='difficulty'
							className='text-sm font-medium'
						>
							Сложность
						</label>

						<select
							id='difficulty'
							value={difficulty}
							onChange={(event) =>
								setDifficulty(event.target.value as WordDifficulty)
							}
							disabled={loading}
							className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
						>
							{Object.entries(difficultyLabels).map(([value, label]) => (
								<option
									key={value}
									value={value}
								>
									{label}
								</option>
							))}
						</select>
					</div>

					{/* Списки */}
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Добавить в списки</label>

						<ListMultiSelect
							lists={availableLists}
							selectedIds={selectedListIds}
							onChange={setSelectedListIds}
							disabled={loading}
						/>

						{selectedListIds.length === 0 && (
							<p className='text-xs text-destructive'>
								Выберите хотя бы один список.
							</p>
						)}
					</div>

					{/* Ошибка */}
					{error && <p className='text-sm text-destructive'>{error}</p>}

					{/* Кнопка */}
					<Button
						type='button'
						onClick={handleSubmit}
						disabled={loading}
						className='w-full'
					>
						{loading ? 'Добавление...' : 'Добавить'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
