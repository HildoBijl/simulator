import { useMemo } from 'react'

import { collection, doc } from 'firebase/firestore'
import { useDocumentData, useDocumentDataOnce, useCollection as useCollectionLive, useCollectionOnce } from 'react-firebase-hooks/firestore'

import { db } from './initialization'
import { getDocuments } from './functions'

export function useCollection(path, once = false, includeId) {
	// Get a snapshot of the collection.
	const useCollectionLoader = once ? useCollectionOnce : useCollectionLive
	const [snapshot, loading] = useCollectionLoader(collection(db, path))

	// Turn the snapshot into an object.
	return useMemo(() => {
		if (loading)
			return undefined
		if (!snapshot)
			return null // Error
		return getDocuments(snapshot, includeId)
	}, [includeId, snapshot, loading])
}

export function useDocument(path, id, once = false, includeId = true) {
	const useDocumentDataLoader = once ? useDocumentDataOnce : useDocumentData
	const [value, loading] = useDocumentDataLoader(doc(db, path, id))

	// Assemble the data, depending on the loading status.
	return useMemo(() => {
		if (loading)
			return undefined // Sign of loading.
		if (value)
			return includeId ? { id, ...value } : value
		return null // Sign of an error.
	}, [includeId, id, value, loading])
}
