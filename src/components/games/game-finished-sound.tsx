'use client'

import { useEffect } from 'react'
import { playGameSound } from '@/lib/sounds'

export function GameFinishedSound() {
	useEffect(() => {
		playGameSound('game-finished')
	}, [])

	return null
}
