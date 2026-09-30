'use server'

import { createClient } from '@/lib/server'
import { WordDifficulty } from '@/types/word'
import type { CreateGameInput } from '@/types/game'

export async function createGame(input: CreateGameInput): Promise<{
	success: boolean
	gameId?: string
	error?: string
}> {
	const supabase = await createClient()
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser()
	if (userError || !user) {
		return {
			success: false,
			error: 'Пользователь не авторизован.',
		}
	}
	// Валидация
	if (!Number.isInteger(input.targetScore) || input.targetScore < 1) {
		return {
			success: false,
			error: 'Количество очков для победы должно быть не меньше 1.',
		}
	}
	if (
		!Number.isInteger(input.roundDurationSeconds) ||
		input.roundDurationSeconds < 10 ||
		input.roundDurationSeconds > 600
	) {
		return {
			success: false,
			error: 'Время раунда должно быть от 10 до 600 секунд.',
		}
	}
	if (!Array.isArray(input.teams) || input.teams.length < 2) {
		return {
			success: false,
			error: 'Нужно минимум 2 команды.',
		}
	}
	if (!Array.isArray(input.selectedLists) || input.selectedLists.length === 0) {
		return {
			success: false,
			error: 'Выберите хотя бы один список.',
		}
	}
	const selectedLists = [...new Set(input.selectedLists.filter(Boolean))]
	const allDifficulties: WordDifficulty[] = [
		'easy',
		'medium',
		'hard',
		'insane',
	]
	const requestedDifficulties = [
		...new Set(input.selectedDifficulties ?? []),
	]
	if (
		requestedDifficulties.some(
			(difficulty) => !allDifficulties.includes(difficulty),
		)
	) {
		return {
			success: false,
			error: 'Выбрана неизвестная сложность слов.',
		}
	}
	const selectedDifficulties = requestedDifficulties.length
		? requestedDifficulties
		: allDifficulties
	// Проверяем команды
	const normalizedTeams = input.teams.map((team) => ({
		id: team.id,
		name: team.name.trim(),
		players: team.players.map((player) => player.trim()),
	}))
	for (let index = 0; index < normalizedTeams.length; index++) {
		const team = normalizedTeams[index]
		if (!team.name) {
			return {
				success: false,
				error: `У команды ${index + 1} нет названия.`,
			}
		}
		if (team.players.length < 1) {
			return {
				success: false,
				error: `В команде «${team.name}» должен быть хотя бы 1 игрок.`,
			}
		}
		const players = new Set<string>()
		for (const player of team.players) {
			if (!player) {
				return {
					success: false,
					error: `В команде «${team.name}» есть пустой игрок.`,
				}
			}
			const normalizedPlayer = player.toLowerCase()
			if (players.has(normalizedPlayer)) {
				return {
					success: false,
					error: `Игрок «${player}» указан несколько раз в команде «${team.name}».`,
				}
			}
			players.add(normalizedPlayer)
		}
	}
	// Создаём игру
	const { data: game, error: gameError } = await supabase
		.from('games')
		.insert({
			owner_id: user.id,
			status: 'active',
			target_score: input.targetScore,
			round_duration_seconds: input.roundDurationSeconds,
			subtract_point_for_skip: input.subtractPointForSkip,
			selected_difficulties: selectedDifficulties,
			selected_lists: selectedLists,
			current_round_number: 1,
			current_team_id: null,
			current_explainer_player_id: null,
		})
		.select('id')
		.single()

	if (gameError || !game) {
		console.error('Error creating game:', gameError)
		return {
			success: false,
			error: 'Не удалось создать игру.',
		}
	}
	const gameId = game.id
	// Создаём команды
	const teamRows = normalizedTeams.map((team, index) => ({
		game_id: gameId,
		name: team.name,
		team_order: index,
		score: 0,
	}))
	const { data: createdTeams, error: teamsError } = await supabase
		.from('game_teams')
		.insert(teamRows)
		.select('id, team_order')
	if (teamsError || !createdTeams) {
		console.error('Error creating teams:', teamsError)
		await supabase.from('games').delete().eq('id', gameId)
		return {
			success: false,
			error: 'Не удалось создать команды.',
		}
	}
	// Создаём игроков
	const playerRows = normalizedTeams.flatMap((team, teamIndex) => {
		const createdTeam = createdTeams.find(
			(item) => item.team_order === teamIndex,
		)
		if (!createdTeam) {
			return []
		}
		return team.players.map((nickname, playerIndex) => ({
			team_id: createdTeam.id,
			nickname,
			player_order: playerIndex,
		}))
	})
	if (playerRows.length === 0) {
		await supabase.from('games').delete().eq('id', gameId)
		return {
			success: false,
			error: 'Не удалось создать игроков.',
		}
	}
	const { error: playersError } = await supabase
		.from('game_players')
		.insert(playerRows)
	if (playersError) {
		console.error('Error creating players:', playersError)
		await supabase.from('games').delete().eq('id', gameId)
		return {
			success: false,
			error: 'Не удалось создать игроков.',
		}
	}
	// Сохраняем сложности
	if (selectedDifficulties.length > 0) {
		const difficultyRows = selectedDifficulties.map((difficulty) => ({
			game_id: gameId,
			difficulty,
		}))
		const { error: difficultiesError } = await supabase
			.from('game_difficulties')
			.insert(difficultyRows)
		if (difficultiesError) {
			console.error('Error creating game difficulties:', difficultiesError)
			await supabase.from('games').delete().eq('id', gameId)
			return {
				success: false,
				error: 'Не удалось сохранить сложности игры.',
			}
		}
	}
	// Сохраняем списки
	const listRows = selectedLists.map((listId) => ({
		game_id: gameId,
		list_id: listId,
	}))
	const { error: listsError } = await supabase
		.from('game_lists')
		.insert(listRows)
	if (listsError) {
		console.error('Error creating game lists:', listsError)
		await supabase.from('games').delete().eq('id', gameId)
		return {
			success: false,
			error: 'Не удалось сохранить списки игры.',
		}
	}
	return {
		success: true,
		gameId,
	}
}
