'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

import { updateWord } from '@/app/(app)/lists/actions'
import { WordDifficulty } from '@/types/word'
import { difficultyLabels } from '@/lib/consts'

interface EditWordDialogProps {
	wordId: string
	initialText: string
	initialDifficulty: WordDifficulty
	open: boolean
	onOpenChange: (open: boolean) => void
	listId: string
}

export function EditWordDialog({
	wordId,
	initialText,
	initialDifficulty,
	open,
	onOpenChange,
	listId,
}: EditWordDialogProps) {
	const router = useRouter()

	const [text, setText] = useState(initialText)
	const [difficulty, setDifficulty] =
		useState<WordDifficulty>(initialDifficulty)

	const [isSaving, setIsSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleOpenChange = (nextOpen: boolean) => {
		if (nextOpen) {
			setText(initialText)
			setDifficulty(initialDifficulty)
			setError(null)
		}

		onOpenChange(nextOpen)
	}

	const handleSave = async () => {
		const normalizedText = text.trim()

		if (!normalizedText) {
			setError('Введите слово')
			return
		}

		setIsSaving(true)
		setError(null)

		try {
			const result = await updateWord(
				listId,
				wordId,
				normalizedText,
				difficulty,
			)

			if (!result.success) {
				setError(result.error ?? 'Не удалось сохранить изменения')

				return
			}

			onOpenChange(false)

			router.refresh()
		} catch (error) {
			console.error('Error updating word:', error)

			setError('Произошла ошибка. Попробуйте ещё раз.')
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={handleOpenChange}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Редактировать слово</DialogTitle>
				</DialogHeader>

				<div className='space-y-4'>
					<div className='space-y-2'>
						<label
							htmlFor={`word-${wordId}`}
							className='text-sm font-medium'
						>
							Слово
						</label>

						<Input
							id={`word-${wordId}`}
							value={text}
							onChange={(event) => setText(event.target.value)}
							disabled={isSaving}
						/>
					</div>

					<div className='space-y-2'>
						<label className='text-sm font-medium'>Сложность</label>

						<Select
							value={difficulty}
							onValueChange={(value) => setDifficulty(value as WordDifficulty)}
							disabled={isSaving}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>

							<SelectContent>
								{(Object.keys(difficultyLabels) as WordDifficulty[]).map(
									(value) => (
										<SelectItem
											key={value}
											value={value}
										>
											{difficultyLabels[value]}
										</SelectItem>
									),
								)}
							</SelectContent>
						</Select>
					</div>

					{error && <p className='text-sm text-destructive'>{error}</p>}
				</div>

				<DialogFooter>
					<Button
						type='button'
						variant='outline'
						onClick={() => onOpenChange(false)}
						disabled={isSaving}
					>
						Отмена
					</Button>

					<Button
						type='button'
						onClick={handleSave}
						disabled={isSaving}
					>
						{isSaving ? 'Сохранение...' : 'Сохранить'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
