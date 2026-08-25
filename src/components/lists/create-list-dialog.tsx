'use client'

import { useState } from 'react'
import { createList } from '@/app/(app)/lists/actions'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export function CreateListDialog() {
	const [open, setOpen] = useState(false)
	const [name, setName] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const handleSubmit = async () => {
		const value = name.trim()

		if (!value) {
			setError('Введите название списка.')
			return
		}

		setError('')
		setLoading(true)

		const result = await createList(value)

		if (!result.success) {
			setError(result.error ?? 'Не удалось создать список.')
			setLoading(false)
			return
		}

		setName('')
		setLoading(false)
		setOpen(false)

		window.location.reload()
	}

	const handleOpenChange = (value: boolean) => {
		if (loading) {
			return
		}

		setOpen(value)

		if (!value) {
			setName('')
			setError('')
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={handleOpenChange}
		>
			<DialogTrigger
				className='inline-flex size-9 shrink-0 items-center justify-center rounded-md border bg-background text-lg transition-colors hover:bg-accent hover:text-accent-foreground'
				aria-label='Создать список'
			>
				+
			</DialogTrigger>

			<DialogContent className='w-[calc(100%-2rem)] rounded-xl sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Новый список</DialogTitle>
				</DialogHeader>

				<div className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='list-name'>Название</Label>

						<Input
							id='list-name'
							value={name}
							onChange={(event) => {
								setName(event.target.value)
								setError('')
							}}
							placeholder='Например, Мультфильмы'
							maxLength={100}
							disabled={loading}
							autoFocus
						/>
					</div>

					{error && <p className='text-sm text-destructive'>{error}</p>}

					<Button
						className='w-full'
						onClick={handleSubmit}
						disabled={loading || !name.trim()}
					>
						{loading ? 'Создание...' : 'Создать'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
