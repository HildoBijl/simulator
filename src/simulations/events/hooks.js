import { useMemo } from 'react'
import { collection } from 'firebase/firestore'
import { useCollectionOnce, useCollection } from 'react-firebase-hooks/firestore'

import { db, getDocuments } from '../../firebase'

// useSimulationEvents returns an object with all simulation events. It loads them from the database and includes their IDs in the objects.
export function useSimulationEvents(simulationId, once = false) {
	const useCollectionLoader = once ? useCollectionOnce : useCollection
	const [snapshot, loading] = useCollectionLoader(collection(db, `simulations/${simulationId}/events`))
	return useMemo(() => {
		if (loading)
			return undefined
		if (!snapshot)
			return null // Error
		return getDocuments(snapshot)
	}, [loading, snapshot])
}
