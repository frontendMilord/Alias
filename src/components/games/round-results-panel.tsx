'use client'

import { useState } from 'react'
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
					<p className='text-2xl font-bold'>
						{pointsEarned > 0 ? '+' : ''}{pointsEarned} очков
					</p>
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
		</div>
	)
}
