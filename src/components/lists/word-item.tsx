'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { removeWordFromList } from '@/app/(app)/lists/actions'
import { EditWordDialog } from './edit-word-dialog'
import { ListPermissions } from '@/lib/lists/get-list-permissions'

type Difficulty = 'easy' | 'medium' | 'hard' | 'insane'

interface WordItemProps {
	listId: string
	id: string
	text: string
	difficulty: Difficulty
	listWordId: string
	permissions: ListPermissions | null
}

const difficultyLabels: Record<Difficulty, string> = {
	easy: 'Легкий',
	medium: 'Средний',
	hard: 'Сложный',
	insane: 'Нереальный',
}

export function WordItem({
	listId,
	id,
	text,
	difficulty,
	listWordId,
	permissions,
}: WordItemProps) {
	const router = useRouter()

	const [editOpen, setEditOpen] = useState(false)
	const [deleteOpen, setDeleteOpen] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const safeText = text?.trim() || 'Слово недоступно'
	const safeDifficulty = difficultyLabels[difficulty] ?? 'Сложность не указана'
	const canEdit = permissions?.can_edit_words === true
	const canDelete = permissions?.can_delete_words === true

	const hasActions = canEdit || canDelete

	const handleDelete = async () => {
		if (!listWordId) {
			setError('Не удалось определить слово')
			return
		}
		setIsDeleting(true)
		setError(null)
		try {
			const result = await removeWordFromList(listId, listWordId)
			if (!result.success) {
				setError(result.error ?? 'Не удалось удалить слово')
				return
			}
			setDeleteOpen(false)
			router.refresh()
		} catch (error) {
			console.error('Error removing word:', error)
			setError('Произошла ошибка. Попробуйте ещё раз.')
		} finally {
			setIsDeleting(false)
		}
	}

	return (
		<>
			<div className='flex items-center gap-3 rounded-lg border p-3'>
				<div className='min-w-0 flex-1'>
					<p className='truncate font-medium'>{safeText}</p>

					<p className='mt-1 text-xs text-muted-foreground'>{safeDifficulty}</p>
				</div>

				{hasActions && (
					<DropdownMenu>
						<DropdownMenuTrigger
							className='inline-flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground'
							aria-label='Действия со словом'
						>
							<MoreVertical className='size-5' />
						</DropdownMenuTrigger>

						<DropdownMenuContent align='end'>
							{canEdit && (
								<DropdownMenuItem onClick={() => setEditOpen(true)}>
									<Pencil className='size-4' />
									Редактировать
								</DropdownMenuItem>
							)}
							{canDelete && (
								<DropdownMenuItem
									className='text-destructive'
									onClick={() => setDeleteOpen(true)}
								>
									<Trash2 className='size-4' />
									Удалить
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>

			<EditWordDialog
				listId={listId}
				wordId={id}
				initialText={safeText}
				initialDifficulty={difficulty ?? 'easy'}
				open={editOpen}
				onOpenChange={setEditOpen}
			/>

			<AlertDialog
				open={deleteOpen}
				onOpenChange={(open) => {
					if (!isDeleting) {
						setDeleteOpen(open)
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Удалить слово?</AlertDialogTitle>

						<AlertDialogDescription>
							Слово «{safeText}» будет удалено из этого списка. Само слово
							останется в базе данных.
						</AlertDialogDescription>
					</AlertDialogHeader>

					{error && <p className='text-sm text-destructive'>{error}</p>}

					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>

						<AlertDialogAction
							disabled={isDeleting}
							onClick={(event) => {
								event.preventDefault()
								void handleDelete()
							}}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							{isDeleting ? 'Удаление...' : 'Удалить'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
