'use client'

import { Plus, Trash2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GameTeamDraft } from '@/types/game'

interface TeamEditorProps {
	team: GameTeamDraft
	teamIndex: number
	canDelete: boolean
	onChange: (team: GameTeamDraft) => void
	onDelete: () => void
}

export function TeamEditor({
	team,
	teamIndex,
	canDelete,
	onChange,
	onDelete,
}: TeamEditorProps) {
	const updateName = (name: string) => {
		onChange({
			...team,
			name,
		})
	}

	const updatePlayer = (index: number, value: string) => {
		const players = [...team.players]
		players[index] = value

		onChange({
			...team,
			players,
		})
	}

	const addPlayer = () => {
		onChange({
			...team,
			players: [...team.players, ''],
		})
	}

	const removePlayer = (index: number) => {
		if (team.players.length <= 1) {
			return
		}

		onChange({
			...team,
			players: team.players.filter((_, playerIndex) => playerIndex !== index),
		})
	}

	const normalizedPlayers = team.players.map((player) =>
		player.trim().toLowerCase(),
	)

	const isDuplicatePlayer = (index: number) => {
		const player = normalizedPlayers[index]

		if (!player) {
			return false
		}

		return normalizedPlayers.some(
			(value, playerIndex) => playerIndex !== index && value === player,
		)
	}

	return (
		<Card>
			<CardHeader className='flex flex-row items-center justify-between space-y-0'>
				<CardTitle className='text-lg'>Команда {teamIndex + 1}</CardTitle>

				{canDelete && (
					<Button
						type='button'
						variant='ghost'
						size='icon'
						onClick={onDelete}
						aria-label='Удалить команду'
					>
						<Trash2 className='size-4 text-destructive' />
					</Button>
				)}
			</CardHeader>

			<CardContent className='space-y-4'>
				<div className='space-y-2'>
					<label className='text-sm font-medium'>Название команды</label>

					<Input
						value={team.name}
						onChange={(event) => updateName(event.target.value)}
						placeholder={`Команда ${teamIndex + 1}`}
					/>
				</div>

				<div className='space-y-2'>
					<label className='text-sm font-medium'>Игроки</label>

					<div className='space-y-2'>
						{team.players.map((player, index) => {
							const duplicate = isDuplicatePlayer(index)

							return (
								<div key={index}>
									<div className='flex gap-2'>
										<Input
											value={player}
											onChange={(event) =>
												updatePlayer(index, event.target.value)
											}
											placeholder={`Игрок ${index + 1}`}
											aria-invalid={duplicate}
										/>

										{team.players.length > 1 && (
											<Button
												type='button'
												variant='ghost'
												size='icon'
												onClick={() => removePlayer(index)}
												aria-label='Удалить игрока'
											>
												<X className='size-4' />
											</Button>
										)}
									</div>

									{duplicate && (
										<p className='mt-1 text-sm text-destructive'>
											Такой игрок уже есть в этой команде
										</p>
									)}
								</div>
							)
						})}
					</div>

					<Button
						type='button'
						variant='outline'
						size='sm'
						onClick={addPlayer}
					>
						<Plus className='mr-2 size-4' />
						Добавить игрока
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
