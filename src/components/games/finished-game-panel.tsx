import Link from 'next/link'
import { Check, Clock3, Home, Plus, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { ConfettiOverlay } from '@/components/games/confetti-overlay'
import type { FinishedGameSummary, GameTeam } from '@/types/game'

interface FinishedGamePanelProps {
	teams: GameTeam[]
	summary: FinishedGameSummary | null
	targetScore: number
}

function formatDuration(totalSeconds: number) {
	const hours = Math.floor(totalSeconds / 3600)
	const minutes = Math.floor((totalSeconds % 3600) / 60)
	const seconds = totalSeconds % 60

	if (hours > 0) return `${hours} ч ${minutes} мин`
	if (minutes > 0) return `${minutes} мин ${seconds} сек`
	return `${seconds} сек`
}

export function FinishedGamePanel({
	teams,
	summary,
	targetScore,
}: FinishedGamePanelProps) {
	const winningScore = Math.max(...teams.map((team) => team.score), 0)
	const winners = teams.filter((team) => team.score === winningScore)
	const teamNames = new Map(teams.map((team) => [team.id, team.name]))

	return (
		<>
			<ConfettiOverlay />
			<div className='space-y-4'>
			<Card className='border-primary/40'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Trophy className='size-5 text-amber-400' />
						Игра завершена
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div>
						<p className='text-sm text-muted-foreground'>
							{winners.length > 1 ? 'Победили команды' : 'Победила команда'}
						</p>
						<p className='text-xl font-semibold'>
							{winners.map((team) => `«${team.name}»`).join(', ')}
						</p>
						<p className='text-sm text-muted-foreground'>
							{winningScore}{' '}
							{winningScore === 1
								? 'очко'
								: winningScore >= 2 && winningScore <= 4
									? 'очка'
									: 'очков'}
						</p>
					</div>
					<div className='grid grid-cols-2 gap-3 text-sm'>
						<div className='flex items-center gap-2'>
							<Clock3 className='size-4 text-muted-foreground' />
							<span>{formatDuration(summary?.durationSeconds ?? 0)}</span>
						</div>
						<div className='flex items-center gap-2'>
							<Check className='size-4 text-muted-foreground' />
							<span>{summary?.rounds.length ?? 0} раундов</span>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Итоговый счёт</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					{teams.map((team) => (
						<div
							key={team.id}
							className='space-y-2'
						>
							<div className='flex items-center justify-between gap-3'>
								<p className='font-medium'>{team.name}</p>
								<p className='font-semibold tabular-nums'>
									{team.score} / {targetScore}
								</p>
							</div>
							<div className='flex flex-wrap gap-1.5'>
								{team.players.map((player) => (
									<span
										key={player.id}
										className='rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground'
									>
										{player.nickname}
									</span>
								))}
							</div>
							<div className='flex gap-3 text-xs text-muted-foreground'>
								<span>
									Угадано: {summary?.teamStats[team.id]?.guessedCount ?? 0}
								</span>
								<span>
									Пропущено: {summary?.teamStats[team.id]?.skippedCount ?? 0}
								</span>
								<span>
									Лучший раунд:{' '}
									{summary?.teamStats[team.id]?.bestRoundScore ?? 0}
								</span>
							</div>
						</div>
					))}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Статистика игры</CardTitle>
				</CardHeader>
				<CardContent className='space-y-3 text-sm'>
					<div className='flex justify-between gap-4'>
						<span className='text-muted-foreground'>Угадано слов</span>
						<span className='font-medium'>{summary?.guessedCount ?? 0}</span>
					</div>
					<div className='flex justify-between gap-4'>
						<span className='text-muted-foreground'>Пропущено слов</span>
						<span className='font-medium'>{summary?.skippedCount ?? 0}</span>
					</div>
					<div className='flex justify-between gap-4'>
						<span className='text-muted-foreground'>Раундов сыграно</span>
						<span className='font-medium'>{summary?.rounds.length ?? 0}</span>
					</div>
					{summary?.rounds.map((round) => (
						<div
							key={round.roundNumber}
							className='flex items-center justify-between gap-4 border-t pt-3'
						>
							<span className='text-muted-foreground'>
								Раунд {round.roundNumber},{' '}
								{teamNames.get(round.teamId) ?? 'Команда'}
							</span>
							<span className='text-right font-medium tabular-nums'>
								{round.pointsEarned > 0 ? '+' : ''}
								{round.pointsEarned} очков
							</span>
						</div>
					))}
				</CardContent>
			</Card>

			<div className='grid gap-3 sm:grid-cols-2'>
				<Link
					href='/'
					className={buttonVariants({
						variant: 'outline',
						className: 'w-full',
					})}
				>
					<Home />
					На главную
				</Link>
				<Link
					href='/games/new'
					className={buttonVariants({ className: 'w-full' })}
				>
					<Plus />
					Создать новую игру
				</Link>
			</div>
		</div>
		</>
	)
}
