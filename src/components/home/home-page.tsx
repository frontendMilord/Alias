'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Plus } from 'lucide-react'
import Image from 'next/image'

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
import { cancelGame } from '@/app/(app)/games/actions'

interface ActiveGame {
	id: string
	current_round_number: number
}

interface HomePageProps {
	nickname: string
	activeGame: ActiveGame | null
}

export function HomePage({ nickname, activeGame }: HomePageProps) {
	const router = useRouter()

	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [isCancelling, setIsCancelling] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleNewGame = () => {
		if (activeGame) {
			setError(null)
			setIsDialogOpen(true)

			return
		}

		router.push('/games/new')
	}

	const handleConfirmNewGame = async () => {
		if (!activeGame) {
			router.push('/games/new')

			return
		}

		setIsCancelling(true)
		setError(null)

		try {
			const result = await cancelGame(activeGame.id)

			if (!result.success) {
				setError(result.error ?? 'Не удалось отменить игру')

				return
			}

			setIsDialogOpen(false)

			router.push('/games/new')
		} catch (error) {
			console.error('Error cancelling game:', error)

			setError('Произошла ошибка. Попробуйте ещё раз.')
		} finally {
			setIsCancelling(false)
		}
	}

	return (
		<>
			<main className='mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[640px] flex-col items-center justify-center px-4 py-6'>
				<div className='mb-8 flex flex-col items-center text-center'>
					<Image src='/logo-transparent.svg' alt='Alias' width={220} height={72} priority loading='eager' className='mb-8 w-52' style={{ height: 'auto' }} />
					<h1 className='text-2xl font-semibold'>Привет, {nickname}! 👋</h1>

					<p className='mt-2 text-sm text-muted-foreground'>Готовы сыграть?</p>
				</div>

				<div className='flex w-full max-w-sm flex-col gap-3'>
					{activeGame && (
						<Button
							size='lg'
							className='h-14 justify-start gap-3'
							onClick={() => router.push(`/games/${activeGame.id}`)}
						>
							<Play className='size-5' />

							<div className='flex flex-col items-start'>
								<span>Продолжить игру</span>

								<span className='text-xs font-normal opacity-70'>
									Раунд {activeGame.current_round_number}
								</span>
							</div>
						</Button>
					)}

					<Button
						size='lg'
						variant={activeGame ? 'outline' : 'default'}
						className='h-14 justify-start gap-3'
						onClick={handleNewGame}
					>
						<Plus className='size-5' />

						<div className='flex flex-col items-start'>
							<span>Новая игра</span>

							{activeGame && (
								<span className='text-xs font-normal text-muted-foreground'>
									Начать заново
								</span>
							)}
						</div>
					</Button>
				</div>
			</main>

			<AlertDialog
				open={isDialogOpen}
				onOpenChange={(open) => {
					if (!isCancelling) {
						setIsDialogOpen(open)
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>У вас есть незавершённая игра</AlertDialogTitle>

						<AlertDialogDescription>
							Если начать новую игру, текущая игра будет отменена. Вернуться к
							ней после этого будет нельзя.
						</AlertDialogDescription>
					</AlertDialogHeader>

					{error && <p className='text-sm text-destructive'>{error}</p>}

					<AlertDialogFooter>
						<AlertDialogCancel disabled={isCancelling}>
							Отмена
						</AlertDialogCancel>

						<AlertDialogAction
							disabled={isCancelling}
							onClick={(event) => {
								event.preventDefault()
								void handleConfirmNewGame()
							}}
						>
							{isCancelling ? 'Отмена игры...' : 'Начать новую'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
