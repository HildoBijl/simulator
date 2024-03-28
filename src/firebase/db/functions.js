import { collection, doc, updateDoc, deleteDoc } from 'firebase/firestore'

import { db } from './initialization'

// getDocumentRef returns a reference to a potentially new document.
export function getDocumentRef(path) {
	return doc(collection(db, path))
}

// updateDocument runs an update on a document with a given path and given ID.
export async function updateDocument(path, id, data) {
	return await updateDoc(doc(db, path, id), data)
}

// deleteDocument removes a document from the database.
export async function deleteDocument(path, id) {
	return await deleteDoc(doc(db, path, id))
}

// getDocuments takes a snapshot of a set of documents and turns it into a basic object with the documents. By default it also adds the document ID to the objects for easier reference, but this can be turned off.
export function getDocuments(snapshot, includeId = true) {
	const documents = {}
	snapshot.docs.forEach(doc => {
		documents[doc.id] = includeId ? { id: doc.id, ...doc.data() } : doc.data()
	})
	return documents
}
