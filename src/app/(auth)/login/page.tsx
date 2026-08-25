'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/client'

export default function LoginPage() {
	const handleGoogleLogin = async () => {
		const supabase = createClient()

		await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
			},
		})
	}

	return (
		<main className='flex min-h-screen items-center justify-center p-6'>
			<Card className='w-full max-w-md'>
				<CardHeader>
					<CardTitle className='text-center text-2xl'>Alias</CardTitle>
				</CardHeader>

				<CardContent>
					<Button
						className='w-full'
						onClick={handleGoogleLogin}
					>
						Войти через Google
					</Button>
				</CardContent>
			</Card>
		</main>
	)
}
