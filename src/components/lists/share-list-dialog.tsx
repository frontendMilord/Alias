'use client'

import { useState } from 'react'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UserSearch } from './user-search'
import {
	createListPermission,
	UserSearchResult,
} from '@/app/(app)/lists/user-actions'
import Image from 'next/image'

interface ShareListDialogProps {
	listId: string
	listName: string
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function ShareListDialog({
	listId,
	listName,
	open,
	onOpenChange,
}: ShareListDialogProps) {
	const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
		null,
	)
	const [canView, setCanView] = useState(true)
	const [canAddWords, setCanAddWords] = useState(false)
	const [canEditWords, setCanEditWords] = useState(false)
	const [canDeleteWords, setCanDeleteWords] = useState(false)

	const [isSaving, setIsSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleOpenChange = (value: boolean) => {
		onOpenChange(value)

		if (!value) {
			setSelectedUser(null)
		}
	}

	const handleSelectUser = (user: UserSearchResult) => {
		setSelectedUser(user)
	}

	const handleCancel = () => {
		setSelectedUser(null)
		onOpenChange(false)
	}

	const handleShare = async () => {
		if (!selectedUser) {
			return
		}

		setIsSaving(true)
		setError(null)

		try {
			const result = await createListPermission(listId, selectedUser.id, {
				can_view: canView,
				can_add_words: canAddWords,
				can_edit_words: canEditWords,
				can_delete_words: canDeleteWords,
			})

			if (!result.success) {
				setError(result.error ?? 'Не удалось выдать доступ')
				return
			}

			onOpenChange(false)
			setSelectedUser(null)
		} catch (error) {
			console.error('Error sharing list:', error)

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
					<DialogTitle>Доступ к «{listName}»</DialogTitle>
				</DialogHeader>

				{selectedUser ? (
					<div className='space-y-5'>
						<div className='flex items-center justify-between gap-3 rounded-md p-2 text-left transition hover:bg-muted'>
							<p className='mt-1 text-xs text-muted-foreground'>
								Доступ будет выдан
							</p>
							<div className='flex items-center justify-between gap-3'>
								{selectedUser.avatar_url && (
									<Image
										src={selectedUser.avatar_url}
										alt=''
										width={32}
										height={32}
										className='size-8 rounded-full object-cover'
									/>
								)}
								<p className='text-sm font-medium'>{selectedUser.nickname}</p>
							</div>
						</div>

						<div className='space-y-3'>
							<p className='text-sm font-medium'>Права доступа</p>

							<label className='flex items-center justify-between gap-4'>
								<div>
									<p className='text-sm font-medium'>Просмотр</p>
									<p className='text-xs text-muted-foreground'>
										Пользователь может открывать список
									</p>
								</div>

								<input
									type='checkbox'
									checked={canView}
									onChange={(event) => {
										const value = event.target.checked

										setCanView(value)

										if (!value) {
											setCanAddWords(false)
											setCanEditWords(false)
											setCanDeleteWords(false)
										}
									}}
									disabled={isSaving}
								/>
							</label>

							<label className='flex items-center justify-between gap-4'>
								<div>
									<p className='text-sm font-medium'>Добавление слов</p>
									<p className='text-xs text-muted-foreground'>
										Может добавлять слова в список
									</p>
								</div>

								<input
									type='checkbox'
									checked={canAddWords}
									onChange={(event) => setCanAddWords(event.target.checked)}
									disabled={!canView || isSaving}
								/>
							</label>

							<label className='flex items-center justify-between gap-4'>
								<div>
									<p className='text-sm font-medium'>Редактирование слов</p>
									<p className='text-xs text-muted-foreground'>
										Может изменять слова списка
									</p>
								</div>

								<input
									type='checkbox'
									checked={canEditWords}
									onChange={(event) => setCanEditWords(event.target.checked)}
									disabled={!canView || isSaving}
								/>
							</label>

							<label className='flex items-center justify-between gap-4'>
								<div>
									<p className='text-sm font-medium'>Удаление слов</p>
									<p className='text-xs text-muted-foreground'>
										Может удалять слова из списка
									</p>
								</div>

								<input
									type='checkbox'
									checked={canDeleteWords}
									onChange={(event) => setCanDeleteWords(event.target.checked)}
									disabled={!canView || isSaving}
								/>
							</label>
						</div>

						{error && <p className='text-sm text-destructive'>{error}</p>}
					</div>
				) : (
					<UserSearch onSelect={handleSelectUser} />
				)}

				<DialogFooter>
					<Button
						type='button'
						variant='outline'
						onClick={handleCancel}
					>
						Отмена
					</Button>

					{selectedUser && (
						<Button
							type='button'
							onClick={handleShare}
							disabled={!canView || isSaving}
						>
							{isSaving ? 'Выдача доступа...' : 'Выдать доступ'}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
