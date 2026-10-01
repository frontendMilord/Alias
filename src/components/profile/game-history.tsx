'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { GameHistoryItem } from '@/lib/games/get-game-history'

const pageSize = 5

export function GameHistory({ history }: { history: GameHistoryItem[] }) {
	const [filter, setFilter] = useState<'all' | 'finished' | 'cancelled'>('all')
	const [page, setPage] = useState(1)
	const filtered = useMemo(
		() =>
			filter === 'all'
				? history
				: history.filter((game) => game.status === filter),
		[filter, history],
	)
	const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
	const items = filtered.slice((page - 1) * pageSize, page * pageSize)

	const changeFilter = (value: typeof filter) => {
		setFilter(value)
		setPage(1)
	}

	return (
		<section className='mt-8 space-y-3'>
			<h2 className='text-xl font-semibold'>История игр</h2>
			<div className='flex flex-wrap gap-2'>
				{(['all', 'finished', 'cancelled'] as const).map((value) => (
					<Button
						key={value}
						size='sm'
						variant={filter === value ? 'default' : 'outline'}
						onClick={() => changeFilter(value)}
					>
						{value === 'all'
							? 'Все'
							: value === 'finished'
								? 'Завершённые'
								: 'Отменённые'}
					</Button>
				))}
			</div>
			{items.length === 0 ? (
				<p className='text-sm text-muted-foreground'>
					Игр с таким статусом пока нет.
				</p>
			) : (
				items.map((game) => (
					<Card key={game.id}>
						<CardHeader>
							<CardTitle className='flex items-center justify-between gap-3 text-base'>
								<span>
									{game.status === 'finished' ? 'Завершена' : 'Отменена'}
								</span>
								<span className='text-right text-sm font-normal text-muted-foreground'>
									{new Date(game.createdAt)
										.toLocaleString('ru-RU')
										.slice(0, 17)}
								</span>
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-3'>
							{game.teams.map((team) => (
								<div
									key={team.id}
									className='flex justify-between gap-3 text-sm'
								>
									<span>{team.name}</span>
									<span className='font-semibold tabular-nums'>
										{team.score}
									</span>
								</div>
							))}
							{game.status === 'finished' && (
								<Link
									href={`/games/${game.id}`}
									className='text-sm text-primary hover:underline'
								>
									Открыть итоги игры
								</Link>
							)}
						</CardContent>
					</Card>
				))
			)}
			{pageCount > 1 && (
				<div className='flex items-center gap-x-3 justify-center'>
					<Button
						size='sm'
						variant='outline'
						disabled={page === 1}
						onClick={() => setPage((value) => value - 1)}
					>
						<ChevronLeft />
					</Button>
					{Array.from({ length: pageCount }, (_, index) => index + 1).map(
						(pageNumber) => (
							<Button
								key={pageNumber}
								size='icon-sm'
								variant={page === pageNumber ? 'default' : 'outline'}
								onClick={() => setPage(pageNumber)}
							>
								{pageNumber}
							</Button>
						),
					)}
					<Button
						size='sm'
						variant='outline'
						disabled={page === pageCount}
						onClick={() => setPage((value) => value + 1)}
					>
						<ChevronRight />
					</Button>
				</div>
			)}
		</section>
	)
}
