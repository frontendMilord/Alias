import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { ActiveRoundCard } from '@/components/games/active-round-card'
import { BeginRoundButton } from '@/components/games/begin-round-button'
import { CloseGameButton } from '@/components/games/close-game-button'
import { FinishedGamePanel } from '@/components/games/finished-game-panel'
import { NextRoundButton } from '@/components/games/next-round-button'
import { RoundResultsPanel } from '@/components/games/round-results-panel'
import { SharedWordPanel } from '@/components/games/shared-word-panel'
import { StartRoundButton } from '@/components/games/start-round-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { difficultyLabels } from '@/lib/consts'
import { getGame } from '@/lib/games/game'
import { requireUser } from '@/lib/auth/require-user'
import type { GameStatus, GameTeam } from '@/types/game'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Игра' }

interface GamePageProps {
	params: Promise<{ id: string }>
}

const statusLabels: Record<GameStatus, string> = {
	active: 'Игра идёт',
	finished: 'Игра завершена',
	cancelled: 'Игра отменена',
}

function TeamsCard({
	teams,
	targetScore,
}: {
	teams: GameTeam[]
	targetScore: number
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Команды</CardTitle>
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
					</div>
				))}
			</CardContent>
		</Card>
	)
}

export default async function GamePage({ params }: GamePageProps) {
	await requireUser()
	const { id } = await params
	const game = await getGame(id)
	if (!game) notFound()

	const currentTeam = game.teams.find((team) => team.id === game.currentTeamId)
	const currentPlayer = currentTeam?.players.find(
		(player) => player.id === game.currentExplainerPlayerId,
	)
	const round = game.activeRound
	const minutes = Math.floor(game.roundDurationSeconds / 60)
	const seconds = game.roundDurationSeconds % 60
	const lastWord = round?.words.find((word) => word.id === round.lastWordId)
	const lastWordTeamId = lastWord?.guessedByTeamId ?? null
	const explainingPlayer = game.teams
		.flatMap((team) => team.players)
		.find((player) => player.id === round?.explainerPlayerId)

	return (
		<main className='mx-auto flex min-h-screen w-full max-w-[640px] flex-col gap-5 px-4 py-6'>
			<header className='flex items-start justify-between gap-4'>
				<div>
					<Link
						href='/'
						className='mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground'
					>
						<ArrowLeft className='size-4' /> К играм
					</Link>
					<h1 className='text-2xl font-semibold'>
						{game.status === 'finished'
							? 'Итоги игры'
							: `Игра · Раунд ${game.currentRoundNumber}`}
					</h1>
					<p className='mt-1 text-sm text-muted-foreground'>
						{statusLabels[game.status]}
					</p>
				</div>
				{game.status === 'active' ? (
					<CloseGameButton gameId={game.id} />
				) : (
					<Link
						href='/'
						aria-label='На главную'
						className='rounded-md p-2 text-muted-foreground hover:bg-muted'
					>
						×
					</Link>
				)}
			</header>

			{game.status === 'active' && !round && (
				<div key='screen-setup' className='flex flex-col gap-5 animate-[screen-enter_300ms_ease-out]'>
					<TeamsCard
						teams={game.teams}
						targetScore={game.targetScore}
					/>
					<Card>
						<CardHeader>
							<CardTitle>Настройки</CardTitle>
						</CardHeader>
						<CardContent className='space-y-3 text-sm'>
							<div className='flex justify-between gap-4'>
								<span className='text-muted-foreground'>Очки для победы</span>
								<span className='font-medium'>{game.targetScore}</span>
							</div>
							<div className='flex justify-between gap-4'>
								<span className='text-muted-foreground'>Время раунда</span>
								<span className='font-medium'>
									{minutes > 0 ? `${minutes} мин ` : ''}
									{seconds} сек
								</span>
							</div>
							<div className='flex justify-between gap-4'>
								<span className='text-muted-foreground'>Сложности</span>
								<span className='text-right font-medium'>
									{game.selectedDifficulties
										.map((difficulty) => difficultyLabels[difficulty])
										.join(', ')}
								</span>
							</div>
							<div className='flex items-center justify-between gap-4'>
								<span className='flex items-center gap-2 text-muted-foreground'>
									Штраф за пропуск
								</span>
								<span className='font-medium'>
									{game.subtractPointForSkip ? 'Да' : 'Нет'}
								</span>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Слова</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='flex flex-wrap gap-1.5'>
								{game.selectedLists.map((list) => (
									<span
										key={list.id}
										className='rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground'
									>
										{list.name}
									</span>
								))}
							</div>
							<div className='mt-4 flex justify-between gap-4 text-sm'>
								<span className='text-muted-foreground'>Выбрано слов</span>
								<span className='font-bold'>{game.selectedWordsCount}</span>
							</div>
						</CardContent>
					</Card>
					<StartRoundButton gameId={game.id} />
				</div>
			)}

			{game.status === 'active' && round?.status === 'preparation' && (
				<div key='screen-preparation' className='flex flex-col gap-5 animate-[screen-enter_300ms_ease-out]'>
					<TeamsCard
						teams={game.teams}
						targetScore={game.targetScore}
					/>
					<Card>
						<CardHeader>
							<CardTitle>Подготовка раунда {round.roundNumber}</CardTitle>
						</CardHeader>
						<CardContent className='space-y-3'>
							<p className='text-muted-foreground'>
								Таймер: {minutes > 0 ? `${minutes} мин ` : ''}
								{seconds} сек. Начнётся после нажатия кнопки.
							</p>
							<div className='rounded-xl border border-border bg-muted/40 px-4 py-5 text-center'>
								<p className='text-xs font-semibold uppercase tracking-wider text-primary'>Ход команды</p>
								<p className='mt-1 text-2xl font-bold'>«{currentTeam?.name ?? '—'}»</p>
								<p className='mt-2 text-base text-muted-foreground'>объясняет <span className='font-semibold text-foreground'>{currentPlayer?.nickname ?? '—'}</span></p>
							</div>
						</CardContent>
					</Card>
					<BeginRoundButton gameId={game.id} />
				</div>
			)}

			{game.status === 'active' &&
				round?.status === 'active' &&
				!round.endedAt && (
					<div key='screen-active' className='flex flex-col gap-5 animate-[screen-enter_300ms_ease-out]'>
						<p className='text-center text-lg font-medium'>
							Ход команды «{currentTeam?.name ?? '—'}», объясняет{' '}
							{currentPlayer?.nickname ?? '—'}.
						</p>
						{round.startedAt ? (
							<ActiveRoundCard
								word={round.currentWord ?? 'Все слова использованы'}
								wordId={round.currentWordId ?? ''}
								startedAt={round.startedAt}
								durationSeconds={game.roundDurationSeconds}
								pausedAt={round.pausedAt}
								pausedSeconds={round.pausedSeconds}
								gameId={game.id}
								guessedCount={round.words.filter((word) => word.result === 'guessed').length}
								skippedCount={round.words.filter((word) => word.result === 'skipped').length}
							/>
						) : (
							<p className='text-center text-muted-foreground'>
								Раунд ожидает запуска.
							</p>
						)}
					</div>
				)}

			{game.status === 'active' &&
				round?.status === 'active' &&
				round.endedAt &&
				round.currentWord && (
					<SharedWordPanel
						gameId={game.id}
						word={round.currentWord}
						teams={game.teams.map(({ id: teamId, name }) => ({
							id: teamId,
							name,
						}))}
						currentTeamId={null}
					/>
				)}

			{game.status === 'active' &&
				(round?.status === 'result' || round?.status === 'finished') && (
				<div key='screen-result' className='flex flex-col gap-5 animate-[screen-enter_300ms_ease-out]'>
					<TeamsCard
						teams={game.teams}
						targetScore={game.targetScore}
					/>
					<RoundResultsPanel
						gameId={game.id}
						roundNumber={round.roundNumber}
						words={round.words}
						pointsEarned={round.pointsEarned}
						explainingTeam={game.teams.find((team) => team.id === round.teamId)}
						explainingPlayerName={explainingPlayer?.nickname}
						teams={game.teams}
						lastWordId={round.lastWordId}
						lastWordTeamId={lastWordTeamId}
						canAdvance={game.status === 'active' && round.status === 'result'}
					/>
				</div>
			)}

			{game.status === 'finished' && (
				<FinishedGamePanel
					teams={game.teams}
					summary={game.finishedSummary}
					targetScore={game.targetScore}
				/>
			)}

			{game.status === 'cancelled' && <p>Эта игра отменена.</p>}
		</main>
	)
}
