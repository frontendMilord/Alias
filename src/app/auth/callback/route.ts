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
		.select('id, profile_setup_completed')
		.eq('id', user.id)
		.single()

	if (profileError || !profile) {
		return NextResponse.redirect(
			new URL('/login?error=profile', requestUrl.origin),
		)
	}

	if (!profile.profile_setup_completed) {
		return NextResponse.redirect(new URL('/setup', requestUrl.origin))
	}

	return NextResponse.redirect(new URL('/', requestUrl.origin))
}
