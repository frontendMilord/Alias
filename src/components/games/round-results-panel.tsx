'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Circle, CircleCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { editRoundWordResult } from '@/app/(app)/games/actions'
import { SharedWordPanel } from '@/components/games/shared-word-panel'
import { NextRoundButton } from '@/components/games/next-round-button'
import type { GameRoundWord, GameTeam } from '@/types/game'

interface RoundResultsPanelProps {
	gameId: string
	roundNumber: number
	words: GameRoundWord[]
	pointsEarned: number
	explainingTeam: GameTeam | undefined
	explainingPlayerName: string | undefined
	teams: GameTeam[]
	lastWordId: string | null
	lastWordTeamId: string | null
	canAdvance: boolean
}

export function RoundResultsPanel({
	gameId,
	roundNumber,
	words,
	pointsEarned,
	explainingTeam,
	explainingPlayerName,
	teams,
	lastWordId,
	lastWordTeamId,
	canAdvance,
}: RoundResultsPanelProps) {
	const router = useRouter()
	const [updatingWordId, setUpdatingWordId] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [pointsDelta, setPointsDelta] = useState<number | null>(null)
	const [previousPoints, setPreviousPoints] = useState(pointsEarned)
	if (pointsEarned !== previousPoints) {
		setPreviousPoints(pointsEarned)
		setPointsDelta(pointsEarned - previousPoints)
	}
	useEffect(() => {
		if (pointsDelta === null) return
		const timeout = window.setTimeout(() => setPointsDelta(null), 2500)
		return () => window.clearTimeout(timeout)
	}, [pointsDelta])
	const usedWords = words.filter(
		(word) => word.result !== null && word.id !== lastWordId,
	)
	const lastWord = words.find((word) => word.id === lastWordId)

	const changeResult = async (word: GameRoundWord) => {
		if (word.result !== 'guessed' && word.result !== 'skipped') return
		setUpdatingWordId(word.id)
		setError(null)
		try {
			const result = await editRoundWordResult(
				gameId,
				word.id,
				word.result === 'guessed' ? 'skipped' : 'guessed',
			)
			if (!result.success) {
				setError(result.error ?? 'Не удалось изменить результат слова.')
				return
			}
			router.refresh()
		} catch (cause) {
			console.error('Error changing round word result:', cause)
			setError('Не удалось изменить результат слова.')
		} finally {
			setUpdatingWordId(null)
		}
	}

	return (
		<div className='space-y-4'>
			<Card>
				<CardHeader>
					<CardTitle>Результаты раунда {roundNumber}</CardTitle>
				</CardHeader>
				<CardContent className='space-y-3'>
					<p>
						Объяснял {explainingPlayerName ?? '—'} из команды «
						{explainingTeam?.name ?? '—'}».
					</p>
					<div className='flex items-center gap-3'>
						<p
							key={pointsEarned}
							className='text-2xl font-bold animate-[score-pop_220ms_ease-out]'
						>
							{pointsEarned > 0 ? '+' : ''}{pointsEarned} очков
						</p>
						{pointsDelta !== null && pointsDelta !== 0 && (
							<span
								className='rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold animate-[score-chip_180ms_ease-out] text-primary tabular-nums'
							>
								{pointsDelta > 0 ? '+' : '−'}{Math.abs(pointsDelta)}
							</span>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Использованные слова</CardTitle>
				</CardHeader>
				<CardContent className='space-y-3'>
					{usedWords.length === 0 && (
						<p className='text-sm text-muted-foreground'>
							Нет угаданных или пропущенных слов.
						</p>
					)}
					{usedWords.map((word) => {
						const guessed = word.result === 'guessed'
						return (
							<div key={word.id} className='flex items-center justify-between gap-3 rounded-md border p-3'>
								<p className='min-w-0 truncate font-medium'>{word.wordText}</p>
								<Button
									variant='ghost'
									size='icon'
									disabled={updatingWordId !== null}
									onClick={() => void changeResult(word)}
									aria-label={guessed ? 'Отметить как пропуск' : 'Отметить как угаданное'}
									title={guessed ? 'Угадано: нажмите, чтобы отметить пропуск' : 'Пропуск: нажмите, чтобы отметить угаданным'}
								>
									{guessed ? (
										<CircleCheck className='size-6 fill-green-500 text-green-500' />
									) : (
										<Circle className='size-6 text-muted-foreground' />
									)}
								</Button>
							</div>
						)
					})}
					{error && <p className='text-sm text-destructive'>{error}</p>}
				</CardContent>
			</Card>

			{lastWord && (
				<SharedWordPanel
					gameId={gameId}
					word={lastWord.wordText}
					teams={teams.map(({ id, name }) => ({ id, name }))}
					currentTeamId={lastWordTeamId}
					allowClose
				/>
			)}

			{canAdvance && <NextRoundButton gameId={gameId} />}

			{pointsDelta !== null && pointsDelta !== 0 && (
				<div
					aria-hidden='true'
					className='pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center'
				>
					<div className='flex items-center gap-2 rounded-full border bg-background/95 px-4 py-2 shadow-lg backdrop-blur animate-[score-toast_2500ms_ease-out_forwards]'>
						<span key={pointsEarned} className='text-lg font-bold tabular-nums animate-[score-pop_220ms_ease-out]'>
							{pointsEarned > 0 ? '+' : ''}{pointsEarned} очков
						</span>
						<span
							className={
								pointsDelta > 0
									? 'rounded-full bg-green-500/15 px-2 py-0.5 text-sm font-semibold text-green-700 tabular-nums dark:text-green-400'
									: 'rounded-full bg-red-500/15 px-2 py-0.5 text-sm font-semibold text-red-700 tabular-nums dark:text-red-400'
							}
						>
							{pointsDelta > 0 ? '+' : '−'}{Math.abs(pointsDelta)}
						</span>
					</div>
				</div>
			)}
		</div>
	)
}
