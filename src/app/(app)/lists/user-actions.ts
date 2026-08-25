'use server'

import { createClient } from '@/lib/server'

export interface UserSearchResult {
	id: string
	nickname: string
	avatar_url: string | null
}

export async function searchUsersByNickname(
	query: string,
): Promise<UserSearchResult[]> {
	const normalizedQuery = query.trim()

	if (!normalizedQuery) {
		return []
	}

	const supabase = await createClient()

	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser()

	if (userError || !user) {
		return []
	}

	const { data, error } = await supabase
		.from('profiles')
		.select('id, nickname, avatar_url')
		.ilike('nickname', `%${normalizedQuery}%`)
		.neq('id', user.id)
		.order('nickname', {
			ascending: true,
		})
		.limit(10)

	if (error) {
		console.error('Error searching users:', error)

		return []
	}

	if (!Array.isArray(data)) {
		return []
	}

	return data
		.filter(
			(profile) =>
				typeof profile?.id === 'string' &&
				typeof profile?.nickname === 'string',
		)
		.map((profile) => ({
			id: profile.id,
			nickname: profile.nickname,
			avatar_url:
				typeof profile.avatar_url === 'string' ? profile.avatar_url : null,
		}))
}

export async function createListPermission(
	listId: string,
	userId: string,
	permissions: {
		can_view: boolean
		can_add_words: boolean
		can_edit_words: boolean
		can_delete_words: boolean
	},
) {
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

	if (!listId || !userId) {
		return {
			success: false,
			error: 'Некорректные данные',
		}
	}

	if (!permissions.can_view) {
		return {
			success: false,
			error: 'Для выдачи остальных прав необходимо разрешить просмотр списка',
		}
	}

	const { error } = await supabase.from('list_permissions').insert({
		list_id: listId,
		user_id: userId,
		can_view: permissions.can_view,
		can_add_words: permissions.can_add_words,
		can_edit_words: permissions.can_edit_words,
		can_delete_words: permissions.can_delete_words,
	})

	if (error) {
		console.error('Error creating list permission:', error)

		if (error.code === '23505') {
			return {
				success: false,
				error: 'Этому пользователю уже выдан доступ к списку',
			}
		}

		return {
			success: false,
			error: 'Не удалось выдать доступ',
		}
	}

	return {
		success: true,
	}
}
