import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Check, Clock3, Minus } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { difficultyLabels } from '@/lib/consts'
import { getGame } from '@/lib/games/game'
import { requireUser } from '@/lib/auth/require-user'
import type { GameStatus } from '@/types/game'

interface GamePageProps {
	params: Promise<{
		id: string
	}>
}

const statusLabels: Record<GameStatus, string> = {
	active: 'Игра идёт',
	finished: 'Завершена',
	cancelled: 'Отменена',
}

function pluralizePlayers(count: number) {
	const lastTwoDigits = count % 100
	const lastDigit = count % 10

	if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
		return `${count} игроков`
	}

	if (lastDigit === 1) {
		return `${count} игрок`
	}

	if (lastDigit >= 2 && lastDigit <= 4) {
		return `${count} игрока`
	}

	return `${count} игроков`
}

export default async function GamePage({ params }: GamePageProps) {
	await requireUser()
	const { id } = await params
	const game = await getGame(id)

	if (!game) {
		notFound()
	}

	const currentTeam = game.teams.find((team) => team.id === game.currentTeamId)
	const currentPlayer = currentTeam?.players.find(
		(player) => player.id === game.currentExplainerPlayerId,
	)
	const roundMinutes = Math.floor(game.roundDurationSeconds / 60)
	const roundSeconds = game.roundDurationSeconds % 60

	return (
		<main className='mx-auto flex min-h-screen w-full max-w-[640px] flex-col gap-6 px-4 py-6'>
			<Link
				href='/'
				className='inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground'
			>
				<ArrowLeft className='size-4' />
				К играм
			</Link>

			<header className='space-y-2'>
				<div className='flex flex-wrap items-center gap-3'>
					<h1 className='text-2xl font-semibold'>Игра</h1>
					<span className='rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground'>
						{statusLabels[game.status]}
					</span>
				</div>
				<p className='text-sm text-muted-foreground'>
					Создана {new Date(game.createdAt).toLocaleString('ru-RU', {
						dateStyle: 'long',
						timeStyle: 'short',
					})}
				</p>
			</header>

			<section className='grid grid-cols-2 gap-3'>
				<Card size='sm'>
					<CardContent className='flex items-center gap-3'>
						<div className='rounded-lg bg-muted p-2'>
							<Check className='size-4' />
						</div>
						<div>
							<p className='text-xs text-muted-foreground'>Цель</p>
							<p className='font-semibold'>{game.targetScore} очков</p>
						</div>
					</CardContent>
				</Card>

				<Card size='sm'>
					<CardContent className='flex items-center gap-3'>
						<div className='rounded-lg bg-muted p-2'>
							<Clock3 className='size-4' />
						</div>
						<div>
							<p className='text-xs text-muted-foreground'>Время раунда</p>
							<p className='font-semibold'>
								{roundMinutes > 0 ? `${roundMinutes} мин ` : ''}
								{roundSeconds > 0 ? `${roundSeconds} сек` : ''}
							</p>
						</div>
					</CardContent>
				</Card>
			</section>

			<Card>
				<CardHeader>
					<CardTitle>Команды</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					{game.teams.map((team) => {
						const progress = Math.min(
							100,
							(team.score / game.targetScore) * 100,
						)

						return (
							<div
								key={team.id}
								className='space-y-2 rounded-lg border p-3'
							>
								<div className='flex items-start justify-between gap-4'>
									<div className='min-w-0'>
										<h2 className='truncate font-medium'>{team.name}</h2>
										<p className='text-xs text-muted-foreground'>
											{pluralizePlayers(team.players.length)}
										</p>
									</div>
									<p className='shrink-0 text-lg font-semibold'>
										{team.score}
										<span className='text-sm font-normal text-muted-foreground'>
											/{game.targetScore}
										</span>
									</p>
								</div>
								<div
									role='progressbar'
									aria-label={`Счёт команды ${team.name}`}
									aria-valuemin={0}
									aria-valuemax={game.targetScore}
									aria-valuenow={team.score}
									className='h-1.5 overflow-hidden rounded-full bg-muted'
								>
									<div
										className='h-full rounded-full bg-primary transition-[width]'
										style={{ width: `${progress}%` }}
									/>
								</div>
								<ul className='flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground'>
									{team.players.map((player) => (
										<li key={player.id}>{player.nickname}</li>
									))}
								</ul>
							</div>
						)
					})}
				</CardContent>
			</Card>

			<section className='grid gap-3 sm:grid-cols-2'>
				<Card size='sm'>
					<CardHeader>
						<CardTitle>Правила</CardTitle>
					</CardHeader>
					<CardContent className='space-y-2 text-sm'>
						<p>Раунд {game.currentRoundNumber}</p>
						<p className='flex items-center gap-2 text-muted-foreground'>
							{game.subtractPointForSkip ? (
								<Minus className='size-4' />
							) : (
								<Check className='size-4' />
							)}
							{game.subtractPointForSkip
								? 'Штраф за пропуск'
								: 'Без штрафа за пропуск'}
						</p>
						{currentTeam && (
							<p className='text-muted-foreground'>
								Ход команды «{currentTeam.name}»
								{currentPlayer ? ` — объясняет ${currentPlayer.nickname}` : ''}
							</p>
						)}
					</CardContent>
				</Card>

				<Card size='sm'>
					<CardHeader>
						<CardTitle>Сложность слов</CardTitle>
					</CardHeader>
					<CardContent className='flex flex-wrap gap-2'>
						{game.selectedDifficulties.map((difficulty) => (
							<span
								key={difficulty}
								className='rounded-full bg-muted px-3 py-1 text-xs'
							>
								{difficultyLabels[difficulty]}
							</span>
						))}
					</CardContent>
				</Card>
			</section>

			<Card>
				<CardHeader>
					<CardTitle>Списки слов</CardTitle>
				</CardHeader>
				<CardContent>
					{game.selectedLists.length > 0 ? (
						<ul className='space-y-2'>
							{game.selectedLists.map((list) => (
								<li
									key={list.id}
									className='rounded-lg border px-3 py-2 text-sm'
								>
									{list.name}
								</li>
							))}
						</ul>
					) : (
						<p className='text-sm text-muted-foreground'>
							Не удалось загрузить названия выбранных списков.
						</p>
					)}
				</CardContent>
			</Card>
		</main>
	)
}
