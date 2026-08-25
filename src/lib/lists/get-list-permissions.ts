import { createClient } from '../server'

export type ListPermissions = {
	can_view: boolean
	can_add_words: boolean
	can_edit_words: boolean
	can_delete_words: boolean
}

export async function getListPermissions(
	listId: string,
): Promise<ListPermissions | null> {
	const supabase = await createClient()

	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser()

	if (userError || !user) {
		return null
	}

	// Владелец списка имеет полный доступ
	const { data: list, error: listError } = await supabase
		.from('lists')
		.select('owner_id')
		.eq('id', listId)
		.maybeSingle()

	if (listError || !list) {
		return null
	}

	if (list.owner_id === user.id) {
		return {
			can_view: true,
			can_add_words: true,
			can_edit_words: true,
			can_delete_words: true,
		}
	}

	const { data: permissions, error: permissionsError } = await supabase
		.from('list_permissions')
		.select('can_view, can_add_words, can_edit_words, can_delete_words')
		.eq('list_id', listId)
		.eq('user_id', user.id)
		.maybeSingle()

	if (permissionsError) {
		console.error('Error loading list permissions:', permissionsError)
		return null
	}

	if (!permissions) {
		return null
	}

	return permissions
}
