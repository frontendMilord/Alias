'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { cancelGame } from '@/app/(app)/game/actions'

export function CloseGameButton({ gameId }: { gameId: string }) {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [isClosing, setIsClosing] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const closeGame = async () => {
		setIsClosing(true)
		setError(null)
		try {
			const result = await cancelGame(gameId)
			if (!result.success) {
				setError(result.error ?? 'Не удалось закрыть игру.')
				return
			}
			setOpen(false)
			router.push('/')
		} catch (cause) {
			console.error('Error closing game:', cause)
			setError('Не удалось закрыть игру. Попробуйте ещё раз.')
		} finally {
			setIsClosing(false)
		}
	}

	return (
		<>
			<Button aria-label='Закрыть игру' variant='ghost' size='icon' onClick={() => setOpen(true)}>
				<X />
			</Button>
			<AlertDialog open={open} onOpenChange={(nextOpen) => !isClosing && setOpen(nextOpen)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Закрыть игру?</AlertDialogTitle>
						<AlertDialogDescription>
							Игра будет отменена. Вернуться к ней после этого нельзя.
						</AlertDialogDescription>
					</AlertDialogHeader>
					{error && <p className='text-sm text-destructive'>{error}</p>}
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isClosing}>Продолжить игру</AlertDialogCancel>
						<AlertDialogAction
							disabled={isClosing}
							onClick={(event) => {
								event.preventDefault()
								void closeGame()
							}}
						>
							{isClosing ? 'Закрываем...' : 'Закрыть игру'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
