'use server'

import { createClient } from '@/lib/server'
import { WordDifficulty } from '@/types/word'
import type { CreateGameInput } from '@/types/game'
import { revalidatePath } from 'next/cache'

export async function startGameRound(gameId: string): Promise<{
	success: boolean
	roundId?: string
	error?: string
}> {
	if (!gameId) {
		return { success: false, error: 'Не указана игра.' }
	}

	const supabase = await createClient()
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser()

	if (userError || !user) {
		return { success: false, error: 'Пользователь не авторизован.' }
	}

	const { data: roundId, error } = await supabase.rpc('start_game_round', {
		p_game_id: gameId,
	})

	if (error || !roundId) {
		console.error('Error starting game round:', error)
		return {
			success: false,
			error: error?.message.includes('No eligible words found')
				? 'В выбранных списках нет слов выбранной сложности.'
				: 'Не удалось начать раунд. Обновите страницу и попробуйте ещё раз.',
		}
	}

	revalidatePath(`/games/${gameId}`)
	return { success: true, roundId }
}

export async function beginPreparedGameRound(gameId: string): Promise<{
	success: boolean
	error?: string
}> {
	return updateRoundState(gameId, 'start_prepared_game_round')
}

export async function setGameRoundPaused(
	gameId: string,
	paused: boolean,
): Promise<{ success: boolean; error?: string }> {
	const supabase = await createClient()
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser()

	if (userError || !user) {
		return { success: false, error: 'Пользователь не авторизован.' }
	}

	const { error } = await supabase.rpc('set_game_round_paused', {
		p_game_id: gameId,
		p_paused: paused,
	})

	if (error) {
		console.error('Error changing game round pause state:', error)
		return { success: false, error: 'Не удалось изменить состояние таймера.' }
	}

	revalidatePath(`/games/${gameId}`)
	return { success: true }
}

export async function resolveCurrentRoundWord(
	gameId: string,
	result: 'guessed' | 'skipped',
): Promise<{ success: boolean; error?: string }> {
	const supabase = await createClient()
	const { data: authData, error: authError } = await supabase.auth.getUser()
	if (authError || !authData.user) {
		return { success: false, error: 'Пользователь не авторизован.' }
	}

	const { error } = await supabase.rpc('resolve_current_game_round_word', {
		p_game_id: gameId,
		p_result: result,
	})
	if (error) {
		console.error('Error resolving current round word:', {
			code: error.code,
			message: error.message,
			details: error.details,
			hint: error.hint,
		})
		return { success: false, error: 'Не удалось сохранить результат слова.' }
	}

	revalidatePath(`/games/${gameId}`)
	return { success: true }
}

export async function expireCurrentRound(
	gameId: string,
): Promise<{ success: boolean; error?: string }> {
	const supabase = await createClient()
	const { data: authData, error: authError } = await supabase.auth.getUser()
	if (authError || !authData.user) {
		return { success: false, error: 'Пользователь не авторизован.' }
	}

	const { error } = await supabase.rpc('expire_current_game_round', {
		p_game_id: gameId,
	})
	if (error) {
		console.error('Error expiring game round:', error)
		return { success: false, error: 'Не удалось завершить время раунда.' }
	}

	revalidatePath(`/games/${gameId}`)
	return { success: true }
}

export async function assignSharedWordTeam(
	gameId: string,
	teamId: string,
): Promise<{ success: boolean; error?: string }> {
	const supabase = await createClient()
	const { data: authData, error: authError } = await supabase.auth.getUser()
	if (authError || !authData.user) {
		return { success: false, error: 'Пользователь не авторизован.' }
	}

	const { error } = await supabase.rpc('assign_shared_game_round_word', {
		p_game_id: gameId,
		p_team_id: teamId,
	})
	if (error) {
		console.error('Error assigning shared word:', error)
		return { success: false, error: 'Не удалось сохранить команду.' }
	}

	revalidatePath(`/games/${gameId}`)
	return { success: true }
}

