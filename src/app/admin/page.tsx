import { requireAdmin } from '@/lib/auth/require-admin'

export default async function AdminPage() {
	const profile = await requireAdmin()

	return (
		<main className='p-6'>
			<h1 className='text-2xl font-bold'>Панель администратора</h1>

			<p className='mt-2 text-muted-foreground'>
				Вы вошли как {profile.nickname}
			</p>
		</main>
	)
}
