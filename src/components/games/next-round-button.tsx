'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { goToNextRound } from '@/app/(app)/games/actions'

export function NextRoundButton({ gameId }: { gameId: string }) {
	const router = useRouter()
	const [isAdvancing, setIsAdvancing] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const advance = async () => {
		setIsAdvancing(true)
		setError(null)
		try {
			const result = await goToNextRound(gameId)
			if (!result.success) {
				setError(result.error ?? 'Не удалось перейти дальше.')
				return
			}
			router.refresh()
		} catch (cause) {
			console.error('Error advancing to next round:', cause)
			setError('Не удалось перейти дальше. Попробуйте ещё раз.')
		} finally {
			setIsAdvancing(false)
		}
	}

	return (
		<div className='space-y-2'>
			<Button className='w-full' disabled={isAdvancing} onClick={advance}>
				{isAdvancing ? 'Переходим...' : 'Дальше'}
			</Button>
			{error && <p className='text-sm text-destructive'>{error}</p>}
		</div>
	)
}
