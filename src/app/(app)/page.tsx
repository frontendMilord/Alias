import { requireUser } from '@/lib/auth/require-user'

export default async function HomePage() {
	const profile = await requireUser()

	return (
		<main className='p-6'>
			<h1 className='text-2xl font-bold'>
				Добро пожаловать, {profile.nickname}!
			</h1>
		</main>
	)
}
