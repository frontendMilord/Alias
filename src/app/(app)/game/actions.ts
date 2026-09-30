'use server'
import { createClient } from '@/lib/server'

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
