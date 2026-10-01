import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
})

export const metadata: Metadata = {
	title: { default: 'Alias', template: '%s — Alias' },
	description: 'Alias game',
	icons: {
		icon: [
			{ url: '/favicon.svg', type: 'image/svg+xml' },
			{ url: '/favicon.ico', sizes: 'any' },
		],
		apple: '/apple-touch-icon.png',
	},
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
	return (
		<html
			lang='ru'
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
		>
			<body className='min-h-full flex flex-col'>{children}</body>
		</html>
	)
}
