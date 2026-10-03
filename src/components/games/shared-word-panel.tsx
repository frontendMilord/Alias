'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { assignSharedWordTeam } from '@/app/(app)/games/actions'
import { playGameSound } from '@/lib/sounds'

interface TeamOption {
	id: string
	name: string
}

interface SharedWordPanelProps {
	gameId: string
	word: string
	teams: TeamOption[]
	currentTeamId: string | null
	allowClose?: boolean
}

export function SharedWordPanel({
	gameId,
	word,
	teams,
	currentTeamId,
	allowClose = false,
}: SharedWordPanelProps) {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const currentTeam = teams.find((team) => team.id === currentTeamId)

	useEffect(() => {
		if (!allowClose) playGameSound('shared-word')
	}, [allowClose])

	const saveTeam = async (teamId: string) => {
		setIsSaving(true)
		setError(null)
		try {
			const result = await assignSharedWordTeam(gameId, teamId)
			if (!result.success) {
				setError(result.error ?? 'Не удалось сохранить команду.')
				return
			}
			setOpen(false)
			router.refresh()
		} catch (cause) {
			console.error('Error saving shared word team:', cause)
			setError('Не удалось сохранить команду. Попробуйте ещё раз.')
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<>
			<Card className='border-primary/40'>
				<CardHeader>
					<CardTitle>Общее слово</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<p className='py-5 text-center text-4xl font-bold animate-[shared-word-reveal_400ms_ease-out]'>{word}</p>
					<p className='text-center text-sm text-muted-foreground'>
						{allowClose
							? currentTeam
								? `Угадала команда «${currentTeam.name}».`
								: 'Выберите угадавшую команду.'
							: 'Время вышло. Все команды могут отгадать это слово.'}
					</p>
					<Button variant='outline' className='w-full' onClick={() => setOpen(true)}>
						{allowClose
							? 'Изменить угадавшую команду'
							: 'Выбрать угадавшую команду'}
					</Button>
				</CardContent>
			</Card>
			<AlertDialog
				open={open}
				onOpenChange={setOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Какая команда угадала слово?</AlertDialogTitle>
						<AlertDialogDescription>
							Выберите команду, которой начислить очко за последнее слово.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className='grid gap-2'>
						{teams.map((team) => (
							<Button
								key={team.id}
								variant='outline'
								disabled={isSaving}
								onClick={() => void saveTeam(team.id)}
							>
								{team.name}
							</Button>
						))}
					</div>
					{error && <p className='text-sm text-destructive'>{error}</p>}
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
