import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Вход' }

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return children
}
