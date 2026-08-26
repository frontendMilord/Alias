import { WordDifficulty } from '@/types/word'

export const difficultyLabels: Record<WordDifficulty, string> = {
	easy: 'Легкий',
	medium: 'Средний',
	hard: 'Сложный',
	insane: 'Нереальный',
}

export const gameSettingsLabels = {
	1: 'Новая игра',
	2: 'Настройки игры',
	3: 'Выбор списков',
	4: 'Подтверждение',
}

export const gameSettingsLabelsDescriptions = {
	1: 'Настройте команды и игроков',
	2: 'Настройте правила игры',
	3: 'Выберите списки слов, которые будут использоваться в игре',
	4: 'Просмотрите выбор и подтвердите игру',
}

export type ListType = 'mine' | 'public' | 'shared'

export const listTypeLabels: Record<ListType, string> = {
	mine: 'Мои',
	public: 'Общие',
	shared: 'Доступ',
}
