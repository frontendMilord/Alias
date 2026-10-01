'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Circle, CircleCheck, Pause, Play } from 'lucide-react'
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
	const [wordAnimation, setWordAnimation] = useState<
		'enter' | 'exit-guessed' | 'exit-skipped' | null
	>('enter')
	const [previousWord, setPreviousWord] = useState(word)
	if (word !== previousWord) {
		setPreviousWord(word)
		setWordAnimation('enter')
	}
	const expiryRequested = useRef(false)
	const pauseOnLeaveRequested = useRef(false)
	const [remainingSeconds, setRemainingSeconds] = useState(() =>
		Math.max(
			0,
			Math.ceil(
				(new Date(startedAt).getTime() +
					(durationSeconds + pausedSeconds) * 1000 -
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
						(new Date(startedAt).getTime() +
							(durationSeconds + pausedSeconds) * 1000 -
							Date.now()) /
							1000,
					),
				),
			)
		}

		updateRemaining()
		const interval = pausedAt
			? undefined
			: window.setInterval(updateRemaining, 250)
		return () => {
			if (interval !== undefined) window.clearInterval(interval)
		}
	}, [durationSeconds, pausedAt, pausedSeconds, startedAt])

	useEffect(() => {
		const pauseWhenLeaving = () => {
			if (isPaused || pauseOnLeaveRequested.current || remainingSeconds === 0) return
			pauseOnLeaveRequested.current = true
			void setGameRoundPaused(gameId, true).then((result) => {
				if (!result.success) pauseOnLeaveRequested.current = false
			})
		}
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'hidden') pauseWhenLeaving()
			if (document.visibilityState === 'visible') router.refresh()
		}

		document.addEventListener('visibilitychange', handleVisibilityChange)
		window.addEventListener('pagehide', pauseWhenLeaving)
		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange)
			window.removeEventListener('pagehide', pauseWhenLeaving)
		}
	}, [gameId, isPaused, remainingSeconds, router])

	const handleResolveWord = useCallback(
		async (result: 'guessed' | 'skipped') => {
			if (wordAnimation?.startsWith('exit')) return
			setError(null)
			setWordAnimation(result === 'guessed' ? 'exit-guessed' : 'exit-skipped')
			await new Promise((resolve) => setTimeout(resolve, 220))
			setIsResolving(true)
			try {
				const response = await resolveCurrentRoundWord(gameId, result)
				if (!response.success) {
					setWordAnimation('enter')
					setError(response.error ?? 'Не удалось сохранить результат слова.')
					return
				}
				router.refresh()
			} catch (cause) {
				console.error('Error resolving round word:', cause)
				setWordAnimation('enter')
				setError('Не удалось сохранить результат слова.')
			} finally {
				setIsResolving(false)
			}
		},
		[gameId, router, wordAnimation],
	)

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
		<Card className='flex min-h-[calc(100vh-12rem)] flex-1 flex-col border-primary/40'>
			<CardHeader className='flex flex-row items-center justify-between gap-4'>
				<CardTitle>Слово для объяснения</CardTitle>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					className='h-auto gap-1 px-2 font-mono text-xl font-semibold tabular-nums'
					disabled={isUpdatingPause || remainingSeconds === 0}
					onClick={handlePause}
					aria-label={isPaused ? 'Продолжить раунд' : 'Поставить раунд на паузу'}
					title={isPaused ? 'Продолжить раунд' : 'Поставить раунд на паузу'}
				>
					{isPaused ? <Play className='size-4' /> : <Pause className='size-4' />}
					<output
							aria-live='off'
							className={
								remainingSeconds > 10
									? undefined
									: remainingSeconds <= 5
										? 'animate-[timer-pulse_1s_ease-in-out_infinite] text-red-600 transition-colors duration-300 dark:text-red-400'
										: 'text-amber-600 transition-colors duration-300 dark:text-amber-400'
							}
						>
							{formatTime(remainingSeconds)}
						</output>
				</Button>
			</CardHeader>
			<CardContent
				className='flex flex-1 touch-none select-none flex-col gap-y-2'
				onTouchStart={(event) => {
					touchStartY.current = event.touches[0].clientY
				}}
				onTouchEnd={handleTouchEnd}
			>
				<div className='flex justify-center'>
					<div className='inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-400'>
						<CircleCheck className='size-5 fill-green-500 text-green-500' />
						<span>Угадано</span>
						<span className='px-2 py-0.5 text-xs font-semibold text-white tabular-nums'>
							{guessedCount}
						</span>
					</div>
				</div>
				{isPaused ? (
					<div
						className='flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl py-8 text-center hover:bg-muted/40'
						onClick={() => void handlePause()}
						role='button'
						tabIndex={0}
						onKeyDown={(event) => {
							if (event.key === 'Enter' || event.key === ' ') void handlePause()
						}}
					>
						<p className='text-xl font-semibold'>Раунд на паузе</p>
						<p className='mt-2 text-sm text-muted-foreground'>
							Продолжите раунд, чтобы показать слово.
						</p>
					</div>
				) : (
					<div className='flex flex-1 items-center justify-center py-8 text-center'>
						<p
							key={word}
							className={
								wordAnimation === 'exit-guessed'
									? 'max-w-full animate-[word-exit-up_220ms_ease-in-out_forwards] break-all text-center text-5xl font-bold text-green-600 transition-colors duration-150 sm:text-6xl dark:text-green-400'
									: wordAnimation === 'exit-skipped'
										? 'max-w-full animate-[word-exit-down_220ms_ease-in-out_forwards] break-all text-center text-5xl font-bold text-red-600 transition-colors duration-150 sm:text-6xl dark:text-red-400'
										: 'max-w-full animate-[word-enter_220ms_ease-out] break-all text-center text-5xl font-bold sm:text-6xl'
							}
						>
							{word}
						</p>
					</div>
				)}
				<div className='flex justify-center'>
					<div className='inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground'>
						<Circle className='size-5' />
						<span>Пропущено</span>
						<span className='rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground tabular-nums'>
							{skippedCount}
						</span>
					</div>
				</div>
				{remainingSeconds > 0 && !isPaused && wordId && (
					<div className='mt-6 grid grid-cols-2 gap-3'>
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
					<p className='mb-4 text-center text-sm text-muted-foreground'>
						Все слова использованы. Таймер продолжает идти.
					</p>
				)}
				{error && <p className='text-sm text-destructive'>{error}</p>}
				{remainingSeconds === 0 && (
					<p className='text-center text-sm text-muted-foreground'>
						Время раунда вышло
					</p>
				)}
			</CardContent>
		</Card>
	)
}
