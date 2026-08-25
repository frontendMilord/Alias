import { cn } from '@/lib/utils'

interface AppContainerProps {
	children: React.ReactNode
	className?: string
}

export function AppContainer({ children, className }: AppContainerProps) {
	return (
		<main
			className={cn(
				'mx-auto min-h-screen w-full max-w-[640px] px-4',
				className,
			)}
		>
			{children}
		</main>
	)
}
