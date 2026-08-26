export interface Profile {
	id: string
	nickname: string
	avatar_url: string | null
	role: 'user' | 'admin'
	created_at: string
	updated_at: string
}
