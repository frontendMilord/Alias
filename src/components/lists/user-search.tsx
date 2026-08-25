'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'

import Image from 'next/image'
import {
	searchUsersByNickname,
	UserSearchResult,
} from '@/app/(app)/lists/user-actions'

interface UserSearchProps {
	onSelect: (user: UserSearchResult) => void
}

export function UserSearch({ onSelect }: UserSearchProps) {
	const [query, setQuery] = useState('')
	const [users, setUsers] = useState<UserSearchResult[]>([])
	const [isLoading, setIsLoading] = useState(false)

	useEffect(() => {
		const normalizedQuery = query.trim()

		if (!normalizedQuery) {
			return
		}

		let cancelled = false

		const timeout = setTimeout(async () => {
			setIsLoading(true)

			try {
				const result = await searchUsersByNickname(normalizedQuery)

				if (!cancelled) {
					setUsers(Array.isArray(result) ? result : [])
				}
			} catch (error) {
				console.error('Error searching users:', error)

				if (!cancelled) {
					setUsers([])
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false)
				}
			}
		}, 500)

		return () => {
			cancelled = true
			clearTimeout(timeout)
		}
	}, [query])

	const showResults = query.trim().length > 0 && (users.length > 0 || isLoading)

	return (
		<div className='space-y-2'>
			<div className='relative'>
				<Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />

				<Input
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder='Введите никнейм...'
					className='pl-9'
				/>
			</div>

			{isLoading && (
				<p className='px-1 text-sm text-muted-foreground'>Поиск...</p>
			)}

			{!isLoading && query.trim().length > 0 && users.length === 0 && (
				<p className='px-1 text-sm text-muted-foreground'>
					Пользователь не найден
				</p>
			)}

			{showResults && users.length > 0 && (
				<div className='flex flex-col gap-1'>
					{users.map((user) => (
						<button
							key={user.id}
							type='button'
							onClick={() => onSelect(user)}
							className='flex items-center gap-3 rounded-md p-2 text-left transition hover:bg-muted'
						>
							{user.avatar_url ? (
								<Image
									src={user.avatar_url}
									alt=''
									width={32}
									height={32}
									className='size-8 rounded-full object-cover'
								/>
							) : (
								<div className='flex size-8 items-center justify-center rounded-full bg-muted text-sm'>
									{user.nickname}
								</div>
							)}

							<span className='text-sm font-medium'>{user.nickname}</span>
						</button>
					))}
				</div>
			)}
		</div>
	)
}
