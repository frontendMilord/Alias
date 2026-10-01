import { LogoutButton } from '@/components/auth/logout-button'
import { requireUser } from '@/lib/auth/require-user'
import { getGameHistory } from '@/lib/games/get-game-history'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ProfilePage() {
	const profile = await requireUser()
	const history = await getGameHistory(profile.id)

	return (
		<main className='p-6'>
			<h1 className='text-2xl font-bold'>Профиль</h1>

			<div className='mt-4 space-y-2'>
				<p>Никнейм: {profile.nickname}</p>
				<p>Роль: {profile.role}</p>
			</div>

			<LogoutButton />

			<section className='mt-8 space-y-3'>
				<h2 className='text-xl font-semibold'>История игр</h2>
				{history.length === 0 ? (
					<p className='text-sm text-muted-foreground'>Завершённых игр пока нет.</p>
				) : (
					history.map((game) => (
						<Card key={game.id}>
							<CardHeader>
								<CardTitle className='flex items-center justify-between gap-3 text-base'>
									<span>{game.status === 'finished' ? 'Завершена' : 'Отменена'}</span>
									<span className='text-sm font-normal text-muted-foreground'>
										{new Date(game.createdAt).toLocaleDateString('ru-RU')}
									</span>
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-3'>
								{game.teams.map((team) => (
									<div key={team.id} className='flex justify-between gap-3 text-sm'>
										<span>{team.name}</span>
										<span className='font-semibold tabular-nums'>{team.score}</span>
									</div>
								))}
								{game.status === 'finished' && (
									<Link href={`/games/${game.id}`} className='text-sm text-primary hover:underline'>
										Открыть итоги игры
									</Link>
								)}
							</CardContent>
						</Card>
					))
				)}
			</section>
		</main>
	)
}
