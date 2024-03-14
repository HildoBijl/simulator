import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import { db, useUserData } from '../firebase'

// useSimulationIds gets all the simulation IDs for a specific user.
export function useSimulationIds() {
	const userData = useUserData()
	if (!userData)
		return undefined
	return userData.simulations || []
}

// useSimulation gets a simulation with a specific ID.
export function useSimulation(id) {
	const [data] = useDocumentData(doc(db, 'simulations', id))
	return data
}
