'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
	expireCurrentRound,
	resolveCurrentRoundWord,
	setGameRoundPaused,
} from '@/app/(app)/games/actions'
import { useRouter } from 'next/navigation'

interface ActiveRoundCardProps {
	word: string
	startedAt: string
	durationSeconds: number
	pausedAt: string | null
	pausedSeconds: number
	gameId: string
	wordId: string
	guessedCount: number
	skippedCount: number
}

function formatTime(seconds: number) {
	const minutes = Math.floor(seconds / 60)
	const remainingSeconds = seconds % 60
	return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
		.toString()
		.padStart(2, '0')}`
}

export function ActiveRoundCard({
	word,
	startedAt,
	durationSeconds,
	pausedAt,
	pausedSeconds,
	gameId,
	wordId,
	guessedCount,
	skippedCount,
}: ActiveRoundCardProps) {
	const router = useRouter()
	const [isPaused, setIsPaused] = useState(Boolean(pausedAt))
	const [isUpdatingPause, setIsUpdatingPause] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [isResolving, setIsResolving] = useState(false)
	const expiryRequested = useRef(false)
	const [remainingSeconds, setRemainingSeconds] = useState(() =>
		Math.max(
			0,
			Math.ceil(
				(new Date(startedAt).getTime() + (durationSeconds + pausedSeconds) * 1000 -
					new Date(pausedAt ?? Date.now()).getTime()) /
					1000,
			),
		),
	)

	useEffect(() => {
			const updateRemaining = () => {
				if (pausedAt) return
				setRemainingSeconds(
				Math.max(
					0,
					Math.ceil(
						(new Date(startedAt).getTime() + (durationSeconds + pausedSeconds) * 1000 - Date.now()) /
							1000,
					),
				),
			)
		}

		updateRemaining()
		const interval = pausedAt ? undefined : window.setInterval(updateRemaining, 1000)
		return () => {
			if (interval !== undefined) window.clearInterval(interval)
		}
	}, [durationSeconds, pausedAt, pausedSeconds, startedAt])

	const handleResolveWord = useCallback(async (result: 'guessed' | 'skipped') => {
		setIsResolving(true)
		setError(null)
		try {
			const response = await resolveCurrentRoundWord(gameId, result)
			if (!response.success) {
				setError(response.error ?? 'Не удалось сохранить результат слова.')
				return
			}
			router.refresh()
		} catch (cause) {
			console.error('Error resolving round word:', cause)
			setError('Не удалось сохранить результат слова.')
		} finally {
			setIsResolving(false)
		}
	}, [gameId, router])

	useEffect(() => {
		if (remainingSeconds !== 0 || expiryRequested.current) return
		expiryRequested.current = true
		void expireCurrentRound(gameId).then((result) => {
			if (result.success) {
				router.refresh()
			} else {
				setError(result.error ?? 'Не удалось завершить раунд.')
			}
		})
	}, [gameId, remainingSeconds, router])

	const handlePause = async () => {
		setIsUpdatingPause(true)
		setError(null)
		try {
			const result = await setGameRoundPaused(gameId, !isPaused)
			if (!result.success) {
				setError(result.error ?? 'Не удалось изменить таймер.')
				return
			}
			setIsPaused(!isPaused)
			router.refresh()
		} catch (cause) {
			console.error('Error changing timer pause state:', cause)
			setError('Не удалось изменить таймер. Попробуйте ещё раз.')
		} finally {
			setIsUpdatingPause(false)
		}
	}

	const touchStartY = useRef<number | null>(null)
	const handleTouchEnd = (event: React.TouchEvent) => {
		if (touchStartY.current === null || isResolving || isPaused) return
		const delta = event.changedTouches[0].clientY - touchStartY.current
		touchStartY.current = null
		if (Math.abs(delta) < 70) return
		void handleResolveWord(delta < 0 ? 'guessed' : 'skipped')
	}

	return (
		<Card className='border-primary/40'>
			<CardHeader className='flex flex-row items-center justify-between gap-4'>
				<CardTitle>Слово для объяснения</CardTitle>
				<output
					aria-label='Оставшееся время раунда'
					aria-live='off'
					className='font-mono text-xl font-semibold tabular-nums'
				>
					{formatTime(remainingSeconds)}
				</output>
			</CardHeader>
			<CardContent
				className='touch-none select-none'
				onTouchStart={(event) => {
					touchStartY.current = event.touches[0].clientY
				}}
				onTouchEnd={handleTouchEnd}
			>
				{isPaused ? (
					<div className='py-8 text-center'>
						<p className='text-xl font-semibold'>Раунд на паузе</p>
						<p className='mt-2 text-sm text-muted-foreground'>
							Продолжите раунд, чтобы показать слово.
						</p>
					</div>
				) : (
					<p className='py-8 text-center text-4xl font-bold'>{word}</p>
				)}
				{remainingSeconds > 0 && !isPaused && wordId && (
					<div className='grid grid-cols-2 gap-3'>
						<Button
							disabled={isResolving}
							onClick={() => void handleResolveWord('guessed')}
						>
							Угадано ↑
						</Button>
						<Button
							variant='outline'
							disabled={isResolving}
							onClick={() => void handleResolveWord('skipped')}
						>
							Пропуск ↓
						</Button>
					</div>
				)}
				{remainingSeconds > 0 && !wordId && (
					<p className='mb-4 text-center text-sm text-muted-foreground'>Все слова использованы. Таймер продолжает идти.</p>
				)}
				<div className='mt-4 grid grid-cols-2 gap-3 text-sm'>
					<div className='rounded-md bg-muted px-3 py-2'>
						<span className='text-muted-foreground'>Угадано</span>
						<span className='float-right font-semibold tabular-nums'>{guessedCount}</span>
					</div>
					<div className='rounded-md bg-muted px-3 py-2'>
						<span className='text-muted-foreground'>Пропущено</span>
						<span className='float-right font-semibold tabular-nums'>{skippedCount}</span>
					</div>
				</div>
				{remainingSeconds > 0 && (
					<Button
						variant='outline'
						className='w-full'
						disabled={isUpdatingPause}
						onClick={handlePause}
					>
						{isUpdatingPause
							? 'Обновляем таймер...'
							: isPaused
								? 'Продолжить'
								: 'Пауза'}
					</Button>
				)}
				{error && <p className='text-sm text-destructive'>{error}</p>}
				{remainingSeconds === 0 && (
					<p className='text-center text-sm text-muted-foreground'>Время раунда вышло</p>
				)}
			</CardContent>
		</Card>
	)
}
