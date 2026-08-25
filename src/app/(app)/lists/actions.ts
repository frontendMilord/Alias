'use server'

import { createClient } from '@/lib/server'
import { WordDifficulty } from '@/types/word'

interface CreateListResult {
	success: boolean
	error?: string
}

interface AddWordInput {
	text: string
	difficulty: WordDifficulty
	listIds: string[]
}

interface AddWordResult {
	success: boolean
	error?: string
}

export async function createList(name: string): Promise<CreateListResult> {
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

	const trimmedName = name.trim()

	if (!trimmedName) {
		return {
			success: false,
			error: 'Введите название списка.',
		}
	}

	if (trimmedName.length > 100) {
		return {
			success: false,
			error: 'Название списка не должно превышать 100 символов.',
		}
	}

	const { error } = await supabase.from('lists').insert({
		name: trimmedName,
		owner_id: user.id,
		is_system: false,
	})

	if (error) {
		console.error('Error creating list:', error)

		if (error.code === '23505') {
			return {
				success: false,
				error: 'Список с таким названием уже существует.',
			}
		}
		return {
			success: false,
			error: 'Не удалось создать список.',
		}
	}

	return {
		success: true,
	}
}

export async function addWords(input: {
	texts: string[]
	difficulty: WordDifficulty
	listIds: string[]
}): Promise<{
	success: boolean
	error?: string
}> {
	const supabase = await createClient()

	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser()

	if (userError) {
		console.error('Error getting authenticated user:', userError)

		return {
			success: false,
			error: 'Не удалось проверить авторизацию.',
		}
	}

	if (!user) {
		return {
			success: false,
			error: 'Пользователь не авторизован.',
		}
	}

	const texts = [
		...new Set((input.texts ?? []).map((text) => text.trim()).filter(Boolean)),
	]

	if (texts.length === 0) {
		return {
			success: false,
			error: 'Не указаны слова.',
		}
	}

	const listIds = [...new Set((input.listIds ?? []).filter(Boolean))]

	if (listIds.length === 0) {
		return {
			success: false,
			error: 'Не выбран ни один список.',
		}
	}

	for (const listId of listIds) {
		const { data: canAdd, error: permissionError } = await supabase.rpc(
			'can_add_list_words',
			{
				p_list_id: listId,
			},
		)

		if (permissionError) {
			console.error('Error checking list permissions:', permissionError)

			return {
				success: false,
				error: 'Не удалось проверить права доступа к списку.',
			}
		}

		if (!canAdd) {
			return {
				success: false,
				error: 'У вас нет права добавлять слова в один из выбранных списков.',
			}
		}
	}

	if (!input.difficulty) {
		return {
			success: false,
			error: 'Не выбрана сложность.',
		}
	}

	for (const text of texts) {
		const { data: existingWord, error: existingWordError } = await supabase
			.from('words')
			.select('id')
			.eq('owner_id', user.id)
			.eq('text', text)
			.maybeSingle()

		if (existingWordError) {
			console.error('Error checking existing word:', existingWordError)

			return {
				success: false,
				error: 'Не удалось проверить существующие слова.',
			}
		}

		let wordId: string

		if (existingWord) {
			wordId = existingWord.id
		} else {
			const { data: newWord, error: wordError } = await supabase
				.from('words')
				.insert({
					text,
					difficulty: input.difficulty,
					owner_id: user.id,
				})
				.select('id')
				.single()

			if (wordError || !newWord) {
				console.error('Error creating word:', wordError)

				return {
					success: false,
					error: `Не удалось создать слово "${text}".`,
				}
			}

			wordId = newWord.id
		}

		const { data: existingLinks, error: linksError } = await supabase
			.from('list_words')
			.select('list_id')
			.eq('word_id', wordId)
			.in('list_id', listIds)

		if (linksError) {
			console.error('Error checking word links:', linksError)

			return {
				success: false,
				error: 'Не удалось проверить наличие слов в списках.',
			}
		}

		const existingListIds = new Set(
			(existingLinks ?? []).map((item) => item.list_id),
		)

		const newListIds = listIds.filter((listId) => !existingListIds.has(listId))

		if (newListIds.length === 0) {
			continue
		}

		const rows = newListIds.map((listId) => ({
			list_id: listId,
			word_id: wordId,
			added_by: user.id,
		}))

		const { error: insertError } = await supabase
			.from('list_words')
			.insert(rows)

		if (insertError) {
			console.error('Error adding word to lists:', insertError)

			return {
				success: false,
				error: 'Не удалось добавить слова в списки.',
			}
		}
	}

	return {
		success: true,
	}
}

