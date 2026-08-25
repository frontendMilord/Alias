import { requireUser } from '@/lib/auth/require-user'

export default async function GamePage() {
	const profile = await requireUser()

	return (
		<main className='p-6'>
			<h1 className='text-2xl font-bold'>Игра</h1>

			<p className='mt-2 text-muted-foreground'>Игрок: {profile.nickname}</p>
		</main>
	)
}
