'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

import { updateList } from '@/app/(app)/lists/actions'

interface EditListDialogProps {
	listId: string
	initialName: string
	initialDescription: string | null
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function EditListDialog({
	listId,
	initialName,
	initialDescription,
	open,
	onOpenChange,
}: EditListDialogProps) {
	const router = useRouter()

	const [name, setName] = useState(initialName)
	const [description, setDescription] = useState(initialDescription ?? '')

	const [isSaving, setIsSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleOpenChange = (nextOpen: boolean) => {
		if (nextOpen) {
			setName(initialName)
			setDescription(initialDescription ?? '')
			setError(null)
		}

		onOpenChange(nextOpen)
	}

	const handleSave = async () => {
		const normalizedName = name.trim()

		if (!normalizedName) {
			setError('Введите название списка')
			return
		}

		setIsSaving(true)
		setError(null)

		try {
			const result = await updateList(listId, normalizedName, description)

			if (!result.success) {
				setError(result.error ?? 'Не удалось сохранить изменения')
				return
			}

			onOpenChange(false)
			router.refresh()
		} catch (error) {
			console.error('Error updating list:', error)

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
					<DialogTitle>Редактировать список</DialogTitle>
				</DialogHeader>

				<div className='space-y-4'>
					<div className='space-y-2'>
						<label
							htmlFor={`list-name-${listId}`}
							className='text-sm font-medium'
						>
							Название
						</label>

						<Input
							id={`list-name-${listId}`}
							value={name}
							onChange={(event) => setName(event.target.value)}
							disabled={isSaving}
							maxLength={100}
						/>
					</div>

					<div className='space-y-2'>
						<label
							htmlFor={`list-description-${listId}`}
							className='text-sm font-medium'
						>
							Описание
						</label>

						<Textarea
							id={`list-description-${listId}`}
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							disabled={isSaving}
							maxLength={500}
							placeholder='Необязательно'
						/>
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