export async function editRoundWordResult(
	gameId: string,
	wordId: string,
	result: 'guessed' | 'skipped',
): Promise<{ success: boolean; error?: string }> {
	const supabase = await createClient()
	const { data: authData, error: authError } = await supabase.auth.getUser()
	if (authError || !authData.user) {
		return { success: false, error: 'Пользователь не авторизован.' }
	}

	const { error } = await supabase.rpc('edit_game_round_word_result', {
		p_game_id: gameId,
		p_word_id: wordId,
		p_result: result,
	})
	if (error) {
		console.error('Error editing round word result:', error)
		return { success: false, error: 'Не удалось изменить результат слова.' }
	}

	revalidatePath(`/games/${gameId}`)
	return { success: true }
}

export async function goToNextRound(
	gameId: string,
): Promise<{ success: boolean; hasNextRound?: boolean; error?: string }> {
	const supabase = await createClient()
	const { data: authData, error: authError } = await supabase.auth.getUser()
	if (authError || !authData.user) {
		return { success: false, error: 'Пользователь не авторизован.' }
	}

	const { data: hasNextRound, error } = await supabase.rpc('next_game_round', {
		p_game_id: gameId,
	})
	if (error) {
		console.error('Error advancing game round:', error)
		return { success: false, error: 'Не удалось перейти дальше.' }
	}

	revalidatePath(`/games/${gameId}`)
	return { success: true, hasNextRound }
}

async function updateRoundState(
	gameId: string,
	functionName: 'start_prepared_game_round',
): Promise<{ success: boolean; error?: string }> {
	if (!gameId) {
		return { success: false, error: 'Не указана игра.' }
	}

	const supabase = await createClient()
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser()

	if (userError || !user) {
		return { success: false, error: 'Пользователь не авторизован.' }
	}

	const { error } = await supabase.rpc(functionName, { p_game_id: gameId })
	if (error) {
		console.error('Error starting prepared game round:', error)
		return { success: false, error: 'Не удалось запустить раунд. Обновите страницу.' }
	}

	revalidatePath(`/games/${gameId}`)
	return { success: true }
}

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
	const activeGameError =
		'У вас уже есть активная игра. Вернитесь на главную, чтобы продолжить её или отменить перед созданием новой.'
	const { data: activeGame, error: activeGameLookupError } = await supabase
		.from('games')
		.select('id')
		.eq('owner_id', user.id)
		.eq('status', 'active')
		.maybeSingle()

	if (activeGameLookupError) {
		console.error('Error checking for an active game:', activeGameLookupError)
		return {
			success: false,
			error: 'Не удалось проверить активную игру.',
		}
	}

	if (activeGame) {
		return {
			success: false,
			error: activeGameError,
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
		if (
			gameError?.code === '23505' &&
			gameError.message.includes('games_one_active_per_owner')
		) {
			return {
				success: false,
				error: activeGameError,
			}
		}

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

export async function cancelGame(gameId: string) {
	if (!gameId) {
		return {
			success: false,
			error: 'Не указан ID игры',
		}
	}

	const supabase = await createClient()

	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser()

	if (userError || !user) {
		return {
			success: false,
			error: 'Пользователь не авторизован',
		}
	}

	const { data: game, error: gameError } = await supabase
		.from('games')
		.select('id, status, owner_id')
		.eq('id', gameId)
		.maybeSingle()

	if (gameError) {
		console.error('Error fetching game:', gameError)

		return {
			success: false,
			error: 'Не удалось найти игру',
		}
	}

	if (!game) {
		return {
			success: false,
			error: 'Игра не найдена',
		}
	}

	if (game.owner_id !== user.id) {
		return {
			success: false,
			error: 'У вас нет доступа к этой игре',
		}
	}

	if (game.status !== 'active') {
		return {
			success: false,
			error: 'Игра уже завершена',
		}
	}

	const { data: cancelledGame, error: updateError } = await supabase
		.from('games')
		.update({
			status: 'cancelled',
			finished_at: new Date().toISOString(),
		})
		.eq('id', gameId)
		.eq('owner_id', user.id)
		.eq('status', 'active')
		.select('id')
		.maybeSingle()

	if (updateError) {
		console.error('Error cancelling game:', updateError)

		return {
			success: false,
			error: 'Не удалось отменить игру',
		}
	}

	if (!cancelledGame) {
		return {
			success: false,
			error: 'Игра уже изменилась. Обновите страницу и попробуйте ещё раз.',
		}
	}

	return {
		success: true,
		error: null,
	}
}
