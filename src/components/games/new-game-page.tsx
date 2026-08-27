'use client'

import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'

import { TeamEditor, type TeamDraft } from './team-editor'
import { ListWord, WordDifficulty } from '@/types/word'
import {
	difficultyLabels,
	gameSettingsLabels,
	gameSettingsLabelsDescriptions,
	ListType,
	listTypeLabels,
} from '@/lib/consts'
import { List } from '@/types/list'
import { Profile } from '@/types/profile'
import { getListType, pluralizeWordsCount } from '@/lib/utils'

function createTeam(index: number): TeamDraft {
	return {
		id: crypto.randomUUID(),
		name: `Команда ${index}`,
		players: [''],
	}
}

interface NewGamePageProps {
	lists: List[]
	profile: Profile
}

type GameStep = 1 | 2 | 3 | 4

export function NewGamePage({ lists, profile }: NewGamePageProps) {
	const [step, setStep] = useState<GameStep>(1)
	const [teams, setTeams] = useState<TeamDraft[]>([
		createTeam(1),
		createTeam(2),
	])
	const [targetScore, setTargetScore] = useState(10)
	const [roundDuration, setRoundDuration] = useState(60)
	const [isCustomDuration, setIsCustomDuration] = useState(false)
	const [customDuration, setCustomDuration] = useState('60')
	const [selectedDifficulties, setSelectedDifficulties] = useState<
		WordDifficulty[]
	>([])
	const [subtractPointForSkip, setSubtractPointForSkip] = useState(true)
	const [selectedLists, setSelectedLists] = useState<string[]>([])
	const [selectedTypes, setSelectedTypes] = useState<ListType[]>([])
	const filteredUniqueWords = useMemo(() => {
		const words = new Map<string, ListWord>()

		for (const list of lists) {
			if (!selectedLists.includes(list.id)) {
				continue
			}
			if (Array.isArray(list.words) && list.words.length === 0) {
				continue
			}
			for (const listWord of list.words) {
				if (
					selectedDifficulties.length > 0 &&
					listWord.word?.difficulty &&
					!selectedDifficulties.includes(listWord.word.difficulty)
				) {
					continue
				}
				words.set(listWord.id, listWord)
			}
		}
		return Array.from(words.values())
	}, [lists, selectedLists, selectedDifficulties])

	const filteredLists = useMemo(
		() =>
			lists.filter((list) => {
				const type = getListType(list, profile.id)
				const matchesType =
					selectedTypes.length === 0 || selectedTypes.includes(type)

				return matchesType
			}),
		[lists, selectedTypes, profile.id],
	)

	const selectedWordsCount = filteredUniqueWords.length
	const [error, setError] = useState<string | null>(null)

	const updateTeam = (updatedTeam: TeamDraft) => {
		setTeams((current) =>
			current.map((team) => (team.id === updatedTeam.id ? updatedTeam : team)),
		)

		setError(null)
	}

	const addTeam = () => {
		setTeams((current) => [...current, createTeam(current.length + 1)])
		setError(null)
	}

	const deleteTeam = (teamId: string) => {
		if (teams.length <= 2) {
			return
		}

		setTeams((current) => current.filter((team) => team.id !== teamId))
		setError(null)
	}

	const validateTeams = (teams: TeamDraft[]): string | null => {
		if (teams.length < 2) {
			return 'Нужно минимум 2 команды'
		}
		const allPlayers = new Map<
			string,
			{
				player: string
				teamName: string
			}
		>()
		for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
			const team = teams[teamIndex]
			const teamName = team.name.trim()
			if (!teamName) {
				return `У команды ${teamIndex + 1} нет названия`
			}
			if (team.players.length < 1) {
				return `В команде «${teamName}» должен быть хотя бы 1 игрок`
			}
			const playersInTeam = new Set<string>()
			for (const playerValue of team.players) {
				const player = playerValue.trim()
				if (!player) {
					return `В команде «${teamName}» есть пустой игрок`
				}
				const normalizedPlayer = player.toLowerCase()
				if (playersInTeam.has(normalizedPlayer)) {
					return `Игрок «${player}» указан несколько раз в команде «${teamName}»`
				}
				playersInTeam.add(normalizedPlayer)
				allPlayers.set(normalizedPlayer, {
					player,
					teamName,
				})
			}
		}

		return null
	}

	const handleContinue = () => {
		if (step === 1) {
			const validationError = validateTeams(teams)
			if (validationError) {
				setError(validationError)
				return
			}
			setError(null)
			setStep(2)
			return
		}

		if (step === 2) {
			const validationError = validateGameSettings()
			if (validationError) {
				setError(validationError)
				return
			}
			setError(null)
			setStep(3)
		}

		if (step === 3) {
			const validationError = validateLists()
			if (validationError) {
				setError(validationError)
				return
			}
			setError(null)
			setStep(4)
		}
	}

	const handleBack = () => {
		setStep((current) => {
			if (current === 1) {
				return 1
			}
			return (current - 1) as GameStep
		})
		setError(null)
	}

	const toggleDifficulty = (value: WordDifficulty) => {
		setSelectedDifficulties((current) => {
			if (current.includes(value)) {
				return current.filter((item) => item !== value)
			}

			return [...current, value]
		})
	}

	const handleCustomDurationChange = (value: string) => {
		setCustomDuration(value)
		const seconds = Number(value)
		if (Number.isInteger(seconds) && seconds >= 10 && seconds <= 600) {
			setRoundDuration(seconds)
		}
	}

	const toggleListType = (value: ListType) => {
		setSelectedTypes((current) => {
			if (current.includes(value)) {
				return current.filter((item) => item !== value)
			}

			return [...current, value]
		})
	}

	const validateGameSettings = (): string | null => {
		if (!Number.isInteger(targetScore) || targetScore < 1) {
			return 'Количество очков для победы должно быть не меньше 1'
		}
		if (isCustomDuration) {
			const seconds = Number(customDuration)
			if (!customDuration.trim()) {
				return 'Введите время раунда'
			}
			if (!Number.isInteger(seconds)) {
				return 'Время раунда должно быть целым числом'
			}
			if (seconds < 10 || seconds > 600) {
				return 'Время раунда должно быть от 10 до 600 секунд'
			}
		}
		if (
			!Number.isInteger(roundDuration) ||
			roundDuration < 10 ||
			roundDuration > 600
		) {
			return 'Время раунда должно быть от 10 до 600 секунд'
		}
		return null
	}

	const validateLists = (): string | null => {
		if (selectedLists.length === 0) {
			return 'Выберите хотя бы один список'
		}

		if (selectedWordsCount < 1) {
			return 'В выбранных списках недостаточно слов для игры. Нужно минимум 1 слово.'
		}

		return null
	}

	return (
		<main className='min-h-screen py-4'>
			<div className='mb-6'>
				<p className='text-sm text-muted-foreground'>Шаг {step} из 4</p>
				<h1 className='text-2xl font-semibold'>{gameSettingsLabels[step]}</h1>
				<p className='mt-1 text-sm text-muted-foreground'>
					{gameSettingsLabelsDescriptions[step]}
				</p>
			</div>
			{step === 1 && (
				<section className='space-y-4'>
					<div className='flex items-center justify-between'>
						<h2 className='text-lg font-medium'>Команды</h2>
						<span className='text-sm text-muted-foreground'>
							{teams.length}
						</span>
					</div>
					<div className='space-y-3'>
						{teams.map((team, index) => (
							<TeamEditor
								key={team.id}
								team={team}
								teamIndex={index}
								canDelete={teams.length > 2}
								onChange={updateTeam}
								onDelete={() => deleteTeam(team.id)}
							/>
						))}
					</div>

					<Button
						type='button'
						variant='outline'
						className='w-full'
						onClick={addTeam}
					>
						<Plus className='mr-2 size-4' />
						Добавить команду
					</Button>
				</section>
			)}
			{step === 2 && (
				<section className='space-y-4'>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Очки для победы</label>

						<input
							type='number'
							min={1}
							max={600}
							value={targetScore}
							onChange={(event) => {
								const value = Number(event.target.value)

								setTargetScore(Number.isFinite(value) ? value : 1)
							}}
							className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
						/>
					</div>

					<div className='space-y-2'>
						<label className='text-sm font-medium'>Время раунда</label>

						<div className='flex flex-wrap gap-2'>
							{[30, 60, 90, 120].map((seconds) => (
								<Button
									key={seconds}
									type='button'
									variant={
										!isCustomDuration && roundDuration === seconds
											? 'default'
											: 'outline'
									}
									onClick={() => {
										setIsCustomDuration(false)
										setRoundDuration(seconds)
										setCustomDuration(String(seconds))
									}}
								>
									{seconds} сек
								</Button>
							))}

							<Button
								type='button'
								variant={isCustomDuration ? 'default' : 'outline'}
								onClick={() => {
									setIsCustomDuration(true)
									setCustomDuration(String(roundDuration))
								}}
							>
								Своё
							</Button>
						</div>

						{isCustomDuration && (
							<div className='space-y-1.5'>
								<input
									type='number'
									min={10}
									max={600}
									value={customDuration}
									onChange={(event) =>
										handleCustomDurationChange(event.target.value)
									}
									className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
									placeholder='Например, 180'
								/>

								<p className='text-xs text-muted-foreground'>
									От 10 до 600 секунд
								</p>
							</div>
						)}
					</div>

					<div className='space-y-2'>
						<p className='text-sm font-medium'>Сложности</p>

						<div className='flex flex-wrap gap-2'>
							{(Object.keys(difficultyLabels) as WordDifficulty[]).map(
								(difficulty) => {
									const selected = selectedDifficulties.includes(difficulty)

									return (
										<button
											key={difficulty}
											type='button'
											onClick={() => toggleDifficulty(difficulty)}
											className={`rounded-full border px-3 py-1.5 text-sm transition ${
												selected
													? 'border-primary bg-primary text-primary-foreground'
													: 'border-border bg-muted text-muted-foreground'
											}`}
										>
											{difficultyLabels[difficulty]}
										</button>
									)
								},
							)}
						</div>

						<p className='text-xs text-muted-foreground'>
							{selectedDifficulties.length === 0
								? 'Будут использоваться все сложности'
								: `Выбрано: ${selectedDifficulties.length}`}
						</p>
					</div>

					<div className='flex items-center justify-between rounded-lg border p-3'>
						<div>
							<p className='text-sm font-medium'>Штраф за пропуск</p>

							<p className='text-xs text-muted-foreground'>
								За пропуск слова команда теряет 1 очко
							</p>
						</div>

						<button
							type='button'
							role='switch'
							aria-checked={subtractPointForSkip}
							onClick={() => setSubtractPointForSkip((current) => !current)}
							className={`relative h-6 w-11 rounded-full transition ${
								subtractPointForSkip ? 'bg-primary' : 'bg-muted'
							}`}
						>
							<span
								className={`absolute top-1 size-4 rounded-full bg-background transition ${
									subtractPointForSkip ? 'left-6' : 'left-1'
								}`}
							/>
						</button>
					</div>
				</section>
			)}
			{step === 3 && (
				<section className='space-y-4'>
					<div className='flex flex-wrap gap-2'>
						{(Object.keys(listTypeLabels) as ListType[]).map((value) => {
							const checked = selectedTypes.includes(value)
							return (
								<Button
									key={value}
									type='button'
									variant={checked ? 'default' : 'ghost'}
									onClick={() => toggleListType(value)}
								>
									{listTypeLabels[value]}
								</Button>
							)
						})}
					</div>
					{!!filteredUniqueWords.length && (
						<p className='text-sm text-muted-foreground'>
							Выбрано слов: {filteredUniqueWords.length}
						</p>
					)}
					<div className='space-y-2'>
						{filteredLists.map((list) => {
							const selected = selectedLists.includes(list.id)
							const filteredWords = list.words.filter((w) => {
								if (selectedDifficulties.length === 0) {
									return true
								}
								if (
									w.word &&
									selectedDifficulties.includes(w.word.difficulty)
								) {
									return true
								}
								return false
							})
							return (
								<button
									key={list.id}
									type='button'
									onClick={() => {
										setSelectedLists((current) =>
											current.includes(list.id)
												? current.filter((id) => id !== list.id)
												: [...current, list.id],
										)
										setError(null)
									}}
									className={`w-full rounded-lg border p-4 text-left transition ${
										selected
											? 'border-primary bg-primary/10'
											: 'border-border hover:bg-accent/50'
									}`}
								>
									<div className='flex items-center justify-between gap-3'>
										<div className='min-w-0'>
											<p className='font-medium'>{list.name}</p>
											<p className='mt-2 text-xs text-muted-foreground'>
												{pluralizeWordsCount(filteredWords.length)}
											</p>

											<p className='mt-1 text-xs text-muted-foreground'>
												{list.owner_id !== profile.id
													? `Доступ предоставлен от: ${list.owner_nickname || 'Неизвестен'}`
													: list.is_system
														? 'Общий список'
														: 'Ваш список'}
											</p>
											{list.description && (
												<p className='mt-2 line-clamp-2 text-sm text-muted-foreground'>
													{list.description}
												</p>
											)}
											{!!filteredWords.length && (
												<div className='mt-3 flex flex-wrap gap-1.5'>
													{filteredWords.slice(0, 3).map((word) => (
														<span
															key={word?.word?.id + word.id}
															className='rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground'
														>
															{word.word?.text}
														</span>
													))}
												</div>
											)}
										</div>

										<div
											className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-xs ${
												selected
													? 'border-primary bg-primary text-primary-foreground'
													: 'border-muted-foreground/40'
											}`}
										>
											{selected && '✓'}
										</div>
									</div>
								</button>
							)
						})}
					</div>

					{!lists?.length && (
						<div className='rounded-lg border p-6 text-center text-sm text-muted-foreground'>
							Нет доступных списков
						</div>
					)}
				</section>
			)}

			{step === 4 && (
				<section className='space-y-4'>
					<div className='rounded-lg border p-4'>
						<h2 className='text-lg font-medium'>Команды</h2>

						<div className='mt-3 space-y-3'>
							{teams.map((team) => (
								<div key={team.id}>
									<p className='font-medium'>{team.name}</p>
									<div className='mt-2 flex flex-wrap gap-1.5'>
										{team.players.map((player, index) => (
											<span
												key={`${team.id}-${index}`}
												className='rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground'
											>
												{player.trim()}
											</span>
										))}
									</div>
								</div>
							))}
						</div>
					</div>

					<div className='rounded-lg border p-4'>
						<h2 className='text-lg font-medium'>Настройки</h2>
						<div className='mt-3 space-y-2 text-sm'>
							<div className='flex justify-between gap-4'>
								<span className='text-muted-foreground'>Очки для победы</span>
								<span className='font-medium'>{targetScore}</span>
							</div>
							<div className='flex justify-between gap-4'>
								<span className='text-muted-foreground'>Время раунда</span>
								<span className='font-medium'>{roundDuration} сек</span>
							</div>
							<div className='flex justify-between gap-4'>
								<span className='text-muted-foreground'>Сложности</span>
								<span className='text-right font-medium'>
									{selectedDifficulties.length === 0
										? 'Все'
										: selectedDifficulties
												.map((difficulty) => difficultyLabels[difficulty])
												.join(', ')}
								</span>
							</div>

							<div className='flex justify-between gap-4'>
								<span className='text-muted-foreground'>Штраф за пропуск</span>
								<span className='font-medium'>
									{subtractPointForSkip ? 'Да' : 'Нет'}
								</span>
							</div>
						</div>
					</div>

					<div className='rounded-lg border p-4'>
						<h2 className='text-lg font-medium'>Слова</h2>
						<div className='mt-3 space-y-2 text-sm'>
							<div className='flex justify-between gap-4'>
								<span className='text-muted-foreground'>Выбраны списки</span>
								<div className='flex flex-wrap gap-1.5'>
									{lists
										.filter((list) => selectedLists.includes(list.id))
										.map((list) => (
											<span
												key={list.id}
												className='rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground'
											>
												{list.name}
											</span>
										))}
								</div>
							</div>
							<div className='flex justify-between gap-4'>
								<span className='text-muted-foreground'>Выбрано слов</span>
								<span className='font-bold'>{selectedWordsCount}</span>
							</div>
						</div>
					</div>
				</section>
			)}

			{error && (
				<div className='mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive'>
					{error}
				</div>
			)}

			<div className='mt-8 flex gap-2'>
				{step > 1 && (
					<Button
						type='button'
						variant='outline'
						className='flex-1'
						onClick={handleBack}
					>
						Назад
					</Button>
				)}

				{step < 4 && (
					<Button
						type='button'
						className='flex-1'
						onClick={handleContinue}
					>
						Продолжить
					</Button>
				)}
			</div>
		</main>
	)
}
