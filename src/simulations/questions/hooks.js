import { useMemo } from 'react'
import { collection } from 'firebase/firestore'
import { useCollectionOnce, useCollection } from 'react-firebase-hooks/firestore'

import { db, getDocuments } from '../../firebase'

// useSimulationQuestions returns an array of all simulation questions. It loads them from the database and includes their IDs in the objects.
export function useSimulationQuestions(simulationId, questionOrder, once = false) {
	const useCollectionLoader = once ? useCollectionOnce : useCollection
	const [snapshot, loading] = useCollectionLoader(collection(db, `simulations/${simulationId}/questions`))
	return useMemo(() => {
		if (loading)
			return undefined
		if (!snapshot)
			return null // Error

		// Turn the snapshot into an object.
		const questionsObject = getDocuments(snapshot)
		return questionOrder ? questionOrder.map(id => questionsObject[id]) : Object.values(questionsObject)
	}, [loading, snapshot, questionOrder])
}
