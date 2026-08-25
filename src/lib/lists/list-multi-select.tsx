'use client'

import { Checkbox } from '@/components/ui/checkbox'

interface AvailableList {
	id: string
	name: string
	owner_id: string
	is_system: boolean
}

interface ListMultiSelectProps {
	lists: AvailableList[]
	selectedIds: string[]
	onChange: (ids: string[]) => void
	disabled?: boolean
}

export function ListMultiSelect({
	lists,
	selectedIds,
	onChange,
	disabled = false,
}: ListMultiSelectProps) {
	const handleChange = (listId: string, checked: boolean) => {
		if (checked) {
			if (selectedIds.includes(listId)) {
				return
			}

			onChange([...selectedIds, listId])

			return
		}

		onChange(selectedIds.filter((id) => id !== listId))
	}

	if (lists.length === 0) {
		return (
			<p className='text-sm text-muted-foreground'>Нет доступных списков.</p>
		)
	}

	return (
		<div className='max-h-52 space-y-2 overflow-y-auto rounded-lg border p-3'>
			{lists.map((list) => (
				<label
					key={list.id}
					className='flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted'
				>
					<Checkbox
						checked={selectedIds.includes(list.id)}
						onCheckedChange={(checked) =>
							handleChange(list.id, checked === true)
						}
						disabled={disabled}
					/>

					<span className='text-sm'>{list.name}</span>

					{list.is_system && (
						<span className='ml-auto text-xs text-muted-foreground'>общий</span>
					)}
				</label>
			))}
		</div>
	)
}
