import { useContext, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import { db } from '../db'

import { AuthContext } from './provider'

// useAuthData gives all data related to the authentication and its loading.
export function useAuthData() {
	return useContext(AuthContext)
}

// useUser only gives the current user, if it exists.
export function useUser() {
	return useAuthData().user
}

// useUserId gives the ID of the user.
export function useUserId() {
	return useUser()?.uid
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

// useUserData gives the object with the user data of the user.
export function useUserData() {
	// Get the userId. Use a random string for request if no user is present so as not to confuse the hook call order.
	const userId = useUserId() || 'noUserPresentYet'

	// Load the data.
	const [data, loading, error] = useDocumentData(doc(db, 'userData', userId))

	// When no data is available yet, return undefined.
	if (loading || error)
		return undefined

	// Data has been loaded!
	return data || {}
}

// useSetUserData gives a setUserData function that allows you to update userData.
export function useSetUserData() {
	const userId = useUserId()
	const userData = useUserData()
	return useCallback((data) => {
		if (!userId)
			throw new Error(`Invalid setUserData call: no user is known at the moment. Check if the user is signed in before making a setUserData call.`)
		if (typeof data === 'function')
			data = data(userData) // Allow for function setters.
		if (data.constructor !== Object)
			throw new Error(`Invalid user data: a request was made to set user data, but this request must be provided with a basic object. Received something of type "${data}".`)
		return setDoc(doc(db, 'userData', userId), data, { merge: true })
	}, [userId, userData])
}

export function removeUserData(userId) {
	return deleteDoc(doc(db, 'userData', userId))
}
