'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { beginPreparedGameRound } from '@/app/(app)/games/actions'

export function BeginRoundButton({ gameId }: { gameId: string }) {
	const router = useRouter()
	const [isStarting, setIsStarting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleStart = async () => {
		setIsStarting(true)
		setError(null)
		try {
			const result = await beginPreparedGameRound(gameId)
			if (!result.success) {
				setError(result.error ?? 'Не удалось запустить раунд.')
				return
			}
			router.refresh()
		} catch (cause) {
			console.error('Error beginning game round:', cause)
			setError('Не удалось запустить раунд. Попробуйте ещё раз.')
		} finally {
			setIsStarting(false)
		}
	}

	return (
		<div className='space-y-2'>
			<Button className='w-full' disabled={isStarting} onClick={handleStart}>
				{isStarting ? 'Запускаем таймер...' : 'Начать'}
			</Button>
			{error && <p className='text-sm text-destructive'>{error}</p>}
		</div>
	)
}
