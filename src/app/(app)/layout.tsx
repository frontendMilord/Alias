import { AppContainer } from '@/components/layout/app-container'

export default function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return <AppContainer>{children}</AppContainer>
}