export async function removeWordFromList(listId: string, listWordId: string) {
	if (!listId) {
		return {
			success: false,
			error: 'Не указан ID списка',
		}
	}

	if (!listWordId) {
		return {
			success: false,
			error: 'Не указан ID слова в списке',
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

	const { data: canDelete, error: permissionError } = await supabase.rpc(
		'can_delete_list_words',
		{
			p_list_id: listId,
		},
	)

	if (permissionError) {
		console.error('Error checking delete permission:', permissionError)

		return {
			success: false,
			error: 'Не удалось проверить права доступа',
		}
	}

	if (!canDelete) {
		return {
			success: false,
			error: 'У вас нет права удалять слова из этого списка',
		}
	}

	const { error } = await supabase
		.from('list_words')
		.delete()
		.eq('id', listWordId)
		.eq('list_id', listId)

	if (error) {
		console.error('Error removing word from list:', error)

		return {
			success: false,
			error: error.message,
		}
	}

	return {
		success: true,
		error: null,
	}
}

export async function updateWord(
	listId: string,
	wordId: string,
	text: string,
	difficulty: 'easy' | 'medium' | 'hard' | 'insane',
) {
	if (!listId) {
		return {
			success: false,
			error: 'Не указан ID списка',
		}
	}

	if (!wordId) {
		return {
			success: false,
			error: 'Не указан ID слова',
		}
	}

	const normalizedText = text.trim()

	if (!normalizedText) {
		return {
			success: false,
			error: 'Введите слово',
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

	const { data: listWord, error: listWordError } = await supabase
		.from('list_words')
		.select('id')
		.eq('list_id', listId)
		.eq('word_id', wordId)
		.maybeSingle()

	if (listWordError) {
		console.error('Error checking list word:', listWordError)

		return {
			success: false,
			error: 'Не удалось проверить слово в списке',
		}
	}

	if (!listWord) {
		return {
			success: false,
			error: 'Слово не найдено в этом списке',
		}
	}

	const { data: updatedWord, error } = await supabase
		.from('words')
		.update({
			text: normalizedText,
			difficulty,
			updated_at: new Date().toISOString(),
		})
		.eq('id', wordId)
		.select('id')
		.maybeSingle()

	if (error) {
		console.error('Error updating word:', error)

		return {
			success: false,
			error: error.message,
		}
	}

	if (!updatedWord) {
		return {
			success: false,
			error: 'У вас нет права на редактирование',
		}
	}

	return {
		success: true,
		error: null,
	}
}

export async function updateList(
	listId: string,
	name: string,
	description: string | null,
) {
	if (!listId) {
		return {
			success: false,
			error: 'Не указан ID списка',
		}
	}

	const normalizedName = name.trim()

	if (!normalizedName) {
		return {
			success: false,
			error: 'Введите название списка',
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

	const { error } = await supabase
		.from('lists')
		.update({
			name: normalizedName,
			description: description?.trim() || null,
			updated_at: new Date().toISOString(),
		})
		.eq('id', listId)
		.eq('owner_id', user.id)
		.eq('is_system', false)

	if (error) {
		console.error('Error updating list:', error)

		return {
			success: false,
			error: error.message,
		}
	}

	return {
		success: true,
		error: null,
	}
}

export async function deleteList(listId: string) {
	if (!listId) {
		return {
			success: false,
			error: 'Не указан ID списка',
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

	const { error } = await supabase
		.from('lists')
		.delete()
		.eq('id', listId)
		.eq('owner_id', user.id)
		.eq('is_system', false)

	if (error) {
		console.error('Error deleting list:', error)

		return {
			success: false,
			error: error.message,
		}
	}

	return {
		success: true,
		error: null,
	}
}
