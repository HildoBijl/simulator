import { useState, createContext, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'

import { auth } from './main'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null)
	const [loading, setLoading] = useState(true)

	// Track the auth state through the respective Firebase events.
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setUser(user || null)
			setLoading(false)
		})
		return () => unsubscribe()
	}, [])

	// Provide the data to child components through the respective hooks.
	return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}
