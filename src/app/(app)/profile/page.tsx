import { LogoutButton } from '@/components/auth/logout-button'
import { requireUser } from '@/lib/auth/require-user'
import { getGameHistory } from '@/lib/games/get-game-history'
import { GameHistory } from '@/components/profile/game-history'
import type { Metadata } from 'next'
import { CalendarDays, ShieldCheck, UserRound } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Профиль' }

export default async function ProfilePage() {
	const profile = await requireUser()
	const history = await getGameHistory(profile.id)

	return (
		<main className='space-y-6 px-4 py-6'>
			<h1 className='text-2xl font-semibold'>Профиль</h1>
			<Card>
				<CardContent className='flex items-center gap-4 pt-4'>
					<div className='flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-2xl font-semibold text-primary'>
						{profile.nickname.slice(0, 1).toUpperCase()}
					</div>
					<div className='min-w-0 flex-1'>
						<p className='truncate text-xl font-semibold'>{profile.nickname}</p>
						<p className='mt-1 flex items-center gap-1.5 text-sm text-muted-foreground'>
							{profile.role === 'admin' ? <ShieldCheck className='size-4' /> : <UserRound className='size-4' />}
							{profile.role === 'admin' ? 'Администратор' : 'Игрок'}
						</p>
					</div>
					<LogoutButton />
				</CardContent>
				<div className='mx-4 border-t' />
				<CardContent className='flex items-center gap-2 py-3 text-sm text-muted-foreground'>
					<CalendarDays className='size-4' />
					В игре с {new Date(profile.created_at).toLocaleDateString('ru-RU')}
				</CardContent>
			</Card>
			<div className='grid grid-cols-2 gap-3'>
				<Card><CardHeader className='pb-2'><CardTitle className='text-sm text-muted-foreground'>Всего игр</CardTitle></CardHeader><CardContent className='text-2xl font-semibold'>{history.length}</CardContent></Card>
				<Card><CardHeader className='pb-2'><CardTitle className='text-sm text-muted-foreground'>Завершено</CardTitle></CardHeader><CardContent className='text-2xl font-semibold'>{history.filter((game) => game.status === 'finished').length}</CardContent></Card>
			</div>
			<GameHistory history={history} />
		</main>
	)
}
