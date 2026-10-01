'use client'

import { Button } from '@/components/ui/button'
import Image from 'next/image'
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
					<CardTitle className='flex justify-center'>
						<Image src='/logo-transparent.svg' alt='Alias' width={180} height={60} className='h-auto w-44' />
					</CardTitle>
					<p className='text-center text-sm text-muted-foreground'>
						Объясняй как хочешь, только не само слово
					</p>
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
