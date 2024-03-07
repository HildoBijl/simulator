import { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { AuthContext } from './provider'

// useAuthData gives all data related to the authentication and its loading.
export function useAuthData() {
	return useContext(AuthContext)
}

// useUser only gives the current user, if it exists.
export function useUser() {
	return useAuthData().user
}

// useSignedInCheck will check if the user is signed in. If not, it will be redirected to the given page.
export function useSignedInCheck(redirectPage = '/') {
	const navigate = useNavigate()
	const { user, loading } = useAuthData()

	// Do this through an effect to prevent router state changes upon a render.
	useEffect(() => {
		if (!loading && !user)
			navigate(redirectPage)
	}, [user, loading, navigate, redirectPage])
}
