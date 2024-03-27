import { useMemo, useState, useEffect } from 'react'
import { doc } from 'firebase/firestore'
import { useDocumentData, useDocumentDataOnce } from 'react-firebase-hooks/firestore'

import { db, useUserData } from '../firebase'

import { getSimulationByUrl } from './functions'

// useSimulationIds gets all the simulation IDs for a specific user.
export function useSimulationIds() {
	const userData = useUserData()
	if (!userData)
		return undefined
	return userData.simulations || []
}

// useSimulation gets a simulation with a specific ID.
export function useSimulation(id, once = false) {
	const useCollectionDataLoader = once ? useDocumentDataOnce : useDocumentData
	const [data, loading] = useCollectionDataLoader(doc(db, 'simulations', id))
	return useMemo(() => {
		if (loading)
			return undefined // Sign of loading.
		if (data)
			return { id, ...data }
		return null // Sign of an error.
	}, [id, data, loading])
}

// useSimulationIdFromUrl takes a simulation URL and returns an ID from it.
export function useSimulationIdFromUrl(url) {
	const [id, setId] = useState(url ? undefined : null)

	// Get the simulation ID from the database based on the URL.
	useEffect(() => {
		let active = true // To prevent state changes after dismount.
		if (url) {
			getSimulationByUrl(url).then(simulation => {
				if (active)
					setId(simulation?.id || null)
			})
		}
		return () => { active = false }
	}, [url])

	return id
}
