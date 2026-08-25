'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/client'

export default function SetupPage() {
	const router = useRouter()

	const [nickname, setNickname] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const handleSubmit = async () => {
		setError('')

		const value = nickname.trim()

		if (value.length < 2 || value.length > 30) {
			setError('Никнейм должен содержать от 2 до 30 символов.')
			return
		}

		setLoading(true)

		const supabase = createClient()

		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			router.push('/login')
			return
		}

		const { error } = await supabase
			.from('profiles')
			.update({
				nickname: value,
				profile_setup_completed: true,
			})
			.eq('id', user.id)

		if (error) {
			if (error.code === '23505') {
				setError('Этот никнейм уже занят.')
			} else {
				setError('Не удалось сохранить никнейм.')
			}

			setLoading(false)
			return
		}

		router.push('/')
	}

	return (
		<main className='flex min-h-screen items-center justify-center p-6'>
			<Card className='w-full max-w-md'>
				<CardHeader>
					<CardTitle>Придумайте никнейм</CardTitle>
				</CardHeader>

				<CardContent className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='nickname'>Никнейм</Label>

						<Input
							id='nickname'
							value={nickname}
							onChange={(event) => setNickname(event.target.value)}
							placeholder='Например, Артём'
							maxLength={30}
						/>
					</div>

					{error && <p className='text-sm text-destructive'>{error}</p>}

					<Button
						className='w-full'
						disabled={loading}
						onClick={handleSubmit}
					>
						{loading ? 'Сохранение...' : 'Продолжить'}
					</Button>
				</CardContent>
			</Card>
		</main>
	)
}
