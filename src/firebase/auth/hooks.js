import { useContext } from 'react'

import { AuthContext } from './provider'

export function useAuthData() {
	return useContext(AuthContext)
}

export function useUser() {
	return useAuthData().user
}
