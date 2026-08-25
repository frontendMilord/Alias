import { createClient } from '@/lib/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
	const requestUrl = new URL(request.url)

	const code = requestUrl.searchParams.get('code')

	if (!code) {
		return NextResponse.redirect(new URL('/login', requestUrl.origin))
	}

	const supabase = await createClient()

	const { error: exchangeError } =
		await supabase.auth.exchangeCodeForSession(code)

	if (exchangeError) {
		return NextResponse.redirect(
			new URL('/login?error=auth', requestUrl.origin),
		)
	}

	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser()

	if (userError || !user) {
		return NextResponse.redirect(
			new URL('/login?error=user', requestUrl.origin),
		)
	}

	const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select('id, created_at')
		.eq('id', user.id)
		.single()

	if (profileError || !profile) {
		return NextResponse.redirect(
			new URL('/login?error=profile', requestUrl.origin),
		)
	}

	/*
	 * Если профиль был создан одновременно с регистрацией
	 * пользователя, отправляем его на страницу настройки.
	 *
	 * user.created_at — время создания аккаунта Auth
	 * profile.created_at — время создания профиля
	 */

	const userCreatedAt = new Date(user.created_at).getTime()
	const profileCreatedAt = new Date(profile.created_at).getTime()

	const difference = Math.abs(userCreatedAt - profileCreatedAt)

	const isNewUser = difference < 10_000

	if (isNewUser) {
		return NextResponse.redirect(new URL('/setup', requestUrl.origin))
	}

	return NextResponse.redirect(new URL('/', requestUrl.origin))
}
