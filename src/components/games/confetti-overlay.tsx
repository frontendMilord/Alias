'use client'

import { useMemo } from 'react'

const CONFETTI_COLORS = [
	'#f59e0b',
	'#ef4444',
	'#ec4899',
	'#8b5cf6',
	'#3b82f6',
	'#10b981',
	'#84cc16',
	'#f97316',
]

const CONFETTI_COUNT = 80

interface ConfettiPiece {
	id: number
	left: number
	delay: number
	duration: number
	color: string
	size: number
	shape: 'rect' | 'circle'
}

function createPieces(): ConfettiPiece[] {
	return Array.from({ length: CONFETTI_COUNT }, (_, index) => {
		const duration = 4 + Math.random() * 3.5
		return {
			id: index,
			left: Math.random() * 100,
			delay: Math.random() * 2,
			duration,
			color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
			size: 6 + Math.random() * 6,
			shape: Math.random() > 0.75 ? 'circle' : 'rect',
		}
	})
}

export function ConfettiOverlay() {
	const pieces = useMemo(() => createPieces(), [])

	return (
		<div
			aria-hidden='true'
			className='pointer-events-none fixed inset-0 z-40 overflow-hidden'
		>
			{pieces.map((piece) => (
				<span
					key={piece.id}
					className='absolute animate-[confetti-fall_linear_forwards] rounded-[1px]'
					style={{
						left: `${piece.left}%`,
						width: piece.shape === 'rect' ? `${piece.size}px` : `${piece.size / 2}px`,
						height: piece.shape === 'rect' ? `${piece.size / 1.8}px` : `${piece.size / 2}px`,
						backgroundColor: piece.color,
						borderRadius: piece.shape === 'circle' ? '9999px' : '1px',
						animationDelay: `${piece.delay}s`,
						animationDuration: `${piece.duration}s`,
					}}
				/>
			))}
		</div>
	)
}
