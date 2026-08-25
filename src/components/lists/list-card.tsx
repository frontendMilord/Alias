'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { MoreVertical, Pencil, Share2, Trash2 } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

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

import { deleteList } from '@/app/(app)/lists/actions'

import { EditListDialog } from './edit-list-dialog'
import { ListPreviewWord } from '@/types/list'
import { pluralizeWordsCount } from '@/lib/utils'
import { ShareListDialog } from './share-list-dialog'

interface ListCardProps {
	id: string
	title: string
	author: string
	wordsCount: number
	type: 'mine' | 'public' | 'shared'
	description?: string | null
	isSystem?: boolean
	previewWords?: ListPreviewWord[]
}

export function ListCard({
	id,
	title,
	author,
	wordsCount,
	type,
	description,
	isSystem = false,
	previewWords = [],
}: ListCardProps) {
	const router = useRouter()
	const [isShareOpen, setIsShareOpen] = useState(false)
	const [isEditOpen, setIsEditOpen] = useState(false)
	const [isDeleteOpen, setIsDeleteOpen] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleDelete = async () => {
		if (!id) {
			return
		}

		setIsDeleting(true)
		setError(null)

		try {
			const result = await deleteList(id)

			if (!result.success) {
				setError(result.error ?? 'Не удалось удалить список')

				return
			}

			setIsDeleteOpen(false)

			router.refresh()
		} catch (error) {
			console.error('Error deleting list:', error)

			setError('Произошла ошибка. Попробуйте ещё раз.')
		} finally {
			setIsDeleting(false)
		}
	}

	return (
		<>
			<Card
				className='cursor-pointer transition-colors hover:bg-accent/50'
				onClick={() => {
					if (!id) {
						return
					}

					router.push(`/lists/${id}`)
				}}
			>
				<CardContent className='flex items-center gap-3 p-4'>
					<div className='min-w-0 flex-1'>
						<h3 className='truncate font-medium'>{title || 'Без названия'}</h3>

						<p className='mt-1 text-sm text-muted-foreground'>
							{pluralizeWordsCount(wordsCount ?? 0)}
						</p>

						<p className='mt-1 text-xs text-muted-foreground'>
							{type === 'mine'
								? 'Мой список'
								: type === 'public'
									? 'Общий список'
									: `Доступ предоставлен от: ${author || 'Неизвестен'}`}
						</p>

						{description && (
							<p className='mt-2 line-clamp-2 text-sm text-muted-foreground'>
								{description}
							</p>
						)}

						{previewWords.length > 0 && (
							<div className='mt-3 flex flex-wrap gap-1.5'>
								{previewWords.slice(0, 3).map((word) => (
									<span
										key={word.id}
										className='rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground'
									>
										{word.text}
									</span>
								))}
							</div>
						)}
					</div>

					{type === 'mine' && !isSystem && (
						<div
							onClick={(e) => {
								e.stopPropagation()
							}}
						>
							<DropdownMenu>
								<DropdownMenuTrigger
									className='inline-flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground'
									aria-label='Действия со списком'
								>
									<MoreVertical className='size-5' />
								</DropdownMenuTrigger>

								<DropdownMenuContent align='end'>
									<DropdownMenuItem onClick={() => setIsShareOpen(true)}>
										<Share2 className='size-4' />
										Доступ
									</DropdownMenuItem>

									<DropdownMenuItem onClick={() => setIsEditOpen(true)}>
										<Pencil className='size-4' />
										Редактировать
									</DropdownMenuItem>

									<DropdownMenuItem
										className='text-destructive'
										onClick={() => setIsDeleteOpen(true)}
									>
										<Trash2 className='size-4' />
										Удалить
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)}
				</CardContent>
			</Card>

			<ShareListDialog
				listId={id}
				listName={title}
				open={isShareOpen}
				onOpenChange={setIsShareOpen}
			/>

			<EditListDialog
				listId={id}
				initialName={title}
				initialDescription={description ?? null}
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
			/>

			<AlertDialog
				open={isDeleteOpen}
				onOpenChange={(open) => {
					if (!isDeleting) {
						setIsDeleteOpen(open)
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Удалить список?</AlertDialogTitle>

						<AlertDialogDescription>
							Список «{title || 'Без названия'}» будет удалён. Слова из этого
							списка не будут удалены из базы.
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
