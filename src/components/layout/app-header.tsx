import Link from 'next/link'
import { Gamepad2, Home, List, UserRound } from 'lucide-react'

const links = [
	{ href: '/', label: 'Главная', icon: Home },
	{ href: '/lists', label: 'Списки', icon: List },
	{ href: '/profile', label: 'Профиль', icon: UserRound },
]

export function AppHeader() {
	return (
		<header className='sticky top-0 z-10 -mx-4 border-b bg-background/95 px-4 backdrop-blur'>
			<div className='flex h-14 items-center justify-between gap-4'>
				<Link href='/' className='flex items-center gap-2 font-semibold'>
					<Gamepad2 className='size-5 text-primary' />
					Alias
				</Link>
				<nav aria-label='Основная навигация' className='flex items-center gap-1'>
					{links.map(({ href, label, icon: Icon }) => (
						<Link key={href} href={href} className='flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground'>
							<Icon className='size-4' />
							<span className='hidden sm:inline'>{label}</span>
						</Link>
					))}
				</nav>
			</div>
		</header>
	)
}
