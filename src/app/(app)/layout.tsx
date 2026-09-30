import { AppContainer } from '@/components/layout/app-container'
import { AppHeader } from '@/components/layout/app-header'

export default function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<AppContainer>
			<AppHeader />
			{children}
		</AppContainer>
	)
}
