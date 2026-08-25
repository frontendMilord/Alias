import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const pluralizeWordsCount = (wordsCount: number): string => {
	// Получаем последние две цифры для проверки исключений (11-14)
	const lastTwoDigits = Math.abs(wordsCount) % 100
	// Получаем последнюю цифру
	const lastDigit = Math.abs(wordsCount) % 10

	let wordForm: string

	// Проверяем исключения: числа от 11 до 14 всегда "слов"
	if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
		wordForm = 'слов'
	} else {
		// В зависимости от последней цифры:
		// 1 → "слово", 2-4 → "слова", 0,5-9 → "слов"
		switch (lastDigit) {
			case 1:
				wordForm = 'слово'
				break
			case 2:
			case 3:
			case 4:
				wordForm = 'слова'
				break
			default:
				wordForm = 'слов'
				break
		}
	}

	return `${wordsCount} ${wordForm}`
}
