import { useMemo } from 'react'
import { collection } from 'firebase/firestore'
import { useCollectionOnce, useCollection } from 'react-firebase-hooks/firestore'

import { db } from '../../firebase'

// useSimulationQuestions returns an array of all simulation questions. It loads them from the database and includes their IDs in the objects.
export function useSimulationQuestions(simulationId, once = false) {
	const useCollectionLoader = once ? useCollectionOnce : useCollection
	const [snapshot, loading] = useCollectionLoader(collection(db, `simulations/${simulationId}/questions`))
	return useMemo(() => {
		if (loading)
			return undefined
		if (snapshot)
			return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
		return null // Error
	}, [loading, snapshot])
}
